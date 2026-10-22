import {expect,test} from '@playwright/test';

test('effect leftovers never cover plank buttons: volley, armada, sink and touch skip',async({browser})=>{
 const context=await browser.newContext({viewport:{width:430,height:740},isMobile:true,hasTouch:true});
 await context.addInitScript(()=>localStorage.setItem('bortom-k-bortu.settings',JSON.stringify({tapSkip:true})));
 const page=await context.newPage(),errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 const check=async()=>{
  const result=await page.locator('[data-testid^="probe-"]').evaluateAll(buttons=>buttons.map(b=>{
   const r=b.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
   return b.contains(hit)?null:{button:b.getAttribute('data-testid'),hit:hit?.outerHTML.slice(0,160)};
  }).filter(Boolean));expect(result).toEqual([]);
  const b=page.getByTestId('probe-М');await b.click();expect(await page.evaluate(()=>document.body.dataset.fxButton)).toBe('М');
 };
 for(const scene of ['plain','armada','sink'])for(const finish of ['natural','touch','finish']){
  await page.goto(`?fxScene=${scene}&hitTest=1&speed=fast&perf=1`);
  if(scene==='sink')await page.waitForFunction(()=>document.querySelector('[data-fx-instruction]')?.textContent?.includes('тонет'));
  else await page.locator('.gun-fire').first().waitFor();
  await page.getByTestId('fx-pause').click();await check();await page.getByTestId('fx-pause').click();
  if(finish==='touch')await page.touchscreen.tap(3,300);
  else if(finish==='finish')await page.getByTestId('fx-finish').click();
  await page.waitForFunction(()=>document.body.dataset.fxDone==='1',null,{timeout:60000});await check();
  if(finish!=='natural')await expect(page.locator('.fx-layer > *')).toHaveCount(0);
 }
 expect(errors).toEqual([]);await context.close();
});
