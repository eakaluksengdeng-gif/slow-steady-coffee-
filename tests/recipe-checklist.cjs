const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require(process.env.COFFEE_PLAYWRIGHT||'playwright');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 if(!process.env.COFFEE_LIVE_ONLY){
  await page.route('**/neo.css*',r=>r.fulfill({contentType:'text/css',body:fs.readFileSync('dist/neo.css','utf8')}));
  await page.route('**/recipe-checklist.js*',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('dist/recipe-checklist.js','utf8')}));
 }
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:844});await page.goto('https://coffee-gf3d.onrender.com/');await page.locator('.recipe-card').filter({hasText:'Cappuccino'}).first().click();
  const card=page.locator('.ingredient-card');await card.waitFor();assert.equal(await card.locator('button,input').count(),0);assert.equal(await page.locator('.checklist-toolbar').count(),0);
  assert.ok(await card.evaluate(e=>e.scrollWidth<=e.clientWidth+2));assert.ok((await card.boundingBox()).width<=602);
  assert.equal(await card.locator('strong').last().textContent(),'120 ml');await card.scrollIntoViewIfNeeded();
  if(width===390)await page.screenshot({path:'/Users/eakaluksengdeng/Downloads/coffee-ingredient-card.png',animations:'disabled'});
 }
 await page.evaluate(()=>{const r=recipes.find(r=>r.name==='Cappuccino');r.variants=[{label:'ตัวเลือกทดสอบ',ingredients:[{name:'นม',qty:150,unit:'ml'}]}];showDetail(r.id)});
 await page.locator('#variantSelect').selectOption('0');assert.equal(await page.locator('.ingredient-card strong').textContent(),'150 ml');
 assert.deepEqual(errors,[]);console.log('PASS: compact card, no checklist controls, preserved amounts/variants, 320–1440px; no writes');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
