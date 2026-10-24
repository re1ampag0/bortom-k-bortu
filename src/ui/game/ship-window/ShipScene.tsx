import {useEffect,useState} from 'react';
import type {FxStore} from '../fx/FxLayer';
import {PreparedScene,sceneUrls,type Scene} from '../scene-window/PreparedScene';
import {sceneCache} from './assets';
import manifest from './scenes.json';
const scenes=manifest as unknown as Record<string,Scene>;
export function prepareShipScene(code:string,phone=innerWidth<=700){return sceneCache.prepare(code,sceneUrls(scenes[phone&&code==='Г'?'Г-phone':code]));}
export function ShipScene({code,ready,store}:{code:string;ready:boolean;store:FxStore}){
 const [phone,setPhone]=useState(()=>innerWidth<=700);
 useEffect(()=>{const q=matchMedia('(max-width:700px)'),change=()=>setPhone(q.matches);q.addEventListener('change',change);return()=>q.removeEventListener('change',change);},[]);
 return <PreparedScene scene={scenes[phone&&code==='Г'?'Г-phone':code]} cache={sceneCache} cacheKey={code} ready={ready} store={store} narrow={phone} mobileArt={phone&&code==='Г'}/>;
}
