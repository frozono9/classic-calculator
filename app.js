import {Calculator} from './engine.js';
const calculator=new Calculator();
const result=document.querySelector('#result');
const clear=document.querySelector('#clear');
const backspaceIcon='<svg viewBox="0 0 40 36" aria-hidden="true"><path d="M16 3h19a3 3 0 0 1 3 3v24a3 3 0 0 1-3 3H16a4 4 0 0 1-3-1.5L2 20a3 3 0 0 1 0-4L13 4.5A4 4 0 0 1 16 3Z"/><path d="m18 12 12 12M30 12 18 24"/></svg>';
const entries=[];
let clearTimer=null, heldClear=false;
function localized(){return calculator.formatted().replace(/,/g,'·').replace('.',',').replace(/·/g,'.')}
clear.addEventListener('pointerdown',()=>{heldClear=false;clearTimer=setTimeout(()=>{heldClear=true;calculator.reset();render()},500)});
for(const event of ['pointerup','pointercancel','pointerleave'])clear.addEventListener(event,()=>clearTimeout(clearTimer));
for(const kind of ['history','mode']){
 const panel=document.querySelector(`#${kind}-panel`);
 document.querySelector(`#${kind}`).addEventListener('click',()=>{panel.hidden=!panel.hidden});
 document.querySelector(`#close-${kind}`).addEventListener('click',()=>{panel.hidden=true});
}

function render(){
  result.textContent=localized();
  clear.innerHTML=calculator.value==='0'?'AC':backspaceIcon;
  clear.setAttribute('aria-label',calculator.value==='0'?'All clear':'Delete last digit');
  document.querySelectorAll('.operator').forEach(b=>{const selected=b.dataset.key===calculator.operator&&calculator.waiting;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected))});
  result.style.fontSize='20.1cqw';
  const available=result.parentElement.clientWidth-parseFloat(getComputedStyle(result.parentElement).paddingLeft)*2;
  if(result.scrollWidth>available)result.style.fontSize=`${20.1*available/result.scrollWidth}cqw`;
}
document.querySelector('.keypad').addEventListener('click',event=>{
 const button=event.target.closest('button');const key=button?.dataset.key;if(!key)return;
 if(key==='clear'){
  if(heldClear){heldClear=false;return}
  if(calculator.value==='0'||calculator.waiting)calculator.reset();else calculator.backspace();
 }else calculator.press(key);
 render();
 if(key==='equals'){
  entries.unshift(localized());
  const items=document.querySelector('#history-items');items.replaceChildren();
  for(const value of entries.slice(0,30)){const entry=document.createElement('div');entry.className='entry';entry.textContent=value;items.append(entry)}
 }
});
const keys={'+':'add','-':'subtract','*':'multiply','/':'divide','%':'percent','.':'decimal',',':'decimal','=':'equals',Enter:'equals',Escape:'clear',Delete:'clear'};
document.addEventListener('keydown',event=>{
  if(event.metaKey||event.ctrlKey||event.altKey)return;
  if(event.key==='Backspace'){event.preventDefault();calculator.backspace();render();return}
  const key=/^\d$/.test(event.key)?event.key:keys[event.key];
  if(!key)return;event.preventDefault();calculator.press(key);render();
  const button=document.querySelector(`[data-key="${key}"]`);button?.classList.add('pressed');setTimeout(()=>button?.classList.remove('pressed'),110);
});
let start=null;
result.parentElement.addEventListener('pointerdown',event=>{start={x:event.clientX,y:event.clientY}});
result.parentElement.addEventListener('pointerup',event=>{if(start&&Math.abs(event.clientX-start.x)>35&&Math.abs(event.clientY-start.y)<40){calculator.backspace();render()}start=null});
result.parentElement.addEventListener('contextmenu',event=>{event.preventDefault();navigator.clipboard?.writeText(calculator.value).catch(()=>{})});
new ResizeObserver(render).observe(result.parentElement);
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).catch(console.error);
render();
