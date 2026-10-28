import{PNG}from'pngjs';import{readFileSync,writeFileSync,readdirSync,mkdirSync}from'node:fs';import{pixelDifference,passesPixels}from'./pixels.mjs';
const run=process.argv[2],dir=`docs/screenshots/fps-pass/${run}`,rows=[];mkdirSync(dir,{recursive:true});
for(const name of readdirSync(dir).filter(n=>n.endsWith('-a.png'))){const a=PNG.sync.read(readFileSync(`${dir}/${name}`)),b=PNG.sync.read(readFileSync(`${dir}/${name.replace('-a.png','-b.png')}`)),{width:w,height:h}=a,triptych=new PNG({width:w*3,height:h});
 for(let p=0;p<w*h;p++){const i=p*4,d=Math.max(...[0,1,2].map(c=>Math.abs(a.data[i+c]-b.data[i+c]))),y=Math.floor(p/w),x=p%w;for(let c=0;c<4;c++){triptych.data[(y*w*3+x)*4+c]=a.data[i+c];triptych.data[(y*w*3+w+x)*4+c]=b.data[i+c];triptych.data[(y*w*3+w*2+x)*4+c]=c===3?255:d>48?c===0?255:0:d?c===2?0:150:Math.round(a.data[i+c]*.2);}}
 const stats=pixelDifference(a.data,b.data,w,h),stem=name.replace('-a.png','');writeFileSync(`${dir}/${stem}-compare.png`,PNG.sync.write(triptych));rows.push({frame:stem,...stats,passesAbsoluteThreshold:passesPixels(stats)});
}
writeFileSync(`docs/measurements/fps-pass/${run}-areas.json`,JSON.stringify(rows,null,2));console.log(rows);
