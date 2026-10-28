/** User-approved criterion, 2026-10-28: RGB delta >48, <=0.05%, connected area <=16. */
export function pixelDifference(a,b,width,height){
 const mask=new Uint8Array(width*height);let significant=0,different=0,maxDelta=0;
 for(let p=0;p<mask.length;p++){const i=p*4,d=Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]));if(d)different++;maxDelta=Math.max(maxDelta,d);if(d>48){mask[p]=1;significant++;}}
 let largest=0;const queue=new Int32Array(significant);
 for(let p=0;p<mask.length;p++)if(mask[p]){let count=1,head=0;queue[0]=p;mask[p]=0;while(head<count){const q=queue[head++],x=q%width,y=Math.floor(q/width);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(nx<0||nx>=width||ny<0||ny>=height)continue;const n=ny*width+nx;if(mask[n]){mask[n]=0;queue[count++]=n;}}}largest=Math.max(largest,count);}
 return{different,share:different/(width*height),maxDelta,significant,significantShare:significant/(width*height),largest};
}
export function passesPixels(value,noise){return(value.significantShare<=.0005&&value.largest<=16)||!!noise&&(value.significant<=noise.significant&&value.largest<=noise.largest&&value.maxDelta<=noise.maxDelta);}
