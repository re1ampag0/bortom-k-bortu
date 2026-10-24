// Short frame script, not an e2e suite. The game supplies all values; artboards supply the comparison artwork.
import {chromium,expect} from '@playwright/test';
import {PNG} from 'pngjs';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
let referenceFonts='';
for(const [pkg,variants]of Object.entries({'alegreya':['500','700','400-italic'],'alegreya-sc':['500','700'],'alegreya-sans':['400','500','700'],'old-standard-tt':['400','700']}))for(const subset of ['latin','cyrillic'])for(const variant of variants){
 const path=require.resolve(`@fontsource/${pkg}/${subset}-${variant}.css`);
 referenceFonts+=readFileSync(path,'utf8').replace(/url\(([^)]+)\)/g,(_m,file)=>`url(data:font/woff2;base64,${readFileSync(resolve(dirname(path),file)).toString('base64')})`);
}
const phase=Number(process.argv[3]??0);
const stage=process.argv[2]??'stage1',url=process.env.SHIP_URL??'http://127.0.0.1:5321/bortom-k-bortu/';
const out=`docs/screenshots/ship-window/${stage}`;mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium'}),proof=[];
try{for(const [w,h]of [[1366,660],[1920,944],...['stage3','final'].includes(stage)?[[430,740]]:[]]){
 if(stage==='final-motion'&&w!==1366)continue;
 const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:1}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url+'?seed=1&speed=instant&perf=0');
 for(const id of ['quick-duo','prep-start','placement-done','curtain-ready','placement-done','curtain-ready'])await page.getByTestId(id).click();
 await page.evaluate(()=>document.fonts.ready);
 for(const [code,name]of Object.entries({'Ж':'Main','М':'Revenge','И':'Endeavour','Г':'Dutchman'})){
  await page.getByTestId('plank-'+code).locator('.plank-head').click({position:{x:8,y:8}});
  const sheet=page.getByTestId('ship-sheet');await expect(sheet).toBeVisible();await page.evaluate(()=>document.fonts.ready);
  if(stage!=='stage1'){await page.waitForSelector('.sw-native-scene[data-ready]');await expect(page.locator('.sw-feature-frames[data-ready]')).toHaveCount(2);await page.evaluate(phase=>{document.querySelector('.sw-native-scene').captureScene?.(phase);for(const a of document.querySelector('[data-testid=ship-sheet]').getAnimations({subtree:true})){a.pause();a.currentTime=phase;}},phase);}
  await page.screenshot({path:`${out}/${name}-${w}x${h}-game.png`});
  if(w<=700){const height=await sheet.evaluate(e=>e.scrollHeight);await page.setViewportSize({width:w,height});await page.locator('.ship-window-frame').evaluate(e=>e.scrollTop=0);await page.evaluate(phase=>{document.querySelector('.sw-native-scene').captureScene?.(phase);for(const a of document.querySelector('[data-testid=ship-sheet]').getAnimations({subtree:true})){a.pause();a.currentTime=phase;}},phase);await sheet.screenshot({path:`${out}/${name}-${w}x${h}-window.png`});await page.setViewportSize({width:w,height:h});}
  else await sheet.screenshot({path:`${out}/${name}-${w}x${h}-window.png`});
  if(w<=700){await sheet.getByTestId('ship-discard').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${name}-${w}x${h}-bottom.png`});await page.locator('.ship-window-frame').evaluate(e=>e.scrollTop=0);}
  const record=await sheet.evaluate(el=>{const b=(innerWidth<=700?el.parentElement:el).getBoundingClientRect();return {ship:el.getAttribute('data-ship-window'),box:{x:b.x,y:b.y,w:b.width,h:b.height},text:el.textContent,animations:el.getAnimations({subtree:true}).map(a=>({tag:a.effect.target.tagName,properties:[...new Set(a.effect.getKeyframes().flatMap(f=>Object.keys(f)))].filter(k=>!['offset','computedOffset','easing','composite'].includes(k))})),overflow:[el.scrollWidth,el.clientWidth,el.scrollHeight,el.clientHeight]}});
  if(record.box.x<0||record.box.y<0||record.box.x+record.box.w>w+.5||record.box.y+record.box.h>h+.5)throw Error('Window clipped '+name);
  proof.push({viewport:[w,h],...record,errors:[...errors]});
  if(errors.length)throw Error(errors.join('\n'));
  const ref=await browser.newPage({viewport:{width:w<=700?390:920,height:w<=700?1360:640},deviceScaleFactor:1});
  await ref.route('**/bortom-k-bortu/node_modules/**',route=>route.continue({url:route.request().url().replace('http://127.0.0.1:5319',new URL(url).origin)}));
  await ref.goto('http://127.0.0.1:5319/artboards/'+(w<=700?'Phone':name)+'.dc.html');await ref.addStyleTag({content:referenceFonts});await ref.evaluate(async()=>{await document.fonts.load('500 13px \"Alegreya SC\"','Корпус Паруса ABC123');await document.fonts.ready;});
  await ref.evaluate(phase=>{for(const a of document.getAnimations()){a.pause();a.currentTime=phase;}},phase);
  await ref.screenshot({path:`${out}/${name}-${w}x${h}-mockup.png`});await ref.close();
  const a=PNG.sync.read(readFileSync(`${out}/${name}-${w}x${h}-mockup.png`)),b=PNG.sync.read(readFileSync(`${out}/${name}-${w}x${h}-window.png`)),c=new PNG({width:a.width+b.width+8,height:Math.max(a.height,b.height),fill:true});
  PNG.bitblt(a,c,0,0,a.width,a.height,0,0);PNG.bitblt(b,c,0,0,b.width,b.height,a.width+8,0);
  writeFileSync(`${out}/${name}-${w}x${h}-comparison.png`,PNG.sync.write(c));
  await sheet.getByRole('button',{name:'Закрыть',exact:true}).click();
 }
 await page.close();
}}finally{await browser.close();}
writeFileSync(`${out}/proof.json`,JSON.stringify(proof,null,1)+'\n');console.log('frames:',proof.length,'; no clipping or page errors');
