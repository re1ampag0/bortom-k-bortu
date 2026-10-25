import type {GameData,Side} from '../../engine/types';
import {MenuScene,Boat,Icon,ShipScales,shipName} from './Menus';
/** Opponent slots are deliberately generic; this component receives only the team's own order. */
export function PlacementBoard({data,side,order,onSwap}:{data:GameData;side:Side;order:readonly string[];onSwap:()=>void}){
 return <div className="menu-placement-board"><MenuScene name="Panel"/>
  <svg className="menu-placement-lines" viewBox="0 0 1000 380" preserveAspectRatio="none" aria-hidden="true"><path d="M220 105V310M780 105V310" stroke="#151511" strokeWidth="8"/><path d="M220 105V310M780 105V310" stroke="#c4a35d" strokeWidth="3" strokeDasharray="6 4"/><path d="M220 105L780 310M780 105L220 310" stroke="#a04b35" strokeWidth="2" strokeDasharray="8 7"/><circle cx="220" cy="105" r="7" fill="#241d17"/><circle cx="780" cy="105" r="7" fill="#241d17"/></svg>
  <div className="menu-opponents">{['слева','справа'].map(label=><div className="menu-enemy-slot" key={label}><Boat name="engraved_ink" muted/><Icon name="spyglass" size={30}/><span>{label}, в тумане</span><i className="menu-fog"/></div>)}</div>
  <div className="menu-placement-center"><span>напротив</span><button className="menu-medal dark" onClick={onSwap} aria-label="Переставить корабли"><Icon name="swap" size={46}/></button><span>по диагонали</span></div>
  <div className="menu-own-ships">{order.map(code=>{const d=data.ships.find(s=>s.code===code)!;return <section className="menu-own-slot" key={code}><Boat name={shipName(code)}/><h2 style={{background:d.color}}>{d.name}</h2><ShipScales data={data} code={code}/></section>;})}</div>
  <span className="menu-placement-side">{side==='ПИРАТЫ'?'Пираты':'Компания'}</span>
 </div>;
}
