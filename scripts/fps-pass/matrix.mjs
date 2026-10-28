import{tmpdir}from'node:os';
import{join}from'node:path';
import{createHash}from'node:crypto';
import{spawn}from'node:child_process';
import{readFileSync,writeFileSync,createWriteStream,mkdirSync,copyFileSync,existsSync,symlinkSync,realpathSync}from'node:fs';
const args=new Map(process.argv.slice(2).map(s=>s.replace(/^--/,'').split('=')));
const scenes=(args.get('scenes')??process.env.SCENES??'armada,sink,firewall,sea-storm,sea-maelstrom,plain,whirl,both,kartech,kraken,jack,bottle,dive,surface,turn,sea-current,sea-fleet,aim,tia,idle,target,ship-window,weather-window').split(',');
const sizes=(args.get('sizes')??process.env.SIZES??'1366x660,390x844').split(',');
const name=args.get('name')??process.env.MATRIX??'baseline-matrix',rows=[];
// A and B must load the same immutable capture adapter, even while its next revision is developed.
const files=['clock.mjs','record.mjs','movie.mjs'],hash=createHash('sha256');
for(const file of files)hash.update(readFileSync('scripts/fps-pass/'+file));
const protocol=hash.digest('hex').slice(0,16),runtime=join(tmpdir(),'fps-protocol-'+protocol);
mkdirSync(runtime,{recursive:true});
for(const file of files)copyFileSync('scripts/fps-pass/'+file,runtime+'/'+file);
if(!existsSync(runtime+'/node_modules'))symlinkSync(realpathSync('node_modules'),runtime+'/node_modules',process.platform==='win32'?'junction':'dir');
console.log('PROTOCOL',protocol);
outer:for(const size of sizes)for(const scene of scenes){
 const key=`${scene}-${size}`;
 for(const mode of['reference','compare']){
  const tag=`baseline-${protocol}-${mode}-${key}`,log=createWriteStream(join(tmpdir(),`fps-${tag}.log`));
  const child=spawn(process.execPath,[runtime+'/record.mjs',mode,tag],{env:{...process.env,FPS_PROTOCOL_HASH:protocol,SCENES:scene,SIZES:size},stdio:['ignore','pipe','pipe']});
  child.stdout.pipe(log);child.stderr.pipe(log);
  const exit=await new Promise(resolve=>child.on('exit',resolve));log.end();
  if(exit){console.error(`Error: capture failed ${tag}; log ${join(tmpdir(),`fps-${tag}.log`)}`);process.exitCode=1;break outer;}
  const row=JSON.parse(readFileSync(`docs/measurements/fps-pass/${tag}.json`))[0];rows.push({mode,...row});
  writeFileSync(`docs/measurements/fps-pass/${name}.json`,JSON.stringify(rows,null,2));
  console.log('COMPLETE',mode,key,row.frames,row.maxShare,row.maxSolidPixels??0);
  if(mode==='compare'&&row.failures.length){console.log('A/A REQUIRES REVIEW',key,row.failures.length);process.exitCode=2;break outer;}
 }
}
