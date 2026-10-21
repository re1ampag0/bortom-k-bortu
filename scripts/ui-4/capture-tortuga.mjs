import {chromium,expect} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
const {seed}=JSON.parse(readFileSync('docs/screenshots/ui-4/tortuga-scenario.json','utf8'));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
try {for(const viewport of [{width:430,height:680},{width:430,height:740},{width:1920,height:944}].filter(v=>!process.argv.includes('--desktop')||v.width>700)) {
 const page=await browser.newPage({viewport});
 await page.goto(`http://127.0.0.1:4173/bortom-k-bortu/?seed=${seed}&speed=instant`);
 for(const id of ['quick-duo','prep-start','placement-done','curtain-ready','placement-done','curtain-ready'])await page.getByTestId(id).click();
 const sheet=page.getByTestId('tortuga-panel');await expect(sheet).toBeVisible();
 // The opening Pirates have no Powder yet. Decline legally; capture the Company's real choice.
 if(await sheet.getByRole('button',{name:'Увеличить',exact:true}).first().isDisabled()) {
  await sheet.getByRole('button',{name:'Не брать',exact:true}).click();
  await page.getByTestId('curtain-ready').click();await expect(sheet).toBeVisible();
 }
 await sheet.getByRole('button',{name:'Увеличить',exact:true}).first().click();
 await expect(sheet.locator('.oak-pan b')).toContainText('Взять 1');await page.waitForTimeout(300);
 const colors=await sheet.locator('.ds-ship').evaluateAll(es=>es.map(e=>({ship:e.dataset.ship,label:getComputedStyle(e).backgroundImage,head:getComputedStyle(document.querySelector(`[data-ship="${e.dataset.ship}"] .plank-head`)).backgroundImage})));
 for(const c of colors)expect(c.label,c.ship+' matches plank head').toBe(c.head);
 const metrics=await sheet.evaluate(e=>({box:e.getBoundingClientRect().toJSON(),hold:e.querySelector('.cs-hold').textContent,
  buttons:[...e.querySelectorAll('button')].map(b=>{const r=b.getBoundingClientRect();return {text:b.textContent,box:r.toJSON(),hit:b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}})}));
 expect(metrics.box.x).toBeGreaterThanOrEqual(-1);expect(metrics.box.right).toBeLessThanOrEqual(viewport.width+1);
 for(const b of metrics.buttons){expect(b.hit,b.text+' hit').toBe(true);expect(b.box.bottom).toBeLessThanOrEqual(viewport.height);}
 expect(await page.locator('.game').evaluate(e=>e.scrollLeft)).toBe(0);
 const bar=await page.locator('.bottom-bar').boundingBox();if(bar)expect(metrics.box.bottom).toBeLessThanOrEqual(bar.y+1);
 if(viewport.width>700){const hand=await page.locator('.hand-row').boundingBox();expect(metrics.box.bottom).toBeLessThanOrEqual(hand.y+1);}
 const name=`${process.argv.find(x=>x.startsWith('--label='))?.slice(8)??'11-tortuga'}-${viewport.width}x${viewport.height}`;
 await page.screenshot({path:`docs/screenshots/ui-4/${name}.png`});writeFileSync(`docs/screenshots/ui-4/${name}.json`,JSON.stringify(metrics,null,2)+'\n');
 console.log('FRAME',viewport);await page.close();
}}finally{await browser.close()}
