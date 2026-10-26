import {ABILITY,hasAbility,shipData,type GameState} from '../../../engine/state';
import type {GameData,Side} from '../../../engine/types';
import type {LogLine} from '../../../engine/log';
export type Tone='up'|'down'|'info'|'none';
export interface WeatherRow{label:string;text:string;tone:Tone;ship?:string;side?:Side}
const sides:Side[]=['ПИРАТЫ','КОМПАНИЯ'];
export function seaHistory(log:readonly LogLine[]){return log.flatMap((l,i)=>l.sea?[{code:l.sea,round:l.round,index:i}]:[]);}
/** A preserved event result, not a reverse calculation from today's track/hold. */
export function seaResultLines(log:readonly LogLine[],code:string,round:number){
 const first=log.findIndex(l=>l.sea===code&&l.round===round);if(first<0)return [];
 let end=first+1;while(end<log.length&&log[end].kind!=='turn'&&log[end].kind!=='round')end++;
 return log.slice(first+1,end);
}
export function weatherRows(s:GameState,data:GameData,key:string,results:readonly LogLine[]=[]):WeatherRow[]{
 const ships=data.ships.map(d=>s.ships[d.code]),r=data.rules;
 const team=(side:Side,text:string,tone:Tone):WeatherRow=>({side,label:(side==='ПИРАТЫ'?'Пираты':'Компания')+' · '+data.ships.filter(d=>d.side===side).map(d=>`«${d.nick}»`).join(' и '),text,tone});
 const change=(label:string,a:number,b:number,_tone:Tone)=>`${label} ${a} → ${b}`;
 if(['calm','wind','tortuga','current','wet','caravan'].includes(key))return sides.map(side=>{
  const own=ships.filter(x=>x.side===side&&!x.sunk);
  if(!own.length)return team(side,'Нет кораблей на плаву','none');
  if(key==='calm')return team(side,'Перестроение и «смена мест»: нельзя','down');
  if(key==='wind'){const free=Object.values(s.ships).filter(x=>x.side===side).some(x=>hasAbility(data,x,ABILITY.fasterThanWind));return team(side,free?'Перестроение и так 0 («Быстрее ветра»)':change('Перестроение',r.regroupCost,0,'up'),free?'none':'up');}
  if(key==='tortuga')return team(side,s.pending?.kind==='tortuga'&&s.pending.waiting.includes(side)?`Трюм ${s.teams[side].powder}: до ${Math.min(r.seaTortuga,s.teams[side].powder)} Пороха: столько же карт`:`Трюм ${s.teams[side].powder} · решение принято`, 'info');
  if(key==='current')return team(side,own.map(x=>`«${shipData(data,x.code).nick}»`).join(' ⇄ '),'info');
  const line=results.find(l=>l.text.startsWith(side==='ПИРАТЫ'?'Пираты:':'Компания:'));
  const hit=line?.text.match(/([+−])(\d+) Пороха.*?→ (\d+)/);
  if(hit){const delta=Number(hit[2])*(hit[1]==='+'?1:-1),after=Number(hit[3]);return team(side,change('Трюм',after-delta,after,delta>0?'up':'down'),delta>0?'up':'down');}
  return team(side,`Трюм ${s.teams[side].powder}`,'info');
 });
 return ships.map(x=>{
  const d=shipData(data,x.code),base:WeatherRow={ship:x.code,side:x.side,label:d.nick,text:'',tone:'info'},guns=x.tracks.guns;
  if(x.sunk)return {...base,text:'Корабль утонул',tone:'none' as Tone};
  const enemy=ships.find(y=>y.side!==x.side&&y.pos===x.pos&&!y.sunk&&!y.submerged),opposite=enemy?`«${shipData(data,enemy.code).nick}»`:'пустое место';
  switch(key){
   case 'storm':return {...base,text:change('Залп',guns,Math.max(0,guns-r.seaStorm),'down'),tone:guns?'down':'none'};
   case 'clear':return {...base,text:change(`по ${opposite}`,guns,guns+r.seaClear,'up'),tone:'up'};
   case 'fog':return {...base,text:enemy?`бьёт только ${opposite}`:'Напротив нет цели',tone:enemy?'info':'none'};
   case 'maelstrom':{const a='fixed'in d.diagDamage?d.diagDamage.fixed:guns+d.diagDamage.offset;return {...base,text:change('по диагонали',Math.max(0,a),guns,'up'),tone:guns>a?'up':'none'};}
   case 'wave':return {...base,text:s.active==='ПИРАТЫ'&&x.side==='КОМПАНИЯ'?`${change('Паруса',x.tracks.sails,Math.max(0,x.tracks.sails-r.seaWave),'down')} · в свой ход`:`Паруса ${x.tracks.sails} · этот раунд`,tone:x.tracks.sails?'down':'none'};
   case 'reefs':return {...base,text:change('при сдвиге Корпус',x.tracks.hull,Math.max(0,x.tracks.hull-r.seaReefs),'down'),tone:'down'};
   case 'fleet':return {...base,text:change('карт за ход',x.tracks.crew,x.tracks.crew+r.seaFleet,'up'),tone:'up'};
   case 'moon':return {...base,text:`урон по Команде −${r.seaMoon}`,tone:'up'};
   default:{const lines=results.filter(l=>l.text.startsWith(`«${d.nick}»:`));
    const text=lines.map(l=>l.text.slice(l.text.indexOf(':')+1).trim()).join(' · ');
    return {...base,text:text||`${key==='thunder'?'Паруса':'Команда'} ${key==='thunder'?x.tracks.sails:x.tracks.crew}`,tone:text?(key==='rum'?'up':'down'):'info'};}
  }
 });
}
