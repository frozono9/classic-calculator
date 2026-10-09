import {Calculator} from './engine.js';
export class ForceRoutine{
 constructor(calculator=new Calculator()){this.calculator=calculator;this.reset(null)}
 reset(target){this.target=Number.isFinite(target)?target:null;this.phase='normal';this.remainder='';this.index=0;this.used=false;this.calculator.reset()}
 press(key){
  if(this.phase==='entry'){
   if(key==='clear')return;
   if(key==='equals'){
    this.calculator.value=this.remainder;this.calculator.waiting=false;
    this.calculator.press('equals');this.calculator.set(this.target);
    this.phase='finished';this.used=true;return;
   }
   this.tap();return;
  }
  const c=this.calculator;
  const canArm=!this.used&&this.target!==null&&key==='add'&&!c.waiting&&!c.evaluated&&c.tokens.length===2;
  if(canArm){
   const base=c.preview();const difference=Number((this.target-base).toPrecision(12));
   if(Number.isFinite(base)&&Number.isFinite(difference)){
    c.press('add');this.remainder=String(difference);this.index=0;this.phase='entry';return;
   }
  }
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
