import {weatherPoster} from '../scene-window/posters';
import {mayWarmScenes} from '../scene-window/idle';
import {lazy,Suspense,useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {seaCardByCode,shipData,type GameState} from '../../../engine/state';
import type {GameData} from '../../../engine/types';
import type {LogLine} from '../../../engine/log';
import {HIDDEN} from '../../../engine/view';
import {RichText} from '../../RichText';
import {roman} from '../text';
import whistle from './art/whistle.svg';
import {wxSvg} from '../art/wx';
import type {FxStore} from '../fx/FxLayer';
import {loadWeatherScene} from '../scene-window/loadWindows';
const WeatherScene=lazy(()=>loadWeatherScene().then(module=>({default:module.WeatherScene})));
import {weatherRows,seaHistory,seaResultLines} from './model';
import '../scene-window/fonts.css';
import '../scene-window/scene.css';
import './weather-window.css';
export function WeatherWindow({s,data,code,log=[],store,onClose}:{s:GameState;data:GameData;code?:string;store?:FxStore;log?:readonly LogLine[];onClose:()=>void}){
 const current=s.sea?.current,[selected,setSelected]=useState(code??current),card=selected?seaCardByCode(data,selected):null,frame=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>{const update=()=>{frame.current?.style.setProperty('--ww-scale',String(Math.min(1,(innerWidth-16)/920,((visualViewport?.height??innerHeight)-16)/600)));frame.current?.style.setProperty('--ww-phone-scale',String(innerWidth/390));frame.current?.style.setProperty('--ww-height',(visualViewport?.height??innerHeight)+'px');};update();addEventListener('resize',update);visualViewport?.addEventListener('resize',update);return()=>{removeEventListener('resize',update);visualViewport?.removeEventListener('resize',update);};},[]);
 // Reuse the opaque ship sheet's local stage culling, preserving diagnostics and resident glints.
 useLayoutEffect(()=>{const stage=document.getElementById('stage');if(!stage)return;const old=stage.getAttribute('data-ship-window-covered'),media=matchMedia('(max-width:700px)');const update=()=>{if(media.matches)stage.setAttribute('data-ship-window-covered','');else if(old===null)stage.removeAttribute('data-ship-window-covered');else stage.setAttribute('data-ship-window-covered',old);};update();media.addEventListener('change',update);return()=>{media.removeEventListener('change',update);if(old===null)stage.removeAttribute('data-ship-window-covered');else stage.setAttribute('data-ship-window-covered',old);};},[]);
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;frame.current?.querySelector<HTMLButtonElement>('.ww-close')?.focus({preventScroll:true});return()=>{if(previous?.isConnected)previous.focus({preventScroll:true});};},[]);
 const [liveScene,setLiveScene]=useState(false);
 useEffect(()=>{setLiveScene(false);let frame=requestAnimationFrame(()=>{frame=requestAnimationFrame(()=>setLiveScene(true));});return()=>cancelAnimationFrame(frame);},[selected]);
 const history=seaHistory(log),entry=[...history].reverse().find(x=>x.code===selected),round=entry?.round??s.round,all=card?.when==='Весь раунд';
 const rows=card&&selected?weatherRows(s,data,card.key,seaResultLines(log,selected,round)):[];
 const tips=(data as GameData&{seaTips?:Record<string,string>}).seaTips;
 const currentCard=current?seaCardByCode(data,current):null,onTable=currentCard?.when==='Весь раунд'?1:0;
 const view=(<div className="weather-window-backdrop" onClick={onClose}><div className="weather-window-frame" ref={frame}>
 <section className="weather-window" role="dialog" aria-modal="true" aria-label={card?`Море: ${card.name}`:'Море'} data-testid="sea-sheet" onClick={e=>e.stopPropagation()}>
 <header className="ww-scene">{card&&<picture className="ww-poster"><source media="(max-width:700px)" srcSet={weatherPoster(card.key,true)}/><img src={weatherPoster(card.key)} alt=""/></picture>}{card&&store&&liveScene&&mayWarmScenes()&&<div className="ww-live"><Suspense fallback={null}><WeatherScene name={card.key} store={store}/></Suspense></div>}<div className="ww-plaque">{[0,1,2,3].map(i=><i key={i} className={'ww-rivet ww-rivet-'+i}/>)}<small>Море · {card?.when.toLowerCase()}</small><h1 style={{fontSize:card&&card.name.length>10?25:30}}>{card?.name??'Море'}</h1><b>{card?.big}</b></div><button className="ww-close" aria-label="Закрыть" onClick={onClose}><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="#2e2014" strokeWidth="2.6" strokeLinecap="round"/></svg></button></header>
 {card?<div className="ww-body"><div className="ww-main"><div className="ww-heading"><h2>Что делает</h2><span>{selected!==current?entry?`Карта раунда ${roman(round)}`:'Ещё не открыта':all?`до конца раунда ${roman(round)}`:`сработала в начале раунда ${roman(round)}`}</span></div>
 <div className="ww-rules"><RichText html={card.text}/></div>
 <h2>{all?'Сейчас на столе':'Что изменилось'}</h2>
 {selected!==current?<p>Просматриваемая карта сейчас не действует.</p>:<div className={'ww-rows '+(rows.some(x=>x.ship)?'ships':'teams')}>{rows.map((r,i)=><div className={'ww-row '+r.tone} key={i}><strong style={{background:r.ship?shipData(data,r.ship).color:r.side==='ПИРАТЫ'?'#3a2a22':'#5a4618',color:'#f6e7c6'}}>{r.ship?`«${r.label}»`:r.label.split(' · ')[0]}</strong>{!r.ship&&<small>{r.label.split(' · ')[1]}</small>}<span>{r.text.split(/(→\s*\d+|[+−]\d+)/).map((part,j)=>/^(→|[+−])/.test(part)?<b key={j}>{part}</b>:part)}</span></div>)}</div>}
 {['wave','maelstrom'].includes(card.key)&&selected===current&&<span className="ww-tag">ход {s.active==='ПИРАТЫ'?'Пиратов':'Компании'}</span>}
 {card.key==='tortuga'&&s.pending?.kind==='tortuga'&&<span className="ww-tag">ждёт решения команд</span>}
 <p className="ww-boatswain"><img src={whistle} alt=""/><span><b>Боцман:</b> {tips?.[card.key]?.replace('{cap}',String(data.econ.cap)).replace('{seaClear}',String(data.rules.seaClear)).replace('{seaMoon}',String(data.rules.seaMoon))}</span></p><p className="ww-flavor">{card.flavor}</p>
 
 {current&&selected!==current&&<button className="cref" data-sea={current} data-testid="sea-current" onClick={()=>setSelected(current)}>Сейчас в море: {currentCard?.name}</button>}
 {s.sea?.peek&&s.sea.deck.slice(0,s.sea.peek.n).every(c=>c!==HIDDEN)&&<p data-testid="sea-peek">Следующие карты моря («Тиа Дальма», их знаете только вы): {s.sea.deck.slice(0,s.sea.peek.n).map(c=><button className="cref" data-sea={c} key={c} onClick={()=>setSelected(c)}>«{seaCardByCode(data,c).name}»</button>)}</p>}
 </div><aside className="ww-card"><small className="ww-card-head"><span>Море</span><span>{card.when.toLowerCase()}</span></small><div className="ww-medal" dangerouslySetInnerHTML={{__html:wxSvg(card.key,118,100)}}/><h3 style={{fontSize:card.name.length<15?21:19}}>{card.name}</h3><b>{card.big}</b><div className="ww-card-copy"><p style={{fontSize:card.text.length<110?12:11.5}}><RichText html={card.text}/></p></div><footer>Раунд {roman(round)}</footer></aside></div>:<p>Партия без колоды моря.</p>}
 {card&&<footer className="ww-bottom"><nav aria-label="История моря">{history.map((x,i)=><button key={i} title={`Раунд ${x.round}: ${seaCardByCode(data,x.code).name}`} aria-pressed={selected===x.code} onClick={()=>setSelected(x.code)}><span dangerouslySetInnerHTML={{__html:wxSvg(seaCardByCode(data,x.code).key,26,23)}}/><em>Раунд {roman(x.round)}<br/>{seaCardByCode(data,x.code).name}</em></button>)}</nav><p>В колоде моря {s.sea?.deck.length??0}<br/>в сбросе {(s.sea?.discard.length??0)+(current&&!onTable?1:0)}{onTable?', на столе 1':''}</p></footer>}
 </section></div></div>);
 return typeof document==='undefined'?view:createPortal(view,document.body);
}
