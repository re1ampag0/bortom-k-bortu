import {idleSceneAsset} from '../scene-window/assets';
import {mayWarmScenes} from '../scene-window/idle';
import {useEffect,useState} from 'react';
import type {FxStore} from '../fx/FxLayer';
import {PreparedScene,sceneUrls,type Scene} from '../scene-window/PreparedScene';
import {sceneCache,shipArt,shipImagePool} from './assets';
import {loadScene} from './sceneManifest';
export function prepareShipScene(code:string,phone=innerWidth<=700,serial=false){return loadScene(phone&&code==='Г'?'Г-phone':code).then(async scene=>{const urls=[...new Set(sceneUrls(scene))];if(serial){for(const src of urls)await idleSceneAsset(()=>shipImagePool.load(shipArt(src)));}else await Promise.all(urls.map(src=>shipImagePool.load(shipArt(src))));});}
export function ShipScene({code,ready,store}:{code:string;ready:boolean;store:FxStore}){
 const [phone,setPhone]=useState(()=>innerWidth<=700);
 useEffect(()=>{const q=matchMedia('(max-width:700px)'),change=()=>setPhone(q.matches);q.addEventListener('change',change);return()=>q.removeEventListener('change',change);},[]);
 const key=phone&&code==='Г'?'Г-phone':code,[scene,setScene]=useState<Scene|null>(null);
 useEffect(()=>{if(!mayWarmScenes())return;let live=true;setScene(null);void loadScene(key).then(s=>{if(live)setScene(s)});return()=>{live=false}},[key]);
 return scene&&mayWarmScenes()?<PreparedScene scene={scene} cache={sceneCache} cacheKey={code} ready={ready} store={store} narrow={phone} mobileArt={phone&&code==='Г'}/>:null;
}
