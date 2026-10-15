// The clips of the ships in motion: a change of places (FLIP), diving and surfacing, sinking, the abilities of the
// ships. A port of docs/mockups/anim/level1/play-misc.js (see PORTING.md): the code is the reference's, what changed is
// how an element is found (the data-fx-* DOM contract), the globals (the context `ctx`) and the types. The rest of
// play-misc.js (the card, repairs, Powder, Souls, statuses …) comes in A4: the start and the end of a turn are here.
// Changes against the reference («game:»):
//  - renderWith draws the table through React (the queue keeps a preview of D and draws it at once); the planks keep
//    their DOM nodes (key — the code of the ship), so the FLIP animates the same element from its old place;
//  - the reference draws the table anew after each clip, so the animations of a plank with fill 'forwards' go with
//    its old node; in the game the node stays, so the queue cancels the finished animations of the planks after the
//    clip (FxLayer.tsx). The steady look («Под водой», sunk) is the class of the plank from the displayed state;
//  - the card: an own card is already out of the real hand, it flies from the hand row (cardOrigin); a card the viewer
//    may not see (HIDDEN) flies face down, without its type; statusFx uses the plank's own chips (React), see statusFx;
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
import {
  KIND_BY_TRACK, type AbilityClip, type CardClip, type DiveClip, type DrawClip, type FireClip, type ImpactClip, type RepairClip, type SinkClip, type SurfaceClip,
  type SwapClip, type TurnClip, type TurnEndClip,
} from './planFx';
import {
  A, allPlanks, at, bubbles, burst, bx, cardOrigin, curve, dirOf, facingY, FLAME_SVG, flash, fly, flyCard, fxPoint, gainKegs, gapBox, hint, holdEl,
  isTop, mk, overlayAt, payKegs, pillAt, plank, projectile, ring, setTrack, shake, shownTrack, sideOf, soulsFly, splash, steam, tag, visible, wait,
  whirlpool, wisp, type FlyCard, type FxCtx, type Pt,
} from './primitives';

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

const nick = (ctx: FxCtx, code: string) => `«${shipData(ctx.data, code).nick}»`;
const gen = (ctx: FxCtx, code: string) => `«${shipData(ctx.data, code).nickGenitive}»`;
const dat = (ctx: FxCtx, code: string) => `«${shipData(ctx.data, code).nickDative}»`;

/** The card being played: it lies at the middle of the table until it resolves (a Reaction window may come between). */
let CUR_CARD: { el: FlyCard; code: string } | null = null;
/** For PLAY.cancel (volley.ts): the card cancelled crumbles. */
export const curCard = () => CUR_CARD;

export const PLAY_MISC: Record<'swap' | 'sink' | 'dive' | 'surface' | 'ability' | 'turn' | 'turnEnd' | 'draw' | 'round' | 'sea' | 'card' | 'impact' | 'fire' | 'repair', ClipPlayer> = {} as never;
const PLAY = PLAY_MISC as unknown as {
  card: (c: CardClip, ctx: FxCtx) => Promise<void>;
  impact: (c: ImpactClip, ctx: FxCtx) => Promise<void>;
  fire: (c: FireClip, ctx: FxCtx) => Promise<void>;
  repair: (c: RepairClip, ctx: FxCtx) => Promise<void>;
  turn: (c: TurnClip & { events: GameEvent[] }, ctx: FxCtx) => Promise<void>;
  turnEnd: (c: TurnEndClip, ctx: FxCtx) => Promise<void>;
  draw: (c: DrawClip, ctx: FxCtx) => Promise<void>;
  swap: (c: SwapClip & { events: GameEvent[] }, ctx: FxCtx) => Promise<void>;
  sink: (c: SinkClip, ctx: FxCtx) => Promise<void>;
  dive: (c: DiveClip, ctx: FxCtx) => Promise<void>;
  surface: (c: SurfaceClip, ctx: FxCtx) => Promise<void>;
  ability: (c: AbilityClip, ctx: FxCtx) => Promise<void>;
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

/** Sinking: the plank heels over and goes down, water, a whirlpool, the stamp «Затонул»; the captain goes to the ally. */
PLAY.sink = async (c, ctx) => {
  const el = plank(ctx, c.ship), b = bx(ctx, el);
  hint(ctx, `${nick(ctx, c.ship)} тонет`);
  const fb = el.querySelector('[data-fx-fires]');
  if (fb) { const sb = bx(ctx, fb); steam(ctx, sb.cx, sb.cy, 300); }
  A(ctx, el, [{ transform: 'none', opacity: 1 }, { transform: 'rotate(-2.5deg) translateY(3px)', offset: 0.25 }, { transform: 'rotate(-3.5deg) translateY(30px)', opacity: 0.15 }], 1500, 0, 'ease-in', 'forwards');
  const water = mk(ctx, 'tint', 0, 0); water.style.width = b.w + 'px'; water.style.height = b.h + 'px'; water.style.background = 'linear-gradient(rgba(36,70,92,0), rgba(36,70,92,.55))'; water.style.borderRadius = '12px';
  A(ctx, water, [{ opacity: 0, transform: `translate(${b.x}px,${b.y + b.h * 0.6}px) scaleY(.2)` }, { opacity: 1, transform: `translate(${b.x}px,${b.y}px) scaleY(1)` }], 1300, 200, 'ease-in', 'forwards');
  bubbles(ctx, b.x + 10, b.b - 6, b.w - 20, 400, ctx.rich ? 22 : 0, 60);
  whirlpool(ctx, b.cx, b.cy + 10, 500, Math.min(200, b.w * 0.7), 1400);
  const st = mk(ctx, 'stamp-fx', b.cx, b.cy, 'Затонул');
  A(ctx, st, [{ opacity: 0, scale: '1.8' }, { opacity: 1, scale: '1', offset: 0.3 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], 1400, 900, 'cubic-bezier(.3,1.6,.5,1)');
  const ally = Object.keys(ctx.display.ships).find((x) => sideOf(ctx, x) === sideOf(ctx, c.ship) && x !== c.ship && !ctx.display.ships[x].sunk);
  if (ally) { const ab = bx(ctx, plank(ctx, ally)); tag(ctx, ab.cx, ab.y - 12, `Капитан ${gen(ctx, c.ship)} — на борту ${gen(ctx, ally)}`, 1500, '', 1600); }
  await wait(ctx, ally ? 2100 : 1700);
};

/** Diving: the water rises over the plank from below, bubbles, the Fires go out. */
export function diveFx(ctx: FxCtx, code: string, delay: number): number {
  const el = plank(ctx, code), b = bx(ctx, el);
  const w = mk(ctx, 'underwater', 0, 0); w.style.width = b.w + 'px'; w.style.height = b.h + 'px'; w.style.transformOrigin = '50% 100%';
  A(ctx, w, [{ opacity: 1, transform: `translate(${b.x}px,${b.y}px) scaleY(0)` }, { opacity: 1, transform: `translate(${b.x}px,${b.y}px) scaleY(1)` }], 700, delay, 'ease-in-out', 'forwards');
  A(ctx, el, [{ transform: 'none' }, { transform: 'translateY(6px) scale(.985)' }, { transform: 'none' }], 1300, delay, 'ease-in-out', 'none');
  bubbles(ctx, b.x + 8, b.b - 4, b.w - 16, delay + 100, 16, 60);
  const fb = el.querySelector('[data-fx-fires]');
  if (fb) { const sb = bx(ctx, fb); steam(ctx, sb.cx, sb.cy, delay + 450); A(ctx, fb, [{ opacity: 1 }, { opacity: 0 }], 300, delay + 500, 'ease-in', 'forwards'); tag(ctx, sb.cx, sb.y - 10, 'Пожары гаснут', delay + 550, 'good', 1200); }
  tag(ctx, b.cx, b.y - 12, 'Под водой', delay + 500, '', 1400);
  return delay + 1400;
}
/** Surfacing: the water goes down, splashes along the top edge. */
export function surfaceFx(ctx: FxCtx, code: string, delay: number): number {
  const el = plank(ctx, code), b = bx(ctx, el);
  const w = mk(ctx, 'underwater', 0, 0); w.style.width = b.w + 'px'; w.style.height = b.h + 'px'; w.style.transformOrigin = '50% 100%';
  A(ctx, w, [{ opacity: 1, transform: `translate(${b.x}px,${b.y}px) scaleY(1)` }, { opacity: 1, transform: `translate(${b.x}px,${b.y}px) scaleY(0)` }], 600, delay, 'ease-in', 'forwards');
  A(ctx, el, [{ transform: 'translateY(6px) scale(.985)' }, { transform: 'translateY(-3px)', offset: 0.7 }, { transform: 'none' }], 700, delay, 'ease-out', 'none');
  for (let k = 0; k < 3; k++) splash(ctx, b.x + b.w * (0.2 + 0.3 * k), b.y + 2, delay + 380 + k * 90);
  if (ctx.rich) for (let k = 0; k < 10; k++) { const d = mk(ctx, 'bubble', 0, 0); const x0 = b.x + Math.random() * b.w; A(ctx, d, [{ opacity: 1, transform: `translate(${x0}px,${b.y}px) scale(.6)` }, { opacity: 0, transform: `translate(${x0 + (Math.random() - 0.5) * 30}px,${b.y - 20 - Math.random() * 25}px) scale(.9)` }], 600, delay + 400 + Math.random() * 200); }
  tag(ctx, b.cx, b.y - 14, 'Всплытие: первый Залп +1 и без Реакций', delay + 500, 'plus', 1600);
  return delay + 1400;
}
PLAY.dive = async (c, ctx) => { hint(ctx, `${nick(ctx, c.ship)} уходит под воду`); await wait(ctx, diveFx(ctx, c.ship, 0) + 100); };
PLAY.surface = async (c, ctx) => { hint(ctx, `${nick(ctx, c.ship)} всплывает`); await wait(ctx, surfaceFx(ctx, c.ship, 0) + 100); };

/** The key of the sea card on the table («wave», «reefs» …): seaKeyOf(D.sea) of the reference. */
function seaKey(ctx: FxCtx): string | null {
  const code = ctx.display.sea;
  return code ? seaCards(ctx.data).find((c) => c.code === code)?.key ?? null : null;
}

/** A hit of the weather on cells (no ball): a flash of its colour, the cells go out, a label. From play-sea.js (S1 takes it from here). */
export function weatherHit(ctx: FxCtx, e: { ship: string; track: Track; amount: number; toHull: number }, t0: number, color: string, label: string): number {
  let last = t0;
  for (const [tr, n] of [[e.track, e.amount], ['hull', e.toHull]] as [Track, number][]) {
    if (!n) continue;
    const now = shownTrack(ctx, e.ship, tr);
    for (let j = 0; j < n; j++) { const p = fxPoint(ctx, e.ship, tr, now - 1 - j), t = t0 + j * 110; flash(ctx, p.x, p.y, t, 1); ring(ctx, p.x, p.y, t, 0.9, color); last = t; }
    at(ctx, t0, () => setTrack(ctx, e.ship, tr, Math.max(0, now - n), color));
    pillAt(ctx, e.ship, tr, n, t0 + 120);
  }
  if (label) { const b = bx(ctx, plank(ctx, e.ship)); tag(ctx, b.cx, b.y - 12, label, t0 + 100, '', 1300); }
  return last;
}

/** A Fire burns the Hull: the Fire badge flares, embers fly into the cells of the Hull. */
export function burnFx(ctx: FxCtx, ship: string, n: number, delay: number): number {
  const el = plank(ctx, ship), fb = el.querySelector('[data-fx-fires]') || el.querySelector('.plank-head')!;
  const sb = bx(ctx, fb);
  A(ctx, fb, [{ transform: 'scale(1)' }, { transform: 'scale(1.5)' }, { transform: 'scale(1)' }], 400, delay, 'ease-in-out', 'none');
  const cur = shownTrack(ctx, ship, 'hull');
  for (let k = 0; k < n; k++) {
    const p = fxPoint(ctx, ship, 'hull', cur - 1 - k);
    for (let j = 0; j < (ctx.rich ? 6 : 1); j++) { const em = mk(ctx, 'ember', 0, 0); fly(ctx, em, curve({ x: sb.cx, y: sb.cy }, { x: p.x + (Math.random() - 0.5) * 8, y: p.y }, (Math.random() - 0.5) * 0.4, 10), 480, delay + 250 + j * 40 + k * 120, { lift: 0 }); }
    flash(ctx, p.x, p.y, delay + 730 + k * 120, 0.8);
  }
  at(ctx, delay + 730, () => setTrack(ctx, ship, 'hull', Math.max(0, cur - n), '#F2913D'));
  pillAt(ctx, ship, 'hull', n, delay + 760);
  tag(ctx, sb.cx, sb.y - 10, 'Пожар жжёт Корпус', delay + 200, '', 1200);
  return delay + 1250;
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
      const sb = bx(ctx, slot);
      const back = mk(ctx, 'flyc', 0, 0, '<span class="hcard back"></span>');
      A(ctx, back, [{ opacity: 1, transform: `translate(${deck.x}px,${deck.y}px) scale(.6)` }, { opacity: 1, transform: `translate(${sb.x}px,${sb.y}px) scale(1)` }], 450, k * 160, 'cubic-bezier(.2,.8,.3,1)', 'forwards');
      A(ctx, back, [{ opacity: 1, transform: `translate(${sb.x}px,${sb.y}px) scaleX(1)` }, { opacity: 1, transform: `translate(${sb.x}px,${sb.y}px) scaleX(0)` }], 150, 450 + k * 160, 'ease-in', 'forwards');
      at(ctx, 600 + k * 160, () => { slot.style.visibility = ''; A(ctx, slot, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], 150, 0, 'ease-out', 'none'); });
    });
    await wait(ctx, 800 + e.count * 160);
  } else {
    const pb = bx(ctx, plank(ctx, e.seat));
    for (let k = 0; k < e.count; k++) { const back = mk(ctx, 'flyc', 0, 0, '<span class="hcard back"></span>'); A(ctx, back, [{ opacity: 1, transform: `translate(${deck.x}px,${deck.y}px) scale(.6)` }, { opacity: 0, transform: `translate(${pb.r - 70}px,${pb.cy - 50}px) scale(.35)` }], 500, k * 150, 'ease-in-out', 'forwards'); }
    tag(ctx, pb.r - 40, pb.y - 10, `+${e.count} ${e.count === 1 ? 'карта' : e.count < 5 ? 'карты' : 'карт'}`, 300, 'plus', 1000);
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
      const next = effects[i + 1];
      const hit = next && next.type === 'damage' && next.ship === e.ship ? next : null;
      const n = hit ? hit.amount + hit.toHull : e.fires;
      if (hit) { i++; done.push(hit); }
      await wait(ctx, burnFx(ctx, e.ship, n, 0));
    } else if (e.type === 'damage') {
      const wave = seaKey(ctx) === 'wave';
      const last = weatherHit(ctx, e, 0, '#5E9CC0', wave ? 'Девятый вал: −1 Паруса' : '');
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
      const b = bx(ctx, plank(ctx, e.ship)); tag(ctx, b.cx, b.y - 12, `+${e.amount} Души`, 0, 'good', 1000); await wait(ctx, 500);
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

// game, till S1 (the decision of the user): a new round and the sea card draw nothing in the layer — the card is shown
// by the sea banner of Banners.tsx, its effects come to the planks after the clip. S1 ports PLAY.round / PLAY.sea.
PLAY_MISC.round = async () => {};
PLAY_MISC.sea = async () => {};

/** A repair: a green frame on the ship, the cells go green one by one, a dashed line from where it came from. */
export function repairFx(ctx: FxCtx, e: { ship: string; track: Track; amount: number }, t0: number, from?: Pt): number {
  const now = shownTrack(ctx, e.ship, e.track);
  const b = bx(ctx, plank(ctx, e.ship));
  if (from) { const ar = mk(ctx, 'svgabs', 0, 0, `<svg width="${ctx.board.clientWidth}" height="${ctx.board.clientHeight}"><path d="M${from.x} ${from.y} Q ${(from.x + b.cx) / 2} ${Math.min(from.y, b.cy) - 40} ${b.cx} ${b.cy}" fill="none" stroke="#2F7A4F" stroke-width="3" stroke-dasharray="7 7" stroke-linecap="round"/></svg>`); A(ctx, ar, [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], 1400, t0); }
  const fr = overlayAt(ctx, 'lg-aura', b, 4); fr.style.boxShadow = '0 0 0 3px #2F7A4F, 0 0 22px 6px rgba(47,125,74,.45)';
  A(ctx, fr, [{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }], 1500, t0 + 100);
  for (let j = 0; j < e.amount; j++) {
    const t = t0 + 300 + j * 180, p = fxPoint(ctx, e.ship, e.track, now + j);
    at(ctx, t, () => setTrack(ctx, e.ship, e.track, now + j + 1, '#2F7A4F'));
    ring(ctx, p.x, p.y, t, 0.8, '#2F7A4F'); burst(ctx, 'sparkle', p.x, p.y, t, 5, 6, 18, 500);
  }
  pillAt(ctx, e.ship, e.track, e.amount, t0 + 360 + e.amount * 180, true);
  tag(ctx, b.cx, b.y - 12, `${nick(ctx, e.ship)}: +${e.amount} ${TRACK_NAME[e.track]}`, t0 + 200, 'good', 1500);
  return t0 + 600 + e.amount * 180;
}

/** Where the played card lies: at the edge of the gap on the player's side, so it does not cover the planks. */
function cardSpot(ctx: FxCtx) {
  const g = gapBox(ctx), W = ctx.board.clientWidth, sc = W < 701 ? 0.7 : 0.9;
  return { x: W / 2 - 55 * sc, y: g.cy - 64 * sc, s: sc, r: 0 };
}
/** The point the effects of the card fly from. */
function cardFrom(ctx: FxCtx): Pt {
  const s = cardSpot(ctx);
  return { x: s.x + 55 * s.s, y: s.y + 64 * s.s };
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
const markN = (ctx: FxCtx) => (deckCards(ctx.data).map((c) => (c.fx.ops || []).find((o) => o[0] === 'mark')).find(Boolean) || [0, 0, 2])[2] as number;
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
PLAY.card = async (c, ctx) => {
  if (CUR_CARD && CUR_CARD.el.isConnected) A(ctx, CUR_CARD.el, [{ opacity: 1 }, { opacity: 0 }], 200, 0, 'ease-in', 'forwards');
  const hidden = c.card === HIDDEN;
  hint(ctx, `${nick(ctx, c.ship)}: ${cardName(ctx, c.card)}${c.target ? ` → ${nick(ctx, c.target)}` : ''}`);
  if (c.cost) payKegs(ctx, sideOf(ctx, c.ship), c.cost, 0);
  const spot = cardSpot(ctx);
  const el = flyCard(ctx, c.card, cardOrigin(ctx, c.card, c.seat), spot, 0, 500, hidden ? '' : cardByCode(ctx.data, c.card).type, '');
  CUR_CARD = { el, code: c.card };
  A(ctx, el.firstElementChild!, [{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], 260, 500, 'ease-out', 'none');
  if (c.target) { const tb = bx(ctx, plank(ctx, c.target)); const ar = mk(ctx, 'svgabs', 0, 0, `<svg width="${ctx.board.clientWidth}" height="${ctx.board.clientHeight}"><path d="M${spot.x + 55 * spot.s} ${spot.y + 64 * spot.s} L${tb.cx} ${tb.cy}" fill="none" stroke="#6b4f8a" stroke-width="2.5" stroke-dasharray="6 6" stroke-linecap="round"/></svg>`); A(ctx, ar, [{ opacity: 0 }, { opacity: 0.9, offset: 0.3 }, { opacity: 0.9, offset: 0.8 }, { opacity: 0 }], 1300, 450); }
  await wait(ctx, 900); // time to read the card
  const from = { x: spot.x + 55 * spot.s, y: spot.y + 64 * spot.s };
  const done: GameEvent[] = [];
  let t = 0;
  for (const e of c.effects || []) {
    if (e.type === 'damage') { t = Math.max(t, cardDamage(ctx, e, from, done.filter((x) => x.type === 'damage').length * 260)); }
    else if (e.type === 'restored') { t = Math.max(t, repairFx(ctx, e, 0, from)); }
    else if (e.type === 'powderGained') { t = Math.max(t, gainKegs(ctx, e.side, e.amount, from, 0)); }
    else if (e.type === 'powderLost') { payKegs(ctx, e.side, e.amount, 0); t = Math.max(t, 900); }
    else if (e.type === 'flagSet' || e.type === 'turnFlag' || e.type === 'limitRaised') { t = Math.max(t, statusFx(ctx, e.type === 'limitRaised' ? { ...e, flag: 'limitRaised' } : e, 0, from)); }
    else if (e.type === 'fireAdded') { const hd = bx(ctx, plank(ctx, e.ship).querySelector('.plank-head')!); fly(ctx, projectile(ctx, 'fire'), curve(from, { x: hd.r - 24, y: hd.cy }, 0.1), 500, 0); tag(ctx, hd.cx, hd.b + 10, 'Пожар', 500, 'plus', 1200); t = Math.max(t, 1100); }
    else if (e.type === 'soulsGained') { soulsFly(ctx, e.ship, e.amount, t * 0.5); t = Math.max(t, 1200); }
    else if (e.type === 'soulsSpent') { const sb = plank(ctx, e.ship).querySelector('[data-fx-souls]'); if (sb && visible(sb)) { const b = bx(ctx, sb); wisp(ctx, { x: b.cx, y: b.cy }, from, 0); } t = Math.max(t, 900); }
    else if (e.type === 'drew') { await wait(ctx, t); t = 0; ctx.renderWith(done); await drawFx(ctx, e); }
    else if (e.type === 'swapped') { await wait(ctx, t); t = 0; await flipTo(ctx, done.concat(e), 650); }
    else if (e.type === 'stolen' || e.type === 'passed' || e.type === 'discarded' || e.type === 'shown' || e.type === 'seaLooked' || e.type === 'dice') { const g = gapBox(ctx); tag(ctx, ctx.board.clientWidth / 2, g.cy + 50, smallLabel(ctx, e), t, '', 1300); t = Math.max(t, 1000); }
    done.push(e);
  }
  await wait(ctx, t + 700);
  if (c.resolvedTo) { // resolved at once — the card goes to the discard (or is gone for good)
    const db = deckBox(ctx);
    A(ctx, el, [{ opacity: 1, transform: `translate(${spot.x}px,${spot.y}px) scale(${spot.s})` }, { opacity: 0, transform: `translate(${db.x}px,${db.y - 20}px) scale(.3)` }], 450, 0, 'ease-in', 'forwards');
    CUR_CARD = null;
    await wait(ctx, 350);
  }
};

/** Damage without a Volley (outside a card): from the card, if it still lies there; from a Fire; from the Reefs. */
PLAY.impact = async (c, ctx) => {
  if (c.cause === 'fire') { await wait(ctx, burnFx(ctx, c.ship, c.amount + c.toHull || 1, 0)); return; }
  let last;
  if (CUR_CARD && CUR_CARD.el.isConnected && c.cause === CUR_CARD.code) last = cardDamage(ctx, c, cardFrom(ctx), 0);
  else last = weatherHit(ctx, c, 0, '#c0392b', seaKey(ctx) === 'reefs' ? 'Рифы: −1 Корпус' : '');
  await wait(ctx, last + 900);
};
PLAY.fire = async (c, ctx) => {
  const hd = bx(ctx, plank(ctx, c.ship).querySelector('.plank-head')!);
  const fl = mk(ctx, 'flame', 0, 0, FLAME_SVG);
  A(ctx, fl, [{ opacity: 0, transform: `translate(${hd.cx}px,${hd.cy + 20}px) scale(.4)` }, { opacity: 1, transform: `translate(${hd.r - 24}px,${hd.cy}px) scale(1.3)` }, { opacity: 0, transform: `translate(${hd.r - 24}px,${hd.cy}px) scale(1)` }], 900, 0, 'ease-in-out', 'forwards');
  tag(ctx, hd.cx, hd.b + 10, `Пожар ${c.fires}`, 300, 'plus', 1200);
  await wait(ctx, 1000);
};

/** A repair outside a card's effects: from the Souls (a wisp) or from the card at the middle — to the ship it mends. */
PLAY.repair = async (c, ctx) => {
  hint(ctx, `${nick(ctx, c.ship)}: ремонт +${c.amount} ${TRACK_NAME[c.track]}`);
  let from: Pt | undefined;
  if (c.cause === 'souls') { const sb = plank(ctx, c.ship).querySelector('[data-fx-souls]'); if (sb && visible(sb)) { const b = bx(ctx, sb); from = { x: b.cx, y: b.cy }; wisp(ctx, from, fxPoint(ctx, c.ship, c.track, shownTrack(ctx, c.ship, c.track)), 0); } }
  else if (CUR_CARD && CUR_CARD.el.isConnected) from = cardFrom(ctx);
  await wait(ctx, repairFx(ctx, c, 0, from) + 300);
};

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
      A(ctx, el, [{ opacity: 1 }, { opacity: 0 }], 300, 0, 'ease-in', 'forwards').finished.then(() => el.remove(), () => {});
      CUR_CARD = null;
    }
  },
};

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
    // game: «limitRaised» → statusFx comes with A4 (see the head of the file).
    done.push(e);
  }
};
