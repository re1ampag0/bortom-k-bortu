// Build a reproducible screenshot fixture using normal game actions, not a test or simulation.
import {readFileSync,writeFileSync} from 'node:fs';
import {loadGameData} from '../../src/engine/data';
import {createGame,applyAction,type GameOptions} from '../../src/engine/engine';
const data=loadGameData(JSON.parse(readFileSync('data/game-data.json','utf8')));
for(let seed=1;seed<300;seed++)try{
 const game:GameOptions={seed,variant:'standard' as const,sea:true,legends:true,positions:{ПИРАТЫ:['Ж','М'],КОМПАНИЯ:['И','Г']}};
 let s=createGame(data,game).state;const actions:any[]=[];
 for(const side of ['ПИРАТЫ','КОМПАНИЯ'] as const){const a={type:'endTurn' as const,side};s=applyAction(s,a,data).state;actions.push(a);}
 if(s.pending||s.ships['Ж'].hand.length!==5)continue;
 const a={type:'volley' as const,ship:'Ж',target:'И'};const result=applyAction(s,a,data).state;
 if(result.pending?.kind!=='reactions')continue;
 writeFileSync('docs/screenshots/game-scale/scenario.json',JSON.stringify({format:'bortom-k-bortu/match',version:1,dataVersion:data.version,setup:{game,players:{ПИРАТЫ:'human',КОМПАНИЯ:'human'},openHands:true,hints:false},actions},null,2));break;
}catch{}
