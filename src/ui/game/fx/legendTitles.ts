// Exact DOM typography, measured in idle before a Legend inserts its visible effects.
import {legendCards} from '../../../engine/data';
import type {FxCtx} from './primitives';
const widths=new WeakMap<HTMLElement,Map<string,number>>();
const esc=(s:string)=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]!));
export const titleHTML=(name:string)=>[...name.toUpperCase()].map(c=>`<span>${c===' '?'&nbsp;':esc(c)}</span>`).join('');
export function invalidateTitleWidths(board:HTMLElement):void {widths.delete(board);}
function measure(ctx:FxCtx,names:string[]):Map<string,number>{
 const cache=widths.get(ctx.board)??new Map<string,number>();widths.set(ctx.board,cache);
 const nodes=names.filter(name=>!cache.has(name)).map(name=>{
  const el=ctx.board.ownerDocument.createElement('div');el.className='lg-title';el.innerHTML=titleHTML(name);
  el.style.cssText='position:absolute;left:0;top:0;visibility:hidden;pointer-events:none';
  return {name,el};
 });
 // Insert together, then read together. None of these hidden probes survives the measurement.
 ctx.layer.append(...nodes.map(n=>n.el));
 for(const {name,el}of nodes)cache.set(name,el.offsetWidth);
 for(const {el}of nodes)el.remove();
 return cache;
}
export function prepareTitleWidths(ctx:FxCtx):void {measure(ctx,legendCards(ctx.data).map(c=>c.name));}
export const titleWidth=(ctx:FxCtx,name:string)=>measure(ctx,[name]).get(name)!;
