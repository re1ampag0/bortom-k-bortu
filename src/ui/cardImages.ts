import type {GameData} from '../engine/types';
import {cardByCode} from '../engine/state';
import manifest from './art/cards/manifest.json';
import {createSceneImagePool} from './game/scene-window/assets';
const urls=import.meta.glob<string>('./art/cards/**/*.webp',{eager:true,query:'?url',import:'default'});
const index=manifest as Record<string,{file:string;decks:string[]}>;
const pool=createSceneImagePool(25),ready=new Set<string>();
export function cardImageUrl(name:string,full=false){const item=index[name];return item?urls['./art/cards/'+(full?'':'thumb/')+item.file]:undefined;}
export const cardImageReady=(src:string)=>ready.has(src);
export async function prepareCardImage(src:string){const image=await pool.load(src);ready.add(src);return image;}
export const deckCardImages=(deck:string)=>Object.keys(index).filter(name=>index[name].decks.includes(deck)).map(name=>cardImageUrl(name)!);
/** Only public codes of the impending clip; hidden faces and Legends never load art. */
export async function prepareClipCardImages(data:GameData,value:unknown){
 const codes=new Set<string>();const visit=(x:unknown)=>{if(typeof x==='string'&&/^[ЖМИГ]-\d+$/.test(x))codes.add(x);else if(Array.isArray(x))x.forEach(visit);else if(x&&typeof x==='object')Object.values(x).forEach(visit);};visit(value);
 await Promise.all([...codes].map(async code=>{const card=cardByCode(data,code),src=!card.legend&&cardImageUrl(card.name);if(src)await prepareCardImage(src);}));
}
