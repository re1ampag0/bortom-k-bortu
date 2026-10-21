import {expect,test} from '@playwright/test';

test('Tortuga: the oak sheet counts cards and submits the choice', async ({page}) => {
  await page.setViewportSize({width:430,height:740});
  // Found by scripts/ui-4/find-tortuga.ts: real initial pending.kind === 'tortuga'.
  await page.goto('?seed=26&speed=instant');
  for(const id of ['quick-duo','prep-start','placement-done','curtain-ready','placement-done','curtain-ready'])await page.getByTestId(id).click();
  const sheet=page.getByTestId('tortuga-panel');
  await expect(sheet).toHaveClass(/decision-sheet/);
  // Before first-turn income the Pirates cannot spend Powder: skip, then the Company can choose.
  await expect(sheet.getByRole('button',{name:'Увеличить',exact:true}).first()).toBeDisabled();
  await sheet.getByRole('button',{name:'Не брать',exact:true}).click();
  await page.getByTestId('curtain-ready').click();
  const colors=await sheet.locator('.ds-ship').evaluateAll(es=>es.map(e=>({label:getComputedStyle(e).backgroundImage,head:getComputedStyle(document.querySelector(`[data-ship="${e.getAttribute('data-ship')}"] .plank-head`)!).backgroundImage})));
  for(const c of colors)expect(c.label).toBe(c.head);
  const main=sheet.locator('.oak-btn');
  await expect(main).toHaveAttribute('aria-disabled','true');
  const plus=sheet.getByRole('button',{name:'Увеличить',exact:true}).first();
  await plus.click();
  await expect(main.locator('.oak-pan b')).toContainText('Взять 1');
  await expect(main).toHaveAttribute('aria-disabled','false');
  expect(await page.getByTestId('game').evaluate(e=>e.scrollLeft)).toBe(0);
  await sheet.getByRole('button',{name:'Уменьшить',exact:true}).first().click();
  await expect(main).toHaveAttribute('aria-disabled','true');
  await plus.click();await main.click();
  await expect(sheet).toHaveCount(0);
});
