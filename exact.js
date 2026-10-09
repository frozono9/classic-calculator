// Decimal input is evaluated as fractions, avoiding binary rounding in corrections.
const abs=n=>n<0n?-n:n;
function fraction(n,d=1n){
 if(d===0n)throw new RangeError('Division by zero');
 if(d<0n){n=-n;d=-d}
 let a=abs(n),b=d;while(b){[a,b]=[b,a%b]}
 return {n:n/a,d:d/a};
}
export function numberExact(text){
 const percent=text.endsWith('%');if(percent)text=text.slice(0,-1);
 const match=/^(-?)(\d+)(?:\.(\d*))?(?:e([+-]?\d+))?$/i.exec(text);
 if(!match)throw new RangeError('Invalid decimal');
 const places=(match[3]||'').length-Number(match[4]||0);
 if(Math.abs(places)>1000)throw new RangeError('Decimal range');
 let n=BigInt(match[2]+(match[3]||''))*(match[1]?-1n:1n),d=percent?100n:1n;
 if(places>=0)d*=10n**BigInt(places);else n*=10n**BigInt(-places);
 return fraction(n,d);
}
const ops={
 add:(a,b)=>fraction(a.n*b.d+b.n*a.d,a.d*b.d),
 subtract:(a,b)=>fraction(a.n*b.d-b.n*a.d,a.d*b.d),
 multiply:(a,b)=>fraction(a.n*b.n,a.d*b.d),
 divide:(a,b)=>fraction(a.n*b.d,a.d*b.n)
};
export const subtractExact=ops.subtract;
export const equalExact=(a,b)=>a.n===b.n&&a.d===b.d;
export function evaluateExact(tokens){
 const values=[],operators=[],priority={add:1,subtract:1,multiply:2,divide:2};
 const reduce=()=>{const op=operators.pop(),b=values.pop(),a=values.pop();values.push(ops[op](a,b))};
 for(const token of tokens){
  if(ops[token]){while(operators.length&&priority[operators.at(-1)]>=priority[token])reduce();operators.push(token)}
  else{let value=numberExact(token);if(token.endsWith('%')&&['add','subtract'].includes(operators.at(-1)))value=ops.multiply(value,values.at(-1));values.push(value)}
 }
 while(operators.length)reduce();return values[0];
}
export function finiteDecimal(value){
 let d=value.d,twos=0,fives=0;
 while(d%2n===0n){d/=2n;twos++}while(d%5n===0n){d/=5n;fives++}
 if(d!==1n)return null;
 const places=Math.max(twos,fives),scale=10n**BigInt(places);
 let digits=(abs(value.n)*scale/value.d).toString().padStart(places+1,'0');
 if(places)digits=digits.slice(0,-places)+'.'+digits.slice(-places);
 digits=digits.includes('.')?digits.replace(/0+$/,'').replace(/\.$/,''):digits;
 return (value.n<0n?'-':'')+digits;
}
