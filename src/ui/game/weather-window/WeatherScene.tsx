import {useEffect,useState} from 'react';
import type {FxStore} from '../fx/FxLayer';
import {PreparedScene,sceneUrls,type Scene} from '../scene-window/PreparedScene';
import {weatherSceneCache} from './assets';
import manifest from './scenes.json';
const scenes=manifest as unknown as Record<string,Scene>;
export function prepareWeatherScene(name:string){const key=innerWidth<=700&&scenes[name+'-phone']?name+'-phone':name,scene=scenes[key];return scene?weatherSceneCache.prepare(key,sceneUrls(scene)):Promise.resolve();}
export function WeatherScene({name,store}:{name:string;store:FxStore}){
 const [narrow,setNarrow]=useState(()=>matchMedia('(max-width:700px)').matches);
 useEffect(()=>{const m=matchMedia('(max-width:700px)'),update=()=>setNarrow(m.matches);m.addEventListener('change',update);return()=>m.removeEventListener('change',update);},[]);
 const key=narrow&&scenes[name+'-phone']?name+'-phone':name,scene=scenes[key], [ready,setReady]=useState(false);
 useEffect(()=>{let live=true;setReady(false);if(scene)void weatherSceneCache.prepare(key,sceneUrls(scene)).then(()=>{if(live)setReady(true)});return()=>{live=false;};},[key,scene]);
 return scene?<PreparedScene scene={scene} cache={weatherSceneCache} cacheKey={key} ready={ready} store={store} narrow={narrow} mobileArt={key.endsWith('-phone')}/>:null;
}
