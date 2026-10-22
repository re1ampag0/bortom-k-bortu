// Isolated optimized e2e build with measurement-only counters. Ordinary builds contain none of these hooks.
import {build,preview} from 'vite';
import {chromium,expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const label=process.argv[2]??'stage2-before',scene=process.argv[3]??'volley',outDir='tmp/fx-canvas/cpu-dist';
if(scene!=='volley')throw new Error('Armada Game scenario is not implemented yet; never label a Volley as Armada');
const mark = field => `if(window.fxCpu?.active)window.fxCpu.${field}++;`;
await build({mode:'e2e',build:{outDir,emptyOutDir:true},plugins:[{name:'fx-phone-counters',enforce:'pre',transform(code,id){
 if(id.endsWith('/src/ui/game/Game.tsx'))return code.replace('  const version = useSyncExternalStore(',mark('renders')+'\n  const version = useSyncExternalStore(');
 if(id.endsWith('/src/ui/game/TableThings.tsx'))return code.replace('    const measure = () => {','    const measureRaw = () => {').replace('    // at most once a frame',`    const measure = () => { const m=window.fxCpu; if(!m?.active)return measureRaw(); m.backdrop++;m.backdropCalls.push({at:performance.now()-m.start,busy:game.classList.contains('fx-busy')});const t=performance.now();try{return measureRaw()}finally{m.backdropMs+=performance.now()-t} };\n    // at most once a frame`);
 if(id.endsWith('/src/ui/game/Table.tsx'))return code.replace('  const d = shipData(data, ship.code);',mark('planks')+'\n  const d = shipData(data, ship.code);');
 if(id.endsWith('/src/ui/game/Hand.tsx'))return code.replace('  const holder = s.ships[seat];',mark('hands')+'\n  const holder = s.ships[seat];');
 if(id.endsWith('/src/ui/game/fx/armadaSprites.ts'))return code.replace(' const N=28,pts=',mark('shots')+'\n const N=28,pts=');
 if(id.endsWith('/src/ui/game/fx/primitives.ts'))return code.replace('export function bx(ctx: FxCtx, el: Element): Box {','export function bx(ctx: FxCtx, el: Element): Box {\n'+mark('bx')).replace(/(export function (?:ballFly|projectile)\([^\n]*\{\n)/g,'$1'+mark('shots')+'\n');
}}]});
const server=await preview({build:{outDir},preview:{host:'127.0.0.1',port:5187,strictPort:true}});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
try{
 const context=await browser.newContext({viewport:{width:430,height:932},deviceScaleFactor:3,isMobile:true,hasTouch:true});
 await context.addInitScript(()=>{
  let seed=19427;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  window.fxCpu={active:false,harness:false,start:0,end:0,rect:0,rectMs:0,animations:0,animationsMs:0,renders:0,planks:0,hands:0,bx:0,backdrop:0,backdropMs:0,backdropCalls:[],shots:0,tasks:[]};
  for(const [name,field]of[['getBoundingClientRect','rect'],['getAnimations','animations']]){
   const native=Element.prototype[name];Element.prototype[name]=function(...args){const m=window.fxCpu;if(!m.active||m.harness)return native.apply(this,args);m[field]++;const t=performance.now();try{return native.apply(this,args)}finally{m[field+"Ms"]+=performance.now()-t}};
  }
  new PerformanceObserver(list=>{const m=window.fxCpu;for(const e of list.getEntries())if(m.start&&e.startTime>=m.start&&(!m.end||e.startTime<m.end)&&e.duration>50)m.tasks.push({start:e.startTime-m.start,duration:e.duration});}).observe({type:'longtask',buffered:false});
 });
 const page=await context.newPage(),cdp=await context.newCDPSession(page),clicks=[],errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 const tap=async id=>{
  const el=page.getByTestId(id).filter({visible:true}).first();await expect(el).toBeVisible();
  const position=await el.evaluate(e=>{window.fxCpu.harness=true;try{const r=e.getBoundingClientRect();for(const fy of [.5,.25,.75])for(const fx of [.5,.25,.75]){const x=r.x+r.width*fx,y=r.y+r.height*fy,t=document.elementFromPoint(x,y);if(e.contains(t)&&t.closest('[data-testid]')?.getAttribute('data-testid')===e.getAttribute('data-testid'))return{x:r.width*fx,y:r.height*fy}}throw new Error('No real hit '+e.dataset.testid);}finally{window.fxCpu.harness=false}});
  await page.evaluate(()=>{window.fxCpuClick=null;document.addEventListener('click',e=>window.fxCpuClick=e.target.closest('[data-testid]')?.getAttribute('data-testid'),{capture:true,once:true})});
  await el.click({position});expect(await page.evaluate(()=>window.fxCpuClick)).toBe(id);clicks.push(id);
 };
 await page.goto('http://127.0.0.1:5187/bortom-k-bortu/?seed=1&speed=normal&hints=0&perf=0');
 for(const id of ['quick-duo','prep-start','placement-done','curtain-ready','placement-done','curtain-ready'])await tap(id);
 await expect(page.getByTestId('game')).not.toHaveClass(/fx-busy/,{timeout:60000});await page.waitForTimeout(1000);
 await tap('volley-Ж');await tap('plate-И');
 const hull=()=>page.locator('[data-fx-ship="И"] [data-fx-track="hull"] [data-fx-value]').textContent();
 const before=parseInt(await hull());await page.evaluate(()=>{window.fxCpu.start=performance.now();window.fxCpu.active=true});
 await tap('fire');let finished=false;const limit=Date.now()+60000;
 while(Date.now()<limit){
  const state=await page.evaluate(()=>({curtain:!!document.querySelector('[data-testid="curtain-ready"]'),skip:!!document.querySelector('[data-testid="skip-reaction"]'),busy:document.querySelector('.game')?.classList.contains('fx-busy')}));
  if(state.curtain)await tap('curtain-ready');else if(state.skip)await tap('skip-reaction');else if(!state.busy&&parseInt(await hull())<before){finished=true;break;}
  await page.waitForTimeout(100);
 }
 await page.evaluate(()=>{window.fxCpu.end=performance.now();window.fxCpu.active=false});await page.waitForTimeout(200);
 const m=await page.evaluate(()=>window.fxCpu),after=parseInt(await hull());
 const result={label,scene,viewport:{width:430,height:932,dpr:3,cpu:4},valid:finished&&m.shots>0&&after<before&&errors.length===0,elapsed:m.end-m.start,longTasks:m.tasks.length,longest:Math.max(0,...m.tasks.map(t=>t.duration)),...m,hullBefore:before,hullAfter:after,clicks,errors};
 writeFileSync(`docs/screenshots/fx-canvas/${scene}-${label}-cpu.json`,JSON.stringify(result,null,2)+'\n');
 expect(m.backdropCalls.every(c=>!c.busy),'decoration reads are deferred while a clip is busy').toBe(true);
 expect(result.valid,JSON.stringify({finished,shots:m.shots,before,after,errors})).toBe(true);
 console.log('CPU_RESULT',JSON.stringify({label,scene,bx:m.bx,planks:m.planks,hands:m.hands,longTasks:result.longTasks,longest:result.longest,rect:m.rect,animations:m.animations,renders:m.renders,backdrop:m.backdrop,backdropMs:m.backdropMs,rectMs:m.rectMs,animationsMs:m.animationsMs,shots:m.shots,hull:[before,after]}));
}finally{await browser.close();await new Promise(r=>server.httpServer.close(r))}
