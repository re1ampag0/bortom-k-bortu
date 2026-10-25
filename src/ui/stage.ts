// The laptop stage: on a large window the whole screen is the 1366 × 660 table, only larger. One root container (#stage) is
// scaled by k = min(width / 1366, height / 660) ≥ 1 (transform: scale, origin 0 0) and laid out at width / k × height / k, so
// everything inside — the table, the hand, the log, the layer of the animations, the sheets — keeps the laptop layout. A phone
// (≤ 700 px) and a laptop of 1366 × 660 or smaller have k = 1: nothing changes. The code that takes coordinates on the screen
// (getBoundingClientRect, clientX/Y) and puts something into the stage turns them into the stage's px with toStage / stageK.
import { useLayoutEffect, useState } from 'react';
import {getMenuLayout,subscribeMenuLayout} from './menus/layout';
import {gameScaleEnabled,gameViewport,subscribeGameViewport,gameGeometry} from './game/layout';

let k = 1;

/** The scale of the stage now (1 on a phone and on a window of 1366 × 660 or smaller). */
export const stageK = () => k;

/** A point of the screen (client px) in the px of the stage. */
export function toStage(x: number, y: number): { x: number; y: number } {
  const el = document.getElementById('stage');
  const r = el ? el.getBoundingClientRect() : { left: 0, top: 0 };
  return { x: (x - r.left) / k, y: (y - r.top) / k };
}

function scaleOf(w: number, h: number): number {
  return w <= 700 ? 1 : Math.max(1, Math.min(w / 1366, h / 660));
}

/** The style of #stage for the window now; null — no scaling (k = 1). */
export function useStage(): Record<string, string | number> | null {
  const [size, setSize] = useState(() => ({ w: innerWidth, h: innerHeight }));
  useLayoutEffect(() => {
    const on = () => setSize({ w: innerWidth, h: innerHeight });
    const offMenu=subscribeMenuLayout(on),offGame=subscribeGameViewport(on);on();
    addEventListener('resize', on);
    return () => {offMenu();offGame();removeEventListener('resize', on);};
  }, []);
  const menu=getMenuLayout();
  if(menu.active&&menu.enabled){
    k=menu.k;document.body.classList.toggle('staged',false);
    const column=menu.mode==='phone'&&!menu.tablet;
    if(k===1&&menu.left===0&&menu.top===0)return {'--app-h':`${menu.sceneH}px`,'--app-w':`${menu.sceneW}px`,'--menu-k':1};
    return {width:menu.sceneW,height:menu.sceneH,position:column?'relative':'absolute',left:menu.left,top:menu.top,transform:k===1?'none':`scale(${k})`,transformOrigin:'0 0','--app-h':`${menu.sceneH}px`,'--app-w':`${menu.sceneW}px`,'--menu-k':k};
  }
  if(!menu.active&&gameScaleEnabled()){
    const view=gameViewport();
    const geometry=gameGeometry(view);k=geometry.k;
    document.body.classList.toggle('staged',k!==1);
    if(geometry.small){
      const dpr=devicePixelRatio||1,snap=(n:number)=>Math.round(n*dpr)/dpr,w=geometry.phoneScene?view.w:1366,h=geometry.phoneScene?650:660;
      return {width:w,height:h,left:snap((view.w-w*k)/2),top:snap((view.h-h*k)/2),transform:`scale(${k})`,transformOrigin:'0 0','--app-h':`${h}px`,'--app-w':`${w}px`,'--game-k':k};
    }
    if(k===1)return view.w<=700?{'--app-h':`${view.h}px`,'--app-w':`${view.w}px`}:null;
    return {width:view.w/k,height:view.h/k,transform:`scale(${k})`,transformOrigin:'0 0','--app-h':`${view.h/k}px`};
  }
  k = scaleOf(size.w, size.h);
  document.body.classList.toggle('staged', k > 1);
  // --app-h: the height of the screen inside the stage (game.css uses it where it said 100dvh)
  return k > 1 ? { width: size.w / k, height: size.h / k, transform: `scale(${k})`, transformOrigin: '0 0', '--app-h': `${size.h / k}px` } : null;
}
