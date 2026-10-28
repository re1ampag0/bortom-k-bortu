import {sceneIdleWork} from './game/scene-window/idle';
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
 let live=true;const names=deckCardImages(deck);
 const warm=async()=>{for(const src of names){if(!live)return;await sceneIdleWork(async()=>{if(live&&src)await prepareCardImage(src);},true,false,()=>live);}};
 void warm();return()=>{live=false;};
 },[deck]);
}
