import {idleSceneAsset} from '../game/scene-window/assets';
import {prepareInfoWindows} from '../game/scene-window/loadWindows';
import {useEffect,useMemo,useRef,useState} from 'react';
import aliases from './aliases.json';
import posters from './posters.json';
import {sharedSceneArt} from '../game/scene-window/art';
import {PreparedScene,sceneUrls,type Scene} from '../game/scene-window/PreparedScene';
import {createSceneCache} from '../game/scene-window/assets';
import {hasScene,loadScene} from './sceneManifest';
import {useMenuLayout} from './layout';
import {menuImagePool as pool} from './assets';
import {getPerf,perfOff,subscribePerf} from '../game/perf/state';
import {initMenuMotion,menuMotionAllowed,menuMotionEnabled,subscribeMenuMotion} from './motion';
import {queueSceneWarm} from '../game/scene-window/idle';
const files=import.meta.glob('./art/*',{eager:true,query:'?url',import:'default'})as Record<string,string>;
const pictures=import.meta.glob('./posters/*.webp',{eager:true,query:'?url',import:'default'})as Record<string,string>;
const art=(path:string)=>sharedSceneArt((aliases as Record<string,string>)[path]??path)??files['./art/'+path];
const idle={get:()=>({busy:!menuMotionAllowed()}),subscribe:subscribeMenuMotion};
const warmed=new Set<string>();
let windowsWarmed=false;
export function MenuScene({name}:{name:string}){
 const [clockOwner]=useState(()=>({})),[cache]=useState(()=>createSceneCache(art,pool)),layout=useMenuLayout(),phone=layout.mode==='phone';
 const key=phone&&hasScene(name+'Phone')?name+'Phone':name==='Main'&&phone?'Phone':name;
 const info=(posters as Record<string,{width:number;height:number;src:string}>)[key];
 const [source,setSource]=useState<Scene|null>(null),[ready,setReady]=useState(false),[shown,setShown]=useState(''),[posterDecoded,setPosterDecoded]=useState('');
 const ref=useRef<HTMLDivElement>(null),reduced=useMemo(()=>matchMedia('(prefers-reduced-motion:reduce)'),[]);
 const [motion,setMotion]=useState(()=>menuMotionEnabled()&&!reduced.matches),[perf,setPerf]=useState(getPerf);
 useEffect(()=>{initMenuMotion();const update=()=>{setMotion(menuMotionEnabled()&&!reduced.matches);setPerf(getPerf());};const off=subscribeMenuMotion(update),p=subscribePerf(update);reduced.addEventListener('change',update);update();return()=>{off();p();reduced.removeEventListener('change',update);};},[reduced]);
 useEffect(()=>{if(!['Main','Phone','Chart_prep','Chart_prepPhone','Curtain','CurtainPhone','Placement','PlacementPhone'].includes(key)||posterDecoded!==key||windowsWarmed)return;windowsWarmed=true;void prepareInfoWindows().catch(()=>{windowsWarmed=false});},[posterDecoded,key]);
 const poster=info?pictures['./posters/'+info.src]:undefined;
 useEffect(()=>{let live=true;if(poster)void pool.load(poster).then(()=>{if(live)setPosterDecoded(key);});return()=>{live=false}},[poster,key]);
 useEffect(()=>{let live=true;setReady(false);setShown('');setSource(null);if(motion&&!/^Chart_main/.test(key))void loadScene(key).then(s=>{if(live)setSource(s)});return()=>{live=false}},[key,motion]);
 const scene=useMemo(()=>{if(!source)return null;const prune=(nodes:Scene['tree']):Scene['tree']=>nodes.filter(n=>!(perfOff('particles')&&n.particle)&&!(perfOff('light')&&/beam|light|sheen|lantern|cabin|stern|flick|glow|rays|lhWater|refl|fw|torch|lhFlash/i.test(n.cls??''))).map(n=>({...n,children:prune(n.children)}));return {...source,tree:prune(source.tree)};},[source,perf]);
 useEffect(()=>{let live=true;setReady(false);if(scene)void cache.prepare(key,sceneUrls(scene)).then(()=>{if(live)setReady(true);});return()=>{live=false}},[scene,key,cache]);
 useEffect(()=>{const el=ref.current;if(!el||!info)return;const resize=()=>el.style.setProperty('--menu-art-scale',String(el.clientWidth/info.width));const ro=new ResizeObserver(resize);ro.observe(el);resize();return()=>ro.disconnect()},[info]);
 useEffect(()=>{const el=ref.current;if(!el||!ready)return;const check=()=>{if(el.querySelector('[data-ready="1"]'))setShown(key)};const mo=new MutationObserver(check);check();mo.observe(el,{subtree:true,attributes:true,attributeFilter:['data-ready']});return()=>mo.disconnect()},[key,ready]);
 useEffect(()=>{
  if(!motion||shown!==key||posterDecoded!==key||!['Main','Phone'].includes(key)||warmed.has(key))return;warmed.add(key);
  for(const next of phone?['PiratesPhone','CompanyPhone','Chart_prepPhone']:['Pirates','Company','Chart_prep'])void queueSceneWarm(async()=>{if(!menuMotionAllowed()||reduced.matches)return;const p=(posters as Record<string,{src:string}>)[next];if(p)await pool.load(pictures['./posters/'+p.src]);const s=await loadScene(next);for(const src of new Set(sceneUrls(s)))await idleSceneAsset(()=>pool.load(art(src))); });
 },[key,shown,posterDecoded,motion,phone,reduced]);
 if(!info)return null;
 return <div className="menu-prepared" ref={ref} style={{aspectRatio:`${info.width}/${info.height}`,'--menu-art-width':info.width+'px','--menu-art-height':info.height+'px'}as React.CSSProperties}>
  {posterDecoded===key&&<img src={poster} alt="" aria-hidden style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',opacity:shown===key?0:1,visibility:shown===key?'hidden':'visible',transition:'opacity 300ms ease, visibility 0s 300ms'}}/>}
  {scene&&motion&&<PreparedScene clockOwner={clockOwner} scene={scene} cache={cache} cacheKey={key} ready={ready} store={idle} narrow={phone} pixelRatio={layout.enabled&&(layout.k!==1||!phone&&devicePixelRatio>3)?phone?Math.min(devicePixelRatio,2):Math.min(devicePixelRatio*layout.k,3):undefined}/>}
 </div>;
}
