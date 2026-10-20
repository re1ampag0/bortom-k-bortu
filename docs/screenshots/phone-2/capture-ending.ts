import {chromium, expect} from '@playwright/test';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
try {
for(const viewport of [{width:430,height:740},{width:1920,height:944}]) {
 const page=await browser.newPage({viewport,baseURL:'http://127.0.0.1:4173/bortom-k-bortu/'});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('?seed=1&speed=fast');
 for(const id of ['quick-bots','prep-start','placement-done'])await page.getByTestId(id).click();
 await page.waitForTimeout(3500);
 const end=page.locator('[data-testid="end-turn"]:visible').first();await end.click();
 for(let i=0;i<30&&!/Ход окончен ·/.test(await end.textContent()??'');i++){
  for(const id of ['confirm-yes','no-plans'])if(await page.getByTestId(id).isVisible())await page.getByTestId(id).click();
  await page.waitForTimeout(50);
 }
 await expect(end).toContainText('Ход окончен · 3');
 await expect(page.getByTestId('ending')).toHaveCount(0);
 await page.screenshot({path:`docs/screenshots/phone-2/ending-${viewport.width}x${viewport.height}.png`});
 await page.locator('[data-testid="undo"]:visible').first().click();await expect(end).not.toContainText('Ход окончен ·');
 console.log('ENDING',viewport,'countdown shown, round Undo cancelled');await page.close();
}
}finally{await browser.close()}
