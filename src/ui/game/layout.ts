// Geometry only. Menu scaling has its own switch and retains its existing implementation.
import {useSyncExternalStore} from 'react';
const listeners=new Set<()=>void>();
const enabled=typeof location==='undefined'||new URLSearchParams(location.search).get('gamescale')!=='0';
export const gameScaleEnabled=()=>enabled;
const read=()=>typeof window==='undefined'?{w:1366,h:660}:({w:Math.round(window.visualViewport?.width||innerWidth||1366),h:Math.round(window.visualViewport?.height||innerHeight||660)});
let size=read(),watching=false;
function update(){if(innerWidth<=0||innerHeight<=0)return;const next=read(),active=document.activeElement,input=active?.matches('textarea,[contenteditable=true]')||(active instanceof HTMLInputElement&&['text','search','email','url','tel','password','number'].includes(active.type));if(input&&next.w===size.w&&next.h<size.h)return;if(next.w===size.w&&next.h===size.h)return;size=next;listeners.forEach(fn=>fn());}
export function subscribeGameViewport(fn:()=>void){listeners.add(fn);if(!watching){watching=true;window.addEventListener('resize',update);window.addEventListener('orientationchange',update);window.visualViewport?.addEventListener('resize',update);document.addEventListener('focusout',()=>setTimeout(update,180));update();}return()=>{listeners.delete(fn);};}
export const gameViewport=()=>size;
export const useGameViewport=()=>useSyncExternalStore(subscribeGameViewport,gameViewport,gameViewport);
/** Preserve the existing portrait-tablet interaction mode; shrinking is a landscape/laptop scene. */
export function gameGeometry(v:{w:number;h:number}){
 const portraitTablet=v.w>700&&v.w<=1100&&v.h>v.w;
 const phoneScene=false;
 const small=v.w>700&&!portraitTablet&&(v.w<1366||v.h<660);
 const k=phoneScene?v.h/650:small?Math.min(v.w/1366,v.h/660):v.w<=700?1:Math.max(1,Math.min(v.w/1366,v.h/660));
 return{k,small:small||phoneScene,phoneScene,portraitTablet};
}
