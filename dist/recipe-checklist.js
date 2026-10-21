/* Brewing checks are temporary UI state, never part of the shared recipe. */
(()=>{
  const originalDetail=showDetail;
  let list,summary,checked=new Set();
  function update(){
    [...list.children].forEach((li,index)=>{
      const button=li.querySelector('button'),done=checked.has(index);
      button.setAttribute('aria-pressed',String(done));
      button.querySelector('.ingredient-check').textContent=done?'✓':'';
    });
    summary.textContent=`ใส่แล้ว ${checked.size} / ${list.children.length}`;
  }
  function populate(){
    checked.clear();
    // The existing variant selector renders its amounts first; preserve them verbatim.
    [...list.children].forEach((li,index)=>{
      const name=li.querySelector('span')?.textContent||'',amount=li.querySelector('strong')?.textContent||'';
      li.replaceChildren();
      const button=document.createElement('button');button.type='button';button.className='ingredient-tile';
      const check=document.createElement('span');check.className='ingredient-check';check.setAttribute('aria-hidden','true');
      const content=document.createElement('span');content.className='ingredient-content';
      const label=document.createElement('span');label.className='ingredient-label';label.textContent=name;
      const value=document.createElement('strong');value.className='ingredient-amount';value.textContent=amount;
      content.append(label,value);button.append(check,content);li.append(button);
      button.addEventListener('click',()=>{checked.has(index)?checked.delete(index):checked.add(index);update()});
    });
    update();
  }
  showDetail=function(id){
    originalDetail(id);
    if(!current||current.id!==id)return;
    list=document.querySelector('#detailContent .ingredients');if(!list)return;
    list.classList.add('ingredient-checklist');
    const toolbar=document.createElement('div');toolbar.className='checklist-toolbar';
    summary=document.createElement('span');summary.setAttribute('aria-live','polite');
    const reset=document.createElement('button');reset.type='button';reset.className='checklist-reset';reset.textContent='↻ เริ่มแก้วใหม่';
    reset.onclick=()=>{checked.clear();update();toast('เริ่มแก้วใหม่แล้ว')};
    toolbar.append(summary,reset);list.before(toolbar);populate();
    if(!list.children.length){summary.textContent='สูตรนี้ยังไม่ได้ระบุวัตถุดิบ';reset.disabled=true}
    document.querySelector('#variantSelect')?.addEventListener('change',populate);
    const action=document.querySelector('#detailContent [data-brew]');
    if(action){delete action.dataset.brew;action.textContent='ดูเช็กลิสต์วัตถุดิบ';action.onclick=()=>list.scrollIntoView({block:'start',behavior:'smooth'})}
  };
  // All brew entry points now use the same recipe checklist, not a step-by-step screen.
  startBrew=function(id){showDetail(id);document.querySelector('#detailContent .checklist-toolbar')?.scrollIntoView({block:'start'})};
})();
