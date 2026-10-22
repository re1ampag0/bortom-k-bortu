// Deterministic art comparison, independent of the performance run. Native keyframes, controlled clip clock.
import {createServer} from 'vite';import{chromium,expect}from'@playwright/test';import{readFileSync,writeFileSync}from'node:fs';
const label=process.argv[2]??'after';
const server=await createServer({mode:'e2e',server:{host:'127.0.0.1',port:5188,strictPort:true}});await server.listen();const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
try{
 const p=await browser.newPage({viewport:{width:430,height:932}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.clock.install({time:new Date(0)});await p.clock.pauseAt(new Date(1));
 await p.addInitScript(()=>{
  let seed=19427;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);window.spriteAnimations=[];
  const native=Element.prototype.animate;Element.prototype.animate=function(frames,options){const animation=native.call(this,frames,options);animation.pause();animation.currentTime=0;window.spriteAnimations.push({animation,at:performance.now()});return animation};
 });
 await p.goto('http://127.0.0.1:5188/bortom-k-bortu/?fxScene=armada&manual=1&speed=normal&perf=0');await p.evaluate(()=>document.fonts.ready);await p.getByTestId('fx-start').click();
 let first=null,captured=false;
 for(let t=20;t<=25000;t+=20){
  await p.clock.runFor(20);await p.evaluate(()=>{
   const now=performance.now();for(const row of window.spriteAnimations){const a=row.animation;if(a.playState==='idle'||a.playState==='finished')continue;const dt=now-row.at,end=a.effect.getComputedTiming().endTime;if(dt>=end)a.finish();else a.currentTime=Math.max(0,dt)}
   for(const a of document.getAnimations())if(a instanceof CSSAnimation){a.pause();a.currentTime=0}
  });
  if(first===null&&await p.locator('.gun-fire').count())first=t;
  if(first!==null&&t>=first+100){
   await p.screenshot({path:`docs/screenshots/fx-sprites/armada-${label}.png`});
   const meta=await p.evaluate(()=>({ships:document.querySelectorAll('.lg-pitch').length,shots:document.querySelectorAll('.gun-fire').length,sprites:document.querySelectorAll('.fx-sprite').length}));
   writeFileSync(`docs/screenshots/fx-sprites/armada-${label}-frame.json`,JSON.stringify({first,t,...meta,errors},null,2));expect(meta.ships).toBe(4);if(label==='after')expect(meta.sprites).toBeGreaterThan(4);captured=true;break;
  }
 }
 expect(captured).toBe(true);expect(errors).toEqual([]);
 if(label==='after'){
  await p.setViewportSize({width:860,height:972});await p.setContent('<style>body{margin:0;display:flex;background:#291d13;color:#f8e7c8;font:18px sans-serif}figure{margin:0}figcaption{height:40px;text-align:center}img{display:block;width:430px;height:932px}</style>'+['before','after'].map(k=>`<figure><figcaption>${k==='before'?'До':'После'}</figcaption><img src="data:image/png;base64,${readFileSync(`docs/screenshots/fx-sprites/armada-${k}.png`).toString('base64')}"></figure>`).join(''));await p.screenshot({path:'docs/screenshots/fx-sprites/armada-comparison.png'});
 }
 console.log('CAPTURE_OK',label);
}finally{await browser.close();await server.close()}
