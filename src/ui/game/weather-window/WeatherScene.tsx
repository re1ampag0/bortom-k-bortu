import {useEffect,useState} from 'react';
import type {FxStore} from '../fx/FxLayer';
import {PreparedScene,sceneUrls,type Scene} from '../scene-window/PreparedScene';
import {weatherSceneCache} from './assets';
import manifest from './scenes.json';
const scenes=manifest as unknown as Record<string,Scene>;
export function WeatherScene({name,store}:{name:string;store:FxStore}){
 const scene=scenes[name], [ready,setReady]=useState(false);
 useEffect(()=>{let live=true;setReady(false);if(scene)void weatherSceneCache.prepare(name,sceneUrls(scene)).then(()=>{if(live)setReady(true)});return()=>{live=false;};},[name,scene]);
 return scene?<PreparedScene scene={scene} cache={weatherSceneCache} cacheKey={name} ready={ready} store={store} narrow={innerWidth<=700}/>:null;
}
