// The clips of the ships in motion: a change of places (FLIP), diving and surfacing, sinking, the abilities of the
// ships. A port of docs/mockups/anim/level1/play-misc.js (see PORTING.md): the code is the reference's, what changed is
// how an element is found (the data-fx-* DOM contract), the globals (the context `ctx`) and the types. The rest of
// play-misc.js (the turn, the card, repairs, Powder, Souls, statuses …) comes in A4.
// Changes against the reference («game:»):
//  - renderWith draws the table through React (the queue keeps a preview of D and draws it at once); the planks keep
//    their DOM nodes (key — the code of the ship), so the FLIP animates the same element from its old place.
import type { GameEvent } from '../../../engine/state';
import { SIDE_LABEL } from '../text';
import type { ClipPlayer } from './FxLayer';
import type { SwapClip } from './planFx';
import { A, allPlanks, bx, dirOf, facingY, gapBox, hint, mk, payKegs, plank, splash, wait, type FxCtx } from './primitives';

/** FLIP: remember where the planks stood, draw the table with the events and carry them over with an arc. */
export async function flipTo(ctx: FxCtx, evs: readonly GameEvent[], d = 650, filter: (e: GameEvent) => boolean = () => true): Promise<void> {
  const before: Record<string, ReturnType<typeof bx>> = {};
  for (const el of allPlanks(ctx)) before[el.dataset.fxShip!] = bx(ctx, el);
  ctx.renderWith(evs.filter(filter));
  for (const el of allPlanks(ctx)) {
    const code = el.dataset.fxShip!, b0 = before[code]; if (!b0) continue;
    const b1 = bx(ctx, el), dx = b0.x - b1.x, dy = b0.y - b1.y;
    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) continue;
    const lift = dx > 0 ? 1 : -1;
    A(ctx, el, [{ transform: `translate(${dx}px,${dy}px)` }, { transform: `translate(${dx / 2}px,${dy / 2 + dirOf(ctx, code) * -16 * lift}px) rotate(${lift * 1.5}deg)`, offset: 0.5 }, { transform: 'none' }], d, 0, 'cubic-bezier(.45,0,.3,1)', 'none');
    if (ctx.rich) { const m = bx(ctx, el); for (let q = 0; q < 3; q++) splash(ctx, m.x + m.w * (0.25 + q * 0.25), facingY(ctx, code), d * 0.85 + q * 60); }
  }
  await wait(ctx, d + 80);
}
export const SWAP_LABEL: Record<string, string> = { regroup: 'Перестроение', maelstrom: 'Мальстрём', current: 'Течение', jack: 'Джек ускользает', sword: 'Меч Тритона', card: 'Смена мест', sink: 'Капитан уходит к союзнику' };
export function banner(ctx: FxCtx, text: string, cls = 'small', d = 1200, y?: number): HTMLElement {
  const g = gapBox(ctx);
  const bn = mk(ctx, 'banner ' + cls, ctx.board.clientWidth / 2, y ?? g.cy, text);
  A(ctx, bn, [{ opacity: 0, scale: '0.85' }, { opacity: 1, scale: '1', offset: 0.2 }, { opacity: 1, offset: 0.8 }, { opacity: 0, scale: '1.04' }], d, 0);
  return bn;
}

export const PLAY_MISC: Record<'swap', ClipPlayer> = {} as never;
const PLAY = PLAY_MISC as unknown as {
  swap: (c: SwapClip & { events: GameEvent[] }, ctx: FxCtx) => Promise<void>;
};

PLAY.swap = async (c, ctx) => {
  hint(ctx, `${SIDE_LABEL[c.side].name}: ${SWAP_LABEL[c.reason] || 'смена мест'}`);
  if (c.cost) payKegs(ctx, c.side, c.cost, 0);
  const a = plank(ctx, c.ships[0]);
  banner(ctx, SWAP_LABEL[c.reason] || 'Смена мест', 'small', 1200, (bx(ctx, a).y + bx(ctx, a).b) / 2);
  await wait(ctx, 250);
  await flipTo(ctx, c.events, 650);
  await wait(ctx, 150);
};
