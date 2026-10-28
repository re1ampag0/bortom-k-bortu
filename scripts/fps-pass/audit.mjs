import {readRecords} from './record-data.mjs';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const [before,after,out='audit']=process.argv.slice(2),a=readRecords(before)[0],b=readRecords(after)[0];
const timing={busyStart:[a.busyStart,b.busyStart],busyEnd:[a.busyEnd,b.busyEnd],frames:[a.frames,b.frames],categories:[...new Set([...Object.keys(a.first),...Object.keys(b.first)])].map(name=>({name,before:a.first[name]??null,after:b.first[name]??null}))};
const canonical=x=>JSON.stringify(x);
const controls=(a.samples??[]).flatMap((v,i)=>canonical(v.controls)!==canonical(b.samples?.[i]?.controls)?[{at:v.at,before:v.controls,after:b.samples?.[i]?.controls}]:[]);
const row={before,after,pixels:{frames:b.frames,review:b.failures,worst:b.evidence},timing,controlStackDifferences:controls,launchMetadataEqual:canonical(a.clock.history)===canonical(b.clock.history),limitations:['DOM categories are observations, not per-instance pixel segmentation.','elementFromPoint cannot see pointer-events:none weather/effect layers. Native stacking order must also be inspected.']};
mkdirSync('docs/measurements/fps-pass',{recursive:true});writeFileSync(`docs/measurements/fps-pass/${out}.json`,JSON.stringify(row,null,2));console.log({frames:b.frames,review:b.failures.length,controlStackDifferences:controls.length,busy:timing.busyEnd});
