import {Calculator} from './engine.js';
const calculator=new Calculator();
const result=document.querySelector('#result');
const clear=document.querySelector('#clear');
function render(){
  result.textContent=calculator.formatted();
  clear.textContent=calculator.fresh?'AC':'C';
  clear.setAttribute('aria-label',calculator.fresh?'All clear':'Clear');
  document.querySelectorAll('.operator').forEach(b=>{const selected=b.dataset.key===calculator.operator&&calculator.waiting;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected))});
  result.style.fontSize='27cqw';
  const available=result.parentElement.clientWidth-parseFloat(getComputedStyle(result.parentElement).paddingLeft)*2;
  if(result.scrollWidth>available)result.style.fontSize=`${27*available/result.scrollWidth}cqw`;
}
document.querySelector('.keypad').addEventListener('click',event=>{const button=event.target.closest('button');if(button){calculator.press(button.dataset.key);render()}});
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
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(console.error);
render();
