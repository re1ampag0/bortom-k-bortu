import {chromium,expect} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
const {seed,target}=JSON.parse(readFileSync('docs/screenshots/ui-4/wait-scenario.json','utf8'));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
try{for(const viewport of [{width:430,height:680},{width:430,height:740},{width:1920,height:944}]){
 const page=await browser.newPage({viewport});await page.goto(`http://127.0.0.1:4173/bortom-k-bortu/?seed=${seed}&speed=slow`);
 for(const id of ['quick-bots','pick-pirates','prep-start','placement-done'])await page.getByTestId(id).click();
 await expect(page.getByTestId('game')).not.toHaveClass(/fx-busy/,{timeout:40000});
 await page.getByTestId('volley-Ж').filter({visible:true}).click();await page.getByTestId(`plate-${target}`).click();await page.getByTestId('fire').click();
 await expect(page.getByTestId('instruction')).toContainText('Противник может ответить Реакцией…',{timeout:30000});
 await page.getByTestId('pause-show').filter({visible:true}).click();
 const pill=page.getByTestId('reaction-wait');await expect(pill).toBeVisible();await expect(page.locator('.dock')).toHaveCount(0);
 await expect(page.getByTestId(`plank-${target}`).getByTestId('reaction-wait')).toBeVisible();
 const r=await pill.evaluate(e=>({box:e.getBoundingClientRect().toJSON(),title:e.getAttribute('title'),dots:e.querySelectorAll('i').length}));
 expect(r.dots).toBe(3);expect(r.box.width).toBeLessThan(50);expect(r.box.x).toBeGreaterThanOrEqual(0);expect(r.box.right).toBeLessThanOrEqual(viewport.width);
 const plate=await page.locator('.fx-layer > .plate').boundingBox();if(plate)expect(r.box.bottom<=plate.y||r.box.y>=plate.y+plate.height||r.box.right<=plate.x||r.box.x>=plate.x+plate.width).toBe(true);
 const label=`12-wait-${viewport.width}x${viewport.height}`;await page.screenshot({path:`docs/screenshots/ui-4/${label}.png`});writeFileSync(`docs/screenshots/ui-4/${label}.json`,JSON.stringify(r,null,2)+'\n');console.log('FRAME',viewport);await page.close();
}}finally{await browser.close()}
