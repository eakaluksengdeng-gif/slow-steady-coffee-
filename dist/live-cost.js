/* Per-cup cost uses matching units: e.g. 135 ml from a 1000 ml pack. */
window.CoffeeCost={
  quantity(value){const match=String(value??'').trim().match(/^(\d+(?:\.\d+)?)\s*([^\d\s\-–—+.,/][^\d]*)?$/u);return match?Number(match[1]):null},
  calculate(ingredients,packaging=0){
    const rows=ingredients.map(i=>{
      const quantity=this.quantity(i.amount),price=i.packPrice,packQty=Number(i.packQty);
      const valid=quantity!==null&&Number.isFinite(quantity)&&price!==null&&price!==''&&Number.isFinite(Number(price))&&Number(price)>=0&&Number.isFinite(packQty)&&packQty>0;
      const cost=valid?quantity/packQty*Number(price):null;
      return {valid:valid&&Number.isFinite(cost),cost};
    });
    const complete=rows.length>0&&rows.every(r=>r.valid)&&Number.isFinite(Number(packaging))&&Number(packaging)>=0;
    const total=complete?Math.round((rows.reduce((sum,r)=>sum+r.cost,0)+Number(packaging))*100)/100:null;
    return {complete:complete&&Number.isFinite(total),total,rows};
  }
};
(()=>{
  const form=document.querySelector('#recipeForm'),cost=document.querySelector('#cost');
  let manual=cost.value||'0',wasAutomatic=false;
  const summary=document.createElement('p');summary.id='costCalculationHint';summary.className='cost-calculation-hint';summary.setAttribute('role','status');cost.after(summary);cost.setAttribute('aria-describedby',summary.id);
  function calculate(){
    const editors=[...form.querySelectorAll('.ingredient-editor')].filter(e=>e.querySelector('.ing-name').value.trim());
    const values=editors.map(e=>({amount:e.querySelector('.ing-amount').value,packPrice:e.querySelector('.pack-price').value===''?null:Number(e.querySelector('.pack-price').value),packQty:Number(e.querySelector('.pack-qty').value)}));
    form.querySelectorAll('.ingredient-cost-hint').forEach(e=>e.remove());
    const result=CoffeeCost.calculate(values,document.querySelector('#packaging').value||0);
    editors.forEach((editor,i)=>{
      const hint=document.createElement('p');hint.className='ingredient-cost-hint';
      hint.textContent=result.rows[i].valid?`ต้นทุนที่ใช้ต่อแก้ว ${result.rows[i].cost.toFixed(2)} บาท`:'ยังคำนวณไม่ได้ · ระบุปริมาณที่ใช้เป็นตัวเลข ราคาแพ็ก และปริมาณต่อแพ็กให้ครบ';editor.append(hint);
    });
    cost.readOnly=result.complete;
    if(result.complete){cost.value=result.total.toFixed(2);wasAutomatic=true;summary.textContent=`คำนวณอัตโนมัติ ${result.total.toFixed(2)} บาท/แก้ว · รวมค่าบรรจุภัณฑ์แล้ว`;summary.dataset.complete='true'}
    else{if(wasAutomatic)cost.value=manual;wasAutomatic=false;summary.dataset.complete='false';summary.textContent='ยังคำนวณอัตโนมัติไม่ครบ · ใส่ข้อมูลแพ็กของทุกวัตถุดิบ หรือกรอกต้นทุนเองด้านบน (ปริมาณที่ใช้และต่อแพ็กต้องเป็นหน่วยเดียวกัน)'}
  }
  const originalOpen=openForm;openForm=function(id){originalOpen(id);const r=recipes.find(r=>r.id===id);manual=r?.costMode==='ingredients'?'0':cost.value||'0';wasAutomatic=false;calculate()};
  form.addEventListener('input',e=>{if(e.target===cost&&!cost.readOnly)manual=cost.value;if(e.target.closest('.ingredient-editor')||e.target.id==='packaging')calculate()});
  new MutationObserver(calculate).observe(document.querySelector('#ingredientRows'),{childList:true});
})();
