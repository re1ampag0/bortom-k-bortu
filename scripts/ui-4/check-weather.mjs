import { chromium, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';
const label=process.argv[2]??'07-css';
const all=process.argv.includes('--all');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true});
const results={};
try {
 for(const key of all?['calm','wind','fog','storm','wave','maelstrom','clear','reefs','fleet','moon']:['maelstrom']) {
  const page=await browser.newPage({viewport:{width:430,height:740},isMobile:true,hasTouch:true,deviceScaleFactor:3});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:4173/bortom-k-bortu/?fxScene=sea-${key}&speed=normal&rich=1`);
  await page.waitForFunction(()=>document.body.dataset.fxDone==='1');
  const sample=()=>page.locator('.fx-weather').evaluate(host=>({
   arms:Array.from(host.querySelectorAll('.arm')).map(e=>getComputedStyle(e).strokeDashoffset),
   debris:Array.from(host.querySelectorAll('.db')).map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y}}),
   animations:host.getAnimations({subtree:true}).map(a=>({type:a.constructor.name,time:a.currentTime,duration:a.effect.getTiming().duration})),
  }));
  const before=await sample();await page.waitForTimeout(2000);const after=await sample();
  expect(after.animations.length).toBeGreaterThan(0);expect(errors).toEqual([]);
  if(key==='maelstrom') {
   expect(before.arms).toHaveLength(6);expect(before.debris).toHaveLength(5);
   before.arms.forEach((v,i)=>expect(after.arms[i]).not.toBe(v));
   before.debris.forEach((v,i)=>expect(Math.hypot(after.debris[i].x-v.x,after.debris[i].y-v.y)).toBeGreaterThan(1));
  }
  let paused;
  if(label!=='06-before') {
   expect(after.animations.every(a=>a.type==='CSSAnimation')).toBe(true);
   await page.locator('.fx-weather').evaluate(e=>e.classList.add('wx-paused'));
   await page.waitForTimeout(100);const frozen=await sample();await page.waitForTimeout(350);paused=await sample();
   expect(paused.arms).toEqual(frozen.arms);expect(paused.debris).toEqual(frozen.debris);
   paused.animations.forEach((a,i)=>expect(a.time).toBe(frozen.animations[i].time));
   await page.locator('.fx-weather').evaluate(e=>e.classList.remove('wx-paused'));
   await page.waitForTimeout(100);const resumed=await sample();
   expect(resumed.animations.some((a,i)=>a.time>paused.animations[i].time)).toBe(true);
  }
  results[key]={before,after,paused,errors};
  if(key==='maelstrom')await page.screenshot({path:`docs/screenshots/ui-4/${label}-maelstrom-430x740.png`});
  console.log(key,after.animations.length,'animations; motion/pause checked');await page.close();
 }
 writeFileSync(`docs/screenshots/ui-4/${label}-weather.json`,JSON.stringify(results,null,2)+'\n');
}finally{await browser.close()}
