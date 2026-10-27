import{readFileSync,writeFileSync,mkdirSync}from'node:fs';
import{loadGameData}from'../../src/engine/data';import{createGame,applyAction,type GameOptions}from'../../src/engine/engine';
const data=loadGameData(JSON.parse(readFileSync('data/game-data.json','utf8'))),f=JSON.parse(readFileSync('docs/screenshots/game-phone-fix/fixtures.json','utf8'));
f.victory={...f.table,finish:true};
for(let seed=1;seed<150&&!f.tortuga;seed++){
 const game:GameOptions={seed,variant:'standard',sea:true,legends:true};let s=createGame(data,game).state;const actions=[];
 for(let turn=0;turn<4;turn++){
  if(s.pending?.kind==='tortuga'){f.tortuga={record:{format:'bortom-k-bortu/match',version:1,dataVersion:data.version,setup:{game,players:{ПИРАТЫ:'human',КОМПАНИЯ:'human'},openHands:true,hints:false},actions:[...actions]}};break;}
  if(s.pending||s.winner)break;const a={type:'endTurn' as const,side:s.active};s=applyAction(s,a,data).state;actions.push(a);
 }
}
mkdirSync('docs/screenshots/ui-polish',{recursive:true});writeFileSync('docs/screenshots/ui-polish/fixtures.json',JSON.stringify(f));console.log(Object.keys(f).join(', '));
