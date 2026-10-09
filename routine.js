import {Calculator} from './engine.js';
import {evaluateExact,numberExact,finiteDecimal,subtractExact,equalExact} from './exact.js';
export class ForceRoutine{
 constructor(calculator=new Calculator()){this.calculator=calculator;this.reset(null)}
 reset(target){this.target=Number.isFinite(target)?target:null;this.phase='normal';this.remainder='';this.index=0;this.used=false;this.issue='';this.calculator.reset()}
 press(key){
  if(this.phase==='entry'){
   if(key==='clear')return;
   if(key==='equals'){
    this.calculator.value=this.remainder;this.calculator.waiting=false;
    this.calculator.press('equals');
    this.phase='finished';this.used=true;return;
   }
   this.tap();return;
  }
  const c=this.calculator;
  const canArm=!this.used&&this.target!==null&&key==='add'&&!c.waiting&&!c.evaluated&&c.tokens.length===2&&c.tokens[1]==='multiply';
  if(canArm){
   try{
    const base=evaluateExact([...c.tokens,c.value]),target=numberExact(String(this.target));
    const correction=finiteDecimal(subtractExact(target,base)),baseText=finiteDecimal(base);
    // Keep every visible/intermediate number within the supported 12-digit range.
    const fits=text=>text!==null&&text.replace(/[-.]/g,'').length<=12;
    if(!fits(baseText)||!fits(correction))throw new RangeError('Inexact correction');
    const completed=[...c.tokens,c.value,'add',correction];
    if(!equalExact(evaluateExact(completed),target))throw new RangeError('Invalid correction');
    c.press('add');this.remainder=correction;this.index=0;this.phase='entry';this.issue='';return;
   }catch{
    this.issue='Esta operación no permite un forzado exacto. Bórrala y usa números más pequeños.';
    return;
   }
  }
  this.issue='';
  c.press(key);
 }
 tap(){
  if(this.phase!=='entry')return;
  if(this.index>=this.remainder.length)return;
  // A decimal point or minus sign accompanies the next digit; each tap reveals one digit.
  do{this.index++}while(this.index<this.remainder.length&&!/\d/.test(this.remainder[this.index-1]));
  this.calculator.value=this.remainder.slice(0,this.index);
  this.calculator.waiting=false;this.calculator.operator=null;this.calculator.fresh=false;
 }
}
