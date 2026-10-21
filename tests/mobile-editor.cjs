const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.COFFEE_PLAYWRIGHT||'playwright');
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const context=await browser.newContext({isMobile:true,hasTouch:true,deviceScaleFactor:2});
    const page=await context.newPage();
    for(const [width,height,largeText] of [[320,640,false],[360,640,false],[390,720,false],[430,640,true],[320,480,true],[390,350,false]]){
      await page.setViewportSize({width,height});
      await page.goto(process.argv[2]||'https://coffee-gf3d.onrender.com/');
      await page.locator('.recipe-card').first().waitFor();
      if(!process.env.COFFEE_LIVE_ONLY)await page.addStyleTag({content:fs.readFileSync(path.join(__dirname,'../dist/neo.css'),'utf8')});
      if(largeText)await page.addStyleTag({content:'.sheet-head h2{font-size:24px}.sheet-head button{font-size:20px}'});
      await page.locator('.recipe-card').first().click();await page.locator('[data-edit]').first().click();
      async function check(){
        const b=await page.locator('#recipeForm').evaluate(form=>{
          const rect=e=>{const r=e.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width}};
          return{header:rect(form.querySelector('.sheet-head')),title:rect(form.querySelector('h2')),buttons:[...form.querySelectorAll('.sheet-head button')].map(rect),body:rect(form.querySelector('.sheet-body')),scrollWidth:form.scrollWidth,viewport:innerWidth};
        });
        assert.ok(b.title.bottom<=b.header.bottom+1,`${width}x${height}: title overflows header`);
        assert.ok(b.title.top>=b.header.top-1,`${width}x${height}: title above header`);
        for(const button of b.buttons){assert.ok(button.bottom<=b.header.bottom+1&&button.top>=b.header.top-1,'button overflows header');assert.ok(button.right<=width+1&&button.left>=-1,'button clipped horizontally');assert.ok(button.bottom<=b.title.top+1||button.top>=b.title.bottom-1||button.right<=b.title.left+1||button.left>=b.title.right-1,'button overlaps title')}
        assert.ok(b.body.top>=b.header.bottom-1,'form body overlaps header');
        assert.ok(b.scrollWidth<=width+1,'horizontal overflow');
      }
      await check();
      for(const button of await page.locator('#recipeForm .sheet-head button').all())assert.equal(await button.evaluate(e=>getComputedStyle(e).borderTopStyle),'solid','header action missing frame');
      await page.locator('#recipeForm .sheet-body').evaluate(e=>e.scrollTop=260);await check();
      await page.locator('#recipeForm .sheet-body').evaluate(e=>e.scrollTop=e.scrollHeight);
      await page.locator('#notes').fill('ทดสอบเลื่อนฟอร์ม');await check();
      if(width===360)await page.screenshot({path:'/Users/eakaluksengdeng/Downloads/coffee-mobile-editor-fixed.png',animations:'disabled'});
      await page.locator('[data-close]').click();
    }
    console.log('PASS: mobile edit header, title and buttons stay separate while scrolling, large text and reduced viewport; no recipes saved');
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
