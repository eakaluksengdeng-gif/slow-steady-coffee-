/* No-login shared cookbook: append recipes, never overwrite another's recipe. */
(()=>{
  const CACHE='coffee-shared-cache-v1',OUTBOX='coffee-shared-outbox-v1';
  const codec=window.CoffeeRecipe;
  const remote=new Map(),pending=new Map();
  let db=null,busy=false,pulling=false,timer=null;
  const bar=document.createElement('div');bar.className='cloud-bar';bar.innerHTML='<span id="syncState" role="status">กำลังโหลดสูตรส่วนกลาง…</span><button id="sharedSync">ซิงก์สูตร</button>';
  $('.topbar').after(bar);
  const note=document.createElement('p');note.className='shared-note';note.textContent='ไม่ต้องล็อกอิน · ทุกคนที่มีลิงก์เห็นสูตรที่เพิ่ม · ปรับสูตรโดยบันทึกเป็นสูตรใหม่';bar.after(note);
  $('#recipesTitle').textContent='สูตรส่วนกลาง';
  $('#backupDialog .sheet-body>p').textContent='สำรองสูตรส่วนกลางได้ทุกเมื่อ สูตรที่นำเข้าจะเพิ่มให้ทุกคนที่มีลิงก์เห็น โดยเก็บสูตรเดิมไว้';
  const status=(text,state='')=>{bar.dataset.state=state;$('#syncState').textContent=text};
  function read(key,target){try{for(const r of JSON.parse(localStorage.getItem(key)||'[]')){try{const safe=codec.normalize(r,r.id);target.set(safe.id,safe)}catch{}}}catch{}}
  read(CACHE,remote);read(OUTBOX,pending);
  function persist(){localStorage.setItem(OUTBOX,JSON.stringify([...pending.values()]));try{localStorage.setItem(CACHE,JSON.stringify([...remote.values()]))}catch{/* Remote recipes can be reloaded; never discard the outbox. */}}
  function display(){recipes=[...pending.values(),...[...remote.values()].filter(r=>!pending.has(r.id))];render()}
  // Old private/local recipes are not published automatically.
  display();
  const edit=openForm,detail=showDetail;
  openForm=function(id){edit(id);if(id){$('#recipeId').value='';$('#name').value+=' (ปรับสูตร)';$('#formTitle').textContent='ปรับสูตรและบันทึกเป็นสูตรใหม่'}else{$('#category').value='Espresso';$('#serve').value='ร้อน'}$('#deleteRecipe').hidden=true};
  showDetail=function(id){detail(id);$$('#detailContent [data-edit]').forEach(b=>b.textContent='ปรับเป็นสูตรใหม่')};
  document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
    if(b.id==='deleteRecipe'){e.preventDefault();e.stopImmediatePropagation();toast('สูตรส่วนกลางเก็บต้นฉบับไว้ ปรับเป็นสูตรใหม่ได้');}
    if(b.id==='duplicateRecipe'){e.preventDefault();e.stopImmediatePropagation();const id=current?.id;$('#detailDialog').close();openForm(id);$('#formTitle').textContent='คัดลอกเป็นสูตรใหม่';}
    if(b.id==='sharedSync')sync();
  },true);
  save=function(){
    const next=new Map();
    for(const r of recipes){if(codec.uuid(r.id)&&!remote.has(r.id)){const safe=codec.normalize(r,r.id);next.set(safe.id,safe)}}
    // Persist first so a storage failure cannot silently lose an offline draft.
    localStorage.setItem(OUTBOX,JSON.stringify([...next.values()]));pending.clear();for(const [id,r] of next)pending.set(id,r);
    status(pending.size?`เก็บในเครื่องแล้ว · รอส่ง ${pending.size} สูตร`:'สูตรส่วนกลางพร้อมใช้');
    clearTimeout(timer);timer=setTimeout(sync,700);
  };
  async function publish(){
    if(!db||busy||!navigator.onLine)return;busy=true;
    try{
      for(const [id,r] of [...pending]){
        status(`กำลังส่งสูตรส่วนกลาง… (${pending.size})`);
        const {error}=await db.from('coffee_shared_recipes').insert({id,payload:r});
        if(error){
          if(error.code!=='23505')throw error;
          // A previous request may have committed before the connection dropped.
          const existing=await db.from('coffee_shared_recipes').select('payload').eq('id',id).single();
          if(existing.error||JSON.stringify(codec.normalize(existing.data.payload,id))!==JSON.stringify(r))throw Error('รหัสสูตรซ้ำ กรุณาคัดลอกเป็นสูตรใหม่');
        }
        remote.set(id,r);pending.delete(id);persist();
      }
      display();status('บันทึกส่วนกลางแล้ว ✓ ทุกคนเปิดดูได้','saved');
    }catch(e){status(`ส่งสูตรยังไม่สำเร็จ · เก็บไว้ในเครื่องแล้ว (${pending.size})`,'error');}
    finally{busy=false}
  }
  async function pull(){
    if(!db||pulling||!navigator.onLine)return;pulling=true;
    try{
      const loaded=new Map();
      for(let offset=0;;offset+=250){
        const {data,error}=await db.from('coffee_shared_recipes').select('id,payload').order('created_at',{ascending:false}).order('id',{ascending:true}).range(offset,offset+249);
        if(error)throw error;
        for(const row of data){try{const r=codec.normalize(row.payload,row.id);loaded.set(r.id,r)}catch{}}
        if(data.length<250)break;
      }
      remote.clear();for(const [id,r] of loaded)remote.set(id,r);
      persist();display();if(!pending.size)status('สูตรส่วนกลางพร้อมใช้ ✓ ไม่ต้องล็อกอิน','saved');
    }catch{status('โหลดออนไลน์ไม่ได้ · ลองซิงก์อีกครั้ง สูตรรอส่งยังอยู่ในเครื่อง','error')}
    finally{pulling=false}
  }
  async function sync(){if(busy||pulling)return;if(!navigator.onLine){status('ออฟไลน์ · สูตรที่เพิ่มจะรอส่งเมื่อมีอินเทอร์เน็ต');return}if(pending.size)await publish();await pull()}
  const cfg=window.COFFEE_CONFIG;
  if(!cfg?.url||!cfg?.key||!window.CoffeeSupabase){status('ยังไม่ได้เชื่อมสูตรออนไลน์ · กรุณาลองโหลดหน้าใหม่','error');return}
  db=CoffeeSupabase.createClient(cfg.url,cfg.key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  window.addEventListener('online',sync);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sync()});
  setInterval(()=>{if(document.visibilityState==='visible')sync()},15000);
  sync();
})();
