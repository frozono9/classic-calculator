class ScreenshotError extends Error {}
const $=id=>document.getElementById(id);
const defaults={x:4.1,y:39.4,width:91.8,height:53.3,gapX:2.05,gapY:1.6,resultY:28.4,resultHeight:10,font:20.1,decimal:',',oldLayout:false};
function openDatabase(){return new Promise((resolve,reject)=>{const request=indexedDB.open('calculator-screenshot',1);request.onupgradeneeded=()=>request.result.createObjectStore('settings');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
async function storage(action,value){const db=await openDatabase();return new Promise((resolve,reject)=>{const tx=db.transaction('settings',action==='get'?'readonly':'readwrite');const store=tx.objectStore('settings');const request=action==='get'?store.get('skin'):action==='delete'?store.delete('skin'):store.put(value,'skin');tx.oncomplete=()=>{resolve(request.result);db.close()};tx.onerror=()=>{reject(tx.error);db.close()}})}
function runs(test,start,end,min){const output=[];let first=null;for(let n=start;n<=end;n++){if(n<end&&test(n)){if(first===null)first=n}else if(first!==null){if(n-first>=min)output.push([first,n]);first=null}}return output}
export function detectScreenshot(image){
 const canvas=document.createElement('canvas');const scale=Math.min(1,1170/image.naturalWidth);canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale);
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,canvas.width,canvas.height);
 const {width:w,height:h}=canvas;const pixels=ctx.getImageData(0,0,w,h).data;
 const lit=(x,y)=>{const i=(Math.floor(y)*w+Math.floor(x))*4;return Math.max(pixels[i],pixels[i+1],pixels[i+2])>28};
 const rows=runs(y=>lit(w*.148,y),Math.floor(h*.35),Math.floor(h*.97),w*.10).slice(-5);
 if(rows.length!==5)throw new ScreenshotError('No se han detectado las cinco filas de botones. Usa una captura completa de la calculadora en vertical.');
 const cols=runs(x=>lit(x,(rows[0][0]+rows[0][1])/2),0,w,w*.10);
 if(cols.length!==4)throw new ScreenshotError('No se han detectado las cuatro columnas de botones. Usa una captura sin recortar.');
 const left=cols[0][0],right=cols[3][1],top=rows[0][0],bottom=rows[4][1];
 const glyph=runs(y=>{let count=0;for(let x=Math.floor(w*.25);x<Math.floor(w*.96);x++){const i=(y*w+x)*4;if(pixels[i]>180&&pixels[i+1]>180&&pixels[i+2]>180)count++}return count>3},Math.floor(top-w*.33),top-8,8);
 const glyphTop=glyph[0]?.[0],glyphBottom=glyph.at(-1)?.[1];
 const config={...defaults,x:left/w*100,y:top/h*100,width:(right-left)/w*100,height:(bottom-top)/h*100,gapX:(cols[1][0]-cols[0][1])/(right-left)*100,gapY:(rows[1][0]-rows[0][1])/(bottom-top)*100,oldLayout:lit((cols[0][1]+cols[1][0])/2,(rows[4][0]+rows[4][1])/2)};
 let historyBounds={left:w,top:h,right:0,bottom:0};
 for(let y=Math.floor(h*.04);y<h*.25;y++)for(let x=0;x<w*.2;x++){const i=(y*w+x)*4;if(pixels[i]>200&&pixels[i+1]>80&&pixels[i+1]<200&&pixels[i+2]<60){historyBounds.left=Math.min(historyBounds.left,x);historyBounds.top=Math.min(historyBounds.top,y);historyBounds.right=Math.max(historyBounds.right,x);historyBounds.bottom=Math.max(historyBounds.bottom,y)}}
 config.history=historyBounds.right?{x:historyBounds.left/w*100,y:historyBounds.top/h*100}:null;
 if(glyphTop!==undefined){config.resultY=(glyphTop-12)/h*100;config.resultHeight=(glyphBottom-glyphTop+24)/h*100;config.font=(glyphBottom-glyphTop)/.73/(right-left)*100}
 return config;
}
export async function setupScreenshot(render){
 let saved=null,url=null,acImage=null,deleteImage=null,savedLocally=false;const stage=$('screenshot-stage'),image=$('screenshot-image'),panel=$('settings-panel'),open=$('settings-open');
 async function decodeBlob(blob){const address=URL.createObjectURL(blob);try{const img=new Image();img.src=address;await img.decode();return img}finally{URL.revokeObjectURL(address)}}
 function status(){
  if(saved?.acBlob&&saved?.deleteBlob)return 'Las capturas con AC y con el botón de borrar están guardadas en este dispositivo.';
  if(saved?.acBlob)return 'Captura con AC guardada. Añade la captura con el botón de borrar.';
  if(saved?.deleteBlob)return 'Captura con el botón de borrar guardada. Añade la captura con AC.';
  return saved?'La captura anterior sigue guardada. Añade las versiones con AC y con el botón de borrar.':'Añade ambas capturas antes de comenzar.';
 }
 function paintButton(){
  const patch=$('clear-skin');patch.hidden=!(acImage&&deleteImage);if(patch.hidden)return;
  const c=saved.config,w=image.naturalWidth,h=image.naturalHeight;
  const x=w*c.x/100,y=h*c.y/100,keyW=w*c.width/100*(1-3*c.gapX/100)/4,keyH=h*c.height/100*(1-4*c.gapY/100)/5;
  Object.assign(patch.style,{left:c.x+'%',top:c.y+'%',width:keyW/w*100+'%',height:keyH/h*100+'%'});
  for(const [id,img] of [['clear-ac-image',acImage],['clear-delete-image',deleteImage]]){
   const canvas=$(id);canvas.width=Math.round(keyW);canvas.height=Math.round(keyH);
   canvas.getContext('2d').drawImage(img,x,y,keyW,keyH,0,0,canvas.width,canvas.height);
  }
 }
 function position(){
  if(!saved)return;const c=saved.config;const w=document.documentElement.clientWidth,h=w*image.naturalHeight/image.naturalWidth,x=0,y=0;
  Object.assign(stage.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});
  const calculator=document.querySelector('.calculator');const keypad=document.querySelector('.keypad');const display=document.querySelector('.display');
  Object.assign(calculator.style,{left:(x+w*c.x/100)+'px',top:(y+h*c.y/100)+'px',width:w*c.width/100+'px',height:h*c.height/100+'px'});
  keypad.style.setProperty('--skin-gap-x',c.gapX+'%');keypad.style.setProperty('--skin-gap-y',c.gapY+'%');
  Object.assign(display.style,{top:h*(c.resultY-c.y)/100+'px',left:'0px',width:'100%',height:h*c.resultHeight/100+'px'});
  document.body.dataset.resultFont=c.font;document.body.dataset.decimal=c.decimal;
  const mode=$('mode');mode.hidden=c.oldLayout;mode.style.display=c.oldLayout?'none':'';
  document.querySelector('.zero').style.gridColumn=c.oldLayout?'span 2':'';
  const history=$('history');history.style.display=c.history?'':'none';if(c.history)Object.assign(history.style,{left:(x+w*c.history.x/100-3)+'px',top:(y+h*c.history.y/100-3)+'px'});
  paintButton();render();
 }
 function sliders(){for(const key of ['x','y','width','height','resultY','resultHeight','font']){const input=$('skin-'+key);input.value=saved.config[key];input.nextElementSibling.textContent=Number(saved.config[key]).toFixed(1)+'%'}$('skin-decimal').value=saved.config.decimal}
 async function activate(value){
  if(url)URL.revokeObjectURL(url);saved=value;url=URL.createObjectURL(value.acBlob||value.blob);image.src=url;await image.decode();
  acImage=value.acBlob?await decodeBlob(value.acBlob):null;deleteImage=value.deleteBlob?await decodeBlob(value.deleteBlob):null;
  stage.hidden=false;document.body.classList.add('screenshot-mode');$('screenshot-controls').hidden=false;$('screenshot-status').textContent=status();sliders();position();
 }
 async function persist(){savedLocally=false;document.dispatchEvent(new Event('screenshot-storage'));try{await storage('put',saved);savedLocally=true;document.dispatchEvent(new Event('screenshot-storage'));return true}catch{savedLocally=false;$('screenshot-status').textContent='No se ha podido guardar la captura. Puede que el almacenamiento del dispositivo esté lleno.';document.dispatchEvent(new Event('screenshot-storage'));return false}}
 open.addEventListener('click',()=>{if(!open.classList.contains('concealed'))panel.hidden=false});
 let hold=null;open.addEventListener('pointerdown',()=>{hold=setTimeout(()=>{if(document.body.dataset.screen==='calculator'){document.dispatchEvent(new Event('routine-home'))}else{panel.hidden=false;open.classList.remove('concealed')}},650)});
 for(const event of ['pointerup','pointercancel','pointerleave'])open.addEventListener(event,()=>clearTimeout(hold));
 $('settings-close').addEventListener('click',()=>{panel.hidden=true;document.body.classList.remove('show-targets');$('show-targets').checked=false;if(saved)open.classList.add('concealed')});
 $('use-screenshot').addEventListener('click',()=>{panel.hidden=true;open.classList.add('concealed');document.body.classList.remove('show-targets');$('show-targets').checked=false;persist()});
 $('show-targets').addEventListener('change',event=>document.body.classList.toggle('show-targets',event.target.checked));
 for(const key of ['x','y','width','height','resultY','resultHeight','font']){
  const input=$('skin-'+key);input.addEventListener('input',()=>{saved.config[key]=Number(input.value);input.nextElementSibling.textContent=Number(input.value).toFixed(1)+'%';position()});input.addEventListener('change',persist);
 }
 $('skin-decimal').addEventListener('change',event=>{saved.config.decimal=event.target.value;position();persist()});
 for(const [id,slot] of [['screenshot-upload','acBlob'],['screenshot-delete-upload','deleteBlob']])$(id).addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;
  if(file.size>20*1024*1024){$('screenshot-status').textContent='Elige una imagen de menos de 20 MB.';return}
  try{
   $('screenshot-status').textContent='Comprobando la captura…';const probe=await decodeBlob(file);
   if(probe.naturalHeight<probe.naturalWidth)throw new ScreenshotError('Elige una captura en vertical.');
   const detected=detectScreenshot(probe);
   const other=slot==='acBlob'?saved?.deleteBlob:saved?.acBlob;
   if(other){
    const otherImage=await decodeBlob(other);const otherConfig=detectScreenshot(otherImage);
    if(probe.naturalWidth!==otherImage.naturalWidth||probe.naturalHeight!==otherImage.naturalHeight)throw new ScreenshotError('Ambas capturas deben tener las mismas dimensiones. Hazlas en el mismo móvil.');
    if(['x','y','width','height'].some(key=>Math.abs(detected[key]-otherConfig[key])>.4))throw new ScreenshotError('Los botones están en posiciones distintas. Haz ambas capturas en el mismo modo de calculadora.');
   }
   const candidate={...(saved||{}),[slot]:file};
   candidate.blob=candidate.acBlob||file;
   if(slot==='acBlob'||!candidate.config)candidate.config=detected;
   savedLocally=false;await activate(candidate);if(await persist())$('screenshot-status').textContent=status();
  }catch(error){$('screenshot-status').textContent=error instanceof ScreenshotError?error.message:'No se ha podido cargar esta imagen.'}finally{event.target.value=''}
 });
 $('remove-screenshot').addEventListener('click',async()=>{
  try{await storage('delete')}catch{$('screenshot-status').textContent='No se ha podido eliminar la captura guardada.';return}
  saved=null;savedLocally=false;document.dispatchEvent(new Event('screenshot-storage'));acImage=null;deleteImage=null;$('clear-skin').hidden=true;if(url)URL.revokeObjectURL(url);stage.hidden=true;image.removeAttribute('src');document.body.classList.remove('screenshot-mode','show-targets');delete document.body.dataset.resultFont;delete document.body.dataset.decimal;
  document.querySelector('.calculator').removeAttribute('style');document.querySelector('.display').removeAttribute('style');document.querySelector('.keypad').removeAttribute('style');document.querySelector('.zero').style.gridColumn='';$('history').removeAttribute('style');$('mode').hidden=false;$('mode').style.display='';$('screenshot-controls').hidden=true;$('screenshot-status').textContent='Añade las dos capturas antes de comenzar.';open.classList.remove('concealed');render();
 });
 addEventListener('resize',position);
 try{const value=await storage('get');if(value){await activate(value);savedLocally=true;open.classList.add('concealed')}}catch{$('screenshot-status').textContent='La captura guardada no está disponible. Selecciónala de nuevo.'}
 return {isSaved:()=>Boolean(savedLocally&&saved?.acBlob&&saved?.deleteBlob),hasScreenshot:()=>Boolean(saved?.acBlob&&saved?.deleteBlob),openSettings:()=>{panel.hidden=false;open.classList.remove('concealed')}};
}
