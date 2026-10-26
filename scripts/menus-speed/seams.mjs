// Pixel inventory of every infinite non-alternate layer. Not an e2e test.
import{chromium}from'@playwright/test';import{readFileSync,writeFileSync,mkdirSync}from'node:fs';import{createRequire}from'node:module';import{dirname}from'node:path';
const require=createRequire(import.meta.url),{PNG}=require(dirname(require.resolve('playwright-core/package.json'))+'/lib/utilsBundle.js');
const stage=process.env.STAGE??'final',before=process.env.BASELINE==='1',dir='docs/measurements/menus-speed',pictures='docs/screenshots/menus-speed/seams';mkdirSync(dir,{recursive:true});mkdirSync(pictures,{recursive:true});const rows=[],jobs=[];
function walk(ns){return ns.flatMap(n=>[n,...walk(n.children)])}
for(const family of ['menus','ship','weather']){const folder=family==='menus'?'src/ui/menus':`src/ui/game/${family}-window`,data=JSON.parse(readFileSync((before?'/workspace/menus-speed-before/':'')+folder+'/scenes.json'));for(const [name,s]of Object.entries(data))jobs.push({family,name,s});}
const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});let next=0;
function compare(x,y){const a=PNG.sync.read(x),b=PNG.sync.read(y);let n=0,peak=0;for(let i=0;i<a.data.length;i+=4){const d=Math.max(...[0,1,2,3].map(c=>Math.abs(a.data[i+c]-b.data[i+c])));if(d>12)n++;peak=Math.max(peak,d)}return{pixels:n,peak};}
async function worker(){const page=await browser.newPage({deviceScaleFactor:1});page.setDefaultTimeout(20000);
try{while(next<jobs.length){const {family,name,s}=jobs[next++];if(process.env.SCENES&&!process.env.SCENES.split(',').includes(name))continue;
 await page.setViewportSize({width:s.width,height:s.height});await page.goto(`http://127.0.0.1:5370/bortom-k-bortu/scripts/menus-speed/scene.html?family=${family}&name=${encodeURIComponent(name)}${before?'&before=1':''}`);await page.waitForSelector('[data-ready="1"]');
 for(const node of walk(s.tree)){if(process.env.LAYERS&&!process.env.LAYERS.split(',').includes(`${family}:${name}:${node.id}`))continue;
 const actions=[...node.anim,...node.frames?[{name:'prepared-frames',timing:node.frameTiming}]:[],...node.rain?[{name:'rain',timing:node.rainTiming}]:[]];
 for(let ai=0;ai<actions.length;ai++){
  const a=actions[ai],d=Number(a.timing.duration);if(a.timing.iterations!==null&&a.timing.iterations!==undefined&&a.timing.iterations!==Infinity)continue;
  if(String(a.timing.direction??'normal').startsWith('alternate')){rows.push({family,name,id:node.id,animation:a.name,alternate:true,seam:false});continue;}
  if(!d)continue;
  await page.evaluate(({id,ai})=>{
   const original=window.sceneData;
   function keep(n){if(n.id===id){const out=structuredClone(n);out.particle=false;for(const a of out.anim){a.timing={...a.timing,delay:0,iterations:1,fill:'both'}}if(out.frameTiming)out.frameTiming={...out.frameTiming,delay:0,iterations:1,fill:'both'};return out;}
    const kids=n.children.map(keep).filter(Boolean);if(!kids.length)return null;return{...n,anim:[],frames:undefined,particle:false,children:kids};}
   window.renderScene({...original,tree:original.tree.map(keep).filter(Boolean)});
  },{id:node.id,ai});await page.waitForTimeout(25);
  const pose=async t=>{await page.evaluate(({id,t,animation})=>{const host=document.querySelector('.sw-native-scene');host.captureScene?.(0);for(const a of host.getAnimations({subtree:true})){if(a.id===animation&&a.effect.target.closest('[data-sw-layer]')?.getAttribute('data-sw-layer')===String(id)){a.pause();a.effect.updateTiming({iterations:1,fill:'both',delay:0});a.currentTime=t;}}},{id:node.id,t,animation:a.name});return page.screenshot({omitBackground:true});};
  const start=await pose(0),near=await pose(Math.max(0,d-1000/60)),end=await pose(d),atEnd=compare(start,end),atNear=compare(start,near),seam=atEnd.pixels>Math.max(100,s.width*s.height*.0001);
  const row={family,name,id:node.id,animation:a.name,duration:d,seam,atEnd,atNear};rows.push(row);
  if(seam&&(!process.env.LIMIT_IMAGES||rows.filter(r=>r.images).length<Number(process.env.LIMIT_IMAGES))){const key=`${family}-${name}-${node.id}-${ai}-${stage}`;writeFileSync(`${pictures}/${key}-end.png`,near);writeFileSync(`${pictures}/${key}-start.png`,start);row.images=key;}
 }
 }
 console.log(family,name,rows.filter(r=>r.family===family&&r.name===name&&r.seam).length,'seams');writeFileSync(`${dir}/seams-${stage}.json`,JSON.stringify(rows));
}}finally{await page.close();}}
try{await Promise.all([worker(),worker()]);}finally{writeFileSync(`${dir}/seams-${stage}.json`,JSON.stringify(rows));await browser.close();}
