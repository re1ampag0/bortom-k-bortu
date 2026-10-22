// Annotation is a pure end-of-show computation. Reapply its final rules to archived
// raw samples after refining labels; NEVER resample or alter durations/trace costs.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {transform} from 'esbuild';
const label=process.argv[2]??'step2',dir='docs/screenshots/fx-finish';
const compiled=await transform(readFileSync('src/ui/game/perf/frames.ts','utf8'),{loader:'ts',format:'esm'});
const {frameContext,worstFrames}=await import('data:text/javascript;base64,'+Buffer.from(compiled.code).toString('base64'));
for(const scene of ['armada','hit','kraken','jack']){
  const path=`${dir}/${scene}-${label}-diagnostic.json`;
  if(!existsSync(path))continue;
  const d=JSON.parse(readFileSync(path,'utf8'));
  for(const show of d.shows)show.stats.worstFrames=worstFrames(show.profile);
  writeFileSync(path,JSON.stringify(d,null,1));
  for(const name of scene==='armada'?['armada','legend']:[scene]){
    const file=`${dir}/${name}-${label}.json`,r=JSON.parse(readFileSync(file,'utf8'));
    const p=d.shows.filter(s=>s.stats.scene===r.selectedShow).at(-1)?.profile;
    if(!p||!r.worstFrames)continue;
    const old=r.worstFrames.map(f=>[f.at,f.ms,f.costs]);
    r.worstFrames=r.worstFrames.map(f=>frameContext(p,f));
    if(JSON.stringify(old)!==JSON.stringify(r.worstFrames.map(f=>[f.at,f.ms,f.costs])))throw Error('Measured intervals/costs changed');
    if(r.sameAsLastClip){
      const ui=d.shows.at(-1).stats.worstFrames;
      for(let i=0;i<ui.length;i++)for(const key of ['at','ms','clips','stages','presses','partial'])
        if(JSON.stringify(ui[i][key])!==JSON.stringify(r.worstFrames[i][key]))throw Error(`UI differs: ${name}/${i}/${key}`);
    }
    r.annotation='Final pure frameContext; original intervals and trace costs unchanged';
    writeFileSync(file,JSON.stringify(r,null,1));
  }
}
console.log('Annotations updated; intervals/costs unchanged; full-show lists match UI.');

const summaryFile=`${dir}/${label}-summary.json`;
if(existsSync(summaryFile)){
  const summary=JSON.parse(readFileSync(summaryFile,'utf8')).map(r=>JSON.parse(readFileSync(`${dir}/${r.scene}-${label}.json`,'utf8')));
  writeFileSync(summaryFile,JSON.stringify(summary,null,1));
}
