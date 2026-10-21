// Real UI actions, never fxScene. One reproducible run per scenario/label, on Chromium DPR3 CPU x4.
import {chromium,expect} from '@playwright/test';
import {writeFileSync,readFileSync,existsSync} from 'node:fs';
const label=process.argv[2]??'G-before',only=process.argv[3];
const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
const output=`docs/screenshots/ui-4/${label}-performance.json`;
const results=only&&existsSync(output)?JSON.parse(readFileSync(output,'utf8')):{label,viewport:{width:430,height:932,dpr:3,cpu:4},scenarios:{}};
async function tap(page,id,clicks,locator){
 const el=locator??page.getByTestId(id).filter({visible:true}).first();await expect(el).toBeVisible({timeout:30000});
 const hit=await el.evaluate(e=>{const r=e.getBoundingClientRect();for(const fy of [.5,.25,.75])for(const fx of [.5,.25,.75]){
  const x=r.x+r.width*fx,y=r.y+r.height*fy,t=document.elementFromPoint(x,y);
  if(e.contains(t)&&t.closest('[data-testid]')?.getAttribute('data-testid')===e.getAttribute('data-testid'))return{x,y,localX:x-r.x,localY:y-r.y};
 }throw new Error(`No verified hit: ${e.getAttribute('data-testid')}`)});
 await page.evaluate(()=>{window.ui4Click=null;document.addEventListener('click',e=>window.ui4Click=e.target.closest('[data-testid]')?.getAttribute('data-testid'),{capture:true,once:true})});
 await el.click({position:{x:hit.localX,y:hit.localY}});const received=await page.evaluate(()=>window.ui4Click);
 expect(received,`actual click ${id}`).toBe(id);clicks.push({id,...hit,received});
}
async function inspectLayers(cdp,layers){
 return Promise.all(layers.filter(l=>l.drawsContent).map(async l=>{
  let node,why;try{why=(await cdp.send('LayerTree.compositingReasons',{layerId:l.layerId})).compositingReasons}catch{}
  if(l.backendNodeId)try{const n=(await cdp.send('DOM.describeNode',{backendNodeId:l.backendNodeId})).node;node={tag:n.nodeName,attributes:n.attributes}}catch{}
  return{width:l.width,height:l.height,node,reasons:why};
 }));
}
try{for(const scenario of ['volley','bot'].filter(s=>!only||s===only)){
 const context=await browser.newContext({viewport:{width:430,height:932},deviceScaleFactor:3,isMobile:true,hasTouch:true});
 // FX use Math.random only for painting; game rules have their own seeded RNG.
 await context.addInitScript(()=>{let seed=19427;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296)});
 const page=await context.newPage(),cdp=await context.newCDPSession(page),clicks=[],errors=[];
 page.on('pageerror',e=>errors.push(e.message));await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 let layers=[],peak=0,peakDraws=0,measuring=false;
 cdp.on('LayerTree.layerTreeDidChange',e=>{layers=e.layers??[];if(measuring){peak=Math.max(peak,layers.length);peakDraws=Math.max(peakDraws,layers.filter(l=>l.drawsContent).length)}});
 await cdp.send('LayerTree.enable');
 await page.goto('http://127.0.0.1:4173/bortom-k-bortu/?seed=1&speed=normal&hints=0');
 const setup=scenario==='volley'?['quick-duo','prep-start','placement-done','curtain-ready','placement-done','curtain-ready']:['quick-bots','pick-pirates','prep-start','placement-done'];
 for(const id of setup)await tap(page,id,clicks);
 await expect(page.getByTestId('game')).not.toHaveClass(/fx-busy/,{timeout:60000});
 await page.waitForTimeout(1500);
 const idleBefore=layers.length;
 if(scenario==='volley'){await tap(page,'volley-Ж',clicks);await tap(page,'plate-И',clicks);}
 const hull=()=>page.locator('[data-fx-ship="И"] [data-fx-track="hull"] [data-fx-value]').textContent();
 const hullBefore=scenario==='volley'?parseInt(await hull()):null;
 await page.evaluate(()=>{
  window.ui4Frames=[];window.ui4Measure=true;window.ui4Balls=0;let last=performance.now();
  const sample=t=>{if(!window.ui4Measure)return;window.ui4Frames.push(t-last);last=t;requestAnimationFrame(sample)};requestAnimationFrame(sample);
  window.ui4Observer=new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1&&(n.matches('.ball,.chainshot,.grape')||n.querySelector('.ball,.chainshot,.grape')))window.ui4Balls++});
  window.ui4Observer.observe(document.body,{childList:true,subtree:true});
 });
 peak=layers.length;peakDraws=layers.filter(l=>l.drawsContent).length;measuring=true;
 const started=Date.now();await tap(page,scenario==='volley'?'fire':'end-turn',clicks);
 let seenCompany=false,finished=false,lastState;
 while(Date.now()-started<180000){
  const state=await page.evaluate(()=>{
   const visible=id=>{const e=document.querySelector(`[data-testid="${id}"]`);return !!e&&e.getBoundingClientRect().width>0};
   return{curtain:visible('curtain-ready'),skip:visible('skip-reaction'),plans:visible('no-plans'),confirm:visible('confirm-yes'),
    tortuga:visible('tortuga-panel'),choice:visible('choice-panel'),jack:visible('jack-panel'),busy:document.querySelector('.game')?.classList.contains('fx-busy'),turn:document.querySelector('.status-turn')?.textContent??'',
    instruction:document.querySelector('[data-testid="instruction"]')?.textContent??'',balls:window.ui4Balls};
  });
  lastState=state;
  if(/Компания/i.test(state.turn))seenCompany=true;
  if(state.curtain)await tap(page,'curtain-ready',clicks);
  else if(state.skip)await tap(page,'skip-reaction',clicks);
  else if(state.plans)await tap(page,'no-plans',clicks);
  else if(state.tortuga){
   const no=page.getByTestId('tortuga-panel').getByRole('button',{name:'Не брать',exact:true});
   await no.evaluate(e=>e.setAttribute('data-testid','measure-tortuga-no'));await tap(page,'measure-tortuga-no',clicks);
  }
  else if(state.choice){
   const panel=page.getByTestId('choice-panel'),done=panel.locator('.oak-btn');
   if(await done.getAttribute('aria-disabled')==='true')await tap(page,'hand-card',clicks,panel.locator('.choice-cards > .hcard:not(.chosen)').first());
   else{
    // Existing primary has no testid: instrument just its identifier, never its handler/state/geometry.
    await done.evaluate(e=>e.setAttribute('data-testid','measure-choice-done'));
    await tap(page,'measure-choice-done',clicks);
   }
  }
  else if(state.jack){
   const no=page.getByTestId('jack-panel').getByRole('button',{name:'Нет — утонуть'});
   await no.evaluate(e=>e.setAttribute('data-testid','measure-jack-no'));await tap(page,'measure-jack-no',clicks);
  }
  else if(state.confirm)throw new Error('Unexpected confirmation in hints=0 measurement');
  else if(!state.busy){
   if(scenario==='volley'&&state.balls>0&&parseInt(await hull())<hullBefore){finished=true;break;}
   if(scenario==='bot'&&seenCompany&&/Пираты/i.test(state.turn)&&/выберите карту или действие/i.test(state.instruction)){finished=true;break;}
  }
  await page.waitForTimeout(150);
 }
 const elapsed=Date.now()-started;measuring=false;
 const measured=await page.evaluate(()=>{window.ui4Measure=false;window.ui4Observer.disconnect();return{frames:window.ui4Frames,balls:window.ui4Balls}});
 if(!finished){console.error('STOP',JSON.stringify({scenario,lastState,hullBefore,hullAfter:scenario==='volley'?await hull():null,balls:measured.balls,animations:await page.evaluate(()=>document.querySelector('.board').getAnimations({subtree:true}).filter(a=>!(a instanceof CSSAnimation)).map(a=>({state:a.playState,time:a.currentTime,duration:a.effect?.getTiming().duration,target:a.effect?.target?.getAttribute('class')})))}));await page.screenshot({path:`tmp/ui-4/failed-${scenario}.png`});}
 expect(finished,scenario+' finished a real action/turn').toBe(true);expect(errors).toEqual([]);
 const hullAfter=scenario==='volley'?parseInt(await hull()):null;
 if(scenario==='volley'){expect(measured.balls).toBeGreaterThan(0);expect(hullAfter).toBeLessThan(hullBefore);}
 if(scenario==='bot')expect(seenCompany).toBe(true);
 await page.waitForTimeout(1500);const idleAfter=layers.length;
 const layerDetails=await inspectLayers(cdp,layers);
 const triggers=await page.evaluate(()=>{
  const out=[];for(const e of document.querySelectorAll('.game *')){const s=getComputedStyle(e);if(s.willChange!=='auto'||s.transform.startsWith('matrix3d'))out.push({tag:e.tagName,cls:e.getAttribute('class'),willChange:s.willChange,transform:s.transform})}return out;
 });
 const result={valid:true,elapsed,hullBefore,hullAfter,balls:measured.balls,seenCompany,frames:measured.frames.length,worst:Math.max(...measured.frames),over50:measured.frames.filter(n=>n>50).length,peak,peakDraws,idleBefore,idleAfter,triggers,layerDetails,clicks,errors,frameTimes:measured.frames};
 results.scenarios[scenario]=result;
 writeFileSync(`docs/screenshots/ui-4/${label}-performance.json`,JSON.stringify(results,null,2)+'\n');
 console.log(JSON.stringify({label,scenario,valid:true,elapsed,worst:result.worst,over50:result.over50,peak,idleBefore,idleAfter,balls:result.balls,hullBefore,hullAfter}));
 await context.close();
}}finally{await browser.close()}
