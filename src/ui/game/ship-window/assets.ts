import catalogue from './catalogue.json';
const files=import.meta.glob('./art/*',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
export const shipArt=(name:string)=>files['./art/'+name];
const base=new Map<string,Promise<void>>();
export function prepareShipWindow(code?:string):Promise<void>{
 const names=code?[(catalogue as Record<string,{name:string}>)[code].name]:Object.values(catalogue).map(x=>x.name);
 return Promise.all(Object.entries(files).filter(([key])=>names.some(name=>key.startsWith('./art/'+name+'-'))&&!key.includes('-live-')&&!key.includes('-asset-')).map(([,url])=>{
  let p=base.get(url);if(!p){const image=new Image();image.src=url;p=image.decode().then(()=>{});base.set(url,p);}return p;
 })).then(()=>{});
}
// Retain decoded particle images for one live scene, not four retina panoramas at once.
const images=new Map<string,HTMLImageElement>();
let current='';
export async function prepareSceneImages(code:string,paths:string[]):Promise<void>{
 if(current!==code){images.clear();current=code;}
 await Promise.all([...new Set(paths)].map(async path=>{
  if(images.has(path))return;const image=new Image();image.src=shipArt(path);await image.decode();if(current===code)images.set(path,image);
 }));
}
export const sceneImage=(path:string)=>images.get(path);
