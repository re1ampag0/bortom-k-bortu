// Idle weather benchmark. No CPU throttle, screenshots or DOM polling inside the 3 s interval.
import {build,preview} from 'vite';
import {chromium,expect} from '@playwright/test';
import {writeFileSync,mkdirSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {phaseCost} from '../fx-sprites/trace-costs.mjs';
const label=process.argv[2]??'before',keys=(process.argv[3]??'fog,storm,wave,calm,wind,maelstrom,clear,reefs,fleet,moon').split(','),outDir=process.argv.includes('--baseline')?'/tmp/fx-ambient-before-dist':'tmp/fx-ambient/dist';
mkdirSync('tmp/fx-ambient',{recursive:true});
if(!process.argv.includes('--reuse')&&!process.argv.includes('--baseline'))await build({mode:'e2e',build:{outDir,emptyOutDir:true}});
const server=await preview({build:{outDir},preview:{host:'127.0.0.1',port:5191,strictPort:true}}),browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
try{for(const key of keys){
 const context=await browser.newContext({viewport:{width:430,height:932},deviceScaleFactor:3,isMobile:true,hasTouch:true});
 await context.addInitScript(()=>{let s=19427;Math.random=()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296)});
 const page=await context.newPage(),cdp=await context.newCDPSession(page),errors=[],layers=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await cdp.send('LayerTree.enable');cdp.on('LayerTree.layerTreeDidChange',e=>layers.push({time:Date.now(),all:e.layers?.length??0,drawing:e.layers?.filter(l=>l.drawsContent).length??0,rows:e.layers}));
 await page.goto(`http://127.0.0.1:5191/bortom-k-bortu/?fxScene=sea-${key}&manual=1&speed=normal&rich=1&perf=0&particleProbe=0`);
 await page.bringToFront();await page.evaluate(()=>document.fonts.ready);await page.getByTestId('fx-start').click();
 await page.waitForFunction(()=>document.body.dataset.fxDone==='1',null,{timeout:60000,polling:100}).catch(async e=>{console.log('Error SCENE',key,await page.evaluate(()=>({hidden:document.hidden,hint:document.querySelector('[data-fx-instruction]')?.textContent,anims:document.querySelector('.fx-layer')?.getAnimations({subtree:true}).map(a=>({state:a.playState,target:a.effect.target.className})),trace:localStorage.getItem('bortom-fx-trace')})));throw e});expect(await page.evaluate(()=>document.hidden)).toBe(false);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1000);
 if(process.argv.includes('--promote'))await page.addStyleTag({content:".board[data-wx-move] .planks > .plank{will-change:transform,translate,rotate}"});
 if(process.argv.includes('--no-weather'))await page.addStyleTag({content:'.fx-weather{display:none!important}'});
 if(process.argv.includes('--no-pitch'))await page.addStyleTag({content:'.board .planks > .plank{animation:none!important}'});
 await page.evaluate(()=>{for(const a of document.getAnimations())if(a.effect?.getTiming().iterations===Infinity)a.currentTime=0});
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 await cdp.send('Tracing.start',{categories:'devtools.timeline,disabled-by-default-devtools.timeline,blink.user_timing,cc',transferMode:'ReturnAsStream'});
 const initial=layers.at(-1),wall=Date.now();await page.evaluate(()=>{window.ambientSamples=[...document.querySelector('.fx-weather').getAnimations({subtree:true})].map(a=>({name:a.animationName,time:Number(a.currentTime),state:a.playState}));performance.mark('ambient-start')});await page.waitForTimeout(3000);await page.evaluate(()=>performance.mark('ambient-end'));
 const ended=new Promise(r=>cdp.once('Tracing.tracingComplete',r));await cdp.send('Tracing.end');const{stream}=await ended;let raw='';for(;;){const c=await cdp.send('IO.read',{handle:stream});raw+=c.base64Encoded?Buffer.from(c.data,'base64').toString():c.data;if(c.eof)break}await cdp.send('IO.close',{handle:stream});
 const trace=JSON.parse(raw).traceEvents,cost=phaseCost(trace,trace.find(e=>e.name==='ambient-start').ts,trace.find(e=>e.name==='ambient-end').ts);delete cost.events;
 const rows=[initial,...layers.filter(l=>l.time>=wall)].filter(Boolean);const samples=await page.evaluate(()=>({before:window.ambientSamples,after:[...document.querySelector('.fx-weather').getAnimations({subtree:true})].map(a=>({name:a.animationName,time:Number(a.currentTime),state:a.playState}))}));expect(samples.before.length).toBeGreaterThan(0);expect(samples.after.some((a,i)=>a.time>samples.before[i]?.time+2500),'weather really advanced through the measurement').toBe(true);const result={samples,label,key,viewport:{width:430,height:932,dpr:3,cpu:1},...cost,layers:{min:Math.min(...rows.map(l=>l.all)),max:Math.max(...rows.map(l=>l.all)),drawing:Math.max(...rows.map(l=>l.drawing))},errors};
 expect(errors).toEqual([]);writeFileSync(`docs/screenshots/fx-ambient/${key}-${label}.json`,JSON.stringify(result,null,2)+'\n');writeFileSync(`tmp/fx-ambient/${key}-${label}-trace.json.gz`,gzipSync(raw));writeFileSync(`tmp/fx-ambient/${key}-${label}-layers.json`,JSON.stringify(layers.at(-1)?.rows));
 if(process.argv.includes('--inspect')){await cdp.send('DOM.enable');const doc=await cdp.send('DOM.getFlattenedDocument',{depth:-1,pierce:true});writeFileSync(`tmp/fx-ambient/${key}-${label}-dom.json`,JSON.stringify(doc.nodes));const reasons=[];for(const l of layers.at(-1)?.rows??[])if(l.drawsContent)reasons.push({...l,...await cdp.send('LayerTree.compositingReasons',{layerId:l.layerId})});writeFileSync(`tmp/fx-ambient/${key}-${label}-reasons.json`,JSON.stringify(reasons));}
 console.log('AMBIENT',JSON.stringify({key,label,paint:cost.paint.totalMs,raster:cost.raster.totalMs,layers:result.layers}));await context.close();
}}finally{await browser.close();await new Promise(r=>server.httpServer.close(r))}
