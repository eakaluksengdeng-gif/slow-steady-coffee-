const assert=require('node:assert/strict'),fs=require('node:fs');const {chromium}=require(process.env.COFFEE_PLAYWRIGHT||'playwright');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
if(!process.env.COFFEE_LIVE_ONLY)for(const file of ['recipe-checklist.js','neo.css'])await page.route('**/'+file+'*',r=>r.fulfill({contentType:file.endsWith('.css')?'text/css':'application/javascript',body:fs.readFileSync('dist/'+file,'utf8')}));
for(const width of [320,390,768,1440]){
 await page.setViewportSize({width,height:844});await page.goto('https://coffee-gf3d.onrender.com/?v=espresso-split-1');
 await page.locator('.recipe-card').first().waitFor();
 await page.evaluate(()=>{const r=recipes[0];r.dose=18;r.yield=38;r.shotTime='35-40';showDetail(r.id)});
 await page.locator('.espresso-pair').waitFor();assert.equal(await page.locator('.spec-grid>.spec').count(),4);
 assert.ok((await page.locator('.spec-grid').boundingBox()).width<=801,'spec section too wide');
 const first=await page.locator('.spec').nth(0).boundingBox(),time=await page.locator('.spec').nth(1).boundingBox();assert.ok(first.height<=120,'espresso too tall');assert.ok(time.height<=85,'time card too tall');
 assert.deepEqual(await page.locator('.espresso-pair strong').allTextContents(),['18 g','38 g']);
 assert.ok((await page.locator('.spec').nth(1).textContent()).includes('35-40'));
 for(const el of await page.locator('.espresso-split,.espresso-pair>div').all())assert.ok(await el.evaluate(e=>e.scrollWidth<=e.clientWidth+2),'overflow');
 if(width===390)await page.screenshot({path:'/Users/eakaluksengdeng/Downloads/coffee-espresso-split.png',animations:'disabled'});
}
assert.deepEqual(errors,[]);console.log('PASS: original card split in two, recipe dose/yield preserved, time card unchanged, 320–1440px; no writes');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
