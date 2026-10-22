import {createServer} from 'vite';
import {chromium,expect} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
const phase=process.argv[2]??'after',results=[];
const server=await createServer({mode:'e2e',server:{host:'127.0.0.1',port:5188,strictPort:true}});await server.listen();
const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
try{for(const [width,height] of phase==='before'?[[430,740]]:[[430,740],[430,680],[390,844]]){
 const p=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});
 await p.goto('http://127.0.0.1:5188/bortom-k-bortu/?seed=1&speed=instant&hints=0&perf=1');
 for(const id of ['quick-duo','prep-start','placement-done','curtain-ready','placement-done','curtain-ready'])await p.getByTestId(id).click();
 await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
 await p.locator('.perf-panel').evaluate(e=>e.style.visibility='hidden');
 await p.evaluate(()=>{for(const a of document.getAnimations())if(a instanceof CSSAnimation){a.pause();a.currentTime=0}});
 await p.screenshot({path:`docs/screenshots/fx-sprites/light-${phase}-${width}x${height}.png`});
 if(phase==='after'){
  const r=await p.getByTestId('game').evaluate(e=>{const rect=q=>e.querySelector(q).getBoundingClientRect().toJSON(),s=getComputedStyle(e);return{x:parseFloat(s.getPropertyValue('--deck-warm-x')),y:parseFloat(s.getPropertyValue('--deck-warm-y')),top:parseFloat(s.getPropertyValue('--deck-warm-top')),regroup:rect('.board-bottom .regroup'),hold:rect('.board-bottom .hold-label'),hand:rect('.phone-hand-label'),sea:rect('.sea-table'),light:rect('.phone-deck-warm')}});
  expect(Math.abs(r.x-r.regroup.left)).toBeLessThanOrEqual(1);expect(r.y).toBeGreaterThanOrEqual(r.hold.bottom-1);expect(r.y).toBeLessThanOrEqual(r.hand.top+1);expect(r.top).toBeGreaterThanOrEqual(r.sea.bottom-1);expect(r.light.bottom).toBeLessThanOrEqual(r.hand.top+21);
  const light=p.getByTestId('lantern-light');expect(await light.evaluate(e=>getComputedStyle(e).pointerEvents)).toBe('none');
  await p.getByTestId('game').evaluate(e=>e.classList.add('fx-busy'));expect(await light.evaluate(e=>getComputedStyle(e).animationPlayState)).toBe('paused');
  await p.getByTestId('game').evaluate(e=>e.classList.remove('fx-busy'));
  await p.locator('.perf-panel').evaluate(e=>e.style.removeProperty('visibility'));await p.getByRole('button',{name:'Части',exact:true}).click();await p.getByTestId('perf-light').check();await expect(light).toBeHidden();
  results.push({width,height,...r});
 }
 await p.close();
}
if(phase==='after'){
 const p=await browser.newPage({viewport:{width:860,height:780}});await p.setContent('<style>body{margin:0;display:flex;background:#291d13;color:#f8e7c8;font:18px sans-serif}figure{margin:0}figcaption{height:40px;text-align:center}img{display:block;width:430px;height:740px}</style>'+['before','after'].map(k=>`<figure><figcaption>${k==='before'?'До':'После'}</figcaption><img src="data:image/png;base64,${readFileSync(`docs/screenshots/fx-sprites/light-${k}-430x740.png`).toString('base64')}"></figure>`).join(''));await p.screenshot({path:'docs/screenshots/fx-sprites/light-comparison.png'});writeFileSync('docs/screenshots/fx-sprites/light-check.json',JSON.stringify(results,null,2));}
console.log('LIGHT_OK',phase,results.length);
}finally{await browser.close();await server.close()}
