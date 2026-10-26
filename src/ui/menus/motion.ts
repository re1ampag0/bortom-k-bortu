import {loadSettings,subscribeSettings} from '../storage';
import {initPerf,perfOff,subscribePerf} from '../game/perf/state';
let simple=loadSettings().effects==='simple',covered=0;
const overlays=new Set<()=>void>();
export function holdMenuMotion(){covered++;overlays.forEach(fn=>fn());let released=false;return()=>{if(released)return;released=true;covered=Math.max(0,covered-1);overlays.forEach(fn=>fn());};}
export const menuMotionEnabled=()=>!simple&&!perfOff('simple')&&!perfOff('css')&&!perfOff('filters');
export const menuMotionAllowed=()=>!covered&&menuMotionEnabled();
export function subscribeMenuMotion(listener:()=>void){
 overlays.add(listener);
 const settings=subscribeSettings(s=>{simple=s.effects==='simple';listener();}),perf=subscribePerf(listener);
 return()=>{overlays.delete(listener);settings();perf();};
}
export const initMenuMotion=initPerf;
