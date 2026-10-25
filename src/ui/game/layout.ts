// Geometry only. Menu scaling has its own switch and retains its existing implementation.
import {useSyncExternalStore} from 'react';
const listeners=new Set<()=>void>();
export const gameScaleEnabled=()=>typeof location==='undefined'||new URLSearchParams(location.search).get('gamescale')!=='0';
const read=()=>typeof window==='undefined'?{w:1366,h:660}:({w:Math.round(window.visualViewport?.width??innerWidth),h:Math.round(window.visualViewport?.height??innerHeight)});
let size=read(),watching=false;
function update(){const next=read(),input=document.activeElement?.matches('input,textarea,[contenteditable=true]');if(input&&next.w===size.w&&next.h<size.h)return;if(next.w===size.w&&next.h===size.h)return;size=next;listeners.forEach(fn=>fn());}
export function subscribeGameViewport(fn:()=>void){listeners.add(fn);if(!watching){watching=true;window.addEventListener('resize',update);window.addEventListener('orientationchange',update);window.visualViewport?.addEventListener('resize',update);document.addEventListener('focusout',()=>setTimeout(update,180));update();}return()=>{listeners.delete(fn);};}
export const gameViewport=()=>size;
export const useGameViewport=()=>useSyncExternalStore(subscribeGameViewport,gameViewport,gameViewport);
