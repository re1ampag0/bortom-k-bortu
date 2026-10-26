import{readFileSync,writeFileSync,mkdirSync}from'node:fs';
export function splitScenes(){for(const folder of ['src/ui/menus','src/ui/game/ship-window','src/ui/game/weather-window']){
 const scenes=JSON.parse(readFileSync(folder+'/scenes.json'));mkdirSync(folder+'/scenes',{recursive:true});
 for(const [name,scene]of Object.entries(scenes)){
  if(/[\\/]/.test(name))throw Error('Unsafe scene key '+name);
  // Matrix coefficients, opacity and normalized offsets are not pixel values.
  writeFileSync(`${folder}/scenes/${name}.json`,JSON.stringify(scene));
 }
 writeFileSync(folder+'/sceneManifest.ts',`import type {Scene} from '${folder==='src/ui/menus'?'../game/scene-window':'../scene-window'}/PreparedScene';
const files=import.meta.glob('./scenes/*.json',{import:'default'});
const jobs=new Map<string,Promise<Scene>>();
export const hasScene=(name:string)=>!!files['./scenes/'+name+'.json'];
export function loadScene(name:string):Promise<Scene>{
 let job=jobs.get(name);if(!job){const file=files['./scenes/'+name+'.json'];if(!file)return Promise.reject(Error('Unknown scene '+name));job=file() as Promise<Scene>;jobs.set(name,job);}return job;
}
`);
}
}
if(process.argv[1]&&new URL(import.meta.url).pathname.endsWith(process.argv[1].replaceAll('\\','/')))splitScenes();
