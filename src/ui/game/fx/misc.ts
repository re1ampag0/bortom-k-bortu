// The clips of the ships in motion: a change of places (FLIP), diving and surfacing, sinking, the abilities of the
// ships. A port of docs/mockups/anim/level1/play-misc.js (see PORTING.md): the code is the reference's, what changed is
// how an element is found (the data-fx-* DOM contract), the globals (the context `ctx`) and the types. The rest of
// play-misc.js — the start and the end of a turn, the card, repairs, Powder, Souls, statuses, drawing, the end (A4).
// Changes against the reference («game:»):
//  - renderWith draws the table through React (the queue keeps a preview of D and draws it at once); the planks keep
//    their DOM nodes (key — the code of the ship), so the FLIP animates the same element from its old place;
//  - the reference draws the table anew after each clip, so the animations of a plank with fill 'forwards' go with
//    its old node; in the game the node stays, so the queue cancels the finished animations of the planks after the
//    clip (FxLayer.tsx). The steady look («Под водой», sunk) is the class of the plank from the displayed state;
//  - the card: an own card is already out of the real hand, it flies from the hand row (cardOrigin); a card the viewer
//    may not see (HIDDEN) flies face down; no ribbon under it — the card has a bottom strip of the colour of the ship
//    that played it with its name («ГОЛЛАНДЕЦ», «ЛЕГЕНДА · МЕСТЬ»), see flyCard; statusFx uses the plank's own chips (React), see statusFx;
//  - the start of a turn: the hand is the real one, so the drawn cards are in it already: drawFx finds them by the codes
//    of drew.cards; «Ваш ход» only when the bottom team is played from this device (ctx.own), not in a match of bots;
//  - PLAY.ability: the branch «limitRaised» of the effects calls statusFx, ported in A4. The engine does not send it
//    inside an ability now («Казна» sends only «treasury»): tests/fx-motion.test.ts checks it on bot games. «restored»
//    comes with «Джонс свободен» (a card sinks «Голландец»): repairFx is ported here.
import { deckCards, seaCards } from '../../../engine/data';
import { cardByCode, shipData, TRACK_NAME, type GameEvent } from '../../../engine/state';
import type { Side, Track } from '../../../engine/types';
import { HIDDEN } from '../../../engine/view';
import { SIDE_LABEL } from '../text';
import type { ClipPlayer, FxScene } from './FxLayer';
import { clearScars, plankScars, scar, seaScars } from './scars';
import { CELLS } from '../art/cells';
import { uidSvg } from '../art/bigShips';
import { T } from './timing';
import {
  KIND_BY_TRACK, type AbilityClip, type CardClip, type DiceClip, type DiscardClip, type DiveClip, type DrawClip, type EndClip, type FallbackClip,
  type FireClip, type FireOutClip, type ImpactClip, type PassClip, type PeekClip, type PowderClip, type RepairClip,
  type SellClip, type SinkClip, type SoulsClip, type StatusClip, type StealClip, type SurfaceClip, type SwapClip, type TurnClip, type TurnEndClip,
} from './planFx';
import {
  A, allPlanks, at, badgeMark, burst, bx, cardOrigin, clamp, fireGroup, fireWall, filters, flameEl, flashBoard, hitBlast, qpts, ringSvg, room, splintersSvg, sv, waterColumn, boom, type Box, fxSvg, handCardPos, isPhone, rnd, smokeColumn, smolderEl, sparksSvg, trackEl, curve, dirOf, facingY, flash, fly, flyCard, fxPoint, gainKegs, gapBox, hint, holdEl,
  isTop, mk, overlayAt, payKegs, pillAt, plank, projectile, ring, setTrack, shake, shownTrack, sideOf, soulsFly, splash, steam, tag, trackMark, visible, wait,
  wisp, type FlyCard, type FxCtx, type Pt,
} from './primitives';

const R1 = (n: number) => Math.round(n * 10) / 10;

/** FLIP: remember where the planks stood, draw the table with the events and carry them over with an arc. */
export interface FlipMove {
  code: string;
  from: Box;
  to: Box;
}
/**
 * FLIP: remember where the planks stood, draw the table with the events and carry them over with an arc. FX-D: `delay` —
 * the planks wait at their old places (the course of «Перестроение» is plotted first); `arc` — how far the k-th moving
 * plank swings toward the gap (negative — outward); `onMoves` — the moves, measured before they start.
 */
export async function flipTo(ctx: FxCtx, evs: readonly GameEvent[], d = 650, filter: (e: GameEvent) => boolean = () => true, opt: { delay?: number; arc?: (code: string, k: number) => number; onMoves?: (moves: FlipMove[]) => void } = {}): Promise<void> {
  const delay = opt.delay ?? 0, moves: FlipMove[] = [];
  const before: Record<string, ReturnType<typeof bx>> = {};
  for (const el of allPlanks(ctx)) before[el.dataset.fxShip!] = bx(ctx, el);
  ctx.renderWith(evs.filter(filter));
  for (const el of allPlanks(ctx)) {
    const code = el.dataset.fxShip!, b0 = before[code]; if (!b0) continue;
    const b1 = bx(ctx, el), dx = b0.x - b1.x, dy = b0.y - b1.y;
    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) continue;
    const lift = dx > 0 ? 1 : -1;
    const midY = opt.arc ? dy / 2 + dirOf(ctx, code) * opt.arc(code, moves.length) : dy / 2 + dirOf(ctx, code) * -16 * lift;
    moves.push({ code, from: b0, to: b1 });
    A(ctx, el, [{ transform: `translate(${dx}px,${dy}px)` }, { transform: `translate(${dx / 2}px,${midY}px) rotate(${lift * 1.5}deg)`, offset: 0.5 }, { transform: 'none' }], d, delay, 'cubic-bezier(.45,0,.3,1)', delay ? 'backwards' : 'none');
    if (ctx.rich) { const m = bx(ctx, el); for (let q = 0; q < 3; q++) splash(ctx, m.x + m.w * (0.25 + q * 0.25), facingY(ctx, code), delay + d * 0.85 + q * 60); }
  }
  opt.onMoves?.(moves);
  await wait(ctx, delay + d + 80);
}
export const SWAP_LABEL: Record<string, string> = { regroup: 'Перестроение', maelstrom: 'Мальстрём', current: 'Течение', jack: 'Джек ускользает', sword: 'Меч Тритона', card: 'Смена мест', sink: 'Капитан уходит к союзнику' };
export function banner(ctx: FxCtx, text: string, cls = 'small', d = 1200, y?: number): HTMLElement {
  const g = gapBox(ctx);
  const bn = mk(ctx, 'banner ' + cls, ctx.board.clientWidth / 2, y ?? g.cy, text);
  A(ctx, bn, [{ opacity: 0, scale: '0.85' }, { opacity: 1, scale: '1', offset: 0.2 }, { opacity: 1, offset: 0.8 }, { opacity: 0, scale: '1.04' }], d, 0);
  return bn;
}

const nick = (ctx: FxCtx, code: string) => `«${shipData(ctx.data, code).nick}»`;
const gen = (ctx: FxCtx, code: string) => `«${shipData(ctx.data, code).nickGenitive}»`;
const dat = (ctx: FxCtx, code: string) => `«${shipData(ctx.data, code).nickDative}»`;

/** The card being played: it lies at the middle of the table until it resolves (a Reaction window may come between). */
let CUR_CARD: { el: FlyCard; code: string } | null = null;
/** For PLAY.cancel (volley.ts): the card cancelled crumbles. */
export const curCard = () => CUR_CARD;

export const PLAY_MISC: Record<'swap' | 'sink' | 'dive' | 'surface' | 'ability' | 'turn' | 'turnEnd' | 'draw' | 'card' | 'impact' | 'fire' | 'repair'
  | 'powder' | 'souls' | 'status' | 'sell' | 'pass' | 'steal' | 'discard' | 'peek' | 'dice' | 'fireOut' | 'end' | 'fallback', ClipPlayer> = {} as never;
const PLAY = PLAY_MISC as unknown as {
  card: (c: CardClip, ctx: FxCtx) => Promise<void>;
  impact: (c: ImpactClip, ctx: FxCtx) => Promise<void>;
  fire: (c: FireClip, ctx: FxCtx) => Promise<void>;
  repair: (c: RepairClip, ctx: FxCtx) => Promise<void>;
  powder: (c: PowderClip, ctx: FxCtx) => Promise<void>;
  souls: (c: SoulsClip, ctx: FxCtx) => Promise<void>;
  status: (c: StatusClip, ctx: FxCtx) => Promise<void>;
  sell: (c: SellClip, ctx: FxCtx) => Promise<void>;
  pass: (c: PassClip, ctx: FxCtx) => Promise<void>;
  steal: (c: StealClip, ctx: FxCtx) => Promise<void>;
  discard: (c: DiscardClip, ctx: FxCtx) => Promise<void>;
  peek: (c: PeekClip, ctx: FxCtx) => Promise<void>;
  dice: (c: DiceClip, ctx: FxCtx) => Promise<void>;
  fireOut: (c: FireOutClip, ctx: FxCtx) => Promise<void>;
  end: (c: EndClip, ctx: FxCtx) => Promise<void>;
  fallback: (c: FallbackClip, ctx: FxCtx) => Promise<void>;
  turn: (c: TurnClip & { events: GameEvent[] }, ctx: FxCtx) => Promise<void>;
  turnEnd: (c: TurnEndClip, ctx: FxCtx) => Promise<void>;
  draw: (c: DrawClip, ctx: FxCtx) => Promise<void>;
  swap: (c: SwapClip & { events: GameEvent[] }, ctx: FxCtx) => Promise<void>;
  sink: (c: SinkClip & { events: GameEvent[] }, ctx: FxCtx) => Promise<void>;
  dive: (c: DiveClip, ctx: FxCtx) => Promise<void>;
  surface: (c: SurfaceClip, ctx: FxCtx) => Promise<void>;
  ability: (c: AbilityClip, ctx: FxCtx) => Promise<void>;
};

PLAY.swap = async (c, ctx) => {
  hint(ctx, `${SIDE_LABEL[c.side].name}: ${SWAP_LABEL[c.reason] || 'смена мест'}`);
  if (c.cost) payKegs(ctx, c.side, c.cost, 0);
  const a = plank(ctx, c.ships[0]);
  banner(ctx, SWAP_LABEL[c.reason] || 'Смена мест', 'small', 1200, (bx(ctx, a).y + bx(ctx, a).b) / 2);
  // FX-D (fxSwap of fx3.js; T.swap): the course is plotted in ink with a compass stamp (on the sea, under the planks), one
  // ship goes through the gap, the other a little outward, each leaves a wake; they settle with a bob and rings
  const S = T.swap, sea = seaScars(ctx), ink = sea ? scar(fxSvg(ctx, sea), 'short') : fxSvg(ctx);
  let moved: FlipMove[] = [];
  await flipTo(ctx, c.events, S.sail, undefined, {
    delay: S.plot,
    arc: (_code, k) => (k === 0 ? 88 : -24),
    onMoves: (moves) => {
      moved = moves;
      moves.forEach((m, k) => {
        const toGap = dirOf(ctx, m.code), edge = (b: Box) => (toGap > 0 ? b.b : b.y);
        const x0 = m.from.cx, y0 = edge(m.from), x1 = m.to.cx, y1 = edge(m.to), cy = Math.max(y0, y1) * (toGap > 0 ? 1 : 0) + Math.min(y0, y1) * (toGap > 0 ? 0 : 1) + toGap * (k === 0 ? 88 : -24) * 1.6;
        const dd = `M${x0.toFixed(1)} ${y0.toFixed(1)} Q${((x0 + x1) / 2).toFixed(1)} ${cy.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
        const course = sv(ink, `<path d="${dd}" fill="none" stroke="#1f1a14" stroke-width="2.2" stroke-linecap="round" opacity=".85"/>`) as SVGPathElement;
        const L = course.getTotalLength();
        course.style.strokeDasharray = `${L}`;
        A(ctx, course, [{ strokeDashoffset: L }, { strokeDashoffset: 0 }], S.course, k * 200, 'ease-in-out', 'both');
        const head = sv(ink, '<path d="M-7 -5 L2 0 L-7 5" fill="none" stroke="#1f1a14" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>');
        const ang = (Math.atan2(y1 - cy, x1 - (x0 + x1) / 2) * 180) / Math.PI;
        A(ctx, head, [{ transform: `translate(${x1}px,${y1}px) rotate(${ang}deg)`, opacity: 0 }, { transform: `translate(${x1}px,${y1}px) rotate(${ang}deg)`, opacity: 0.85 }], 200, k * 200 + S.course);
        const wake = sv(ink, `<path d="${dd}" fill="none" stroke="#eef6f8" stroke-width="3" stroke-linecap="round" opacity=".8"/>`) as SVGPathElement;
        wake.style.strokeDasharray = `${L}`;
        A(ctx, wake, [{ strokeDashoffset: L, opacity: 0.8 }, { strokeDashoffset: 0, opacity: 0.8, offset: 0.85 }, { strokeDashoffset: 0, opacity: 0 }], S.sail + S.fade, S.plot, 'ease-in-out', 'both');
        if (k === 0) {
          const st = sv(ink, '<g><circle r="16" fill="#efe3c8" stroke="#1f1a14" stroke-width="1.4"/><path d="M0 -13 L3 0 L0 13 L-3 0 Z" fill="#1f1a14"/><path d="M-13 0 L0 -3 L13 0 L0 3 Z" fill="#8e2b22"/></g>');
          const mx = (x0 + x1) / 2, my = (y0 + cy) / 2;
          A(ctx, st, [{ transform: `translate(${mx}px,${my}px) scale(2.4)`, opacity: 0 }, { transform: `translate(${mx}px,${my}px) scale(1)`, opacity: 1 }], S.stamp, S.course, 'cubic-bezier(.6,0,.9,.5)');
        }
      });
    },
  });
  // they settle with a bob; rings run out on the water; the course fades
  for (const m of moved) {
    const el = plank(ctx, m.code), toGap = dirOf(ctx, m.code);
    A(ctx, el, [{ translate: '0 0' }, { translate: `0 ${toGap * 4}px` }, { translate: `0 ${-toGap * 1.5}px` }, { translate: '0 0' }], S.settle, 0, 'ease-out', 'none');
    for (let i = 0; i < 2; i++) ringSvg(ctx, fxSvg(ctx), m.to.cx, facingY(ctx, m.code) + toGap * 10, 20, Math.min(200, m.to.w * 0.4) - i * 50, '#eef6f8', 1000, i * 200, 1.6);
  }
  A(ctx, ink, [{ opacity: 1 }, { opacity: 0 }], S.fade, 0, 'ease-out', 'forwards');
  await wait(ctx, S.settle + 150);
};

/** The captain of A5: the icon of the Crew in a red coat and a cocked hat (fxSink of fx3.js). */
const SAILOR = CELLS.CREW.replace(/<svg[^>]*>/, '').replace('</svg>', '');
const CAPTAIN = SAILOR.replace('fill="#ece4d0"', 'fill="#8a1c14"').replace(/fill="#3a2a22"/g, 'fill="#5a1410"').replace('fill="#9b2a1f"', 'fill="#1c1814"').replace('fill="#7e1f16"', 'fill="none"').replace('stroke="#4e120c" stroke-width=".25"', 'stroke="none"')
  + '<path d="M1.2 4.8 Q7 -1.8 12.8 4.8 Q10.2 3.4 7 4.2 Q3.8 3.4 1.2 4.8 Z" fill="#1c1814" stroke="#e0bd62" stroke-width=".45"/><path d="M6.4 2.2 L7 1.4 L7.6 2.2 Z" fill="#e0bd62"/>';
const OAR = '<g class="oar"><path d="M0 0 L22 9" stroke="#6b4422" stroke-width="1.6" stroke-linecap="round"/><path d="M19 7.6 L27 11.4 L26 13.4 L18.4 9.6 Z" fill="#8a5a32" stroke="#2a1a0c" stroke-width=".5"/></g>';
const DEBRIS = [
  '<rect x="-9" y="-2.4" width="18" height="4.8" rx="1" fill="#a8703a" stroke="#3a2412" stroke-width=".7"/>',
  '<g><ellipse rx="6" ry="7.4" fill="#8a5a32" stroke="#3a2412" stroke-width=".7"/><path d="M-6 -2.4 H6 M-6 2.4 H6" stroke="#3a3530" stroke-width="1.1"/></g>',
  '<rect x="-16" y="-1.6" width="32" height="3.2" rx="1" fill="#6b4422" stroke="#22190f" stroke-width=".6"/>',
  '<path d="M-6 -5 L6 -3 L4 5 L-5 4 Z" fill="#e8dcc0" stroke="#22190f" stroke-width=".6"/>',
];
/** A half of the plank for the break: a copy of the plank in the layer (no data-fx-*, no test ids — it is not a ship). */
function planHalf(ctx: FxCtx, el: HTMLElement, b: Box, clip: string, origin: string, jag: string): HTMLElement {
  const c = el.cloneNode(true) as HTMLElement;
  for (const n of [c, ...c.querySelectorAll<HTMLElement>('*')]) for (const a of [...n.attributes]) if (/^data-(fx|testid|ship)|^id$|^tabindex$/.test(a.name)) n.removeAttribute(a.name);
  c.classList.add('fx-half');
  Object.assign(c.style, { position: 'absolute', left: `${b.x}px`, top: `${b.y}px`, width: `${b.w}px`, height: `${b.h}px`, margin: '0', boxSizing: 'border-box', clipPath: clip, transformOrigin: origin, opacity: '1', pointerEvents: 'none' });
  c.insertAdjacentHTML('beforeend', `<div class="fx-sinkwater"></div><svg class="fx-breakedge" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${jag}" fill="none" stroke="#1c0c04" stroke-width="7" vector-effect="non-scaling-stroke" stroke-linejoin="round"/><polyline points="${jag}" fill="none" stroke="#ff8a2a" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" opacity=".9"/></svg>`);
  ctx.layer.appendChild(c);
  return c;
}

/**
 * A ship goes down (fxSink of fx3.js, ANIMATIONS.md §3.8): three last hits along the plank → the fire takes hold, black
 * smoke → the powder room goes up (a fireball, two shockwaves, a hard shake, wreckage flying in arcs into the sea) → the
 * hull breaks in two along a torn line, the halves tilt into a V and go under, the water closes over them, bubbles, a
 * swirl → the plank comes back grey (the table is drawn with the clip's events) and the stamp «Затонул» falls with dust →
 * the wreck stays on the water (a long trace) → the captain rows to the ally in a longboat (when the ally is afloat, as
 * before). The timings — T.sink (fx/timing.ts).
 */
PLAY.sink = async (c, ctx) => {
  const S = T.sink, el = plank(ctx, c.ship), b = bx(ctx, el), up = isTop(ctx, c.ship) ? false : true; // up: the gap is above (a bottom-row ship)
  const fy = facingY(ctx, c.ship), toGap = up ? -1 : 1, small = isPhone(ctx);
  hint(ctx, `${nick(ctx, c.ship)} тонет`);
  const svg = fxSvg(ctx), group = fireGroup(ctx);
  // 1. the last hits run along the plank
  for (let i = 0; i < 3; i++) {
    const t = i * S.hit, x = b.x + b.w * (0.22 + i * 0.28), y = b.y + rnd(Math.min(24, b.h / 3), Math.max(b.h / 3 + 1, b.h - 18));
    hitBlast(ctx, svg, x, y, small ? 0.7 : 0.95, t, 520, i > 0);
    boom(ctx, 5, 300, t);
    flashBoard(ctx, '#fff2d0', 0.18, 220, t);
    A(ctx, el, [{ scale: '1' }, { scale: '1.02 .98', offset: 0.2 }, { scale: '1' }], 300, t, 'ease-out', 'none');
  }
  // the fire takes hold, black smoke goes up, the plank browns
  const tFire = 3 * S.hit;
  fireWall(ctx, svg, b.x + 8, b.r - 8, b.b + 2, small ? 20 : 30, { delay: tFire, spread: 22, embers: 16, life: S.take + S.blast + 900, host: group });
  smokeColumn(ctx, svg, b.cx - b.w * 0.2, b.y + 8, small ? 0.8 : 1.3, 6, 600, tFire);
  smokeColumn(ctx, svg, b.cx + b.w * 0.18, b.y + 8, small ? 0.8 : 1.2, 6, 650, tFire);
  const browning = A(ctx, el, [{ filter: 'none' }, { filter: 'sepia(.6) saturate(1.6) brightness(1.05)' }], 900, tFire, 'ease-out', 'forwards');
  let hidden: Animation | null = null;
  // 2. the powder room goes up: a fireball, two shockwaves, a white flash; wreckage flies into the sea
  const tBlast = tFire + S.take, cx = b.cx, cy = b.cy;
  flashBoard(ctx, '#ffe0b0', 0.6, 520, tBlast);
  boom(ctx, small ? 6 : 11, 650, tBlast);
  hitBlast(ctx, svg, cx, cy, small ? 1.6 : 2.6, tBlast, 700);
  for (const [r0, r1, color, d, dl, w] of [[20, 260, '#fff2c8', 700, 0, 5], [10, 380, '#ffd27a', 1000, 120, 2]] as const) {
    const ring = sv(svg, `<circle r="${r1}" fill="none" stroke="${color}" stroke-width="${w}" vector-effect="non-scaling-stroke"/>`);
    A(ctx, ring, [{ transform: `translate(${cx}px,${cy}px) scale(${r0 / r1})`, opacity: 1 }, { transform: `translate(${cx}px,${cy}px) scale(${small ? 0.5 : 1})`, opacity: 0 }], d, tBlast + dl, 'cubic-bezier(.1,.8,.3,1)');
  }
  const W = ctx.board.clientWidth, H = ctx.board.clientHeight;
  for (let i = 0, m = Math.max(4, room(ctx, small ? 6 : 12)); i < (ctx.rich ? m : 0); i++) {
    const ex = clamp(cx + rnd(-260, 260) * (small ? 0.5 : 1), 12, W - 12), ey = clamp(fy + toGap * rnd(14, 90), 12, H - 12);
    const g = sv(svg, DEBRIS[i % 4]), d = S.debris * rnd(0.82, 1.18), rot = rnd(-720, 720);
    const pts = qpts(cx + rnd(-30, 30), cy, (cx + ex) / 2, Math.min(cy, ey) - rnd(80, 170), ex, ey, 18);
    A(ctx, g, pts.map((p, k) => ({ transform: `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px) rotate(${((rot * k) / 18).toFixed(0)}deg)`, opacity: k === 18 ? 0 : 1 })), d, tBlast, 'cubic-bezier(.3,.1,.7,1)');
    at(ctx, tBlast + d, () => waterColumn(ctx, svg, ex, ey, 24));
  }
  // 3. the hull breaks in two along a jagged line; the halves tilt into a V and sink, darkening under the water
  const tSplit = tBlast + S.blast;
  A(ctx, group, [{ opacity: 1 }, { opacity: 0 }], 900, tSplit, 'ease-in', 'forwards');
  const jag = '50% 0, 46% 16%, 53% 33%, 46% 50%, 54% 67%, 47% 84%, 52% 100%', jagPts = jag.replace(/%/g, '').split(', ').map((p) => p.replace(' ', ',')).join(' ');
  const sy = up ? -1 : 1, D = S.split;
  at(ctx, tSplit, () => {
    const bb = bx(ctx, el);
    const L = planHalf(ctx, el, bb, `polygon(0 0, ${jag}, 0 100%)`, '0% 50%', jagPts), R = planHalf(ctx, el, bb, `polygon(${jag}, 100% 100%, 100% 0)`, '100% 50%', jagPts);
    hidden = A(ctx, el, [{ opacity: 1 }, { opacity: 0 }], 60, 0, 'linear', 'forwards');
    for (const [h, dx] of [[L, -1], [R, 1]] as const) {
      A(ctx, h, [{ translate: '0 0', rotate: '0deg', scale: '1', filter: 'sepia(.6) brightness(1)' }, { translate: `${12 * dx}px 0`, rotate: `${-8 * sy * dx}deg`, scale: '1', offset: 0.25, filter: 'sepia(.4) brightness(.9)' }, { translate: `${20 * dx}px ${10 * -toGap}px`, rotate: `${-14 * sy * dx}deg`, scale: '.9', filter: 'grayscale(.6) brightness(.55)', opacity: 0 }], D, 0, 'cubic-bezier(.5,0,.7,1)', 'forwards');
      A(ctx, h.querySelector('.fx-sinkwater')!, [{ opacity: 0, backgroundPosition: '0 100%' }, { opacity: 0, offset: 0.2 }, { opacity: 0.9, backgroundPosition: '0 0' }], D, dx > 0 ? 120 : 0, 'ease-in', 'forwards');
    }
  });
  splintersSvg(ctx, svg, cx, cy, 16, tSplit);
  sparksSvg(ctx, svg, cx, cy, 14, tSplit);
  boom(ctx, 6, 400, tSplit);
  // the water boils and closes: bubbles, a swirl, rings
  // the rings narrow by the same share on a phone (70 − 3·26 was a negative radius)
  const swR = (i: number) => R1((small ? 70 : 140) * (1 - (i * 26) / 140));
  const sw = sv(svg, `<g>${[0, 1, 2, 3].map((i) => `<ellipse rx="${swR(i)}" ry="${R1(swR(i) * 0.34)}" fill="none" stroke="#e6f2f4" stroke-width="${2 - i * 0.3}" stroke-dasharray="14 10" opacity="${0.8 - i * 0.12}"/>`).join('')}</g>`);
  A(ctx, sw, [{ transform: `translate(${cx}px,${fy + toGap * 20}px) rotate(0deg)`, opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.75 }, { transform: `translate(${cx}px,${fy + toGap * 20}px) rotate(-200deg)`, opacity: 0 }], D + 1400, tSplit, 'linear');
  for (let i = 0, m = room(ctx, small ? 16 : 40); i < m; i++) {
    const x = b.x + rnd(10, b.w - 10), bub = sv(svg, `<circle r="${rnd(1.6, 4.4).toFixed(1)}" fill="rgba(220,244,248,.18)" stroke="#dff4f8" stroke-width="1"/>`);
    A(ctx, bub, [{ transform: `translate(${x.toFixed(1)}px,${(b.y + rnd(10, b.h)).toFixed(1)}px)`, opacity: 0 }, { opacity: 1, offset: 0.2 }, { transform: `translate(${(x + rnd(-8, 8)).toFixed(1)}px,${(b.y + rnd(-30, 20)).toFixed(1)}px)`, opacity: 0 }], rnd(900, 1500), tSplit + rnd(400, D));
  }
  for (let i = 0; i < 4; i++) ringSvg(ctx, svg, cx, fy + toGap * 8, 30, (small ? 150 : 300) - i * 40, '#cfe8ef', 1600, tSplit + 700 + i * 380, 2);
  // 4. the plank comes back as a grey record of the loss (the table drawn with the events of the clip); the stamp falls
  const tBack = tSplit + D + S.settle;
  at(ctx, tBack, () => {
    ctx.renderWith(c.events);
    // the plank's own look of a sunk ship (its class) comes back: the browning and the hiding of the clip go
    browning.cancel();
    hidden?.cancel();
    A(ctx, el, [{ opacity: 0 }, { opacity: 1 }], S.back, 0, 'ease-out', 'none');
  });
  const st = mk(ctx, 'stamp-fx sunk', b.cx, b.cy, 'Затонул');
  A(ctx, st, [{ opacity: 0, transform: 'translate(-50%,-50%) rotate(-7deg) scale(2.8)' }, { opacity: 1, transform: 'translate(-50%,-50%) rotate(-7deg) scale(.94)', offset: 0.7 }, { opacity: 1, transform: 'translate(-50%,-50%) rotate(-7deg) scale(1)' }], S.stamp, tBack + 500, 'cubic-bezier(.5,0,.8,.4)');
  at(ctx, tBack + 500 + S.stamp, () => {
    for (let i = 0, m = room(ctx, 7); i < m; i++) {
      const p = sv(svg, `<circle r="${rnd(6, 12).toFixed(1)}" fill="#d9c9a4" opacity=".7"/>`), dx = rnd(-30, 30);
      A(ctx, p, [{ transform: `translate(${b.cx + dx * 0.3}px,${b.cy + 10}px) scale(.2)`, opacity: 0 }, { transform: `translate(${b.cx + dx}px,${b.cy + 6}px) scale(1)`, opacity: 0.7, offset: 0.2 }, { transform: `translate(${b.cx + dx}px,${b.cy - 4}px) scale(1.6)`, opacity: 0 }], 1000, i * 40);
    }
    boom(ctx, 3, 200);
  });
  // the wreck stays afloat a while: a broken mast with a scrap of sail, a barrel, planks (a long trace of the sea)
  at(ctx, tBack, () => {
    const host = seaScars(ctx);
    if (!host) return;
    const deb = fxSvg(ctx, host), wx = b.cx - (small ? 30 : 60), wy = fy + toGap * 34, rock = filters(ctx);
    sv(deb, `<g transform="translate(${wx.toFixed(1)} ${wy.toFixed(1)}) scale(${small ? 1 : 1.5})">${([[0, 0, 'mast', 3.6], [70, 6, 'barrel', 2.8], [-60, 10, 'plank', 3], [130, -4, 'plank', 3.4], [40, -12, 'plank', 2.6]] as const).map(([x, y, k, d2]) => `<g transform="translate(${x} ${y})"><g>${rock ? `<animateTransform attributeName="transform" type="rotate" values="-6;6;-6" dur="${d2}s" repeatCount="indefinite"/>` : ''}<ellipse cx="0" cy="4" rx="16" ry="3.4" fill="none" stroke="#e6f2f4" stroke-width="1" opacity=".6"/>${k === 'mast' ? '<rect x="-24" y="-2" width="48" height="4" rx="1.4" fill="#6b4422" stroke="#22190f" stroke-width=".8"/><path d="M-8 -2 L4 -16 L14 -2 Z" fill="#e8dcc0" stroke="#22190f" stroke-width=".7"/>' : k === 'barrel' ? '<ellipse rx="8" ry="6.4" fill="#8a5a32" stroke="#22190f" stroke-width=".8"/><path d="M-3 -6 V6 M3 -6 V6" stroke="#3a3530" stroke-width="1.2"/>' : '<rect x="-11" y="-2.6" width="22" height="5.2" rx="1" fill="#a8703a" stroke="#22190f" stroke-width=".7"/>'}</g></g>`).join('')}</g>`);
    A(ctx, deb, [{ opacity: 0 }, { opacity: 1 }], 900);
    scar(deb, 'long', c.ship);
  });
  // 5. the captain rows across to the ally in a longboat: two sailors at the oars, the captain in the stern in a red coat
  //    and a cocked hat, a lantern on the bow, the pennant at the stern; every stroke leaves rings, a wake behind
  const ally = Object.keys(ctx.display.ships).find((x) => sideOf(ctx, x) === sideOf(ctx, c.ship) && x !== c.ship && !ctx.display.ships[x].sunk);
  let end = tBack + 500 + S.stamp + S.end;
  if (ally) {
    const ab = bx(ctx, plank(ctx, ally)), fa = facingY(ctx, ally);
    const x0 = b.cx, y0 = fy + toGap * 30, x1 = ab.cx, y1 = fa + toGap * 30, flip = x1 < x0 ? -1 : 1, k = small ? 1.1 : 1.7;
    const man = (x: number, kk: number, body: string) => `<g transform="translate(${(x - 7 * kk).toFixed(1)} ${(-0.6 - 16.8 * kk).toFixed(1)}) scale(${kk})">${body}</g>`;
    const live = filters(ctx);
    const t0 = tBack + S.back, D2 = S.boat, N = 24;
    // A5 (A8): the new clinker-built boat of fxSink — a shadow and a reflection on the water, the planking in strakes with rivets,
    // the gunwale and the stem, the oarlocks; ids unique for each boat (uidSvg)
    const HULL_B = 'M-28 -3 Q-26 7 -10 9 L14 9 Q27 7 31 -5 Q12 -1 -28 -3 Z';
    const boat = sv(svg, uidSvg(`<g><g><path d="M-30 6 Q-2 10 30 4" fill="none" stroke="#eef6f8" stroke-width="2" opacity=".7"/>
<g transform="translate(-9 1)">${OAR}</g><g transform="translate(5 1)">${OAR}</g>${man(-9, 0.82, SAILOR)}${man(5, 0.82, SAILOR)}${man(-21, 0.98, CAPTAIN)}
<ellipse cx="2" cy="11" rx="32" ry="3" fill="#0b2430" opacity=".35"/>
<g opacity=".22" transform="matrix(1 0 0 -.35 0 12.2)"><path d="M-28 -3 Q-26 7 -10 9 L14 9 Q27 7 31 -5 Q12 -1 -28 -3 Z" fill="#5a3418"/></g>
<defs><linearGradient id="pgBoatH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a06a3a"/><stop offset=".5" stop-color="#7a4a26"/><stop offset="1" stop-color="#4a2a12"/></linearGradient>
<linearGradient id="pgBoatL" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient>
<clipPath id="pgBoatC"><path d="${HULL_B}"/></clipPath></defs>
<path d="${HULL_B}" fill="url(#pgBoatH)" stroke="#2a1a0c" stroke-width="1"/>
<g clip-path="url(#pgBoatC)">
<path d="M-27.4 -.6 Q2 2.6 30.2 -2.6 M-26.4 2.4 Q2 5.8 28.6 .6 M-24.6 5.4 Q0 8.4 25.4 3.8" fill="none" stroke="#2a1a0c" stroke-width=".8"/>
<path d="M-27.4 0 Q2 3.2 30 -2 M-26.2 3 Q2 6.4 28.2 1.2 M-24.2 6 Q0 9 25 4.4" fill="none" stroke="#d9a46c" stroke-width=".45" opacity=".7"/>
${[-20, -12, -4, 4, 12, 20].map((x) => `<circle cx="${x}" cy="${(0.6 + Math.abs(x) * 0.02).toFixed(1)}" r=".45" fill="#e0c08a"/><circle cx="${x + 2}" cy="${(3.7 + Math.abs(x) * 0.02).toFixed(1)}" r=".45" fill="#e0c08a"/>`).join('')}
<path d="${HULL_B}" fill="url(#pgBoatL)"/></g>
<path d="M-28.6 -3.4 Q12 -1.4 31.4 -5.6" fill="none" stroke="#3a2210" stroke-width="2.4" stroke-linecap="round"/><path d="M-28 -3.8 Q12 -1.8 31 -6" fill="none" stroke="#e0b07a" stroke-width="1" stroke-linecap="round"/>
<path d="M-28.4 -3.6 Q-27.6 3 -25 7.2" fill="none" stroke="#3a2210" stroke-width="1.6"/><path d="M31.2 -5.6 Q32.6 -7.6 32 -9.4" fill="none" stroke="#3a2210" stroke-width="1.8" stroke-linecap="round"/>
<path d="M-10 9.4 L14 9.4" stroke="#2a1a0c" stroke-width="1.4" stroke-linecap="round"/>
${[-9, 5].map((x) => `<path d="M${x - 1} ${(-2.6 - (x + 28) * 0.006).toFixed(1)} v-1.6 M${x + 1} ${(-2.8 - (x + 28) * 0.006).toFixed(1)} v-1.6" stroke="#2b2f31" stroke-width=".6"/>`).join('')}
<path d="M-2 9 q-.6 .8 0 1.6 M20 7.4 q.6 .8 0 1.6" stroke="#eef6f8" stroke-width=".6" fill="none" opacity=".6"/>
<path d="M-29 -2 V-22" stroke="#4a2a12" stroke-width="1"/><path d="M-29 -22 L-17 -19 L-29 -16 Z" fill="${shipData(ctx.data, c.ship).color}">${live ? '<animateTransform attributeName="transform" type="skewY" values="0;-8;0;6;0" dur="1.2s" repeatCount="indefinite"/>' : ''}</path>
<path d="M28 -5 L33 -14" stroke="#4a2a12" stroke-width="1"/><g transform="translate(33 -15)"><circle r="6" fill="#ffd27a" opacity=".35">${live ? '<animate attributeName="opacity" values=".35;.2;.4;.25;.35" dur=".9s" repeatCount="indefinite"/>' : ''}</circle><rect x="-1.8" y="-2.6" width="3.6" height="4.6" rx=".8" fill="#ffe7a0" stroke="#3a2412" stroke-width=".6"/><path d="M-1.8 -2.6 H1.8 M0 -2.6 V-4" stroke="#3a2412" stroke-width=".6"/></g></g></g>`, 'boat'));
    const pts = qpts(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2 + toGap * 26, x1, y1, N);
    A(ctx, boat, [...pts.map((p, i) => ({ transform: `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px) scale(${flip * k},${k})`, opacity: i === 0 ? 0 : 1, offset: (i / N) * 0.9 })), { transform: `translate(${x1.toFixed(1)}px,${y1.toFixed(1)}px) scale(${flip * k},${k})`, opacity: 0, offset: 1 }], D2 + 400, t0, 'ease-in-out');
    const strokes = Math.max(1, Math.round(D2 / S.stroke));
    boat.querySelectorAll('.oar').forEach((o) => A(ctx, o, Array.from({ length: strokes * 2 + 1 }, (_, q) => ({ transform: `rotate(${q % 2 ? 26 : -34}deg)` })), strokes * S.stroke, t0, 'ease-in-out', 'none'));
    for (let q = 0; q < strokes; q++) {
      const p = pts[Math.min(N, Math.round(((q + 0.5) / strokes) * N * 0.9))];
      ringSvg(ctx, svg, p.x - flip * 6 * k, p.y + 7 * k, 3, 22, '#eef6f8', 900, t0 + q * S.stroke + S.stroke / 2, 1.2);
      ringSvg(ctx, svg, p.x - flip * 14 * k, p.y + 8 * k, 3, 18, '#eef6f8', 800, t0 + q * S.stroke + S.stroke / 2 + 80, 1);
    }
    // the wake spreads behind the boat (eight traces one after another)
    for (let i = 0; i < 8; i++) {
      const w = sv(svg, '<path d="M0 0 q-10 3 -22 1 M0 4 q-10 4 -24 6" fill="none" stroke="#eef6f8" stroke-width="1.2" stroke-linecap="round"/>');
      A(ctx, w, [...pts.map((p, q) => ({ transform: `translate(${(p.x - flip * 36 * (k / 1.7)).toFixed(1)}px,${(p.y + 6 * (k / 1.7)).toFixed(1)}px) scale(${flip},1)`, opacity: Number((0.7 - i * 0.08).toFixed(2)), offset: (q / N) * 0.9 })), { transform: `translate(${(x1 - flip * 36 * (k / 1.7)).toFixed(1)}px,${(y1 + 6 * (k / 1.7)).toFixed(1)}px) scale(${flip},1)`, opacity: 0, offset: 1 }], D2 + 400, t0 + i * 90, 'ease-in-out');
    }
    at(ctx, t0 + D2 + 400, () => A(ctx, plank(ctx, ally), [{ boxShadow: '0 0 0 3px #e0bd62, 0 0 22px rgba(224,189,98,.7)' }, { boxShadow: '0 0 0 0 rgba(0,0,0,0)' }], S.glow, 0, 'ease-out', 'none'));
    tag(ctx, ab.cx, ab.y - 12, `Капитан ${gen(ctx, c.ship)} — на борту ${gen(ctx, ally)}`, t0 + D2, 'good', 1600);
    // the glow of the ally ends inside the clip (the queue takes only the finished animations off the planks)
    end = Math.max(end, t0 + D2 + 400 + Math.max(S.end, S.glow + 100));
  }
  await wait(ctx, end);
};

/**
 * Diving (the «dive» branch of runFx; T.dive): the plank rocks, rings run out on the water, «Толща воды» rises over the
 * plank from below (.underwater), bubbles go up, the Fires go out.
 */
export function diveFx(ctx: FxCtx, code: string, delay: number): number {
  const D = T.dive, el = plank(ctx, code), b = bx(ctx, el), fy = facingY(ctx, code), toGap = dirOf(ctx, code), svg = fxSvg(ctx);
  const w = mk(ctx, 'underwater', 0, 0); w.style.width = b.w + 'px'; w.style.height = b.h + 'px'; w.style.transformOrigin = '50% 100%';
  A(ctx, w, [{ opacity: 1, transform: `translate(${b.x}px,${b.y}px) scaleY(0)` }, { opacity: 1, transform: `translate(${b.x}px,${b.y}px) scaleY(1)` }], D.down, delay + 200, 'ease-in', 'forwards');
  A(ctx, el, [{ transform: 'none' }, { transform: 'rotate(.25deg) translateY(2px) rotate(1.4deg)', offset: 0.3 }, { transform: 'translateY(6px) scale(.985)', offset: 0.7 }, { transform: 'none' }], D.down, delay, 'ease-in-out', 'none');
  for (let i = 0; i < 3; i++) ringSvg(ctx, svg, b.cx, fy + toGap * 18, 20, Math.min(220, b.w * 0.45) - i * 30, '#cfe8ef', D.down, delay + i * 250, 2.2);
  for (let i = 0, m = room(ctx, 16); i < m; i++) {
    const x = b.x + rnd(20, b.w - 20), c = sv(svg, `<circle r="${rnd(2, 5).toFixed(1)}" fill="rgba(220,244,248,.2)" stroke="#dff4f8" stroke-width="1"/>`);
    A(ctx, c, [{ transform: `translate(${x.toFixed(1)}px,${b.b}px)`, opacity: 0 }, { opacity: 1, offset: 0.2 }, { transform: `translate(${(x + rnd(-10, 10)).toFixed(1)}px,${(b.y - rnd(10, 40)).toFixed(1)}px)`, opacity: 0 }], rnd(1000, 1700), delay + rnd(200, D.down));
  }
  const fb = el.querySelector('[data-fx-fires]');
  if (fb) { const sb = bx(ctx, fb); steam(ctx, sb.cx, sb.cy, delay + 450); A(ctx, fb, [{ opacity: 1 }, { opacity: 0 }], 300, delay + 500, 'ease-in', 'forwards'); tag(ctx, sb.cx, sb.y - 10, 'Пожары гаснут', delay + 550, 'good', 1200); }
  tag(ctx, b.cx, b.y - 12, 'Под водой', delay + 500, '', 1400);
  return delay + D.hold;
}
/**
 * Surfacing (the «surface» branch of runFx): the water runs off the plank in streams, the plank bobs up, two spouts at
 * its edge, then a green frame (T.dive).
 */
export function surfaceFx(ctx: FxCtx, code: string, delay: number): number {
  const D = T.dive, el = plank(ctx, code), b = bx(ctx, el), fy = facingY(ctx, code), toGap = dirOf(ctx, code), svg = fxSvg(ctx);
  const w = mk(ctx, 'underwater', 0, 0); w.style.width = b.w + 'px'; w.style.height = b.h + 'px'; w.style.transformOrigin = '50% 100%';
  A(ctx, w, [{ opacity: 1, transform: `translate(${b.x}px,${b.y}px) scaleY(1)` }, { opacity: 1, transform: `translate(${b.x}px,${b.y}px) scaleY(0)` }], D.up, delay + 300, 'ease-in', 'forwards');
  A(ctx, el, [{ transform: 'translateY(6px) scale(.985)' }, { transform: 'rotate(.25deg) translateY(-8px)', offset: 0.5 }, { transform: 'none' }], D.rise, delay + 300, 'cubic-bezier(.2,.8,.3,1.2)', 'none');
  for (let i = 0, m = room(ctx, 24); i < m; i++) {
    const x = b.x + rnd(10, b.w - 10), c = sv(svg, `<path d="M0 0 v${rnd(6, 14).toFixed(1)}" stroke="#bfe0ea" stroke-width="1.4" stroke-linecap="round"/>`);
    A(ctx, c, [{ transform: `translate(${x.toFixed(1)}px,${(b.y + rnd(0, 20)).toFixed(1)}px)`, opacity: 1 }, { transform: `translate(${x.toFixed(1)}px,${(b.b + rnd(10, 30)).toFixed(1)}px)`, opacity: 0 }], rnd(600, 1000), delay + rnd(300, 900), 'ease-in');
  }
  waterColumn(ctx, svg, b.x + Math.min(40, b.w * 0.15), fy + toGap * 10, 40, delay + 300);
  waterColumn(ctx, svg, b.r - Math.min(40, b.w * 0.15), fy + toGap * 10, 34, delay + 380);
  A(ctx, el, [{ boxShadow: '0 0 0 3px #7fd59a, 0 0 24px rgba(127,213,154,.8)' }, { boxShadow: '0 0 0 0 rgba(0,0,0,0)' }], D.glow, delay + 1300, 'ease-out', 'none');
  tag(ctx, b.cx, b.y - 14, 'Всплытие: первый Залп +1 и без Реакций', delay + 500, 'plus', 1600);
  return delay + 1300 + D.glow;
}
PLAY.dive = async (c, ctx) => { hint(ctx, `${nick(ctx, c.ship)} уходит под воду`); await wait(ctx, diveFx(ctx, c.ship, 0) + 100); };
PLAY.surface = async (c, ctx) => { hint(ctx, `${nick(ctx, c.ship)} всплывает`); await wait(ctx, surfaceFx(ctx, c.ship, 0) + 100); };

/** The key of the sea card on the table («wave», «reefs» …): seaKeyOf(D.sea) of the reference. */
function seaKey(ctx: FxCtx): string | null {
  const code = ctx.display.sea;
  return code ? seaCards(ctx.data).find((c) => c.code === code)?.key ?? null : null;
}

/**
 * A hit of the weather on cells (no ball): a flash of its colour, the cells go out. From play-sea.js. game (S1): no label
 * on the plank and no pill — a short mark at the number and a blink of the track (trackMark).
 */
export function weatherHit(ctx: FxCtx, e: { ship: string; track: Track; amount: number; toHull: number }, t0: number, color: string): number {
  let last = t0;
  for (const [tr, n] of [[e.track, e.amount], ['hull', e.toHull]] as [Track, number][]) {
    if (!n) continue;
    const now = shownTrack(ctx, e.ship, tr);
    for (let j = 0; j < n; j++) { const p = fxPoint(ctx, e.ship, tr, now - 1 - j), t = t0 + j * 110; flash(ctx, p.x, p.y, t, 1); ring(ctx, p.x, p.y, t, 0.9, color); last = t; }
    at(ctx, t0, () => setTrack(ctx, e.ship, tr, Math.max(0, now - n), color));
    trackMark(ctx, e.ship, tr, n, t0 + 120);
  }
  return last;
}

/**
 * A Fire burns the Hull (fxFire of fx3.js, ANIMATIONS.md §3.6): the fire starts at the picture of the ship and runs along
 * the bottom edge of the plank, spots of fire over the head, the glow of the fire on the plank, two columns of smoke,
 * embers; the boards of the Hull glow red, char and break one by one — the number and a short mark at it (S1). What
 * stays a while (a medium trace of the ship): the charred bottom, the scorch marks, a flame and smoke on the picture.
 * The timings — T.fire (fx/timing.ts). game: the air does not shimmer over the plank itself (a filter on the plank would
 * blur its text and outlive a show cut short) — the flames carry their own torn edge.
 */
export function burnFx(ctx: FxCtx, ship: string, n: number, delay: number): number {
  const F = T.fire, el = plank(ctx, ship), b = bx(ctx, el), head = el.querySelector('.plank-head');
  const hb = head ? bx(ctx, head) : b;
  const art = el.querySelector('.ship-art');
  const pb = visible(art) ? bx(ctx, art) : { x: hb.x + 6, y: hb.y, w: 40, h: hb.h, cx: hb.x + 26, cy: hb.cy, r: hb.x + 46, b: hb.b };
  const svg = fxSvg(ctx), small = isPhone(ctx), group = fireGroup(ctx);
  const glow = overlayAt(ctx, 'fx-fireglow', b);
  A(ctx, glow, [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 0.8, offset: 0.5 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], F.glow, delay);
  const flames = fireWall(ctx, svg, b.x + 6, b.r - 6, b.b + 2, small ? 20 : 30, { delay, spread: 26, life: F.glow, embers: small ? 12 : 30, host: group });
  // spots of fire: the picture, then along the head and the bottom edge (fractions of the plank, not the prototype's px)
  const spots: Pt[] = [{ x: pb.cx, y: pb.b }, ...[0.31, 0.48, 0.62, 0.75, 0.87, 0.19, 0.95].map((f, i) => ({ x: b.x + b.w * f, y: i % 2 ? b.b : hb.b }))];
  const marks = document.createElement('div');
  marks.className = 'fx-burnmarks';
  at(ctx, delay, () => {
    const host = plankScars(ctx, ship);
    if (!host) return;
    marks.innerHTML = '<i class="fx-char"></i>';
    host.appendChild(marks);
    A(ctx, marks.firstElementChild!, [{ opacity: 0 }, { opacity: 1 }], 1800, 200);
    scar(marks, 'medium', ship);
  });
  spots.slice(0, small ? 4 : spots.length).forEach((p, i) => {
    const t = delay + 150 + i * F.spot;
    flames.push(...fireWall(ctx, svg, p.x - 14, p.x + 14, p.y + 2, small ? 16 : 22, { delay: t, spread: 30, embers: 6, life: F.glow - 150 - i * F.spot, host: group }));
    at(ctx, t, () => {
      if (!marks.isConnected) return;
      const sc = document.createElement('i'), r = rnd(30, 50), pl = bx(ctx, el);
      sc.className = 'fx-scorch';
      Object.assign(sc.style, { left: `${p.x - pl.x - r / 2}px`, top: `${p.y - pl.y - r * 0.7}px`, width: `${r}px`, height: `${r * 0.8}px` });
      marks.appendChild(sc);
      A(ctx, sc, [{ opacity: 0 }, { opacity: 1 }], 900);
    });
  });
  smokeColumn(ctx, svg, b.cx - b.w * 0.25, b.y + 10, small ? 0.8 : 1.2, 5, 600, delay);
  smokeColumn(ctx, svg, b.cx + b.w * 0.23, b.y + 10, small ? 0.7 : 1.1, 5, 650, delay);
  // the boards of the Hull glow red-hot, char black and break, one after another
  const cur = shownTrack(ctx, ship, 'hull'), cells = trackEl(ctx, ship, 'hull').querySelector('.cells');
  for (let k = 0; k < n; k++) {
    const t = delay + F.spread + k * F.cellStep, cell = visible(cells) ? cells.children[cur - 1 - k] : null;
    if (cell) A(ctx, cell, [{ filter: 'none' }, { filter: 'sepia(1) saturate(4) hue-rotate(-20deg) brightness(1.4) drop-shadow(0 0 5px #ff7a2a)', offset: 0.4 }, { filter: 'brightness(.25)' }], F.cell, t, 'ease-in', 'none');
    const p = fxPoint(ctx, ship, 'hull', cur - 1 - k);
    sparksSvg(ctx, svg, p.x, p.y, 6, t + F.cell * 0.6, ['#ffd27a', '#ff8a2a', '#3a2412']);
  }
  const burnt = delay + F.spread + Math.max(0, n - 1) * F.cellStep + F.cell * 0.8;
  at(ctx, burnt, () => setTrack(ctx, ship, 'hull', Math.max(0, cur - n), '#F2913D'));
  trackMark(ctx, ship, 'hull', n, burnt + 30);
  // the flames die down; a flame and smoke stay on the picture of the ship (in the trace)
  const end = burnt + F.hold;
  A(ctx, group, [{ opacity: 1 }, { opacity: 0 }], F.out, end, 'ease-in', 'forwards');
  at(ctx, end, () => {
    if (!marks.isConnected) return;
    const pl = bx(ctx, el);
    marks.appendChild(flameEl(ctx, pb.x + pb.w * 0.36 - pl.x, pb.b + 2 - pl.y, small ? 16 : 22, 'fx-flame fx-burn'));
    marks.appendChild(flameEl(ctx, pb.x + pb.w * 0.66 - pl.x, pb.b + 4 - pl.y, small ? 13 : 18, 'fx-flame fx-burn'));
    marks.appendChild(smolderEl(pb.cx - pl.x, pb.y - pl.y, ctx.rich ? 4 : 0));
  });
  return end + F.out;
}

/** The deck in the hand row (the deck and the discard), or the middle of the gap. */
function deckBox(ctx: FxCtx) {
  const d = ctx.board.querySelector('[data-fx-deck]');
  if (d) return bx(ctx, d);
  const g = gapBox(ctx);
  return { ...g, x: g.cx, y: g.cy };
}

/**
 * Drawing: own cards — face down from the deck, in the hand they turn face up (the face only the owner sees); another's
 * — to the ship. game: the hand is the real one, the drawn cards are already in it — they are found by their codes
 * (drew.cards), hidden and turned when the back lands.
 */
export async function drawFx(ctx: FxCtx, e: { seat: string; count: number; cards?: string[] | null }): Promise<void> {
  const deck = deckBox(ctx);
  const used = new Set<Element>();
  const slots: HTMLElement[] = [];
  for (const code of e.cards || []) {
    const found = [...ctx.board.querySelectorAll<HTMLElement>(`[data-fx-hand] .hand-cards [data-fx-card="${code}"]`)].reverse().find((x) => !used.has(x));
    if (found) { used.add(found); slots.push(found); }
  }
  const mine = !!e.cards && e.cards.length > 0 && slots.length === e.cards.length;
  if (mine) {
    slots.reverse();
    slots.forEach((s) => (s.style.visibility = 'hidden'));
    slots.forEach((slot, k) => {
      // V2: the back lands as its card lies in the fan (tilted)
      const sb = handCardPos(ctx, slot), at0 = `translate(${sb.x}px,${sb.y}px) rotate(${sb.r || 0}deg)`;
      const back = mk(ctx, 'flyc', 0, 0, '<span class="hcard back"></span>');
      A(ctx, back, [{ opacity: 1, transform: `translate(${deck.x}px,${deck.y}px) scale(.6)` }, { opacity: 1, transform: `${at0} scale(${sb.s || 1})` }], 450, k * 160, 'cubic-bezier(.2,.8,.3,1)', 'forwards');
      A(ctx, back, [{ opacity: 1, transform: `${at0} scaleX(1)` }, { opacity: 1, transform: `${at0} scaleX(0)` }], 150, 450 + k * 160, 'ease-in', 'forwards');
      at(ctx, 600 + k * 160, () => { slot.style.visibility = ''; A(ctx, slot, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], 150, 0, 'ease-out', 'none'); });
    });
    await wait(ctx, 800 + e.count * 160);
  } else {
    const pb = bx(ctx, plank(ctx, e.seat));
    for (let k = 0; k < e.count; k++) { const back = mk(ctx, 'flyc', 0, 0, '<span class="hcard back"></span>'); A(ctx, back, [{ opacity: 1, transform: `translate(${deck.x}px,${deck.y}px) scale(.6)` }, { opacity: 0, transform: `translate(${pb.r - 70}px,${pb.cy - 50}px) scale(.35)` }], 500, k * 150, 'ease-in-out', 'forwards'); }
    // game (S1): the label is above the plank, not on its head
    tag(ctx, pb.r - 40, pb.y - 14, `+${e.count} ${e.count === 1 ? 'карта' : e.count < 5 ? 'карты' : 'карт'}`, 300, 'plus', 1000);
    await wait(ctx, 500 + e.count * 150);
  }
}

/** The start of a turn: the banner → income in kegs → Fire → «Девятый вал» → surfacing → «Мальстрём» → drawing. */
PLAY.turn = async (c, ctx) => {
  const own = c.mine && ctx.own; // game: a match of bots is not «Ваш ход»
  const title = own ? 'Ваш ход' : `Ход ${SIDE_LABEL[c.side].gen}`;
  hint(ctx, title);
  const done: GameEvent[] = c.events.filter((e) => e.type === 'turnStarted');
  ctx.renderWith(done);
  banner(ctx, title, own ? 'own' : '', 1000);
  await wait(ctx, own ? 950 : 800);
  const effects = c.effects || [];
  for (let i = 0; i < effects.length; i++) {
    const e = effects[i];
    if (e.type === 'powderGained') {
      const g = gapBox(ctx);
      const t = gainKegs(ctx, e.side, e.amount, { x: ctx.board.clientWidth / 2, y: g.cy }, 0);
      if (e.burned) { const kb = bx(ctx, holdEl(ctx, e.side)); tag(ctx, kb.r + 36, kb.cy + 18, `${e.burned} сгорело: Трюм полон`, 400, '', 1400); }
      await wait(ctx, t + 150);
    } else if (e.type === 'fireDamage') {
      // FX-D (the user's call): the Fires of several ships at the start of a turn burn at once, not one after another
      let end = 0, f = e;
      for (;;) {
        const next = effects[i + 1];
        const hit = next && next.type === 'damage' && next.ship === f.ship ? next : null;
        const n = hit ? hit.amount + hit.toHull : f.fires;
        if (hit) { i++; done.push(hit); }
        end = Math.max(end, burnFx(ctx, f.ship, n, 0));
        const after = effects[i + 1];
        if (after?.type !== 'fireDamage') break;
        done.push(f);
        f = after;
        i++;
      }
      await wait(ctx, end);
      done.push(f);
      continue;
    } else if (e.type === 'damage') {
      const wave = seaKey(ctx) === 'wave';
      const last = weatherHit(ctx, e, 0, '#5E9CC0');
      if (wave) { const b = bx(ctx, plank(ctx, e.ship)), fy = facingY(ctx, e.ship); const wv = mk(ctx, 'splash', 0, 0, '<svg viewBox="0 0 44 30" width="44" height="30"><g fill="#9CC3DA"><path d="M22 30 C18 18 14 10 10 4 C16 10 19 16 22 22 C25 16 28 10 34 4 C30 10 26 18 22 30Z"/></g></svg>'); A(ctx, wv, [{ opacity: 0, transform: `translate(${b.x}px,${fy}px) scale(.5)` }, { opacity: 1, transform: `translate(${b.cx}px,${fy}px) scale(1.4)`, offset: 0.5 }, { opacity: 0, transform: `translate(${b.r}px,${fy}px) scale(.8)` }], 900, 0); }
      await wait(ctx, last + 900);
    } else if (e.type === 'surfaced') {
      await wait(ctx, surfaceFx(ctx, e.ship, 0));
    } else if (e.type === 'swapped') {
      tag(ctx, ctx.board.clientWidth / 2, gapBox(ctx).cy, SWAP_LABEL[e.reason] || 'Смена мест', 0, '', 1200);
      await flipTo(ctx, done.concat(e), 650);
    } else if (e.type === 'drew') {
      ctx.renderWith(done);
      await drawFx(ctx, e);
    } else if (e.type === 'soulsGained') {
      // game (S1): a mark at the Souls badge, not a label over the plank
      const badge = plank(ctx, e.ship).querySelector('[data-fx-souls]');
      if (badge && visible(badge)) badgeMark(ctx, badge, `+${e.amount}`, 0, true);
      await wait(ctx, 500);
    } else if (e.type === 'seaEffect') {
      if (e.key === 'wave') tag(ctx, ctx.board.clientWidth / 2, gapBox(ctx).cy, 'Девятый вал', 0, '', 1000);
    }
    done.push(e);
  }
  await wait(ctx, 200);
};

/** The end of a turn; with Plans — the cards go face down under the ship. */
PLAY.turnEnd = async (c, ctx) => {
  if (c.plans) {
    const plans = c.plans;
    const pb = bx(ctx, plank(ctx, plans.seat));
    hint(ctx, `${nick(ctx, plans.seat)}: План — ${plans.count} рубашкой вниз`);
    for (let k = 0; k < plans.count; k++) {
      const from = sideOf(ctx, plans.seat) === ctx.bottom ? (() => { const h = ctx.board.querySelector('[data-fx-hand] .hand-cards'); const hb = h ? bx(ctx, h) : deckBox(ctx); return { x: hb.x + 20 + k * 30, y: hb.y }; })() : { x: pb.cx - 40, y: isTop(ctx, plans.seat) ? -140 : ctx.board.clientHeight };
      const back = mk(ctx, 'flyc', 0, 0, '<span class="hcard back"></span><span class="rib plan">ПЛАН</span>');
      A(ctx, back, [{ opacity: 1, transform: `translate(${from.x}px,${from.y}px) scale(1)` }, { opacity: 1, transform: `translate(${pb.r - 64 - k * 8}px,${pb.cy - 40}px) rotate(${-6 + k * 5}deg) scale(.45)`, offset: 0.7 }, { opacity: 0, transform: `translate(${pb.r - 64 - k * 8}px,${pb.cy - 40}px) rotate(${-6 + k * 5}deg) scale(.4)` }], 1100, k * 160, 'cubic-bezier(.2,.8,.3,1)');
    }
    tag(ctx, pb.r - 50, pb.y - 10, `План: ${plans.count}`, 500, 'plus', 1200);
    await wait(ctx, 1200 + plans.count * 160);
    return;
  }
  hint(ctx, `${SIDE_LABEL[c.side].name}: ход окончен`);
  await wait(ctx, 350);
};
PLAY.draw = async (c, ctx) => { await drawFx(ctx, { seat: c.seat, count: c.count, cards: c.cards }); };

/** A repair: a green frame on the ship, the cells go green one by one, a dashed line from where it came from. */
export function repairFx(ctx: FxCtx, e: { ship: string; track: Track; amount: number }, t0: number, from?: Pt): number {
  const now = shownTrack(ctx, e.ship, e.track);
  const b = bx(ctx, plank(ctx, e.ship));
  if (from) { const ar = mk(ctx, 'svgabs', 0, 0, `<svg width="${ctx.board.clientWidth}" height="${ctx.board.clientHeight}"><path d="M${from.x} ${from.y} Q ${(from.x + b.cx) / 2} ${Math.min(from.y, b.cy) - 40} ${b.cx} ${b.cy}" fill="none" stroke="#2F7A4F" stroke-width="3" stroke-dasharray="7 7" stroke-linecap="round"/></svg>`); A(ctx, ar, [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], 1400, t0); }
  // FX-A: a repair of the Hull takes the traces of its ship away (ANIMATIONS.md, §2)
  if (e.track === 'hull') at(ctx, t0 + 300, () => clearScars(e.ship));
  const fr = overlayAt(ctx, 'lg-aura', b, 4); fr.style.boxShadow = '0 0 0 3px #2F7A4F, 0 0 22px 6px rgba(47,125,74,.45)';
  A(ctx, fr, [{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }], Math.max(T.repair.aura, 300 + e.amount * T.repair.unit), t0 + 100);
  // FX-D (the «repair» branch of runFx): for each board a new one drops into its place and the hammer nails it — two
  // blows, gold sparks — then the cell comes back (T.repair)
  const R = T.repair, svg = fxSvg(ctx);
  for (let j = 0; j < e.amount; j++) {
    const t = t0 + 300 + j * R.unit, p = fxPoint(ctx, e.ship, e.track, now + j);
    const bd = sv(svg, '<g><rect x="-6" y="-8" width="12" height="16" rx="1.6" fill="#a8703a" stroke="#3a2412" stroke-width=".8"/><path d="M-6 -2.6 H6 M-6 2.6 H6" stroke="#6b4422" stroke-width=".6"/></g>');
    A(ctx, bd, [{ transform: `translate(${p.x}px,${p.y - 30}px) rotate(-30deg)`, opacity: 0 }, { transform: `translate(${p.x}px,${p.y}px) rotate(0deg)`, opacity: 1, offset: 0.9 }, { transform: `translate(${p.x}px,${p.y}px) rotate(0deg)`, opacity: 0 }], R.drop + 2 * R.strike, t, 'cubic-bezier(.3,1.4,.6,1)');
    const ham = sv(svg, '<g><rect x="-2" y="0" width="4" height="22" rx="1.4" fill="#8a5a32" stroke="#22190f" stroke-width=".7"/><rect x="-9" y="-5" width="18" height="7" rx="1.4" fill="#6f6a66" stroke="#22190f" stroke-width=".8"/><path d="M-8 -4 H8" stroke="#b9b3ad" stroke-width="1"/></g>');
    const up = `translate(${p.x + 14}px,${p.y - 18}px) rotate(40deg)`, down = `translate(${p.x + 8}px,${p.y - 6}px) rotate(-30deg)`;
    A(ctx, ham, [{ transform: up, opacity: 0 }, { transform: up, opacity: 1, offset: 0.1 }, { transform: down, offset: 0.3 }, { transform: up, offset: 0.55 }, { transform: down, offset: 0.8 }, { transform: up, opacity: 0 }], 2 * R.strike + 150, t + R.drop - 60, 'ease-in-out');
    sparksSvg(ctx, svg, p.x, p.y - 4, 6, t + R.drop + R.strike * 0.35, ['#fff3c4', '#e0bd62']);
    sparksSvg(ctx, svg, p.x, p.y, 6, t + R.drop + R.strike * 1.35, ['#fff3c4', '#e0bd62']);
    at(ctx, t + R.drop + 2 * R.strike, () => setTrack(ctx, e.ship, e.track, now + j + 1, '#2F7A4F'));
  }
  pillAt(ctx, e.ship, e.track, e.amount, t0 + 300 + (e.amount - 1) * R.unit + R.drop + 2 * R.strike, true);
  tag(ctx, b.cx, b.y - 12, `${nick(ctx, e.ship)}: +${e.amount} ${TRACK_NAME[e.track]}`, t0 + 200, 'good', 1500);
  return t0 + 600 + e.amount * T.repair.unit;
}

/**
 * Where the played card lies (Б2): at the plank of the ship that played it, on the side of the sea — under a top plank, over
 * the line «Последнее» above a bottom one — in the column of that plank, so the middle of the gap (the labels of the effects)
 * stays free and no plank scale is covered. The card is 110×128; it shrinks when the gap is low.
 */
const CARD_W = 110, CARD_H = 128, LAST_H = 22;
function cardSpot(ctx: FxCtx, ship?: string) {
  const g = gapBox(ctx), W = ctx.board.clientWidth, base = W < 701 ? 0.7 : 0.9;
  const sc = Math.min(base, Math.max(0.5, (g.h - LAST_H - 12) / CARD_H));
  const w = CARD_W * sc, h = CARD_H * sc;
  const pb = ship ? bx(ctx, plank(ctx, ship)) : null;
  const x = Math.min(Math.max(pb ? pb.cx - w / 2 : W / 2 - w / 2, 8), W - w - 8);
  const y = !pb ? g.cy - h / 2 : isTop(ctx, ship!) ? g.y + 4 : g.y + g.h - LAST_H - 4 - h;
  return { x, y, s: sc, r: 0 };
}
/** The point the effects of the card fly from: the middle of the card where it lies. */
function cardFrom(ctx: FxCtx): Pt {
  const s = (CUR_CARD && CUR_CARD.el._pos) || cardSpot(ctx);
  const sc = s.s ?? 0.9;
  return { x: s.x + (CARD_W / 2) * sc, y: s.y + (CARD_H / 2) * sc };
}
/** An effect of a card: a projectile from the card into the cells (damage). */
function cardDamage(ctx: FxCtx, e: { ship: string; track: Track; amount: number; toHull: number }, from: Pt, t0: number): number {
  let n = 0, last = t0;
  for (const [tr, units] of [[e.track, e.amount], ['hull', e.toHull]] as [Track, number][]) {
    const now = shownTrack(ctx, e.ship, tr);
    for (let j = 0; j < units; j++, n++) {
      const t = t0 + n * 130, p = fxPoint(ctx, e.ship, tr, now - 1 - j);
      fly(ctx, projectile(ctx, KIND_BY_TRACK[tr]), curve(from, p, 0.08), 420, t, { spin: tr === 'sails' ? 720 : 0 });
      flash(ctx, p.x, p.y, t + 420, 1.1); burst(ctx, tr === 'sails' ? 'shred' : tr === 'crew' ? 'dust' : 'splinter', p.x, p.y, t + 420, 7, 12, 32, 600);
      if (n === 0) shake(ctx, plank(ctx, e.ship), t + 420, 3);
      last = t + 420;
    }
    if (units) { at(ctx, t0 + 420, () => setTrack(ctx, e.ship, tr, Math.max(0, now - units), '#c0392b')); pillAt(ctx, e.ship, tr, units, last + 60); }
  }
  return last;
}

/** «Чёрная метка +N»: N from the data (the op «mark» of the card), as MARK_N of the reference. */
export const markN = (ctx: Pick<FxCtx, 'data'>) => (deckCards(ctx.data).map((c) => (c.fx.ops || []).find((o) => o[0] === 'mark')).find(Boolean) || [0, 0, 2])[2] as number;
const FLAG_LABEL = (ctx: FxCtx): Record<string, string> => ({ parley: 'Право на переговоры', voodoo: 'Кукла вуду', blockade: 'Блокада', mark: `Чёрная метка +${markN(ctx)}`, noReact: 'Без Реакций', limit: 'Карт сверх Команды', volleyBonus: 'Залпы +', noDiag: 'Диагональ без штрафа', noReactTeam: 'Противник без Реакций' });
/** game: the chip of the status as the plank of the game draws it (statuses() in Table.tsx); null — the plank has none. */
const CHIP_OF: Record<string, string | null> = { parley: 'Переговоры', voodoo: 'Кукла вуду', blockade: 'Блокада', noReact: 'Без Реакций' };
const BLOT = '<svg viewBox="0 0 30 26" width="30" height="26"><path d="M15 2 C21 1 27 5 28 11 C29 17 25 23 18 24 C12 25 5 23 3 17 C1 11 4 5 9 3 C11 2 13 2 15 2Z" fill="#1a1612"/><circle cx="27" cy="22" r="2" fill="#1a1612"/><circle cx="4" cy="5" r="1.4" fill="#1a1612"/></svg>';
export interface StatusEv {
  ship?: string;
  side?: Side;
  flag: string;
  n?: number;
}
/**
 * A status of a ship: the chip appears in the row of statuses under the head (it covers nothing) and stays while the
 * status is in the state. «Чёрная метка»: the blot flies off the card and lands in its chip; it stays till the end of
 * the turn. The label — in the gap between the rows, not over the tracks.
 * game: the chip is the plank's own (React draws it from the state; until the clip it is hidden — FxLayer.tsx); a
 * status the plank does not show («+N карт сверх Команды») gets only the label.
 */
export function statusFx(ctx: FxCtx, e: StatusEv, t0: number, from?: Pt): number {
  const label = e.flag === 'limitRaised' || e.flag === 'limit' ? `+${e.n} карт сверх Команды` : e.flag === 'volleyBonus' ? `Залпы +${e.n} в этот ход` : FLAG_LABEL(ctx)[e.flag] || e.flag;
  if (!e.ship) { const g = gapBox(ctx); tag(ctx, ctx.board.clientWidth / 2, g.cy, `${SIDE_LABEL[e.side!].name}: ${label}`, t0, 'plus', 1500); return t0 + 1300; }
  const el = plank(ctx, e.ship), out = facingY(ctx, e.ship) + dirOf(ctx, e.ship) * 18;
  const row = el.querySelector('[data-fx-statuses]');
  const chip = e.flag === 'mark' ? row?.querySelector<HTMLElement>('[data-fx-mark]') : CHIP_OF[e.flag] ? row?.querySelector<HTMLElement>(`[data-fx-status="${CHIP_OF[e.flag]}"]`) : null;
  const cb = bx(ctx, chip || row || el.querySelector('.plank-head')!);
  let land = t0 + 150;
  if (e.flag === 'mark') {
    const ic = bx(ctx, chip?.querySelector('svg') || chip || el.querySelector('.plank-head')!), spot = { x: ic.cx, y: ic.cy };
    const start = from || { x: spot.x + 40, y: spot.y - 90 * dirOf(ctx, e.ship) };
    const mid = { x: (start.x + spot.x) / 2, y: Math.min(start.y, spot.y) - 40 };
    const blot = mk(ctx, 'blot', 0, 0, BLOT);
    A(ctx, blot, [{ opacity: 0, transform: `translate(${start.x}px,${start.y}px) scale(.6) rotate(30deg)` }, { opacity: 1, transform: `translate(${mid.x}px,${mid.y}px) scale(2.2) rotate(-15deg)`, offset: 0.55 }, { opacity: 1, transform: `translate(${spot.x}px,${spot.y}px) scale(.55) rotate(0)` }], 560, t0, 'cubic-bezier(.5,0,.8,1)', 'forwards');
    land = t0 + 560;
    at(ctx, land, () => { blot.remove(); shake(ctx, el, 0, 2); });
    burst(ctx, 'dust', spot.x, spot.y, land, 6, 6, 18, 450);
    ring(ctx, spot.x, spot.y, land, 0.6, '#1a1612');
  }
  if (chip) at(ctx, land, () => { chip.style.visibility = ''; A(ctx, chip, [{ transform: 'scale(1.6)', boxShadow: '0 0 0 3px rgba(139,107,181,.5)' }, { transform: 'scale(1)', boxShadow: 'none' }], 380, 0, 'cubic-bezier(.3,1.6,.5,1)', 'none'); });
  // game (U3): «Чёрная метка» stays on the plank as a small stamp (Table.tsx, .mark-stamp), set when the blot lands.
  const stamps = e.flag === 'mark' ? Array.from(el.querySelectorAll<HTMLElement>('[data-fx-mark-stamp]')) : [];
  if (stamps.length) at(ctx, land, () => { for (const st of stamps) { st.style.visibility = ''; A(ctx, st, [{ opacity: 0, transform: 'scale(1.6)' }, { opacity: 1, transform: 'scale(1)' }], 350, 0, 'cubic-bezier(.3,1.4,.5,1)', 'none'); } });
  tag(ctx, cb.cx, out, e.flag === 'mark' ? `${label} до конца хода` : label, land, 'plus', 1700);
  return land + 1100;
}

const cardName = (ctx: FxCtx, code: string) => (code === HIDDEN ? 'карту' : `«${cardByCode(ctx.data, code).name}»`);
function smallLabel(ctx: FxCtx, e: GameEvent): string {
  switch (e.type) {
    case 'stolen': return `${nick(ctx, e.seat)} крадёт карту у ${gen(ctx, e.from)}`;
    case 'passed': return `${nick(ctx, e.seat)} передаёт карту ${dat(ctx, e.to)}`;
    case 'discarded': return `${nick(ctx, e.seat)} сбрасывает карту`;
    case 'shown': return `${nick(ctx, e.seat)} показывает руку`;
    case 'seaLooked': return `${nick(ctx, e.seat)} смотрит карты моря`;
    case 'dice': return 'Кости лжеца';
    default: return e.type;
  }
}

/** The played card: it flies in (an own one — from the hand, another's — from beyond the edge), lies at the middle, then its effects. */
PLAY.card = (c, ctx) => playCard(c, ctx, false);
/** game: the bottom strip of the card says who played it («МЕСТЬ», «ЛЕГЕНДА · МЕСТЬ»), see flyCard. */
async function playCard(c: CardClip, ctx: FxCtx, legend: boolean): Promise<void> {
  if (CUR_CARD && CUR_CARD.el.isConnected) A(ctx, CUR_CARD.el, [{ opacity: 1 }, { opacity: 0 }], 200, 0, 'ease-in', 'forwards');
  hint(ctx, `${nick(ctx, c.ship)}: ${cardName(ctx, c.card)}${c.target ? ` → ${nick(ctx, c.target)}` : ''}`);
  if (c.cost) payKegs(ctx, sideOf(ctx, c.ship), c.cost, 0);
  const spot = cardSpot(ctx, c.ship);
  const el = flyCard(ctx, c.card, cardOrigin(ctx, c.card, c.seat), spot, 0, 500, { ship: c.ship, legend });
  CUR_CARD = { el, code: c.card };
  A(ctx, el.firstElementChild!, [{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], 260, 500, 'ease-out', 'none');
  if (c.target) { const tb = bx(ctx, plank(ctx, c.target)); const ar = mk(ctx, 'svgabs', 0, 0, `<svg width="${ctx.board.clientWidth}" height="${ctx.board.clientHeight}"><path d="M${spot.x + (CARD_W / 2) * spot.s} ${spot.y + (CARD_H / 2) * spot.s} L${tb.cx} ${tb.cy}" fill="none" stroke="#6b4f8a" stroke-width="2.5" stroke-dasharray="6 6" stroke-linecap="round"/></svg>`); A(ctx, ar, [{ opacity: 0 }, { opacity: 0.9, offset: 0.3 }, { opacity: 0.9, offset: 0.8 }, { opacity: 0 }], 1300, 450); }
  // game: shorter than the reference (900 / 700 ms): players found the card at the middle hung too long. The full text
  // stays a press away (the Journal, «Сразу итог»).
  await wait(ctx, 550); // time to read the card
  const from = { x: spot.x + (CARD_W / 2) * spot.s, y: spot.y + (CARD_H / 2) * spot.s };
  const done: GameEvent[] = [];
  let t = 0;
  for (const e of c.effects || []) {
    if (e.type === 'damage') { t = Math.max(t, cardDamage(ctx, e, from, done.filter((x) => x.type === 'damage').length * 260)); }
    else if (e.type === 'restored') { t = Math.max(t, repairFx(ctx, e, 0, from)); }
    else if (e.type === 'powderGained') { t = Math.max(t, gainKegs(ctx, e.side, e.amount, from, 0)); }
    else if (e.type === 'powderLost') { payKegs(ctx, e.side, e.amount, 0); t = Math.max(t, 900); }
    else if (e.type === 'flagSet' || e.type === 'turnFlag' || e.type === 'limitRaised') { t = Math.max(t, statusFx(ctx, e.type === 'limitRaised' ? { ...e, flag: 'limitRaised' } : e, 0, from)); }
    else if (e.type === 'fireAdded') { const hd = bx(ctx, plank(ctx, e.ship).querySelector('.plank-head')!); fly(ctx, projectile(ctx, 'fire'), curve(from, { x: hd.r - 24, y: hd.cy }, 0.1), 500, 0); tag(ctx, hd.cx, hd.b + 10, 'Пожар', 500, 'plus', 1200); t = Math.max(t, 1100); }
    else if (e.type === 'soulsGained') { t = Math.max(t, 1200, soulsFly(ctx, e.ship, e.amount, t * 0.5)); }
    else if (e.type === 'soulsSpent') { const sb = plank(ctx, e.ship).querySelector('[data-fx-souls]'); if (sb && visible(sb)) { const b = bx(ctx, sb); wisp(ctx, { x: b.cx, y: b.cy }, from, 0); } t = Math.max(t, 900); }
    else if (e.type === 'drew') { await wait(ctx, t); t = 0; ctx.renderWith(done); await drawFx(ctx, e); }
    else if (e.type === 'swapped') { await wait(ctx, t); t = 0; await flipTo(ctx, done.concat(e), 650); }
    else if (e.type === 'stolen' || e.type === 'passed' || e.type === 'discarded' || e.type === 'shown' || e.type === 'seaLooked' || e.type === 'dice') { const g = gapBox(ctx); tag(ctx, ctx.board.clientWidth / 2, g.cy + 50, smallLabel(ctx, e), t, '', 1300); t = Math.max(t, 1000); }
    done.push(e);
  }
  await wait(ctx, t + 350);
  if (c.resolvedTo) { // resolved at once — the card goes to the discard (or is gone for good)
    const db = deckBox(ctx);
    A(ctx, el, [{ opacity: 1, transform: `translate(${spot.x}px,${spot.y}px) scale(${spot.s})` }, { opacity: 0, transform: `translate(${db.x}px,${db.y - 20}px) scale(.3)` }], 450, 0, 'ease-in', 'forwards');
    CUR_CARD = null;
    await wait(ctx, 350);
  }
}

/** Damage without a Volley (outside a card): from the card, if it still lies there; from a Fire; from the Reefs. */
PLAY.impact = async (c, ctx) => {
  if (c.cause === 'fire') { await wait(ctx, burnFx(ctx, c.ship, c.amount + c.toHull || 1, 0)); return; }
  let last;
  if (CUR_CARD && CUR_CARD.el.isConnected && c.cause === CUR_CARD.code) last = cardDamage(ctx, c, cardFrom(ctx), 0);
  else last = weatherHit(ctx, c, 0, '#c0392b');
  await wait(ctx, last + 900);
};
/** A Fire is set: the fire flares up at the picture of the ship and leaves a scorch mark (a medium trace). */
PLAY.fire = async (c, ctx) => {
  const el = plank(ctx, c.ship), hd = bx(ctx, el.querySelector('.plank-head')!), art = el.querySelector('.ship-art');
  const pb = visible(art) ? bx(ctx, art) : hd;
  const svg = fxSvg(ctx), group = fireGroup(ctx);
  fireWall(ctx, svg, pb.x + 4, pb.r - 4, pb.b, isPhone(ctx) ? 16 : 22, { spread: 20, embers: 10, life: T.fire.ignite, host: group });
  A(ctx, group, [{ opacity: 1 }, { opacity: 0 }], 300, T.fire.ignite, 'ease-in', 'forwards');
  at(ctx, 200, () => {
    const host = plankScars(ctx, c.ship);
    if (!host) return;
    const pl = bx(ctx, el), sc = document.createElement('i');
    sc.className = 'fx-scorch';
    Object.assign(sc.style, { left: `${pb.cx - pl.x - 20}px`, top: `${pb.b - pl.y - 26}px`, width: '40px', height: '32px' });
    host.appendChild(sc);
    scar(sc, 'medium', c.ship);
  });
  tag(ctx, hd.cx, hd.b + 10, `Пожар ${c.fires}`, 300, 'plus', 1200);
  await wait(ctx, T.fire.ignite + 300);
};

/** A repair outside a card's effects: from the Souls (a wisp) or from the card at the middle — to the ship it mends. */
PLAY.repair = async (c, ctx) => {
  hint(ctx, `${nick(ctx, c.ship)}: ремонт +${c.amount} ${TRACK_NAME[c.track]}`);
  let from: Pt | undefined;
  if (c.cause === 'souls') { const sb = plank(ctx, c.ship).querySelector('[data-fx-souls]'); if (sb && visible(sb)) { const b = bx(ctx, sb); from = { x: b.cx, y: b.cy }; wisp(ctx, from, fxPoint(ctx, c.ship, c.track, shownTrack(ctx, c.ship, c.track)), 0); } }
  else if (CUR_CARD && CUR_CARD.el.isConnected) from = cardFrom(ctx);
  await wait(ctx, repairFx(ctx, c, 0, from) + 300);
};

PLAY.powder = async (c, ctx) => {
  if (c.n > 0) { const g = gapBox(ctx); await wait(ctx, gainKegs(ctx, c.side!, c.n, { x: ctx.board.clientWidth / 2, y: g.cy }, 0) + 200); }
  else { payKegs(ctx, c.side || sideOf(ctx, c.ship!), -c.n, 0); await wait(ctx, 700); }
};
PLAY.souls = async (c, ctx) => {
  const ship = c.ship!;
  const b = bx(ctx, plank(ctx, ship));
  let end = 1100;
  if (c.n > 0) end = Math.max(end, soulsFly(ctx, Object.keys(ctx.display.ships).find((x) => sideOf(ctx, x) !== sideOf(ctx, ship)) || ship, c.n, 0) + 100);
  else tag(ctx, b.cx, b.y - 12, `${c.n} Души`, 0, '', 1100);
  await wait(ctx, end);
};
PLAY.status = async (c, ctx) => { await wait(ctx, statusFx(ctx, c, 0)); };
PLAY.sell = async (c, ctx) => {
  const from = cardOrigin(ctx, c.card, c.seat), kb = bx(ctx, holdEl(ctx, sideOf(ctx, c.seat)));
  const el = flyCard(ctx, c.card, from, { x: kb.x, y: kb.y - 60, s: 0.4 }, 0, 500); // game: no ribbon «ПРОДАНО» (see flyCard)
  A(ctx, el, [{ opacity: 1 }, { opacity: 0 }], 250, 550, 'ease-in', 'forwards');
  const pg = (c.effects || []).find((e) => e.type === 'powderGained');
  if (pg && pg.type === 'powderGained') gainKegs(ctx, pg.side, pg.amount, { x: kb.x + 20, y: kb.y - 20 }, 600);
  await wait(ctx, 1400);
};
const BACK = '<span class="hcard back"></span>';
PLAY.pass = async (c, ctx) => { const a = bx(ctx, plank(ctx, c.seat)), b = bx(ctx, plank(ctx, c.to)); const back = mk(ctx, 'flyc', 0, 0, BACK); A(ctx, back, [{ opacity: 1, transform: `translate(${a.cx - 30}px,${a.cy - 40}px) scale(.5)` }, { opacity: 0, transform: `translate(${b.cx - 30}px,${b.cy - 40}px) scale(.5)` }], 700, 0, 'ease-in-out', 'forwards'); tag(ctx, b.cx, b.y - 10, smallLabel(ctx, { type: 'passed', seat: c.seat, to: c.to, card: c.card }), 300, '', 1200); await wait(ctx, 1100); };
PLAY.steal = async (c, ctx) => {
  // game: «cardResolved → stolen» may come without the seat that took it — the label is in the gap then.
  if (c.from && c.seat) { const a = bx(ctx, plank(ctx, c.from)), b = bx(ctx, plank(ctx, c.seat)); const back = mk(ctx, 'flyc', 0, 0, BACK); A(ctx, back, [{ opacity: 1, transform: `translate(${a.cx - 30}px,${a.cy - 40}px) scale(.5)` }, { opacity: 0, transform: `translate(${b.cx - 30}px,${b.cy - 40}px) scale(.5) rotate(20deg)` }], 700, 0, 'ease-in-out', 'forwards'); burst(ctx, 'gold-dust', a.cx, a.cy, 0, 10, 10, 30, 500); }
  const at0 = c.seat ? bx(ctx, plank(ctx, c.seat)) : null;
  const text = c.from && c.seat ? smallLabel(ctx, { type: 'stolen', seat: c.seat, from: c.from, card: c.card }) : c.seat ? `${nick(ctx, c.seat)} забирает карту` : 'Карту забирают';
  if (at0) tag(ctx, at0.cx, at0.y - 10, text, 300, '', 1200); else tag(ctx, ctx.board.clientWidth / 2, gapBox(ctx).cy, text, 300, '', 1200);
  await wait(ctx, 1100);
};
PLAY.discard = async (c, ctx) => { const db = deckBox(ctx); const el = flyCard(ctx, c.card || HIDDEN, cardOrigin(ctx, c.card, c.seat), { x: db.x, y: db.y - 30, s: 0.4 }, 0, 500); A(ctx, el, [{ opacity: 1 }, { opacity: 0 }], 250, 550, 'ease-in', 'forwards'); await wait(ctx, 900); };
PLAY.peek = async (c, ctx) => { const b = bx(ctx, plank(ctx, c.seat)); tag(ctx, b.cx, b.y - 10, c.sea ? 'Смотрит карты моря' : 'Подсмотрел руку', 0, '', 1300); await wait(ctx, 900); };
PLAY.dice = async (c, ctx) => {
  const g = gapBox(ctx), W = ctx.board.clientWidth, seats = Object.keys(c.cards || {});
  seats.forEach((s, k) => { const el = flyCard(ctx, c.cards[s], cardOrigin(ctx, c.cards[s], s), { x: W / 2 - 120 + k * 130, y: g.cy - 60, s: 0.8 }, k * 150, 450); if (c.winner === s) { A(ctx, el, [{ scale: '1' }, { scale: '1.08' }, { scale: '1' }], 400, 900, 'ease-out', 'none'); burst(ctx, 'gold-dust', W / 2 - 75 + k * 130, g.cy, 900, 14, 20, 60, 700); } A(ctx, el, [{ opacity: 1 }, { opacity: 0 }], 300, 1900, 'ease-in', 'forwards'); });
  tag(ctx, W / 2, g.cy + 60, c.winner ? `Обе карты забирает ${nick(ctx, c.winner)}` : 'Ничья — обе в сброс', 800, 'plus', 1300);
  await wait(ctx, 2300);
};
PLAY.fireOut = async (c, ctx) => { const fb = plank(ctx, c.seat).querySelector('[data-fx-fires]') || plank(ctx, c.seat).querySelector('.plank-head')!; const b = bx(ctx, fb); splash(ctx, b.cx, b.cy, 0); steam(ctx, b.cx, b.cy - 6, 200); tag(ctx, b.cx, b.y - 10, c.fires ? `Пожар −1 (осталось ${c.fires})` : 'Пожар потушен', 250, 'good', 1200); await wait(ctx, 1100); };
/** The end of the game. game: «Победа!» only for the team played from this device; a draw is «Ничья». */
PLAY.end = async (c, ctx) => {
  const won = c.winner && c.winner !== 'НИЧЬЯ' ? (c.winner as Side) : null;
  const mine = !!won && won === ctx.bottom && ctx.own;
  const text = c.reason === 'concede' && c.side ? `${SIDE_LABEL[c.side].name} сдаются` : mine ? 'Победа!' : won ? `Победа ${SIDE_LABEL[won].gen}` : c.winner === 'НИЧЬЯ' ? 'Ничья' : 'Конец игры';
  const g = gapBox(ctx);
  const bn = mk(ctx, 'banner' + (mine ? ' own' : ''), ctx.board.clientWidth / 2, g.cy, text);
  A(ctx, bn, [{ opacity: 0, scale: '0.6' }, { opacity: 1, scale: '1.08', offset: 0.5 }, { opacity: 1, scale: '1' }], 600, 0, 'cubic-bezier(.3,1.6,.5,1)', 'forwards');
  if (mine && ctx.rich) for (let k = 0; k < 3; k++) burst(ctx, 'gold-dust', ctx.board.clientWidth * (0.25 + k * 0.25), g.cy, 300 + k * 200, 24, 30, 120, 1100);
  await wait(ctx, 1800);
};
PLAY.fallback = async (c, ctx) => { const g = gapBox(ctx); tag(ctx, ctx.board.clientWidth / 2, g.cy, c.type || c.kind, 0, '', 800); await wait(ctx, 600); };

/** The card at the middle for the queue: kept between clips (keepSet), dropped by «Сразу итог» (resetFx). */
export const CARD_SCENE: FxScene = {
  keep: () => (CUR_CARD ? [CUR_CARD.el] : []),
  afterRender: () => {},
  reset: () => {
    CUR_CARD = null;
  },
  onTurn: () => {},
  alive: () => false,
  // page.js: the action is over and its card resolved — the card at the middle fades.
  afterAction: (ctx, item) => {
    if (CUR_CARD && !item.cardOpen) {
      const el = CUR_CARD.el;
      // game: the queue may end here, with no clip to clear the layer after it — the card leaves the layer when faded.
      FADING = A(ctx, el, [{ opacity: 1 }, { opacity: 0 }], 300, 0, 'ease-in', 'forwards').finished.then(() => el.remove(), () => {});
      CUR_CARD = null;
    }
  },
  settled: () => FADING,
};
/** The card at the middle fading out after its action (afterAction); «Сразу итог» cancels it (the promise settles then too). */
let FADING: Promise<void> = Promise.resolve();

/** An ability of a ship («Меч Тритона», «Казна»): a stamp on the plank, gold dust, then its effects by the events. */
PLAY.ability = async (c, ctx) => {
  const b = bx(ctx, plank(ctx, c.ship));
  if (c.cost) payKegs(ctx, sideOf(ctx, c.ship), c.cost, 0);
  const label = ({ sword: 'Меч Тритона', treasury: 'Казна', jonesFree: 'Джонс свободен' } as Record<string, string>)[c.what] || c.what;
  const st = mk(ctx, 'stamp-fx', b.cx, b.cy, label);
  A(ctx, st, [{ opacity: 0, scale: '1.8' }, { opacity: 1, scale: '1', offset: 0.2 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], 1200, 0, 'cubic-bezier(.3,1.6,.5,1)');
  burst(ctx, 'gold-dust', b.cx, b.cy, 150, 16, 20, 70, 700);
  await wait(ctx, 900);
  const done: GameEvent[] = [];
  for (const e of c.effects || []) {
    if (e.type === 'swapped') await flipTo(ctx, done.concat(e), 650);
    else if (e.type === 'restored') await wait(ctx, repairFx(ctx, e, 0));
    else if (e.type === 'limitRaised') await wait(ctx, statusFx(ctx, { ...e, flag: 'limitRaised' }, 0));
    done.push(e);
  }
};
