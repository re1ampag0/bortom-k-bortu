// Temporary, explicit A/B review only. No production setting until the user chooses a variant.
import type {Term} from '../../../engine/state';
import type {Track} from '../../../engine/types';
import {boardW,bx,gapBox,plank,trackEl,type FxCtx} from './primitives';
export function plateReviewMode():'A'|'B'|null {
 if(!(import.meta.env.DEV||import.meta.env.MODE==='e2e'))return null;
 const mode=new URLSearchParams(location.search).get('plateReview');
 return mode==='A'||mode==='B'?mode:null;
}
const esc=(s:string)=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]!);
export function reviewPlateHTML(terms:Term[]|null|undefined,damage:number,track:Track):string {
 const mode=plateReviewMode();
 const shown=terms?.length?terms:[{what:'Залп',n:damage}];
 const parts=(mode==='B'?shown.filter(t=>t.what!=='Пушки'&&t.what!=='Залп'):shown).map((t,i)=>{
  const label=t.what==='Пушки'?'Залп':t.what;
  return `<span class="review-term ${t.n<0?'negative':''}">${esc(label)} <b>${t.n<0?'−'+-t.n:(i||mode==='B'?'+' : '')+t.n}</b></span>`;
 }).join('<span class="review-separator">·</span>');
 const total=`<strong class="review-total" data-track="${track}">${mode==='A'?'=':'−'} ${damage}</strong>`;
 return `<div class="review-parts">${parts}</div>${total}`;
}
export function fitReviewPlate(ctx:FxCtx,plate:HTMLElement,target:string):boolean {
 const mode=plateReviewMode();if(!mode)return false;
 // All anchor reads precede writes. The total for B sits beside the actual displayed track.
 const g=gapBox(ctx),sea=ctx.board.querySelector('.sea-table'),water=sea?bx(ctx,sea):{x:0,r:boardW(ctx)};
 const ship=bx(ctx,plank(ctx,target)),track=plate.querySelector<HTMLElement>('.review-total')?.dataset.track as Track|undefined;
 const value=mode==='B'&&track?bx(ctx,trackEl(ctx,target,track)):null;
 plate.classList.remove('compact');plate.classList.add('plate-review');plate.dataset.review=mode;
 const edge=boardW(ctx)<701?8:14,w=mode==='A'?Math.min(700,water.r-water.x-2*edge):ship.w;
 const x=mode==='A'?(water.x+water.r-w)/2:ship.x;
 const y=mode==='A'?g.cy-15:ship.cy<g.cy?ship.b+35:ship.y-60;
 Object.assign(plate.style,{left:x+'px',top:y+'px',width:w+'px'});
 if(value){plate.style.setProperty('--total-x',value.r-x-25+'px');plate.style.setProperty('--total-y',(ship.cy<g.cy?ship.b+5:ship.y-26)-y+'px');}
 return true;
}
