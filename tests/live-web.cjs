const assert=require('node:assert/strict');
const {JSDOM}=require(process.env.COFFEE_TEST_JSDOM||'jsdom');
(async()=>{
  const origin=process.argv[2];if(!origin?.startsWith('https://'))throw Error('Supply the deployed HTTPS origin');
  const doc=await fetch(origin);assert.equal(doc.status,200);
  const w=new JSDOM(await doc.text(),{url:origin,runScripts:'outside-only'}).window;
  Object.assign(w,{fetch:global.fetch,Headers:global.Headers,Request:global.Request,Response:global.Response,TextEncoder:global.TextEncoder,TextDecoder:global.TextDecoder,structuredClone:global.structuredClone});
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
  const scripts=[];
  for(const src of ['app.js','enhancements.js','cloud-config.js','vendor/supabase.js','cloud.js']){const r=await fetch(new URL(src,origin));assert.equal(r.status,200,src);scripts.push(await r.text())}
  w.eval(scripts.join('\n;\n'));
  await new Promise(r=>setTimeout(r,100));
  assert.equal(w.document.querySelectorAll('.recipe-card').length,4);
  w.document.querySelector('#accountOpen').click();assert.equal(w.document.querySelector('#authDialog').open,true);
  assert.equal(w.document.querySelector('#authForm').hidden,false);
  const config=w.COFFEE_CONFIG;
  const api=await fetch(config.url+'/rest/v1/coffee_books?select=user_id',{headers:{apikey:config.key}});
  assert.equal(api.status,401,'Anonymous cookbook access must be denied');
  const settings=await fetch(config.url+'/auth/v1/settings',{headers:{apikey:config.key}});
  const auth=await settings.json();assert.equal(auth.external.email,true);assert.equal(auth.disable_signup,false);
  console.log('PASS: deployed assets, real Supabase SDK initialization, guest recipes, account dialog, anonymous API denied, email signup enabled');w.close();
})().catch(e=>{console.error(e);process.exit(1)});
