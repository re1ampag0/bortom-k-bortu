import {useEffect,useRef,useState} from 'react';
import {cardImageUrl as url,cardImageReady,prepareCardImage,deckCardImages} from './cardImages';
/** A placeholder reserves the final ratio. Only intersecting art starts a detached decode. */
export function CardArt({name,full=false}:{name:string;full?:boolean}){
 const ref=useRef<HTMLSpanElement>(null),[ready,setReady]=useState<string|null>(null),src=url(name,full);
 useEffect(()=>{setReady(src&&cardImageReady(src)?src:null);const el=ref.current;if(!el||!src)return;let live=true;const load=()=>{void prepareCardImage(src).then(()=>{if(live)setReady(src)},()=>{});};const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();load();}});observer.observe(el);return()=>{live=false;observer.disconnect();};},[src]);
 if(!src)return null;
 return <span ref={ref} className="card-art" aria-hidden="true">{ready===src&&<img src={src} alt="" width="600" height="360" decoding="async"/>}</span>;
}
/** Only the owner's deck, one decoded asset per idle callback; never render warm-up nodes. */
export function useWarmCardDeck(deck:string|undefined){
 useEffect(()=>{if(!deck||typeof window==='undefined')return;const connection=(navigator as Navigator&{connection?:{saveData?:boolean;effectiveType?:string}}).connection;if(connection?.saveData||/^(slow-2g|2g|3g)$/.test(connection?.effectiveType??''))return;
 let live=true,id:number|undefined,frame=0;const names=deckCardImages(deck);let next=0;
 const game=document.querySelector('.game');
 const allowed=()=>live&&!document.hidden&&!game?.hasAttribute('data-fx-busy');
 const schedule=()=>{if(allowed()&&id===undefined&&typeof requestIdleCallback==='function')id=requestIdleCallback(step);};
 const step=()=>{id=undefined;if(!allowed()||next>=names.length)return;const src=names[next++];void(src?prepareCardImage(src):Promise.resolve()).catch(()=>{}).finally(schedule);};
 const observer=new MutationObserver(schedule);if(game)observer.observe(game,{attributes:true,attributeFilter:['data-fx-busy']});document.addEventListener('visibilitychange',schedule);frame=requestAnimationFrame(schedule);
 return()=>{live=false;cancelAnimationFrame(frame);if(id!==undefined)cancelIdleCallback(id);observer.disconnect();document.removeEventListener('visibilitychange',schedule);};
 },[deck]);
}
