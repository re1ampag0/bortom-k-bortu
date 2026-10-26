import {useEffect,useRef} from 'react';
import type {FxStore} from '../fx/FxLayer';
import {shipArt} from './assets';
import widths from './featureWidths.json';
import {loadSettings,subscribeSettings} from '../../storage';
import {perfOff,subscribePerf} from '../perf/state';
/** No timers/React state: visibility and the clip store directly pause the native handles. */
function useDecoration(ref:{current:HTMLSpanElement|null},key:string,ready:boolean,store:FxStore,make:(el:HTMLSpanElement)=>Promise<Animation[]>){
 const factory=useRef(make);factory.current=make;
 useEffect(()=>{
  const el=ref.current;if(!el||!ready)return;let live=true,visible=false;const owned:Animation[]=[];
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const update=()=>{const allowed=!reduced.matches&&loadSettings().effects!=='simple'&&!perfOff('simple')&&!perfOff('css')&&!perfOff('light');const run=allowed&&live&&visible&&!document.hidden&&!store.get().busy;for(const a of owned){run?a.play():a.pause();const target=(a.effect as KeyframeEffect).target as HTMLElement;target.style.visibility=allowed?'visible':'hidden';target.style.willChange=run?'transform, opacity':'auto';}};
  const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??false;update();});observer.observe(el);
  const unsubscribe=store.subscribe(update),offSettings=subscribeSettings(update),offPerf=subscribePerf(update);document.addEventListener('visibilitychange',update);reduced.addEventListener('change',update);
  void factory.current(el).then(animations=>{if(!live){animations.forEach(a=>a.cancel());return;}owned.push(...animations);el.dataset.ready='1';owned.forEach(a=>{a.pause();a.currentTime=0;});update();});
  return()=>{live=false;owned.forEach(a=>a.cancel());observer.disconnect();unsubscribe();offSettings();offPerf();document.removeEventListener('visibilitychange',update);reduced.removeEventListener('change',update);el.querySelectorAll('[data-ready-frame]').forEach(e=>e.remove());el.removeAttribute('data-ready');};
 },[key,ready,store,ref]);
}
const sweep=[{offset:0,opacity:0,transform:'translateX(-43px) skewX(-18deg)'},{offset:.7,opacity:0,transform:'translateX(-43px) skewX(-18deg)'},{offset:.74,opacity:.3,transform:'translateX(-43px) skewX(-18deg)'},{offset:.9,opacity:.3,transform:'translateX(43px) skewX(-18deg)'},{offset:.94,opacity:0,transform:'translateX(43px) skewX(-18deg)'},{offset:1,opacity:0,transform:'translateX(43px) skewX(-18deg)'}];
export function FeatureIcon({code,index,name,ready,store}:{code:string;index:number;name:string;ready:boolean;store:FxStore}){
 const ref=useRef<HTMLSpanElement>(null),width=(widths as Record<string,number[]>)[code]?.[index]??34;
 useDecoration(ref,code+index,ready,store,async el=>{const ray=el.querySelector<HTMLImageElement>('.sw-medal-ray')!;await ray.decode();return [ray.animate(sweep,{duration:7400,delay:-(index*1130+code.charCodeAt(0)*37)%7400,iterations:Infinity})];});
 return <span ref={ref} className="sw-feature-frames" style={{width}}><img style={{width}} className="sw-feature-icon" src={shipArt(`${name}-feature-${index}.svg`)} alt=""/><span className="sw-medal-clip"><img className="sw-medal-ray" src={shipArt(`${name}-glint.svg`)} alt=""/></span></span>;
}
export function Medal({name,alt,ready,store}:{name:string;alt:string;ready:boolean;store:FxStore}){
 const ref=useRef<HTMLSpanElement>(null);
 useDecoration(ref,name,ready,store,async el=>{const img=el.querySelector<HTMLImageElement>('.sw-medal-ray')!;await img.decode();return [img.animate(sweep,{duration:7800,delay:-name.length*230,iterations:Infinity})];});
 return <span ref={ref} className="sw-medal-wrap"><img className="sw-medal" src={shipArt(`${name}-medal.svg`)} alt={alt}/><span className="sw-medal-clip"><img className="sw-medal-ray" src={shipArt(`${name}-glint.svg`)} alt=""/></span></span>;
}
