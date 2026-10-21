import {chromium,expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const scene=process.argv[2]??'plain',label=process.argv[3]??'04-plate';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
try{for(const viewport of [{width:430,height:680},{width:430,height:740},{width:1920,height:944}]){
 const page=await browser.newPage({viewport});await page.goto(`http://127.0.0.1:4173/bortom-k-bortu/?fxScene=${scene}&speed=slow${scene==='card'?'&strip=1':''}`);
 if(label.includes('tight') && viewport.width<700) await page.addStyleTag({content:'.game .sea-table { grid-template-rows: auto 64px auto !important; }'});
 const selector=scene==='card'?'.fx-layer .flyc':'.fx-layer > .plate';
 await page.waitForSelector(selector);
 if(label.includes('tight') && viewport.width<700) await page.waitForSelector('.plate.compact');await page.waitForTimeout(scene==='card'?950:500);
 const r=await page.evaluate(sel=>{const box=s=>document.querySelector(s)?.getBoundingClientRect().toJSON();return {effect:box(sel),top:box('.planks.top'),bottom:box('.planks.bottom'),info:box('[data-testid="middle-info"]')};},selector);
 if(scene!=='card'){expect(r.effect.y).toBeGreaterThanOrEqual(r.top.bottom);expect(r.effect.bottom).toBeLessThanOrEqual(r.bottom.y);}
 else if(r.info){expect(r.effect.bottom).toBeLessThanOrEqual(r.info.y);}
 writeFileSync(`docs/screenshots/ui-4/${label}-${viewport.width}x${viewport.height}.json`,JSON.stringify(r,null,2)+'\n');
 await page.screenshot({path:`docs/screenshots/ui-4/${label}-${viewport.width}x${viewport.height}.png`});console.log('FRAME',viewport);await page.close();
}}finally{await browser.close()}
