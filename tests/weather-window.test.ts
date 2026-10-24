import {describe,it,expect} from 'vitest';
import {weatherRows,seaResultLines} from '../src/ui/game/weather-window/model';
import {data,newGame} from './helpers';
import type {LogLine} from '../src/engine/log';
describe('weather window: real values and historical results',()=>{
 it('storm uses the current guns, including an empty track',()=>{const s=newGame();s.ships.Ж.tracks.guns=0;s.ships.М.tracks.guns=2;const rows=weatherRows(s,data,'storm');expect(rows.find(r=>r.ship==='Ж')).toMatchObject({text:'Залп 0 → 0',tone:'none'});expect(rows.find(r=>r.ship==='М')).toMatchObject({text:`Залп 2 → ${Math.max(0,2-data.rules.seaStorm)}`,tone:'down'});});
 it('wind has one row per team and respects the existing free regroup ability',()=>{const rows=weatherRows(newGame(),data,'wind');expect(rows).toHaveLength(2);expect(rows[0].tone).toBe('none');expect(rows[1]).toMatchObject({text:`Перестроение ${data.rules.regroupCost} → 0`,tone:'up'});});
 it('thunder displays recorded damage, never guessed from the later track',()=>{const s=newGame();s.ships.Ж.tracks.sails=0;const lines:LogLine[]=[{text:'«Жемчужина»: −2 Паруса. Паруса 3 → 1.',kind:'damage',round:2,turn:'ПИРАТЫ',action:4,cards:[]}];const row=weatherRows(s,data,'thunder',lines).find(r=>r.ship==='Ж')!;expect(row.text).toContain('Паруса 3 → 1');expect(row.tone).toBe('down');});
 it('wet powder uses the recorded loss; missing old value shows only the current hold',()=>{const s=newGame();s.teams.ПИРАТЫ.powder=5;const line:LogLine={text:'Пираты: −2 Пороха → 2.',kind:'info',round:2,turn:'ПИРАТЫ',action:4,cards:[]};expect(weatherRows(s,data,'wet',[line])[0]).toMatchObject({text:'Трюм 4 → 2',tone:'down'});expect(weatherRows(s,data,'wet')[0].text).toBe('Трюм 5');});
 it('stops collecting instant sea events at the first turn, excluding later combat',()=>{const line=(text:string,kind:LogLine['kind'],sea?:string):LogLine=>({text,kind,round:2,turn:'ПИРАТЫ',action:4,cards:[],sea});const lines=[line('Море','round','С-01'),line('Урон моря','damage'),line('Ход Пиратов','turn'),line('Поздний урон','damage')];expect(seaResultLines(lines,'С-01',2).map(l=>l.text)).toEqual(['Урон моря']);});
});
