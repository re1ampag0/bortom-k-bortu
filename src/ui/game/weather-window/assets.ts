import {createSceneCache} from '../scene-window/assets';
const files=import.meta.glob('./art/*',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
export const weatherArt=(path:string)=>files['./art/'+path];
export const weatherSceneCache=createSceneCache(weatherArt);
