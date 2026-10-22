import {perfWorkHook} from '../perf/clip';
// Rasterize the original small SVG geometry once, outside the document. Nothing here animates.
export interface ParticleArt { image: HTMLCanvasElement; x: number; y: number; w: number; h: number }
const cache = new Map<string, ParticleArt>();
let bytes=0;
const LIMIT=16*1024*1024;
const colors: Record<string, [number,string,number?][]> = {
 lgArmS:[[0,'#eeebe4',.8],[1,'#eeebe4',0]],
 fxSmk:[[0,'#ffffff'],[.5,'#e9e5dc',.92],[.8,'#c8c1b4',.55],[1,'#a59d90',0]],
 fxSmkD:[[0,'#8a847a'],[.55,'#5e5850',.85],[1,'#36322c',0]],
 fxFire:[[0,'#ffffff'],[.25,'#fff2b0'],[.55,'#ffb347'],[.8,'#e2561e',.7],[1,'#8a2a0c',0]],
};
function paint(value: string,c: CanvasRenderingContext2D,box: number[]): string | CanvasGradient | null {
 if(value==='none')return null;
 const id=value.match(/^url\(#(\w+)\)$/)?.[1];if(!id)return value;
 const stops=colors[id];if(!stops)throw new Error(`Unknown particle gradient ${value}`);
 const [x,y,w,h]=box,smoke=id==='fxSmk'||id==='fxSmkD',cx=x+w*(smoke ? .42 : .5),cy=y+h*(smoke ? .38 : .5);
 const g=c.createRadialGradient(cx,cy,0,cx,cy,w*(smoke ? .62 : .5));
 for(const [at,color,alpha=1] of stops){const n=parseInt(color.slice(1),16);g.addColorStop(at,`rgba(${n>>16},${n>>8&255},${n&255},${alpha})`);}return g;
}
function number(el: Element,name: string,fallback=0): number {return Number(el.getAttribute(name)??fallback);}
function path(el: Element): {path: Path2D;box: number[]} | null {
 const p=new Path2D();
 switch(el.tagName){
  case 'circle':{const x=number(el,'cx'),y=number(el,'cy'),r=number(el,'r');p.arc(x,y,r,0,Math.PI*2);return{path:p,box:[x-r,y-r,2*r,2*r]};}
  case 'ellipse':{const x=number(el,'cx'),y=number(el,'cy'),rx=number(el,'rx'),ry=number(el,'ry');p.ellipse(x,y,rx,ry,0,0,Math.PI*2);return{path:p,box:[x-rx,y-ry,2*rx,2*ry]};}
  case 'rect':{const x=number(el,'x'),y=number(el,'y'),w=number(el,'width'),h=number(el,'height'),r=number(el,'rx');p.roundRect(x,y,w,h,r);return{path:p,box:[x,y,w,h]};}
  case 'path':return{path:new Path2D(el.getAttribute('d')??''),box:[-128,-128,256,256]};
  default:return null;
 }
}
function render(c: CanvasRenderingContext2D,el: Element,fill='black',stroke='none'): void {
 c.save();
 const transform=el.getAttribute('transform');if(transform){const matrix=new DOMMatrix(transform);c.transform(matrix.a,matrix.b,matrix.c,matrix.d,matrix.e,matrix.f);}
 c.globalAlpha*=number(el,'opacity',1);
 const blur=el.getAttribute('style')?.match(/filter:blur\(([\d.]+)px\)/);if(blur)c.filter=`blur(${blur[1]}px)`;
 fill=el.getAttribute('fill')??fill;stroke=el.getAttribute('stroke')??stroke;
 const geometry=path(el);
 if(geometry){
  const f=paint(fill,c,geometry.box),s=paint(stroke,c,geometry.box);
  if(f){c.fillStyle=f;c.fill(geometry.path);}
  if(s){c.strokeStyle=s;c.lineWidth=number(el,'stroke-width',1);c.lineCap=(el.getAttribute('stroke-linecap')??'butt') as CanvasLineCap;c.lineJoin=(el.getAttribute('stroke-linejoin')??'miter') as CanvasLineJoin;const dash=el.getAttribute('stroke-dasharray');if(dash)c.setLineDash(dash.split(/[ ,]+/).map(Number));c.stroke(geometry.path);}
 }
 for(const child of el.children)render(c,child,fill,stroke);
 c.restore();
}
export function particleArt(markup: string,dpr: number): ParticleArt | null {
 const key=dpr+':'+markup,old=cache.get(key);if(old){cache.delete(key);cache.set(key,old);return old;}
 const el=new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`,'image/svg+xml').documentElement;
 // Filtered smoke is prepared from its actual SVG by prepareSmokeArt, never approximated here.
 if(el.querySelector('[filter],animate,animateTransform,parsererror'))return null;
 // A conservative local box, including path control points and strokes. No document/getBBox/layout needed.
 const geometry=[...el.querySelectorAll('*')].flatMap(node=>['d','points','x','y','cx','cy','r','rx','ry','width','height','stroke-width'].map(name=>node.getAttribute(name)??'')).join(' ');
 const numbers=[...geometry.matchAll(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)].map(m=>Math.abs(Number(m[0])));
 const bound=Math.max(8,...numbers)+4;
 if(bound>160)return null; // Large art is deliberately not a particle.
 const r=Math.ceil(bound),canvas=document.createElement('canvas');canvas.width=canvas.height=Math.ceil(r*2*dpr);
 const c=canvas.getContext('2d')!;c.setTransform(dpr,0,0,dpr,r*dpr,r*dpr);
 try{render(c,el);}catch{return null;}
 const result={image:canvas,x:-r,y:-r,w:r*2,h:r*2};
 const cost=canvas.width*canvas.height*4;
 while(bytes+cost>LIMIT&&cache.size){const [k,v]=cache.entries().next().value!;bytes-=v.image.width*v.image.height*4;cache.delete(k);}
 if(cost<=LIMIT){cache.set(key,result);bytes+=cost;}
 return result;
}

const smoke = new Map<string,ParticleArt>();
let warming: Promise<void> | null=null;
/** Browser rasterization of exactly the existing gradient + SVG filter; no hand-painted substitute. */
export function prepareSmokeArt(defs: string,dpr: number): Promise<void> {
 if(warming)return warming;
 warming=Promise.all(['fxSmk','fxSmkD'].map(async fill=>{
  const r=32,pad=48,size=(r+pad)*2;
  const source=`<svg xmlns="http://www.w3.org/2000/svg" width="${size*dpr}" height="${size*dpr}" viewBox="-${r+pad} -${r+pad} ${size} ${size}">${defs}<g filter="url(#fxSmkF)"><circle r="${r}" fill="url(#${fill})"/></g></svg>`;
  const url=URL.createObjectURL(new Blob([source],{type:'image/svg+xml'}));
  const perfEnd=perfWorkHook?.('prepare: smoke SVG decode/raster');
  try{const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height=size*dpr;canvas.getContext('2d')!.drawImage(image,0,0);smoke.set(fill,{image:canvas,x:-80,y:-80,w:160,h:160});}finally{URL.revokeObjectURL(url);perfEnd?.();}
 })).then(()=>{}).catch(()=>{warming=null;});return warming;
}
export function smokeArt(fill: string): ParticleArt | undefined {return smoke.get(fill);}

const htmlSprites=new Map<string,ParticleArt>();
export function htmlParticleArt(kind: string): ParticleArt | undefined {
 return htmlSprites.get(kind);
}
export function prepareHtmlParticleArt(dpr: number): void {
 if(htmlSprites.size)return;
 const add=(kind: string,size: number,draw:(c:CanvasRenderingContext2D)=>void)=>{
  const canvas=document.createElement('canvas');canvas.width=canvas.height=Math.ceil(size*2*dpr);const c=canvas.getContext('2d')!;c.setTransform(dpr,0,0,dpr,size*dpr,size*dpr);draw(c);htmlSprites.set(kind,{image:canvas,x:-size,y:-size,w:size*2,h:size*2});
 };
 const disk=(c:CanvasRenderingContext2D,r:number)=>{c.beginPath();c.arc(0,0,r,0,2*Math.PI);c.fill();};
 add('spark',12,c=>{const g=c.createLinearGradient(0,0,9,0);g.addColorStop(0,'#ffe08a');g.addColorStop(1,'#f2913d');c.fillStyle=g;c.beginPath();c.roundRect(0,-1,9,2,1);c.fill();});
 add('splinter',8,c=>{c.fillStyle='#7a5230';c.fillRect(0,0,5,3);});
 add('shred',12,c=>{c.fillStyle='#e8dfc9';c.beginPath();c.moveTo(0,7);c.lineTo(4,0);c.lineTo(8,7);c.fill();});
 add('ember',12,c=>{c.fillStyle='#f2913d';c.shadowColor='#ffb25c';c.shadowBlur=4;disk(c,2);});
 add('gold-dust',18,c=>{c.fillStyle='#ffe08a';c.shadowColor='rgba(255,214,120,.85)';c.shadowBlur=6;disk(c,4.5);});
 add('dust',12,c=>{const g=c.createRadialGradient(0,0,0,0,0,7*Math.SQRT2);g.addColorStop(0,'rgba(150,140,128,.55)');g.addColorStop(.7,'rgba(150,140,128,0)');c.fillStyle=g;disk(c,7);});
 add('puff',26,c=>{const g=c.createRadialGradient(0,0,0,0,0,17*Math.SQRT2);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(.55,'rgba(214,206,192,.7)');g.addColorStop(.72,'rgba(214,206,192,0)');c.fillStyle=g;disk(c,17);});
 add('bubble',8,c=>{c.fillStyle='rgba(255,255,255,.35)';disk(c,2.75);c.strokeStyle='rgba(156,195,218,.95)';c.lineWidth=1.5;c.beginPath();c.arc(0,0,2.75,0,2*Math.PI);c.stroke();});
 add('ripple',26,c=>{c.strokeStyle='#9cc3da';c.lineWidth=1.5;c.beginPath();c.ellipse(0,0,19.25,4.25,0,0,2*Math.PI);c.stroke();});
 add('ring',24,c=>{c.strokeStyle='rgba(255,224,138,.95)';c.lineWidth=2;c.beginPath();c.arc(0,0,17,0,2*Math.PI);c.stroke();});
 add('ball trail',8,c=>{c.fillStyle='#1e1a17';disk(c,5.5);});
}

const WAD='<path d="M-1.4 -1 L1.6 -.6 L1 1.2 L-1.2 .8 Z" fill="#ffb347" stroke="#7a2a0c" stroke-width=".3"/>';
let wad: ParticleArt[]=[];
export function prepareWadArt(dpr: number): void {
 if(wad.length)return;
 const rgb=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
 const a=rgb('#ffe08a'),b=rgb('#ff8a2a'),c=rgb('#3a2a1c');
 wad=Array.from({length:256},(_,i)=>{const t=i/255,from=t<.4?a:b,to=t<.4?b:c,k=t<.4?t/.4:(t-.4)/.6;const color='#'+from.map((v,j)=>Math.round(v+(to[j]-v)*k).toString(16).padStart(2,'0')).join('');return particleArt(WAD.replace('#ffb347',color),dpr)!;});
}
export function wadArt(markup: string,t: number): ParticleArt | undefined {return markup===WAD?wad[Math.round(Math.max(0,Math.min(1,t))*255)]:undefined;}

export function moteArt(r: number,color: string,dpr: number): ParticleArt {
 const size=16,canvas=document.createElement('canvas');canvas.width=canvas.height=Math.ceil((r+size)*2*dpr);
 const c=canvas.getContext('2d')!;c.setTransform(dpr,0,0,dpr,size*dpr,size*dpr);
 c.fillStyle=color;c.shadowColor='rgba(255,214,120,.8)';c.shadowBlur=6*dpr;
 c.beginPath();c.arc(r,r,r,0,2*Math.PI);c.fill();
 return {image:canvas,x:-size,y:-size,w:(r+size)*2,h:(r+size)*2};
}

// A small shared atlas of stroke widths preserves vector-effect:non-scaling-stroke.
// Scaling an ordinary ring raster would incorrectly thicken its stroke as it grows.
const rings=new Map<string,ParticleArt[]>();
const RING_MIN=.2,RING_MAX=80,RING_STEPS=100;
export function prepareRingArt(dpr: number): void {
 for(const color of ['#eef6f8','#cfe4ea','#cfe8ef']){
  if(rings.has(color))continue;
  rings.set(color,Array.from({length:RING_STEPS+1},(_,i)=>{
   const width=RING_MIN*Math.pow(RING_MAX/RING_MIN,i/RING_STEPS),pad=Math.ceil(width/2+2),w=64+2*pad,h=25.6+2*pad;
   const canvas=document.createElement('canvas');canvas.width=Math.ceil(w*dpr);canvas.height=Math.ceil(h*dpr);
   const c=canvas.getContext('2d')!;c.setTransform(dpr,0,0,dpr,(32+pad)*dpr,(12.8+pad)*dpr);c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.ellipse(0,0,32,12.8,0,0,Math.PI*2);c.stroke();
   return {image:canvas,x:-32-pad,y:-12.8-pad,w,h};
  }));
 }
}
export function ringArt(color: string,width: number): ParticleArt | undefined {
 const i=Math.round(Math.log(Math.max(RING_MIN,Math.min(RING_MAX,width))/RING_MIN)/Math.log(RING_MAX/RING_MIN)*RING_STEPS);
 return rings.get(color)?.[i];
}
