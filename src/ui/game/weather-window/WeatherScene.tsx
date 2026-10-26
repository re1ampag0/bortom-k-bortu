import {useEffect,useState} from 'react';
import type {FxStore} from '../fx/FxLayer';
import {PreparedScene,sceneUrls,type Scene} from '../scene-window/PreparedScene';
import {weatherSceneCache} from './assets';
import {hasScene,loadScene} from './sceneManifest';
export function prepareWeatherScene(name:string){const key=innerWidth<=700&&hasScene(name+'-phone')?name+'-phone':name;return loadScene(key).then(scene=>weatherSceneCache.prepare(key,sceneUrls(scene)));}
export function WeatherScene({name,store}:{name:string;store:FxStore}){
 const [narrow,setNarrow]=useState(()=>matchMedia('(max-width:700px)').matches);
 useEffect(()=>{const m=matchMedia('(max-width:700px)'),update=()=>setNarrow(m.matches);m.addEventListener('change',update);return()=>m.removeEventListener('change',update);},[]);
 const key=narrow&&hasScene(name+'-phone')?name+'-phone':name,[scene,setScene]=useState<Scene|null>(null),[ready,setReady]=useState(false);
 useEffect(()=>{let live=true;setScene(null);void loadScene(key).then(s=>{if(live)setScene(s)});return()=>{live=false}},[key]);
 useEffect(()=>{let live=true;setReady(false);if(scene)void weatherSceneCache.prepare(key,sceneUrls(scene)).then(()=>{if(live)setReady(true)});return()=>{live=false;};},[key,scene]);
 return scene?<PreparedScene scene={scene} cache={weatherSceneCache} cacheKey={key} ready={ready} store={store} narrow={narrow} mobileArt={key.endsWith('-phone')}/>:null;
}
