const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.COFFEE_PLAYWRIGHT||'playwright');
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const page=await browser.newPage();
    for(const width of [320,390,768,1440,2560]){
      await page.setViewportSize({width,height:900});
      await page.goto(process.argv[2]||'https://coffee-gf3d.onrender.com/');
      await page.waitForSelector('.cloud-bar');
      await page.addStyleTag({content:fs.readFileSync(path.join(__dirname,'../dist/neo.css'),'utf8')});
      async function check(label,selector='.app-shell'){
        const m=await page.evaluate(sel=>{const e=document.querySelector(sel),r=e.getBoundingClientRect();return{left:r.left,width:r.width,right:r.right,viewport:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth}},selector);
        assert.ok(m.overflow<=1,`${width}px ${label}: horizontal overflow ${m.overflow}`);
        assert.ok(Math.abs(m.width-width)<=1,`${width}px ${label}: surface only ${m.width}px`);
      }
      await check('recipes');
      await page.locator('[data-page="costPage"]').click();await check('costs');
      await page.locator('[data-page="recipesPage"]').click();
      await page.locator('.recipe-card').first().click();await check('recipe detail','#detailDialog');
      await page.locator('[data-close-detail]').click();
      await page.locator('#addRecipeTop').click();await check('recipe editor','#recipeDialog');
      const formOverflow=await page.locator('#recipeDialog').evaluate(e=>e.scrollWidth-e.clientWidth);
      assert.ok(formOverflow<=1,`${width}px editor content overflow ${formOverflow}`);
      await page.locator('[data-close]').click();
      if(width===1440){await page.screenshot({path:process.env.COFFEE_SCREENSHOT||'/Users/eakaluksengdeng/Downloads/coffee-fullscreen-preview.png',fullPage:true})}
    }
    console.log('PASS: 320, 390, 768, 1440, 2560px full-width recipes, costs, details, editor; no horizontal overflow');
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
