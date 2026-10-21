// One Volley only. Real testid hit checks, DPR 3, CDP CPU ×4; same seed and interval as the valid baseline.
import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
async function click(page, id) {
  const el = page.locator(`[data-testid="${id}"]:visible`).first();
  await el.waitFor({ state: 'visible', timeout: 30000 });
  const hit = await el.evaluate((e) => {
    const r = e.getBoundingClientRect();
    for (const fy of [.5,.2,.8,.05,.95]) for (const fx of [.5,.2,.8]) {
      const x=r.left+r.width*fx,y=r.top+r.height*fy;
      if(e.contains(document.elementFromPoint(x,y))) return {x,y,id:e.dataset.testid};
    }
    throw new Error(`No real hit point for ${e.dataset.testid}`);
  });
  await page.evaluate(() => { window.__lastClick = null; document.addEventListener('click', e => { window.__lastClick=e.target.closest('[data-testid]')?.dataset.testid; }, {capture:true,once:true}); });
  await page.mouse.click(hit.x, hit.y);
  const received=await page.evaluate(()=>window.__lastClick);
  if(received!==id) throw new Error(`${id}: click received by ${received}`);
  console.error('CLICK',id); return { ...hit, received };
}

const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
try {
 const context=await browser.newContext({viewport:{width:430,height:932},deviceScaleFactor:3,isMobile:true,hasTouch:true});
 const page=await context.newPage(), clicks=[];
 await page.goto('http://127.0.0.1:4173/bortom-k-bortu/?seed=1&speed=normal');
 for(const id of ['quick-duo','prep-start','placement-done','curtain-ready','placement-done','curtain-ready']) clicks.push(await click(page,id));
 await page.waitForTimeout(500);
 clicks.push(await click(page,'volley-Ж'));clicks.push(await click(page,'plate-И'));
 const cdp=await context.newCDPSession(page);
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 const peak={total:0,draws:0};let layers=[];
 cdp.on('LayerTree.layerTreeDidChange',e=>{layers=e.layers??[];peak.total=Math.max(peak.total,layers.length);peak.draws=Math.max(peak.draws,layers.filter(l=>l.drawsContent).length)});
 await cdp.send('LayerTree.enable');
 await page.evaluate(()=>{window.__frames=[];window.__measure=true;let last=performance.now();const f=t=>{if(!window.__measure)return;window.__frames.push(t-last);last=t;requestAnimationFrame(f)};requestAnimationFrame(f)});
 const hullBefore=await page.locator('[data-fx-ship="И"] [data-fx-track="hull"] [data-fx-value]').textContent();
 clicks.push(await click(page,'fire'));clicks.push(await click(page,'curtain-ready'));clicks.push(await click(page,'skip-reaction'));
 await page.waitForTimeout(200);if(await page.getByTestId('curtain-ready').isVisible())clicks.push(await click(page,'curtain-ready'));
 await page.waitForTimeout(15000);
 const hullAfter=await page.locator('[data-fx-ship="И"] [data-fx-track="hull"] [data-fx-value]').textContent();
 if(parseInt(hullAfter)>=parseInt(hullBefore))throw new Error(`Volley did not hit: ${hullBefore} -> ${hullAfter}`);
 const frames=await page.evaluate(()=>{window.__measure=false;return window.__frames});
 const triggers=await page.evaluate(()=>[...document.querySelectorAll('*')].reduce((a,e)=>{const s=getComputedStyle(e);if(s.willChange!=='auto')a.willChange++;if(s.transform.startsWith('matrix3d'))a.transform3d++;if(s.filter!=='none')a.filter++;if(s.mixBlendMode!=='normal')a.blend++;return a},{willChange:0,transform3d:0,filter:0,blend:0}));
 const result={label:'after',scenario:'volley',valid:true,viewport:{width:430,height:932,dpr:3,cpu:4},hullBefore,hullAfter,frames:frames.length,worst:Math.max(...frames),over50:frames.filter(n=>n>50).length,over50ms:frames.filter(n=>n>50).reduce((a,b)=>a+b,0),peak,layersAtEnd:layers.length,triggers,clicks};
 await writeFile('docs/screenshots/phone-2/performance-after.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
} finally {await browser.close()}
