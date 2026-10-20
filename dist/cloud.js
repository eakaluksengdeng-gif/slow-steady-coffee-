/* User-owned cloud cookbook, revision checks and persistent offline outbox. */
(()=>{
  const cfg=window.COFFEE_CONFIG;
  const bar=document.createElement('div');bar.className='cloud-bar';bar.innerHTML='<span id="syncState" role="status">สูตรในเครื่อง</span><button id="accountOpen">บัญชี / ซิงก์</button>';$('.topbar').after(bar);
  const dialog=document.createElement('dialog');dialog.id='authDialog';dialog.className='sheet';
  dialog.innerHTML='<header class="sheet-head"><button type="button" class="text-button" id="accountClose">ปิด</button><h2>บัญชีร้านกาแฟ</h2></header><div class="sheet-body"><p id="accountStatus" role="status"></p><form id="authForm"><label>อีเมล<input id="authEmail" type="email" autocomplete="email" required></label><label>รหัสผ่าน<input id="authPassword" type="password" autocomplete="current-password" minlength="8" required></label><div class="account-actions"><button class="outline-button" type="submit">เข้าสู่ระบบ</button><button class="outline-button" id="accountSignup" type="button">สมัครบัญชีใหม่</button></div></form><div id="signedActions" class="account-actions" hidden><button id="syncNow" class="outline-button">ซิงก์ล่าสุด</button><button id="cloudReload" class="outline-button">โหลดจากออนไลน์ (สำรองฉบับในเครื่องก่อน)</button><button id="migrateLocal" class="outline-button">นำสูตรเดิมในเครื่องขึ้นบัญชีนี้</button><button id="accountLogout" class="outline-button">ออกจากระบบ</button><p class="account-help">เข้าสู่บัญชีเดียวกันบน Vercel และ Render เพื่อใช้สูตรชุดเดียวกัน รูปเมนูจะบันทึกพร้อมสูตร เมื่อเน็ตหลุด ระบบจะเก็บงานไว้รอซิงก์</p></div></div>';
  document.body.append(dialog);
  const localSave=save,legacy=JSON.parse(localStorage.getItem(KEY)||'null')||structuredClone(recipes);
  let db=null,user=null,version=0,ready=false,dirty=false,busy=false,conflict=false,timer=null,epoch=0;
  const cacheKey=()=>`coffee-cloud-${user.id}`;
  const status=(text,state='')=>{bar.dataset.state=state;$('#syncState').textContent=text;$('#accountStatus').textContent=text};
  function cached(){localStorage.setItem(cacheKey(),JSON.stringify({recipes,version,dirty}))}
  function updateUI(){const signed=!!user;$('#authForm').hidden=signed;$('#signedActions').hidden=!signed}
  function backupBeforeReplace(){const blob=new Blob([JSON.stringify({version:1,recipes},null,2)],{type:'application/json'});const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download='coffee-before-cloud-reload.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);localStorage.setItem(`coffee-recovery-${user.id}`,JSON.stringify(recipes))}
  save=function(){if(!user)return localSave();if(!ready)throw Error('รอโหลดสูตรจากบัญชีก่อน');dirty=true;cached();status(conflict?'สูตรชนกับอีกเครื่อง: เปิดบัญชีเพื่อโหลดหรือสำรอง': 'บันทึกในเครื่องแล้ว · รอซิงก์',conflict?'conflict':'');clearTimeout(timer);timer=setTimeout(flush,700)};
  async function flush(){if(!user||!ready||!dirty||busy||conflict||!navigator.onLine)return;const account=user.id,runEpoch=epoch;busy=true;status('กำลังบันทึกออนไลน์…');const payload=structuredClone(recipes);const snapshot=JSON.stringify(payload);try{const {data,error}=await db.rpc('save_coffee_book',{expected_revision:version,new_recipes:payload});if(error)throw error;if(epoch!==runEpoch||user?.id!==account)return;version=data;dirty=JSON.stringify(recipes)!==snapshot;cached();status(dirty?'กำลังซิงก์ต่อ…':'บันทึกออนไลน์แล้ว ✓',dirty?'':'saved')}catch(e){if(epoch!==runEpoch)return;if(e.code==='40001'||String(e.message).includes('COFFEE_CONFLICT')){conflict=true;status('อีกเครื่องแก้สูตรแล้ว · สำรองก่อนโหลดฉบับล่าสุด','conflict')}else status('ซิงก์ไม่สำเร็จ · สูตรยังอยู่ในเครื่อง','error')}finally{busy=false;if(dirty&&!conflict&&epoch===runEpoch&&bar.dataset.state!=='error')timer=setTimeout(flush,800)}}
  async function pull(){if(!user||busy||dirty||conflict||!navigator.onLine)return;const account=user.id,runEpoch=epoch;const {data,error}=await db.from('coffee_books').select('recipes,revision').eq('user_id',account).maybeSingle();if(error)throw error;if(epoch!==runEpoch||user?.id!==account||dirty||busy)return;if(data){recipes=data.recipes;version=data.revision}else{recipes=structuredClone(seed);version=0}ready=true;cached();render();status(data?'สูตรออนไลน์พร้อมใช้ ✓':'บัญชีใหม่ · เพิ่มสูตรหรือย้ายสูตรเดิมได้',data?'saved':'')}
  async function switchUser(session){const next=session?.user||null;if(next?.id===user?.id&&ready)return;epoch++;clearTimeout(timer);user=next;ready=false;dirty=false;conflict=false;version=0;updateUI();if(!user){recipes=JSON.parse(localStorage.getItem(KEY)||'null')||structuredClone(legacy);render();status('สูตรในเครื่อง · เข้าสู่ระบบเพื่อซิงก์');return}let cache=null;try{cache=JSON.parse(localStorage.getItem(cacheKey())||'null')}catch{}
    recipes=cache?.recipes||structuredClone(seed);version=cache?.version||0;dirty=!!cache?.dirty;ready=!!cache;render();
    try{if(dirty){status('พบสูตรรอส่งจากครั้งก่อน');await flush()}else{await pull();if(!ready)status('ออฟไลน์ · ยังไม่มีสูตรที่บันทึกไว้ในเครื่องนี้')}}catch{status('โหลดออนไลน์ไม่ได้ · ลองซิงก์ใหม่เมื่อมีอินเทอร์เน็ต','error')}
  }
  document.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;try{
    if(b.id==='accountOpen'){updateUI();dialog.showModal()}if(b.id==='accountClose')dialog.close();
    if(b.id==='accountSignup'){if(!db)throw Error('ยังไม่ได้เชื่อมฐานข้อมูล');if(!$('#authForm').reportValidity())return;const {data,error}=await db.auth.signUp({email:$('#authEmail').value.trim(),password:$('#authPassword').value});if(error)throw error;$('#authPassword').value='';if(data.session)await switchUser(data.session);else status('สมัครแล้ว โปรดยืนยันอีเมล จากนั้นกลับมาเข้าสู่ระบบ')}
    if(b.id==='accountLogout'){if(dirty||busy)throw Error('ยังมีสูตรรอซิงก์ กรุณาซิงก์หรือสำรองก่อนออกจากระบบ');const {error}=await db.auth.signOut();if(error)throw error;await switchUser(null)}
    if(b.id==='syncNow'){if(conflict)throw Error('อีกเครื่องแก้สูตรไว้ กรุณาสำรองแล้วโหลดล่าสุด');if(dirty)await flush();else await pull()}
    if(b.id==='cloudReload'){if(busy)throw Error('รอซิงก์เสร็จก่อน');backupBeforeReplace();dirty=false;conflict=false;cached();await pull()}
    if(b.id==='migrateLocal'){if(!ready)throw Error('รอโหลดสูตรก่อน');recipes=[...recipes,...legacy.map(r=>({...structuredClone(r),id:crypto.randomUUID(),name:r.name+' (จากเครื่อง)'}))];save();render();toast('เพิ่มสูตรเดิมแล้ว กำลังซิงก์')}
  }catch(err){status(err.message||'ทำรายการไม่สำเร็จ','error')}});
  $('#authForm').addEventListener('submit',async e=>{e.preventDefault();try{if(!db)throw Error('ยังไม่ได้เชื่อมฐานข้อมูล');const {data,error}=await db.auth.signInWithPassword({email:$('#authEmail').value.trim(),password:$('#authPassword').value});if(error)throw error;$('#authPassword').value='';await switchUser(data.session)}catch(err){status(err.message||'เข้าสู่ระบบไม่สำเร็จ','error')}});
  // No edits before the first cloud read: prevents uploading another account's cache.
  $('#recipeForm').addEventListener('submit',e=>{if(user&&!ready){e.preventDefault();e.stopImmediatePropagation();toast('รอโหลดสูตรบัญชีก่อนบันทึก')}},true);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){if(dirty)flush();else pull().catch(()=>{})}});
  window.addEventListener('online',()=>{if(dirty)flush();else pull().catch(()=>{})});
  setInterval(()=>{if(document.visibilityState==='visible'){if(dirty)flush();else pull().catch(()=>{})}},20000);
  if(!cfg?.url||!cfg?.key||!window.CoffeeSupabase){status('ใช้สูตรในเครื่อง · ยังไม่ได้เชื่อมฐานข้อมูล');return}
  db=CoffeeSupabase.createClient(cfg.url,cfg.key);
  db.auth.onAuthStateChange((_event,session)=>{setTimeout(()=>switchUser(session),0)});
  db.auth.getSession().then(({data})=>switchUser(data.session)).catch(()=>status('เชื่อมต่อบัญชีไม่ได้','error'));
})();
