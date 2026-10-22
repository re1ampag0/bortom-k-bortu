import {preview} from 'vite';
import {chromium,expect} from '@playwright/test';
import {writeFileSync,readFileSync} from 'node:fs';
const [label='stage1',key='storm',width='430',height='932']=process.argv.slice(2),w=Number(width),h=Number(height),stem=`docs/screenshots/fx-ambient/${key}-${w}x${h}`,outDir=label==='before'?'/tmp/fx-ambient-before-dist':'tmp/fx-ambient/dist';
const server=await preview({build:{outDir},preview:{host:'127.0.0.1',port:5192,strictPort:true}}),browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
try{
 const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:w<=700?3:1,isMobile:w<=700,hasTouch:w<=700});
 await page.addInitScript(()=>{let s=19427;Math.random=()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296)});
 await page.goto(`http://127.0.0.1:5192/bortom-k-bortu/?fxScene=sea-${key}&manual=1&speed=normal&rich=1&perf=0&particleProbe=0`);await page.bringToFront();await page.evaluate(()=>document.fonts.ready);await page.getByTestId('fx-start').click();await page.waitForFunction(()=>document.body.dataset.fxDone==='1',null,{timeout:60000});await page.waitForTimeout(500);
 const poses=await page.evaluate(async()=>{for(const a of document.getAnimations())if(a instanceof CSSAnimation){a.pause();a.currentTime=1300}await Promise.all(document.getAnimations().map(a=>a.ready.catch(()=>{})));return [...document.querySelectorAll('.planks > .plank')].map(e=>({translate:getComputedStyle(e).translate,rotate:getComputedStyle(e).rotate,transform:getComputedStyle(e).transform}))});
 await page.screenshot({path:`${stem}-${label}.png`});writeFileSync(`${stem}-${label}.json`,JSON.stringify({phase:1300,poses},null,2));
 if(label!=='before'){
  expect(poses).toEqual(JSON.parse(readFileSync(`${stem}-before.json`)).poses);
  await page.setViewportSize({width:w*2,height:h+32});await page.setContent(`<style>body{margin:0;display:flex;background:#291d13;color:#f8e7c8;font:16px sans-serif}figure{margin:0}figcaption{height:32px;text-align:center}img{display:block;width:${w}px;height:${h}px}</style>`+['before',label].map(k=>`<figure><figcaption>${k==='before'?'До':label}</figcaption><img src="data:image/png;base64,${readFileSync(`${stem}-${k}.png`).toString('base64')}"></figure>`).join(''));await page.screenshot({path:`${stem}-${label}-comparison.png`});
 }
 console.log('FRAME',key,label,w,h);
}finally{await browser.close();await new Promise(r=>server.httpServer.close(r))}
