// Ship information from the current visible game; the artboards supply only presentation and artwork.
import {memo,useEffect,useLayoutEffect,useRef,useState,useSyncExternalStore,type CSSProperties} from 'react';
import {createPortal} from 'react-dom';
import {cardByCode,shipData,type GameState} from '../../../engine/state';
import type {GameData,Track} from '../../../engine/types';
import {RichText} from '../../RichText';
import {CELLS} from '../art/cells';
import soulIcon from '../art/icons/soul.svg';
import {SIDE_LABEL} from '../text';
import type {FxStore} from '../fx/FxLayer';
import {statuses} from '../Table';
import catalogue from './catalogue.json';
import './ship-window.css';
const files=import.meta.glob('./art/*',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
export const shipArt=(name:string)=>files['./art/'+name];
const decoded=new Map<string,Promise<void>>();
function decode(url:string){
 let p=decoded.get(url);if(!p){const image=new Image();image.src=url;p=image.decode().then(()=>{});decoded.set(url,p);}return p;
}
export function prepareShipWindow(code?:string):Promise<void>{
 const names=code?[(catalogue as Record<string,{name:string}>)[code].name]:Object.values(catalogue).map(x=>x.name);
 return Promise.all(Object.entries(files).filter(([key])=>names.some(name=>key.startsWith('./art/'+name+'-'))).map(([,url])=>decode(url))).then(()=>{});
}
const TRACKS:Track[]=['hull','sails','guns','crew'];
const LABELS:Record<Track,string>={hull:'Корпус',sails:'Паруса',guns:'Пушки',crew:'Команда'};
const ICONS:Record<Track,keyof typeof CELLS>={hull:'HULL',sails:'SAIL',guns:'GUN',crew:'CREW'};
const WIDTHS:Record<Track,number>={hull:13,sails:16,guns:24,crew:15};
export const ShipWindow=memo(function ShipWindow({s,data,code,store,onClose,onDiscard}:{s:GameState;data:GameData;code:string;store:FxStore;onClose:()=>void;onDiscard:()=>void}){
 const shown=useSyncExternalStore(store.subscribe,()=>store.shown(s),()=>s),ship=shown.ships[code],d=shipData(data,code),legend=cardByCode(data,`${code}-Л`);
 const design=(catalogue as Record<string,{name:string;styles:Record<string,Record<string,string>>}>)[code],name=design.name;
 const st=(key:string)=>design.styles[key] as CSSProperties;
 const frame=useRef<HTMLDivElement>(null),close=useRef<HTMLButtonElement>(null);
 const [ready,setReady]=useState(false);
 useLayoutEffect(()=>{
  const resize=()=>{const w=window.innerWidth,h=window.visualViewport?.height??window.innerHeight,k=Math.min(1,(w-16)/920,(h-16)/640);frame.current?.style.setProperty('--sw-scale',String(Math.max(.1,k)));};
  resize();addEventListener('resize',resize);visualViewport?.addEventListener('resize',resize);
  return()=>{removeEventListener('resize',resize);visualViewport?.removeEventListener('resize',resize);};
 },[]);
 useEffect(()=>{let live=true;setReady(false);void prepareShipWindow(code).then(()=>{if(live)setReady(true);});return()=>{live=false;};},[code]);
 useEffect(()=>{if(!ready)return;const old=document.activeElement as HTMLElement|null;close.current?.focus({preventScroll:true});return()=>{if(old?.isConnected)old.focus({preventScroll:true});};},[ready]);
 const asset=(part:string)=>shipArt(`${name}-${part}`);
 return createPortal(<div className="ship-window-backdrop" onClick={onClose}>
  <div className="ship-window-frame" ref={frame}>
   <section className="ship-window" style={{...st('root'),visibility:ready?'visible':'hidden'}} role="dialog" aria-modal="true" aria-label={d.name} data-testid="ship-sheet" data-ship-window={code} onClick={e=>e.stopPropagation()}>
    <header className="sw-scene" style={st('scene')} aria-label={`Сцена ${d.name}`}>
     <img className="sw-scene-still" src={asset('scene.png')} alt=""/>
     <div className="sw-plaque" style={st('plaque')}>
      {[0,1,2,3].map(i=><i key={i} className={'sw-rivet sw-rivet-'+i}/>)}
      <div style={st('plaqueText')}><span style={st('team')}>{SIDE_LABEL[d.side].name}</span><h1 style={st('title')}>«{d.name}»</h1><span style={st('captain')}>{d.captain}</span></div>
      <img className="sw-medal" style={{...st('medal'),filter:'none'}} src={asset('medal.svg')} alt={`Легенда «${legend.name}»`}/>
     </div>
     <button ref={close} className="sw-close" style={st('close')} aria-label="Закрыть" onClick={onClose}><img src={asset('close.svg')} alt=""/></button>
    </header>
    <img className="sw-body-art" src={asset('body.svg')} alt=""/>
    <div className="sw-body" style={st('body')}>
     <div className="sw-main" style={st('left')}>
      <p className="sw-motto" style={st('motto')}>{d.motto}</p>
      <div className="sw-tracks" style={st('tracks')}>
       {TRACKS.map(track=><div className="sw-track" key={track} data-sw-track={track}>
        <span className="sw-track-label">{LABELS[track]}</span>
        <span className="sw-cells" style={{width:d[track]*WIDTHS[track]}} aria-hidden>{Array.from({length:d[track]},(_,i)=><span key={i} style={{width:WIDTHS[track],opacity:i<ship.tracks[track]?1:.22}} dangerouslySetInnerHTML={{__html:CELLS[ICONS[track]]}}/>)}</span>
        <b>{ship.tracks[track]}/{d[track]}</b>
       </div>)}
       {d.souls!==undefined&&<div className="sw-souls" data-testid="ship-souls"><span>Души</span><span className="sw-soul-count"><img src={soulIcon} alt=""/>{ship.souls}/{d.souls}</span>
        {(['HULL','CREW'] as const).map(track=><span className="sw-soul-exchange" key={track} aria-label={`Душа → +1 ${track==='HULL'?'Корпус':'Команда'}`}><img src={soulIcon} alt=""/><span>→</span><span dangerouslySetInnerHTML={{__html:CELLS[track]}}/><strong>+1</strong></span>)}
       </div>}
      </div>
      <h2 style={st('featureHeading')}>Особенности</h2>
      {d.abilities.map((ability,i)=><div className="sw-feature" style={st('featureRow')} key={ability.name}>
       <span style={st('featureMedal')}><img className="sw-feature-icon" src={asset(`feature-${i}.svg`)} alt=""/></span>
       <div style={st('featureCopy')}><h3 style={st('featureName')}>{ability.name}</h3><div className="sw-feature-text" style={st('featureText')}><RichText html={ability.text}/></div></div>
      </div>)}
      {statuses(shown,data,ship).length>0&&<div className="sw-statuses">{statuses(shown,data,ship).map(x=><span key={x.label} title={x.hint}>{x.label}</span>)}</div>}
     </div>
     <aside className="sw-legend" aria-label="Легенда">
      <article className={`sw-legend-card${ship.legend?'':' sw-legend-spent'}`} style={st('card')}>
       <i className="sw-card-inset"/>
       <div style={st('cardHeader')}><span className="sw-price" style={st('cost')}><b>{legend.soul||legend.cost}</b><span className="sw-price-icon">{legend.soul?<img src={soulIcon} width="13" height="15" alt="Души"/>:<span dangerouslySetInnerHTML={{__html:CELLS.KEG_S}}/>}</span></span><span className="sw-card-type">Легенда · {legend.type.toLowerCase()}</span></div>
       <div style={st('cardArt')}><img style={st('cardImage')} src={asset('legend.svg')} alt=""/></div>
       <div style={st('cardName')}>{legend.name}</div><div style={st('cardBig')}>{legend.big}</div>
       <div style={st('cardTextBox')}><div style={st('cardText')}><RichText html={legend.text}/></div></div>
       <div className="sw-card-foot" style={st('cardFoot')}>{d.nick}</div>
       {!ship.legend&&<span className="sw-spent-label">Сыграна или ушла из игры</span>}
      </article>
     </aside>
    </div>
    <footer className="sw-footer" style={st('footer')}>
     <span style={st('count')}>Рука {ship.hand.length}</span><span style={st('count')}>Колода {ship.deck.length}</span>
     <button style={st('discard')} data-testid="ship-discard" onClick={onDiscard} aria-label={`Открыть сброс: ${ship.discard.length} карт`}><img width="22" height="22" src={asset('discard.svg')} alt=""/>Сброс {ship.discard.length}</button>
     {ship.plans.length>0&&<span className="sw-plan-count">Планы {ship.plans.length}</span>}
    </footer>
   </section>
  </div>
 </div>,document.body);
});
