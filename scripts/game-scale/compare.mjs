import{createRequire}from'node:module';import{dirname}from'node:path';import{readFileSync,writeFileSync,existsSync}from'node:fs';
const require=createRequire(import.meta.url),{PNG}=require(dirname(require.resolve('playwright-core/package.json'))+'/lib/utilsBundle.js'),root=process.env.OUTPUT??'docs/screenshots/game-scale',phase=process.env.PHASE??'after',sizes=(process.env.SIZES??'1366x660,430x932,390x844,430x740,430x680,390x664').split(','),rows=[];
const beforeMeta=JSON.parse(readFileSync(`${root}/before-frames.json`)),afterMeta=JSON.parse(readFileSync(`${root}/${phase}-frames.json`));
for(const size of sizes)for(const screen of ['table','log','reaction']){
 const aPath=`${root}/before/${size}/${screen}.png`,bPath=`${root}/${phase}/${size}/${screen}.png`;if(!existsSync(aPath)||!existsSync(bPath))continue;
 const a=PNG.sync.read(readFileSync(aPath)),b=PNG.sync.read(readFileSync(bPath)),diff=new PNG({width:a.width,height:a.height});
 const old=beforeMeta.find(r=>r.size===size&&r.screen===screen),now=afterMeta.find(r=>r.size===size&&r.screen===screen),special=phase!=='disabled'&&['390x844','430x740','430x680','390x664'].includes(size);
 const zones=special?[...(old?.labels??[]),...(now?.labels??[])].filter(r=>r.w>0&&r.h>0).map(r=>{const margin=r.kind==='regroup'?12:3;return{kind:r.kind,paintMargin:margin,x:r.x-margin,y:r.y-margin,w:r.w+2*margin,h:r.h+2*margin};}):[];
 if(special&&size!=='390x844'){for(const r of [old?.handBox,now?.handBox])if(r)zones.push({kind:'clipped-hand',x:r.x,y:r.y,w:r.w,h:r.h});}
 let n=0,outside=0;
 for(let y=0;y<a.height;y++)for(let x=0;x<a.width;x++){const i=(y*a.width+x)*4,changed=[0,1,2,3].some(c=>a.data[i+c]!==b.data[i+c]);if(changed){n++;if(!zones.some(z=>x>=z.x&&x<z.x+z.w&&y>=z.y&&y<z.y+z.h))outside++;}diff.data[i]=changed?255:b.data[i]>>2;diff.data[i+1]=changed?0:b.data[i+1]>>2;diff.data[i+2]=changed?160:b.data[i+2]>>2;diff.data[i+3]=255;}
 for(const z of zones){const x1=Math.max(0,Math.floor(z.x)),x2=Math.min(a.width-1,Math.ceil(z.x+z.w)),y1=Math.max(0,Math.floor(z.y)),y2=Math.min(a.height-1,Math.ceil(z.y+z.h));for(let y=y1;y<=y2;y++)for(let x=x1;x<=x2;x++)if(x<=x1+1||x>=x2-1||y<=y1+1||y>=y2-1){const i=(y*a.width+x)*4;diff.data[i]=255;diff.data[i+1]=220;diff.data[i+2]=0;}}
 writeFileSync(`${root}/${phase}/${size}/diff-${screen}.png`,PNG.sync.write(diff));rows.push({size,screen,pixels:n,outsideAllowedZones:outside,zones});
}
writeFileSync(`${root}/${phase}-difference.json`,JSON.stringify(rows,null,2));console.log(JSON.stringify(rows.map(({zones,...r})=>r)));
