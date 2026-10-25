import {useEffect,useRef,useState} from 'react';
import {PreparedScene,sceneUrls,type Scene} from '../game/scene-window/PreparedScene';
import {createSceneCache} from '../game/scene-window/assets';
import manifest from './scenes.json';
const scenes=manifest as unknown as Record<string,Scene>,files=import.meta.glob('./art/*',{eager:true,query:'?url',import:'default'})as Record<string,string>;
const idle={get:()=>({busy:false}),subscribe:()=>()=>{}};
export function MenuScene({name}:{name:string}){
 const [cache]=useState(()=>createSceneCache(path=>files['./art/'+path]));
 const [phone,setPhone]=useState(()=>innerWidth<=700),[ready,setReady]=useState(false),ref=useRef<HTMLDivElement>(null);
 const key=phone&&scenes[name+'Phone']?name+'Phone':name==='Main'&&phone?'Phone':name,scene=scenes[key];
 useEffect(()=>{const q=matchMedia('(max-width:700px)'),update=()=>setPhone(q.matches);q.addEventListener('change',update);return()=>q.removeEventListener('change',update);},[]);
 useEffect(()=>{let alive=true;setReady(false);if(scene)void cache.prepare(key,sceneUrls(scene)).then(()=>{if(alive)setReady(true);});return()=>{alive=false;};},[cache,key,scene]);
 useEffect(()=>{const el=ref.current;if(!el||!scene)return;const resize=()=>el.style.setProperty('--menu-art-scale',String(el.clientWidth/scene.width));const ro=new ResizeObserver(resize);ro.observe(el);resize();return()=>ro.disconnect();},[scene]);
 return scene?<div className="menu-prepared" ref={ref} style={{aspectRatio:`${scene.width}/${scene.height}`,'--menu-art-width':scene.width+'px','--menu-art-height':scene.height+'px'}as React.CSSProperties}><PreparedScene scene={scene} cache={cache} cacheKey={key} ready={ready} store={idle} narrow={phone}/></div>:null;
}
