// Production-optimized scene build; no screenshot/DOM polling work in the measured animation frames.
import {build,preview} from 'vite';
import {chromium,expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {phaseCost} from '../fx-sprites/trace-costs.mjs';
const scene=process.argv[3]??'armada';
const label=process.argv[2]??'current',idleOnly=process.argv.includes('--idle'),outDir='tmp/fx-smooth-b/measure-dist';
await build({mode:'e2e',build:{outDir,emptyOutDir:true}});
const server=await preview({build:{outDir},preview:{host:'127.0.0.1',port:5287,strictPort:true}});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
try{
 const context=await browser.newContext({viewport:{width:430,height:932},deviceScaleFactor:3,isMobile:true,hasTouch:true});
 await context.addInitScript(()=>{let s=19427;Math.random=()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);window.spriteFrames=[];window.spriteSampling=false;const tick=t=>{if(window.spriteSampling)window.spriteFrames.push(t);requestAnimationFrame(tick)};requestAnimationFrame(tick)});
 const page=await context.newPage(),cdp=await context.newCDPSession(page),errors=[],layers=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('LayerTree.enable');
 cdp.on('LayerTree.layerTreeDidChange',e=>layers.push({time:Date.now(),all:e.layers?.length??0,drawing:e.layers?.filter(l=>l.drawsContent).length??0}));
 await page.goto(`http://127.0.0.1:5287/bortom-k-bortu/?fxScene=${scene}&manual=1&speed=normal&perf=0&particleProbe=0`);
 await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(2000);
 await cdp.send('Tracing.start',{categories:'devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.frame,blink.user_timing,cc',transferMode:'ReturnAsStream'});
 await page.evaluate(()=>performance.mark('sprite-idle-start'));const idleWall=Date.now(),idleLayers=layers.at(-1);await page.waitForTimeout(2000);await page.evaluate(()=>performance.mark('sprite-idle-end'));
 let clipWall=0;
 if(!idleOnly){
  await page.evaluate(()=>{window.spriteFrames=[];window.spriteSampling=true;performance.mark('sprite-clip-start')});clipWall=Date.now();
  const start=page.getByTestId('fx-start');expect(await start.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))})).toBe(true);await start.click();
  await page.waitForFunction(()=>document.body.dataset.fxDone==='1',null,{timeout:90000,polling:100});
  await page.evaluate(()=>{window.spriteSampling=false;performance.mark('sprite-clip-end')});
 }
 const ended=new Promise(resolve=>cdp.once('Tracing.tracingComplete',resolve));await cdp.send('Tracing.end');const {stream}=await ended;
 let raw='';for(;;){const chunk=await cdp.send('IO.read',{handle:stream});raw+=chunk.base64Encoded?Buffer.from(chunk.data,'base64').toString():chunk.data;if(chunk.eof)break;}await cdp.send('IO.close',{handle:stream});
 const trace=JSON.parse(raw).traceEvents,marker=name=>trace.find(e=>e.name===name)?.ts;
 const idle=[marker('sprite-idle-start'),marker('sprite-idle-end')],clip=[marker('sprite-clip-start'),marker('sprite-clip-end')];
 expect(idle.every(Number.isFinite)).toBe(true);if(!idleOnly)expect(clip.every(Number.isFinite)).toBe(true);
 const frames=await page.evaluate(()=>window.spriteFrames),gaps=frames.slice(1).map((t,i)=>t-frames[i]);
 const peak=rows=>({all:Math.max(0,...rows.map(r=>r.all)),drawing:Math.max(0,...rows.map(r=>r.drawing))});
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('bortom-fx-trace')??'[]').filter(line=>line.includes('✗')))).toEqual([]);
 const renderer=await page.locator('.fx-layer').getAttribute('data-armada-renderer');
 if(scene==='armada'&&!idleOnly)expect(renderer).toBe('stickers');
 const volleyRenderer=await page.locator('.fx-layer').getAttribute('data-volley-renderer');
 if(label==='after'){expect(volleyRenderer).toBe('stickers');expect(await page.locator('.fx-layer').getAttribute('data-volley-fallback')).toBeNull();}
 const result={label,scene,renderer,volleyRenderer,viewport:{width:430,height:932,dpr:3,cpu:4},idle:{...phaseCost(trace,...idle),layers:peak([idleLayers,...layers.filter(l=>l.time>=idleWall&&(!clipWall||l.time<clipWall))].filter(Boolean))},clip:idleOnly?null:{...phaseCost(trace,...clip),frames:frames.length,worstMs:Math.max(0,...gaps),over50:gaps.filter(n=>n>50).length,layers:peak(layers.filter(l=>l.time>=clipWall))},errors};
 expect(errors).toEqual([]);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('bortom-fx-trace')??'[]').filter(line=>line.includes('✗')))).toEqual([]);if(!idleOnly)expect(await page.locator('.lg-pitch').count()).toBe(0);
 writeFileSync(`docs/screenshots/fx-smooth-b/${scene}-${label}-metrics.json`,JSON.stringify(result,null,2));writeFileSync(`tmp/fx-smooth-b/${scene}-${label}-trace.json.gz`,gzipSync(raw));
 console.log('MEASURE_RESULT',JSON.stringify({...result,idle:{...result.idle,events:undefined},clip:result.clip?{...result.clip,events:undefined}:null}));
}finally{await browser.close();await new Promise(r=>server.httpServer.close(r))}
