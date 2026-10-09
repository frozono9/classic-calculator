const operations={add:(a,b)=>a+b,subtract:(a,b)=>a-b,multiply:(a,b)=>a*b,divide:(a,b)=>a/b};
export class Calculator{
  constructor(){this.reset()}
  reset(){this.value='0';this.accumulator=null;this.operator=null;this.waiting=false;this.repeat=null;this.fresh=true}
  number(){return Number(this.value)}
  set(n){this.value=Number.isFinite(n)?String(Number(n.toPrecision(9))):'Error'}
  press(key){
    if(key==='clear'){
      if(this.fresh||this.value==='Error'){this.reset()}else{this.value='0';this.fresh=true}
      return;
    }
    if(this.value==='Error')this.reset();
    if(/^\d$/.test(key)||key==='decimal'){
      if(this.waiting){this.value='0';this.waiting=false}
      if(key==='decimal'){if(!this.value.includes('.'))this.value+='.'}
      else if(this.value.replace(/[-.]/g,'').length<9){this.value=this.value==='0'?key:this.value==='-0'?'-'+key:this.value+key}
      this.fresh=false;this.repeat=null;return;
    }
    if(key==='sign'){this.value=this.value.startsWith('-')?this.value.slice(1):'-'+this.value;this.fresh=false;return}
    if(key==='percent'){this.set(this.number()/100);this.fresh=false;return}
    if(operations[key]){
      if(this.operator&&!this.waiting)this.set(operations[this.operator](this.accumulator,this.number()));
      this.accumulator=this.number();this.operator=key;this.waiting=true;this.repeat=null;return;
    }
    if(key==='equals'){
      if(this.operator){const right=this.number();this.set(operations[this.operator](this.accumulator,right));this.repeat={operator:this.operator,right};this.operator=null}
      else if(this.repeat)this.set(operations[this.repeat.operator](this.number(),this.repeat.right));
      this.accumulator=null;this.waiting=true;this.fresh=false;
    }
  }
  backspace(){if(this.waiting||this.value==='Error')return;this.value=this.value.slice(0,-1);if(!this.value||this.value==='-')this.value='0'}
  formatted(){
    if(this.value==='Error')return this.value;
    const [integer,fraction]=this.value.split('.');
    if(this.value.includes('e'))return this.value.replace('e+','e');
    return integer.replace(/\B(?=(\d{3})+(?!\d))/g,',')+(fraction!==undefined?'.'+fraction:'');
  }
}
