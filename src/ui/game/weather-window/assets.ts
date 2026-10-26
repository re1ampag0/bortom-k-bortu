import aliases from './aliases.json';
import {sharedSceneArt} from '../scene-window/art';
import {createSceneCache} from '../scene-window/assets';
const files=import.meta.glob('./art/*',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
export const weatherArt=(path:string)=>sharedSceneArt((aliases as Record<string,string>)[path]??path)??files['./art/'+path];
export const weatherSceneCache=createSceneCache(weatherArt);
