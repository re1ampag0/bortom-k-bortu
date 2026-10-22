// 430×740: the requested historical light reference, current before/after, and live diagnostic/pause checks.
import {createServer} from 'vite';
import {chromium,expect} from '@playwright/test';
import {writeFileSync,readFileSync} from 'node:fs';
const label=process.argv[2]??'after',reference=label==='reference';
const server=await createServer({root:reference?'/tmp/fx-phone-reference':process.cwd(),mode:'e2e',server:{host:'127.0.0.1',port:5188,strictPort:true}});
await server.listen();const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
try{
 const page=await browser.newPage({viewport:{width:430,height:740},isMobile:true,hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('bortom-k-bortu.settings',JSON.stringify({view:{hand:'deck'}})));
 await page.goto('http://127.0.0.1:5188/bortom-k-bortu/?seed=1&speed=instant&hints=0'+(label==='after'?'&perf=1':''));
 for(const id of ['quick-duo','prep-start','placement-done','curtain-ready','placement-done','curtain-ready'])await page.getByTestId(id).click();
 await expect(page.getByTestId('game')).not.toHaveClass(/fx-busy/);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(500);
 await page.evaluate(()=>{for(const a of document.getAnimations())if(a instanceof CSSAnimation){a.pause();a.currentTime=0;}});
 if(label==='after')await page.locator('.perf-panel').evaluate(e=>e.style.visibility='hidden');
 await page.screenshot({path:`docs/screenshots/fx-phone/4-${label}-430x740.png`});
 await page.screenshot({path:`docs/screenshots/fx-phone/4-${label}-deck.png`,clip:{x:180,y:440,width:250,height:300}});
 const lamp=await page.locator('[data-piece="lantern"]').boundingBox();
 const result={label,lamp,errors};
 if(label==='after'){
  const before=JSON.parse(readFileSync('docs/screenshots/fx-phone/4-before.json','utf8'));
  expect(lamp).toEqual(before.lamp);
  const light=page.getByTestId('lantern-light');await expect(light).toBeVisible();
  result.light=await light.evaluate(e=>{const s=getComputedStyle(e);return{pointer:s.pointerEvents,filter:s.filter,blend:s.mixBlendMode}});
  expect(result.light).toEqual({pointer:'none',filter:'none',blend:'normal'});
  await page.getByTestId('game').evaluate(e=>e.classList.add('fx-busy'));
  expect(await light.evaluate(e=>getComputedStyle(e).animationPlayState)).toBe('paused');
  expect(await page.getByTestId('game').evaluate(e=>getComputedStyle(e,'::after').animationPlayState)).toBe('paused');
  await page.getByTestId('game').evaluate(e=>e.classList.remove('fx-busy'));
  // Restore CSS playback after the still-frame capture; the clip class must pause it by itself.
  await light.evaluate(e=>{for(const a of e.getAnimations())a.play()});
  await page.locator('.perf-panel').evaluate(e=>e.style.removeProperty('visibility'));
  await page.getByRole('button',{name:'Части',exact:true}).click();await page.getByTestId('perf-light').check();
  await expect(light).toBeHidden();expect(await page.getByTestId('game').evaluate(e=>getComputedStyle(e,'::after').display)).toBe('none');await page.getByTestId('perf-light').uncheck();await expect(light).toBeVisible();
  result.pauseAndPerf=true;
 }
 if(label==='after'){
  await page.setViewportSize({width:1290,height:782});
  await page.setContent('<style>body{margin:0;background:#251b11;color:#f6e7c7;font:18px sans-serif;display:flex}figure{margin:0;width:430px}figcaption{height:42px;display:grid;place-items:center}img{display:block;width:430px;height:740px}</style>'+[['reference','Эталон света · 6c9e159'],['before','До пункта 4'],['after','После пункта 4']].map(([key,title])=>`<figure><figcaption>${title}</figcaption><img src="data:image/png;base64,${readFileSync(`docs/screenshots/fx-phone/4-${key}-430x740.png`).toString('base64')}"></figure>`).join(''));
  await page.screenshot({path:'docs/screenshots/fx-phone/4-comparison.png'});
 }
 expect(errors).toEqual([]);writeFileSync(`docs/screenshots/fx-phone/4-${label}.json`,JSON.stringify(result,null,2)+'\n');console.log('LIGHT_RESULT',JSON.stringify(result));
}finally{await browser.close();await server.close()}
