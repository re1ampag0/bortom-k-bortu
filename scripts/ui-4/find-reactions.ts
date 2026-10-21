// Discover a real multi-Reaction window, including a card placed in Plans by a legal endTurn.
import { readFileSync, writeFileSync } from 'node:fs';
import { loadGameData } from '../../src/engine/data';
import { applyAction, createGame } from '../../src/engine/engine';
import { cardByCode } from '../../src/engine/state';
import { refusal } from '../../src/engine/hints';
const data = loadGameData(JSON.parse(readFileSync('data/game-data.json', 'utf8')));
outer: for (let seed = 1; seed <= 3000; seed++) {
 const s = createGame(data, { seed, variant:'standard', sea:true, legends:true, positions:{ПИРАТЫ:['Ж','М'],КОМПАНИЯ:['И','Г']} }).state;
 for (const plan of s.ships['Ж'].hand.filter(c => cardByCode(data,c).type === 'РЕАКЦИЯ')) {
  try {
   const next = applyAction(s, {type:'endTurn',side:'ПИРАТЫ',plans:[plan]}, data).state;
   if(next.pending) continue;
   for(const shooter of ['И','Г']) for(const target of ['Ж','М']) {
    try {
     const hit=applyAction(next,{type:'volley',ship:shooter,target},data).state;
     if(hit.pending?.kind !== 'reactions')continue;
     const items=hit.pending.waiting.flatMap(seat=>[...hit.ships[seat].hand,...hit.ships[seat].plans].filter(card=>cardByCode(data,card).type==='РЕАКЦИЯ').map(card=>({seat,card,name:cardByCode(data,card).name,plan:hit.ships[seat].plans.includes(card),why:refusal(hit,{type:'react',seat,card},data)})));
     if(items.length!==3||!items.some(c=>c.plan&&!c.why)||!items.some(c=>c.why)||!items.some(c=>!c.why))continue;
     const result={seed,plan,shooter,target,hand:8,items};
     writeFileSync('docs/screenshots/ui-4/reaction-scenario.json',JSON.stringify(result,null,2)+'\n');
     process.stdout.write(JSON.stringify(result)+'\n');break outer;
    }catch{/* Illegal target/Volley for this seed. */}
   }
  }catch{/* Cannot put this card into Plans. */}
 }
}
