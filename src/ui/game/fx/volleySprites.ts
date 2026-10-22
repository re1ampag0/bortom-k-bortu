// Original Volley SVG art, prepared off-document; only HTML wrappers animate.
import {boardW, A, ignoreFxBudget, particleDefs, type FxCtx, type Pt} from './primitives';
import type {ParticleTarget} from './particles';
import {scar} from './scars';
import {spriteA,spriteReady,takeSprite,type SpriteSpec} from './sprites';
const R1=(v:number)=>Math.round(v*10)/10;
export type ShotArt='ball'|'shadow'|'glow'|'cone'|'blast'|'shock'|'board'|'flotsam';
export function shotArt(kind:ShotArt,k=1):string {
 const K=(n:number)=>R1(n*k);
 switch(kind){
 case 'ball':return '<g class="ball-svg ball"><circle r="5" fill="#1a1714"/><circle cx="-1.4" cy="-1.6" r="1.7" fill="#9a948b"/></g>';
 case 'shadow':return '<ellipse rx="5" ry="2" fill="#000" opacity=".3"/>';
 case 'glow':return `<circle r="${K(90)}" fill="url(#fxGlow)"/>`;
 case 'cone':return `<g class="gun-fire"><ellipse cx="${K(44)}" cy="0" rx="${K(60)}" ry="${K(26)}" fill="url(#fxGlow)"/>
<path d="M0 -${K(7)} C${K(20)} -${K(26)} ${K(62)} -${K(20)} ${K(92)} 0 C${K(62)} ${K(20)} ${K(20)} ${K(26)} 0 ${K(7)} Z" fill="url(#fxCone)"/>
<path d="M0 -${K(4)} C${K(16)} -${K(12)} ${K(40)} -${K(8)} ${K(60)} 0 C${K(40)} ${K(8)} ${K(16)} ${K(12)} 0 ${K(4)} Z" fill="#fff6d0"/>
<path d="M2 0 L${K(22)} -${K(26)} L${K(16)} -${K(7)} Z M2 0 L${K(22)} ${K(26)} L${K(16)} ${K(7)} Z M2 0 L-${K(8)} -${K(14)} L${K(4)} -${K(4)} Z M2 0 L-${K(8)} ${K(14)} L${K(4)} ${K(4)} Z" fill="#ffc35a"/>
<circle r="${K(22)}" fill="url(#fxFire)"/><circle r="${K(8)}" fill="#fff"/></g>`;
 case 'blast':return `<circle r="${K(26)}" fill="url(#fxFire)"/>`;
 case 'shock':return `<circle r="${K(56)}" fill="none" stroke="#ffe7a4" stroke-width="${K(3)}"/>`;
 case 'board':return '<g><rect x="-9" y="-2.6" width="18" height="5.2" rx="1" fill="#a8703a" stroke="#3a2412" stroke-width=".7"/><path d="M-6 -2.6 V2.6 M3 -2.6 V2.6" stroke="#6b4422" stroke-width=".6"/></g>';
 case 'flotsam':return `<g><ellipse cx="0" cy="3" rx="13" ry="3" fill="none" stroke="#e6f2f4" stroke-width="1" opacity=".7"/>${shotArt('board').replace(/^<g>|<\/g>$/g,'')}<path d="M9 -2.6 l2 1 l-2 1.2 l2 1.4" fill="none" stroke="#3a2412" stroke-width=".6"/></g>`;
 }
}
const key=(kind:ShotArt,k:number)=>`volley-${kind}-${k}`;
export const volleySize=(ctx:FxCtx)=>Math.min(1.05,Math.max(.6,boardW(ctx)/1300));
export function volleySpriteSpecs(ctx:FxCtx):SpriteSpec[]{
 const k=volleySize(ctx),specs:SpriteSpec[]=[];
 const add=(kind:ShotArt,scale:number,radius:number,count:number)=>{
  // A's opacity replaces the old ellipse's presentation opacity; it must not multiply it.
  const body=kind==='shadow'?shotArt(kind,scale).replace(' opacity=".3"',''):shotArt(kind,scale);
  const r=radius*scale+2,art=`<svg aria-hidden="true" width="${2*r}" height="${2*r}" viewBox="${-r} ${-r} ${2*r} ${2*r}" style="left:${-r}px;top:${-r}px">${particleDefs(false)}${body}</svg>`;
  specs.push({key:key(kind,scale),count,html:kind==='flotsam'?`<div class="volley-float-rotate" data-sprite-node="rock"><div class="volley-float-heave" data-sprite-node="heave">${art}</div></div>`:art});
 };
 for(const n of new Set([k,.7,.62])){add('glow',n,90,n===.62?32:16);add('cone',n,110,n===.62?32:16);}
 for(const n of new Set([k*1.1,.8,.55])){add('blast',n,26,24);add('shock',n,59,24);}
 add('ball',1,6,32);add('shadow',1,6,32);add('flotsam',1,15,4);
 return specs;
}
const planes=new WeakMap<Element,HTMLElement>();
export function shotSprite(ctx:FxCtx,svg:Element,kind:ShotArt,k=1):HTMLElement|null {
 if(!ctx.volleySprites)return null;
 if(!spriteReady(ctx.board,key(kind,k))){ctx.layer.dataset.volleyFallback='1';return null;}
 ctx.layer.dataset.volleyRenderer='stickers';
 let plane=planes.get(svg);
 if(!plane?.isConnected){
  plane=document.createElement('div');plane.className='volley-sprite-plane';
  plane.style.zIndex=(svg as SVGElement).style.zIndex;svg.after(plane);planes.set(svg,plane);
 }
 const sprite=takeSprite(ctx,key(kind,k),plane);sprite.root.dataset.volleyArt=kind;
 return sprite.root;
}
/** Same A clock; retain instances until clip cleanup, including invisible balls counted by ricochet checks. */
export function shotA(ctx:FxCtx,el:Element|ParticleTarget,frames:Keyframe[],d:number,delay=0,easing='ease-out',fill:FillMode='both'){
 if(!('particle' in el)&&el instanceof HTMLElement&&el.dataset.volleyArt){
  const animation=spriteA(ctx,el,frames,d,delay,easing,fill);
  if(Number(frames.at(-1)?.opacity)===0)void animation.finished.then(()=>{
   if(el.isConnected&&ctx.run===ctx.live()){el.style.opacity='0';animation.cancel();}
  },()=>{});
  return animation;
 }
 return A(ctx,el,frames,d,delay,easing,fill);
}
/** Original post-impact trace: SMIL's two additive transforms become two HTML CSS wrappers.
 * Like the original SMIL, these quiet trace loops use wall time, not the clip's speed factor. */
export function floatBoardSprite(ctx:FxCtx,host:Element,code:string,p:Pt,rock:boolean):boolean {
 if(!ctx.volleySprites||!spriteReady(ctx.board,key('flotsam',1)))return false;
 const sprite=takeSprite(ctx,key('flotsam',1),host);
 sprite.root.classList.add('volley-flotsam');if(rock)sprite.root.classList.add('volley-float-moving');
 sprite.root.style.transform=`translate(${R1(p.x)}px,${R1(p.y)}px) scale(1.4)`;
 scar(sprite.root,'long',code);
 if(rock)for(const a of sprite.root.getAnimations({subtree:true}))ignoreFxBudget(a);
 return true;
}
