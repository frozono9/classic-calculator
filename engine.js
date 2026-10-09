const operations={add:(a,b)=>a+b,subtract:(a,b)=>a-b,multiply:(a,b)=>a*b,divide:(a,b)=>a/b};
const symbols={add:'+',subtract:'−',multiply:'×',divide:'÷'};
const priority={add:1,subtract:1,multiply:2,divide:2};
const number=value=>Number(value.endsWith('%')?value.slice(0,-1):value)/(value.endsWith('%')?100:1);
function evaluate(tokens){
 const values=[],ops=[];
 const reduce=()=>{const op=ops.pop(),right=values.pop(),left=values.pop();values.push(operations[op](left,right))};
 for(const token of tokens){if(operations[token]){while(ops.length&&priority[ops.at(-1)]>=priority[token])reduce();ops.push(token)}else{let value=number(token);if(token.endsWith('%')&&['add','subtract'].includes(ops.at(-1)))value*=values.at(-1);values.push(value)}}
 while(ops.length)reduce();return values[0];
}
function format(value,decimal){
 if(value==='Error')return value;
 const percent=value.endsWith('%');if(percent)value=value.slice(0,-1);
 if(value.includes('e'))return value.replace('e+','e').replace('.',decimal)+(percent?'%':'');
 const [integer,fraction]=value.split('.');
 return integer.replace(/^-/, '−').replace(/\B(?=(\d{3})+(?!\d))/g,decimal===','?'.':',')+(fraction!==undefined?decimal+fraction:'')+(percent?'%':'');
}
export class Calculator{
 constructor(){this.reset()}
 reset(){this.value='0';this.tokens=[];this.operator=null;this.waiting=false;this.repeat=null;this.fresh=true;this.evaluated=false;this.lastExpression=[]}
 preview(){return evaluate([...this.tokens,this.value])}
 number(){return number(this.value)}
 set(n){this.value=Number.isFinite(n)?String(Number(n.toPrecision(12))):'Error'}
 press(key){
  if(key==='clear'){if(this.fresh||this.evaluated||this.value==='Error')this.reset();else{this.value='0';this.fresh=true}return}
  if(this.value==='Error')this.reset();
  if(/^\d$/.test(key)||key==='decimal'){
   if(this.evaluated){this.reset()}
   if(this.waiting){this.value='0';this.waiting=false;this.operator=null}
   if(this.value.endsWith('%'))this.value='0';
   if(key==='decimal'){if(!this.value.includes('.'))this.value+='.'}
   else if(this.value.replace(/[-.]/g,'').length<12)this.value=this.value==='0'?key:this.value==='-0'?'-'+key:this.value+key;
   this.fresh=false;this.repeat=null;return;
  }
  if(key==='sign'){
   if(this.waiting){this.value='0';this.waiting=false;this.operator=null}
   this.value=this.value.startsWith('-')?this.value.slice(1):'-'+this.value;this.fresh=false;this.evaluated=false;return;
  }
  if(key==='percent'){
   if(this.waiting)return;
   this.value=this.value.endsWith('%')?String(this.number()/100):this.value+'%';this.fresh=false;this.evaluated=false;return;
  }
  if(operations[key]){
   if(this.waiting)this.tokens[this.tokens.length-1]=key;
   else{this.tokens.push(this.value,key)}
   this.operator=key;this.waiting=true;this.evaluated=false;this.repeat=null;this.fresh=false;return;
  }
  if(key==='equals'){
   this.lastExpression=this.tokens.length?[...this.tokens,this.value]:this.repeat&&this.evaluated?[this.value,this.repeat.operator,String(this.repeat.right)]:[this.value];
   if(this.tokens.length){
    const expression=[...this.tokens,this.value];
    const lastOperator=expression.at(-2);let right=number(expression.at(-1));
    if(expression.at(-1).endsWith('%')&&['add','subtract'].includes(lastOperator))right*=evaluate(expression.slice(0,-2));
    this.set(evaluate(expression));this.repeat={operator:lastOperator,right};
   }else if(this.repeat&&this.evaluated)this.set(operations[this.repeat.operator](this.number(),this.repeat.right));
   else this.set(this.number());
   this.tokens=[];this.operator=null;this.waiting=false;this.evaluated=true;this.fresh=false;
  }
 }
 backspace(){
  if(this.evaluated||this.value==='Error'){this.reset();return}
  if(this.waiting){this.tokens.pop();this.value=this.tokens.pop()||'0';this.waiting=false;this.operator=null}
  else{
   this.value=this.value.slice(0,-1);
   if(!this.value||this.value==='-'){
    if(this.tokens.length){this.value=this.tokens.at(-2);this.waiting=true;this.operator=this.tokens.at(-1)}
    else this.value='0';
   }
  }
  this.fresh=this.tokens.length===0&&this.value==='0';this.repeat=null;
 }
 formatted(decimal='.'){
  const tokens=this.waiting?[...this.tokens]:[...this.tokens,this.value];
  return tokens.map(token=>symbols[token]||format(token,decimal)).join('');
 }
 formattedExpression(decimal='.'){return this.evaluated?this.lastExpression.map(token=>symbols[token]||format(token,decimal)).join(''):''}
 get showsAC(){return this.isEmpty||this.evaluated||this.value==='Error'}
 get isEmpty(){return this.value==='0'&&this.tokens.length===0}
}
