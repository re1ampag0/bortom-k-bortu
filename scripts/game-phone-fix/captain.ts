// One legal recorded match for the captain's geometry screenshots; no bot/simulation runs.
import {readFileSync,writeFileSync} from 'node:fs';
import {loadGameData} from '../../src/engine/data';
import {createGame,applyAction,type GameOptions} from '../../src/engine/engine';
import type {Action} from '../../src/engine/state';
const data=loadGameData(JSON.parse(readFileSync('data/game-data.json','utf8')));
const game:GameOptions={seed:1,variant:'standard',sea:false,legends:true,positions:{ПИРАТЫ:['Ж','М'],КОМПАНИЯ:['И','Г']}};
let s=createGame(data,game).state;const actions:Action[]=[];
const act=(a:Action)=>{s=applyAction(s,a,data).state;actions.push(a)};
for(let round=0;round<16&&!s.ships['М'].sunk;round++){
 act({type:'endTurn',side:'ПИРАТЫ'});
 for(const ship of ['И','Г'])try{
  act({type:'volley',ship,target:'М'});
  for(let n=0;n<12&&s.pending;n++){
   if(s.pending.kind==='reactions')act({type:'noReaction',seat:s.pending.waiting[0]});else break;
  }
 }catch{}
 if(s.pending||s.winner)break;
 act({type:'endTurn',side:'КОМПАНИЯ'});
}
if(s.ships['М'].sunk&&!s.pending&&s.active==='ПИРАТЫ'){
const out=JSON.parse(readFileSync('docs/screenshots/game-phone-fix/fixtures.json','utf8'));out.captain={seat:'М',record:{format:'bortom-k-bortu/match',version:1,dataVersion:data.version,setup:{game,players:{ПИРАТЫ:'human',КОМПАНИЯ:'human'},openHands:true,hints:false},actions}};writeFileSync('docs/screenshots/game-phone-fix/fixtures.json',JSON.stringify(out,null,2));console.log('captain fixture',actions.length);
}else console.log('captain fixture unavailable',s.pending?.kind,s.ships['М'].tracks.hull);
