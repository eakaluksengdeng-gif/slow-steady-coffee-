/* Compact ingredient card; preserve recipe amounts verbatim. */
(()=>{
  const originalDetail=showDetail;
  showDetail=function(id){
    originalDetail(id);
    if(!current||current.id!==id)return;
    const grid=document.querySelector('#detailContent .spec-grid');
    if(grid){
      const profit=document.createElement('div');profit.className='spec profit-spec';
      const gp=window.CoffeeGP?CoffeeGP.totals(current):{rate:0,fee:0,profit:Number(current.price||0)-Number(current.cost||0)};
      const label=document.createElement('small');label.textContent=gp.rate?'กำไรหลัง GP / แก้ว':'กำไรขั้นต้น / แก้ว';
      const amount=document.createElement('strong'),value=gp.profit;
      amount.textContent=value.toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2})+' บาท';
      if(value<0)profit.classList.add('is-loss');profit.append(label,amount);grid.append(profit);
      const note=document.createElement('p');note.className='profit-note';note.textContent=gp.rate?`หัก GP ${gp.rate}% = ${gp.fee.toFixed(2)} บาทจากราคาขาย · กำไรหลัง GP = ราคาขาย − ต้นทุน − GP · ยังไม่หักค่าใช้จ่ายอื่นของร้าน`:'กำไรขั้นต้น = ราคาขาย − ต้นทุนต่อแก้ว · ยังไม่หักค่าใช้จ่ายอื่นของร้าน';grid.after(note);
    }
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
