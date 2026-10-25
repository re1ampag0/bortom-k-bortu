// Geometry probes for browser panels and keyboard, not tests or game actions.
import{chromium}from'@playwright/test';import{readFileSync,writeFileSync}from'node:fs';
const record=JSON.parse(readFileSync('docs/screenshots/game-scale/scenario.json')),browser=await chromium.launch({executablePath:'/usr/bin/chromium'}),results=[];
try{for(const query of ['','&gamescale=0','&menuscale=0']){
 const page=await browser.newPage({viewport:{width:412,height:915},deviceScaleFactor:3,isMobile:true});await page.addInitScript(record=>{localStorage.clear();localStorage.setItem('bortom-k-bortu.save',JSON.stringify(record));},record);
 await page.goto('http://127.0.0.1:5362/bortom-k-bortu/?speed=instant'+query);await page.getByTestId('resume-go').click();await page.getByTestId('game').waitFor();await page.waitForTimeout(500);
 const read=()=>page.evaluate(()=>({inner:innerHeight,visual:visualViewport.height,stage:document.getElementById('stage').getAttribute('style'),gameHeight:document.querySelector('.game').getBoundingClientRect().height,barBottom:document.querySelector('.bottom-bar').getBoundingClientRect().bottom}));
 await page.evaluate(()=>{Object.defineProperty(visualViewport,'height',{configurable:true,get:()=>780});visualViewport.dispatchEvent(new Event('resize'));});await page.waitForTimeout(250);const panel=await read();
 await page.evaluate(()=>{delete visualViewport.height;visualViewport.dispatchEvent(new Event('resize'));});await page.waitForTimeout(250);
 if(!query){
  await page.locator('.bottom-bar').getByRole('button',{name:'Правила',exact:true}).click();
  const toggle=page.locator('.menu-rules-search-toggle');if(await toggle.isVisible())await toggle.click();
  const input=page.locator('.menu-rules-search input');await input.focus();const font=await input.evaluate(e=>getComputedStyle(e).fontSize),before=await read();await page.setViewportSize({width:412,height:615});await page.waitForTimeout(250);const keyboard=await read();await input.blur();await page.setViewportSize({width:412,height:915});await page.waitForTimeout(250);results.push({query,panel,inputFont:font,before,keyboard,recovered:await read()});
 }else results.push({query,panel});await page.close();
}}finally{await browser.close();writeFileSync('docs/screenshots/game-scale/viewport.json',JSON.stringify(results,null,2));}console.log(JSON.stringify(results));
