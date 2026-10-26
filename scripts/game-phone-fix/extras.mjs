import {chromium} from '@playwright/test';import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const root='docs/screenshots/game-phone-fix',f=JSON.parse(readFileSync(root+'/fixtures.json')),out=[],browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
const freeze=async p=>{await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));document.getAnimations().forEach(a=>{try{if(a.effect?.getTiming().iterations===Infinity){a.pause();a.currentTime=0}else a.finish()}catch{}})});await p.clock.runFor(100);};
try{
for(const [w,h]of [[1366,660],[390,844]]){
 const dir=`${root}/${w}x${h}`;mkdirSync(dir,{recursive:true});const p=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:w<=700?3:2});
 await p.clock.install({time:new Date('2026-10-25T12:00:00Z')});await p.clock.pauseAt(new Date('2026-10-25T12:00:10Z'));
 await p.addInitScript(r=>{localStorage.clear();localStorage.setItem('bortom-k-bortu.save',JSON.stringify(r))},f.captain.record);
 await p.goto('http://127.0.0.1:5363/bortom-k-bortu/?speed=instant');await p.clock.runFor(1000);await p.getByTestId('resume-go').evaluate(e=>e.click());await p.clock.runFor(1800);
 if(w<=700)await p.locator('.plank[data-ship="М"]').evaluate(e=>e.click());else await p.getByRole('tab',{name:/Месть/}).evaluate(e=>e.click());await p.clock.runFor(600);await freeze(p);
 const geometry=()=>Object.fromEntries([...document.querySelectorAll('.plank,.hand-cards>.hcard,.sea-table,.board-bottom>.team-row,.phone-hand-label')].map((e,i)=>[i,e.getBoundingClientRect().toJSON()]));
 const before=await p.evaluate(geometry),note=await p.getByTestId('captain-note').boundingBox();await p.screenshot({path:`${dir}/captain-with.png`,scale:'css'});
 await p.getByTestId('captain-note').evaluate(e=>e.style.display='none');await freeze(p);const after=await p.evaluate(geometry);await p.screenshot({path:`${dir}/captain-without.png`,scale:'css'});
 out.push({size:`${w}x${h}`,captainNote:note,geometryEqual:JSON.stringify(before)===JSON.stringify(after)});await p.close();
}
for(const w of [320,360,390,430]){
 const p=await browser.newPage({viewport:{width:w,height:700},deviceScaleFactor:3});await p.addInitScript(r=>{localStorage.clear();localStorage.setItem('bortom-k-bortu.save',JSON.stringify(r))},f.table.record);await p.goto('http://127.0.0.1:5363/bortom-k-bortu/?speed=instant');await p.getByTestId('resume-go').click();await p.waitForTimeout(350);
 for(const n of [0,1,5])out.push({size:`${w}x700`,souls:n,...await p.evaluate(n=>{
  const b=document.querySelector('[data-testid="souls-Г"]');for(const node of b.childNodes)if(node.nodeType===3&&node.textContent.includes('/'))node.textContent=` ${n}/5`;
  const r=b.getBoundingClientRect(),tracks=[...b.closest('.plank-body').querySelectorAll('.track-row2>.track')].map(e=>e.getBoundingClientRect());
  return{rect:r.toJSON(),minimumGap:Math.min(...tracks.map(t=>r.left-t.right)),overlap:tracks.some(t=>r.left<t.right&&r.right>t.left&&r.top<t.bottom&&r.bottom>t.top),header:r.bottom<=b.closest('.plank').querySelector('.plank-head').getBoundingClientRect().bottom+1,hit:b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),headerOverlaps:[...b.closest('.plank').querySelectorAll('.plank-name,.star,.hand-count')].filter(e=>{const q=e.getBoundingClientRect();return q.width&&q.height&&r.left<q.right&&r.right>q.left&&r.top<q.bottom&&r.bottom>q.top}).map(e=>e.className)};
 },n)});await p.close();
}
const p=await browser.newPage();await p.addInitScript(()=>localStorage.setItem('bortom-perf','1'));await p.goto('http://127.0.0.1:5363/bortom-k-bortu/');await p.waitForTimeout(200);out.push({diagnosticLegacyFlag:await p.evaluate(()=>localStorage.getItem('bortom-perf'))});await p.close();
}finally{writeFileSync(root+'/extras.json',JSON.stringify(out,null,2));await browser.close();}
console.log(JSON.stringify(out));
