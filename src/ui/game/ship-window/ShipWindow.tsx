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
import './fonts.css';
import './ship-window.css';
import {prepareShipWindow,shipArt} from './assets';
import {ShipScene,prepareShipScene} from './ShipScene';
import {FeatureIcon,Medal} from './Decorations';
export {prepareShipWindow} from './assets';
const TRACKS:Track[]=['hull','sails','guns','crew'];
const LABELS:Record<Track,string>={hull:'Корпус',sails:'Паруса',guns:'Пушки',crew:'Команда'};
const WIDTHS:Record<Track,number>={hull:13,sails:16,guns:24,crew:15};
export const ShipWindow=memo(function ShipWindow({s,data,code,store,onClose,onDiscard}:{s:GameState;data:GameData;code:string;store:FxStore;onClose:()=>void;onDiscard:()=>void}){
 const shown=useSyncExternalStore(store.subscribe,()=>store.shown(s),()=>s),ship=shown.ships[code],d=shipData(data,code),legend=cardByCode(data,`${code}-Л`);
 const design=(catalogue as Record<string,{name:string;styles:Record<string,Record<string,string>>}>)[code],name=design.name;
 const st=(key:string):CSSProperties=>{const style={...design.styles[key]} as CSSProperties;if(String(style.fontFamily).includes('Alegreya SC'))style.fontFamily="'Ship Alegreya SC',Georgia,serif";else if(style.fontFamily==="Alegreya, Georgia, serif")style.fontFamily="'Ship Alegreya',Georgia,serif";return style;};
 const frame=useRef<HTMLDivElement>(null),close=useRef<HTMLButtonElement>(null);
 const [ready,setReady]=useState(false);
 useLayoutEffect(()=>{
  const resize=()=>{const w=window.innerWidth,h=window.visualViewport?.height??window.innerHeight,k=Math.min(1,(w-16)/920,(h-16)/640);frame.current?.style.setProperty('--sw-scale',String(Math.max(.1,k)));frame.current?.style.setProperty('--sw-phone-scale',String(w/390));frame.current?.style.setProperty('--sw-height',h+'px');};
  resize();addEventListener('resize',resize);visualViewport?.addEventListener('resize',resize);
  return()=>{removeEventListener('resize',resize);visualViewport?.removeEventListener('resize',resize);};
 },[]);
 useEffect(()=>{let live=true;setReady(false);void Promise.all([prepareShipWindow(code),prepareShipScene(code),...['700 28px \"Ship Alegreya SC\"','500 14px \"Ship Alegreya SC\"','700 17px \"Ship Alegreya\"','italic 400 17px \"Ship Alegreya\"'].map(font=>document.fonts.load(font,'Корабль Легенда ABC123'))]).then(()=>{if(live)setReady(true);});return()=>{live=false;};},[code]);
 // The phone sheet is opaque. Cull the covered stage without unmounting Game or changing its state.
 // The portal and diagnostics remain visible; restore the exact prior attribute on close/rotation.
 useLayoutEffect(()=>{const stage=document.getElementById('stage');if(!stage)return;const old=stage.getAttribute('data-ship-window-covered'),phone=matchMedia('(max-width:700px)');
  const update=()=>{if(ready&&phone.matches)stage.setAttribute('data-ship-window-covered','');else if(old===null)stage.removeAttribute('data-ship-window-covered');else stage.setAttribute('data-ship-window-covered',old);};
  update();phone.addEventListener('change',update);return()=>{phone.removeEventListener('change',update);if(old===null)stage.removeAttribute('data-ship-window-covered');else stage.setAttribute('data-ship-window-covered',old);};
 },[ready]);
 useEffect(()=>{if(!ready)return;const old=document.activeElement as HTMLElement|null;close.current?.focus({preventScroll:true});return()=>{if(old?.isConnected)old.focus({preventScroll:true});};},[ready]);
 const asset=(part:string)=>shipArt(`${name}-${part}`);
 return createPortal(<div className="ship-window-backdrop" onClick={onClose}>
  <div className="ship-window-frame" ref={frame}>
   {ready&&<section className="ship-window" style={st('root')} role="dialog" aria-modal="true" aria-label={d.name} data-testid="ship-sheet" data-ship-window={code} onClick={e=>e.stopPropagation()}>
    <header className="sw-scene" style={st('scene')} aria-label={`Сцена ${d.name}`}>
     <img className="sw-scene-still" src={asset('scene.png')} alt=""/><ShipScene code={code} ready={ready} store={store}/>
     <div className="sw-plaque" style={st('plaque')}>
      {[0,1,2,3].map(i=><i key={i} className={'sw-rivet sw-rivet-'+i}/>)}
      <div style={st('plaqueText')}><span style={st('team')}>{SIDE_LABEL[d.side].name}</span><h1 style={st('title')}>{d.name.startsWith("«")?d.name:`«${d.name}»`}</h1><span style={st('captain')}>{d.captain}</span></div>
      <Medal name={name} alt={`Легенда «${legend.name}»`} ready={ready} store={store}/>
     </div>
     <button ref={close} className="sw-close" style={st('close')} aria-label="Закрыть" onClick={onClose}><img src={asset('close.svg')} alt=""/></button>
    </header>
    <picture className="sw-body-art">{code==='Г'&&<source media="(max-width:700px)" srcSet={shipArt('Phone-body.svg')}/>}<img src={asset('body.svg')} alt=""/></picture>
    <div className="sw-body" style={st('body')}>
     <div className="sw-main" style={st('left')}>
      <p className="sw-motto" style={st('motto')}>{d.motto}</p>
      <div className="sw-tracks" style={st('tracks')}>
       {TRACKS.map(track=><div className="sw-track" key={track} data-sw-track={track}>
        <span className="sw-track-label">{LABELS[track]}</span>
        <span className="sw-cells" style={{width:d[track]*WIDTHS[track]}} aria-hidden>{Array.from({length:d[track]},(_,i)=><span key={i} style={{width:WIDTHS[track],opacity:i<ship.tracks[track]?1:.22}} ><img src={shipArt(`track-${track}.svg`)} alt=""/></span>)}</span>
        <b>{ship.tracks[track]}/{d[track]}</b>
       </div>)}
       {d.souls!==undefined&&<div className="sw-souls" data-testid="ship-souls"><span>Души</span><span className="sw-soul-count"><img src={soulIcon} alt=""/>{ship.souls}/{d.souls}</span>
        {(['HULL','CREW'] as const).map(track=><span className="sw-soul-exchange" key={track} aria-label={`Душа → +1 ${track==='HULL'?'Корпус':'Команда'}`}><img src={soulIcon} alt=""/><span>→</span><span dangerouslySetInnerHTML={{__html:CELLS[track]}}/><strong>+1</strong></span>)}
       </div>}
      </div>
      <h2 style={st('featureHeading')}>Особенности</h2>
      {d.abilities.map((ability,i)=><div className="sw-feature" style={st('featureRow')} key={ability.name}>
       <span style={st('featureMedal')}><FeatureIcon code={code} index={i} name={name} ready={ready} store={store}/></span>
       <div style={st('featureCopy')}><h3 style={st('featureName')}>{ability.name}</h3><div className="sw-feature-text" style={st('featureText')}><RichText html={ability.text}/></div></div>
      </div>)}
      {statuses(shown,data,ship).length>0&&<div className="sw-statuses">{statuses(shown,data,ship).map(x=><span key={x.label} title={x.hint}>{x.label}</span>)}</div>}
     </div>
     <aside className="sw-legend" aria-label="Легенда"><h2 className="sw-phone-legend-heading" style={st('featureHeading')}>Легенда</h2>
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
   </section>}
  </div>
 </div>,document.body);
});
