/* Normalize all public input before it reaches the existing recipe UI. */
window.CoffeeRecipe={
  uuid(value){return typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)},
  normalize(raw,id){
    if(!raw||typeof raw!=='object'||!this.uuid(id))throw Error('ข้อมูลสูตรไม่ถูกต้อง');
    const text=(v,n=200)=>String(v??'').slice(0,n);
    const num=v=>Number.isFinite(Number(v))?Math.min(10000000,Math.max(0,Number(v))):0;
    const array=v=>Array.isArray(v)?v.slice(0,100):[];
    const r={id,name:text(raw.name).trim(),category:['Espresso','นม','Slow Bar','Signature'].includes(raw.category)?raw.category:'Signature',serve:raw.serve==='เย็น'?'เย็น':'ร้อน',size:text(raw.size,40),notes:text(raw.notes,4000),beanName:text(raw.beanName),roast:text(raw.roast),grind:text(raw.grind),temperature:text(num(raw.temperature),20),costMode:raw.costMode==='ingredients'?'ingredients':'manual'};
    if(!r.name)throw Error('กรุณาระบุชื่อสูตร');
    for(const k of ['price','cost','dose','yield','shotTime','packaging'])r[k]=num(raw[k]);
    r.ingredients=array(raw.ingredients).map(i=>({name:text(i?.name),amount:text(i?.amount,80),packPrice:i?.packPrice==null?null:num(i.packPrice),packQty:num(i?.packQty)}));
    r.steps=array(raw.steps).map(s=>({text:text(s?.text,2000),time:num(s?.time)}));
    r.variants=array(raw.variants).map(v=>({label:text(v?.label),size:text(v?.size,40),ingredients:array(v?.ingredients).map(i=>({name:text(i?.name),qty:num(i?.qty),unit:text(i?.unit,30)}))}));
    r.photo=typeof raw.photo==='string'&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(raw.photo)?raw.photo:'';
    if(new TextEncoder().encode(JSON.stringify(r)).length>950000)throw Error('รูปหรือสูตรใหญ่เกินไป กรุณาลดขนาดรูป');
    return r;
  }
};
