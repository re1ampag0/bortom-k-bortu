// Shared post-export pipeline: final 2x WebP bank and per-scene chunks stay reproducible.
import{createServer}from'vite';import{spawn}from'node:child_process';import{splitScenes}from'./split-scenes.mjs';
export async function prepareScenes(){
 const server=await createServer({mode:'e2e',server:{host:'127.0.0.1',port:5373,fs:{allow:['/workspace',process.cwd()]}}});await server.listen();
 const port=server.httpServer.address().port,env={...process.env,SCENE_PREP_URL:`http://127.0.0.1:${port}`};
 const run=(cmd,file)=>new Promise((resolve,reject)=>{const p=spawn(cmd,[file],{env,stdio:'inherit'});p.once('error',reject);p.once('exit',code=>code===0?resolve():reject(Error(file+' exited '+code)));});
 try{
  await run('python3','scripts/menus-speed/optimize.py');await run('node','scripts/menus-speed/raster-images.mjs');
  for(const file of ['tile-seas','ship-motion','close-loops','pixel-periods','rain-loops','quality'])await run('python3',`scripts/menus-speed/${file}.py`);
  await run('python3','scripts/menus-speed/two-key-loops.py');await run('node','scripts/menus-speed/cloud-loops.mjs');await run('node','scripts/menus-speed/posters.mjs');for(const file of ['minify','compact'])await run('python3',`scripts/menus-speed/${file}.py`);splitScenes();
 }finally{await server.close();}
}
if(process.argv[1]&&new URL(import.meta.url).pathname.endsWith(process.argv[1]))await prepareScenes();
