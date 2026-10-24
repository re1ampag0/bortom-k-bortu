// Actual seeded games, no mocked state. Shared scene clock and reference fonts.
import {chromium} from '@playwright/test';
import {PNG} from 'pngjs';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {referenceFonts} from '../scene-window/fonts.mjs';
const groups=[{storm:['Main',3],fog:['Fog',1],tortuga:['Tortuga',26],wind:['Wind',10],clear:['ClearSky',11]},{wet:['WetPowder',62],calm:['Calm',17],wave:['NinthWave',70],maelstrom:['Maelstrom',27],mermaids:['Mermaids',45],rum:['Rum',13]},{caravan:['Caravan',2],reefs:['Reefs',39],thunder:['Thunder',7],fleet:['Fleet',8],moon:['Moonlight',14],current:['Current',9]}];
const stage=Number(process.argv[2]??0),phase=Number(process.argv[3]??750),out=`docs/screenshots/weather-window/stage${stage+2}`;mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium'}),proof=[];
try{for(const [key,[name,seed]]of Object.entries(groups[stage])){
 const p=await browser.newPage({viewport:{width:1366,height:660}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(`http://127.0.0.1:5331/bortom-k-bortu/?seed=${seed}&speed=instant&perf=0`);
 for(const id of ['quick-duo','prep-start','placement-done','curtain-ready','placement-done','curtain-ready'])await p.getByTestId(id).click();
 await p.locator('[data-fx-sea-chip]').click();await p.waitForSelector('.ww-scene .sw-native-scene[data-ready]');await p.evaluate(()=>document.fonts.ready);
 await p.evaluate(t=>document.querySelector('.ww-scene .sw-native-scene').captureScene(t),phase);
 const record=await p.getByTestId('sea-sheet').evaluate(el=>({title:el.getAttribute('aria-label'),motions:el.getAnimations({subtree:true}).map(a=>({tag:a.effect.target.tagName,props:[...new Set(a.effect.getKeyframes().flatMap(f=>Object.keys(f)))].filter(k=>!['offset','easing','computedOffset','composite'].includes(k))})),box:(()=>{const b=el.getBoundingClientRect();return{x:b.x,y:b.y,w:b.width,h:b.height}})()}));
 if(errors.length||record.motions.some(a=>!['DIV','IMG','CANVAS'].includes(a.tag)||a.props.some(k=>!['transform','opacity'].includes(k))))throw Error(JSON.stringify({key,errors,record}));
 await p.getByTestId('sea-sheet').screenshot({path:`${out}/${key}-game.png`});await p.locator('.ww-scene').screenshot({path:`${out}/${key}-scene-game.png`});
 const ref=await browser.newPage({viewport:{width:920,height:600}});await ref.goto(`http://127.0.0.1:5330/artboards/${name}.dc.html`);await ref.addStyleTag({content:referenceFonts});await ref.evaluate(async t=>{await document.fonts.load('500 13px "Alegreya SC"','Корпус Паруса ABC123');await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));for(const a of document.getAnimations()){a.pause();a.currentTime=t;}},phase);await ref.screenshot({path:`${out}/${key}-mockup.png`});
 const a=PNG.sync.read(readFileSync(`${out}/${key}-mockup.png`)),b=PNG.sync.read(readFileSync(`${out}/${key}-game.png`)),c=new PNG({width:a.width+b.width+8,height:Math.max(a.height,b.height)});PNG.bitblt(a,c,0,0,a.width,a.height,0,0);PNG.bitblt(b,c,0,0,b.width,b.height,a.width+8,0);writeFileSync(`${out}/${key}-comparison.png`,PNG.sync.write(c));
 proof.push({key,seed,phase,...record,errors});await ref.close();await p.close();console.log(key,'frame and animation contract checked');
}}finally{await browser.close();}writeFileSync(`${out}/proof.json`,JSON.stringify(proof,null,1)+'\n');
