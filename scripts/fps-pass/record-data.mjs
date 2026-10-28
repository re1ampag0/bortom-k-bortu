import{readFileSync}from'node:fs';import{dirname,join}from'node:path';import{gunzipSync}from'node:zlib';
/** Compact review JSON points to the complete, losslessly compressed observation. */
export function readRecords(path){const rows=JSON.parse(readFileSync(path,'utf8'));const archive=Array.isArray(rows)&&rows[0]?.fullRecord;return archive?JSON.parse(gunzipSync(readFileSync(join(dirname(path),archive))).toString('utf8')):rows;}
