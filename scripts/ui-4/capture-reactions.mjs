import { chromium, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
const scenario=JSON.parse(readFileSync(process.argv[3]??'docs/screenshots/ui-4/reaction-scenario.json','utf8'));
const label=process.argv[2]??'reactions';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
async function tap(page,id){const el=page.getByTestId(id).filter({visible:true}).first();await el.click();}
try {
 for(const height of [680,740]){
  const page=await browser.newPage({viewport:{width:430,height},isMobile:true,hasTouch:true,baseURL:'http://127.0.0.1:4173/bortom-k-bortu/'});
  await page.goto(`?seed=${scenario.seed}&speed=instant&hand=${scenario.hand}&hints=0`);
  for(const id of ['quick-duo','prep-start','placement-done','curtain-ready','placement-done','curtain-ready'])await tap(page,id);
  await page.locator('[data-testid="end-turn"]:visible').first().click();
  if(await page.getByTestId('confirm-yes').isVisible())await tap(page,'confirm-yes');
  const plans=page.getByTestId('plans-panel');await expect(plans).toBeVisible();
  await plans.locator(`[data-card="${scenario.plan}"]`).click();
  await plans.locator('.panel-actions .primary').click();await tap(page,'curtain-ready');
  await tap(page,`volley-${scenario.shooter}`);await tap(page,`plate-${scenario.target}`);await tap(page,'fire');await tap(page,'curtain-ready');
  const sheet=page.getByTestId('reaction-panel');await expect(sheet).toBeVisible();
  await sheet.evaluate(async e=>{await Promise.all(e.getAnimations().map(a=>a.finished.catch(()=>{})))});
  console.log('CARDS',await sheet.locator('.as-card').evaluateAll(es=>es.map(e=>({code:e.dataset.card,plan:!!e.querySelector('.plan'),off:e.classList.contains('off')}))));
  await expect(sheet.locator('.as-card')).toHaveCount(3);await expect(sheet.locator('.as-card.off')).toHaveCount(scenario.items.filter(c=>c.why).length);
  await expect(sheet.locator('.hcard.plan')).toHaveCount(1);await expect(sheet.locator('.as-card [data-testid="play-reaction"]')).toHaveCount(0);
  if(label !== '01-cards') {
    const single=scenario.items.filter(c=>!c.why).length===1;
    await expect(sheet.getByTestId('play-reaction')).toHaveAttribute('aria-disabled',String(!single));
    await expect(sheet.locator('.as-card.on')).toHaveCount(single?1:0);
  }
  await sheet.locator('.as-card:not(.off) .hcard').first().click();
  await expect(sheet.getByTestId('play-reaction')).toHaveCount(1);
  await page.waitForTimeout(200);
  const layout=await page.evaluate(()=>{
   const box=q=>document.querySelector(q)?.getBoundingClientRect().toJSON();
   return {height:innerHeight,sheet:box('[data-testid="reaction-panel"]'),bar:box('.bottom-bar'),target:box('[data-testid="plank-Ж"]'),alarm:box('[data-testid="alarm"]'),cards:[...document.querySelectorAll('.as-card')].map(e=>({card:e.dataset.card,box:e.getBoundingClientRect().toJSON()}))};
  });
  writeFileSync(`docs/screenshots/ui-4/${label}-430x${height}.json`,JSON.stringify(layout,null,2)+'\n');
  await page.screenshot({path:`docs/screenshots/ui-4/${label}-430x${height}.png`});console.log('FRAME',height,'3 reactions, unavailable card and Plan selected');await page.close();
 }
}finally{await browser.close()}
