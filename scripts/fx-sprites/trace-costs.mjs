// CPU time by category, unioned per thread so nested Paint records are never counted twice.
export function phaseCost(trace,a,b){
 const events=trace.filter(e=>e.ph==='X'&&e.ts>=a&&e.ts<b&&['Paint','RasterTask','Rasterize'].includes(e.name));
 const edges=[a,...new Set(trace.filter(e=>e.name==='BeginMainThreadFrame'&&e.ts>a&&e.ts<b).map(e=>e.ts))].sort((x,y)=>x-y);edges.push(b);
 const summary=paint=>{
  const rows=events.filter(e=>paint?e.name==='Paint':e.name!=='Paint'),threads=new Map();
  for(const e of rows){const key=e.pid+':'+e.tid,list=threads.get(key)??[];list.push([e.ts,Math.min(b,e.ts+(e.dur??0))]);threads.set(key,list)}
  const union=[];for(const intervals of threads.values()){
   intervals.sort((x,y)=>x[0]-y[0]);let last;
   for(const r of intervals){if(last&&r[0]<=last[1])last[1]=Math.max(last[1],r[1]);else{last=[...r];union.push(last)}}
  }
  const perFrame=edges.slice(1).map((end,i)=>union.reduce((sum,[start,stop])=>sum+Math.max(0,Math.min(end,stop)-Math.max(edges[i],start))/1000,0));
  return{events:rows.length,totalMs:union.reduce((sum,[start,end])=>sum+(end-start)/1000,0),maxEventMs:Math.max(0,...rows.map(e=>(e.dur??0)/1000)),maxFrameMs:Math.max(0,...perFrame)};
 };
 return{durationMs:(b-a)/1000,paint:summary(true),raster:summary(false),frameCostDefinition:'union per thread, between BeginMainThreadFrame markers; raster threads summed separately from Paint',events:events.map(e=>({name:e.name,t:(e.ts-a)/1000,ms:(e.dur??0)/1000,pid:e.pid,tid:e.tid}))};
}
