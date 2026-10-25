// Layout corrections only; no game state, card selection or animation clocks.
import {gameScaleEnabled,gameViewport,subscribeGameViewport} from './layout';
const put=(el:HTMLElement,key:string,value:string)=>{if(el.style.getPropertyValue(key)!==value)el.style.setProperty(key,value);};
export function fitGame(game:HTMLElement):()=>void{
 if(!gameScaleEnabled())return()=>{};
 game.dataset.gameScale='1';let live=true,wrappedAt=0;
 const clipped=new Set<HTMLElement>(),compacted=new Set<HTMLElement>();let previousWidth=0;
 const measure=()=>{
  if(!live||!game.isConnected)return;
  const view=gameViewport(),phone=view.w<=700;
  put(game,'--game-visible-h',phone?`${view.h}px`:'auto');
  if(previousWidth!==view.w){for(const b of compacted){b.style.removeProperty('width');b.style.removeProperty('min-width');b.removeAttribute('data-game-compact');}compacted.clear();previousWidth=view.w;}
  if(!phone||game.hasAttribute('data-fx-busy'))return;
  const row=game.querySelector<HTMLElement>('.board-bottom>.team-row'),hand=game.querySelector<HTMLElement>('.hand-cards:not(.lift-host)');
  if(row){
   if(game.hasAttribute('data-game-regroup-wrap')&&wrappedAt!==view.w)game.removeAttribute('data-game-regroup-wrap');
   if(!game.hasAttribute('data-game-regroup-wrap')){
    const element=row.querySelector<HTMLElement>('.regroup'),button=element?.getBoundingClientRect();
    if(element&&button&&button.width>0&&button.height>0){
     const overflow=button.right-view.w;
     if(overflow>0&&overflow<=24){element.setAttribute('data-game-compact','');put(element,'min-width','0px');put(element,'width',`${button.width-overflow}px`);compacted.add(element);}
     else if(overflow>24||button.left<0){game.setAttribute('data-game-regroup-wrap','');wrappedAt=view.w;}
    }
   }
  }
  game.toggleAttribute('data-game-hand-scroll',!!hand&&hand.clientHeight<170&&hand.scrollHeight>hand.clientHeight+2);
  // Preserve every deck coordinate. Narrow captions receive an opaque wooden
  // backing only where the decorative cannon would otherwise show through them.
  const pictures=[...game.querySelectorAll<HTMLElement>('.deck-piece[data-piece=cannon],.deck-piece[data-piece=balls]')].map(e=>e.getBoundingClientRect());
  for(const label of game.querySelectorAll<HTMLElement>('.board-bottom .hold-label,.phone-hand-label')){
   const r=label.getBoundingClientRect(),overlap=view.w<420&&pictures.some(p=>r.width&&r.height&&r.left<p.right&&r.right>p.left&&r.top<p.bottom&&r.bottom>p.top);
   put(label,'background',overlap?'#302216':'transparent');
   put(label,'box-shadow',overlap?'0 0 0 2px #302216':'none');
   clipped.add(label);
  }
 };
 const ro=new ResizeObserver(measure);ro.observe(game);
 for(const el of game.querySelectorAll('.board-bottom,.hand-cards'))ro.observe(el);
 const mo=new MutationObserver(records=>{if(records.some(r=>r.type==='attributes'||!(r.target instanceof Element)||!r.target.closest('.fx-layer,.fx-scars')))measure();});mo.observe(game,{childList:true,subtree:true,attributes:true,attributeFilter:['data-fx-busy']});
 const off=subscribeGameViewport(measure);window.addEventListener('resize',measure);void document.fonts.ready.then(()=>{if(live)measure();});measure();
 return()=>{live=false;ro.disconnect();mo.disconnect();off();window.removeEventListener('resize',measure);for(const el of clipped){el.style.removeProperty('background');el.style.removeProperty('box-shadow');}for(const b of compacted){b.style.removeProperty('width');b.style.removeProperty('min-width');b.removeAttribute('data-game-compact');}delete game.dataset.gameScale;delete game.dataset.gameRegroupWrap;delete game.dataset.gameHandScroll;game.style.removeProperty('--game-visible-h');};
}
