// Attribute CDP layers to actual DOM ancestors, independently checking weather and planks.
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
function count(key,label){
  const stem=`tmp/fx-ambient/${key}-${label}`;
  const nodes=JSON.parse(readFileSync(`${stem}-dom.json`));
  const ids=new Map(nodes.map(n=>[n.nodeId,n])),backend=new Map(nodes.map(n=>[n.backendNodeId,n]));
  const totals={weather:0,planks:0,other:0};
  for(const layer of JSON.parse(readFileSync(`${stem}-layers.json`))){
    let node=backend.get(layer.backendNodeId),group='other';
    while(node){
      const attrs=node.attributes??[],at=attrs.indexOf('class'),cls=at<0?'':attrs[at+1];
      if(/\bfx-weather\b/.test(cls)){group='weather';break;}
      if(/\bplank\b/.test(cls)){group='planks';break;}
      node=ids.get(node.parentId);
    }
    totals[group]++;
  }
  return totals;
}
const rows=[];
for(const key of ['fog','storm','wave','calm','wind','maelstrom','clear','reefs','fleet','moon']){
  const before=count(key,'verified-before'),after=count(key,'after');
  assert(after.weather<=before.weather+10,`${key}: weather layer budget`);
  assert(after.planks<=before.planks+(['storm','wave'].includes(key)?4:0),`${key}: plank layer budget`);
  assert(after.other<=before.other,`${key}: unrelated layers must not grow`);
  rows.push({key,before,after});
}
writeFileSync('docs/screenshots/fx-ambient/layer-budget.json',JSON.stringify(rows,null,2)+'\n');
console.log('BUDGET',JSON.stringify(rows));
