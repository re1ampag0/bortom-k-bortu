import {useLayoutEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {seaCardByCode,shipData,type GameState} from '../../../engine/state';
import type {GameData} from '../../../engine/types';
import type {LogLine} from '../../../engine/log';
import {HIDDEN} from '../../../engine/view';
import {RichText} from '../../RichText';
import {roman} from '../text';
import whistle from './art/whistle.svg';
import {wxSvg} from '../art/wx';
import {weatherRows,seaHistory,seaResultLines} from './model';
import '../scene-window/fonts.css';
import '../scene-window/scene.css';
import './weather-window.css';
export function WeatherWindow({s,data,code,log=[],onClose}:{s:GameState;data:GameData;code?:string;log?:readonly LogLine[];onClose:()=>void}){
 const current=s.sea?.current,[selected,setSelected]=useState(code??current),card=selected?seaCardByCode(data,selected):null,frame=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>{const update=()=>frame.current?.style.setProperty('--ww-scale',String(Math.min(1,(innerWidth-16)/920,((visualViewport?.height??innerHeight)-16)/600)));update();addEventListener('resize',update);visualViewport?.addEventListener('resize',update);return()=>{removeEventListener('resize',update);visualViewport?.removeEventListener('resize',update);};},[]);
 const history=seaHistory(log),entry=[...history].reverse().find(x=>x.code===selected),round=entry?.round??s.round,all=card?.when==='Весь раунд';
 const rows=card&&selected?weatherRows(s,data,card.key,seaResultLines(log,selected,round)):[];
 const tips=(data as GameData&{seaTips?:Record<string,string>}).seaTips;
 const currentCard=current?seaCardByCode(data,current):null,onTable=currentCard?.when==='Весь раунд'?1:0;
 const view=(<div className="weather-window-backdrop" onClick={onClose}><div className="weather-window-frame" ref={frame}>
 <section className="weather-window" role="dialog" aria-modal="true" aria-label={card?`Море: ${card.name}`:'Море'} data-testid="sea-sheet" onClick={e=>e.stopPropagation()}>
 <header className="ww-scene"><div className="ww-plaque"><small>Море · {card?.when.toLowerCase()}</small><h1>{card?.name??'Море'}</h1><b>{card?.big}</b></div><button className="ww-close" aria-label="Закрыть" onClick={onClose}>×</button></header>
 {card?<div className="ww-body"><div className="ww-main"><div className="ww-heading"><h2>Что делает</h2><span>{selected!==current?entry?`Карта раунда ${roman(round)}`:'Ещё не открыта':all?`до конца раунда ${roman(round)}`:`сработала в начале раунда ${roman(round)}`}</span></div>
 <div className="ww-rules"><RichText html={card.text}/></div>
 <h2>{all?'Сейчас на столе':'Что изменилось'}</h2>
 {selected!==current?<p>Просматриваемая карта сейчас не действует.</p>:<div className={'ww-rows '+(rows.some(x=>x.ship)?'ships':'teams')}>{rows.map((r,i)=><div className={'ww-row '+r.tone} key={i}><strong style={{background:r.ship?shipData(data,r.ship).color:r.side==='ПИРАТЫ'?'#6a3028':'#28594f',color:'#f6e7c6'}}>{r.label}</strong><span>{r.text}</span></div>)}</div>}
 {['wave','maelstrom'].includes(card.key)&&selected===current&&<span className="ww-tag">ход {s.active==='ПИРАТЫ'?'Пиратов':'Компании'}</span>}
 {card.key==='tortuga'&&s.pending?.kind==='tortuga'&&<span className="ww-tag">ждёт решения команд</span>}
 <p className="ww-boatswain"><img src={whistle} alt=""/><span><b>Боцман:</b> {tips?.[card.key]?.replace('{cap}',String(data.econ.cap)).replace('{seaClear}',String(data.rules.seaClear)).replace('{seaMoon}',String(data.rules.seaMoon))}</span></p><p className="ww-flavor">{card.flavor}</p>
 <footer><nav aria-label="История моря">{history.map((x,i)=><button key={i} title={`Раунд ${x.round}: ${seaCardByCode(data,x.code).name}`} aria-pressed={selected===x.code} onClick={()=>setSelected(x.code)}><span dangerouslySetInnerHTML={{__html:wxSvg(seaCardByCode(data,x.code).key,26,23)}}/>{roman(x.round)}</button>)}</nav><p>В колоде моря {s.sea?.deck.length??0}<br/>в сбросе {(s.sea?.discard.length??0)+(current&&!onTable?1:0)}{onTable?', на столе 1':''}</p></footer>
 {current&&selected!==current&&<button className="cref" data-sea={current} data-testid="sea-current" onClick={()=>setSelected(current)}>Сейчас в море: {currentCard?.name}</button>}
 {s.sea?.peek&&s.sea.deck.slice(0,s.sea.peek.n).every(c=>c!==HIDDEN)&&<p data-testid="sea-peek">Следующие карты моря («Тиа Дальма», их знаете только вы): {s.sea.deck.slice(0,s.sea.peek.n).map(c=><button className="cref" data-sea={c} key={c} onClick={()=>setSelected(c)}>«{seaCardByCode(data,c).name}»</button>)}</p>}
 </div><aside className="ww-card"><small className="ww-card-head"><span>Море</span><span>{card.when.toLowerCase()}</span></small><div className="ww-medal" dangerouslySetInnerHTML={{__html:wxSvg(card.key,118,100)}}/><h3 style={{fontSize:card.name.length<15?21:19}}>{card.name}</h3><b>{card.big}</b><div className="ww-card-copy"><p style={{fontSize:card.text.length<110?12:11.5}}><RichText html={card.text}/></p></div><footer>Раунд {roman(round)}</footer></aside></div>:<p>Партия без колоды моря.</p>}
 </section></div></div>);
 return typeof document==='undefined'?view:createPortal(view,document.body);
}
