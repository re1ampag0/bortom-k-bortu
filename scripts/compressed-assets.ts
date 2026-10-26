import {readdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {brotliCompress,gzip,constants} from 'node:zlib';
import {promisify} from 'node:util';
import type {Plugin} from 'vite';
const br=promisify(brotliCompress),gz=promisify(gzip);
/** Build artifacts only. The runtime image needs no compressor dependencies. */
export function compressedAssets():Plugin{return{name:'precompressed-assets',apply:'build',async closeBundle(){
 async function walk(dir:string):Promise<string[]>{return(await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?walk(join(dir,e.name)):/\.(?:js|css|json|svg|html)$/.test(e.name)?[join(dir,e.name)]:[]))).flat();}
 const files=await walk('dist');let next=0;
 await Promise.all(Array.from({length:4},async()=>{while(next<files.length){const file=files[next++],source=await readFile(file);const [a,b]=await Promise.all([br(source,{params:{[constants.BROTLI_PARAM_QUALITY]:9}}),gz(source,{level:9})]);if(a.length<source.length)await writeFile(file+'.br',a);if(b.length<source.length)await writeFile(file+'.gz',b);}}));
}};}
