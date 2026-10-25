import {useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import type {GameData} from '../../engine/types';
import player from '../../../RULES-PLAYER.md?raw';
import full from '../../../RULES.md?raw';
import {memo} from '../game/memo';
import {Icon} from './Menus';
import {holdMenuMotion} from './motion';
const chapters=player.split(/^## /m).slice(1).map((part,i)=>{const at=part.indexOf('\n');return{id:i,title:part.slice(0,at).trim(),text:part.slice(at+1).trim()};});
function inline(text:string):ReactNode{return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((s,i)=>s.startsWith('**')?<strong key={i}>{s.slice(2,-2)}</strong>:s.startsWith('`')?<code key={i}>{s.slice(1,-1)}</code>:s);}
function Markdown({text}:{text:string}){
 const lines=text.split('\n'),nodes:ReactNode[]=[];let i=0;
 while(i<lines.length){const line=lines[i].trim();if(!line){i++;continue;}const key=i;
  if(line.startsWith('|')){const rows:string[][]=[];while(i<lines.length&&lines[i].trim().startsWith('|'))rows.push(lines[i++].trim().replace(/^\||\|$/g,'').split('|').map(s=>s.trim()));nodes.push(<div className="menu-rules-table" key={key}><table><thead><tr>{rows[0].map((c,j)=><th key={j}>{inline(c)}</th>)}</tr></thead><tbody>{rows.slice(2).map((r,k)=><tr key={k}>{r.map((c,j)=><td key={j}>{inline(c)}</td>)}</tr>)}</tbody></table></div>);continue;}
  if(/^>/.test(line)){const q:string[]=[];while(i<lines.length&&lines[i].startsWith('>'))q.push(lines[i++].replace(/^>\s*/,''));nodes.push(<aside key={key} className="menu-boatswain"><Icon name="pipe" size={24}/><span>{inline(q.join(' '))}</span></aside>);continue;}
  if(/^#{1,4}\s/.test(line)){nodes.push(<h3 key={key}>{inline(line.replace(/^#+\s/,''))}</h3>);i++;continue;}
  if(/^[-*]\s|^\d+\.\s/.test(line)){const ordered=/^\d/.test(line),rows:ReactNode[]=[];while(i<lines.length&&/^[-*]\s|^\d+\.\s/.test(lines[i].trim())){rows.push(<li key={i}>{inline(lines[i++].trim().replace(/^([-*]|\d+\.)\s/,''))}</li>);}nodes.push(ordered?<ol key={key}>{rows}</ol>:<ul key={key}>{rows}</ul>);continue;}
  const paragraph=[line];i++;while(i<lines.length&&lines[i].trim()&&!/^(#|>|\||[-*]\s|\d+\.\s)/.test(lines[i]))paragraph.push(lines[i++].trim());nodes.push(<p key={key}>{inline(paragraph.join(' '))}</p>);
 }
 return <>{nodes}</>;
}
function VolleyDiagram({data}:{data:GameData}){const d=data.ships[0];return <aside className="menu-volley-diagram"><div className="menu-diagram-targets"><span>Напротив<br/><b>{d.guns}</b></span><span>По диагонали<br/><b>{Math.max(0,d.guns+('offset'in d.diagDamage?d.diagDamage.offset:0))}</b></span></div><svg viewBox="0 0 300 110" aria-hidden="true"><path d="M70 100V15" stroke="#c9a048" strokeWidth="5" strokeDasharray="6 4"/><path d="M70 100L235 15" stroke="#a54632" strokeWidth="3" strokeDasharray="7 5"/></svg><strong>{d.name}: Пушки {d.guns}</strong><p>Залп напротив: {d.guns} урона.<br/>Без Заряда урон идёт по Корпусу.</p></aside>;}
export function RulesWindow({data,onClose}:{data:GameData;onClose:()=>void}){
 useEffect(()=>holdMenuMotion(),[]);
 const [selected,setSelected]=useState(-1),[q,setQ]=useState(''),[all,setAll]=useState(false),body=useRef<HTMLDivElement>(null),close=useRef<HTMLButtonElement>(null);
 useEffect(()=>{close.current?.focus({preventScroll:true});},[]);useEffect(()=>{body.current?.scrollTo(0,0);},[selected,all]);
 const query=q.trim().toLocaleLowerCase('ru'),found=useMemo(()=>query.length>=2?chapters.filter(c=>(c.title+'\n'+c.text).toLocaleLowerCase('ru').includes(query)):[],[query]);
 const view=<div className="menu-window-backdrop" onClick={onClose}><section className="menu-rules-window" role="dialog" aria-modal="true" aria-label="Правила" data-testid="rules" onClick={e=>e.stopPropagation()}>
  <header><h1><Icon name="book" size={34}/>Правила</h1><button className="menu-link" onClick={()=>{setAll(!all);setQ('');}}>{all?'Правила для новичка':'Полный свод правил'}</button><button className="menu-window-close" aria-label="Закрыть" onClick={onClose} ref={close}>×</button></header>
  <div className="menu-rules-search"><input className="search" aria-label="Поиск по правилам" placeholder="Поиск по правилам…" value={q} onChange={e=>{setQ(e.target.value);setAll(false);}}/></div>
  <div className="menu-rules-layout"><nav aria-label="Главы правил"><button className={selected===-1&&!all?'on':''} onClick={()=>{setSelected(-1);setAll(false);setQ('');}}>★ Памятка</button>{chapters.map(c=><button key={c.id} className={selected===c.id&&!all?'on':''} onClick={()=>{setSelected(c.id);setAll(false);setQ('');}}>{c.title}</button>)}</nav>
  <div className="menu-rules-content" ref={body}>{query.length>=2?<><h2>Результаты поиска</h2>{!found.length&&<p>Ничего не найдено.</p>}{found.map(c=><section key={c.id}><h3><button className="menu-link" onClick={()=>{setSelected(c.id);setQ('');}}>{c.title}</button></h3><Markdown text={c.text}/></section>)}</>:all?<><h2>Полный свод правил</h2><Markdown text={full}/></>:selected<0?<><div className="menu-memo-title"><h2>Памятка</h2><span className="menu-boatswain"><Icon name="pipe" size={22}/>Боцман: «Подробности в главах слева, по одной за вахту»</span></div><div className="menu-memo">{memo(data).map(m=><section key={m.title}><h3>{m.title}</h3>{m.title==='Типы карт'?m.lines.map((l,i)=><p key={l}><Icon name={['t_charge','t_order','t_repair','t_reaction'][i]} size={34}/>{l}</p>):m.lines.map(l=><p key={l}>{l}</p>)}</section>)}</div></>:<><h2>{chapters[selected].title}</h2><div className={chapters[selected].title.startsWith('8.')?'menu-rules-volley':''}><div><Markdown text={chapters[selected].text}/></div>{chapters[selected].title.startsWith('8.')&&<VolleyDiagram data={data}/>}</div></>}
  </div></div>
 </section></div>;
 return typeof document==='undefined'?view:createPortal(view,document.body);
}
