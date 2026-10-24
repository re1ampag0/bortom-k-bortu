import {visibleLayers} from './layer-geometry.mjs';
// Preserve the actual CDP layer rectangles and their transforms; never count a clipped panorama as fullscreen.
import {chromium}from'@playwright/test';import{writeFileSync,mkdirSync}from'node:fs';
const url=process.argv[2]??'http://127.0.0.1:5322',tag=process.argv[3]??'after';
const b=await chromium.launch({executablePath:'/usr/bin/chromium'}),p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true}),c=await p.context().newCDPSession(p);await c.send('LayerTree.enable');let tree=[];c.on('LayerTree.layerTreeDidChange',x=>tree=x.layers??[]);
await p.goto(url+'/bortom-k-bortu/?seed=1&speed=instant&perf=0');for(const id of ['quick-duo','prep-start','placement-done','curtain-ready','placement-done','curtain-ready'])await p.getByTestId(id).click();const rows=[];
for(const code of tag==='before'?['Ж']:['Ж','М','И','Г']){await p.getByTestId('plank-'+code).locator('.plank-head').click({position:{x:8,y:8}});await p.waitForSelector(tag==='before'?'[data-testid=ship-sheet]':'.sw-native-scene[data-ready]');await p.waitForTimeout(500);const saved=tree;
 const geometry=await visibleLayers(p,c,saved);
 rows.push({code,layers:geometry,large:geometry.filter(x=>(x.owner?.visibleArea??0)>=390*844*.5).map(x=>({id:x.layerId,owner:x.owner,width:x.width,height:x.height,transform:x.transform}))});await p.getByTestId('ship-sheet').getByRole('button',{name:'Закрыть',exact:true}).click();}
mkdirSync('docs/screenshots/ship-window/checks',{recursive:true});writeFileSync(`docs/screenshots/ship-window/checks/${tag}-layers.json`,JSON.stringify(rows,null,2));console.log(rows.map(x=>({code:x.code,large:x.large})));await b.close();
