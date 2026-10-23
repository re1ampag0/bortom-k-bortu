import {mkdirSync} from 'node:fs';
import {test,expect,type Page} from '@playwright/test';
import {clickMisses,expectResult,playing} from './fx-scene';
const SHOTS='docs/screenshots/fx-finish/damage-setting';
const KEY='bortom-k-bortu.settings';
async function game(page:Page,speed='fast'){
 await page.goto(`?seed=1&speed=${speed}&hints=0`);
 for(const id of ['quick-bots','pick-pirates','prep-start','placement-done'])await page.getByTestId(id).click();
 await expect(page.getByTestId('game')).toBeVisible();
 await expect(page.locator('.game')).not.toHaveAttribute('data-fx-busy');
}
async function setting(page:Page,value:'show'|'hide'){
 await page.getByTestId('settings-btn').click();
 await page.getByTestId(`view-damage-${value}`).click();
 await expect(page.getByTestId(`view-damage-${value}`)).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Закрыть',exact:true}).click();
}
test.describe('damage breakdown setting (430×932)',()=>{
 test.use({viewport:{width:430,height:932},isMobile:true,hasTouch:true});
 for(const mode of ['show','hide'] as const)test(`damage breakdown ${mode}: settings persist, cards fade, result and clickthrough`,async({page})=>{
  mkdirSync(SHOTS,{recursive:true});
  await page.addInitScript(key=>{
   if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({view:{guns:'icons',hand:'deck',frame:'bulwark'}}));
   const w=window as unknown as {plateProbe:{plates:number;fades:Keyframe[][]}};
   w.plateProbe={plates:0,fades:[]};
   new MutationObserver(rows=>{for(const r of rows)for(const n of Array.from(r.addedNodes))if(n instanceof Element){w.plateProbe.plates+=Number(n.matches('.plate'))+n.querySelectorAll('.plate').length;}}).observe(document,{subtree:true,childList:true});
   const native=Element.prototype.animate;
   Element.prototype.animate=function(frames,options){if(this.classList.contains('flyc')&&Array.isArray(frames)&&Number(frames.at(-1)?.opacity)===0)w.plateProbe.fades.push(frames);return native.call(this,frames,options);};
  },KEY);
  await game(page);
  await page.getByTestId('settings-btn').click();
  await expect(page.getByTestId('view-damage-show')).toHaveAttribute('aria-pressed','true'); // old record
  await page.getByTestId(`view-damage-${mode}`).click();
  await page.getByRole('button',{name:'Закрыть',exact:true}).click();
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).view.damage,KEY)).toBe(mode);
  // A new document reads the persisted setting. Real reference events include a Charge, Reaction, hit and fire.
  await page.goto('?fxScene=whirl&manual=1&speed=normal&seed=1');
  await page.getByTestId('fx-start').click();await playing(page);
  await expect(page.locator('.whirl')).toBeVisible();
  if(mode==='show'){
   await expect(page.locator('.plate')).toContainText('Водоворот');
   const row=page.locator('.plate [data-card]').first();
   await row.tap();await expect(page.locator('.plate-peek')).toBeVisible();
   await row.tap();await expect(page.locator('.plate-peek')).toHaveCount(0);
  }
  else await expect(page.locator('.plate,.plate-peek')).toHaveCount(0);
  const misses=await clickMisses(page);expect(misses.planks).toBe(4);expect(misses.out).toEqual([]);
  await page.screenshot({path:`${SHOTS}/${mode}-430x932.png`});
  await expectResult(page,'whirl','.whirl');
  if(mode==='show')await expect(page.locator('.fx-scars > .plate')).toHaveCount(1);
  else{
   await expect(page.locator('.plate,.plate-peek')).toHaveCount(0);
   const probe=await page.evaluate(()=>(window as unknown as {plateProbe:{plates:number;fades:Keyframe[][]}}).plateProbe);
   expect(probe.plates).toBe(0);expect(probe.fades).toHaveLength(2);
   for(const frames of probe.fades)expect(frames.every(f=>f.transform===undefined)).toBe(true);
  }
 });
 test('damage breakdown changes immediately during a Volley',async({page})=>{
  await game(page,'normal');
  await page.getByTestId('volley-Ж').filter({visible:true}).first().click();
  await page.getByTestId('plate-И').click();
  // Freeze queue timers, so a slow settings interaction cannot run past the tested clip.
  await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+100));
  await page.getByTestId('fire').click();
  await expect(page.locator('.fx-layer > .plate')).toBeVisible();
  await expect(page.locator('.game')).toHaveAttribute('data-fx-busy','');
  await setting(page,'hide');await expect(page.locator('.plate,.plate-peek')).toHaveCount(0);
  await expect(page.locator('.game')).toHaveAttribute('data-fx-busy','');
  await setting(page,'show');await expect(page.locator('.fx-layer > .plate')).toBeVisible();
  await expect(page.locator('.game')).toHaveAttribute('data-fx-busy','');
  // No navigation/reload between changes; resume the same action afterwards.
  await setting(page,'hide');await expect(page.locator('.plate,.plate-peek')).toHaveCount(0);
  await page.clock.resume();
  await expect(page.locator('.game')).not.toHaveAttribute('data-fx-busy',{timeout:30000});
 });
});
