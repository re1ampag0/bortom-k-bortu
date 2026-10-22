import {describe, expect, it, vi} from 'vitest';
import {A, type FxCtx} from '../src/ui/game/fx/primitives';
describe('Delayed effects keep their requested fill', () => {
  for (const phone of [true, false]) it(`positions a visible SVG child before its delay (phone=${phone})`, () => {
    const animate = vi.fn();
    const ctx = {speed:1,board:{ownerDocument:{defaultView:{matchMedia:()=>({matches:phone})}}}} as unknown as FxCtx;
    const frames = [{transform:'translate(200px,300px) scale(.03)',opacity:1},{opacity:0}];
    A(ctx, {animate} as unknown as Element, frames, 1000, 1800);
    expect(animate).toHaveBeenCalledWith(frames, {duration:1000,delay:1800,easing:'ease-out',fill:'both'});
    A(ctx, {animate} as unknown as Element, frames, 1000, 1800, 'linear', 'forwards');
    expect(animate).toHaveBeenLastCalledWith(frames, {duration:1000,delay:1800,easing:'linear',fill:'forwards'});
  });
});
