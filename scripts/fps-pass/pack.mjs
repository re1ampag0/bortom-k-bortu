import{readdirSync,readFileSync,writeFileSync}from'node:fs';import{gzipSync}from'node:zlib';import{createHash}from'node:crypto';
const root='docs/measurements/fps-pass',hash=value=>createHash('sha256').update(JSON.stringify(value??null)).digest('hex');let count=0;
for(const file of readdirSync(root).filter(n=>n.endsWith('.json'))){const raw=readFileSync(`${root}/${file}`),rows=JSON.parse(raw);if(!Array.isArray(rows)||!rows.some(r=>r?.clock)||rows[0]?.fullRecord)continue;
 const fullRecord=file.replace(/\.json$/,'.full.json.gz');writeFileSync(`${root}/${fullRecord}`,gzipSync(raw,{level:9}));
 const summary=rows.map(({clock,samples,...row})=>({...row,fullRecord,...clock?{clock:{time:clock.time,seed:clock.seed,randomCalls:clock.randomCalls,animations:clock.animations,pendingDecodes:clock.pendingDecodes,finishErrors:clock.finishErrors},nativeLaunchHash:hash(clock.history),rngTraceHash:hash(clock.randomTrace)}:{},...samples?{controlTimelineHash:hash(samples.map(s=>s.controls)),samples:samples.map(({controls,...s})=>s)}:{}}));
 // One physical line per frame keeps GitHub review usable. The original bytes are in fullRecord.
 writeFileSync(`${root}/${file}`,'[\n'+summary.map(r=>JSON.stringify(r)).join(',\n')+'\n]\n');count++;
}console.log('Packed complete records:',count);
