// Presentation only. The callers retain the original engine decisions and handlers.
import type {ReactNode} from 'react';
import type {GameData} from '../../engine/types';
import {cardByCode} from '../../engine/state';
import {HandCard,cardClass} from './Hand';
import {CELLS} from './art/cells';
import {oakMedal} from './art/oak';
export const PLAN_KEY='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 24"><g fill="none" stroke="#d6d8da" stroke-width="2.8" stroke-linecap="round"><circle cx="11" cy="12" r="6"/><path d="M17 12h18m-6 0v6m5-6v4"/></g></svg>';
export const PLAN_LOCK='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40"><path d="M9 18V10a7 7 0 0 1 14 0v8" fill="none" stroke="#949fa7" stroke-width="4"/><rect x="4" y="16" width="24" height="21" rx="3" fill="#5d6569" stroke="#afb9bd"/><path d="M16 23v7" stroke="#121314" stroke-width="3"/></svg>';
import './play-sheet.css';
export function PlaySheet({title,sub,card,hold,target,actions,children,testid,tools,plans=false}: {
 title:string;sub?:string;card?:{data:GameData;code:string};hold?:{powder:number;cap:number};
 target?:{name:string;color:string}|null;actions:ReactNode;children?:ReactNode;testid?:string;tools?:ReactNode;plans?:boolean;
}){
 const c=card?cardByCode(card.data,card.code):null,cost=c?.cost??0;
 return <section className={`panel oak-sheet decision-sheet play-sheet ${c?cardClass(c):''} ${plans?'plans-sheet':''}`} data-testid={testid}>
  <div className="ps-card" aria-hidden>{card?<HandCard data={card.data} code={card.code} off={null}/>:<span className="ps-emblem" dangerouslySetInnerHTML={{__html:plans?PLAN_KEY:oakMedal('anchor')}}/>}</div>
  <div className="ps-main">
   <header className="cs-head"><span className="ps-kind">{plans?'Планы':c?.type??'Решение'}</span>{tools}</header>
   <h2 className="cs-title">{title}</h2>
   {sub&&<p className="ds-note">{sub}</p>}
   {target!==undefined&&<p className="ps-target"><span>Цель</span><b className={target?'picked':''} style={target?{background:target.color}:undefined}>{target?target.name:'не выбрана'}</b></p>}
   {children&&<div className="ds-body">{children}</div>}
  </div>
  <div className="ps-end">
   {hold&&<div className="ps-price"><div className="ps-coin" aria-label={`Цена: ${cost} Пороха${c?.soul?`, ${c.soul} Душ`:''}`}><i dangerouslySetInnerHTML={{__html:CELLS.KEG_S}}/><b>{cost}</b></div>
    <div><small>Цена</small><strong>{cost} Пороха{c?.soul?` · ${c.soul} Д`:''}</strong></div>
    <div className="ps-hold"><small>Трюм</small><span className="ps-kegs">{Array.from({length:hold.cap},(_,i)=><i key={i} className={`${i<hold.powder?'full':''} ${i>=Math.max(0,hold.powder-cost)&&i<hold.powder?'spent':''}`} dangerouslySetInnerHTML={{__html:CELLS.KEG_S}}/>)}</span><span>останется {Math.max(0,hold.powder-cost)} из {hold.cap}</span></div>
   </div>}
   {actions}
  </div>
 </section>;
}
