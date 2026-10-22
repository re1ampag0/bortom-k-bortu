import {particleArt, prepareSmokeArt, smokeArt, prepareHtmlParticleArt, htmlParticleArt, prepareWadArt, wadArt, moteArt, prepareRingArt, ringArt} from './particleArt';
// Shared particle clock and raster bank. Prepared canvases never enter the document.
// Large objects keep their DOM/WAAPI renderer. Only explicitly opted-in producers use this API.
import type {FxCtx} from './primitives';
import {perfOff,subscribePerf} from '../perf/state';

type Level = 'sea' | 'top' | 'front';
interface Sprite { image: CanvasImageSource; x: number; y: number; w: number; h: number }
interface Frame { offset: number; transform?: string; opacity?: number }
interface Channel<T> { offset: number; value: T }
interface Transform { names: string[]; values: number[][] }
export interface ParticleTarget {
  readonly particle: true;
  ctx: FxCtx;
  host: Element;
  kind: string;
  sprite: Sprite;
  scale: number;
  alpha: number;
  spriteAt?: (t: number) => Sprite | undefined;
  animatedSprite?: Sprite;
  animatedAlpha?: number;
  origin?: {x: number;y: number};
  ring?: {radius: number;width: number;color: string;aspect: number};
}
export interface ParticleAnimation {
  finished: Promise<void>;
  cancel: () => void;
  readonly playState: AnimationPlayState;
}
interface Item {
  target: ParticleTarget;
  start: number;
  duration: number;
  easing: (t: number) => number;
  transforms: Channel<Transform>[];
  opacity: Channel<number>[];
  handle: ParticleAnimation;
  finish: () => void;
  ended: boolean;
  id: number;
  level: Level;
}
interface Surface { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D; level: Level }
interface Bank {
  board: HTMLElement;
  sprites: Map<string, Sprite>;
  surfaces: Map<Level, Surface>;
  items: Item[];
  now: number;
  last: number;
  raf: number;
  paused: boolean;
  drawn: Record<string, number>;
  seen: Record<string, number>;
  peak: number;
  visible: {id:number;kind:string;level:Level;opacity:number;x:number;y:number}[];
  nextId: number;
  diagnostics: boolean;
  w: number;
  h: number;
  dpr: number;
  resize: ResizeObserver;
  unsubscribe: () => void;
}
const banks = new WeakMap<HTMLElement, Bank>();
const active = new Set<Bank>();
interface HostAnimation {animation:Animation;frames:Frame[];transforms:Channel<Transform>[]|null|undefined;opacity:Channel<number>[]|null;easing:(t:number)=>number}
const hosts = new WeakMap<Element, HostAnimation[]>();
const COLORS = ['#fff3c4', '#ffd27a', '#ff9a3c', '#ffe08a', '#ff8a2a', '#cfc8bc', '#d9c9a4', '#3a2412'];
let paused = false;

// CSS easing is applied to the complete iteration, then keyframe offsets select the segment.
export function particleEasing(css: string): (t: number) => number {
  if (css === 'linear') return t => t;
  const preset: Record<string, number[]> = {'ease': [.25,.1,.25,1], 'ease-in': [.42,0,1,1], 'ease-out': [0,0,.58,1], 'ease-in-out': [.42,0,.58,1]};
  const p = preset[css] ?? css.match(/^cubic-bezier\(([^)]+)\)$/)?.[1].split(',').map(Number);
  if (!p || p.length !== 4) throw new Error(`Unsupported particle easing: ${css}`);
  const [x1,y1,x2,y2] = p;
  const bez = (t: number,a: number,b: number) => 3*(1-t)*(1-t)*t*a + 3*(1-t)*t*t*b + t*t*t;
  return x => {
    if (x <= 0 || x >= 1) return x;
    let lo=0,hi=1;
    for(let n=0;n<20;n++){const t=(lo+hi)/2;if(bez(t,x1,x2)<x)lo=t;else hi=t;}
    return bez((lo+hi)/2,y1,y2);
  };
}
function parseTransform(value: string): Transform {
  const names: string[] = [], values: number[][] = [];
  for(const m of value.matchAll(/(translate(?:X|Y)?|scale(?:X|Y)?|rotate)\(([^)]+)\)/g)){
    names.push(m[1]);
    const v=m[2].split(/[, ]+/).filter(Boolean).map(t=>parseFloat(t)*(t.endsWith('rad')?180/Math.PI:1));
    values.push(v);
  }
  if(value !== 'none' && !names.length) throw new Error(`Unsupported particle transform: ${value}`);
  return {names,values};
}
function framesOf(kf: Keyframe[]): Frame[] {
  const rows=kf.map(k=>({offset:k.offset??-1, ...(k.transform!==undefined?{transform:String(k.transform)}:{}), ...(k.opacity!==undefined?{opacity:Number(k.opacity)}:{})}));
  if(!rows.length)return [{offset:0},{offset:1}];
  rows[0].offset=Math.max(0,rows[0].offset);if(rows.length>1&&rows.at(-1)!.offset<0)rows.at(-1)!.offset=1;
  for(let i=0;i<rows.length-1;){let end=i+1;while(end<rows.length&&rows[end].offset<0)end++;if(end===rows.length)break;for(let j=i+1;j<end;j++)rows[j].offset=rows[i].offset+(rows[end].offset-rows[i].offset)*(j-i)/(end-i);i=end;}
  return rows;
}
function channel<T>(frames: Frame[],key: 'transform' | 'opacity',convert: (v: string | number)=>T,base: T): Channel<T>[] {
  const out=frames.filter(f=>f[key]!==undefined).map(f=>({offset:f.offset,value:convert(f[key]!)}));
  if(!out.length)return [{offset:0,value:base},{offset:1,value:base}];
  if(out[0].offset>0)out.unshift({offset:0,value:base});
  if(out.at(-1)!.offset<1)out.push({offset:1,value:base});
  return out;
}
function segment<T>(rows: Channel<T>[],t: number): [T,T,number] {
  let i=0;while(i<rows.length-2&&rows[i+1].offset<t)i++;
  const a=rows[i],b=rows[i+1]??a;
  return [a.value,b.value,Math.max(0,Math.min(1,(t-a.offset)/(b.offset-a.offset||1)))];
}
function alphaAt(rows: Channel<number>[],t: number): number {const [a,b,k]=segment(rows,t);return a+(b-a)*k;}
function matrixAt(rows: Channel<Transform>[],t: number): DOMMatrix {
  const [a,b,k]=segment(rows,t),matrix=new DOMMatrix();
  // The migrated producers use matching transform lists; missing property keyframes were removed above.
  if(a.names.join()!==b.names.join())throw new Error('Particle transform lists must match');
  for(let i=0;i<a.names.length;i++){
    const name=a.names[i],v=a.values[i].map((n,j)=>n+((b.values[i][j]??n)-n)*k);
    if(name==='translate')matrix.translateSelf(v[0],v[1]??0);
    else if(name==='translateX')matrix.translateSelf(v[0],0);
    else if(name==='translateY')matrix.translateSelf(0,v[0]);
    else if(name==='rotate')matrix.rotateSelf(v[0]);
    else if(name==='scale')matrix.scaleSelf(v[0],v[1]??v[0]);
    else if(name==='scaleX')matrix.scaleSelf(v[0],1);
    else if(name==='scaleY')matrix.scaleSelf(1,v[0]);
  }
  return matrix;
}
const identity = () => parseTransform('none');
function circleRaster(color: string): Sprite {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
  const c=canvas.getContext('2d')!;c.fillStyle=color;c.beginPath();c.arc(32,32,30,0,Math.PI*2);c.fill();
  return {image:canvas,x:-32/30,y:-32/30,w:64/30,h:64/30};
}
export function prepareParticles(board: HTMLElement, smokeDefs?: string): void {
  if(smokeDefs)void prepareSmokeArt(smokeDefs,devicePixelRatio);
  if(banks.has(board))return;
  prepareHtmlParticleArt(innerWidth<=700?Math.min(devicePixelRatio,2):devicePixelRatio);
  prepareWadArt(innerWidth<=700?Math.min(devicePixelRatio,2):devicePixelRatio);
  prepareRingArt(innerWidth<=700?Math.min(devicePixelRatio,2):devicePixelRatio);
  const b: Bank={board,sprites:new Map(COLORS.map(color=>[color,circleRaster(color)])),surfaces:new Map(),items:[],now:0,last:performance.now(),raf:0,paused,drawn:{},seen:{},peak:0,visible:[],nextId:0,diagnostics:(import.meta.env.DEV||import.meta.env.MODE==='e2e')&&new URLSearchParams(location.search).get('particleProbe')!=='0',w:board.clientWidth,h:board.clientHeight,dpr:innerWidth<=700?Math.min(devicePixelRatio,2):devicePixelRatio,resize:new ResizeObserver(()=>{b.w=board.clientWidth;b.h=board.clientHeight;b.dpr=innerWidth<=700?Math.min(devicePixelRatio,2):devicePixelRatio;}),unsubscribe:()=>{}};
  banks.set(board,b);b.resize.observe(board);
  b.unsubscribe=subscribePerf(()=>{
    if(!b.items.length)return;
    advance(b);
    if(perfOff('particles')){
      if(b.raf)cancelAnimationFrame(b.raf);b.raf=0;b.drawn={};b.visible=[];
      for(const s of b.surfaces.values()){s.canvas.style.display='none';s.canvas.remove();}
    }else{draw(b);run(b);}
  });
  if(b.diagnostics)Object.defineProperty(board,'fxParticles',{configurable:true,value:()=>({active:particleCount(board),drawn:{...b.drawn},seen:{...b.seen},visible:b.visible.map(p=>({...p})),peak:b.peak,raf:!!b.raf,paused:b.paused,time:b.now,surfaces:[...b.surfaces.values()].map(s=>({level:s.level,connected:s.canvas.isConnected,width:s.canvas.width,height:s.canvas.height}))})});
}
export function canvasCircle(ctx: FxCtx,host: Element,r: number,color: string,kind='spark',alpha=1): ParticleTarget | null {
  if(!ctx.canvasParticles||perfOff('particles'))return null;
  const sprite=banks.get(ctx.board)?.sprites.get(color);
  return sprite?{particle:true,ctx,host,kind,sprite,scale:r,alpha,animatedAlpha:ctx.svgParticleOpacity?1:undefined}:null;
}
export function canvasHTML(ctx: FxCtx,kind: string): ParticleTarget | null {
  if(!ctx.canvasParticles||perfOff('particles')||!banks.has(ctx.board))return null;
  const sprite=htmlParticleArt(kind);
  const origin=kind==='splinter'?{x:2.5,y:1.5}:kind==='shred'?{x:4,y:3.5}:undefined;
  return sprite?{particle:true,ctx,host:ctx.layer,kind,sprite,scale:1,alpha:1,origin}:null;
}
export function canvasRing(ctx: FxCtx,host: Element,r1: number,s0: number,color: string,width: number): ParticleTarget | null {
  if(ctx.legendParticles)return canvasCircRing(ctx,host,r1,color,width,.4);
  if(!ctx.canvasParticles||perfOff('particles')||!banks.has(ctx.board)||r1>80)return null;
  const sprite=ringArt(color,width*32/r1);
  if(!sprite)return null;
  return {particle:true,ctx,host,kind:'ring',sprite,scale:r1/32,alpha:1,spriteAt:t=>ringArt(color,width*32/Math.max(.01,r1*(s0+(1-s0)*t)))};
}
/** A true circle, not the elliptical water ripple atlas. Stroke stays constant as it grows. */
export function canvasCircRing(ctx: FxCtx,host: Element,radius: number,color: string,width: number,aspect=1): ParticleTarget | null {
  const bank=banks.get(ctx.board);
  if(!ctx.canvasParticles||perfOff('particles')||!bank)return null;
  return {particle:true,ctx,host,kind:'circle-ring',sprite:bank.sprites.values().next().value!,scale:1,alpha:1,ring:{radius,color,width,aspect}};
}
export function canvasMote(ctx: FxCtx,r: number,color: string): ParticleTarget | null {
  if(!ctx.canvasParticles||perfOff('particles')||!banks.has(ctx.board))return null;
  return {particle:true,ctx,host:ctx.layer,kind:'mote',sprite:moteArt(r,color,innerWidth<=700?Math.min(devicePixelRatio,2):devicePixelRatio),scale:1,alpha:1};
}
export function canvasShape(ctx: FxCtx,host: Element,markup: string,kind='particle'): ParticleTarget | null {
  if(!ctx.canvasParticles||perfOff('particles')||!banks.has(ctx.board))return null;
  const sprite=particleArt(markup,innerWidth<=700?Math.min(devicePixelRatio,2):devicePixelRatio);
  // A CSS opacity animation replaces an SVG leaf's presentation opacity; it does not multiply it.
  // Keep the earlier canvas producers unchanged, and preserve that DOM rule for the newly migrated Legends.
  const opaque=ctx.svgParticleOpacity?markup.replace(/^(\s*<[^>]*?)\sopacity="[^"]*"/, '$1'):markup;
  const animatedSprite=opaque!==markup?particleArt(opaque,innerWidth<=700?Math.min(devicePixelRatio,2):devicePixelRatio)??undefined:undefined;
  return sprite?{particle:true,ctx,host,kind,sprite,animatedSprite,spriteAt:t=>wadArt(markup,t),scale:1,alpha:1}:null;
}
export function canvasSmoke(ctx: FxCtx,host: Element,r: number,dark: boolean,filtered: boolean,kind='smoke'): ParticleTarget | null {
  if(!ctx.canvasParticles||perfOff('particles')||!banks.has(ctx.board))return null;
  const fill=dark?'fxSmkD':'fxSmk';
  const plain=particleArt(`<circle r="32" fill="url(#${fill})"/>`,innerWidth<=700?Math.min(devicePixelRatio,2):devicePixelRatio),raster=filtered?smokeArt(fill):plain;
  return raster&&plain?{particle:true,ctx,host,kind,get sprite(){return filtered&&!perfOff('filters')?raster:plain},scale:r/32,alpha:1}:null;
}
export function rememberParticleHost(el: Element,animation: Animation,kf: Keyframe[],easing: string): void {
  // No style/layout reads. This records existing animations, it does not create extra ones.
  const frames=framesOf(kf),list=(hosts.get(el)??[]).filter(a=>a.animation.playState!=='idle'&&a.animation.effect?.getComputedTiming().progress!==null);
  list.push({animation,frames,transforms:frames.some(f=>f.transform!==undefined)?undefined:null,opacity:frames.some(f=>f.opacity!==undefined)?channel(frames,'opacity',Number,1):null,easing:particleEasing(easing)});hosts.set(el,list);
}
function surface(b: Bank,level: Level,layer: HTMLElement): Surface {
  let s=b.surfaces.get(level);
  if(!s){const canvas=document.createElement('canvas');canvas.className='fx-particle-canvas';canvas.dataset.perfParticle='';canvas.dataset.particleLevel=level;canvas.setAttribute('aria-hidden','true');canvas.style.cssText='position:absolute;left:0;top:0;opacity:1;pointer-events:none;will-change:auto;display:none';s={canvas,context:canvas.getContext('2d')!,level};b.surfaces.set(level,s);}
  const {w,h,dpr}=b;
  if(s.canvas.width!==Math.ceil(w*dpr)||s.canvas.height!==Math.ceil(h*dpr)){s.canvas.width=Math.ceil(w*dpr);s.canvas.height=Math.ceil(h*dpr);s.canvas.style.width=w+'px';s.canvas.style.height=h+'px';}
  if(level==='front')s.canvas.style.zIndex='38';
  const host=level==='sea'?b.board.querySelector('.fx-scars')??layer:layer;
  if(!s.canvas.isConnected){s.context.resetTransform();s.context.clearRect(0,0,s.canvas.width,s.canvas.height);host.append(s.canvas);}
  if(s.canvas.style.display!=='block')s.canvas.style.display='block';return s;
}
function ancestorMatrix(host: Element,board: HTMLElement): {matrix: DOMMatrix;alpha: number;live: boolean} {
  let matrix=new DOMMatrix(),alpha=1;
  for(let el: Element|null=host;el&&el!==board;el=el.parentElement){
    const style=(el as HTMLElement).style;
    let local=new DOMMatrix(),opacity=style?.opacity?Number(style.opacity):1;
    if(style?.transform)local=new DOMMatrix(style.transform);
    else if(el instanceof SVGGraphicsElement&&el.hasAttribute('transform')){const m=el.transform.baseVal.consolidate()?.matrix;if(m)local=DOMMatrix.fromMatrix(m);}
    for(const a of hosts.get(el)??[]){
      if(a.animation.playState==='idle'||a.animation.effect?.getComputedTiming().progress==null)continue;
      const timing=a.animation.effect!.getTiming(),current=Number(a.animation.currentTime??0),duration=Number(timing.duration),delay=Number(timing.delay),p=duration?Math.max(0,Math.min(1,(current-delay)/duration)):1,eased=a.easing(p);
      if(a.transforms===undefined)a.transforms=channel(a.frames,'transform',v=>parseTransform(String(v)),identity());
      if(a.transforms)local=matrixAt(a.transforms,eased);
      if(a.opacity)opacity=alphaAt(a.opacity,eased);
    }
    matrix=local.multiply(matrix);alpha*=opacity;
  }
  return {matrix,alpha,live:host.isConnected};
}
function hideEmpty(b: Bank): void {
  for(const s of b.surfaces.values()){s.context.resetTransform();s.context.clearRect(0,0,s.canvas.width,s.canvas.height);if(s.canvas.style.display!=='none')s.canvas.style.display='none';if(s.canvas.isConnected)s.canvas.remove();}
  if(b.raf)cancelAnimationFrame(b.raf);b.raf=0;active.delete(b);
}
function draw(b: Bank): void {
  if(b.diagnostics){b.drawn={};b.visible=[];}
  for(const s of b.surfaces.values())if(s.canvas.isConnected){s.context.resetTransform();s.context.clearRect(0,0,s.canvas.width,s.canvas.height);}
  const frameSurfaces=new Map<Level,Surface>();
  const painted=new Set<Level>();
  const ancestry=new Map<Element,ReturnType<typeof ancestorMatrix>>();
  b.items=b.items.filter(item=>{
    const target=item.target;
    const parent=ancestry.get(target.host)??ancestorMatrix(target.host,b.board);ancestry.set(target.host,parent);
    if(!parent.live){item.finish();return false;}
    const elapsed=b.now-item.start,progress=Math.max(0,Math.min(1,elapsed/item.duration)),t=item.easing(progress);
    const alpha=alphaAt(item.opacity,t)*target.alpha*parent.alpha;
    if(elapsed>=item.duration&&!item.ended){item.ended=true;item.finish();}
    if(item.ended&&alpha<=0)return false;
    if(alpha<=0)return true;
    const level=item.level;
    let s=frameSurfaces.get(level);if(!s){s=surface(b,level,target.ctx.layer);frameSurfaces.set(level,s);}
    const c=s.context;painted.add(level);
    let local=matrixAt(item.transforms,t);
    if(target.origin){const {x,y}=target.origin;local=new DOMMatrix().translate(x,y).multiply(local).translate(-x,-y);}
    const matrix=parent.matrix.multiply(local).scale(target.scale);
    const dpr=b.dpr;
    c.setTransform(dpr*matrix.a,dpr*matrix.b,dpr*matrix.c,dpr*matrix.d,dpr*matrix.e,dpr*matrix.f);
    c.globalAlpha=Math.max(0,Math.min(1,alpha));
    if(target.ring){
      // All circle-ring trajectories use a uniform scale. Compensate that scale, as SVG non-scaling-stroke did.
      const scale=Math.hypot(matrix.a,matrix.b);
      if(scale>0){c.beginPath();c.ellipse(0,0,target.ring.radius,target.ring.radius*target.ring.aspect,0,0,2*Math.PI);c.lineWidth=target.ring.width/scale;c.strokeStyle=target.ring.color;c.stroke();}
    }else{const p=target.spriteAt?.(t)??target.sprite;c.drawImage(p.image,p.x,p.y,p.w,p.h);}
    if(b.diagnostics)b.drawn[target.kind]=(b.drawn[target.kind]??0)+1;
    if(b.diagnostics&&alpha>.05)b.visible.push({id:item.id,kind:target.kind,level,opacity:alpha,x:matrix.e,y:matrix.f});
    return true;
  });
  for(const s of b.surfaces.values())if(!painted.has(s.level)){if(s.canvas.style.display!=='none')s.canvas.style.display='none';if(s.canvas.isConnected)s.canvas.remove();}
  if(!b.items.length)hideEmpty(b);
}
function advance(b: Bank): void {const now=performance.now();if(!b.paused)b.now+=Math.max(0,now-b.last);b.last=now;}
function tick(b: Bank): void {
  b.raf=0;
  if(b.paused)return;
  // Background time is excluded by pauseParticles, not replayed as a large delta on return.
  advance(b);
  draw(b);
  if(!perfOff('particles')&&b.items.some(i=>!i.ended||i.target.host.closest('[data-scar]')))b.raf=requestAnimationFrame(()=>tick(b));
}
function run(b: Bank): void {if(!b.items.length)return;active.add(b);if(!b.paused&&!b.raf&&!perfOff('particles')){advance(b);b.raf=requestAnimationFrame(()=>tick(b));}}
export function animateParticle(target: ParticleTarget,kf: Keyframe[],duration: number,delay: number,easing: string): ParticleAnimation {
  if(kf.some(f=>f.opacity!==undefined)&&(target.animatedSprite||target.animatedAlpha!==undefined))target={...target,sprite:target.animatedSprite??target.sprite,alpha:target.animatedAlpha??target.alpha};
  const b=banks.get(target.ctx.board)!;
  advance(b);b.paused=paused;
  let finish!:()=>void;const finished=new Promise<void>(resolve=>{finish=resolve;});
  const frames=framesOf(kf);
  let canceled=false;
  const item: Item={target,start:b.now+delay,duration:Math.max(1,duration),easing:particleEasing(easing),transforms:channel(frames,'transform',v=>parseTransform(String(v)),identity()),opacity:channel(frames,'opacity',Number,1),finish,ended:false,id:++b.nextId,level:target.host.closest('.fx-scars')?'sea':Number((target.host as HTMLElement).style?.zIndex)>=38?'front':'top',handle:{finished,cancel:()=>{canceled=true;b.items=b.items.filter(i=>i!==item);finish();draw(b);},get playState(){return canceled?'idle':item.ended?'finished':b.paused?'paused':'running';}}};
  b.items.push(item);if(b.diagnostics){b.seen[target.kind]=(b.seen[target.kind]??0)+1;b.peak=Math.max(b.peak,particleCount(b.board));}run(b);return item.handle;
}
export function particleCount(board: HTMLElement): number {const b=banks.get(board);if(!b)return 0;advance(b);return b.items.filter(i=>b.now<i.start+i.duration&&i.target.host.isConnected).length;}
export function pauseParticles(value: boolean): void {
  paused=value;
  for(const b of active){if(b.paused===value)continue;advance(b);if(value){if(b.raf)cancelAnimationFrame(b.raf);b.raf=0;}b.paused=value;if(!value)run(b);}
}
export function clearParticles(board: HTMLElement,all=false): void {
  const b=banks.get(board);if(!b)return;
  b.items=b.items.filter(i=>{if(!all&&i.target.host.isConnected&&i.target.host.closest('.fx-scars')&&!i.target.host.closest('.fx-temp'))return true;i.finish();return false;});
  draw(b);
}
export function disposeParticles(board: HTMLElement): void {const b=banks.get(board);if(!b)return;clearParticles(board,true);hideEmpty(b);b.resize.disconnect();b.unsubscribe();banks.delete(board);delete (board as HTMLElement & {fxParticles?: unknown}).fxParticles;}
