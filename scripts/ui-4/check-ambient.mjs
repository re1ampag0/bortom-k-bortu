// Actual game: CSS ambient loops freeze during a clip, foreground keeps playing, phase resumes.
import {chromium,expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
try{
 const page=await browser.newPage({viewport:{width:430,height:740},isMobile:true,hasTouch:true});
 await page.goto('http://127.0.0.1:4173/bortom-k-bortu/?seed=1&speed=normal&hints=0');
 for(const id of ['quick-bots','pick-pirates','prep-start','placement-done'])await page.getByTestId(id).click();
 await expect(page.getByTestId('game')).not.toHaveClass(/fx-busy/,{timeout:60000});
 await page.waitForFunction(()=>document.querySelectorAll('.fx-weather .wx-loop').length>0);
 const running=await page.locator('.fx-weather').evaluate(e=>e.getAnimations({subtree:true}).map(a=>a.playState));
 expect(running.length).toBeGreaterThan(0);expect(running.every(s=>s==='running')).toBe(true);
 await page.getByTestId('volley-Ж').click();await page.getByTestId('plate-И').click();await page.getByTestId('fire').click();
 await page.waitForFunction(()=>document.querySelector('.fx-weather.wx-paused .wx-loop'));
 await page.waitForTimeout(100);
 const sample=()=>page.evaluate(()=>{
  const weather=[...document.querySelector('.fx-weather').getAnimations({subtree:true})];
  const ripple=document.querySelector('.sea-water').getAnimations({subtree:true});
  const light=[...document.querySelectorAll('.deck-flare,.lantern-light')].flatMap(e=>e.getAnimations());
  return{weather:weather.map(a=>({state:a.playState,time:a.currentTime})),ripple:ripple.map(a=>({state:a.playState,time:a.currentTime})),light:light.map(a=>({state:a.playState,time:a.currentTime})),
   foreground:document.querySelector('.fx-layer').getAnimations({subtree:true}).filter(a=>a.playState==='running').length};
 });
 const before=await sample();await page.waitForTimeout(250);const after=await sample();
 for(const key of ['weather','ripple','light']){
  expect(before[key].length,key+' present').toBeGreaterThan(0);
  expect(before[key].every(a=>a.state==='paused'),key+' paused').toBe(true);
  expect(after[key],key+' frozen').toEqual(before[key]);
 }
 expect(before.foreground+after.foreground,'foreground clip continues').toBeGreaterThan(0);
 // If this seed opens a human decision, decline through the real button.
 for(let i=0;i<150;i++){
  const skip=page.getByTestId('skip-reaction');if(await skip.isVisible())await skip.click();
  if(!(await page.getByTestId('game').getAttribute('class')).includes('fx-busy')&&!(await skip.isVisible()))break;
  await page.waitForTimeout(200);
 }
 await expect(page.getByTestId('game')).not.toHaveClass(/fx-busy/,{timeout:60000});
 await page.waitForTimeout(100);const resumed=await sample();await page.waitForTimeout(250);const later=await sample();
 for(const key of ['weather','ripple','light']){
  expect(resumed[key].every(a=>a.state==='running'),key+' resumed').toBe(true);
  expect(later[key][0].time,key+' advances').toBeGreaterThan(resumed[key][0].time);
 }
 writeFileSync('docs/screenshots/ui-4/G21-ambient-check.json',JSON.stringify({running,before,after,resumed,later},null,2)+'\n');
 await page.screenshot({path:'docs/screenshots/ui-4/G21-ambient-430x740.png'});
 console.log('PASS weather, ripples and light pause without resetting phase; foreground runs');
}finally{await browser.close()}
