// Prepare the accepted scene art offline. SVG never animates in the game's document.
// Run with the read-only mockup server on 5319. Each animation is retained as data for HTML/canvas clocks.
import {chromium} from '@playwright/test';
import {referenceFonts} from './fonts.mjs';
import {createHash} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
export async function extractScenes(config){
const {phone=false,weather=false,out,manifestPath,boards,sourceDir,sourceURL}=config;
const manifest=weather||phone?JSON.parse(existsSync(manifestPath)?readFileSync(manifestPath,'utf8'):'{}'):{};mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
const page=await browser.newPage({viewport:{width:920,height:640}});
const raster=await browser.newPage({deviceScaleFactor:3});
try{for(const [code,name]of Object.entries(boards)){
 await page.setViewportSize({width:phone?390:920,height:phone?1360:640});
 await page.goto(`${sourceURL}/artboards/${name}.dc.html`);await page.addStyleTag({content:referenceFonts});await page.evaluate(async()=>{await document.fonts.load('500 13px "Alegreya SC"','Корпус Паруса ABC123');await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
 const result=await page.evaluate((weather)=>{
  const scene=document.querySelector('[class*="-scene"]'),title=[...scene.children].find(e=>e.contains(document.querySelector('h1')))??document.querySelector('h1').parentElement.parentElement,close=scene.querySelector('button');
  const native=document.getAnimations();native.forEach(a=>{a.pause();a.currentTime=0;});
  const animations=new Map(),assets=[];let id=0;const padding=weather?24:8;
  for(const a of native){const el=a.effect.target;if(!scene.contains(el)||title.contains(el))continue;
   const list=animations.get(el)??[];list.push({name:a.animationName,frames:a.effect.getKeyframes(),timing:a.effect.getTiming(),native:a});animations.set(el,list);
  }
  const style=e=>{const s=getComputedStyle(e);return Object.fromEntries(['position','display','left','top','right','bottom','width','height','z-index','overflow-x','overflow-y','border-radius','opacity','transform','transform-origin','background-color','background-image','background-size','background-position','background-repeat','box-shadow','filter','mask-image','mask-size','mask-repeat','mix-blend-mode','box-sizing','font-family','font-size','font-weight','font-style','line-height','letter-spacing','text-align','text-shadow','color'].map(k=>[k.replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),s.getPropertyValue(k)]));};
  const svgStatic=(nodes,svg,bounds,neutral=true)=>{
   const original=Array.isArray(nodes)?nodes:[nodes],clones=original.map(n=>n.cloneNode(true));
   for(let q=0;q<original.length;q++){
    const a=[original[q],...original[q].querySelectorAll('*')],b=[clones[q],...clones[q].querySelectorAll('*')];
    for(let i=0;i<a.length;i++){
     const s=getComputedStyle(a[i]);for(const k of ['d','r','rx','ry','transform','transform-origin','transform-box','opacity','filter','fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','stroke-dasharray','stroke-dashoffset','stop-color','stop-opacity'])b[i].style.setProperty(k,s.getPropertyValue(k));
     b[i].style.animation='none';b[i].style.transition='none';
    }
    if(neutral){clones[q].removeAttribute('transform');clones[q].style.transform='none';clones[q].style.opacity='1';}
    clones[q].querySelectorAll('animate,animateTransform,animateMotion,script').forEach(e=>e.remove());
   }
   const defs=[...svg.querySelectorAll('defs')].map(e=>e.outerHTML).join('');
   return `<svg xmlns="http://www.w3.org/2000/svg" width="${bounds.w}" height="${bounds.h}" viewBox="${bounds.x} ${bounds.y} ${bounds.w} ${bounds.h}">${defs}${clones.map(c=>new XMLSerializer().serializeToString(c)).join('')}</svg>`;
  };
  function art(e,node,svg){
   let box;
   if(svg){const b=e.getBBox();box={x:Math.floor(b.x-8),y:Math.floor(b.y-8),w:Math.ceil(b.width+16),h:Math.ceil(b.height+16)};
    if(box.w<=0||box.h<=0)return;
    const asset=assets.length;assets.push({svg:svgStatic(e,svg,box),w:box.w,h:box.h});node.art={asset,...box};
   }else if(e.tagName==='IMG'){
    const s=style(e);
    if(s.filter!=='none'||s.maskImage!=='none'){
     const w=e.offsetWidth,h=e.offsetHeight,asset=assets.length;
     assets.push({html:`<img src="${e.getAttribute('src')}" style="position:absolute;left:${padding}px;top:${padding}px;box-sizing:border-box;width:${w}px;height:${h}px;filter:${s.filter};mask-image:${s.maskImage};mask-size:${s.maskSize};mask-repeat:${s.maskRepeat}">`,w:w+padding*2,h:h+padding*2,padding,mask:s.maskImage});node.art={asset,x:-padding,y:-padding,w:w+padding*2,h:h+padding*2,padding};node.style.overflowX=node.style.overflowY='visible';
    }else node.image=e.getAttribute('src');
   }else{
    const s=style(e),w=e.offsetWidth,h=e.offsetHeight;if(!w||!h)return;
    const frames=animations.get(e)?.find(a=>a.frames.some(f=>f.backgroundPositionX!==undefined));
    if(frames&&/^(d|m)-rain$/.test(frames.name)){
     const pad=64,asset=assets.length;
     assets.push({html:`<div style="position:absolute;left:0;top:0;width:${w+pad*2}px;height:${h+pad*2}px;background-image:${s.backgroundImage};background-size:${s.backgroundSize};background-position:${pad}px ${pad}px"></div>`,w:w+pad*2,h:h+pad*2});
     node.art={asset,x:-pad,y:-pad,w:w+pad*2,h:h+pad*2};node.rain=true;
     node.animations=frames.frames.map(f=>({offset:f.offset,easing:f.easing,transform:`translate(${f.backgroundPositionX},${f.backgroundPositionY})`}));node.rainTiming=frames.timing;
    }else if(frames){
     node.frames=[];
     for(let f=0;f<4;f++){
      frames.native.currentTime=frames.timing.delay+frames.timing.duration*f/3;
      const at=getComputedStyle(e),asset=assets.length,css=[...at].filter(k=>!k.startsWith('animation')&&!k.startsWith('transition')).map(k=>`${k}:${at.getPropertyValue(k)}`).join(';');
      assets.push({html:`<div style="${css.replace(/"/g,'&quot;')};position:absolute;left:${padding}px;top:${padding}px;transform:none;opacity:1"></div>`,w:w+padding*2,h:h+padding*2,padding,mask:s.maskImage});node.frames.push({asset,x:-padding,y:-padding,w:w+padding*2,h:h+padding*2,padding});
     }frames.native.currentTime=0;node.frameTiming=frames.timing;node.anim=[];
    }else{
     const asset=assets.length,css=['background-color','background-image','background-size','background-position','background-repeat','border','border-radius','box-shadow','filter','clip-path','mask-image','mask-size','mask-repeat'].map(k=>`${k}:${getComputedStyle(e).getPropertyValue(k)}`).join(';');
     assets.push({html:`<div style="${css.replace(/"/g,'&quot;')};position:absolute;left:${padding}px;top:${padding}px;box-sizing:border-box;width:${w}px;height:${h}px"></div>`,w:w+padding*2,h:h+padding*2,padding,mask:s.maskImage});node.art={asset,x:-padding,y:-padding,w:w+padding*2,h:h+padding*2,padding};
    }
   }
  }
  function layout(e){
   if(e===scene)return {x:0,y:0};
   if(e instanceof HTMLElement){let x=0,y=0;for(let n=e;n&&n!==scene;n=n.offsetParent){x+=n.offsetLeft;y+=n.offsetTop;const p=n.offsetParent;if(p){x+=p.clientLeft;y+=p.clientTop;}}return {x,y};}
   const p=e.parentElement,b=e.getBoundingClientRect(),pb=p.getBoundingClientRect(),at=layout(p),s=getComputedStyle(e);
   if(s.position==='absolute')return {x:at.x+p.clientLeft+parseFloat(s.left||0),y:at.y+p.clientTop+parseFloat(s.top||0)};
   return {x:at.x+(b.x-pb.x)/(pb.width/p.offsetWidth||1),y:at.y+(b.y-pb.y)/(pb.height/p.offsetHeight||1)};
  }
  const hasDesc=e=>[...animations.keys()].some(el=>el!==e&&e.contains(el));
  function walk(e,svg){
   if(e===title||e===close||['defs','title','desc','style','script'].includes(e.tagName))return null;
   const isSvg=e.namespaceURI==='http://www.w3.org/2000/svg',root=isSvg&&e.tagName==='svg';if(isSvg&&!(e instanceof SVGGraphicsElement))return null;
   const s=style(e),anim=(animations.get(e)??[]).map(({native,...a})=>a),node={id:++id,tag:e.tagName,cls:e.getAttribute('class')??'',style:s,anim,children:[]};
   if(root){
    const vb=e.viewBox.baseVal,w=parseFloat(s.width)||e.width.baseVal.value,h=parseFloat(s.height)||e.height.baseVal.value;
    const inner={id:++id,tag:'viewbox',style:{position:'absolute',left:'0px',top:'0px',width:'0px',height:'0px',opacity:'1',transform:`scale(${w/(vb.width||w)},${h/(vb.height||h)}) translate(${-vb.x}px,${-vb.y}px)`,transformOrigin:'0px 0px'},anim:[],children:[]};
    const fire=[...animations].filter(([el])=>e.contains(el)).flatMap(([,a])=>a);
    if(fire.length&&fire.every(a=>/^(?:rf|jf)[A-Z]$/.test(a.name))){
     const duration=(fire.find(a=>/A$/.test(a.name))?.timing.duration??700)*2;
     inner.frames=[];inner.frameTiming={duration,delay:0,iterations:null,fill:'both',easing:'linear'};
     for(let f=0;f<4;f++){
      fire.forEach(a=>a.native.currentTime=duration*f/4);
      const box={x:vb.x-12,y:vb.y-12,w:(vb.width||w)+24,h:(vb.height||h)+24},asset=assets.length;
      assets.push({svg:svgStatic([...e.children].filter(n=>n.tagName!=='defs'),e,box,false),w:box.w,h:box.h});inner.frames.push({asset,...box});
     }fire.forEach(a=>a.native.currentTime=0);
    }else for(const child of e.children){const c=walk(child,e);if(c)inner.children.push(c);}
    node.children=[inner];node.svgRoot=true;
   }else if(isSvg){
    node.style={position:'absolute',left:'0px',top:'0px',width:'0px',height:'0px',transform:s.transform,transformOrigin:s.transformOrigin,opacity:s.opacity,overflowX:'visible',overflowY:'visible'};
    if(weather&&getComputedStyle(e).transformBox==='fill-box'){const b=e.getBBox(),o=s.transformOrigin.split(' ').map(parseFloat);node.style.transformOrigin=(b.x+o[0])+'px '+(b.y+o[1])+'px';}
    const clipId=e.getAttribute('clip-path')?.match(/#([^)]*)/)?.[1],clip=clipId?svg.querySelector('[id="'+clipId+'"]'):null;
    if(weather&&((clip&&clip.querySelector('path')&&hasDesc(e))||anim.some(a=>/^th-fl[123]$/.test(a.name)))){
     const actions=[...animations].filter(([el])=>el===e||e.contains(el)).flatMap(([,a])=>a),duration=Math.max(...actions.map(a=>Number(a.timing.duration)*(String(a.timing.direction).startsWith('alternate')?2:1))),b=e.getBBox(),box={x:Math.floor(b.x-24),y:Math.floor(b.y-24),w:Math.ceil(b.width+48),h:Math.ceil(b.height+48)};
     node.frames=[];node.frameTiming={duration,iterations:null,fill:'both',easing:'linear'};node.anim=[];node.style.transform='none';node.style.opacity='1';
     for(let f=0;f<4;f++){actions.forEach(a=>a.native.currentTime=duration*f/4);const asset=assets.length;assets.push({svg:svgStatic(e,svg,box,false),w:box.w,h:box.h});node.frames.push({asset,...box});}actions.forEach(a=>a.native.currentTime=0);
    }else if(hasDesc(e)){for(const child of e.children){const c=walk(child,svg);if(c)node.children.push(c);}}
    else art(e,node,svg);
    if(weather&&clip?.querySelector('rect')&&node.children.length){
     const rect=clip.querySelector('rect'),x=Number(rect.getAttribute('x')),y=Number(rect.getAttribute('y')),w=Number(rect.getAttribute('width')),h=Number(rect.getAttribute('height')),children=node.children;
     node.children=[{id:++id,tag:'clip',cls:'',style:{position:'absolute',left:x+'px',top:y+'px',width:w+'px',height:h+'px',overflowX:'hidden',overflowY:'hidden'},anim:[],children:[{id:++id,tag:'clip-content',cls:'',style:{position:'absolute',left:-x+'px',top:-y+'px',width:'0px',height:'0px',overflowX:'visible',overflowY:'visible'},anim:[],children}]}];
    }
   }else{
    if(e.children.length){if(s.backgroundImage!=='none'||s.backgroundColor!=='rgba(0, 0, 0, 0)')art(e,node,null);for(const child of e.children){const c=walk(child,null);if(c)node.children.push(c);}}
    else if(weather&&e.textContent.trim()){node.text=e.textContent;for(const side of ['Left','Right','Top','Bottom'])node.style['padding'+side]=(parseFloat(getComputedStyle(e)['padding'+side])+parseFloat(getComputedStyle(e)['border'+side+'Width']))+'px';}else art(e,node,null);
    // HTML container's static paint is retained only when it has no animated subtree.
    // All masked sheen/background-position leaves above are prepainted, never animated CSS paint properties.
   }
   if(weather&&!isSvg){
    const at=layout(e),parent=layout(e.parentElement);node.style.position='absolute';node.style.left=(at.x-parent.x)+'px';node.style.top=(at.y-parent.y)+'px';node.style.width=e.offsetWidth+'px';node.style.height=e.offsetHeight+'px';node.style.boxSizing='border-box';
   }else if(weather&&root&&s.position!=='absolute'){const at=layout(e),parent=layout(e.parentElement);node.style.position='absolute';node.style.left=(at.x-parent.x)+'px';node.style.top=(at.y-parent.y)+'px';}
   node.particle=!!node.art&&!!node.anim.length&&/(?:tw$|spk$|shoot$|spray$|splash$|glit$|wisp$|drip$|port$|ember$|farsm$|rise$|puff$|crown$|ring$|drop$|mote$|spark$|shard$|ember$|smk$|dust$|fly$)/.test(node.anim[0].name)&&node.art.w<160&&node.art.h<180;
   return node;
  }
  if(weather)for(const [el,list]of animations)for(const a of list){
   const properties=[...new Set(a.frames.flatMap(f=>Object.keys(f)))].filter(k=>['transform','opacity'].includes(k));if(!properties.length)continue;
   const duration=Number(a.timing.duration),old=a.native.currentTime;a.frames=Array.from({length:51},(_,i)=>{a.native.currentTime=Number(a.timing.delay??0)+duration*(i===50?1-1e-8:i/50);const computed=getComputedStyle(el);return Object.fromEntries([['offset',i/50],['easing','linear'],...properties.map(k=>[k,computed[k]])]);});a.native.currentTime=old;
  }
  const tree=[];for(const e of scene.children){const n=walk(e,null);if(n)tree.push(n);}
  const features=[];
  for(const h of document.querySelectorAll('h3')){
   const svg=h.parentElement.parentElement.querySelector('svg');if(!svg)continue;
   const actions=native.filter(a=>svg.contains(a.effect.target)),vb=svg.viewBox.baseVal,frames=[];
   const primary=actions[0]?.effect.getTiming();
   const duration=Number(primary?.duration??1400)*(primary?.direction.startsWith('alternate')?2:1);
   for(let f=0;f<4;f++){
    actions.forEach(a=>a.currentTime=duration*f/4);
    const box={x:vb.x,y:vb.y,w:vb.width,h:vb.height},asset=assets.length;
    assets.push({svg:svgStatic([...svg.children].filter(e=>e.tagName!=='defs'),svg,box,false),w:box.w,h:box.h});frames.push({asset,...box});
   }actions.forEach(a=>a.currentTime=0);features.push({duration,frames});
  }
  if(weather){
   const box={x:0,y:0,w:scene.clientWidth,h:scene.clientHeight},asset=assets.length;
   assets.push({html:`<div style="width:${box.w}px;height:${box.h}px;background:${getComputedStyle(scene).backgroundImage}"></div>`,w:box.w,h:box.h});
   tree.unshift({id:++id,tag:'sky',cls:'',style:{position:'absolute',left:'0px',top:'0px',width:box.w+'px',height:box.h+'px',pointerEvents:'none'},anim:[],children:[],art:{asset,...box}});
  }
  return {tree,assets,features,width:scene.clientWidth,height:scene.clientHeight};
 },weather);
 // Inline any mask URLs into the offline HTML before rasterization. Images never fetch the design runtime.
 for(let i=0;i<result.assets.length;i++){
  const a=result.assets[i],filename=`${name}-live-${createHash('sha256').update(JSON.stringify(a)).digest('hex').slice(0,16)}.png`;a.file=filename;
  if(existsSync(`${out}/${filename}`))continue;
  await raster.setViewportSize({width:Math.max(1,Math.ceil(a.w)),height:Math.max(1,Math.ceil(a.h))});
  let body;
  if(a.svg)body=`<img style="display:block;width:${a.w}px;height:${a.h}px" src="data:image/svg+xml;base64,${Buffer.from(a.svg).toString('base64')}">`;
  else body=a.html.replace(/src="\.\.\/assets\/([^"]+)"/g,(_,file)=>`src="data:image/svg+xml;base64,${readFileSync(sourceDir+'/assets/'+file).toString('base64')}"`).replace(/url\(["']?(?:\.\.\/assets\/|http[^)]*\/assets\/)([^)'"\s]+)["']?\)/g,(_,file)=>`url(data:image/svg+xml;base64,${readFileSync(sourceDir+'/assets/'+file).toString('base64')})`);
  await raster.setContent(`<html style="background:transparent"><body style="margin:0;background:transparent">${body}</body></html>`);
  await raster.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
  const png=await raster.screenshot({omitBackground:true});
  if(a.mask?.startsWith('url(')){
   const maskName=a.mask.match(/assets\/([^"')]+)["']?\)/)?.[1];
   const mask=readFileSync(sourceDir+'/assets/'+maskName).toString('base64');
   const data=await raster.evaluate(async({png,mask,w,h,pad})=>{
    const source=new Image(),shape=new Image();source.src='data:image/png;base64,'+png;shape.src='data:image/svg+xml;base64,'+mask;await Promise.all([source.decode(),shape.decode()]);
    const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;const c=canvas.getContext('2d');c.drawImage(source,0,0);c.globalCompositeOperation='destination-in';c.drawImage(shape,pad*3,pad*3,(w-pad*2)*3,(h-pad*2)*3);return canvas.toDataURL().split(',')[1];
   },{png:png.toString('base64'),mask,w:a.w,h:a.h,pad:a.padding??8});writeFileSync(`${out}/${filename}`,Buffer.from(data,'base64'));
  }else writeFileSync(`${out}/${filename}`,png);
 }
 function link(n){
  for(const key of ['art',...n.frames?['frames']:[]]){
   if(key==='frames')n.frames.forEach(f=>{f.src=result.assets[f.asset].file;delete f.asset;});
   else if(n.art){n.art.src=result.assets[n.art.asset].file;delete n.art.asset;}
  }
  if(n.image){const file=n.image.split('/').pop();const target=`${name}-asset-${file}`;writeFileSync(`${out}/${target}`,readFileSync(sourceDir+'/assets/'+file));n.image=target;}
  n.children.forEach(link);
 }
 result.tree.forEach(link);result.features.forEach(f=>f.frames.forEach(a=>{a.src=result.assets[a.asset].file;delete a.asset;}));manifest[code]={name,width:result.width,height:result.height,tree:result.tree,features:result.features};
 if(phone&&!weather){const body=await page.evaluate(()=>{const svg=document.querySelector('.m-scene').previousElementSibling.cloneNode(true);svg.querySelectorAll('animate,animateTransform').forEach(e=>e.remove());return new XMLSerializer().serializeToString(svg);});writeFileSync(`${out}/Phone-body.svg`,body);}
 console.log(name,'prepared layers',result.assets.length);
 writeFileSync(manifestPath,JSON.stringify(manifest)+'\n');
}}finally{await browser.close();}

}
