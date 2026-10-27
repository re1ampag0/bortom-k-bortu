import {useEffect,useRef,useState} from 'react';
import manifest from './art/cards/manifest.json';
import {createSceneImagePool} from './game/scene-window/assets';
const urls=import.meta.glob<string>('./art/cards/*.webp',{eager:true,query:'?url',import:'default'});
const index=manifest as Record<string,{file:string;decks:string[]}>;
const pool=createSceneImagePool(96);
function url(name:string){const item=index[name];return item?urls['./art/cards/'+item.file]:undefined;}
/** A placeholder reserves the final ratio. Only intersecting art starts a detached decode. */
export function CardArt({name}:{name:string}){
 const ref=useRef<HTMLSpanElement>(null),[ready,setReady]=useState<string|null>(null),src=url(name);
 useEffect(()=>{setReady(null);const el=ref.current;if(!el||!src)return;let live=true;const load=()=>{void pool.load(src).then(()=>{if(live)setReady(src)},()=>{});};const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();load();}});observer.observe(el);return()=>{live=false;observer.disconnect();};},[src]);
 if(!src)return null;
 return <span ref={ref} className="card-art" aria-hidden="true">{ready===src&&<img src={src} alt="" width="600" height="360" decoding="async"/>}</span>;
}
/** Only the owner's deck, one decoded asset per idle callback; never render warm-up nodes. */
export function useWarmCardDeck(deck:string|undefined){
 useEffect(()=>{if(!deck||typeof window==='undefined')return;const connection=(navigator as Navigator&{connection?:{saveData?:boolean;effectiveType?:string}}).connection;if(connection?.saveData||/^(slow-2g|2g|3g)$/.test(connection?.effectiveType??''))return;
 let live=true,id:number|undefined;const names=Object.keys(index).filter(name=>index[name].decks.includes(deck));let next=0;
 const step=()=>{if(!live||next>=names.length)return;const src=url(names[next++]);void(src?pool.load(src):Promise.resolve()).catch(()=>{}).finally(schedule);};
 const schedule=()=>{if(live&&typeof requestIdleCallback==='function')id=requestIdleCallback(step,{timeout:10000});};schedule();return()=>{live=false;if(id!==undefined)cancelIdleCallback(id);};
 },[deck]);
}
