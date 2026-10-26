// Screenshot/report helper, not an e2e test. Only real UI handlers and saved legal actions.
import {chromium} from '@playwright/test';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
const root='docs/screenshots/game-phone-fix',fixtures=JSON.parse(readFileSync(`${root}/fixtures.json`)),rows=[];
const phones=[[360,600],[390,640],[390,700],[412,780],[375,667],[320,568]],laptops=[[1366,660],[1920,969]];
const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
async function shot(p,dir,name){
 await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});
 await p.mouse.move(0,0);await p.clock.runFor(400);
 await p.evaluate(()=>{document.getAnimations().forEach(a=>{try{if(a.effect?.getTiming().iterations===Infinity){a.pause();a.currentTime=0}else a.finish();}catch{}});scrollTo(0,0);document.querySelectorAll('#root,#stage,.game,.board,.board-bottom,.log-list,.log-col,.log-paper').forEach(e=>e.scrollTop=0)});
 await p.screenshot({path:`${dir}/${name}.png`,scale:'css'});
 rows.push({size:dir.split('/').pop(),screen:name,...await p.evaluate(()=>{
 const rect=e=>e?.getBoundingClientRect().toJSON(),overlap=(a,b)=>a&&b&&a.width&&a.height&&b.width&&b.height&&a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
 const game=document.querySelector('.game'),lamp=document.querySelector('[data-piece=lantern]'),lr=lamp?.getBoundingClientRect(),light=document.querySelector('.phone-deck-warm'),bar=document.querySelector('.bottom-bar');
 return {viewport:[innerWidth,innerHeight],stage:document.querySelector('#stage').getAttribute('style'),game:rect(game),bar:rect(bar),horizontalScroll:document.documentElement.scrollWidth>innerWidth,
 lamp:rect(lamp),light:!!light&&getComputedStyle(light).display!=='none',lightWithoutLamp:!!light&&getComputedStyle(light).display!=='none'&&!lr?.width,
 lampOverlaps:[...document.querySelectorAll('.board-bottom .hold-label,.board-bottom .powder-dots,.board-bottom .hold-n,.regroup,.phone-hand-label,.deck-info')].filter(e=>overlap(lr,e.getBoundingClientRect())).map(e=>e.className),
 cards:[...document.querySelectorAll('.hand-cards:not(.lift-host)>.hcard')].map(e=>({r:rect(e),type:rect(e.querySelector('.hcard-head')),name:rect(e.querySelector('.hcard-name')),big:rect(e.querySelector('.hcard-big'))})),
 buttons:[...document.querySelectorAll('.plank button,.decision-dock button,.alarm-sheet button,.bottom-bar button')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height}).map(e=>{const r=e.getBoundingClientRect();return{id:e.dataset.testid,text:e.textContent.trim().slice(0,45),disabled:e.getAttribute('aria-disabled')==='true'||e.disabled,r:rect(e),hit:e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}})};
 })});console.log(dir.split('/').pop(),name);
}
async function open(w,h,f,variant='sheet'){
 const p=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:w<=700?3:2,isMobile:w<=700,hasTouch:w<=700});
 p.setDefaultTimeout(7000);p.on('pageerror',e=>console.log('Error page:',String(e)));
 await p.clock.install({time:new Date('2026-10-25T12:00:00Z')});await p.clock.pauseAt(new Date('2026-10-25T12:00:10Z'));
 await p.addInitScript(({record,variant})=>{localStorage.clear();localStorage.setItem('bortom-k-bortu.save',JSON.stringify(record));localStorage.setItem('bortom-k-bortu.settings',JSON.stringify({hints:true,view:{play:variant}}));},{record:f.record,variant});
 await p.goto('http://127.0.0.1:5363/bortom-k-bortu/?speed=instant');await p.clock.runFor(1500);await click(p,'[data-testid=resume-go]');return p;
}
async function click(p,selector){await p.locator(selector).filter({visible:true}).first().evaluate(e=>e.click());await p.clock.runFor(600);}
async function captureSize(w,h){
 if(process.env.SIZES&&!process.env.SIZES.split(',').includes(`${w}x${h}`))return;
 const dir=`${root}/${w}x${h}`;mkdirSync(dir,{recursive:true});
 const work=async(name,fn)=>{let p;try{p=await fn();}catch(e){rows.push({size:`${w}x${h}`,screen:name,error:String(e).split('Call log')[0]});console.log('Error',w,h,name,String(e).split('\n')[0]);}finally{await p?.close();}};
 if(w<=700&&(!process.env.SCENES||process.env.SCENES.includes('table')))await work('table/reaction',async()=>{const p=await open(w,h,fixtures.table);try{await shot(p,dir,'table');await click(p,'[data-testid="volley-Ж"]');await click(p,'[data-testid="plate-И"]');await click(p,'[data-testid=fire]');await shot(p,dir,'reaction');}finally{await p.close()}});
 for(const variant of ['sheet','scroll'])for(const kind of ['order',...(w>700?['repair','legend','finish']:[]),'plans']){
 const name=`${kind}-${variant}`;if(process.env.SCENES&&!process.env.SCENES.split(',').includes(kind))continue;
 await work(name,async()=>{const f=fixtures[kind]??fixtures.table,p=await open(w,h,f,variant);try{
  if(kind==='order'||kind==='repair'){
   if(f.seat!=='Ж')await click(p,`.tabs [role=tab]:has-text("${f.seat==='М'?'Месть':'Индевор'}")`);
   await click(p,`.hand-cards [data-card="${f.code}"]`);
   await click(p,w<=700?'[data-testid=lift-play]':'[data-testid=detail-play]');
   await shot(p,dir,name+'-0');
   const target=p.locator('.plank.aimable').first();if(await target.count()){await target.evaluate(e=>e.click());await p.clock.runFor(500);}
  }else if(kind==='legend'){
   await click(p,w<=700?`[data-testid="star-${f.seat}"]`:`.plank[data-ship="${f.seat}"] .legend-medal`);await p.getByTestId('card-detail').getByRole('button',{name:'Разыграть Легенду',exact:true}).evaluate(e=>e.click());await p.clock.runFor(600);
  }else{
   await click(p,'[data-testid=end-turn]');
   if(kind==='plans'){if(await p.getByTestId('confirm-end').isVisible())await click(p,'[data-testid=confirm-end] [data-testid=confirm-yes]');await p.getByTestId('plans-panel').waitFor({state:'visible'});const card=p.getByTestId('plans-panel').locator('.choice-cards .hcard').first();await card.evaluate(e=>e.click());await p.clock.runFor(300);}
  }
  await shot(p,dir,name);
 }finally{await p.close()}});
 }
}
try{const sizes=[...phones,...laptops];for(let i=0;i<sizes.length;i+=2)await Promise.all(sizes.slice(i,i+2).map(([w,h])=>captureSize(w,h)));}finally{const path=`${root}/frames.json`,old=existsSync(path)?JSON.parse(readFileSync(path)):[],keys=new Set(rows.map(r=>r.size+'|'+r.screen));writeFileSync(path,JSON.stringify([...old.filter(r=>!keys.has(r.size+'|'+r.screen)),...rows],null,2));await browser.close();}
