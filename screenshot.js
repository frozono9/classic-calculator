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
 if(rows.length!==5)throw new Error('Could not detect five button rows. Use a full-screen portrait calculator screenshot.');
 const cols=runs(x=>lit(x,(rows[0][0]+rows[0][1])/2),0,w,w*.10);
 if(cols.length!==4)throw new Error('Could not detect four button columns. Use an uncropped screenshot.');
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
 let saved=null,url=null;const stage=$('screenshot-stage'),image=$('screenshot-image'),panel=$('settings-panel'),open=$('settings-open');
 function position(){
  if(!saved)return;const c=saved.config;const scale=Math.min(innerWidth/image.naturalWidth,innerHeight/image.naturalHeight);const w=image.naturalWidth*scale,h=image.naturalHeight*scale,x=(innerWidth-w)/2,y=(innerHeight-h)/2;
  Object.assign(stage.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});
  const calculator=document.querySelector('.calculator');const keypad=document.querySelector('.keypad');const display=document.querySelector('.display');
  Object.assign(calculator.style,{left:(x+w*c.x/100)+'px',top:(y+h*c.y/100)+'px',width:w*c.width/100+'px',height:h*c.height/100+'px'});
  keypad.style.setProperty('--skin-gap-x',c.gapX+'%');keypad.style.setProperty('--skin-gap-y',c.gapY+'%');
  Object.assign(display.style,{top:h*(c.resultY-c.y)/100+'px',left:'0px',width:'100%',height:h*c.resultHeight/100+'px'});
  document.body.dataset.resultFont=c.font;document.body.dataset.decimal=c.decimal;
  const mode=$('mode');mode.hidden=c.oldLayout;mode.style.display=c.oldLayout?'none':'';
  document.querySelector('.zero').style.gridColumn=c.oldLayout?'span 2':'';
  const history=$('history');history.style.display=c.history?'':'none';if(c.history)Object.assign(history.style,{left:(x+w*c.history.x/100-3)+'px',top:(y+h*c.history.y/100-3)+'px'});
  render();
 }
 function sliders(){for(const key of ['x','y','width','height','resultY','resultHeight','font']){const input=$('skin-'+key);input.value=saved.config[key];input.nextElementSibling.textContent=Number(saved.config[key]).toFixed(1)+'%'}$('skin-decimal').value=saved.config.decimal}
 async function activate(value){
  if(url)URL.revokeObjectURL(url);saved=value;url=URL.createObjectURL(value.blob);image.src=url;await image.decode();
  stage.hidden=false;document.body.classList.add('screenshot-mode');$('screenshot-controls').hidden=false;$('screenshot-status').textContent='Screenshot saved on this device.';sliders();position();
 }
 async function persist(){try{await storage('put',saved)}catch{$('screenshot-status').textContent='Could not save the screenshot. Device storage may be full.'}}
 open.addEventListener('click',()=>{if(!open.classList.contains('concealed'))panel.hidden=false});
 let hold=null;open.addEventListener('pointerdown',()=>{hold=setTimeout(()=>{panel.hidden=false;open.classList.remove('concealed')},650)});
 for(const event of ['pointerup','pointercancel','pointerleave'])open.addEventListener(event,()=>clearTimeout(hold));
 $('settings-close').addEventListener('click',()=>{panel.hidden=true;document.body.classList.remove('show-targets');$('show-targets').checked=false;if(saved)open.classList.add('concealed')});
 $('use-screenshot').addEventListener('click',()=>{panel.hidden=true;open.classList.add('concealed');document.body.classList.remove('show-targets');$('show-targets').checked=false;persist()});
 $('show-targets').addEventListener('change',event=>document.body.classList.toggle('show-targets',event.target.checked));
 for(const key of ['x','y','width','height','resultY','resultHeight','font']){
  const input=$('skin-'+key);input.addEventListener('input',()=>{saved.config[key]=Number(input.value);input.nextElementSibling.textContent=Number(input.value).toFixed(1)+'%';position()});input.addEventListener('change',persist);
 }
 $('skin-decimal').addEventListener('change',event=>{saved.config.decimal=event.target.value;position();persist()});
 $('screenshot-upload').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;
  if(file.size>20*1024*1024){$('screenshot-status').textContent='Please choose an image smaller than 20 MB.';return}
  let temp;
  try{
   $('screenshot-status').textContent='Detecting buttons…';temp=URL.createObjectURL(file);const probe=new Image();probe.src=temp;await probe.decode();
   if(probe.naturalHeight<probe.naturalWidth)throw new Error('Choose a portrait screenshot.');
   const config=detectScreenshot(probe);await activate({blob:file,config});await persist();
   $('screenshot-status').textContent='Buttons detected. Tap Use screenshot when ready.';
  }catch(error){$('screenshot-status').textContent=error.message||'Could not load this image.'}finally{if(temp)URL.revokeObjectURL(temp);event.target.value=''}
 });
 $('remove-screenshot').addEventListener('click',async()=>{
  try{await storage('delete')}catch{$('screenshot-status').textContent='Could not remove the saved screenshot.';return}
  saved=null;if(url)URL.revokeObjectURL(url);stage.hidden=true;image.removeAttribute('src');document.body.classList.remove('screenshot-mode','show-targets');delete document.body.dataset.resultFont;delete document.body.dataset.decimal;
  document.querySelector('.calculator').removeAttribute('style');document.querySelector('.display').removeAttribute('style');document.querySelector('.keypad').removeAttribute('style');document.querySelector('.zero').style.gridColumn='';$('history').removeAttribute('style');$('mode').hidden=false;$('mode').style.display='';$('screenshot-controls').hidden=true;$('screenshot-status').textContent='Using the drawn calculator.';open.classList.remove('concealed');render();
 });
 addEventListener('resize',position);
 try{const value=await storage('get');if(value){await activate(value);open.classList.add('concealed')}}catch{$('screenshot-status').textContent='Saved screenshot unavailable. Choose it again.'}
}
