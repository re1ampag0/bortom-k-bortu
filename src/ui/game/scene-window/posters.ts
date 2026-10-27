import shell from '../ship-window/shell.json';
import {createSceneImagePool} from './assets';
import {queueSceneWarm} from './idle';
const ships=import.meta.glob<string>('../ship-window/posters/*.webp',{eager:true,query:'?url&no-inline',import:'default'});
export const weatherPosters=import.meta.glob<string>('../weather-window/posters/*.webp',{eager:true,query:'?url&no-inline',import:'default'});
export const shipPoster=(code:string)=>ships['../ship-window/posters/'+(shell as Record<string,{poster:string}>)[code].poster];
export const weatherPoster=(key:string,phone=false)=>weatherPosters[`../weather-window/posters/${key}${phone?'-phone':''}.webp`]??weatherPosters[`../weather-window/posters/${key}.webp`];
const pool=createSceneImagePool(24);
/** Detached background decoding after the menu poster; no base64 or resident DOM layers. */
export async function prepareWindowPosters(){for(const url of [...Object.values(ships),...Object.values(weatherPosters)])await queueSceneWarm(()=>pool.load(url));}
