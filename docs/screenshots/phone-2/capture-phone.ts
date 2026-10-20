import { chromium, expect, type Page } from '@playwright/test';
async function startDuo(page: Page) {
  await page.goto('?seed=1&speed=instant');
  await page.getByTestId('quick-duo').click();
  await page.getByTestId('prep-start').click();
  await page.getByTestId('placement-done').click();
  await page.getByTestId('curtain-ready').click();
  await page.getByTestId('placement-done').click();
  await page.getByTestId('curtain-ready').click();
  await expect(page.getByTestId('game')).toHaveAttribute('data-bottom', 'ПИРАТЫ');
}

async function expectWholePlankTarget(page: Page, code: string) {
  const target = page.getByTestId(`plate-${code}`);
  await expect(target).toHaveClass(/aimable/);
  const box = (await target.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(150);
  expect(box.height).toBeGreaterThanOrEqual(44);
  const star = page.getByTestId(`star-${code}`);
  const sb = (await star.count()) > 0 ? await star.boundingBox() : null;
  const head = (await target.locator('.plank-head').boundingBox())!;
  const points = [
    [box.x + 6, head.y + 4],
    [box.x + box.width / 2, head.y + head.height / 2],
    [box.x + box.width / 2, box.y + box.height / 2],
    [box.x + 6, box.y + box.height - 6],
    [box.x + box.width - 6, box.y + box.height - 6],
    ...(sb ? [[sb.x + sb.width / 2, sb.y + sb.height / 2]] : []),
  ];
  const hits = await page.evaluate(
    ({ pts, id }) => pts.map(([x, y]) => document.elementFromPoint(x, y)?.closest('[data-testid]')?.getAttribute('data-testid') ?? null).map((t) => t === id),
    { pts: points, id: `plate-${code}` },
  );
  expect(hits).toEqual(points.map(() => true));
}

/**
 * The Pearl or the Revenge fires at the Dutchman (so its Souls can restore the Hull: more buttons on its plank), the Company
 * skips the Reactions, the Pirates end their turn without plans; the device goes to the Company.
 */
async function toCompany(page: Page) {
  for (const shooter of ['Ж', 'М']) {
    await page.getByTestId(`volley-${shooter}`).click();
    await expect(page.getByTestId('volley-panel')).toBeVisible();
    if ((await page.getByTestId('plate-Г').count()) > 0) break;
    await page.getByTestId('cancel-volley').click();
  }
  await expectWholePlankTarget(page, 'Г');
  // A tap on the head chooses the target, not the ship card.
  await page.getByTestId('plate-Г').locator('.plank-head').click({ position: { x: 8, y: 8 }, timeout: 5000 });
  await expect(page.getByTestId('plate-Г')).toHaveClass(/chosen/);
  await expect(page.getByTestId('ship-sheet')).toHaveCount(0);
  await page.getByTestId('fire').click();
  for (let i = 0; i < 200; i++) {
    const skip = page.locator('[data-testid="skip-reaction"]:visible');
    if (await page.getByTestId('curtain-ready').isVisible()) await page.getByTestId('curtain-ready').click();
    else if ((await skip.count()) > 0) { if (!(await page.locator('body').getAttribute('data-captured'))) await captureAlarm(page); await skip.first().click(); }
    else if ((await page.locator('[data-testid="end-turn"]:visible:not([aria-disabled="true"])').count()) > 0) break;
    else await page.waitForTimeout(50);
  }
  await expect(page.getByTestId('game')).toHaveAttribute('data-bottom', 'ПИРАТЫ');
  await page.locator('[data-testid="end-turn"]:visible').first().click();
  for (let i = 0; i < 200; i++) {
    if (await page.getByTestId('curtain-ready').isVisible()) break;
    if (await page.getByTestId('confirm-end').isVisible()) await page.getByTestId('confirm-yes').click();
    else if (await page.getByTestId('plans-panel').isVisible()) await page.getByTestId('no-plans').click();
    else await page.waitForTimeout(50);
  }
  await page.getByTestId('curtain-ready').click();
  await expect(page.getByTestId('game')).toHaveAttribute('data-bottom', 'КОМПАНИЯ');
}



async function captureAlarm(page: Page) {
 const win=page.viewportSize()!;
 if(win.width>700)return;
 await page.locator('[data-testid="reaction-panel"]').evaluate(async e=>{await Promise.all(e.getAnimations().map(a=>a.finished.catch(()=>{})))});
 const bar=(await page.locator('.bottom-bar').boundingBox())!;
 for(const id of ['skip-reaction','alarm-collapse']) {
  const el=page.getByTestId(id);const r=(await el.boundingBox())!;
  expect(r.y+r.height, id+' above bottom bar').toBeLessThanOrEqual(bar.y+1);
  expect(await el.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))})).toBe(true);
 }
 const cards=page.locator('.as-card');
 if(await cards.count()) {
  const card=(await cards.first().locator('.hcard').boundingBox())!;
  const play=(await cards.first().getByTestId('play-reaction').boundingBox())!;
  expect(play.x).toBeGreaterThanOrEqual(card.x+card.width);
  expect(play.y).toBeLessThan(card.y+card.height);
 }
 await expect(page.getByTestId('reaction-memo')).toHaveCount(0);
 await expect(page.locator('.as-count')).toContainText(/Порох .* из 8/);
 await page.screenshot({path:`docs/screenshots/phone-2/reactions-${win.width}x${win.height}.png`});
 await page.locator('body').evaluate(e=>e.setAttribute('data-captured','1'));
 console.log('ALARM',win,await cards.count());
}
const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
try {
 for(const viewport of [{width:430,height:740},{width:390,height:844},{width:1920,height:944}]) {
 const page=await browser.newPage({viewport,hasTouch:viewport.width<700,isMobile:viewport.width<700,baseURL:'http://127.0.0.1:4173/bortom-k-bortu/'});
 await startDuo(page); await toCompany(page);
 if(viewport.width<700) {
  const gaps=await page.getByTestId('plank-Г').evaluate(e=>{
   const r=[...e.querySelectorAll('.track-row2 > .track, .badge.souls')].map(n=>n.getBoundingClientRect());
   return r.slice(1).map((n,i)=>n.left-r[i].right);
  });
  console.log('SCALES',viewport,gaps);expect(gaps.every(g=>g>=5.9)).toBe(true);
  await page.screenshot({path:`docs/screenshots/phone-2/scales-${viewport.width}x${viewport.height}.png`});
 }
 if(viewport.width!==390) {
  await expect(page.getByTestId('turn-summary')).toHaveCount(0);
  await expect(page.getByTestId('middle-info')).toContainText('Последнее:');
  await page.screenshot({path:`docs/screenshots/phone-2/summary-${viewport.width}x${viewport.height}.png`});
  await page.getByTestId('middle-info').click();await expect(page.getByTestId('log-sheet')).toBeVisible();
 }
 await page.close();
 }
}finally{await browser.close()}
