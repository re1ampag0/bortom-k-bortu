/** Native clocks only. Keep separate from visual capture: no page.clock / animation seeking. */
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync,existsSync,readFileSync} from 'node:fs';
import {mainCosts} from '../fx-smooth-a/trace-metrics.mjs';
const [label='native',...requested]=process.argv.slice(2),scenes=requested.length?requested:['sea-storm','sea-maelstrom','sea-fleet','armada','plain','aim','firewall','kraken','idle','ship-window','weather-window'];
const fixture=JSON.parse(readFileSync('scripts/table-polish-2/base-fixtures.json')).table.record;
const root='docs/measurements/fps-pass';mkdirSync(root,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--disable-gpu']});const rows=[];
try{for(const[width,height,dpr,cpu]of[[1366,660,1,1],[390,844,3,4]])for(const scene of scenes){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:dpr}),cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpu});
 await page.addInitScript(()=>{let seed=19427;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296)});
 const extra=['idle','target','ship-window','weather-window'].includes(scene);if(extra)await page.addInitScript(r=>localStorage.setItem('bortom-k-bortu.save',JSON.stringify(r)),fixture);
 await page.goto(`http://127.0.0.1:${process.env.PORT??5431}/bortom-k-bortu/?${extra||scene==='catalog'?'':'fxScene='+scene+'&manual=1&'}speed=normal&hints=0`);
 if(extra){await page.getByTestId('resume-go').click();await page.getByTestId('plank-Ж').waitFor();await page.locator('.game[data-fx-busy]').waitFor({state:'detached'});}else if(scene==='catalog'){await page.locator('.menu-start-links button').nth(1).click();await page.locator('.polish-catalog').waitFor();}else await page.getByTestId('fx-start').waitFor();await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))});await page.waitForTimeout(1000);
 await cdp.send('Tracing.start',{categories:'devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.frame,v8.execute',transferMode:'ReturnAsStream'});
 await page.evaluate(()=>{window.__nativeFrames=[];window.__nativeMeasuring=true;const frame=t=>{if(!window.__nativeMeasuring)return;window.__nativeFrames.push(t);requestAnimationFrame(frame)};requestAnimationFrame(frame)});
 if(scene==='target')await page.getByTestId('volley-Ж').evaluate(e=>e.click());else if(scene==='ship-window')await page.getByTestId('plank-М').locator('.plank-head').evaluate(e=>e.click());else if(scene==='weather-window')await page.locator('[data-fx-sea-chip]').evaluate(e=>e.click());else if(!['idle','catalog'].includes(scene))await page.getByTestId('fx-start').evaluate(e=>e.click());
 if(scene==='catalog'){for(let i=0;i<8;i++){await page.mouse.wheel(0,200);await page.waitForTimeout(500);}}else await page.waitForTimeout(4000);
 const values=await page.evaluate(()=>{window.__nativeMeasuring=false;return{frames:window.__nativeFrames,started:document.body.dataset.fxStart==='1',busy:document.querySelector('.game')?.hasAttribute('data-fx-busy')}});
 const done=new Promise(resolve=>cdp.once('Tracing.tracingComplete',resolve));await cdp.send('Tracing.end');const{stream}=await done;let trace='';while(true){const chunk=await cdp.send('IO.read',{handle:stream});trace+=chunk.data;if(chunk.eof)break;}await cdp.send('IO.close',{handle:stream});
 const events=JSON.parse(trace).traceEvents,x=events.filter(e=>e.ph==='X');const a=Math.min(...x.map(e=>e.ts)),b=Math.max(...x.map(e=>e.ts+(e.dur??0))),seconds=(b-a)/1e6,cost=mainCosts(events,a,b),delta=values.frames.slice(1).map((v,i)=>v-values.frames[i]);
 const row={scene,size:`${width}x${height}`,dpr,cpu,started:values.started,seconds,fps:delta.length*1000/(values.frames.at(-1)-values.frames[0]),worstMs:Math.max(0,...delta),over50:delta.filter(d=>d>50).length,msPerSecond:{script:cost.scriptingMs/seconds,style:cost.recalcStyleMs/seconds,layout:cost.layoutMs/seconds,paint:cost.paint.paint.totalMs/seconds,raster:cost.paint.raster.totalMs/seconds},rasterMsPerSecond:x.filter(e=>/Raster(Task|ize)/.test(e.name)).reduce((n,e)=>n+(e.dur??0)/1000,0)/seconds};
 rows.push(row);writeFileSync(`${root}/${label}-native.json`,JSON.stringify(rows,null,2));console.log(scene,row.size,row.fps.toFixed(1),row.worstMs.toFixed(1));await page.close();
}}finally{await browser.close()}
