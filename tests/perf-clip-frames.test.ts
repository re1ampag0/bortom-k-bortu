import {describe,expect,it,vi} from 'vitest';
import {worstFrames,type ClipProfile} from '../src/ui/game/perf/frames';
import {clipShowStart,perfWorkHook,perfPhaseHook,perfAnimHook} from '../src/ui/game/perf/clip';
const profile:ClipProfile={start:100,end:500,frames:[116,150,200,300,320,490],prepared:[],dropped:0,
  phases:[{at:100,end:500,clip:'legend',name:'legend',kind:'clip'},
    {at:190,end:260,clip:'legend',name:'создание',kind:'work'},
    {at:210,end:280,clip:'legend',name:'приземление',kind:'visual'}],
  presses:[{at:210,name:'click fire'}]};
describe('the five worst show intervals',()=>{
  it('joins every overlapping stage and the press, not just the last stage of a frame',()=>{
    const rows=worstFrames(profile);
    expect(rows.map(r=>r.ms)).toEqual([170,100,50,34,20]);
    expect(rows[1]).toMatchObject({at:100,clips:['legend'],stages:['JS: создание','приземление'],presses:['click fire'],partial:false});
    expect(rows[2].stages).toEqual(['JS: создание']);
    expect(rows[0].presses).toEqual([]);
  });
  it('clips the entrance window and labels incomplete intervals instead of borrowing later work',()=>{
    const rows=worstFrames(profile,180,280);
    expect(rows.map(r=>[r.at,r.ms,r.partial])).toEqual([[100,80,true],[80,20,true]]);
    expect(rows[1].stages).toEqual(['JS: создание']);
    expect(rows[1].presses).toEqual([]);
  });
  it('does not start clocks, animation sampling or input observation without perf=1',()=>{
    const now=vi.spyOn(performance,'now');
    try{
      clipShowStart();
      const reads=now.mock.calls.length;
      expect(reads).toBe(0);
      expect(perfWorkHook).toBeNull();expect(perfPhaseHook).toBeNull();expect(perfAnimHook).toBeNull();
    }finally{now.mockRestore();}
  });
});
