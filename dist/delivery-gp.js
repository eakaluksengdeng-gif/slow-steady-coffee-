/* Optional effective GP rate; no platform rate or tax rate is assumed. */
window.CoffeeGP={
  totals(r){const price=Number(r.price)||0,cost=Number(r.cost)||0,rate=Math.min(100,Math.max(0,Number(r.gpRate)||0)),fee=Math.round(price*rate)/100;return{rate,fee,profit:Math.round((price-cost-fee)*100)/100}},
  money(n){return Number(n).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2})}
};
(()=>{
  const block=document.createElement('section');block.className='gp-section';
  block.innerHTML='<h3>ค่า GP เดลิเวอรี่ (ไม่บังคับ)</h3><label>ค่า GP รวมที่ต้องการหัก (%)<input id="gpRate" type="number" min="0" max="100" step="0.01" placeholder="ไม่มีก็เว้นว่าง เช่น 30" aria-describedby="gpHelp"></label><p class="help" id="gpHelp">คิดจากราคาขายด้านบน · เว้นว่าง = ไม่หัก GP · ใส่อัตรารวมตามสัญญาร้าน หากมี VAT หรือค่าธรรมเนียมเพิ่มให้รวมในอัตรานี้เอง ระบบไม่บวกเพิ่มให้</p><p id="gpPreview" class="gp-preview" role="status"></p>';
  document.querySelector('#extraFields').before(block);
  function update(){const rate=document.querySelector('#gpRate').value,preview=document.querySelector('#gpPreview');if(rate===''){preview.hidden=true;return}preview.hidden=false;const result=CoffeeGP.totals({price:document.querySelector('#price').value,cost:document.querySelector('#cost').value,gpRate:rate});preview.textContent=`หัก GP ${CoffeeGP.money(result.fee)} บาท · กำไรหลัง GP ${CoffeeGP.money(result.profit)} บาท/แก้ว (ยังไม่หักค่าใช้จ่ายอื่น)`}
  const originalOpen=openForm;openForm=function(id){originalOpen(id);const r=recipes.find(r=>r.id===id);document.querySelector('#gpRate').value=r?.gpRate??'';update()};
  document.querySelector('#recipeForm').addEventListener('input',update);
  new MutationObserver(update).observe(document.querySelector('#ingredientRows'),{childList:true});
  renderCosts=function(){
    const margins=recipes.filter(r=>r.price>0).map(r=>CoffeeGP.totals(r).profit/r.price*100);
    document.querySelector('#avgMargin').textContent=`${margins.length?Math.round(margins.reduce((a,b)=>a+b,0)/margins.length):0}%`;
    document.querySelector('#costList').innerHTML=recipes.map(r=>{const result=CoffeeGP.totals(r);return `<div class="cost-row"><div><strong>${esc(r.name)}</strong><small>ขาย ${CoffeeGP.money(r.price)} บาท · ต้นทุน ${CoffeeGP.money(r.cost)} บาท${result.rate?` · GP ${result.rate}% (${CoffeeGP.money(result.fee)} บาท)`:''}</small></div><div><strong>${CoffeeGP.money(result.profit)} ฿</strong><em>กำไรขั้นต้น${result.rate?'หลัง GP':''} ${r.price?Math.round(result.profit/r.price*100):0}%</em></div></div>`}).join('');
  };
  renderCosts();
})();
