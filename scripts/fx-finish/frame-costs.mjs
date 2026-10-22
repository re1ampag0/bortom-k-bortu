// Attribute wall-clock rAF intervals to the renderer trace. Categories are clipped
// at BOTH boundaries; synchronous Style/Layout/Paint are subtracted from scripting.
const SCRIPT=new Set(['FunctionCall','EvaluateScript','TimerFire','EventDispatch','FireAnimationFrame','RunMicrotasks','v8.compile','v8.callFunction','V8.Execute','MinorGC','MajorGC','V8.GC_SCAVENGER','FireIdleCallback','XHRReadyStateChange','ParseHTML']);
const STYLE=new Set(['UpdateLayoutTree','RecalculateStyles']);
const LAYERS=new Set(['Layerize','UpdateLayerTree','CompositeLayers','PaintArtifactCompositor::Update']);
function union(rows){
  const out=[];
  for(const r of rows.sort((a,b)=>a[0]-b[0])){
    const last=out.at(-1);
    if(last&&r[0]<=last[1])last[1]=Math.max(last[1],r[1]);else out.push([...r]);
  }return out;
}
const length=rows=>rows.reduce((n,[a,b])=>n+b-a,0)/1000;
function subtract(base,cut){
  return base.flatMap(([a,b])=>{let out=[[a,b]];for(const [c,d]of cut)out=out.flatMap(([x,y])=>d<=x||c>=y?[[x,y]]:[...(c>x?[[x,c]]:[]),...(d<y?[[d,y]]:[])]);return out;});
}
export function frameCosts(events,frames,profile,anchor){
  const point=perf=>anchor.trace+(perf-anchor.perf)*1000;
  return frames.map(f=>{
    const a=point(profile.start+f.at),b=a+f.ms*1000;
    const rows=events.filter(e=>e.ph==='X'&&e.pid===anchor.pid&&e.tid===anchor.tid&&e.ts<b&&e.ts+(e.dur??0)>a);
    const span=e=>[Math.max(a,e.ts),Math.min(b,e.ts+(e.dur??0))];
    const category=check=>union(rows.filter(check).map(span));
    const style=category(e=>STYLE.has(e.name)),layout=category(e=>e.name==='Layout'),paint=category(e=>e.name==='Paint'),layer=category(e=>LAYERS.has(e.name));
    const js=category(e=>SCRIPT.has(e.name));
    const excluded=union([...style,...layout,...paint,...layer]);
    const work=profile.phases.filter(p=>p.kind==='work'&&/вставка|создание|renderWith|холст:/.test(p.name)&&p.at<profile.start+f.at+f.ms&&p.end>profile.start+f.at);
    const workSpans=union(work.map(p=>[Math.max(a,point(p.at)),Math.min(b,point(p.end))]));
    const threads=new Map();
    for(const e of events)if(e.ph==='X'&&/RasterTask|Rasterize/.test(e.name)&&e.ts<b&&e.ts+(e.dur??0)>a){const k=`${e.pid}:${e.tid}`;const list=threads.get(k)??[];list.push(span(e));threads.set(k,list);}
    return {...f,costs:{styleMs:length(style),layoutMs:length(layout),paintMs:length(paint),scriptExclusiveMs:length(subtract(js,excluded)),layerizeMs:length(layer),rasterWorkerMs:[...threads.values()].reduce((n,list)=>n+length(union(list)),0),unattributedWallMs:Math.max(0,f.ms-length(union([...js,...excluded])))},
      domWork:{ms:length(workSpans),calls:work.length,names:[...new Set(work.map(p=>p.name))]},
      layerEvents:rows.filter(e=>LAYERS.has(e.name)).map(e=>({name:e.name,ms:length([span(e)])})),
      // Layerize is work on compositing, not proof of allocating that many new layers.
      allocatedLayers:null,
      evidence:rows.filter(e=>STYLE.has(e.name)||e.name==='Layout'||e.name==='Paint'||LAYERS.has(e.name)||SCRIPT.has(e.name)).sort((x,y)=>(y.dur??0)-(x.dur??0)).slice(0,6).map(e=>({name:e.name,ms:length([span(e)]),stack:(e.args?.beginData?.stackTrace??e.args?.data?.stackTrace??[]).slice(0,2).map(s=>s.functionName)}))};
  });
}
