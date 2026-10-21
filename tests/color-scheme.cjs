const assert=require('node:assert/strict');
const {chromium}=require(process.env.COFFEE_PLAYWRIGHT||'playwright');
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true});
    const snapshots=[];
    for(const colorScheme of ['light','dark']){
      await page.emulateMedia({colorScheme});
      await page.goto(process.argv[2]||'https://coffee-gf3d.onrender.com/');
      await page.locator('.app-shell').waitFor();
      snapshots.push(await page.evaluate(()=>({
        scheme:getComputedStyle(document.documentElement).colorScheme,
        colors:['html','body','.app-shell','.search-wrap','.search-wrap input'].map(selector=>{
          const s=getComputedStyle(document.querySelector(selector));
          return [s.color,s.backgroundColor,s.borderColor];
        })
      })));
    }
    assert.equal(snapshots[0].scheme,'light only');
    assert.deepEqual(snapshots[0],snapshots[1]);
    console.log('PASS: identical original palette in light and dark device modes');
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
