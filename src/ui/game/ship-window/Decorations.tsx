import {useEffect,useRef} from 'react';
import type {FxStore} from '../fx/FxLayer';
import {prepareSceneImages,shipArt} from './assets';
import manifest from './scenes.json';
type Feature={duration:number;frames:{src:string}[]};
const features=(manifest as unknown as Record<string,{features:Feature[]}>);
/** No timers/React state: visibility and the clip store directly pause the native handles. */
function useDecoration(ref:{current:HTMLSpanElement|null},key:string,ready:boolean,store:FxStore,make:(el:HTMLSpanElement)=>Promise<Animation[]>){
 const factory=useRef(make);factory.current=make;
 useEffect(()=>{
  const el=ref.current;if(!el||!ready)return;let live=true,visible=false;const owned:Animation[]=[];
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const update=()=>{const run=live&&visible&&!document.hidden&&!store.get().busy&&!reduced.matches;for(const a of owned){run?a.play():a.pause();const target=(a.effect as KeyframeEffect).target as HTMLElement;target.style.willChange=run?'transform, opacity':'auto';}};
  const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??false;update();});observer.observe(el);
  const unsubscribe=store.subscribe(update);document.addEventListener('visibilitychange',update);reduced.addEventListener('change',update);
  void factory.current(el).then(animations=>{if(!live){animations.forEach(a=>a.cancel());return;}owned.push(...animations);owned.forEach(a=>{a.pause();a.currentTime=0;});update();});
  return()=>{live=false;owned.forEach(a=>a.cancel());observer.disconnect();unsubscribe();document.removeEventListener('visibilitychange',update);reduced.removeEventListener('change',update);el.querySelectorAll('[data-ready-frame]').forEach(e=>e.remove());el.removeAttribute('data-ready');};
 },[key,ready,store,ref]);
}
export function FeatureIcon({code,index,name,ready,store}:{code:string;index:number;name:string;ready:boolean;store:FxStore}){
 const ref=useRef<HTMLSpanElement>(null);
 useDecoration(ref,code+index,ready,store,async el=>{
  const f=features[code].features[index];await prepareSceneImages(code,f.frames.map(a=>a.src));
  if(!el.isConnected)return [];
  const handles=f.frames.map((a,i)=>{const img=new Image();img.src=shipArt(a.src);img.alt='';img.dataset.readyFrame='';img.style.cssText='position:absolute;left:0;top:0;width:34px;height:34px;opacity:0';el.append(img);
   return img.animate(Array.from({length:5},(_,q)=>({offset:q/4,opacity:q%4===i?1:0})),{duration:f.duration,iterations:Infinity});
  });el.dataset.ready='1';return handles;
 });
 return <span ref={ref} className="sw-feature-frames"><img className="sw-feature-icon" src={shipArt(`${name}-feature-${index}.svg`)} alt=""/></span>;
}
export function Medal({name,alt,ready,store}:{name:string;alt:string;ready:boolean;store:FxStore}){
 const ref=useRef<HTMLSpanElement>(null);
 useDecoration(ref,name,ready,store,async el=>{const img=el.querySelector<HTMLImageElement>('.sw-medal-ray')!;await img.decode();return [img.animate([{offset:0,transform:'translateX(-42.857px) skewX(-18deg)'},{offset:.62,transform:'translateX(-42.857px) skewX(-18deg)'},{offset:.82,transform:'translateX(42.857px) skewX(-18deg)'},{offset:1,transform:'translateX(42.857px) skewX(-18deg)'}],{duration:4200,easing:'ease-in-out',iterations:Infinity})];});
 return <span ref={ref} className="sw-medal-wrap"><img className="sw-medal" src={shipArt(`${name}-medal.svg`)} alt={alt}/><span className="sw-medal-clip"><img className="sw-medal-ray" src={shipArt(`${name}-glint.svg`)} alt=""/></span></span>;
}
