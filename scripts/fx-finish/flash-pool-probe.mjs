// Measurement-only A/B experiment. Never included by the production Vite configuration.
// Keep the exact prebuilt .62 gun artwork, IDs and first-use order; only attachment differs.
export function flashPoolProbe(){
 const change=(code,from,to,id)=>{if(!code.includes(from))throw Error('Flash probe hook missing: '+id);return code.replace(from,to);};
 return {name:'fx-finish-flash-pool-probe',enforce:'pre',transform(code,id){
  if(id.endsWith('/fx/sprites.ts')){
   code=change(code,'bank.active.set(root,sprite);host.append(root);return sprite;',`bank.active.set(root,sprite);
    const flash=key==='volley-glow-0.62'||key==='volley-cone-0.62';
    if(root.parentElement===host){root.style.display='';if(flash)window.fxFlashProbe.reveals++;}
    else {host.append(root);if(flash)window.fxFlashProbe.inserts++;}return sprite;`,id);
   return code+`
window.fxFlashProbe={reveals:0,inserts:0};
window.fxPrepareFlashPool=board=>{
 const bank=banks.get(board),layer=board.querySelector(':scope > .fx-layer');
 if(layer.querySelector('[data-flash-parking]'))return;
 const glow=bank.pools.get('volley-glow-0.62'),cone=bank.pools.get('volley-cone-0.62');
 if(!glow||!cone||glow.free.length!==32||cone.free.length!==32)throw Error('Flash probe: pool not ready');
 const plane=document.createElement('div');plane.className='volley-sprite-plane';plane.dataset.flashParking='';
 for(let i=31;i>=0;i--)for(const pool of [glow,cone]){const root=pool.free[i];root.style.display='none';plane.append(root);}
 layer.append(plane);window.fxFlashProbe.parked=64;
};`;
  }
  if(id.endsWith('/fx/volleySprites.ts'))return change(code,'let plane=planes.get(svg);',`let plane=(k===.62&&(kind==='glow'||kind==='cone')?ctx.layer.querySelector<HTMLElement>('[data-flash-parking]'):null)??planes.get(svg);`,id);
  if(id.endsWith('/fx/FxLayer.tsx'))return change(code,'if (!keep.has(el)) el.remove();',"if (!keep.has(el) && !el.hasAttribute('data-flash-parking')) el.remove();",id);
 }};
}
