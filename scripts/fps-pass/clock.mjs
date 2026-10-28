/** Browser-side capture adapter only. Never bundled into the game. */
export function installDeterministicClock(){
 const epoch=Date.now();Object.defineProperty(performance,'now',{configurable:true,value:()=>Date.now()-epoch});
 const timeout=window.setTimeout.bind(window),interval=window.setInterval.bind(window);
 const invoke=(fn,args)=>{window.__fpsClock?.sync();if(typeof fn==='function')fn(...args);else (0,eval)(fn)};
 window.setTimeout=(fn,delay,...args)=>timeout(()=>invoke(fn,args),delay);
 window.setInterval=(fn,delay,...args)=>interval(()=>invoke(fn,args),delay);
 let seed=19427,randomCalls=0;const randomTrace=[];
 Math.random=()=>{randomCalls++;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const value=seed/4294967296;randomTrace.push({at:performance.now(),value,caller:(new Error().stack??'').split('\n').filter(s=>s.includes('/src/')).slice(0,3)});return value};
 // Use one fixed virtual frame grid across reloads; the browser's initial rAF phase is otherwise wall-clock dependent.
 window.requestAnimationFrame=fn=>setTimeout(()=>{window.__fpsClock?.sync();fn(performance.now())},16-(performance.now()%16));
 window.cancelAnimationFrame=id=>clearTimeout(id);
 window.requestIdleCallback=fn=>setTimeout(()=>fn({didTimeout:false,timeRemaining:()=>50}),1);
 window.cancelIdleCallback=id=>clearTimeout(id);
 const jobs=new Set(),bank=new Map(),svgs=new Map();
 const native={animate:Element.prototype.animate,play:Animation.prototype.play,pause:Animation.prototype.pause,cancel:Animation.prototype.cancel,finish:Animation.prototype.finish,decode:HTMLImageElement.prototype.decode,elementAnimations:Element.prototype.getAnimations,documentAnimations:Document.prototype.getAnimations,state:Object.getOwnPropertyDescriptor(Animation.prototype,'playState').get};
 const promise=row=>{row.finished=new Promise((resolve,reject)=>{row.resolve=resolve;row.reject=reject});row.finished.catch(()=>{});};
 const remember=(animation,css=false)=>{if(!bank.has(animation)){const row={animation,css,at:performance.now(),time:0,held:false,cancelled:false,completed:false};promise(row);bank.set(animation,row);}return bank.get(animation)};
 const finished=Object.getOwnPropertyDescriptor(Animation.prototype,'finished').get;
 Object.defineProperty(Animation.prototype,'finished',{configurable:true,get(){return bank.get(this)?.finished??finished.call(this)}});
 Animation.prototype.finish=function(){const row=bank.get(this);native.finish.call(this);if(row&&!row.completed){row.completed=true;row.resolve(this)}};
 const adopt=animations=>{for(const a of animations)if(!bank.has(a)){const row=remember(a,true);if(document.body?.dataset.fxStart!=='1')row.at=0;native.pause.call(a);a.currentTime=performance.now()-row.at;}return animations};
 Element.prototype.getAnimations=function(...args){return adopt(native.elementAnimations.apply(this,args))};
 Document.prototype.getAnimations=function(...args){return adopt(native.documentAnimations.apply(this,args))};
 Element.prototype.animate=function(...args){const animation=native.animate.apply(this,args);remember(animation);native.pause.call(animation);animation.currentTime=0;return animation};
 Animation.prototype.play=function(){const row=bank.get(this);if(!row)return native.play.call(this);row.at=performance.now();row.time=Number(this.currentTime??row.time);row.held=false;if(row.completed||row.cancelled){row.time=0;this.currentTime=0;row.completed=false;row.cancelled=false;promise(row);}native.pause.call(this)};
 Animation.prototype.pause=function(){const row=bank.get(this);if(row){row.time=Number(this.currentTime??row.time);row.at=performance.now();row.held=true;}return native.pause.call(this)};
 Animation.prototype.cancel=function(){const row=bank.get(this);if(row){row.cancelled=true;if(!row.completed)row.reject(new DOMException('Capture animation cancelled','AbortError'));}return native.cancel.call(this)};
 Object.defineProperty(Animation.prototype,'playState',{configurable:true,get(){const row=bank.get(this);return row?row.cancelled?'idle':row.completed?'finished':row.held?'paused':'running':native.state.call(this)}});
 HTMLImageElement.prototype.decode=function(...args){const job=native.decode.apply(this,args);jobs.add(job);void job.then(()=>jobs.delete(job),()=>jobs.delete(job));return job};
 window.__fpsClock={
  async settle(){for(let i=0;i<20;i++){const pending=[...jobs];if(!pending.length){await Promise.resolve();if(!jobs.size)return;}await Promise.allSettled(pending)}throw Error('Image decode did not settle')},
  sync(){const now=performance.now();
   for(const a of document.getAnimations())if(!bank.has(a)){const row=remember(a,true);row.time=0;native.pause.call(a);a.currentTime=0;}
   for(const row of bank.values()){
    const {animation:a}=row;if(row.cancelled)continue;
    const target=a.effect?.target;if(target&&!target.isConnected)continue;
    let held=row.held;
    if(row.css&&a instanceof CSSAnimation){const paused=getComputedStyle(target).animationPlayState.split(',').every(x=>x.trim()==='paused');if(paused!==row.held){row.time=Number(a.currentTime??0);row.at=now;row.held=paused;}held=paused;}
    const time=row.time+(held?0:(now-row.at)*a.playbackRate),end=a.effect?.getComputedTiming().endTime??Infinity;
    if(Number.isFinite(end)&&time+1e-7>=end){if(!row.completed)try{a.finish()}catch(error){row.finishError=String(error)};}else{native.pause.call(a);a.currentTime=Math.max(0,time);}
   }
   for(const svg of document.querySelectorAll('svg'))if(svg.querySelector('animate,animateTransform,animateMotion')){if(!svgs.has(svg))svgs.set(svg,document.body?.dataset.fxStart==='1'?now:0);svg.pauseAnimations();svg.setCurrentTime((now-svgs.get(svg))/1000);}
  },
  info(){return{time:performance.now(),seed,randomCalls,randomTrace,history:[...bank.values()].map(r=>({at:r.at,css:r.css,tag:r.animation.effect?.target?.tagName,class:r.animation.effect?.target?.getAttribute?.('class'),duration:r.animation.effect?.getTiming().duration,delay:r.animation.effect?.getTiming().delay,cancelled:r.cancelled,completed:r.completed})),animations:bank.size,pendingDecodes:jobs.size,finishErrors:[...bank.values()].filter(r=>r.finishError).map(r=>r.finishError)}},
 };
 // Same 10 ms completion grid, advanced in one CDP call rather than five round trips per recorded frame.
 setInterval(()=>{},10);
}
const protocols=new WeakMap();
export const bindProtocol=(page,cdp)=>protocols.set(page,cdp);
export async function advance(page,ms){
 const cdp=protocols.get(page);
 if(cdp)await cdp.send('Animation.setPlaybackRate',{playbackRate:.1});
 await page.clock.runFor(ms);
 if(cdp)await cdp.send('Animation.setPlaybackRate',{playbackRate:0});
 await page.evaluate(async()=>{await window.__fpsClock.settle();window.__fpsClock.sync()});
}
