// The medal's six-second CSS cycle contains one short sweep and two invisible holds.
// Keep its exact keyframes/easing, but let the compositor stop sampling during those holds.
interface Sweep {
  el: HTMLElement;
  epoch: number;
  period: number;
  start: number;
  duration: number;
  frames: Keyframe[];
  easing: string;
  held: number | null;
  animation?: Animation;
  timer?: number;
}
export function watchMedalGlints(board: HTMLElement): () => void {
  const game=board.closest('.game')??board, rows=new Map<HTMLElement,Sweep>();
  let live=true;
  const stop=(r:Sweep)=>{
    clearTimeout(r.timer);r.animation?.cancel();rows.delete(r.el);r.el.classList.remove('medal-scheduled');r.el.style.removeProperty('transform');
  };
  const phase=(r:Sweep,now:number)=>((now-r.epoch)%r.period+r.period)%r.period;
  const run=(r:Sweep)=>{
    if(!live||!r.el.isConnected){stop(r);return;}
    clearTimeout(r.timer);r.animation?.cancel();
    const at=phase(r,r.held??performance.now());
    // Static holds have no live animation. The next deadline is based on the original
    // epoch, so a late timer resumes at the correct point without accumulating drift.
    const moving=at>=r.start&&at<r.start+r.duration;
    r.el.style.transform=String(r.frames[at<r.start?0:1].transform);
    if(moving){
      r.animation=r.el.animate(r.frames,{id:'medal-glint',duration:r.duration,delay:r.start-at,easing:r.easing,fill:'both',composite:'replace'});
      void r.animation.finished.catch(()=>{});
      if(r.held!==null)r.animation.pause();
    }else r.animation=undefined;
    const deadline=at<r.start?r.start:moving?r.start+r.duration:r.period;
    if(r.held===null)r.timer=window.setTimeout(()=>run(r),Math.max(1,deadline-at));
  };
  const take=(el:HTMLElement)=>{
    if(rows.has(el))return;
    const css=el.getAnimations().find(a=>a instanceof CSSAnimation&&a.animationName==='medal-glint');
    if(!(css?.effect instanceof KeyframeEffect))return;
    const timing=css.effect.getTiming(),f=css.effect.getKeyframes();
    if(typeof timing.duration!=='number'||timing.iterations!==Infinity||timing.direction!=='normal')return;
    const at=Number(css.currentTime)-(timing.delay??0);
    // Before a positive initial CSS delay, retain the original unfilled base style.
    if(at<0)return;
    const i=f.findIndex((a,i)=>i<f.length-1&&a.transform!==f[i+1].transform);
    if(i<0||f.slice(0,i+1).some(a=>a.transform!==f[i].transform)||f.slice(i+1).some(a=>a.transform!==f[i+1].transform))return;
    const r:Sweep={el,epoch:performance.now()-at,period:timing.duration,start:f[i].computedOffset*timing.duration,duration:(f[i+1].computedOffset-f[i].computedOffset)*timing.duration,
      frames:[{transform:f[i].transform},{transform:f[i+1].transform}],easing:f[i].easing,held:null};
    rows.set(el,r);el.classList.add('medal-scheduled');css.cancel();run(r);
  };
  const scan=()=>board.querySelectorAll<HTMLElement>('.star .gl,.legend-medal .gl').forEach(take);
  const sync=()=>{
    if(!live)return;
    const now=performance.now();
    for(const r of [...rows.values()]){
      const style=getComputedStyle(r.el);
      if(!r.el.isConnected||!r.el.getClientRects().length||parseFloat(style.animationDuration)===0){stop(r);continue;}
      const held=style.animationPlayState==='paused';
      if(held&&r.held===null){r.held=now;clearTimeout(r.timer);r.animation?.pause();}
      else if(!held&&r.held!==null){r.epoch+=now-r.held;r.held=null;run(r);}
    }
    scan();
  };
  const start=(event:AnimationEvent)=>{
    if(event.animationName==='medal-glint'&&event.target instanceof HTMLElement&&event.target.matches('.star .gl,.legend-medal .gl'))take(event.target);
  };
  board.addEventListener('animationstart',start);
  const observer=new MutationObserver(sync);observer.observe(game,{attributes:true,attributeFilter:['class','data-fx-busy']});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');reduced.addEventListener('change',sync);
  window.addEventListener('resize',sync);scan();
  return ()=>{live=false;observer.disconnect();board.removeEventListener('animationstart',start);reduced.removeEventListener('change',sync);window.removeEventListener('resize',sync);for(const r of [...rows.values()])stop(r);};
}
