import {Calculator} from './engine.js';
import {setupScreenshot} from './screenshot.js';
import {ForceRoutine} from './routine.js';
const calculator=new Calculator();
const routine=new ForceRoutine(calculator);
const result=document.querySelector('#result');
const clear=document.querySelector('#clear');
const backspaceIcon='<svg viewBox="0 0 40 36" aria-hidden="true"><path d="M16 3h19a3 3 0 0 1 3 3v24a3 3 0 0 1-3 3H16a4 4 0 0 1-3-1.5L2 20a3 3 0 0 1 0-4L13 4.5A4 4 0 0 1 16 3Z"/><path d="m18 12 12 12M30 12 18 24"/></svg>';
const entries=[];
let clearTimer=null, heldClear=false;
function localized(){return calculator.formatted(document.body.dataset.decimal==='.'?'.':',')}
clear.addEventListener('pointerdown',()=>{if(routine.phase==='entry')return;heldClear=false;clearTimer=setTimeout(()=>{heldClear=true;routine.reset(routine.target);render()},500)});
for(const event of ['pointerup','pointercancel','pointerleave'])clear.addEventListener(event,()=>clearTimeout(clearTimer));
for(const kind of ['history','mode']){
 const panel=document.querySelector(`#${kind}-panel`);
 document.querySelector(`#${kind}`).addEventListener('click',()=>{panel.hidden=!panel.hidden});
 document.querySelector(`#close-${kind}`).addEventListener('click',()=>{panel.hidden=true});
}

function render(){
  result.textContent=localized();
  document.body.dataset.clearState=calculator.isEmpty?'ac':'delete';
  clear.innerHTML=calculator.isEmpty?'AC':backspaceIcon;
  clear.setAttribute('aria-label',calculator.isEmpty?'All clear':'Delete last digit');
  document.querySelectorAll('.operator').forEach(b=>{const selected=false;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected))});
  const font=document.body.classList.contains('screenshot-mode')?Number(document.body.dataset.resultFont||18.5):20.1;
  result.style.fontSize=`${font}cqw`;
  const available=result.parentElement.clientWidth-parseFloat(getComputedStyle(result.parentElement).paddingLeft)*2;
  if(result.scrollWidth>available){const fitted=font*available/result.scrollWidth;result.style.fontSize=`${calculator.tokens.length?Math.max(font*.75,fitted):fitted}cqw`}
  result.parentElement.classList.toggle('overflowing',result.scrollWidth>available);
  result.parentElement.scrollLeft=result.parentElement.scrollWidth;
}
function handleKey(key){
 if(routine.phase==='entry'){routine.press(key);render();if(key==='equals')recordResult();return;}
 if(key==='clear'){
  if(heldClear){heldClear=false;return}
  if(calculator.isEmpty)calculator.reset();else calculator.backspace();
 }else routine.press(key);
 render();
 if(key==='equals')recordResult();
}
function recordResult(){
  entries.unshift(localized());
  const items=document.querySelector('#history-items');items.replaceChildren();
  for(const value of entries.slice(0,30)){const entry=document.createElement('div');entry.className='entry';entry.textContent=value;items.append(entry)}
}
document.querySelector('.keypad').addEventListener('click',event=>{const key=event.target.closest('button')?.dataset.key;if(key)handleKey(key)});
// During the spectator phase, consume every screen tap before other controls can act.
document.addEventListener('click',event=>{
 if(document.body.dataset.screen!=='calculator'||routine.phase!=='entry')return;
 event.preventDefault();event.stopImmediatePropagation();
 const key=event.target.closest('button')?.dataset.key;
 handleKey(key==='equals'?'equals':key==='clear'?'clear':'spectator');
},true);
const keys={'+':'add','-':'subtract','*':'multiply','/':'divide','%':'percent','.':'decimal',',':'decimal','=':'equals',Enter:'equals',Escape:'clear',Delete:'clear'};
document.addEventListener('keydown',event=>{
  if(document.body.dataset.screen!=='calculator'||event.metaKey||event.ctrlKey||event.altKey||event.target.closest('input,select,textarea'))return;
  if(event.key==='Backspace'){event.preventDefault();if(routine.phase==='entry')handleKey('clear');else{calculator.backspace();render()}return}
  const key=/^\d$/.test(event.key)?event.key:keys[event.key];
  if(!key)return;event.preventDefault();handleKey(key);
  const button=document.querySelector(`[data-key="${key}"]`);button?.classList.add('pressed');
});
const keypad=document.querySelector('.keypad');
keypad.addEventListener('pointerdown',event=>{
 const button=event.target.closest('button');if(!button)return;
 button.classList.add('pressed');button.setPointerCapture(event.pointerId);
});
function releaseButtons(){document.querySelectorAll('.keypad .pressed').forEach(button=>button.classList.remove('pressed'))}
for(const event of ['pointerup','pointercancel','keyup'])document.addEventListener(event,releaseButtons);
addEventListener('blur',releaseButtons);
let start=null;
result.parentElement.addEventListener('pointerdown',event=>{start={x:event.clientX,y:event.clientY}});
result.parentElement.addEventListener('pointerup',event=>{if(routine.phase!=='entry'&&start&&Math.abs(event.clientX-start.x)>35&&Math.abs(event.clientY-start.y)<40){calculator.backspace();render()}start=null});
result.parentElement.addEventListener('contextmenu',event=>{event.preventDefault();navigator.clipboard?.writeText(calculator.value).catch(()=>{})});
new ResizeObserver(render).observe(result.parentElement);
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).catch(console.error);
render();

let screenshotUI=null;
const forceEnabled=document.getElementById('force-enabled'),forceNumber=document.getElementById('force-number'),forceStatus=document.getElementById('force-status');
try{const saved=JSON.parse(localStorage.getItem('calculator-force')||'{}');forceEnabled.checked=Boolean(saved.enabled);forceNumber.value=saved.number||''}catch{}
function targetNumber(){const text=forceNumber.value.trim().replace(',','.');return /^-?\d+(?:\.\d+)?$/.test(text)?Number(text):NaN}
function saveForce(){
 const target=targetNumber();const valid=Number.isFinite(target)&&Math.abs(target)<=999999999999&&forceNumber.value.replace(/\D/g,'').length<=12;
 forceStatus.textContent=forceEnabled.checked&&!valid?'Enter a valid force number (up to 12 digits).':'';
 try{localStorage.setItem('calculator-force',JSON.stringify({enabled:forceEnabled.checked,number:forceNumber.value}))}catch{forceStatus.textContent='Settings could not be saved on this device.'}
 return valid;
}
forceEnabled.addEventListener('change',saveForce);forceNumber.addEventListener('input',saveForce);
function goHome(){document.body.dataset.screen='home';routine.reset(null);render();document.querySelectorAll('.panel').forEach(panel=>panel.hidden=true);document.body.classList.remove('show-targets')}
document.addEventListener('routine-home',goHome);
document.getElementById('home-settings').addEventListener('click',()=>screenshotUI?.openSettings());
document.getElementById('start-routine').addEventListener('click',()=>{
 if(!screenshotUI?.hasScreenshot()){document.getElementById('home-status').textContent='Add both AC and Delete screenshots in Settings first.';screenshotUI?.openSettings();return}
 if(forceEnabled.checked&&!saveForce()){screenshotUI.openSettings();forceNumber.focus();return}
 routine.reset(forceEnabled.checked?targetNumber():null);entries.length=0;document.getElementById('history-items').innerHTML='<p>No calculations</p>';
 document.body.dataset.screen='calculator';document.getElementById('settings-open').classList.add('concealed');document.getElementById('home-status').textContent='';render();
});
setupScreenshot(render).then(ui=>{screenshotUI=ui;saveForce()});
