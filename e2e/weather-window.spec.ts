// Public seeded games; the scene renderer must stay outside large animated SVGs.
import {test,expect} from '@playwright/test';
for(const [width,height]of [[1366,660],[430,932]])test(`weather window ${width}×${height}: real rows, prepared motion, pause and close${width<700?' @iphone':''}`,async({page,browserName})=>{
 // Three complete progressive scenes plus game setup; this is a functional check, not a GPU benchmark.
 test.setTimeout(browserName==='webkit'?180000:60000);await page.setViewportSize({width,height});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const [seed,name]of [[3,'Буря'],[26,'Тортуга'],[62,'Сырой порох']]as const){
  await page.goto(`?seed=${seed}&speed=instant&perf=0`);for(const id of ['quick-duo','prep-start','placement-done','curtain-ready','placement-done','curtain-ready'])await page.getByTestId(id).click();
  await page.locator('[data-fx-sea-chip]').click();const sheet=page.getByTestId('sea-sheet'),scene=sheet.locator('.sw-native-scene');
  await expect(sheet.getByRole('heading',{level:1})).toHaveText(name);await expect(scene).toHaveAttribute('data-ready','1',{timeout:browserName==='webkit'?60000:20000});await expect(sheet).toContainText('Боцман:');await expect(sheet).toContainText('В колоде моря 16');await expect(sheet.locator('.ww-row')).toHaveCount(seed===3?4:2);
  const frame=await page.locator('.weather-window-frame').boundingBox();expect(frame).toBeTruthy();expect(frame!.x).toBeGreaterThanOrEqual(0);expect(frame!.y).toBeGreaterThanOrEqual(0);expect(frame!.x+frame!.width).toBeLessThanOrEqual(width+.5);expect(frame!.y+frame!.height).toBeLessThanOrEqual(height+.5);
  expect(await sheet.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
  expect(await sheet.evaluate(el=>el.getAnimations({subtree:true}).flatMap(a=>{const e=(a.effect as KeyframeEffect).target!;return[...e instanceof SVGElement?['SVG animation']:[],...Object.keys((a.effect as KeyframeEffect).getKeyframes()[0]).filter(k=>!['offset','computedOffset','composite','easing','transform','opacity'].includes(k))];}))).toEqual([]);
  await expect.poll(()=>scene.evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.playState==='running').length)).toBeGreaterThan(0);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});await expect.poll(()=>scene.evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.playState==='running').length)).toBe(0);
  await page.evaluate(()=>{delete(document as unknown as {hidden?:boolean}).hidden;document.dispatchEvent(new Event('visibilitychange'));});await expect.poll(()=>scene.evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.playState==='running').length)).toBeGreaterThan(0);
  if(width<700){
   // PR #82 pins the scene/header and scrolls only the body. Scrolling must keep the visible scene running.
   const before=await scene.boundingBox();
   const scroll=await sheet.locator('.ww-body').evaluate(el=>{const can=el.scrollHeight>el.clientHeight;el.scrollTo({top:el.scrollHeight,behavior:'instant'});return{can,top:el.scrollTop};});
   if(seed===3)expect(scroll.can).toBe(true);
   if(scroll.can)expect(scroll.top).toBeGreaterThan(0);
   const after=await scene.boundingBox();expect(after).toBeTruthy();
   expect(Math.abs(after!.y-before!.y)).toBeLessThanOrEqual(.5);
   expect(after!.y).toBeGreaterThanOrEqual(0);expect(after!.y+after!.height).toBeLessThanOrEqual(height);
   await expect.poll(()=>scene.evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.playState==='running').length)).toBeGreaterThan(0);
   await sheet.locator('.ww-body').evaluate(el=>el.scrollTo({top:0,behavior:'instant'}));
  }
  const close=sheet.getByRole('button',{name:'Закрыть',exact:true});expect(await close.evaluate(el=>{const b=el.getBoundingClientRect();return document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)?.closest('button')===el;})).toBe(true);
  await close.click();await expect(sheet).toHaveCount(0);await expect(page.locator('#stage')).not.toHaveAttribute('data-ship-window-covered');expect(await page.evaluate(()=>document.getAnimations().filter(a=>(a.effect as KeyframeEffect).target?.closest('.weather-window')).length)).toBe(0);
 }expect(errors).toEqual([]);
});
