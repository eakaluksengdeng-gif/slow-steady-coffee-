const assert=require('node:assert/strict');
const {chromium}=require(process.env.COFFEE_PLAYWRIGHT||'playwright');
(async()=>{
  const origin=process.argv[2];if(!origin?.startsWith('https://'))throw Error('Supply the deployed HTTPS origin');
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    const response=await page.goto(origin);assert.equal(response.status(),200);
    await page.locator('.cloud-bar[data-state="saved"]').waitFor();
    assert.equal(await page.locator('#accountOpen').count(),0);
    assert.ok(await page.locator('.recipe-card').count()>=4);
    const cfg=await page.evaluate(()=>window.COFFEE_CONFIG);
    const shared=await fetch(cfg.url+'/rest/v1/coffee_shared_recipes?select=id&limit=1',{headers:{apikey:cfg.key}});
    assert.equal(shared.status,200);
    const privateBook=await fetch(cfg.url+'/rest/v1/coffee_books?select=user_id',{headers:{apikey:cfg.key}});
    assert.equal(privateBook.status,401);
    assert.deepEqual(errors,[]);
    console.log('PASS: live shared recipes without login; public API readable; old private books denied; no runtime errors');
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
