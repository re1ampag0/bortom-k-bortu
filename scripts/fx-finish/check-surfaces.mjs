// A short resource/lifecycle probe, not a performance comparison. No server build.
// node scripts/fx-finish/check-surfaces.mjs tmp/fx-finish/part2-canvas-dist
import {preview} from 'vite';
import {chromium,expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const server=await preview({build:{outDir:process.argv[2]},preview:{host:'127.0.0.1',port:5191,strictPort:true}});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
const rows=[];
try {
 const page=await browser.newPage({viewport:{width:430,height:740},deviceScaleFactor:3,isMobile:true,hasTouch:true});
 const snapshot=()=>page.evaluate(()=>{
  const board=document.querySelector('.board');
  return {w:board.clientWidth,h:board.clientHeight,dpr:innerWidth<=700?Math.min(devicePixelRatio,2):devicePixelRatio,...board.fxParticles()};
 });
 await page.goto('http://127.0.0.1:5191/bortom-k-bortu/?fxScene=armada&manual=1&hitTest=1&speed=fast&perf=0');
 await expect(page.getByTestId('fx-start')).toBeVisible();
 for(const [width,height]of [[430,740],[390,844],[844,390],[430,680]]){
  await page.setViewportSize({width,height});
  await expect.poll(async()=>{
   const s=await snapshot();return s.surfaces.length===3&&s.surfaces.every(c=>c.width===Math.ceil(s.w*s.dpr)&&c.height===Math.ceil(s.h*s.dpr));
  }).toBe(true);
  const s=await snapshot();
  expect(s.raf).toBe(false);expect(s.active).toBe(0);
  expect(s.surfaces.every(c=>!c.connected)).toBe(true);
  rows.push({viewport:`${width}×${height}`,state:'before',...s});
 }
 await page.getByTestId('fx-start').click();
 await expect.poll(async()=>{const s=await snapshot();return s.surfaces.some(c=>c.connected);}).toBe(true);
 await page.getByTestId('fx-finish').click();
 await expect.poll(async()=>{const s=await snapshot();return !s.raf&&s.active===0&&s.surfaces.every(c=>!c.connected);}).toBe(true);
 rows.push({state:'after skip',...await snapshot()});
 writeFileSync('docs/screenshots/fx-finish/part2-canvas-lifecycle.json',JSON.stringify(rows,null,1)+'\n');
 console.log('Three prepared surfaces: resize, rotation, idle and skip passed.');
} finally {await browser.close();await new Promise(r=>server.httpServer.close(r));}
