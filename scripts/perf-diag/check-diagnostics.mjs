// Short UI check against an ordinary production build. No performance conclusions from headless Chromium.
import {chromium,expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
try {
 const context=await browser.newContext({viewport:{width:430,height:740},isMobile:true,hasTouch:true});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/bortom-k-bortu/?perf=1');
 await page.evaluate(()=>localStorage.setItem('bortom-k-bortu.settings',JSON.stringify({speed:'instant',effects:'rich',hints:false})));
 await page.reload();
 for(const id of ['quick-duo','prep-start','placement-done','curtain-ready','placement-done','curtain-ready'])await page.getByTestId(id).click();
 const panel=page.getByTestId('perf-panel');await expect(panel).toBeVisible();
 const settings=await page.evaluate(()=>localStorage.getItem('bortom-k-bortu.settings'));
 await panel.getByRole('button',{name:'Части',exact:true}).click();
 const keys=['weather','ripples','decor','light','particles','labels','filters','planks','background','simple','css'];
 for(const key of keys){await page.getByTestId('perf-'+key).check();await expect(page.getByTestId('game')).toHaveClass(new RegExp('perf-off-'+key));}
 await expect(page.getByTestId('game')).toHaveClass(/fx-simple/);
 expect(await page.evaluate(()=>localStorage.getItem('bortom-k-bortu.settings'))).toBe(settings);
 const ids=await page.locator('.perf-parts input').count();expect(ids).toBe(11);
 await page.getByTestId('perf-simple').uncheck();await expect(page.getByTestId('game')).not.toHaveClass(/fx-simple/);
 await page.getByTestId('perf-simple').check();
 await panel.getByRole('button',{name:'Части',exact:true}).click();
 // Synthetic visible DOM changes in the real layer exercise peak recording; game state is untouched.
 await panel.getByRole('button',{name:'Записать 20 с',exact:true}).click();
 await page.locator('.fx-layer').evaluate(e=>{for(let i=0;i<5;i++){const n=document.createElement('i');n.className='perf-check-node';e.appendChild(n)}});
 const result=panel.getByRole('textbox',{name:'Итог диагностики'});await expect(result).toBeVisible({timeout:25000});
 const summary=await result.inputValue();expect(summary).toMatch(/кадров\/с ср\. \d/);expect(summary).toContain('экран 430×740×1');expect(summary).toMatch(/узлов в слое эффектов \(пик\): [5-9]\d*/);
 await panel.getByRole('button',{name:'Копировать',exact:true}).click();await expect(panel.getByRole('status')).toContainText(/Скопировано|скопируйте/);
 await page.screenshot({path:'docs/screenshots/perf-diag/diagnostics-430x740.png'});
 await page.locator('.perf-check-node').evaluateAll(es=>es.forEach(e=>e.remove()));
 await page.reload();await page.getByTestId('resume-go').click();
 if(await page.getByTestId('curtain-ready').isVisible())await page.getByTestId('curtain-ready').click();
 await expect(page.getByTestId('game')).toHaveClass(/perf-off-simple/);
 await page.goto('http://127.0.0.1:4173/bortom-k-bortu/?perf=0');await page.getByTestId('resume-go').click();
 if(await page.getByTestId('curtain-ready').isVisible())await page.getByTestId('curtain-ready').click();
 await expect(page.getByTestId('perf-panel')).toHaveCount(0);await expect(page.getByTestId('game')).not.toHaveClass(/perf-off-/);
 expect(await page.evaluate(()=>localStorage.getItem('bortom-k-bortu.settings'))).toBe(settings);
 expect(errors).toEqual([]);
 writeFileSync('docs/screenshots/perf-diag/diagnostics-check.json',JSON.stringify({production:true,ids,summary,settingsUnchanged:true,persisted:true,disabled:true,errors},null,2)+'\n');
 console.log('PASS production build: 11 switches, settings preserved, 20s recording/peak/copy, persistence, perf=0');
} finally {await browser.close()}
