// ship-window: real game data and the accepted desktop/phone sheets; native motion stays outside SVG.
import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import type {GameData} from '../src/engine/types';
const data=JSON.parse(readFileSync('data/game-data.json','utf8')) as GameData;
for(const [width,height] of [[1366,660],[1920,944],[430,740]]){
 test(`ship window ${width}×${height}: all four ships, data, prepared motion, pause, discard and close${width<=700?' @iphone':''}`,async({page})=>{
  test.setTimeout(60000);await page.setViewportSize({width,height});
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('?seed=1&speed=instant&perf=0');
  for(const id of ['quick-duo','prep-start','placement-done','curtain-ready','placement-done','curtain-ready'])await page.getByTestId(id).click();
  for(const code of ['Ж','М','И','Г']){
   await page.getByTestId(`plank-${code}`).locator('.plank-head').click({position:{x:8,y:8}});
   const sheet=page.getByTestId('ship-sheet'),ship=data.ships.find(s=>s.code===code)!;
   await expect(sheet).toBeVisible();if(width<=700)await expect(page.locator('#stage')).toHaveAttribute('data-ship-window-covered','');await expect(page.locator('.sw-native-scene')).toHaveAttribute('data-ready','1');
   await expect(sheet.getByRole('heading',{level:1})).toContainText(ship.name.replace(/[«»]/g,''));
   for(const track of ['hull','sails','guns','crew'] as const)await expect(sheet.locator(`[data-sw-track=${track}]`)).toContainText(`${ship[track]}/${ship[track]}`);
   for(const a of ship.abilities)await expect(sheet).toContainText(a.name);
   if(code==='Г'){await expect(sheet.getByTestId('ship-souls')).toContainText('1/5');await expect(sheet.locator('.sw-soul-exchange')).toHaveCount(2);}
   const box=await page.locator(width<=700?'.ship-window-frame':'.ship-window').boundingBox();expect(box).toBeTruthy();
   expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.y).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width+.5);expect(box!.y+box!.height).toBeLessThanOrEqual(height+.5);
   // The artboard's 920px body painting deliberately extends 6px under the border. Check live content, not that decorative crop.
   expect(await sheet.locator('.sw-main,.sw-legend,.sw-footer').evaluateAll(els=>els.every(el=>el.scrollWidth<=el.clientWidth+1))).toBe(true);
   await expect.poll(()=>sheet.evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.playState==='running').length)).toBeGreaterThan(0);
   const faults=await sheet.evaluate(el=>el.getAnimations({subtree:true}).flatMap(a=>{
    const t=(a.effect as KeyframeEffect).target!;
    const frames=(a.effect as KeyframeEffect).getKeyframes(),props=[...new Set(frames.flatMap(f=>Object.keys(f)))].filter(k=>!['offset','computedOffset','easing','composite','transform','opacity'].includes(k));
    return [...t instanceof SVGElement?['SVG motion']:[],...props,...t instanceof HTMLElement&&getComputedStyle(t).filter!=='none'?['live filter']:[]];
   }));expect(faults).toEqual([]);
   await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
   await expect.poll(()=>sheet.evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.playState==='running').length)).toBe(0);
   await page.evaluate(()=>{delete (document as unknown as {hidden?:boolean}).hidden;document.dispatchEvent(new Event('visibilitychange'));});
   await expect.poll(()=>sheet.evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.playState==='running').length)).toBeGreaterThan(0);
   const discard=sheet.getByTestId('ship-discard');await discard.scrollIntoViewIfNeeded();
   if(width<=700)await expect.poll(()=>page.locator('.sw-native-scene').evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.playState==='running').length)).toBe(0);
   expect(await discard.evaluate(el=>{const b=el.getBoundingClientRect();return document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)?.closest('button')===el;})).toBe(true);
   await discard.click();await expect(page.getByTestId('discard')).toBeVisible();await expect(sheet).toHaveCount(0);await page.keyboard.press('Escape');
   await expect(page.getByTestId('discard')).toHaveCount(0);await expect(page.locator('#stage')).not.toHaveAttribute('data-ship-window-covered');
   expect(await page.evaluate(()=>document.getAnimations().filter(a=>(a.effect as KeyframeEffect).target?.closest('.ship-window')).length)).toBe(0);
  }
  await page.getByTestId('plank-Ж').locator('.plank-head').click({position:{x:8,y:8}});await expect(page.getByTestId('ship-sheet')).toBeVisible();
  await page.getByTestId('ship-sheet').getByRole('button',{name:'Закрыть',exact:true}).click();await expect(page.getByTestId('ship-sheet')).toHaveCount(0);
  expect(errors).toEqual([]);
 });
}
