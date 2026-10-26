/** Background transfers never compete on a metered or slow connection. */
export function mayWarmScenes(){
 const connection=(navigator as Navigator&{connection?:{saveData?:boolean;effectiveType?:string}}).connection;
 return !connection?.saveData&&!/^(slow-2g|2g|3g)$/.test(connection?.effectiveType??'');
}
let tail=Promise.resolve();
export function queueSceneWarm(work:()=>Promise<unknown>){
 tail=tail.catch(()=>{}).then(()=>new Promise<void>(resolve=>{
  if(!mayWarmScenes()){resolve();return;}
  const start=()=>{if(document.hidden){resolve();return;}void work().catch(()=>{}).finally(resolve);};
  if(typeof requestIdleCallback==='function')requestIdleCallback(start);else setTimeout(start,1500);
 }));return tail;
}
