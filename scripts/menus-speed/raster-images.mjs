import{chromium}from'@playwright/test';import{readFileSync,writeFileSync}from'node:fs';import{createHash}from'node:crypto';
const origin=process.env.SCENE_PREP_URL??'http://127.0.0.1:5370';
const bank='src/ui/game/scene-window/art',browser=await chromium.launch({executablePath:'/usr/bin/chromium'}),page=await browser.newPage();await page.goto(origin+'/bortom-k-bortu/');const cache=new Map();
try{for(const folder of ['src/ui/menus','src/ui/game/ship-window','src/ui/game/weather-window']){
 const scenes=JSON.parse(readFileSync(folder+'/scenes.json'));
 async function walk(ns){for(const n of ns){if(n.image&&n.image.endsWith('.svg')){
 const w=parseFloat(n.style.width),h=parseFloat(n.style.height),key=n.image+':'+w+':'+h;
 if(w>0&&h>0){let src=cache.get(key);if(!src){const result=await page.evaluate(async({url,w,h})=>{const img=new Image();img.src=url;await img.decode();const c=document.createElement('canvas');c.width=Math.ceil(w*2);c.height=Math.ceil(h*2);c.getContext('2d').drawImage(img,0,0,c.width,c.height);return c.toDataURL('image/webp',.9).split(',')[1]},{url:'/bortom-k-bortu/'+bank+'/'+n.image,w,h});const data=Buffer.from(result,'base64');src='art-'+createHash('sha256').update(data).digest('hex').slice(0,20)+'.webp';writeFileSync(bank+'/'+src,data);cache.set(key,src);}
 n.art={src,x:0,y:0,w,h};delete n.image;}
 }await walk(n.children);}}
 for(const s of Object.values(scenes))await walk(s.tree);writeFileSync(folder+'/scenes.json',JSON.stringify(scenes));
}}finally{await browser.close();}console.log('SVG image rasters',cache.size);
