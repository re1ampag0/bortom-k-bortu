// Layout corrections only; no game state, card selection or animation clocks.
import {gameScaleEnabled,gameViewport,subscribeGameViewport,gameGeometry} from './layout';
const put=(el:HTMLElement,key:string,value:string)=>{if(el.style.getPropertyValue(key)!==value)el.style.setProperty(key,value);};
export function fitGame(game:HTMLElement):()=>void{
 if(!gameScaleEnabled())return()=>{};
 game.dataset.gameScale='1';let live=true,wrappedAt=0;
 const clipped=new Set<HTMLElement>(),compacted=new Set<HTMLElement>();let previousWidth=0,previousSide='';
 const measure=()=>{
  if(!live||!game.isConnected)return;
  const view=gameViewport(),phone=view.w<=700;
  const geometry=gameGeometry(view);
  put(game,'--game-visible-h',phone?`${geometry.phoneScene?650:view.h}px`:'auto');
  game.toggleAttribute('data-game-downscaled',geometry.small);
  document.body.toggleAttribute('data-game-shrunk',geometry.small);
  const busy=game.hasAttribute('data-fx-busy'),side=game.dataset.bottom??'';
  if(!phone||!busy&&(previousWidth!==view.w||previousSide!==side)){
   for(const b of compacted){b.style.removeProperty('width');b.style.removeProperty('min-width');b.removeAttribute('data-game-compact');}compacted.clear();game.removeAttribute('data-game-regroup-wrap');wrappedAt=0;previousWidth=view.w;previousSide=side;
  }
  if(!phone){
   const note=game.querySelector<HTMLElement>('.hand-note'),bottom=game.querySelector('.board-bottom'),sea=game.querySelector('.sea-table');
   if(note&&bottom&&sea&&!busy){
    const b=bottom.getBoundingClientRect(),s=sea.getBoundingClientRect(),cards=[...game.querySelectorAll('.hand-cards:not(.lift-host)>.hcard')].map(e=>e.getBoundingClientRect());
    const top=Math.min(...cards.map(r=>r.top)),left=(Math.min(...cards.map(r=>r.left))+Math.max(...cards.map(r=>r.right)))/2;
    if(cards.length){put(note,'top',`${((s.bottom+top)/2-b.top)/geometry.k-9}px`);put(note,'left',`${(left-b.left)/geometry.k}px`);}
   }
   for(const label of clipped){label.style.removeProperty('background');label.style.removeProperty('box-shadow');}clipped.clear();return;}
  if(busy)return;
  const frame=game.getBoundingClientRect();
  const row=game.querySelector<HTMLElement>('.board-bottom>.team-row');
  if(row){
   if(game.hasAttribute('data-game-regroup-wrap')&&wrappedAt!==view.w)game.removeAttribute('data-game-regroup-wrap');
   if(!game.hasAttribute('data-game-regroup-wrap')){
    const element=row.querySelector<HTMLElement>('.regroup'),button=element?.getBoundingClientRect();
    if(element&&button&&button.width>0&&button.height>0){
     const overflow=(button.right-Math.min(view.w,frame.right))/geometry.k;
     if(overflow>0&&overflow<=24){element.setAttribute('data-game-compact','');put(element,'min-width','0px');put(element,'width',`${button.width/geometry.k-overflow}px`);compacted.add(element);}
     else if(overflow>24||button.left<0){game.setAttribute('data-game-regroup-wrap','');wrappedAt=view.w;}
    }
   }
  }
  game.removeAttribute('data-game-hand-scroll');
  for(const label of game.querySelectorAll<HTMLElement>('.board-bottom .hold-label,.phone-hand-label')){
   put(label,'background','transparent');put(label,'box-shadow','none');clipped.add(label);
  }
 };
 const ro=new ResizeObserver(measure);ro.observe(game);
 for(const el of game.querySelectorAll('.board-bottom,.hand-cards'))ro.observe(el);
 const mo=new MutationObserver(records=>{if(records.some(r=>r.type==='attributes'||!(r.target instanceof Element)||!r.target.closest('.fx-layer,.fx-scars')))measure();});mo.observe(game,{childList:true,subtree:true,attributes:true,attributeFilter:['data-fx-busy']});
 const resized=()=>queueMicrotask(measure);
 const off=subscribeGameViewport(resized);window.addEventListener('resize',resized);void document.fonts.ready.then(()=>{if(live)measure();});measure();
 return()=>{live=false;ro.disconnect();mo.disconnect();off();window.removeEventListener('resize',resized);for(const el of clipped){el.style.removeProperty('background');el.style.removeProperty('box-shadow');}for(const b of compacted){b.style.removeProperty('width');b.style.removeProperty('min-width');b.removeAttribute('data-game-compact');}document.body.removeAttribute('data-game-shrunk');delete game.dataset.gameDownscaled;delete game.dataset.gameShort;delete game.dataset.gameScale;delete game.dataset.gameRegroupWrap;delete game.dataset.gameHandScroll;game.style.removeProperty('--game-visible-h');};
}
