// Actual seeded games, no mocked state. Shared scene clock and reference fonts.
import {chromium} from '@playwright/test';
import {PNG} from 'pngjs';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {phoneReference} from './phone-reference.mjs';
import {referenceFonts} from '../scene-window/fonts.mjs';
const groups=[{storm:['Main',3],fog:['Fog',1],tortuga:['Tortuga',26],wind:['Wind',10],clear:['ClearSky',11]},{wet:['WetPowder',62],calm:['Calm',17],wave:['NinthWave',70],maelstrom:['Maelstrom',27],mermaids:['Mermaids',45],rum:['Rum',13]},{caravan:['Caravan',2],reefs:['Reefs',39],thunder:['Thunder',7],fleet:['Fleet',8],moon:['Moonlight',14],current:['Current',9]}];
const final=process.argv[2]==='final',stage=final?0:Number(process.argv[2]??0),phase=Number(process.argv[3]??750),out=final?'docs/screenshots/weather-window/final':`docs/screenshots/weather-window/stage${stage+2}`;mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium'}),proof=process.env.CAPTURE_WIDTH?JSON.parse(readFileSync(`${out}/proof.json`,'utf8')).filter(r=>r.viewport?.[0]!==Number(process.env.CAPTURE_WIDTH)):[];
try{for(const [width,height]of (final?[[1366,660],[430,932]]:[[1366,660]]).filter(([w])=>!process.env.CAPTURE_WIDTH||w===Number(process.env.CAPTURE_WIDTH)))for(const [key,[name,seed]]of Object.entries(final?{...groups[0],wet:groups[1].wet}:groups[stage])){
 const p=await browser.newPage({viewport:{width,height}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(`http://127.0.0.1:5331/bortom-k-bortu/?seed=${seed}&speed=instant&perf=0`);
 for(const id of ['quick-duo','prep-start','placement-done','curtain-ready','placement-done','curtain-ready'])await p.getByTestId(id).click();
 await p.locator('[data-fx-sea-chip]').click();await p.waitForSelector('.ww-scene .sw-native-scene[data-ready]');await p.evaluate(()=>document.fonts.ready);
 await p.evaluate(t=>document.querySelector('.ww-scene .sw-native-scene').captureScene(t),phase);
 const record=await p.getByTestId('sea-sheet').evaluate(el=>({title:el.getAttribute('aria-label'),motions:el.getAnimations({subtree:true}).map(a=>({tag:a.effect.target.tagName,props:[...new Set(a.effect.getKeyframes().flatMap(f=>Object.keys(f)))].filter(k=>!['offset','easing','computedOffset','composite'].includes(k))})),box:(()=>{const b=el.getBoundingClientRect();return{x:b.x,y:b.y,w:b.width,h:b.height}})()}));
 if(errors.length||record.motions.some(a=>!['DIV','IMG','CANVAS'].includes(a.tag)||a.props.some(k=>!['transform','opacity'].includes(k))))throw Error(JSON.stringify({key,errors,record}));
 if(width<=700){await p.screenshot({path:`${out}/${key}-${width}x${height}-viewport.png`});await p.locator('.weather-window-frame').evaluate(e=>e.style.height=e.scrollHeight+'px');}
 await p.getByTestId('sea-sheet').screenshot({path:`${out}/${key}-${width}x${height}-game.png`});await p.locator('.ww-scene').screenshot({path:`${out}/${key}-${width}x${height}-scene-game.png`});
 const ref=await browser.newPage({viewport:{width:width<=700?390:920,height:width<=700?1180:600}});await ref.goto(`http://127.0.0.1:5330/artboards/${width<=700&&key==='storm'?'Phone':name}.dc.html`);if(width<=700&&key!=='storm')await phoneReference(ref);await ref.addStyleTag({content:referenceFonts});await ref.evaluate(async t=>{await document.fonts.load('500 13px "Alegreya SC"','Корпус Паруса ABC123');await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));for(const a of document.getAnimations()){a.pause();a.currentTime=t;}},phase);await ref.screenshot({path:`${out}/${key}-${width}x${height}-mockup.png`});
 const a=PNG.sync.read(readFileSync(`${out}/${key}-${width}x${height}-mockup.png`)),b=PNG.sync.read(readFileSync(`${out}/${key}-${width}x${height}-game.png`)),c=new PNG({width:a.width+b.width+8,height:Math.max(a.height,b.height)});PNG.bitblt(a,c,0,0,a.width,a.height,0,0);PNG.bitblt(b,c,0,0,b.width,b.height,a.width+8,0);writeFileSync(`${out}/${key}-${width}x${height}-comparison.png`,PNG.sync.write(c));
 proof.push({key,viewport:[width,height],seed,phase,reference:width<=700&&key!=='storm'?'desktop artboard with Phone layout':name,...record,errors});await ref.close();await p.close();console.log(key,width,'frame and animation contract checked');
}}finally{await browser.close();}writeFileSync(`${out}/proof.json`,JSON.stringify(proof,null,1)+'\n');
