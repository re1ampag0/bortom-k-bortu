import type {Scene} from '../game/scene-window/PreparedScene';
const files=import.meta.glob('./scenes/*.json',{import:'default'});
const jobs=new Map<string,Promise<Scene>>();
export const hasScene=(name:string)=>!!files['./scenes/'+name+'.json'];
export function loadScene(name:string):Promise<Scene>{
 let job=jobs.get(name);if(!job){const file=files['./scenes/'+name+'.json'];if(!file)return Promise.reject(Error('Unknown scene '+name));job=file() as Promise<Scene>;jobs.set(name,job);}return job;
}
