/** Decoded art belongs to one active scene. Detached Images never create compositor layers. */
export function createSceneCache(url:(path:string)=>string){
 const images=new Map<string,HTMLImageElement>(),pending=new Map<string,Promise<void>>();let current='';
 async function prepare(key:string,paths:string[]){
  if(current!==key){current=key;images.clear();pending.clear();}
  await Promise.all([...new Set(paths)].map(path=>{
   if(images.has(path))return;let work=pending.get(path);if(work)return work;
   const image=new Image();image.src=url(path);work=image.decode().then(()=>{if(current===key)images.set(path,image);});pending.set(path,work);return work;
  }));
 }
 return {url,prepare,image:(path:string)=>images.get(path)};
}
export type SceneCache=ReturnType<typeof createSceneCache>;
