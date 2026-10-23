// A reduced Maelstrom: weather.ts's six logarithmic arms, funnel rings and palette.
// Prepared off-document; the only motion is an HTML rotation inside a static sea squash.
import {type FxCtx} from './primitives';
import {spriteA,spriteReady,takeSprite,warmSprites,type SpriteSpec} from './sprites';
const R=(n:number)=>Math.round(n*10)/10;
const arms=[0,1.05,2.1,3.15,4.2,5.25].map((a0,i)=>{
 const d=Array.from({length:141},(_,j)=>{const t=j/140,r=42*Math.pow(1.4/42,t),a=a0+t*2.2*Math.PI*2;return `${j?'L':'M'}${R(Math.cos(a)*r)} ${R(Math.sin(a)*r)}`}).join(' ');
 return `<path d="${d}" fill="none" stroke="#cfe8ef" stroke-width="${i%2?.28:.48}" stroke-linecap="round" stroke-dasharray="5.2 3.6" opacity="${i%2?.55:.85}"/>`;
}).join('');
export const reactionWhirlSpec:SpriteSpec={key:'reaction-maelstrom',count:2,html:`
<svg class="reaction-whirl-base" aria-hidden="true" viewBox="-50 -27.5 100 55"><defs><radialGradient id="reactionMael"><stop offset="0" stop-color="#06141a"/><stop offset=".18" stop-color="#0f2a35"/><stop offset=".55" stop-color="#1d4656" stop-opacity=".8"/><stop offset="1" stop-color="#2a5a6c" stop-opacity="0"/></radialGradient></defs>
<ellipse rx="50" ry="18" fill="url(#reactionMael)"/>
${Array.from({length:7},(_,i)=>{const k=1-i/7.5;return `<ellipse cy="${R(i*.64)}" rx="${R(40*k)}" ry="${R(14.5*k)}" fill="#0a1e27" opacity="${R(.1+i*.06)}" stroke="#7fb2c4" stroke-width=".12" stroke-opacity="${R(.5-i*.05)}"/>`}).join('')}
<ellipse rx="43" ry="15.5" fill="none" stroke="#eef6f8" stroke-width=".52" stroke-dasharray=".8 1.4 2.8 1.8" opacity=".75"/></svg>
<div class="reaction-whirl-squash"><div class="reaction-whirl-spin" data-sprite-node="spin"><svg aria-hidden="true" viewBox="-50 -50 100 100">${arms}</svg></div></div>
<svg class="reaction-whirl-base" aria-hidden="true" viewBox="-50 -27.5 100 55"><ellipse rx="3.2" ry="1.2" fill="#030a0d"/></svg>`};
export function reactionWhirl(ctx:FxCtx,x:number,y:number,delay:number,size:number,dur:number):HTMLElement {
 // Resize during an already playing scene can beat idle preparation. Never animate SVG as a fallback.
 if(!spriteReady(ctx.board,reactionWhirlSpec.key))warmSprites(ctx.board,[reactionWhirlSpec],true);
 const s=takeSprite(ctx,reactionWhirlSpec.key),w=s.root;
 w.classList.add('whirl','reaction-whirl');
 w.style.width=size+'px';w.style.height=size*.55+'px';
 w.style.margin=`-${size*.275}px 0 0 -${size/2}px`;
 spriteA(ctx,w,[{opacity:0,transform:`translate(${x}px,${y}px) scale(.2)`},{opacity:1,transform:`translate(${x}px,${y}px) scale(1)`}],500,delay,'ease-out','forwards');
 if(ctx.rich){const turns=dur?Math.ceil(dur/1800):6;spriteA(ctx,s.node('spin'),[{transform:'rotate(0deg)'},{transform:`rotate(${-360*turns}deg)`}],1800*turns,delay,'linear','none');}
 return w;
}
