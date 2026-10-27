/** Background transfers never compete on a metered or slow connection. */
export function mayWarmScenes(){
 const connection=(navigator as Navigator&{connection?:{saveData?:boolean;effectiveType?:string}}).connection;
 return !connection?.saveData&&!/^(slow-2g|2g|3g)$/.test(connection?.effectiveType??'');
}
let tail=Promise.resolve();
const firstSeen=new WeakMap<Element,number>();
function tableSettling(){const game=document.querySelector('.game');if(!game)return 0;let since=firstSeen.get(game);if(since===undefined){since=performance.now();firstSeen.set(game,since)}return Math.max(0,10000-(performance.now()-since));}
export function queueSceneWarm(work:()=>Promise<unknown>){
 tail=tail.catch(()=>{}).then(()=>new Promise<void>(resolve=>{
  if(!mayWarmScenes()){resolve();return;}
  const start=()=>{if(document.hidden){const visible=()=>{if(!document.hidden){document.removeEventListener('visibilitychange',visible);start();}};document.addEventListener('visibilitychange',visible);return;}const settle=tableSettling();if(settle>0){setTimeout(start,settle);return;}void work().catch(()=>{}).finally(resolve);};
  if(typeof requestIdleCallback==='function')requestIdleCallback(start);else setTimeout(start,1500);
 }));return tail;
}
