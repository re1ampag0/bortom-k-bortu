import{useEffect,useState,type RefObject}from'react';
/** Only live art waits. The frame, text and poster render in the first commit. */
export function useWindowSceneOpening(frame:RefObject<HTMLElement>,key:string){
 const[entered,setEntered]=useState(false);
 useEffect(()=>{setEntered(false);let live=true,timer=0,settled=false;const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const reveal=()=>{if(live&&settled&&!document.hidden&&!reduced.matches)setEntered(true);};
  const animations=frame.current?.getAnimations().filter(a=>a.playState==='running')??[];
  const started=performance.now();void Promise.all(animations.map(a=>a.finished.catch(()=>{}))).then(()=>{if(live)timer=window.setTimeout(()=>{settled=true;reveal()},Math.max(0,220-(performance.now()-started)));});
  document.addEventListener('visibilitychange',reveal);return()=>{live=false;clearTimeout(timer);document.removeEventListener('visibilitychange',reveal);};
 },[frame,key]);return entered;
}
