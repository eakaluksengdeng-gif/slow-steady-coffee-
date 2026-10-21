const assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
const {chromium}=require(process.env.COFFEE_PLAYWRIGHT||'playwright');
(async()=>{
  const ids=new Set(),browser=await chromium.launch({channel:'chrome',headless:true});
  let passed=false;
  try{
    const a=await browser.newContext(),b=await browser.newContext();
    const one=await a.newPage(),two=await b.newPage();
    one.on('request',request=>{if(request.method()==='POST'&&request.url().includes('/rest/v1/coffee_shared_recipes')){const body=request.postDataJSON();if(body?.id)ids.add(body.id)}});
    const origin=process.argv[2]||'http://127.0.0.1:4175/';
    await Promise.all([one.goto(origin),two.goto(origin)]);
    for(const page of [one,two]){await page.locator('.cloud-bar[data-state="saved"]').waitFor();assert.equal(await page.locator('#accountOpen').count(),0)}
    // Private/local recipes from the old app must not be auto-published.
    await one.evaluate(()=>localStorage.setItem('slow-steady-recipes-v1',JSON.stringify([{id:crypto.randomUUID(),name:'PRIVATE_DO_NOT_PUBLISH',ingredients:[],steps:[]}])));
    await one.reload();await one.locator('.cloud-bar[data-state="saved"]').waitFor();assert.equal(await one.getByText('PRIVATE_DO_NOT_PUBLISH').count(),0);
    const name='QA shared '+randomUUID();
    async function add(page,title){await page.locator('#addRecipeTop').click();await page.locator('#name').fill(title);await page.locator('.ing-name').first().fill('นม');await page.locator('.ing-amount').first().fill('120 ml');await page.locator('.step-text').first().fill('ทดสอบชง');await page.locator('#price').fill('75');await page.locator('#recipeForm button[value="save"]').click();await page.locator('#recipeDialog').waitFor({state:'hidden'})}
    await add(one,name);await one.locator('.cloud-bar[data-state="saved"]').waitFor();
    await two.locator('#sharedSync').click();await two.locator('.recipe-card').filter({hasText:name}).waitFor();
    await two.reload();await two.locator('.recipe-card').filter({hasText:name}).waitFor();
    await one.locator('.recipe-card').filter({hasText:name}).click();await one.locator('[data-edit]').first().click();
    assert.equal(await one.locator('#recipeId').inputValue(),'');assert.equal(await one.locator('#deleteRecipe').isVisible(),false);
    const adjusted=name+' adjusted';await one.locator('#name').fill(adjusted);await one.locator('#recipeForm button[value="save"]').click();await one.locator('.cloud-bar[data-state="saved"]').waitFor();
    await two.locator('#sharedSync').click();await two.locator('.recipe-card').filter({hasText:adjusted}).waitFor();
    assert.equal(await two.locator('.recipe-card strong').filter({hasText:new RegExp('^'+name+'$')}).count(),1);
    // A connection failure retains the draft across reload, then retries safely.
    await a.route('**/rest/v1/coffee_shared_recipes**',route=>route.abort());
    const offline=name+' offline';await add(one,offline);
    await one.waitForFunction(()=>JSON.parse(localStorage.getItem('coffee-shared-outbox-v1')||'[]').length===1);
    await one.reload();await one.locator('.recipe-card').filter({hasText:offline}).waitFor();
    await a.unroute('**/rest/v1/coffee_shared_recipes**');await one.locator('#sharedSync').click();await one.locator('.cloud-bar[data-state="saved"]').waitFor();
    await two.locator('#sharedSync').click();await two.locator('.recipe-card').filter({hasText:offline}).waitFor();
    passed=true;console.log('PASS: no login, cross-browser add/read, reload persistence, immutable original, private-cache isolation, offline outbox retry');
  }finally{await browser.close();console.log(JSON.stringify({testIds:[...ids],passed}));}
})().catch(e=>{console.error(e);process.exit(1)});
