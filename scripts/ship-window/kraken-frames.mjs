// One clock and random seed for the main/ship-window comparison. Artwork changes, not the motion clocks.
import {chromium}from'@playwright/test';import{PNG}from'pngjs';import{mkdirSync,readFileSync,writeFileSync}from'node:fs';
const out='docs/screenshots/ship-window/stage4';mkdirSync(out,{recursive:true});const b=await chromium.launch({executablePath:'/usr/bin/chromium'});
for(const [width,height]of [[1366,660],[430,740]])for(const [tag,url]of [['before','http://127.0.0.1:5324'],['after','http://127.0.0.1:5322']]){
 const p=await b.newPage({viewport:{width,height},deviceScaleFactor:1}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.clock.install({time:new Date(0)});await p.clock.pauseAt(new Date(1));
 await p.addInitScript(()=>{let seed=19427;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);window.shipAnimations=[];const native=Element.prototype.animate;Element.prototype.animate=function(f,o){const a=native.call(this,f,o);a.pause();a.currentTime=0;window.shipAnimations.push({a,at:performance.now()});return a;};});
 await p.goto(url+'/bortom-k-bortu/?fxScene=kraken&speed=normal&perf=0');await p.evaluate(()=>document.fonts.ready);
 let at=0;for(const moment of [2000,9000,11000]){while(at<moment){await p.clock.runFor(20);at+=20;await p.evaluate(()=>{for(const {a,at}of window.shipAnimations){if(a.playState==='idle'||a.playState==='finished')continue;a.pause();const elapsed=performance.now()-at,end=a.effect?.getComputedTiming().endTime??0;if(elapsed>=end)a.finish();else a.currentTime=Math.max(0,elapsed);}for(const a of document.getAnimations())if(a instanceof CSSAnimation){a.pause();a.currentTime=0;}});}await p.screenshot({path:`${out}/kraken-${width}x${height}-${moment}-${tag}.png`});}
 if(errors.length)throw Error(errors.join('\n'));await p.close();
}
await b.close();
for(const [w,h]of [[1366,660],[430,740]])for(const t of [2000,9000,11000]){const a=PNG.sync.read(readFileSync(`${out}/kraken-${w}x${h}-${t}-before.png`)),b=PNG.sync.read(readFileSync(`${out}/kraken-${w}x${h}-${t}-after.png`)),c=new PNG({width:w*2+8,height:h});PNG.bitblt(a,c,0,0,w,h,0,0);PNG.bitblt(b,c,0,0,w,h,w+8,0);writeFileSync(`${out}/kraken-${w}x${h}-${t}-comparison.png`,PNG.sync.write(c));}console.log('Kraken frames: same seed/clock; 2 sizes × 3 phases × before/after');
