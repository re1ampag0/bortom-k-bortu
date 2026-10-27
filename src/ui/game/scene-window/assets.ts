/** Shared detached decoding pool. Active owners retain their own references when the LRU evicts a URL. */
export function createSceneImagePool(limit=512){
 const pending=new Map<string,Promise<HTMLImageElement>>();
 return {load(url:string){let job=pending.get(url);if(job){pending.delete(url);pending.set(url,job);return job;}const image=new Image();image.src=url;job=image.decode().then(()=>image).catch(error=>{pending.delete(url);throw error;});pending.set(url,job);while(pending.size>limit)pending.delete(pending.keys().next().value!);return job;}};
}
/** Decoded art belongs to one active scene. Detached Images never create compositor layers. */
export function createSceneCache(url:(path:string)=>string,pool?:ReturnType<typeof createSceneImagePool>){
 const images=new Map<string,HTMLImageElement>(),pending=new Map<string,Promise<void>>();let current='';
 async function prepare(key:string,paths:string[]){
  if(current!==key){current=key;images.clear();pending.clear();}
  await Promise.all([...new Set(paths)].map(path=>{
   if(images.has(path))return;let work=pending.get(path);if(work)return work;
   const decode=pool?pool.load(url(path)):(()=>{const image=new Image();image.src=url(path);return image.decode().then(()=>image);})();work=decode.then(image=>{if(current===key)images.set(path,image);});pending.set(path,work);return work;
  }));
 }
 return {url,prepare,image:(path:string)=>images.get(path)};
}
export type SceneCache=ReturnType<typeof createSceneCache>;
/** Background decode is one image per idle turn; foreground windows and clips take priority. */
export function idleSceneAsset(work:()=>Promise<unknown>):Promise<void>{return new Promise(resolve=>{const schedule=()=>{if(typeof requestIdleCallback==='function')requestIdleCallback(run);else setTimeout(run,50);};const run=()=>{if(document.hidden||document.querySelector('.ship-window-backdrop,.weather-window-backdrop,.game[data-fx-busy]')){setTimeout(schedule,250);return;}void work().catch(()=>{}).finally(resolve);};schedule();});}
