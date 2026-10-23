// Layer audit, separate from timing: resolving nodes/reading clipping rectangles is deliberately NOT an FPS benchmark.
// node scripts/fx-finish/layer-probe.mjs DIST LABEL
import {preview} from 'vite';
import {chromium,expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const [dist,label]=process.argv.slice(2),rows=[],known=new Set(),pending=[],seaReasons=new Map();
const server=await preview({build:{outDir:dist},preview:{host:'127.0.0.1',port:5192,strictPort:true}});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
 await page.addInitScript(()=>{let seed=19427;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);});
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('LayerTree.enable');
 let tree=[];
 cdp.on('LayerTree.layerTreeDidChange',event=>{
  tree=event.layers??[];
  for(const l of tree)if(l.backendNodeId&&!seaReasons.has(l.layerId))seaReasons.set(l.layerId,cdp.send('LayerTree.compositingReasons',{layerId:l.layerId}).catch(()=>null));
  for(const l of tree){
   const id=l.backendNodeId;
   if(!id||l.width*l.height<390*844*.5||known.has(id))continue;
   known.add(id);
   pending.push(cdp.send('DOM.resolveNode',{backendNodeId:id}).then(async({object})=>{
    if(!object.objectId)return;
    await cdp.send('Runtime.callFunctionOn',{objectId:object.objectId,functionDeclaration:`function(){(window.fxLayerNodes??=new Map()).set(${id},this);}`,returnByValue:true});
    await cdp.send('Runtime.releaseObject',{objectId:object.objectId});
   }).catch(()=>{}));
  }
 });
 await page.goto('http://127.0.0.1:5192/bortom-k-bortu/?fxScene=armada&manual=1&speed=normal&perf=0');
 await expect(page.getByTestId('fx-start')).toBeVisible({timeout:20000});
 await page.evaluate(()=>document.fonts.ready);
 await page.waitForFunction(()=>window.fxIntroReady?.(document.querySelector('.board'))?.ready??true,null,{timeout:20000});
 const sample=async()=>{
  const boxes=await page.evaluate(()=>{
   const out={};
   for(const [id,node]of window.fxLayerNodes??[]){
    const el=node.nodeType===1?node:node.parentElement;if(!el?.isConnected)continue;
    let r=el.getBoundingClientRect(),left=Math.max(0,r.left),right=Math.min(innerWidth,r.right),top=Math.max(0,r.top),bottom=Math.min(innerHeight,r.bottom);
    for(let p=el.parentElement;p&&p!==document.body&&p!==document.documentElement;p=p.parentElement){const s=getComputedStyle(p),b=p.getBoundingClientRect();if(/hidden|clip|auto|scroll/.test(s.overflowX)){left=Math.max(left,b.left);right=Math.min(right,b.right);}if(/hidden|clip|auto|scroll/.test(s.overflowY)){top=Math.max(top,b.top);bottom=Math.min(bottom,b.bottom);}}
    out[id]={tag:el.tagName,cls:el.getAttribute('class')??'',fx:!!el.closest('.fx-layer'),share:Math.max(0,right-left)*Math.max(0,bottom-top)/(innerWidth*innerHeight)};
   }return out;
  });
  const large=tree.filter(l=>l.width*l.height>=390*844*.5).map(l=>({id:l.layerId,backend:l.backendNodeId,draws:l.drawsContent,w:l.width,h:l.height,...boxes[l.backendNodeId]}));
  rows.push({at:await page.evaluate(()=>performance.now()),large});
 };
 await Promise.all(pending);await sample();
 const start=await page.evaluate(()=>performance.now());await page.getByTestId('fx-start').click();
 const deadline=Date.now()+90000;
 while(Date.now()<deadline){await sample();if(await page.evaluate(()=>document.body.dataset.fxDone==='1'))break;await page.waitForTimeout(100);}
 if(!await page.evaluate(()=>document.body.dataset.fxDone==='1'))throw Error('Layer audit: Armada did not finish');
 await Promise.all(pending);await sample();
 const big=row=>row.large.filter(l=>l.share>=.5&&l.draws),fx=row=>big(row).filter(l=>l.fx),films=row=>fx(row).filter(l=>/lg-veil|lg-sun|lg-bar|fx-flash-board/.test(l.cls));
 const peak=select=>rows.reduce((a,r)=>select(r).length>select(a).length?r:a,rows[0]);
 const top=peak(fx),f=peak(films),sea=new Map();
 for(const r of rows)for(const l of r.large)if(/\bsea-table\b/.test(l.cls))sea.set(l.id,{backend:l.backend,w:l.w,h:l.h});
 const reasons={};for(const [id]of sea)reasons[id]=await seaReasons.get(id);
 const report={seaReasons:reasons,viewport:'390×844 DPR3 CPU×4',auditOnly:true,definition:'drawsContent layers; DOM rectangle clipped by viewport/overflow ancestors; share≥0.5',start,idle:rows[0],fxPeak:{at:top.at-start,count:fx(top).length,layers:fx(top)},filmPeak:{at:f.at-start,count:films(f).length,layers:films(f)},seaLayers:[...sea],unresolved:rows.reduce((n,r)=>Math.max(n,r.large.filter(l=>!l.tag).length),0),samples:rows};
 writeFileSync(`docs/screenshots/fx-finish/layers-${label}.json`,JSON.stringify(report,null,1)+'\n');
 console.log(JSON.stringify({fxPeak:report.fxPeak.count,filmPeak:report.filmPeak.count,seaLayers:report.seaLayers,unresolved:report.unresolved}));
}finally{await browser.close();await new Promise(r=>server.httpServer.close(r));}
