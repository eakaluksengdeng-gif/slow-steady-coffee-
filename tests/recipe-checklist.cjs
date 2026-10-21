const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.COFFEE_PLAYWRIGHT||'playwright');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
if(!process.env.COFFEE_LIVE_ONLY){
  await page.route('**/neo.css*',r=>r.fulfill({contentType:'text/css',body:fs.readFileSync(path.join(__dirname,'../dist/neo.css'),'utf8')}));
  await page.route('**/recipe-checklist.js',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(__dirname,'../dist/recipe-checklist.js'),'utf8')}));
  await page.route('https://coffee-gf3d.onrender.com/',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace('</body>','<script src="recipe-checklist.js"></script></body>')})});
}
for(const width of [320,390,768,1440]){
 await page.setViewportSize({width,height:844});await page.goto('https://coffee-gf3d.onrender.com/');await page.locator('.recipe-card').filter({hasText:'Cappuccino'}).first().click();
 const buttons=page.locator('.ingredient-tile');await buttons.first().waitFor();const n=await buttons.count();assert.ok(n>0);
 await buttons.first().click();assert.equal(await buttons.first().getAttribute('aria-pressed'),'true');assert.equal(await page.locator('.checklist-toolbar>span').textContent(),`ใส่แล้ว 1 / ${n}`);
 await page.locator('.checklist-reset').click();assert.equal(await buttons.first().getAttribute('aria-pressed'),'false');
 for(const b of await buttons.all()){assert.ok(await b.evaluate(e=>e.scrollWidth<=e.clientWidth+1),'tile overflows');await b.click()}
 assert.equal(await page.locator('.checklist-toolbar>span').textContent(),`ใส่แล้ว ${n} / ${n}`);
 await page.locator('[data-close-detail]').click();await page.locator('.recipe-card').filter({hasText:'Cappuccino'}).first().click();assert.equal(await buttons.first().getAttribute('aria-pressed'),'false');
 if(width===390)await page.screenshot({path:'/Users/eakaluksengdeng/Downloads/coffee-checklist.png',animations:'disabled'});
 await page.locator('[data-close-detail]').click();await page.locator('#featuredRecipe [data-brew]').click();assert.equal(await page.locator('#brewDialog').evaluate(e=>e.open),false);assert.equal(await page.locator('#detailDialog').evaluate(e=>e.open),true);
}
await page.locator('[data-close-detail]').click();
await page.evaluate(()=>{const r=recipes.find(r=>r.name==='Cappuccino');r.variants=[{label:'ทดสอบตัวเลือก',size:'8 oz',ingredients:[{name:'นมทดสอบ',qty:150,unit:'ml'}]}];showDetail(r.id)});
await page.locator('.ingredient-tile').first().click();await page.locator('#variantSelect').selectOption('0');
assert.equal(await page.locator('.ingredient-tile').count(),1);assert.equal(await page.locator('.ingredient-amount').textContent(),'150 ml');assert.equal(await page.locator('.ingredient-tile').getAttribute('aria-pressed'),'false');
assert.deepEqual(errors,[]);console.log('PASS: checklist check/reset/reopen/variant, brew entry points and 320–1440px; no data writes');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
