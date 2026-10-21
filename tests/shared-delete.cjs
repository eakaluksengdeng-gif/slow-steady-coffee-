const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require(process.env.COFFEE_PLAYWRIGHT||'playwright');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});let api,headers,id,page;try{
 const contexts=await Promise.all([browser.newContext(),browser.newContext()]);
 for(const context of contexts)if(!process.env.COFFEE_LIVE_ONLY){
  await context.route('**/shared-cloud.js*',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync('dist/shared-cloud.js','utf8')}));
  await context.route('**/neo.css*',r=>r.fulfill({contentType:'text/css',body:fs.readFileSync('dist/neo.css','utf8')}));
 }
 page=await contexts[0].newPage();const other=await contexts[1].newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('https://coffee-gf3d.onrender.com/?v=shared-delete-1');
 const cfg=await page.evaluate(()=>window.COFFEE_CONFIG);api=cfg.url+'/rest/v1/coffee_shared_recipes';headers={apikey:cfg.key,'Content-Type':'application/json'};
 id=await page.evaluate(()=>crypto.randomUUID());
 const payload=await page.evaluate(id=>CoffeeRecipe.normalize({id,name:'ทดสอบลบสูตรชั่วคราว '+id,ingredients:[{name:'น้ำ',amount:'100 ml'}],steps:[]},id),id);
 assert.equal((await page.request.post(api,{headers,data:{id,payload}})).status(),201);
 await page.reload();await other.goto('https://coffee-gf3d.onrender.com/?v=shared-delete-1');
 const selector=`.recipe-card[data-id="${id}"]`;
 await other.locator(selector).waitFor();await other.locator(selector).click();
 for(const width of [320,390,1440]){
  await page.setViewportSize({width,height:844});await page.locator(selector).click();
  const button=page.locator('.shared-delete-button');await button.scrollIntoViewIfNeeded();assert.equal(await button.evaluate(e=>getComputedStyle(e).borderTopStyle),'solid');
  assert.ok(await page.locator('.detail-actions').evaluate(e=>e.scrollWidth<=e.clientWidth+2));
  page.once('dialog',d=>d.dismiss());await button.click();await page.locator('[data-close-detail]').click();assert.equal(await page.locator(selector).count(),1);
 }
 await page.locator(selector).click();
 await page.route('**/rest/v1/coffee_shared_recipes*',r=>r.request().method()==='DELETE'?r.fulfill({status:500,contentType:'application/json',body:JSON.stringify({message:'test failure'})}):r.continue());
 page.once('dialog',d=>d.accept());await page.locator('.shared-delete-button').click();await page.waitForFunction(()=>document.querySelector('.shared-delete-button')?.disabled===false);assert.equal(await page.locator(selector).count(),1);
 await page.unroute('**/rest/v1/coffee_shared_recipes*');
 page.once('dialog',d=>{assert.ok(d.message().includes(payload.name));d.accept()});await page.locator('.shared-delete-button').click();await page.waitForFunction(()=>!document.querySelector('#detailDialog').open);
 assert.equal(await page.locator(selector).count(),0);
 await other.locator('[data-close-detail]').click();await other.locator('#sharedSync').click();await other.waitForFunction(id=>!document.querySelector(`.recipe-card[data-id="${id}"]`),id);
 const check=await page.request.get(api+'?id=eq.'+id+'&select=id',{headers});assert.deepEqual(await check.json(),[]);
 assert.deepEqual(errors,[]);console.log('PASS: public DELETE fixture, confirmation cancel, API failure retention, mobile frames, cross-browser sync; fixture deleted');
}finally{if(api&&headers&&id&&page)await page.request.delete(api+'?id=eq.'+id,{headers});await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
