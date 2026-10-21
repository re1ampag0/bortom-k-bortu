// Closing ui-4: use the existing real-Game fixtures; verify the heading/note and their geometry.
import {chromium,expect} from '@playwright/test';
import {createServer} from 'vite';
import {writeFileSync} from 'node:fs';
const server=await createServer({server:{host:'127.0.0.1',port:5174,strictPort:true}});
await server.listen();const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
const results=[];
try{
 for(const [panel,title] of [['confirm','Закончить ход?'],['card','Плотник'],['choice','Компас Джека'],['plans','Планы']]){
  for(const viewport of [{width:430,height:680},{width:430,height:740},{width:1920,height:944}]){
   const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(`http://127.0.0.1:5174/bortom-k-bortu/scripts/ui-4/panel-preview.html?panel=${panel}&speed=instant`);
   await page.evaluate(()=>document.fonts.ready);
   if(panel==='card'){await page.locator('.hand-cards > .hcard').first().click();await page.getByTestId(viewport.width<701?'lift-play':'detail-play').click();}
   if(panel==='confirm'||panel==='plans')await page.getByTestId('end-turn').filter({visible:true}).click();
   const sheet=page.getByTestId(panel==='confirm'?'confirm-end':`${panel}-panel`);
   await expect(sheet.locator('.cs-title')).toHaveText(title);await page.waitForTimeout(300);
   const note=await sheet.locator('.ds-note').textContent();
   if(panel==='confirm')expect(note).toMatch(/^Залп не дан: «Жемчужина», «Месть»\. В Трюме \d+ Пороха\.$/);
   if(panel==='card')expect(note).toBe('→ «Жемчужина»: восстановить 2 клетки');
   const geometry=await sheet.evaluate(e=>{
    const heading=e.querySelector('.cs-title'),h=heading.getBoundingClientRect(),hold=e.querySelector('.cs-hold').getBoundingClientRect(),n=e.querySelector('.ds-note').getBoundingClientRect();
    const range=document.createRange();range.selectNodeContents(heading);
    return{heading:h.toJSON(),hold:hold.toJSON(),note:n.toJSON(),text:[...range.getClientRects()].map(r=>r.toJSON()),sheet:e.getBoundingClientRect().toJSON()};
   });
   expect(geometry.heading.right).toBeLessThanOrEqual(geometry.hold.left+1);
   expect(geometry.note.top).toBeGreaterThanOrEqual(geometry.heading.bottom-1);
   expect(geometry.sheet.left).toBeGreaterThanOrEqual(-1);expect(geometry.sheet.right).toBeLessThanOrEqual(viewport.width+1);
   for(const r of geometry.text){expect(r.left).toBeGreaterThanOrEqual(geometry.heading.left-1);expect(r.right).toBeLessThanOrEqual(geometry.heading.right+1);}
   expect(errors).toEqual([]);
   const file=`close-${panel}-${viewport.width}x${viewport.height}.png`;
   await page.screenshot({path:`docs/screenshots/ui-4/${file}`});results.push({panel,viewport,title,note,geometry,file});await page.close();
  }
 }
 writeFileSync('docs/screenshots/ui-4/close-headings.json',JSON.stringify(results,null,2)+'\n');
 console.log('PASS 4 sheets × 3 sizes: short headings, separate notes, full text inside brass, no Hold overlap');
}finally{await browser.close();await server.close()}
