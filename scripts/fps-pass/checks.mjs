import{spawn}from'node:child_process';import{createWriteStream,writeFileSync,readFileSync}from'node:fs';
const root='docs/measurements/fps-pass',rows=[];
for(const[name,args]of[['typecheck',['run','typecheck']],['unit',['test']],['sim-check',['run','sim:check']],['build',['run','build']],['build-server',['run','build:server']]]){
 const file=`${root}/final-${name}.txt`,out=createWriteStream(file),child=spawn(process.platform==='win32'?'npm.cmd':'npm',args,{stdio:['ignore','pipe','pipe']});child.stdout.pipe(out);child.stderr.pipe(out);const code=await new Promise(resolve=>child.on('exit',resolve));await new Promise(resolve=>out.end(resolve));rows.push({command:'npm '+args.join(' '),code,log:file});writeFileSync(`${root}/final-checks.json`,JSON.stringify(rows,null,2));console.log(name,'exit',code);if(code)console.log(readFileSync(file,'utf8').split('\n').filter(s=>/Error|FAIL|error TS|AssertionError/.test(s)).slice(0,8).join('\n'));
}
if(rows.some(r=>r.code))process.exitCode=1;
