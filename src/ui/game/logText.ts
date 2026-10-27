import type {LogLine} from '../../engine/log';
import {cardByCode} from '../../engine/state';
import type {GameData} from '../../engine/types';
import {uiWords} from '../uiWords';
/** Grammatical labels only: the card code, stored log and engine vocabulary remain unchanged. */
export function logText(data:GameData,line:LogLine):string{
 let text=line.text;
 for(const ship of data.ships){const who=`«${ship.nick}»`,female=ship.code==='Ж'||ship.code==='М';
  const shot=text.match(new RegExp(`^${who}: Залп по «([^»]+)»(.*?)\\s*[—:]\\s*(\\d+) по ([^.]+)\\.`));
  if(shot){const target=data.ships.find(s=>s.nickDative===shot[1]||s.nick===shot[1]);const object=target?(target.code==='Ж'?target.nick.replace(/а$/,'у'):target.code==='М'?target.nick:target.nickGenitive):shot[1];text=text.replace(shot[0],`${who} бьёт «${object}»${shot[2]}: ${shot[3]} по ${shot[4]}.`);break;}
  for(const code of line.cards){const card=cardByCode(data,code),name=`«${card.name}»`;
   if(text.startsWith(`${who}: ${name}`)){text=text.replace(`${who}: ${name}`,`${who} ${female?'сыграла':'сыграл'} карту ${name}`);break;}
   if(text.startsWith(`${who}: Реакция ${name}`)){text=text.replace(`${who}: Реакция ${name}`,`${who} ${female?'ответила':'ответил'} Реакцией ${name}`);break;}
   if(text.startsWith(`${who}: Легенда ${name}`)){text=text.replace(`${who}: Легенда ${name}`,`${who} ${female?'разыграла':'разыграл'} Легенду ${name}`);break;}
  }
  text=text.replace(`${who}: карту`,`${who} ${female?'сыграла':'сыграл'} карту`)
   .replace(new RegExp(`^${who}: Пожар \\((\\d+)\\)\\s*[—:]\\s*`),`${who}: Пожар $1. `)
   .replace(new RegExp(`^${who}: Казна\\s*[—:]\\s*`),`${who} использует Казну. `)
   .replace(new RegExp(`^${who}: Сердце Дейви Джонса\\s*[—:]\\s*`),`${who} использует Сердце Дейви Джонса. `);
 }
 // UI punctuation cleanup must not rewrite printed card titles (including their own punctuation).
 const titles=[...new Set(line.cards.map(code=>`«${cardByCode(data,code).name}»`))];
 titles.forEach((title,i)=>{text=text.replaceAll(title,`\uE000${i}\uE001`)});
 return uiWords(text).replace(/(\.\s+)(ещё|дополнительный)(?=\s)/giu,(_all,start:string,word:string)=>start+word.charAt(0).toLocaleUpperCase('ru')+word.slice(1)).replace(/\uE000(\d+)\uE001/g,(_all,index:string)=>titles[Number(index)]);
}
export const logDownloadText=(data:GameData,log:readonly LogLine[])=>log.map(l=>(l.kind==='round'?'\n':'')+logText(data,l)).join('\n');
