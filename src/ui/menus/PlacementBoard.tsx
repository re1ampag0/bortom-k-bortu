import type {GameData,Side} from '../../engine/types';
import {MenuScene,Boat,Icon,ShipScales,shipName} from './Menus';
/** Opponent slots are deliberately generic; this component receives only the team's own order. */
export function PlacementBoard({data,side,order,onSwap}:{data:GameData;side:Side;order:readonly string[];onSwap:()=>void}){
 return <div className="menu-placement-board"><MenuScene name="Panel"/>
  <svg className="menu-placement-lines" viewBox="0 0 1000 380" preserveAspectRatio="none" aria-hidden="true"><path d="M250 94V310M750 94V310" stroke="#151511" strokeWidth="8"/><path d="M250 94V310M750 94V310" stroke="#c4a35d" strokeWidth="3" strokeDasharray="6 4"/><path d="M250 94L750 270M750 94L250 270" stroke="#a04b35" strokeWidth="2" strokeDasharray="8 7"/><circle cx="250" cy="94" r="7" fill="#241d17"/><circle cx="750" cy="94" r="7" fill="#241d17"/></svg>
  <div className="menu-opponents">{['слева','справа'].map(label=><div className="menu-enemy-slot" key={label}><Boat name="engraved_ink" muted/><Icon name="spyglass" size={30}/><strong>{side==='ПИРАТЫ'?'Компания':'Пираты'}</strong><span><span className="menu-desktop">{label}, </span>в тумане</span><i className="menu-fog"/></div>)}</div>
  <span className="menu-opposite left">напротив</span><span className="menu-opposite right">напротив</span><span className="menu-diagonal">по диагонали · −1 урон</span><div className="menu-placement-center"><button className="menu-medal dark" onClick={onSwap} aria-label="Переставить корабли"><Icon name="swap" size={46}/></button></div>
  <div className="menu-own-ships">{order.map((code,i)=>{const d=data.ships.find(s=>s.code===code)!;return <section className="menu-own-slot" key={code}><b className="menu-slot-heading">{i===0?'СЛЕВА':'СПРАВА'}</b><Boat name={shipName(code)}/><div className="menu-slot-name" style={{background:d.color}}><h2>{d.name}</h2><small>{d.captain}</small></div><ShipScales data={data} code={code}/></section>;})}</div>
  <span className="menu-placement-side">{side==='ПИРАТЫ'?'Пираты':'Компания'}</span>
 </div>;
}
