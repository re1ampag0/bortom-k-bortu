import {chromium,expect} from '@playwright/test';
import {createServer} from 'vite';
const server=await createServer({server:{host:'127.0.0.1',port:5182,strictPort:true}});
await server.listen();const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
try{
 const page=await browser.newPage({viewport:{width:430,height:740}});
 await page.goto('http://127.0.0.1:5182/bortom-k-bortu/scripts/ui-4/clock-preview.html');
 await page.waitForFunction(()=>!!window.clockCheck);
 const paused=await page.evaluate(async()=>{
  const c=window.clockCheck,p=c.particle;
  const a=c.A(c.ctx,p,[{opacity:1,transform:'translateX(10px)'},{opacity:0,transform:'translateX(90px)'}],600,400,'linear');
  window.clockAnimation=a;
  await a.ready;c.pauseClock();
  const found=document.querySelector('.board').getAnimations({subtree:true}).includes(a);a.pause();await a.ready;
  return{found,display:getComputedStyle(p).display,time:a.currentTime};
 });expect(paused.found,'hidden WAAPI particles remain available to the pause controller').toBe(true);
 await page.waitForTimeout(600);
 expect(await page.evaluate(()=>({display:getComputedStyle(window.clockCheck.particle).display,time:window.clockAnimation.currentTime}))).toEqual({display:'none',time:paused.time});
 await page.evaluate(()=>{window.clockCheck.resumeClock();window.clockAnimation.play()});await page.waitForTimeout(550);
 expect(await page.evaluate(()=>getComputedStyle(window.clockCheck.particle).display)).not.toBe('none');
 await page.waitForTimeout(600);expect(await page.evaluate(()=>getComputedStyle(window.clockCheck.particle).display)).toBe('none');
 await page.evaluate(()=>{const c=window.clockCheck;c.A(c.ctx,c.particle,[{opacity:1},{opacity:1}],100,0,'linear')});
 expect(await page.evaluate(()=>getComputedStyle(window.clockCheck.particle).display)).not.toBe('none');
 console.log('PASS delayed birth, native pause, resumed phase, end release, element reuse');
}finally{await browser.close();await server.close()}
