import {readFileSync,writeFileSync} from 'node:fs';
import {loadGameData} from '../../src/engine/data';
import {createGame} from '../../src/engine/engine';
const data=loadGameData(JSON.parse(readFileSync('data/game-data.json','utf8')));
for(let seed=1;seed<=1000;seed++) {
 const s=createGame(data,{seed,variant:'standard',sea:true,legends:true,positions:{ПИРАТЫ:['Ж','М'],КОМПАНИЯ:['И','Г']}}).state;
 if(s.pending?.kind==='tortuga') {
  const result={seed,pending:s.pending,powder:s.teams};writeFileSync('docs/screenshots/ui-4/tortuga-scenario.json',JSON.stringify(result,null,2)+'\n');console.log(result);break;
 }
}
