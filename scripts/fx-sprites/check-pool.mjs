import {createServer} from 'vite';import {chromium,expect} from '@playwright/test';import {writeFileSync} from 'node:fs';
const server=await createServer({mode:'e2e',server:{host:'127.0.0.1',port:5189,strictPort:true}});await server.listen();const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
try{
 const p=await browser.newPage({viewport:{width:430,height:932}});await p.goto('http://127.0.0.1:5189/bortom-k-bortu/?fxScene=armada&manual=1&perf=0');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(400);
 const result=await p.evaluate(async()=>{
  const pool=await import('/bortom-k-bortu/src/ui/game/fx/sprites.ts'),{armadaGeometry}=await import('/bortom-k-bortu/src/ui/game/fx/armadaSprites.ts');
  const layer=document.querySelector('.fx-layer'),board=layer.parentElement,ctx={board,layer,speed:1,run:1,live:()=>1,rich:true};
  const before=pool.spritePoolStats(board),key=armadaGeometry(ctx).key;
  const s=pool.takeSprite(ctx,key),a=pool.spriteA(ctx,s.root,[{transform:'translate(50px,200px)',opacity:0},{transform:'translate(100px,200px)',opacity:1}],200,80);
  const delayed=s.root.style.willChange;await new Promise(r=>setTimeout(r,100));a.pause();pool.spritePause(board,true);const paused=s.root.style.willChange;a.play();pool.spritePause(board,false);await a.finished;await Promise.resolve();const finished=s.root.style.willChange;
  const svgAnimated=[...s.root.querySelectorAll('svg,svg *')].some(el=>el.getAnimations().length>0);s.release();
  const canceled=pool.takeSprite(ctx,key);pool.spriteA(ctx,canceled.root,[{opacity:0},{opacity:1}],500,2000);pool.releaseSprites(board);await Promise.resolve();
  return{before,after:pool.spritePoolStats(board),delayed,paused,finished,svgAnimated,connected:document.querySelectorAll('.fx-sprite').length};
 });
 expect(result.before.connectedPrepared).toBe(false);expect(result.after).toEqual(result.before);expect(result.connected).toBe(0);expect(result.svgAnimated).toBe(false);expect([result.delayed,result.paused,result.finished]).toEqual(['','auto','auto']);
 writeFileSync('docs/screenshots/fx-sprites/pool-check.json',JSON.stringify(result,null,2));console.log('POOL_OK',JSON.stringify(result));
}finally{await browser.close();await server.close()}
