// «Передайте устройство» (docs/TZ.md, «Очередь хода», п. 7): full screen in the team's colour with the reason and
// what happened while the team was away. Nothing hidden is rendered under it: the table is not mounted at all.
import type { Side } from '../../engine/types';
import { SIDE_LABEL } from './text';
import { useTableBody } from './tableBody';
import {MenuSurface,MenuScene,Boat,Icon} from '../menus/Menus';

export function Curtain({
  side,
  title,
  reason,
  summary,
  onReady,
}: {
  side: Side;
  title: string;
  reason: string;
  summary: string[];
  onReady: () => void;
}) {
  useTableBody('curtain');
  return <MenuSurface kind="prep" className={`menu-curtain ${side==='ПИРАТЫ'?'pirates':'company'}`}><main data-testid="curtain">
    <p className="menu-kicker">Игра на одном экране</p><span className="menu-medal dark"><Icon name="mugs" size={48}/></span><h1 className="menu-title">{title}</h1><p className="menu-subtitle">{reason}</p>
    {summary.length>0&&<section className="menu-curtain-summary"><h2>Пока вас не было</h2><ul>{summary.map((line,i)=><li key={i}>{line}</li>)}</ul></section>}
    <button className="menu-primary" data-testid="curtain-ready" onClick={onReady} autoFocus>Открыть карты {SIDE_LABEL[side].gen}</button>
    <p className="menu-curtain-note">Ваши карты откроются только после нажатия.<br/>Боцман уже отвернулся.</p>
    <div className="menu-curtain-sea"><MenuScene name={side==='ПИРАТЫ'?'Blood':'Deep'}/><div><Boat name={side==='ПИРАТЫ'?'pearl':'endeavour'} muted/><Boat name={side==='ПИРАТЫ'?'revenge':'dutch'} muted/></div></div>
   </main></MenuSurface>;
}
