import {chromium,expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const label=process.argv[2]??'08-scrollbar';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
try {for(const height of [680,740]) {
 const page=await browser.newPage({viewport:{width:430,height},hasTouch:true,isMobile:true});
 await page.goto('http://127.0.0.1:4173/bortom-k-bortu/?seed=1&speed=normal&rich=1&hand=8');
 for(const id of ['quick-duo','prep-start','placement-done','curtain-ready','placement-done','curtain-ready'])await page.getByTestId(id).click();
 const row=page.locator('.hand-cards');await expect(row.locator(':scope > .hcard')).toHaveCount(8);
 await expect(page.getByTestId('game')).not.toHaveClass(/fx-busy/, {timeout:40000});
 await page.waitForTimeout(300);
 const metrics=()=>row.evaluate(e=>({left:e.scrollLeft,scrollbar:getComputedStyle(e).scrollbarWidth,webkit:getComputedStyle(e,'::-webkit-scrollbar').display,
  touch:getComputedStyle(e).touchAction,cards:[...e.children].map(c=>({rotate:getComputedStyle(c).rotate,translate:getComputedStyle(c).translate,box:c.getBoundingClientRect().toJSON()}))}));
 const before=await metrics();expect(before.scrollbar).toBe('none');expect(before.webkit).toBe('none');expect(before.touch).toBe('pan-x');
 await page.screenshot({path:`docs/screenshots/ui-4/${label}-430x${height}.png`});
 let swipe,lift;
 if(label.startsWith('09')) {
  const angles=before.cards.map(c=>parseFloat(c.rotate));
  expect(angles.some(r=>Math.abs(r)>=12)).toBe(true);
  expect(angles.every(r=>Math.abs(r)<=13)).toBe(true);
  expect(before.cards.some(c=>parseFloat(c.translate.split(' ')[1]) < -10)).toBe(true);
  const r=await row.boundingBox(),cdp=await page.context().newCDPSession(page);
  const y=Math.min(height-110,r.y+r.height/2);
  expect(await page.evaluate(({x,y})=>!!document.elementFromPoint(x,y)?.closest('.hand-cards'),{x:330,y}),'touch starts on the hand').toBe(true);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:330,y,id:0}]});
  for(let step=1;step<=16;step++) {
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:330-step*14,y,id:0}]});
   await page.waitForTimeout(20);
  }
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(400);swipe=await metrics();expect(Math.abs(swipe.left-before.left)).toBeGreaterThan(20);
  expect(await page.evaluate(()=>document.scrollingElement.scrollLeft)).toBe(0);
  const visible=await row.locator(':scope > .hcard').evaluateAll(es=>es.map((e,i)=>({i,r:e.getBoundingClientRect()})).filter(({r})=>r.x>80&&r.right<350).map(x=>x.i));
  expect(visible.length).toBeGreaterThan(0);await row.locator(':scope > .hcard').nth(visible[0]).click();
  await expect(row.locator('.lifted')).toHaveCount(1);await page.waitForTimeout(400);
  lift=await row.locator('.lifted').evaluate(e=>({rotate:getComputedStyle(e).rotate,z:getComputedStyle(e).zIndex,box:e.getBoundingClientRect().toJSON()}));
  expect(lift.rotate).toBe('0deg');expect(Number(lift.z)).toBeGreaterThan(1);
  await page.screenshot({path:`docs/screenshots/ui-4/${label}-lifted-430x${height}.png`});
 }
 writeFileSync(`docs/screenshots/ui-4/${label}-430x${height}.json`,JSON.stringify({before,swipe,lift},null,2)+'\n');console.log('FRAME',height);await page.close();
}}finally{await browser.close()}
