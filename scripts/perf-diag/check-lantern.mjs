// One script, six phone cases, real Game/Reaction flow; no Playwright test suite.
import {chromium,expect} from '@playwright/test';
import {createServer} from 'vite';
import {readFileSync,writeFileSync} from 'node:fs';
const scenario=JSON.parse(readFileSync('docs/screenshots/ui-4/reaction-scenario.json','utf8'));
const server=await createServer({mode:'e2e',server:{host:'127.0.0.1',port:5176,strictPort:true}});
await server.listen();const browser=await chromium.launch({executablePath:'/usr/bin/chromium'}),results=[];
try {
 for(const viewport of [{width:430,height:740},{width:430,height:680},{width:390,height:844}]){
  const page=await browser.newPage({viewport,isMobile:true,hasTouch:true}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:5176/bortom-k-bortu/?seed=${scenario.seed}&speed=instant&hand=${scenario.hand}&hints=0&perf=0`);
  const tap=id=>page.getByTestId(id).filter({visible:true}).first().click();
  for(const id of ['quick-duo','prep-start','placement-done','curtain-ready','placement-done','curtain-ready'])await tap(id);
  await page.evaluate(()=>document.fonts.ready);
  const capture=async mode=>{
   await expect(page.locator('.deck-piece[data-piece="lantern"]')).toBeVisible();await page.waitForTimeout(300);
   const geometry=await page.evaluate(()=>{
    const box=e=>e.getBoundingClientRect().toJSON(),game=document.querySelector('.game'),lamp=document.querySelector('.deck-piece[data-piece="lantern"]'),hook=document.querySelector('.deck-hook');
    const selectors=['.status-turn','.status-tools','.status-text','.alarm-bar','.top-hold .hold-label','.top-hold .powder-dots','.top-hold .hold-n','.planks > .plank'];
    const obstacles=selectors.flatMap(q=>[...game.querySelectorAll(q)].filter(e=>e.getBoundingClientRect().width).map(e=>({selector:q,box:box(e)})));
    return {lamp:box(lamp),hook:box(hook),frame:box(game.querySelector('.sea-table')),hold:box(game.querySelector('.top-hold')),space:game.style.getPropertyValue('--phone-lamp-space'),obstacles};
   });
   const meet=(a,b)=>a.x<b.right-.2&&a.right>b.x+.2&&a.y<b.bottom-.2&&a.bottom>b.y+.2;
   expect(geometry.lamp.height).toBeGreaterThanOrEqual(32);expect(geometry.lamp.height).toBeLessThanOrEqual(44.1);
   for(const [name,rect] of [['lamp',geometry.lamp],['hook',geometry.hook]]){
    expect(rect.left,name+' left').toBeGreaterThanOrEqual(0);expect(rect.right,name+' right').toBeLessThanOrEqual(viewport.width);
    expect(rect.top,name+' top').toBeGreaterThanOrEqual(0);expect(rect.bottom,name+' above frame').toBeLessThanOrEqual(geometry.frame.top);
    for(const o of geometry.obstacles)expect(meet(rect,o.box),name+' overlaps '+o.selector).toBe(false);
   }
   // A decorative object must not increase the Hold row or shrink the sea by adding height.
   expect(geometry.hold.height).toBe(24);
   const file=`lantern-${mode}-${viewport.width}x${viewport.height}.png`;
   await page.screenshot({path:`docs/screenshots/perf-diag/${file}`});results.push({viewport,mode,file,...geometry});
  };
  await capture('turn');
  await tap('end-turn');const plans=page.getByTestId('plans-panel');await expect(plans).toBeVisible();
  await plans.locator(`[data-card="${scenario.plan}"]`).click();await plans.locator('.panel-actions .primary').click();await tap('curtain-ready');
  await tap(`volley-${scenario.shooter}`);await tap(`plate-${scenario.target}`);await tap('fire');await tap('curtain-ready');
  await expect(page.getByTestId('reaction-panel')).toBeVisible();await expect(page.getByTestId('alarm')).toContainText('ТРЕВОГА!');
  await capture('alarm');expect(errors).toEqual([]);await page.close();
 }
 writeFileSync('docs/screenshots/perf-diag/lantern-geometry.json',JSON.stringify(results,null,2)+'\n');
 console.log('PASS six cases: lamp+hook in window, 44/32px, above frame, no UI overlap; Hold height unchanged');
}finally{await browser.close();await server.close()}
