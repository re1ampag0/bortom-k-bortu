// Prepare immutable map backgrounds; no SVG scene is mounted by the game.
import{chromium}from'@playwright/test';import{writeFileSync}from'node:fs';
const b=await chromium.launch({executablePath:'/usr/bin/chromium'}),p=await b.newPage();
for(const n of ['main','prep','net','phone-main','phone']){await p.goto('http://127.0.0.1:5340/assets/bg/chart-'+n+'.svg');const png=await p.evaluate(async()=>{const i=new Image();i.src=location.href;await i.decode();const c=document.createElementNS('http://www.w3.org/1999/xhtml','canvas');c.width=i.naturalWidth*3;c.height=i.naturalHeight*3;c.getContext('2d').drawImage(i,0,0,c.width,c.height);return c.toDataURL('image/webp',.9).split(',')[1];});writeFileSync('src/ui/menus/art/chart-'+n+'.webp',Buffer.from(png,'base64'));}await b.close();
