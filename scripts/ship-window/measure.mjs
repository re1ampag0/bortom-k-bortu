import {visibleLayers} from './layer-geometry.mjs';
// Short CDP trace, not a test. The diagnostics overlay is hidden while measuring its own game.
import {chromium} from '@playwright/test';import{mkdirSync,writeFileSync}from'node:fs';
const out='docs/screenshots/ship-window/checks';mkdirSync(out,{recursive:true});
const url=process.argv[2]??'http://127.0.0.1:5322/bortom-k-bortu/',tag=process.argv[3]??'after',baseline=tag==='before';
const b=await chromium.launch({executablePath:'/usr/bin/chromium'}),p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true}),rows=[];
const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.route(/\/src\/ui\/game\/Game\.tsx(?:\?.*)?$/,async route=>{const r=await route.fetch();let s=await r.text();if(!s.includes('clipRender(performance.now() - perfT0)'))throw Error('Game render hook missing');s=s.replace('clipRender(performance.now() - perfT0)','(window.shipGameRenders=(window.shipGameRenders||0)+1,clipRender(performance.now() - perfT0))');await route.fulfill({response:r,body:s});});
const c=await p.context().newCDPSession(p);await c.send('Emulation.setCPUThrottlingRate',{rate:4});await c.send('LayerTree.enable');let tree=[],layers=[],peakLarge=0,peakLayers=0;
c.on('LayerTree.layerTreeDidChange',r=>{tree=r.layers??[];layers=tree.filter(l=>l.drawsContent);peakLayers=Math.max(peakLayers,layers.length);peakLarge=Math.max(peakLarge,layers.filter(l=>l.width*l.height>=390*844*.5).length);});
await p.goto(url+'?seed=1&speed=instant&perf=1');for(const id of ['quick-duo','prep-start','placement-done','curtain-ready','placement-done','curtain-ready'])await p.getByTestId(id).click();await p.addStyleTag({content:'.perf-panel{display:none!important}'});await p.evaluate(()=>document.fonts.ready);const initialRenders=await p.evaluate(()=>window.shipGameRenders??-1);if(initialRenders<1)throw Error('Game render instrumentation did not see the initial render');
async function trace(name,ms,action){
 peakLarge=0;peakLayers=0;const chunks=[];c.on('Tracing.dataCollected',save);function save(r){chunks.push(...r.value)}
 await c.send('Tracing.start',{categories:'devtools.timeline',transferMode:'ReportEvents'});
 await p.evaluate(()=>{window.shipGameRenders=0;window.shipFrames=[];window.shipLast=performance.now();window.shipRAF=requestAnimationFrame(function tick(t){window.shipFrames.push(t-window.shipLast);window.shipLast=t;window.shipRAF=requestAnimationFrame(tick)});});
 const start=Date.now();if(action)await action();await p.waitForTimeout(ms);
 const native=await p.evaluate(()=>{cancelAnimationFrame(window.shipRAF);return{frames:window.shipFrames,renders:window.shipGameRenders,svgAnimations:document.getAnimations().filter(a=>a.effect?.target?.closest('svg')&&a.effect.target.closest('svg').getBoundingClientRect().width>150&&a.effect.target.closest('.board')).length,windowAnimations:document.querySelector('.ship-window')?.getAnimations({subtree:true}).length??0}});
 const end=new Promise(resolve=>c.once('Tracing.tracingComplete',resolve));await c.send('Tracing.end');await end;c.off('Tracing.dataCollected',save);
 const sum=n=>chunks.filter(e=>e.name===n&&e.ph==='X').reduce((a,e)=>a+(e.dur??0)/1000,0);
 const press=undefined;
 const row={press,name,duration:Date.now()-start,Layout:+sum('Layout').toFixed(3),Paint:+sum('Paint').toFixed(3),Style:+sum('UpdateLayoutTree').toFixed(3),worstFrame:+Math.max(0,...native.frames).toFixed(1),over50:native.frames.filter(x=>x>50).length,GameRenders:native.renders,unclippedLargeLayers:peakLarge,layersPeak:peakLayers,svgAnimations:native.svgAnimations,windowAnimations:native.windowAnimations};
 const geometry=await visibleLayers(p,c,tree);
 row.largeVisibleLayers=geometry.filter(g=>(g.owner?.visibleArea??0)>=390*844*.5).length;row.layerGeometry=geometry;
 writeFileSync(`${out}/${tag}-${name}-trace.json`,JSON.stringify({traceEvents:chunks.filter(e=>['Layout','Paint','UpdateLayoutTree','Animation','CompositeLayers'].includes(e.name))}));rows.push(row);writeFileSync(`${out}/${tag}-measure.json`,JSON.stringify({viewport:[390,844,3],cpu:4,initialRenders,overlay:'perf panel hidden; all 11 parts enabled',rows,errors},null,2));console.log(JSON.stringify({...row,layerGeometry:undefined}));return row;
}
for(const code of baseline?['Ж']:['Ж','М','И','Г']){
 await trace('open-'+code,1600,()=>p.getByTestId('plank-'+code).locator('.plank-head').click({position:{x:8,y:8}}));
 if(!baseline)await p.waitForSelector('.sw-native-scene[data-ready]');await p.waitForTimeout(500);
 await trace('visible-'+code,10000);
 await p.getByTestId('ship-sheet').getByRole('button',{name:'Закрыть',exact:true}).click();await p.waitForTimeout(1500);
 await trace('closed-'+code,10000);
}
await b.close();if(errors.length)throw Error(errors.join('\n'));
