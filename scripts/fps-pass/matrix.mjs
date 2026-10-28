import{tmpdir}from'node:os';import{join}from'node:path';import{createHash}from'node:crypto';import{spawn}from'node:child_process';import{readFileSync,writeFileSync,createWriteStream,mkdirSync,copyFileSync,existsSync,symlinkSync,realpathSync}from'node:fs';
const args=new Map(process.argv.slice(2).map(s=>s.replace(/^--/,'').split('='))),scenes=(args.get('scenes')??process.env.SCENES??'armada,sink,firewall,sea-storm,sea-maelstrom,plain,whirl,both,kartech,kraken,jack,bottle,dive,surface,turn,sea-current,sea-fleet,aim,tia,idle,target,ship-window,weather-window').split(','),sizes=(args.get('sizes')??process.env.SIZES??'1366x660,390x844').split(','),name=args.get('name')??'baseline-matrix',rows=[];
const files=['clock.mjs','record.mjs','movie.mjs','pixels.mjs'],hash=createHash('sha256');for(const file of files)hash.update(readFileSync('scripts/fps-pass/'+file));
const protocol=hash.digest('hex').slice(0,16),runtime=join(tmpdir(),'fps-protocol-'+protocol);mkdirSync(runtime,{recursive:true});for(const file of files)copyFileSync('scripts/fps-pass/'+file,runtime+'/'+file);if(!existsSync(runtime+'/node_modules'))symlinkSync(realpathSync('node_modules'),runtime+'/node_modules',process.platform==='win32'?'junction':'dir');console.log('PROTOCOL',protocol);
const referenceProtocol=args.get('baseline')??protocol;
const queue=sizes.flatMap(size=>scenes.map(scene=>({size,scene})));
async function worker(){while(queue.length){const{size,scene}=queue.shift(),key=`${scene}-${size}`;for(const mode of(args.has('after')?['compare']:['reference','compare'])){
 const prefix=args.has('after')?name:'baseline-'+protocol,tag=`${prefix}-${mode}-${key}`,path=`docs/measurements/fps-pass/${tag}.json`;
 if(args.has('resume')&&existsSync(path)){console.log('EXISTING',tag);continue;}
 const logPath=join(tmpdir(),`fps-${tag}.log`),log=createWriteStream(logPath),noise=`docs/measurements/fps-pass/baseline-${referenceProtocol}-compare-${key}.json`;
 const child=spawn(process.execPath,[runtime+'/record.mjs',mode,tag],{env:{...process.env,FPS_PROTOCOL_HASH:protocol,...args.has('after')?{FRAME_ROOT:`docs/measurements/fps-pass/frames/${referenceProtocol}`,FPS_REFERENCE_PROTOCOL:referenceProtocol}:{},SCENES:scene,SIZES:size,...args.has('after')&&existsSync(noise)?{NOISE_FILE:noise}:{}},stdio:['ignore','pipe','pipe']});child.stdout.pipe(log);child.stderr.pipe(log);
 const exit=await new Promise(resolve=>child.on('exit',resolve));log.end();
 if(exit){rows.push({scene,size,mode,error:logPath});console.error('Error: capture failed',tag,logPath);process.exitCode=1;break;}
 const row=JSON.parse(readFileSync(path))[0];const {clock,samples,...summary}=row;rows.push({mode,...summary});console.log('COMPLETE',mode,key,row.frames,row.maxShare,'review',row.failures.length);if(row.failures.length)process.exitCode??=2;
 writeFileSync(`docs/measurements/fps-pass/${name}.json`,JSON.stringify(rows,null,2));
 }}}
await Promise.all(Array.from({length:Number(args.get('jobs')??1)},worker));
