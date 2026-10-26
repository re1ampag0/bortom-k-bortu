import {useEffect,useState} from 'react';
import type {FxStore} from '../fx/FxLayer';
import {PreparedScene,sceneUrls,type Scene} from '../scene-window/PreparedScene';
import {sceneCache} from './assets';
import {loadScene} from './sceneManifest';
export function prepareShipScene(code:string,phone=innerWidth<=700){return loadScene(phone&&code==='Г'?'Г-phone':code).then(scene=>sceneCache.prepare(code,sceneUrls(scene)));}
export function ShipScene({code,ready,store}:{code:string;ready:boolean;store:FxStore}){
 const [phone,setPhone]=useState(()=>innerWidth<=700);
 useEffect(()=>{const q=matchMedia('(max-width:700px)'),change=()=>setPhone(q.matches);q.addEventListener('change',change);return()=>q.removeEventListener('change',change);},[]);
 const key=phone&&code==='Г'?'Г-phone':code,[scene,setScene]=useState<Scene|null>(null);
 useEffect(()=>{let live=true;setScene(null);void loadScene(key).then(s=>{if(live)setScene(s)});return()=>{live=false}},[key]);
 return scene?<PreparedScene scene={scene} cache={sceneCache} cacheKey={code} ready={ready} store={store} narrow={phone} mobileArt={phone&&code==='Г'}/>:null;
}
