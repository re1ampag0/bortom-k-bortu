import {useEffect,useRef} from 'react';
import type {FxStore} from '../fx/FxLayer';
import {particleEasing} from '../fx/particles';
import './scene.css';
import type {SceneCache} from './assets';
type Art={src:string;x:number;y:number;w:number;h:number};
type Frame=Keyframe&{computedOffset?:number};
type Motion={name:string;frames:Frame[];timing:KeyframeAnimationOptions};
type Layer={text?:string;id:number;tag:string;cls:string;style:Record<string,string>;anim:Motion[];children:Layer[];art?:Art;image?:string;frames?:Art[];frameTiming?:KeyframeAnimationOptions;particle?:boolean;rain?:boolean;animations?:Frame[];rainTiming?:KeyframeAnimationOptions};
export type Scene={width:number;height:number;tree:Layer[]};
const options=(t:KeyframeAnimationOptions):KeyframeAnimationOptions=>({...t,iterations:t.iterations??Infinity});
const frames=(f:Frame[])=>f.map(({computedOffset:_c,composite:_k,...frame})=>{
 if(Object.keys(frame).some(k=>!['offset','easing','transform','opacity'].includes(k)))throw Error('Unsupported ship scene animation');return frame;
});
function urls(nodes:Layer[]):string[]{return nodes.flatMap(n=>[...n.art?[n.art.src]:[],...n.image?[n.image]:[],...(n.frames??[]).map(a=>a.src),...urls(n.children)]);}
export const sceneUrls=(scene:Scene)=>urls(scene.tree);
const px=(v:string|undefined)=>parseFloat(v??'0')||0;
function matrix(value:string|undefined,w:number,h:number){
 if(!value||value==='none')return new DOMMatrix();
 let axis=0;
 value=value.replace(/translate([XY]?)\(([^)]+)\)/g,(_m,a:string,v:string)=>{axis=0;return 'translate'+a+'('+v.replace(/(-?[\d.]+)%/g,(_s,n:string)=>Number(n)*(a==='Y'||!a&&axis++>0?h:w)/100+'px')+')';});
 return new DOMMatrix(value);
}
function sample(anim:Motion,time:number){
 const duration=Number(anim.timing.duration),delay=Number(anim.timing.delay??0),elapsed=time-delay;
 if(elapsed<0)return null;
 const iteration=Math.floor(elapsed/duration);let p=(elapsed%duration)/duration;
 if(anim.timing.direction==='reverse'||anim.timing.direction==='alternate'&&iteration%2||anim.timing.direction==='alternate-reverse'&&!(iteration%2))p=1-p;
 const rows=anim.frames;let i=0;while(i<rows.length-2&&Number(rows[i+1].offset)<p)i++;
 const a=rows[i],b=rows[i+1]??a,from=Number(a.offset??0),to=Number(b.offset??1);
 return {a,b,p:particleEasing(String(a.easing??'linear'))(Math.max(0,Math.min(1,(p-from)/(to-from||1))))};
}
/** One owner, native wrapper clocks + one shared particle rAF. Cleanup always cancels both. */
export function PreparedScene({scene,cache,cacheKey,ready,store,narrow,className="sw-native-scene",mobileArt=false}:{scene:Scene;cache:SceneCache;cacheKey:string;ready:boolean;store:FxStore;narrow:boolean;className?:string;mobileArt?:boolean}){
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const element=ref.current;if(!element||!ready)return;const host:HTMLDivElement=element;
  let live=true,raf=0,elapsed=0,last=performance.now(),running=false,intersecting=false,capturing=false;
  const animations:Animation[]=[],particles:{node:Layer;chain:Layer[];image:HTMLImageElement;level:number}[]=[];
  const surfaces=new Map<number,{canvas:HTMLCanvasElement;context:CanvasRenderingContext2D}>();
  let observer:IntersectionObserver|undefined,unsubscribe:(()=>void)|undefined;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const dpr=narrow?Math.min(devicePixelRatio,2):devicePixelRatio;
  const stop=()=>{if(raf)cancelAnimationFrame(raf);raf=0;};
  function own(el:HTMLElement,kf:Frame[],timing:KeyframeAnimationOptions){const a=el.animate(frames(kf),options(timing));a.pause();a.currentTime=0;animations.push(a);return a;}
  function image(art:Art){const el=document.createElement('img');el.src=cache.url(art.src);el.alt='';Object.assign(el.style,{position:'absolute',left:art.x+'px',top:art.y+'px',width:art.w+'px',height:art.h+'px',pointerEvents:'none'});return el;}
  function build(node:Layer,chain:Layer[]):HTMLElement|null{
   if(node.particle&&node.art){
    if(!narrow||particles.length%2===0){const bitmap=cache.image(node.art.src);if(bitmap)particles.push({node,chain:[...chain,node],image:bitmap,level:/tw$|shoot$/.test(node.anim[0]?.name)?0:4});}
    else particles.push({node,chain:[],image:cache.image(node.art.src)!,level:-1});
    return null;
   }
   const el=document.createElement('div');el.className='sw-scene-layer '+node.cls;el.dataset.swLayer=String(node.id);
   Object.assign(el.style,node.style);
   for(const k of ['backgroundColor','backgroundImage','boxShadow','filter','maskImage','mixBlendMode'])el.style[k as 'filter']='';
   el.style.pointerEvents='none';
   if(node.text)el.append(document.createTextNode(node.text));
   if(node.art){const img=image(node.art);el.append(img);if(node.rain){el.style.overflow='hidden';own(img,node.animations!,node.rainTiming!);}}
   if(node.image){const img=document.createElement('img');img.src=cache.url(node.image);img.alt='';img.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none';el.append(img);}
   if(node.frames){
    node.frames.forEach((art,i)=>{const img=image(art),kf=Array.from({length:5},(_,q)=>({offset:q/4,opacity:q%4===i?1:0,easing:'linear'}));el.append(img);own(img,kf,node.frameTiming!);});
   }
   for(const a of node.anim){if(a.frames.some(f=>f.backgroundPositionX!==undefined))continue;own(el,a.frames,a.timing);}
   for(const child of node.children){const c=build(child,[...chain,node]);if(c)el.append(c);}
   return el;
  }
  function draw(time:number){
   const cache=new Map<Layer,{matrix:DOMMatrix;alpha:number}>();
   for(const s of surfaces.values()){s.context.resetTransform();s.context.clearRect(0,0,s.canvas.width,s.canvas.height);}
   for(const p of particles){if(p.level<0)continue;
    let parent=new DOMMatrix(),alpha=1;
    for(const n of p.chain){let state=cache.get(n);if(!state){
      const s=n.style,w=px(s.width),h=px(s.height),origin=(s.transformOrigin??'0 0').split(' ');let t=matrix(s.transform,w,h),op=Number(s.opacity??1);
      for(const anim of n.anim){const v=sample(anim,time);if(!v)continue;const {a,b,p:k}=v;
       if(a.transform!==undefined||b.transform!==undefined){const m0=matrix(String(a.transform??s.transform),w,h),m1=matrix(String(b.transform??s.transform),w,h);t=new DOMMatrix([m0.a+(m1.a-m0.a)*k,m0.b+(m1.b-m0.b)*k,m0.c+(m1.c-m0.c)*k,m0.d+(m1.d-m0.d)*k,m0.e+(m1.e-m0.e)*k,m0.f+(m1.f-m0.f)*k]);}
       if(a.opacity!==undefined||b.opacity!==undefined)op=Number(a.opacity??op)+(Number(b.opacity??op)-Number(a.opacity??op))*k;
      }
      const x=px(origin[0]),y=px(origin[1]);state={matrix:new DOMMatrix().translate(px(s.left),px(s.top)).translate(x,y).multiply(t).translate(-x,-y),alpha:op};cache.set(n,state);
     }parent=parent.multiply(state.matrix);alpha*=state.alpha;
    }
    if(alpha<=0)continue;let s=surfaces.get(p.level);if(!s){const canvas=document.createElement('canvas');canvas.className='sw-particles';canvas.width=Math.ceil(scene.width*dpr);canvas.height=Math.ceil(scene.height*dpr);Object.assign(canvas.style,{width:scene.width+'px',height:scene.height+'px',zIndex:String(p.level)});s={canvas,context:canvas.getContext('2d')!};surfaces.set(p.level,s);host.append(canvas);}
    const c=s.context,art=p.node.art!;c.setTransform(dpr*parent.a,dpr*parent.b,dpr*parent.c,dpr*parent.d,dpr*parent.e,dpr*parent.f);c.globalAlpha=Math.max(0,Math.min(1,alpha));c.drawImage(p.image,art.x,art.y,art.w,art.h);
   }
  }
  function tick(now:number){raf=0;if(!running)return;elapsed+=Math.min(50,Math.max(0,now-last));last=now;draw(elapsed);raf=requestAnimationFrame(tick);}
  function update(){const next=!capturing&&live&&intersecting&&!document.hidden&&!store.get().busy&&!reduced.matches;
   if(next===running)return;running=next;last=performance.now();
   for(const a of animations)next?a.play():a.pause();
   if(next&&particles.some(p=>p.level>=0))raf=requestAnimationFrame(tick);else stop();
  }
  void cache.prepare(cacheKey,sceneUrls(scene)).then(()=>{
   if(!live)return;const fragment=document.createDocumentFragment();for(const n of scene.tree){const el=build(n,[]);if(el)fragment.append(el);}host.append(fragment);host.dataset.ready='1';host.parentElement?.setAttribute('data-scene-live','');
   observer=new IntersectionObserver(entries=>{intersecting=entries[0]?.isIntersecting??false;update();});observer.observe(host);
   document.addEventListener('visibilitychange',update);reduced.addEventListener('change',update);unsubscribe=store.subscribe(update);draw(0);
   if(import.meta.env.DEV||import.meta.env.MODE==='e2e')Object.defineProperty(host,'captureScene',{configurable:true,value:(time:number)=>{capturing=true;running=false;stop();for(const a of animations){a.pause();a.currentTime=time;}draw(time);}});
  });
  return()=>{live=false;running=false;stop();observer?.disconnect();unsubscribe?.();document.removeEventListener('visibilitychange',update);reduced.removeEventListener('change',update);animations.forEach(a=>a.cancel());host.replaceChildren();host.removeAttribute('data-ready');host.parentElement?.removeAttribute('data-scene-live');};
 },[cacheKey,ready,store,narrow,scene,cache]);
 return <div ref={ref} className={className} data-mobile-art={mobileArt?'':undefined} aria-hidden="true"/>;
}
