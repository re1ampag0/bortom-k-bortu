// Prepared, decoded pictures of the existing CSS rays and wax shadow. No live mask/filter.
import {SEAL_HTML} from '../art/legendArt';
import {perfWorkHook} from '../perf/clip';
interface Art {key:string;rays?:HTMLImageElement;shadow?:HTMLImageElement}
const banks=new WeakMap<HTMLElement,Art>();
async function decoded(src:string):Promise<HTMLImageElement>{const image=new Image();image.src=src;await image.decode();return image;}
export function prepareIntroArt(board:HTMLElement,D:number,ready:()=>void):void {
 const dpr=devicePixelRatio,key=`${D}:${dpr}`;
 if(banks.get(board)?.key===key)return;
 const bank:Art={key};banks.set(board,bank);
 const end=perfWorkHook?.('prepare: legendIntro rays/shadow raster');
 const rays=document.createElement('canvas');rays.width=rays.height=Math.ceil(D*dpr);
 const c=rays.getContext('2d')!;c.scale(dpr,dpr);
 const cone=c.createConicGradient(-Math.PI/2,D/2,D/2);
 for(let i=0;i<24;i++){
  const a=i/24,b=(i*15+5)/360,z=(i+1)/24;
  cone.addColorStop(a,'rgba(255,226,150,.16)');cone.addColorStop(b,'rgba(255,226,150,.16)');
  cone.addColorStop(b,'rgba(255,226,150,0)');cone.addColorStop(z,'rgba(255,226,150,0)');
 }
 c.fillStyle=cone;c.fillRect(0,0,D,D);
 const mask=c.createRadialGradient(D/2,D/2,0,D/2,D/2,D/Math.SQRT2);
 mask.addColorStop(0,'#000');mask.addColorStop(.08,'#000');mask.addColorStop(.3,'rgba(0,0,0,.6)');mask.addColorStop(.62,'transparent');mask.addColorStop(1,'transparent');
 c.globalCompositeOperation='destination-in';c.fillStyle=mask;c.fillRect(0,0,D,D);
 // The wax silhouette is opaque throughout: its outer path + stroke exactly define the CSS drop shadow.
 const seal=new DOMParser().parseFromString(SEAL_HTML,'image/svg+xml');
 const outline=seal.documentElement.querySelector(':scope > path')!.cloneNode(true) as Element;
 outline.setAttribute('fill','#000');outline.setAttribute('stroke','#000');
 const source=`<svg xmlns="http://www.w3.org/2000/svg" width="${384*dpr}" height="${384*dpr}" viewBox="-96 -96 192 192"><defs><filter id="s" x="-150%" y="-150%" width="400%" height="400%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="6"/><feOffset dy="4"/><feFlood flood-color="#000" flood-opacity=".5"/><feComposite in2="offset" operator="in"/></filter></defs><g filter="url(#s)">${outline.outerHTML}</g></svg>`;
 // Explicit intermediate name: feComposite must mask the flood by the offset blurred silhouette.
 const svg=source.replace('<feOffset dy="4"/>','<feOffset dy="4" result="offset"/>');
 const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
 void Promise.all([decoded(rays.toDataURL()),decoded(url).then(async image=>{
  const canvas=document.createElement('canvas');canvas.width=canvas.height=384*dpr;
  canvas.getContext('2d')!.drawImage(image,0,0);return decoded(canvas.toDataURL());
 })]).then(([r,s])=>{
  if(banks.get(board)===bank){bank.rays=r;bank.shadow=s;ready();}
 }).catch(()=>{if(banks.get(board)===bank)banks.delete(board);}).finally(()=>{URL.revokeObjectURL(url);end?.();});
}
export function introArt(board:HTMLElement):Art|undefined{return banks.get(board);}
