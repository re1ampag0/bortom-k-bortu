import {chromium,expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const panel=process.argv[2]??'jack',number=process.argv[3]??'13';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
try {for(const viewport of [{width:430,height:680},{width:430,height:740},{width:1920,height:944}]) {
 const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:5174/bortom-k-bortu/scripts/ui-4/panel-preview.html?panel=${panel}&speed=instant`);
 await page.evaluate(()=>document.fonts.ready);
 const sheet=page.getByTestId(panel==='card'?'card-panel':`${panel}-panel`);
 await expect(sheet).toBeVisible();await expect(sheet).toHaveClass(/decision-sheet/);await page.waitForTimeout(300);
 if(panel==='choice') {
  await sheet.locator('.choice-cards > .hcard').nth(0).click();
  await expect(sheet.locator('.oak-btn')).toHaveAttribute('aria-disabled','true');
 }

 const r=await sheet.evaluate(e=>({box:e.getBoundingClientRect().toJSON(),buttons:[...e.querySelectorAll('button')].map(b=>{const r=b.getBoundingClientRect();return{label:b.textContent,box:r.toJSON(),hit:b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}})}));
 expect(r.box.x).toBeGreaterThanOrEqual(-1);expect(r.box.right).toBeLessThanOrEqual(viewport.width+1);
 const bar=await page.locator('.bottom-bar').boundingBox();if(bar)expect(r.box.bottom).toBeLessThanOrEqual(bar.y+1);
 if(viewport.width>700){const h=await page.locator('.hand-row').boundingBox();expect(r.box.bottom).toBeLessThanOrEqual(h.y+1);}
 for(const b of r.buttons){expect(b.hit,b.label+' centre').toBe(true);expect(b.box.bottom).toBeLessThanOrEqual(viewport.height);}
 const name=`${number}-${panel}-${viewport.width}x${viewport.height}`;await page.screenshot({path:`docs/screenshots/ui-4/${name}.png`});writeFileSync(`docs/screenshots/ui-4/${name}.json`,JSON.stringify(r,null,2)+'\n');
 if(panel==='jack'){
  await sheet.locator('.oak-btn').click();await expect(sheet).toHaveCount(0);
  const s=await page.evaluate(()=>({hull:window.ui4Game.state.ships['Ж'].tracks.hull,legend:window.ui4Game.state.ships['Ж'].legend}));
  expect(s).toEqual({hull:2,legend:false});
 }
 if(panel==='choice') {
  await sheet.locator('.choice-cards > .hcard').nth(1).click();
  await expect(sheet.locator('.oak-btn')).toHaveAttribute('aria-disabled','false');
  await sheet.locator('.oak-btn').click();await expect(sheet).toHaveCount(0);
  expect(await page.evaluate(()=>window.ui4Game.state.ships['Ж'].plans.length)).toBe(1);
 }
 expect(errors).toEqual([]);console.log('FRAME',panel,viewport);await page.close();
}}finally{await browser.close()}
