// Deterministic frame helper, not a test: normal saved game; no game rules or DOM layout overrides.
import {chromium} from '@playwright/test';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {audit} from './audit.mjs';
const root=process.env.OUTPUT??'docs/screenshots/game-scale',requested=process.env.PHASE??'both';
const record=JSON.parse(readFileSync('docs/screenshots/game-scale/scenario.json'));
const sizes=[[1366,660],[390,844],[430,932],[430,740],[430,680],[390,664],[320,568],[360,640],[360,740],[375,667],[412,915],[412,780],[667,375],[844,390],[768,1024],[1024,768],[1024,650],[1280,600],[1366,625],[1536,730],[1920,969],[2560,1300]];
const browser=await chromium.launch({executablePath:process.env.GAME_SCALE_CHROMIUM??'/usr/bin/chromium'});
try{for(const phase of requested==='both'?['before','after']:[requested]){
 const records=[];
 for(const [w,h]of sizes){
  if(process.env.SIZES&&!process.env.SIZES.split(',').includes(`${w}x${h}`))continue;
  const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:w<=1100?3:1,isMobile:w<=1100,hasTouch:w<=1100});
  page.setDefaultTimeout(12000);
  await page.clock.install({time:new Date('2026-10-25T12:00:00Z')});
  await page.clock.pauseAt(new Date('2026-10-25T12:00:10Z'));
  await page.addInitScript(record=>{localStorage.clear();localStorage.setItem('bortom-k-bortu.save',JSON.stringify(record));},record);
  const dir=`${root}/${phase}/${w}x${h}`;mkdirSync(dir,{recursive:true});
  const tick=async(ms=1000)=>{await page.clock.runFor(ms);await page.waitForTimeout(30);};
  const press=async selector=>{await page.locator(selector).first().evaluate(e=>e.click());await tick();};
  const shot=async name=>{
   await page.mouse.move(0,0);
   await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});
   for(let i=0;i<2;i++){
    await page.evaluate(()=>{document.querySelectorAll('svg').forEach(e=>{e.pauseAnimations?.();e.setCurrentTime?.(0);});document.querySelectorAll('.sw-native-scene').forEach(e=>e.captureScene?.(0));document.getAnimations().forEach(a=>{try{const t=a.effect?.getComputedTiming();if(t?.iterations===Infinity){a.pause();a.currentTime=0;}else a.finish();try{a.commitStyles();a.cancel();}catch{}}catch{}});window.dispatchEvent(new Event('resize'));});
    await tick(50);
   }
   await page.evaluate(()=>{scrollTo(0,0);document.querySelectorAll('#root,#stage,.game,.board,.board-bottom').forEach(e=>e.scrollTop=0);});
   await page.screenshot({path:`${dir}/${name}.png`,scale:'css',animations:'allow'});
   records.push({size:`${w}x${h}`,screen:name,engine:browser.version(),dpr:w<=1100?3:1,...await page.evaluate(audit),...await page.evaluate(()=>({horizontalScroll:document.documentElement.scrollWidth>innerWidth,stage:document.getElementById('stage').getAttribute('style'),buttons:[...document.querySelectorAll('.game button')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height;}).map(e=>{const r=e.getBoundingClientRect();return{id:e.dataset.testid,disabled:e.getAttribute('aria-disabled')==='true'||e.disabled===true,title:e.getAttribute('title'),text:e.textContent.trim().slice(0,40),x:r.x,y:r.y,w:r.width,h:r.height,hit:e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};})}))});
  };
  try{
   await page.goto(`http://127.0.0.1:${phase==='before'||process.env.MAIN_ONLY==='1'?5361:5362}/bortom-k-bortu/?speed=instant${phase==='disabled'?'&gamescale=0':''}`);
   await page.evaluate(async()=>{await Promise.all([...document.fonts].map(f=>f.load().catch(()=>{})));await document.fonts.ready;});await tick();
   await press('[data-testid=resume-go]');await tick(2000);await shot('table');
   if(await page.locator('.game').evaluate(e=>e.hasAttribute('data-game-hand-scroll'))){
    await page.locator('.hand-cards').first().evaluate(e=>e.scrollTop=e.scrollHeight);await tick(50);await shot('hand-bottom');await page.locator('.hand-cards').first().evaluate(e=>e.scrollTop=0);await tick(50);
   }
   const log=page.locator('.bottom-bar').getByRole('button',{name:'Журнал',exact:true});
   if(await log.isVisible()){await log.evaluate(e=>e.click());await tick();await shot('log');await page.getByTestId('log-sheet').getByRole('button',{name:'Закрыть',exact:true}).evaluate(e=>e.click());await tick();}else await shot('log');
   await press('[data-testid="volley-Ж"]');await press('[data-testid="plate-И"]');await press('[data-testid=fire]');await tick(2000);await shot('reaction');
   console.log(phase,w,h,'captured');
  }catch(e){records.push({size:`${w}x${h}`,error:String(e).split('Call log')[0]});console.log('Error',phase,w,h,String(e).split('\n')[0]);}
  await page.close();
  const path=`${root}/${phase}-frames.json`,old=existsSync(path)?JSON.parse(readFileSync(path)):[],keys=new Set(records.map(r=>r.size+'|'+r.screen));writeFileSync(path,JSON.stringify([...old.filter(r=>!r.error&&!keys.has(r.size+'|'+r.screen)),...records],null,2));
 }
}}finally{await browser.close();}
