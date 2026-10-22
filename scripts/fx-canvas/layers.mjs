// Attribute compositor layers to actual DOM nodes, separately from the timing run.
import {preview} from 'vite';import{chromium}from'@playwright/test';import{writeFileSync}from'node:fs';
const server=await preview({build:{outDir:'tmp/fx-canvas/measure-dist'},preview:{host:'127.0.0.1',port:5187,strictPort:true}}),browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
try{
 const page=await browser.newPage({viewport:{width:430,height:932},deviceScaleFactor:3}),cdp=await page.context().newCDPSession(page);await cdp.send('LayerTree.enable');
 let peak=0,busy=false,latest=null,pending=Promise.resolve();
 cdp.on('LayerTree.layerTreeDidChange',event=>{
  if((event.layers?.length??0)<=peak||busy)return;peak=event.layers.length;busy=true;
  pending=(async()=>{const {root}=await cdp.send('DOM.getDocument',{depth:-1}),nodes=new Map();const visit=(node,ancestors=[])=>{const attrs=Object.fromEntries(Array.from({length:(node.attributes?.length??0)/2},(_,i)=>[node.attributes[2*i],node.attributes[2*i+1]]));const label=[node.nodeName,attrs.class,attrs.fill,attrs['data-fx-track']].filter(Boolean).join(' ');nodes.set(node.backendNodeId,[label,...ancestors].slice(0,4).join(' / '));for(const child of node.children??[])visit(child,[label,...ancestors]);};visit(root);const kinds={};for(const layer of event.layers){const key=nodes.get(layer.backendNodeId)??'internal';kinds[key]=(kinds[key]??0)+1;}latest={peak,kinds:Object.entries(kinds).sort((a,b)=>b[1]-a[1])};})().catch(e=>console.log('AUDIT_ERROR',e.message)).finally(()=>busy=false);
 });
 await page.goto('http://127.0.0.1:5187/bortom-k-bortu/?fxScene=armada&speed=normal');await page.waitForFunction(()=>document.body.dataset.fxDone==='1',null,{timeout:90000});await pending;writeFileSync('docs/screenshots/fx-canvas/layers-audit.json',JSON.stringify(latest,null,2));console.log('LAYERS_AUDIT',JSON.stringify(latest));
}finally{await browser.close();await new Promise(r=>server.httpServer.close(r))}
