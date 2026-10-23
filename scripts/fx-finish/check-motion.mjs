// Resource/clock probe, not a timing benchmark: normal playback, rotation during the entrance, pause and skip.
// node scripts/fx-finish/check-motion.mjs DIST
import {preview} from 'vite';
import {chromium,expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const server=await preview({build:{outDir:process.argv[2]},preview:{host:'127.0.0.1',port:5191,strictPort:true}});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium'}),rows=[];
try{
 for(const scene of ['kraken','jack','bottle']){
  const page=await browser.newPage({viewport:{width:430,height:740},isMobile:true,hasTouch:true,deviceScaleFactor:3}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.bigSvg=0;const native=Element.prototype.animate;Element.prototype.animate=function(...args){if(this.closest('svg.fx-svg'))window.bigSvg++;return native.apply(this,args);};});
  await page.goto(`http://127.0.0.1:5191/bortom-k-bortu/?fxScene=${scene}&manual=1&hitTest=1&speed=fast&perf=0`);
  await page.evaluate(()=>document.fonts.ready);await page.getByTestId('fx-start').click();
  await expect(page.locator('.lg-card')).toBeVisible({timeout:20000});
  await page.setViewportSize({width:844,height:390});
  const selector=scene==='kraken'?'[data-grip]':scene==='jack'?'[data-sprite-node="needle"]':'.lg-rock';
  await expect(page.locator('.fx-layer '+selector).first()).toBeAttached({timeout:30000});
  const pause=page.getByTestId('fx-pause');expect(await pause.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})).toBe(true);await pause.click();
  await expect.poll(()=>page.evaluate(()=>(()=>{const s=document.querySelector('.board').fxParticles();return s.paused||!s.raf;})())).toBe(true);
  const frames=await page.evaluate(()=>{const a=document.querySelector('.fx-layer').getAnimations({subtree:true}).filter(a=>!(a instanceof CSSAnimation)&&a.playState==='paused');window.held=a.map(a=>[a,a.currentTime]);return a.length;});
  expect(frames).toBeGreaterThan(0);await page.waitForTimeout(120);
  expect(await page.evaluate(()=>window.held.every(([a,t])=>a.currentTime===t))).toBe(true);
  const finish=page.getByTestId('fx-finish');
  expect(await finish.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})).toBe(true);
  await finish.click();await expect(page.locator('.fx-layer .fx-sprite')).toHaveCount(0);
  const stats=await page.evaluate(()=>({svg:window.bigSvg,particles:document.querySelector('.board').fxParticles()}));
  expect(stats.svg).toBe(0);expect(stats.particles.raf).toBe(false);expect(errors).toEqual([]);
  rows.push({scene,rotation:'430×740→844×390',pausedAnimations:frames,errors,svg:stats.svg,rafAfterSkip:stats.particles.raf});await page.close();
 }
 writeFileSync('docs/screenshots/fx-finish/motion-lifecycle.json',JSON.stringify(rows,null,1)+'\n');
 console.log('Three scenes: rotation during entrance, pause, skip and bigSVG=0 passed.');
}finally{await browser.close();await new Promise(r=>server.httpServer.close(r));}
