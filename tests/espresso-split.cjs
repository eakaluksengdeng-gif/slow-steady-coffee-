const assert=require('node:assert/strict'),fs=require('node:fs');const {chromium}=require(process.env.COFFEE_PLAYWRIGHT||'playwright');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
if(!process.env.COFFEE_LIVE_ONLY)for(const file of ['recipe-checklist.js','neo.css'])await page.route('**/'+file+'*',r=>r.fulfill({contentType:file.endsWith('.css')?'text/css':'application/javascript',body:fs.readFileSync('dist/'+file,'utf8')}));
for(const width of [320,390,768,1440]){
 await page.setViewportSize({width,height:844});await page.goto('https://coffee-gf3d.onrender.com/?v=profit-cards-1');
 await page.locator('.recipe-card').first().waitFor();
 await page.evaluate(()=>{const r=recipes[0];r.dose=18;r.yield=38;r.shotTime='35-40';r.price=75;r.cost=23.67;showDetail(r.id)});
 await page.locator('.espresso-pair').waitFor();assert.equal(await page.locator('.spec-grid>.spec').count(),5);
 assert.equal(await page.locator('.profit-spec strong').textContent(),'51.33 บาท');
 assert.ok((await page.locator('.spec-grid').boundingBox()).width<=1041,'spec section too wide');
 const boxes=await page.locator('.spec-grid>.spec').evaluateAll(es=>es.map(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})));
 for(const box of boxes){assert.ok(Math.abs(box.width-boxes[0].width)<=1,'cards not equal width');assert.ok(Math.abs(box.height-boxes[0].height)<=1,'cards not equal height');assert.ok(box.height<=100,'cards too tall')}
 assert.deepEqual(await page.locator('.espresso-pair strong').allTextContents(),['18 g','38 g']);
 assert.ok((await page.locator('.spec').nth(1).textContent()).includes('35-40'));
 for(const el of await page.locator('.espresso-split,.espresso-pair>div').all())assert.ok(await el.evaluate(e=>e.scrollWidth<=e.clientWidth+2),'overflow');
 if(width===390)await page.screenshot({path:'/Users/eakaluksengdeng/Downloads/coffee-espresso-split.png',animations:'disabled'});
}
await page.evaluate(()=>{const r=recipes[0];r.price=20;r.cost=25;showDetail(r.id)});assert.equal(await page.locator('.profit-spec strong').textContent(),'-5.00 บาท');assert.ok(await page.locator('.profit-spec').evaluate(e=>e.classList.contains('is-loss')));
assert.deepEqual(errors,[]);console.log('PASS: five equal-sized cards, correct gross profit/loss, original dose/yield and time, 320–1440px; no writes');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
