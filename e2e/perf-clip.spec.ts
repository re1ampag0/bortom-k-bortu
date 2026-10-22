import {test,expect} from '@playwright/test';

test('perf: the five worst Armada frames keep their stages and the copied text',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('?seed=1&speed=fast&hints=0&perf=1&particleProbe=0');
  for(const id of ['quick-bots','pick-company','prep-start','placement-done'])await page.getByTestId(id).click();
  let quiet=0;
  await expect.poll(async()=>{
    const ready=await page.evaluate(()=>{
      const g=document.querySelector('.game'),b=Array.from(document.querySelectorAll('[data-testid="end-turn"]')).find(e=>e.getClientRects().length);
      return !!g&&!g.hasAttribute('data-fx-busy')&&!!b&&b.getAttribute('aria-disabled')!=='true';
    });
    if(!ready){quiet=0;return false;}quiet ||= Date.now();return Date.now()-quiet>1000;
  },{timeout:60000}).toBe(true);
  await page.getByTestId('star-И').filter({visible:true}).first().click();
  await page.getByRole('button',{name:'Разыграть Легенду',exact:true}).click();
  await page.getByTestId('legend-confirm').getByRole('button',{name:/^Сыграть/}).click();
  await expect(page.getByTestId('perf-clip')).toContainText('legend',{timeout:60000});
  await page.getByTestId('perf-frames-toggle').click();
  const rows=page.getByTestId('perf-worst-frames').locator('li');
  await expect(rows).toHaveCount(5);
  for(const row of await rows.all())await expect(row).toContainText(/мс; \+[\d.]+ с;.+нажатие:/);
  const value=await page.getByRole('textbox',{name:'Числа последнего клипа',includeHidden:true}).inputValue();
  expect(value).toContain('5 худших интервалов rAF');
  expect(value.match(/^\d\. /gm)).toHaveLength(5);
  expect(value).toContain('legend');
  expect(value).toContain('рендеры Game: 0');
  expect(value).toMatch(/legendIntro|gunFire|вставка|renderWith/);
  await expect(page.getByTestId('perf-clip-copy')).toBeVisible();
  // The normal build has no diagnostic readout when disabled, even after using it.
  await page.goto('?seed=1&speed=fast&hints=0&perf=0');
  await page.getByTestId('quick-bots').click();
  await page.getByTestId('prep-start').click();await page.getByTestId('placement-done').click();
  await expect(page.getByTestId('game')).toBeVisible();
  await expect(page.getByTestId('perf-panel')).toHaveCount(0);
});
