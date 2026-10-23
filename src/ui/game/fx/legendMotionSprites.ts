// Detached, size-keyed Legend motion art. SVG geometry is static; HTML wrappers carry the clocks.
import {uidSvg} from '../art/bigShips';
import {TENT,compassArt} from '../art/legendArt';
import {bx,plank,boardW,boardH,filters,type FxCtx} from './primitives';
import {spriteReady,warmSprites,type SpriteSpec} from './sprites';
import {legendSprite} from './legendSprites';
import {perfWorkHook} from '../perf/clip';
const R1=(n:number)=>Math.round(n*10)/10;
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
export const motionKey=(b:{w:number;h:number})=>`${clamp(b.w/480,.5,1)}:${R1(clamp(Math.min(b.h*.9,b.w*.35),56,80))}`;
export function motionSignature(ctx:FxCtx){return ctx.data.ships.map(s=>{const b=bx(ctx,plank(ctx,s.code));return motionKey(b);}).join('/')+':'+filters(ctx)+':'+boardW(ctx)+':'+boardH(ctx);}
let uid=0;
const svg=(x:number,y:number,w:number,h:number,art:string)=>`<svg aria-hidden="true" width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}" style="left:${x}px;top:${y}px">${uidSvg(art,`motion${++uid}`)}</svg>`;
export function motionSpecs(ctx:FxCtx,previous?:{w:number;h:number}):SpriteSpec[]{
 const specs:SpriteSpec[]=[{key:'legend-motion-group',count:5,html:''}];
 const seen=new Set<string>(),W=boardW(ctx),H=boardH(ctx);
 const boxes=ctx.data.ships.map(ship=>bx(ctx,plank(ctx,ship.code)));
 for(const b of [...boxes,...previous?[previous]:[]]){
  const key=motionKey(b);if(seen.has(key))continue;seen.add(key);
  const ks=clamp(b.w/480,.5,1),r=R1(clamp(Math.min(b.h*.9,b.w*.35),56,80)),gs=r/80;
  const add=(name:string,html:string,count=1)=>specs.push({key:`motion-${key}-${name}`,html,count});
  add('eye',svg(-42,-22,84,44,'<g><ellipse rx="40" ry="20" fill="#06100c" opacity=".8"/><ellipse rx="34" ry="16" fill="#0a1a14"/><ellipse rx="26" ry="11" fill="#f2c94c" stroke="#3a2a0c" stroke-width="1.4"/><ellipse rx="3.4" ry="10" fill="#060606"/><circle cx="-8" cy="-4" r="2.4" fill="#fff" opacity=".8"/></g>'));
  for(const rich of [false,true])add(`shadow-${rich}`,svg(-250,-90,500,180,`<defs><filter id="lgKrBlurMotion"><feGaussianBlur stdDeviation="8"/></filter></defs>`+`<g ${rich ? `filter="url(#lgKrBlurMotion)"` : ''} opacity=".75"><ellipse cx="0" cy="0" rx="130" ry="42" fill="#020806"/>${[-1, 1].map((s) => [0, 1, 2].map((i) => `<path d="M${s * 90} ${-10 + i * 12} q${s * 60} ${-20 + i * 20} ${s * 120} ${10 + i * 6}" stroke="#020806" stroke-width="${14 - i * 3}" fill="none" stroke-linecap="round"/>`).join('')).join('')}</g>`));
  add('dark',svg(-332,-112,664,224,`<defs><radialGradient id="krDeepMotion"><stop offset="0" stop-color="#05140f" stop-opacity=".85"/><stop offset=".6" stop-color="#0c2a22" stop-opacity=".55"/><stop offset="1" stop-color="#0c2a22" stop-opacity="0"/></radialGradient></defs><ellipse rx="${R1(Math.min(330,b.w*.75))}" ry="110" fill="url(#krDeepMotion)"/>`));
  for(const k of [1.3,1.15])for(const fl of [false,true])add(`arm-${k}-${fl}`,svg(-80,-240,160,260,`<g transform="scale(${fl?-1:1} 1)">${TENT('motionArm',k*ks,1.5)}</g>`));
  add('grip',`<div class="gin" data-sprite-node="grip">${svg(-65,-160,130,180,TENT('motionGrip',.92,1.35*Math.max(.6,ks)))}</div>`,3);
  for(const rich of [false,true])add(`ink-${rich}`,svg(-600,-180,1200,360,`${rich?'<defs><filter id="motionInk" x="-50%" y="-50%" width="200%" height="200%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="26"/><feGaussianBlur stdDeviation="2"/></filter></defs>':''}<g class="lg-ink" ${rich?'filter="url(#motionInk)"':''}>${Array.from({length:7},()=>'<ellipse fill="#08100e" opacity=".7"/>').join('')}</g>`));
  const dom=new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${compassArt('motion',r)}</svg>`,'image/svg+xml');
  const root=dom.documentElement,nd=root.querySelector('.nd')!,above:Element[]=[];for(let e=nd.nextElementSibling;e;e=e.nextElementSibling)above.push(e);
  const needle=nd.outerHTML,cover=above.map(e=>e.outerHTML).join(''),defs=root.querySelector('defs')!.outerHTML;nd.remove();above.forEach(e=>e.remove());
  add('compass',svg(-r*1.3,-r*1.4,r*2.6,r*2.8,root.innerHTML)+`<div class="nd" data-sprite-node="needle">${svg(-r,-r,r*2,r*2,defs+needle.replace('class="nd"',''))}</div>`+svg(-r,-r,r*2,r*2,defs+cover));
  const aura=`<g><defs><radialGradient id="lgJkAMotion"><stop offset="0" stop-color="#ffe7a4" stop-opacity=".75"/><stop offset=".55" stop-color="#ffd27a" stop-opacity=".25"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
      <radialGradient id="lgJkRMotion"><stop offset=".35" stop-color="#fff2c8" stop-opacity=".5"/><stop offset="1" stop-color="#fff2c8" stop-opacity="0"/></radialGradient></defs><circle r="${R1(150 * gs)}" fill="url(#lgJkAMotion)"/><g class="ry" fill="url(#lgJkRMotion)">${Array.from({ length: 12 }, (_, i) => { const a1 = (i * Math.PI) / 6, a2 = a1 + 0.09; return `<path d="M0 0 L${R1(Math.cos(a1) * 170 * gs)} ${R1(Math.sin(a1) * 170 * gs)} L${R1(Math.cos(a2) * 170 * gs)} ${R1(Math.sin(a2) * 170 * gs)} Z"/>`; }).join('')}</g></g>`;
  const ad=new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${aura}</svg>`,'image/svg+xml').documentElement;
  const rays=ad.querySelector('.ry')!,rayArt=rays.outerHTML,rayDefs=ad.querySelector('defs')!.outerHTML;rays.remove();
  add('aura',svg(-180*gs,-180*gs,360*gs,360*gs,ad.innerHTML)+`<div class="ry" data-sprite-node="rays">${svg(-180*gs,-180*gs,360*gs,360*gs,rayDefs+rayArt.replace('class="ry"',''))}</div>`);
  add('drops',svg(0,-50,b.w,b.h+50,`<g>${Array.from({length:14},()=>'<ellipse rx="1.6" ry="2.6" fill="#dff4f8" opacity=".9"/>').join('')}</g>`));
  add('course',svg(0,0,W,H,'<path fill="none" stroke="#ffd27a" stroke-width="3" stroke-dasharray="10 8"/>'));
 }
 return specs;
}

/** Usually just takes a detached instance. A rotation during an entrance may precede idle warmup;
 * prepare that missing geometry without pruning unrelated/active pools, rather than drop the effect.
 */
export function motionSticker(ctx:FxCtx,host:Element,b:{w:number;h:number},name:string):HTMLElement {
 const key=name==='group'?'legend-motion-group':`motion-${motionKey(b)}-${name==='shadow'||name==='ink'?name+'-'+filters(ctx):name}`;
 if(!spriteReady(ctx.board,key)){
  const end=perfWorkHook?.('prepare: создание motion после resize');
  try{warmSprites(ctx.board,motionSpecs(ctx,b),true);}finally{end?.();}
 }
 const root=legendSprite(ctx,host,key);if(!root)throw Error(`Unprepared motion sticker: ${key}`);return root;
}
