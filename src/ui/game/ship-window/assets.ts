import aliases from './aliases.json';
import {sharedSceneArt} from '../scene-window/art';
import {createSceneCache,createSceneImagePool,idleSceneAsset} from '../scene-window/assets';
import catalogue from './catalogue.json';
const files=import.meta.glob('./art/*',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
export const shipArt=(name:string)=>sharedSceneArt((aliases as Record<string,string>)[name]??name)??files['./art/'+name];
const base=new Map<string,Promise<void>>();
export function prepareShipWindow(code?:string,serial=false):Promise<void>{
 const names=code?[(catalogue as Record<string,{name:string}>)[code].name]:Object.values(catalogue).map(x=>x.name);
 if(!code||code==='Г')names.push('Phone');
 const targets=Object.entries(aliases).map(([name])=>['./art/'+name,shipArt(name)]).filter(([key])=>(key.startsWith('./art/track-')||names.some(name=>key.startsWith('./art/'+name+'-')))&&!key.includes('-live-')&&!key.includes('-asset-'));
 const load=([,url]:string[])=>{
  let p=base.get(url);if(!p){const image=new Image();image.src=url;p=image.decode().then(()=>{});base.set(url,p);}return p;
 };
 return serial?targets.reduce((done,target)=>done.then(()=>idleSceneAsset(()=>load(target))),Promise.resolve()):Promise.all(targets.map(load)).then(()=>{});
}
export const shipImagePool=createSceneImagePool();
export const sceneCache=createSceneCache(shipArt,shipImagePool);
export const prepareSceneImages=sceneCache.prepare;
export const sceneImage=sceneCache.image;
