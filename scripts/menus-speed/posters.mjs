import {chromium}from'@playwright/test';import{readFileSync,writeFileSync,mkdirSync}from'node:fs';import{execFileSync}from'node:child_process';
const origin=process.env.SCENE_PREP_URL??'http://127.0.0.1:5370';
const scenes=JSON.parse(readFileSync('src/ui/menus/scenes.json')),out='src/ui/menus/posters';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium'}),page=await browser.newPage({deviceScaleFactor:2}),index={};
page.on('pageerror',e=>console.log('Error',String(e)));
try{for(const [name,scene]of Object.entries(scenes)){
 await page.setViewportSize({width:scene.width,height:scene.height});await page.goto(`${origin}/bortom-k-bortu/scripts/menus-speed/scene.html?family=menus&name=${name}`);
 await page.waitForSelector('[data-ready="1"]');await page.evaluate(()=>document.querySelector('.sw-native-scene').captureScene(0));await page.locator('#root').screenshot({path:`/tmp/menus-poster.png`,omitBackground:true});
 execFileSync('python3',['-c',`from PIL import Image;Image.open('/tmp/menus-poster.png').save(${JSON.stringify(out+'/'+name+'.webp')},format='WEBP',quality=90,method=4,exact=True)`]);index[name]={width:scene.width,height:scene.height,src:name+'.webp'};console.log(name);
}}finally{writeFileSync('src/ui/menus/posters.json',JSON.stringify(index));await browser.close();}
