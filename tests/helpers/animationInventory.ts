import {readFileSync,readdirSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
export type AnimationSource={path:string;kind:string;name?:string;hash:string;properties?:string[];source?:string};
const files=(dir:string):string[]=>readdirSync(dir).flatMap(n=>statSync(`${dir}/${n}`).isDirectory()?files(`${dir}/${n}`):[`${dir}/${n}`]);
const hash=(s:string)=>createHash('sha256').update(s.replace(/\r\n/g,'\n')).digest('hex').slice(0,20);
/** Brace scanner respects comments and quoted strings, including URLs/data. */
function endBlock(text:string,start:number){let depth=0,quote='';for(let i=start;i<text.length;i++){const c=text[i];if(quote){if(c==='\\')i++;else if(c===quote)quote='';continue;}if(c==='"'||c==="'"){quote=c;continue;}if(c==='/'&&text[i+1]==='*'){const end=text.indexOf('*/',i+2);if(end<0)throw Error('Unclosed CSS comment');i=end+1;continue;}if(c==='{')depth++;if(c==='}'&&!--depth)return i+1;}throw Error('Unclosed CSS keyframes');}
export function animationSources(root='src'):AnimationSource[]{
 const result:AnimationSource[]=[];
 for(const path of files(root).filter(p=>/\.(?:css|ts|tsx)$/.test(p))){const text=readFileSync(path,'utf8');
  if(path.endsWith('.css'))for(const m of text.matchAll(/@(?:-webkit-)?keyframes\s+([\w-]+)\s*\{/g)){
   const block=text.slice(m.index,endBlock(text,m.index+ m[0].length-1)),properties=[...new Set([...block.matchAll(/(?:^|[;{])\s*([\w-]+)\s*:/g)].map(d=>d[1]).map(p=>p.replace(/^-(?:webkit|moz)-/,'' )).filter(p=>/^(?:width|height|top|left|right|bottom|margin|filter|box-shadow|clip-path|mask|background|border|color|outline|--)/.test(p)))];
   if(properties.length)result.push({path,kind:'keyframes',name:m[1],hash:hash(block),properties});
  }
  if(/\.tsx?$/.test(path))for(const m of text.matchAll(/<animate(?:Transform|Motion|Color)?\b[^>]*>/g))result.push({path,kind:'SMIL',hash:hash(m[0]),source:m[0]});
 }
 return result;
}
