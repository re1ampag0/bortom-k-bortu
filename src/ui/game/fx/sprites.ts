// Detached vector templates and bounded instance pools. No hidden/offscreen DOM, canvas, RAF or idle painting.
import {perfWorkHook} from '../perf/clip';
import {A, at, type FxCtx} from './primitives';
export interface SpriteSpec { key: string; html: string; count: number }
interface Pool { template: HTMLElement; free: HTMLElement[]; count: number }
interface Bank { storage: DocumentFragment; pools: Map<string,Pool>; active: Map<HTMLElement,Sprite>; observer: MutationObserver }
export interface Sprite { root: HTMLElement; node: (name:string)=>HTMLElement; release: ()=>void }
const banks = new WeakMap<HTMLElement,Bank>();
const animations = new WeakMap<HTMLElement,Set<Animation>>();
let uid = 0;
function bankFor(board:HTMLElement):Bank {
 let bank=banks.get(board);
 if(!bank){
  const observer=new MutationObserver(records=>{
   if(records.some(r=>r.removedNodes.length))for(const s of [...banks.get(board)?.active.values()??[]])if(!s.root.isConnected)s.release();
  });
  bank={storage:board.ownerDocument.createDocumentFragment(),pools:new Map(),active:new Map(),observer};banks.set(board,bank);
  board.querySelectorAll(':scope > .fx-layer, :scope > .fx-scars').forEach(host=>observer.observe(host,{childList:true}));
 }
 return bank;
}
function clone(template:HTMLElement):HTMLElement {
 const root=template.cloneNode(true) as HTMLElement, suffix=`_sprite${++uid}`,ids=new Map<string,string>();
 for(const el of root.querySelectorAll('[id]')){const id=el.id;ids.set(id,id+suffix);el.id=id+suffix}
 for(const el of root.querySelectorAll('*'))for(const attr of [...el.attributes]){
  const value=attr.value.replace(/url\(#([^)]+)\)/g,(all,id:string)=>ids.has(id)?`url(#${ids.get(id)})`:all);
  if(value!==attr.value)el.setAttribute(attr.name,value);
 }
 return root;
}
/** Called before play, while opening the table or after a resize in idle. */
export function warmSprites(board:HTMLElement,specs:SpriteSpec[],retain=false):void {
  const perfEnd=perfWorkHook?.('prepare: sprite pool');
  try {
 const bank=bankFor(board),keys=new Set(specs.map(s=>s.key));
 for(const [key,pool]of bank.pools)if(!retain&&!keys.has(key)&&![...bank.active.values()].some(s=>s.root.dataset.sprite===key)){
  pool.free.forEach(el=>el.remove());pool.template.remove();bank.pools.delete(key);
 }
 for(const spec of specs){
  if(bank.pools.has(spec.key))continue;
  const perfCreate=perfWorkHook?.('prepare: создание пула '+spec.key);
  const template=board.ownerDocument.createElement('div');template.className='fx-sprite';template.dataset.sprite=spec.key;template.innerHTML=spec.html;
  bank.storage.append(template);const free=Array.from({length:spec.count},()=>clone(template));free.forEach(el=>bank.storage.append(el));
  bank.pools.set(spec.key,{template,free,count:spec.count});perfCreate?.();
 }
  } finally {perfEnd?.();}
}
export function spriteReady(board:HTMLElement,key:string):boolean{return !!banks.get(board)?.pools.get(key)?.free.length}
/** Taking a prepared instance never parses SVG or grows the pool. */
export function takeSprite(ctx:FxCtx,key:string,host:Element=ctx.layer):Sprite {
  const perfEnd=perfWorkHook?.('вставка заготовки');
  try {
 const bank=bankFor(ctx.board),pool=bank.pools.get(key),root=pool?.free.pop();
 if(!pool||!root)throw new Error(`Unprepared/exhausted sprite: ${key}`);
 const sprite:Sprite={root,node:name=>{const el=root.querySelector<HTMLElement>(`[data-sprite-node="${name}"]`);if(!el)throw new Error(`Sprite node: ${name}`);return el},release:()=>{
  if(bank.active.get(root)!==sprite)return;
  for(const child of root.querySelectorAll<HTMLElement>('.fx-sprite'))bank.active.get(child)?.release();
  bank.active.delete(root);
  for(const el of [root,...root.querySelectorAll<HTMLElement>('[data-sprite-node]')]){
   for(const animation of animations.get(el)??[])animation.cancel();animations.delete(el);el.removeAttribute('style');
  }
  root.className='fx-sprite';
  root.removeAttribute('data-scar');root.removeAttribute('data-owner');root.removeAttribute('data-gone');root.removeAttribute('data-perf-particle');
  bank.storage.append(root);pool.free.push(root);
 }};
 bank.active.set(root,sprite);host.append(root);return sprite;
  } finally {perfEnd?.();}
}
/** Only wrapper transforms/opacity animate; all SVG geometry remains static. */
export function spriteA(ctx:FxCtx,el:HTMLElement,frames:Keyframe[],duration:number,delay=0,easing='ease-out',fill:FillMode='both'):Animation {
 if(frames.some(frame=>Object.keys(frame).some(k=>!['transform','opacity','offset','easing','composite'].includes(k))))throw new Error('Sprite animation must use transform/opacity only');
 const set=animations.get(el)??new Set<Animation>();animations.set(el,set);
 const animation=A(ctx,el,frames,duration,delay,easing,fill);set.add(animation);
 const promote=()=>{if(set.has(animation)&&animation.playState!=='finished'&&animation.playState!=='idle')el.style.willChange='transform, opacity'};
 if(delay)at(ctx,delay,promote);else promote();
 const done=()=>{set.delete(animation);if(animations.get(el)===set&&!set.size)el.style.willChange='auto'};
 void animation.finished.then(done,done);return animation;
}
export function releaseSprites(board:HTMLElement,includeTraces=false,keep:ReadonlySet<Element>=new Set()):void {
 const bank=banks.get(board);if(!bank)return;
 for(const s of [...bank.active.values()])if(!keep.has(s.root)&&(includeTraces||s.root.closest('.fx-layer')||s.root.classList.contains('fx-temp')||!s.root.isConnected))s.release();
}
export function spritePause(board:HTMLElement,paused:boolean):void {
 for(const s of banks.get(board)?.active.values()??[])for(const el of [s.root,...s.root.querySelectorAll<HTMLElement>('[data-sprite-node]')]){
  el.style.willChange=paused?'auto':(animations.get(el)?.size?'transform, opacity':'auto');
 }
}
/** Read-only diagnostics; templates and free instances must all remain disconnected. */
export function spritePoolStats(board:HTMLElement) {
 const bank=banks.get(board);return{types:bank?.pools.size??0,active:bank?.active.size??0,free:[...(bank?.pools.values()??[])].reduce((n,p)=>n+p.free.length,0),
  preparedNodes:bank?.storage.querySelectorAll('*').length??0,connectedPrepared:[...(bank?.pools.values()??[])].some(p=>p.template.isConnected||p.free.some(el=>el.isConnected))};
}

export function disposeSprites(board:HTMLElement):void {
 releaseSprites(board,true);banks.get(board)?.observer.disconnect();banks.delete(board);
}
