// Validate geometry recorded by capture.mjs, without running more e2e or changing a fixture.
import {readFileSync,writeFileSync} from 'node:fs';
const root='docs/screenshots/fx-finish/plate';
const overlap=(a,b)=>a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;
const result=[];
for(const name of ['a-phone','a-laptop','b-phone','b-laptop']){
 const rows=JSON.parse(readFileSync(`${root}/${name}/review-after.json`));
 for(const [i,r]of rows.entries()){
  if(!r.sameNode)throw Error(name+': plate replaced');
  if(i&&(!r.whirl||r.bigSvgAnimations!==0||!r.text.includes('Водоворот −1')))throw Error(name+': wrong effect/terms');
  for(const p of r.pieces){
   if(p.scroll>Math.ceil(p.rect.w))throw Error(name+': clipped');
   if(r.planks.some(q=>overlap(q,p.rect)))throw Error(name+': breakdown over a plank');
  }
  if(name[0]==='a'&&Math.abs(r.rect.y-rows[0].rect.y)>.1)throw Error(name+': ribbon moved after Reaction');
  if(r.plateZ!=='6'||r.particleZ.some(p=>p.level==='top'&&Number(p.z)>6))throw Error(name+': flying board above plate');
 }
 result.push({variant:name,sameNode:true,unclipped:true,clearOfPlanks:true,bigSvgAnimations:0,damageBefore:rows[0].text,damageAfter:rows[1].text});
}
writeFileSync(`${root}/geometry.json`,JSON.stringify(result,null,1)+'\n');console.log('A/B, 2 sizes: same node, updated terms, no overlap/clipping, board below plate');
