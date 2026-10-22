import {expect,test} from '@playwright/test';

// Moving weather crosses HTML/SVG compositor boundaries, but one container must
// still freeze every loop during a foreground clip without resetting its phase.
for(const key of ['storm','wave','maelstrom']){
  test(`ambient ${key}: the container pauses every weather loop and resumes its phase`,async({page})=>{
    await page.setViewportSize({width:430,height:932});
    await page.goto(`?fxScene=sea-${key}&manual=1&rich=1&speed=normal`);
    await page.getByTestId('fx-start').click();
    await page.waitForFunction(()=>document.body.dataset.fxDone==='1');
    const weather=page.locator('.fx-weather');
    const sample=()=>weather.evaluate(async host=>{
      const loops=host.getAnimations({subtree:true});
      await Promise.all(loops.map(a=>a.ready));
      return loops.map(a=>({time:Number(a.currentTime),state:a.playState}));
    });
    const first=await sample();expect(first.length).toBeGreaterThan(0);
    await page.waitForTimeout(250);
    const moving=await sample();
    expect(moving.every((a,i)=>a.time>first[i].time)).toBe(true);
    await weather.evaluate(host=>host.classList.add('wx-paused'));
    const held=await sample();expect(held.every(a=>a.state==='paused')).toBe(true);
    await page.waitForTimeout(250);
    expect(await sample()).toEqual(held);
    await weather.evaluate(host=>host.classList.remove('wx-paused'));
    await page.waitForTimeout(250);
    const resumed=await sample();expect(resumed).toHaveLength(held.length);
    expect(resumed.every((a,i)=>a.state==='running'&&a.time>held[i].time)).toBe(true);
  });
}
