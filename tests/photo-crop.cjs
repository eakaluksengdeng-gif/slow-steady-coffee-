const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require(process.env.COFFEE_PLAYWRIGHT||'playwright');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
const page=await browser.newPage({hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
if(!process.env.COFFEE_LIVE_ONLY){
 for(const file of ['neo.css','photo-crop.js','enhancements.js'])await page.route('**/'+file+'*',r=>r.fulfill({contentType:file.endsWith('.css')?'text/css':'application/javascript',body:fs.readFileSync('dist/'+file,'utf8')}));
 await page.route('https://coffee-gf3d.onrender.com/',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace('<script src="enhancements.js"></script>','<script src="photo-crop.js"></script><script src="enhancements.js"></script>')})});
}
let data;
for(const width of [320,390,1440]){
 await page.setViewportSize({width,height:844});await page.goto('https://coffee-gf3d.onrender.com/');await page.locator('#addRecipeTop').click();
 data=await page.evaluate(w=>{const c=document.createElement('canvas');c.width=w===1440?3600:2400;c.height=w===1440?1800:3600;const ctx=c.getContext('2d');ctx.fillStyle='#cba';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#654';ctx.fillRect(600,600,1200,2500);return c.toDataURL('image/png').split(',')[1]},width);
 const file={name:'large-portrait.png',mimeType:'image/png',buffer:Buffer.from(data,'base64')};
 await page.locator('#photoFile').setInputFiles(file);await page.locator('.photo-crop-dialog').waitFor();
 assert.ok(await page.locator('.photo-crop-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth+2));
 await page.locator('.crop-cancel').click();assert.equal(await page.locator('#photoPreview').isVisible(),false);
 await page.locator('#photoFile').setInputFiles(file);await page.locator('.photo-crop-dialog input').fill('2');await page.locator('.photo-crop-dialog input').dispatchEvent('input');
 await page.locator('.photo-crop-dialog canvas').focus();await page.keyboard.press('ArrowRight');
 const canvas=await page.locator('.photo-crop-dialog canvas').boundingBox();await page.mouse.move(canvas.x+canvas.width/2,canvas.y+canvas.height/2);await page.mouse.down();await page.mouse.move(canvas.x+canvas.width/2+20,canvas.y+canvas.height/2+15);await page.mouse.up();
 await page.locator('.crop-confirm').click();await page.locator('#photoPreview').waitFor();
 await page.locator('#photoPreview').evaluate(e=>e.decode());const info=await page.locator('#photoPreview').evaluate(e=>({w:e.naturalWidth,h:e.naturalHeight,source:e.src}));assert.equal(info.w,600);assert.equal(info.h,600);assert.ok(info.source.length<1000000);
 await page.locator('#photoCropAgain').click();await page.locator('.crop-cancel').click();assert.equal(await page.locator('#photoPreview').getAttribute('src'),info.source);
 if(width===390)await page.screenshot({path:'/Users/eakaluksengdeng/Downloads/coffee-photo-preview.png',animations:'disabled'});
 await page.locator('#photoRemove').click();assert.equal(await page.locator('#photoPreview').isVisible(),false);
 await page.locator('[data-close]').click();
 await page.evaluate(photo=>{recipes[0].photo=photo;render();showDetail(recipes[0].id)},info.source);
 assert.equal(await page.locator('.hero-photo').evaluate(e=>getComputedStyle(e).objectFit),'contain');
}
assert.deepEqual(errors,[]);console.log('PASS: large portrait crop, drag/zoom, cancel/re-crop/remove, 600px output, responsive previews; no recipes saved');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
