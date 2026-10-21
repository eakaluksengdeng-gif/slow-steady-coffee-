/* Local crop only: no upload until the recipe is saved. */
window.CoffeeCrop=async function(source){
  const url=typeof source==='string'?source:URL.createObjectURL(source),image=new Image();
  try{await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('อ่านรูปไม่ได้ กรุณาเลือกรูปอื่น'));image.src=url});
    return await new Promise(resolve=>{
      const dialog=document.createElement('dialog');dialog.className='photo-crop-dialog';
      dialog.setAttribute('aria-labelledby','cropTitle');
      dialog.innerHTML='<header><h2 id="cropTitle">จัดกรอบรูปเมนู</h2><p>ลากรูปเพื่อเลือกตำแหน่ง หรือใช้ปุ่มลูกศรเมื่อเลือกกรอบ</p></header><canvas width="600" height="600" tabindex="0" aria-label="กรอบรูป ลากเพื่อเลื่อน หรือกดปุ่มลูกศร"></canvas><label>ซูมรูป <output>1.0×</output><input type="range" min="1" max="5" step="0.01" value="1" aria-label="ซูมรูป"></label><button type="button" class="crop-fit">เห็นรูปทั้งหมด</button><div class="crop-actions"><button type="button" class="crop-cancel">ยกเลิก</button><button type="button" class="crop-confirm">ใช้รูปนี้</button></div>';
      document.body.append(dialog);
      const canvas=dialog.querySelector('canvas'),ctx=canvas.getContext('2d'),slider=dialog.querySelector('input'),base=Math.min(600/image.naturalWidth,600/image.naturalHeight);
      let zoom=1,x=0,y=0,drag=null,result=null;
      function draw(){
        const w=image.naturalWidth*base*zoom,h=image.naturalHeight*base*zoom;
        x=Math.max(-w/2,Math.min(w/2,x));y=Math.max(-h/2,Math.min(h/2,y));
        ctx.fillStyle='#fff3e9';ctx.fillRect(0,0,600,600);ctx.drawImage(image,300-w/2+x,300-h/2+y,w,h);
        slider.value=zoom;dialog.querySelector('output').textContent=zoom.toFixed(1)+'×';
      }
      slider.oninput=()=>{zoom=Number(slider.value);draw()};
      canvas.onpointerdown=e=>{drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)};
      canvas.onpointermove=e=>{if(!drag||e.pointerId!==drag.id)return;const ratio=600/canvas.getBoundingClientRect().width;x+=(e.clientX-drag.x)*ratio;y+=(e.clientY-drag.y)*ratio;drag.x=e.clientX;drag.y=e.clientY;draw()};
      canvas.onpointerup=canvas.onpointercancel=()=>{drag=null};
      canvas.onkeydown=e=>{const delta={ArrowLeft:[-12,0],ArrowRight:[12,0],ArrowUp:[0,-12],ArrowDown:[0,12]}[e.key];if(delta){e.preventDefault();x+=delta[0];y+=delta[1];draw()}};
      dialog.querySelector('.crop-fit').onclick=()=>{zoom=1;x=y=0;draw()};
      dialog.querySelector('.crop-cancel').onclick=()=>dialog.close();
      dialog.querySelector('.crop-confirm').onclick=()=>{result=canvas.toDataURL('image/jpeg',.85);dialog.close()};
      dialog.addEventListener('close',()=>{dialog.remove();resolve(result)},{once:true});
      draw();dialog.showModal();
    });
  }finally{if(typeof source!=='string')URL.revokeObjectURL(url)}
};
