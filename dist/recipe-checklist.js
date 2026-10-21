/* Compact ingredient card; preserve recipe amounts verbatim. */
(()=>{
  const originalDetail=showDetail;
  showDetail=function(id){
    originalDetail(id);
    if(!current||current.id!==id)return;
    const espresso=document.querySelector('#detailContent .spec-grid .spec');
    if(espresso){
      espresso.classList.add('espresso-split');
      espresso.innerHTML='<small class="espresso-heading">Espresso</small><div class="espresso-pair"></div>';
      for(const [label,value] of [['ผงกาแฟที่ใช้',current.dose],['น้ำกาแฟที่ได้',current.yield]]){
        const half=document.createElement('div'),name=document.createElement('small'),amount=document.createElement('strong'),unit=document.createElement('span');
        name.textContent=label;amount.textContent=String(value||0)+' ';unit.textContent='g';amount.append(unit);half.append(name,amount);espresso.querySelector('.espresso-pair').append(half);
      }
    }
    const list=document.querySelector('#detailContent .ingredients');if(!list)return;
    list.classList.add('ingredient-card');
    if(!list.children.length){const empty=document.createElement('li');empty.textContent='ยังไม่ได้ระบุวัตถุดิบ';list.append(empty)}
    const action=document.querySelector('#detailContent [data-brew]');
    if(action){delete action.dataset.brew;action.textContent='ดูวัตถุดิบ';action.onclick=()=>list.scrollIntoView({block:'start',behavior:'smooth'})}
  };
  startBrew=function(id){showDetail(id);document.querySelector('#detailContent .ingredients')?.scrollIntoView({block:'start'})};
})();
