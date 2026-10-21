/* Compact ingredient card; preserve recipe amounts verbatim. */
(()=>{
  const originalDetail=showDetail;
  showDetail=function(id){
    originalDetail(id);
    if(!current||current.id!==id)return;
    const list=document.querySelector('#detailContent .ingredients');if(!list)return;
    list.classList.add('ingredient-card');
    if(!list.children.length){const empty=document.createElement('li');empty.textContent='ยังไม่ได้ระบุวัตถุดิบ';list.append(empty)}
    const action=document.querySelector('#detailContent [data-brew]');
    if(action){delete action.dataset.brew;action.textContent='ดูวัตถุดิบ';action.onclick=()=>list.scrollIntoView({block:'start',behavior:'smooth'})}
  };
  startBrew=function(id){showDetail(id);document.querySelector('#detailContent .ingredients')?.scrollIntoView({block:'start'})};
})();
