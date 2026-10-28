/** Background transfers never compete on a metered or slow connection. */
export function mayWarmScenes(){
 const connection=(navigator as Navigator&{connection?:{saveData?:boolean;effectiveType?:string}}).connection;
 return !connection?.saveData&&!/^(slow-2g|2g|3g)$/.test(connection?.effectiveType??'');
}
let lastInput=-Infinity,listening=false;
const pressed=new Set<number>();
function listen(){
 if(listening)return;listening=true;
 const input=()=>{lastInput=performance.now();};
 window.addEventListener('pointerdown',event=>{pressed.add(event.pointerId);input();},{capture:true,passive:true});
 for(const event of ['pointerup','pointercancel'])window.addEventListener(event,event=>{pressed.delete((event as PointerEvent).pointerId);input();},{capture:true,passive:true});
 window.addEventListener('blur',()=>pressed.clear());
 for(const event of ['keydown','wheel','touchmove'])window.addEventListener(event,input,{capture:true,passive:true});
}
// Install before the first interaction, not halfway through a held pointer when the first job arrives.
if(typeof window!=='undefined')listen();
/** Recheck at the idle callback itself, not only when the work was enqueued. */
export function sceneIdleWork(work:()=>Promise<unknown>,windowSensitive=false,tableDelay=true,alive=()=>true):Promise<void>{
 listen();return new Promise(resolve=>{
  const schedule=()=>{if(typeof requestIdleCallback==='function')requestIdleCallback(start);else setTimeout(start,50);};
  const start=()=>{
   if(!alive()){resolve();return;}
   if(document.hidden){const visible=()=>{if(!document.hidden){document.removeEventListener('visibilitychange',visible);schedule();}};document.addEventListener('visibilitychange',visible);return;}
   const settle=tableDelay?tableSettling():0,busy=!!document.querySelector('.game[data-fx-busy],.game.fx-busy'),input=Math.max(0,200-(performance.now()-lastInput));
   if(settle||busy||input||pressed.size||windowSensitive&&document.querySelector('.ship-window-backdrop,.weather-window-backdrop')){setTimeout(schedule,Math.max(settle,input,100));return;}
   void work().catch(()=>{}).finally(resolve);
  };schedule();
 });
}
let tail=Promise.resolve();
const firstSeen=new WeakMap<Element,number>();
function tableSettling(){const game=document.querySelector('.game');if(!game)return 0;let since=firstSeen.get(game);if(since===undefined){since=performance.now();firstSeen.set(game,since)}return Math.max(0,10000-(performance.now()-since));}
export function queueSceneWarm(work:()=>Promise<unknown>){
 tail=tail.catch(()=>{}).then(()=>mayWarmScenes()?sceneIdleWork(work,true):undefined);return tail;
}
