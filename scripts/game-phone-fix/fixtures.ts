import {readFileSync,writeFileSync} from 'node:fs';
import {loadGameData} from '../../src/engine/data';
import {createGame,applyAction,type GameOptions} from '../../src/engine/engine';
import {cardByCode} from '../../src/engine/state';
import {cardNeeds,playOptions,legendOptions} from '../../src/engine/hints';
const data=loadGameData(JSON.parse(readFileSync('data/game-data.json','utf8'))),out:Record<string,unknown>={};
for(let seed=1;seed<500&&(!out.order||!out.repair||!out.legend);seed++){
 const game:GameOptions={seed,variant:'standard',sea:true,legends:true,positions:{ПИРАТЫ:['Ж','М'],КОМПАНИЯ:['И','Г']}};
 let s=createGame(data,game).state;const actions=[];
 try{for(const side of ['ПИРАТЫ','КОМПАНИЯ'] as const){const a={type:'endTurn' as const,side};s=applyAction(s,a,data).state;actions.push(a);}}catch{continue;}
 if(s.pending)continue;
 const record={format:'bortom-k-bortu/match',version:1,dataVersion:data.version,setup:{game,players:{ПИРАТЫ:'human',КОМПАНИЯ:'human'},openHands:true,hints:false},actions};
 for(const seat of ['Ж','М']){
  for(const code of s.ships[seat].hand){
   const c=cardByCode(data,code),opts=playOptions(s,data,seat,code),needs=cardNeeds(s,data,seat,code);
   if(opts.reason)continue;
   if(!out.order&&c.type==='ПРИКАЗ'&&needs.target)out.order={record,seat,code,name:c.name};
   if(!out.repair&&c.type==='РЕМОНТ'&&(needs.ship||needs.cells||needs.souls!==null))out.repair={record,seat,code,name:c.name};
  }
  const opts=legendOptions(s,data,seat);
  if(!out.legend&&opts.actions.length)out.legend={record,seat,code:`${seat}-Л`};
 }
}
for(let seed=1;seed<100&&!out.legend;seed++){
 const game:GameOptions={seed,variant:'standard',sea:false,legends:true,positions:{ПИРАТЫ:['Ж','М'],КОМПАНИЯ:['И','Г']}};
 let s=createGame(data,game).state;const actions=[];
 try{for(let turn=0;turn<7;turn++){
   const a={type:'endTurn' as const,side:s.active};s=applyAction(s,a,data).state;actions.push(a);
   if(s.active==='КОМПАНИЯ'&&!s.pending&&legendOptions(s,data,'И').actions.length){out.legend={record:{format:'bortom-k-bortu/match',version:1,dataVersion:data.version,setup:{game,players:{ПИРАТЫ:'human',КОМПАНИЯ:'human'},openHands:true,hints:false},actions},seat:'И',code:'И-Л'};break;}
 }}catch{}
}
out.table={record:JSON.parse(readFileSync('docs/screenshots/game-scale/scenario.json','utf8')),seat:'Ж'};
writeFileSync('docs/screenshots/game-phone-fix/fixtures.json',JSON.stringify(out,null,2));console.log(Object.keys(out).join(', '));
