import {readFileSync,writeFileSync} from 'node:fs';
import {loadGameData} from '../../src/engine/data';
import {createGame,applyAction} from '../../src/engine/engine';
const data=loadGameData(JSON.parse(readFileSync('data/game-data.json','utf8')));
outer:for(let seed=1;seed<2000;seed++){
 const s=createGame(data,{seed,variant:'standard',sea:true,legends:true,positions:{ПИРАТЫ:['Ж','М']}}).state;
 for(const target of ['И','Г'])try{
  const r=applyAction(s,{type:'volley',ship:'Ж',target},data).state;
  if(r.pending?.kind==='reactions'&&r.pending.waiting.length){writeFileSync('docs/screenshots/ui-4/wait-scenario.json',JSON.stringify({seed,target},null,2)+'\n');break outer;}
 }catch{}
}
