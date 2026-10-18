// The clips of the Volley: announce → window → reaction → shot | cancel → counter; heart. A port of
// docs/mockups/anim/level1/play-volley.js (see PORTING.md): the code is the reference's, what changed is how an element
// is found (the data-fx-* DOM contract), the globals (the context `ctx`) and the types. Between the clips of one Volley
// lives «the scene of the Volley» VS: the breakdown plate, the cards at the plate, the frames, the effects of the
// Reactions. In the game the declaration and the shot come with different actions (between them — the Reaction window
// and a decision), so VS lives on between them.
// Changes against the reference («game:»):
//  - the frames of the shooter and the target are the classes fx-shooter / fx-targeted: React owns shooter / targeted of
//    the plank (aiming of P2, a pending Volley), a class taken off past React would not come back;
//  - window does not draw the reference's «window» when a panel of the game (.dock) is in the middle: the real panel
//    (Reactions, «Компания решает…» of P8, the Volley panel) is there;
//  - the cards at the plate (a Charge, a Reaction) have no ribbon: the strip of the ship that played them (flyCard);
//  - CUR_CARD lives in misc.ts (the clip «card»): curCard().
import { deckCards, legendCards } from '../../../engine/data';
import { TRACK_DATIVE } from '../../../engine/hints';
import { shipData, type Term } from '../../../engine/state';
import type { GameData, Track } from '../../../engine/types';
import { hitMark, scar, seaScars } from './scars';
import { SMOKE_LIFE, T } from './timing';
import type { ClipPlayer, FxScene } from './FxLayer';
import { curCard } from './misc';
import {
  A, at, ballFly, boom, bubbles, burst, bx, capFirst, fallBoard, flashBoard, fuseSparks, fxSvg, gunFire, hitBlast, missSplash, type Pt, cardOrigin, curve, dirOf, facingY, FLAME_SVG, flash, fly, flyCard, fxPoint, gapBox, hint, holdEl, isTop,
  mk, moveTo, ms, overlayAt, payKegs, pillAt, plank, projectile, puff, setTrack, shake, shownTrack, sideOf, soulsFly, splash,
  tag, trackEl, wait, whirlpool, type FlyCard, type FxCtx,
} from './primitives';
import {
  KIND_BY_TRACK, termSrc, type AnnounceClip, type CancelClip, type CounterClip, type FxCards, type HeartClip,
  type ReactionClip, type Shot, type ShotClip, type VolReaction, type WindowClip,
} from './planFx';

interface PlateBox {
  x: number;
  y: number;
  w: number;
}

/** The scene of the current Volley. */
interface VolleyScene {
  shooter: string;
  target: string;
  declared: string;
  charge: string | null;
  diagonal?: boolean;
  reactions: VolReaction[];
  cards: FlyCard[];
  extras: HTMLElement[];
  declDamage: number;
  terms?: Term[] | null;
  plate?: HTMLElement;
  plateBox?: PlateBox;
  done?: boolean;
  lean?: Record<string, string>;
  dust?: boolean;
}

let VS: VolleyScene | null = null; // the scene of the current Volley
const PERSIST: { whirl: HTMLElement | null } = { whirl: null }; // effects till the end of the turn: the whirlpool of «Водоворот»

export const KIND_NAME = { fire: 'огонь', chain: 'цепь', grape: 'дробь', under: 'из-под воды', keg: 'бочонок', joint: 'с союзника', mark: 'в метку', gold: 'блик', hot: 'калёное', ghost: 'призрачное', flag: 'флаги' };
export const OUT_NAME = { water: 'в воду', wind: 'ветер', bounce: 'отскок', stick: 'вязнет', past: 'мимо', whirl: 'в воронку', block: 'в заслон', overkill: 'по пустой шкале', moon: 'сквозь Команду' };

/* ——— helpers of the reference (board.js) ——— */
const esc = (s: unknown) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]!);
const fxCardsOf = new WeakMap<GameData, FxCards>();
function fxCards(data: GameData): FxCards {
  let c = fxCardsOf.get(data);
  if (!c) fxCardsOf.set(data, (c = Object.fromEntries([...deckCards(data), ...legendCards(data)].map((x) => [x.code, x]))));
  return c;
}
const cardName = (ctx: FxCtx, code: string) => fxCards(ctx.data)[code]?.name ?? code;
const cardFx = (ctx: FxCtx, code: string) => fxCards(ctx.data)[code]?.fx ?? {};
/** The names of the reference (G.ships[x].nick / dat / gen): in quotes, as the game writes a ship; short — without. */
const nick = (ctx: FxCtx, code: string) => `«${shipData(ctx.data, code).nick}»`;
const dat = (ctx: FxCtx, code: string) => `«${shipData(ctx.data, code).nickDative}»`;
const gen = (ctx: FxCtx, code: string) => `«${shipData(ctx.data, code).nickGenitive}»`;
const ships = (ctx: FxCtx) => ctx.data.ships.map((s) => s.code);
/** game: the frame classes of the scene (React owns shooter / targeted). */
const SHOOTER = 'fx-shooter', TARGETED = 'fx-targeted';

function placePlate(ctx: FxCtx, shooter: string): PlateBox {
  const g = gapBox(ctx), W = ctx.board.clientWidth;
  const s = bx(ctx, plank(ctx, shooter));
  // game: wider than the reference (176 / 212) — the breakdown is set larger to be read at a glance.
  const pw = W < 701 ? 204 : 262;
  // The plate stands in the column the shooter is not in: over the gap, and if it is taller than the gap — over the
  // shooter's ally (fitPlate), never over the target, where the cannonballs land.
  const x = s.cx < W / 2 ? W - pw - 12 : 12;
  return { x, y: g.y + 4, w: pw };
}
function cardSlot(ctx: FxCtx, p: PlateBox, idx: number) {
  const W = ctx.board.clientWidth;
  const cw = W < 701 ? 64 : 82;
  const left = p.x > W / 2;
  const x = left ? p.x - (cw + 8) * (idx + 1) : p.x + p.w + 8 + (cw + 8) * idx;
  // game: the cards stay on the table. A Charge and two Reactions ran off the edge of a phone (the plate is 204 px of
  // 430): a card that does not fit stops at the edge and goes a step down, a pile beside the plate.
  const min = 8, max = W - cw - 8;
  const over = x > max ? Math.ceil((x - max) / (cw + 8)) : x < min ? Math.ceil((min - x) / (cw + 8)) : 0;
  return { x: Math.min(Math.max(x, min), max), y: p.y - 6 + idx * 6 + over * 26, r: idx ? 4 : -4, s: W < 701 ? 0.62 : 0.72 };
}
export function termRows(ctx: FxCtx, terms: Term[] | null | undefined, cls: Record<string, string> = {}): string {
  return (terms || []).map((t) => {
    const src = termSrc(t, { cards: fxCards(ctx.data), charge: VS && VS.charge, chargeName: VS && VS.charge ? cardName(ctx, VS.charge) : null, reactions: (VS && VS.reactions) || [] });
    const pos = t.n > 0 && src.kind !== 'guns';
    const c = cls[t.what] || '';
    return `<span class="${c}">${esc(capFirst(t.what))}</span><span class="${t.n < 0 ? 'neg' : pos ? 'pos' : ''} ${c}">${pos ? '+' : ''}${t.n < 0 ? '−' + -t.n : t.n}</span>`;
  }).join('');
}
export function plateHTML(ctx: FxCtx, { shooter, declared, target, track, damage, was, terms, cls, extra = '' }: { shooter: string; declared?: string; target: string; track: Track; damage: number; was?: number | null; terms?: Term[] | null; cls?: Record<string, string>; extra?: string }): string {
  const who = `<b>${esc(nick(ctx, shooter))}</b> → ${declared && declared !== target ? `<s>${esc(nick(ctx, declared))}</s> ` : ''}<b>${esc(nick(ctx, target))}</b>${VS && VS.diagonal ? ', по диагонали' : ''}`;
  return `<div class="who">${who}</div><div class="big">${was != null && was !== damage ? `<s>${was}</s>` : ''}${damage} по ${TRACK_DATIVE[track]}</div>` +
    (terms ? `<div class="terms">${termRows(ctx, terms, cls)}</div>` : '') + extra;
}
/** The breakdown plate — in the middle of the gap between the rows; if taller than the gap, it keeps to the shooter's row. */
function fitPlate(ctx: FxCtx) {
  if (!VS || !VS.plate) return;
  const g = gapBox(ctx), h = VS.plate.offsetHeight;
  const y = h <= g.h - 6 ? g.cy - h / 2 : isTop(ctx, VS.shooter) ? g.b - h - 2 : g.y + 2;
  VS.plate.style.top = y + 'px';
  if (VS.plateBox) VS.plateBox.y = y;
}
function clearVS(ctx: FxCtx, fade = true) {
  if (!VS) return;
  unleanAll(ctx);
  for (const el of [VS.plate, ...VS.cards, ...VS.extras]) if (el && el.isConnected) { if (fade) A(ctx, el, [{ opacity: 1 }, { opacity: 0 }], 250, 0, 'ease-in', 'forwards'); else el.remove(); }
  unframe(ctx.board);
  VS = null;
}
/** game: only the frames the scene put (fx-*, hitframe); shooter / targeted of React stay. */
function unframe(board: HTMLElement) {
  board.querySelectorAll(`.plank.${SHOOTER}, .plank.${TARGETED}, .plank.hitframe`).forEach((p) => p.classList.remove(SHOOTER, TARGETED, 'hitframe'));
}

/** A steady lean of a plank for the time of the Volley («Уйти по ветру», «Прикрытие», diving by a Reaction).
 *  Not an animation with fill: 'forwards' but an inline style — it lives on when the table is drawn again (afterRender). */
function lean(ctx: FxCtx, code: string, tf: string, d = 420, easing = 'ease-out') {
  const el = plank(ctx, code);
  A(ctx, el, [{ transform: el.style.transform || 'none' }, { transform: tf }], d, 0, easing, 'none');
  el.style.transform = tf;
  if (VS) (VS.lean = VS.lean || {})[code] = tf;
}
function unleanAll(ctx: FxCtx) {
  if (!VS || !VS.lean) return;
  for (const [code, tf] of Object.entries(VS.lean)) { const el = plank(ctx, code); if (!el) continue; A(ctx, el, [{ transform: tf }, { transform: 'none' }], 300, 0, 'ease-out', 'none'); el.style.transform = ''; }
  VS.lean = {};
}

export const PLAY_VOLLEY: Record<'announce' | 'window' | 'reaction' | 'shot' | 'cancel' | 'counter' | 'heart', ClipPlayer> = {} as never;
const PLAY = PLAY_VOLLEY as unknown as {
  announce: (c: AnnounceClip, ctx: FxCtx) => Promise<void>;
  window: (c: WindowClip, ctx: FxCtx) => Promise<void>;
  reaction: (c: ReactionClip, ctx: FxCtx) => Promise<void>;
  shot: (c: ShotClip & { shots: Shot[] }, ctx: FxCtx) => Promise<void>;
  cancel: (c: CancelClip, ctx: FxCtx) => Promise<void>;
  counter: (c: CounterClip, ctx: FxCtx) => Promise<void>;
  heart: (c: HeartClip, ctx: FxCtx) => Promise<void>;
};

PLAY.announce = async (c, ctx) => {
  if (VS && VS.done) clearVS(ctx, false);
  const side = sideOf(ctx, c.shooter);
  const part2 = c.part === 2;
  if (!part2 || !VS) {
    VS = { shooter: c.shooter, target: c.target, declared: c.target, charge: c.charge, diagonal: c.diagonal, reactions: [], cards: [], extras: [], declDamage: c.damage, terms: c.terms };
  } else { Object.assign(VS, { target: c.target, declared: c.target, diagonal: c.diagonal, declDamage: c.damage, terms: c.terms, done: false, reactions: [] }); }
  hint(ctx, `${nick(ctx, c.shooter)}: Залп по ${dat(ctx, c.target)}${c.charge ? ` · Заряд «${cardName(ctx, c.charge)}»` : ''}`);
  plank(ctx, c.shooter).classList.add(SHOOTER);
  ctx.board.querySelectorAll(`.plank.${TARGETED}`).forEach((p) => p.classList.remove(TARGETED));
  plank(ctx, c.target).classList.add(TARGETED);
  payKegs(ctx, side, (c.cost.volley || 0) + (c.cost.card || 0), 0);
  const pp = placePlate(ctx, c.shooter);
  const extra = (c.noDiagBy ? `<div class="nodiag">по диагонали без штрафа: «${esc(cardName(ctx, c.noDiagBy))}»</div>` : '') +
    (c.noReact ? '<span class="stamp">Без Реакций</span>' : '') + (part2 ? '<span class="stamp" style="color:#24465c;border-color:#24465c">второй борт</span>' : '');
  if (!VS.plate || !VS.plate.isConnected) {
    VS.plate = mk(ctx, 'plate', pp.x, pp.y);
    VS.plate.style.setProperty('--pc', shipData(ctx.data, c.shooter).color);
    VS.plate.style.width = pp.w + 'px';
    A(ctx, VS.plate, [{ opacity: 0, translate: '0 -8px' }, { opacity: 1, translate: '0 0' }], 300, 120, 'ease-out', 'forwards');
  }
  VS.plateBox = pp;
  VS.plate.innerHTML = plateHTML(ctx, { shooter: c.shooter, target: c.target, track: c.track, damage: c.damage, terms: c.terms, extra });
  fitPlate(ctx);
  if (c.charge && !part2) {
    const from = cardOrigin(ctx, c.charge, c.chargeFrom || c.shooter);
    VS.cards.push(flyCard(ctx, c.charge, from, cardSlot(ctx, pp, 0), 150, 450, { ship: c.chargeFrom || c.shooter }));
  }
  if (part2) { const sb = bx(ctx, plank(ctx, c.shooter)); tag(ctx, sb.cx, facingY(ctx, c.shooter) + 16 * dirOf(ctx, c.shooter), 'второй борт', 100, 'plus', 1400); }
  await wait(ctx, c.charge && !part2 ? 820 : 620);
};

PLAY.window = async (c, ctx) => {
  hint(ctx, c.mine ? 'Реакция?' : 'Противник может ответить Реакцией…');
  // game: the real panel of the middle (Reactions, «Компания решает…», the Volley panel) stands where the window would be.
  if (ctx.board.querySelector('[data-fx-gap] .dock')) {
    await wait(ctx, (c.mine ? 950 : 1300) + 150);
    return;
  }
  const W = ctx.board.clientWidth, g = gapBox(ctx);
  let x = W / 2;
  if (VS && VS.plate) { const pb = bx(ctx, VS.plate); x = W < 701 ? (pb.cx > W / 2 ? pb.x / 2 : (pb.r + W) / 2) : W / 2; }
  const after = c.phase === 'after';
  const html = c.mine
    ? `<b>${after ? 'Можно ответить после попадания' : 'Ваше окно Реакций'}</b><span>в игре здесь панель решения<i></i><i></i><i></i></span>`
    : `<b>${after ? 'Противник может ответить…' : 'Противник может ответить…'}</b><span>${after ? 'после попадания' : 'ждём Реакцию'}<i></i><i></i><i></i></span>`;
  const win = mk(ctx, 'window' + (c.mine ? ' mine' : ''), x, g.cy, html);
  A(ctx, win, [{ opacity: 0, scale: '0.94' }, { opacity: 1, scale: '1' }], 200, 0, 'ease-out', 'forwards');
  await wait(ctx, c.mine ? 950 : 1300);
  A(ctx, win, [{ opacity: 1 }, { opacity: 0 }], 200, 0, 'ease-in', 'forwards');
  await wait(ctx, 150);
};

PLAY.reaction = async (c, ctx) => {
  hint(ctx, `${nick(ctx, c.ship)}: Реакция «${cardName(ctx, c.card)}»`);
  if (c.cost) payKegs(ctx, sideOf(ctx, c.ship), c.cost, 100);
  const from = c.fromPlan ? (() => { const s = bx(ctx, plank(ctx, c.ship)); return { x: s.x + 8, y: isTop(ctx, c.ship) ? s.b - 40 : s.y - 60, s: 0.7 }; })() : cardOrigin(ctx, c.card, c.seat);
  let to;
  if (VS && VS.plate && VS.plateBox && c.phase === 'before') to = cardSlot(ctx, VS.plateBox, VS.cards.length);
  else { const s = bx(ctx, plank(ctx, c.ship)); to = { x: s.cx - 40, y: isTop(ctx, c.ship) ? s.b + 6 : s.y - 110, r: 3, s: 0.72 }; }
  const card = flyCard(ctx, c.card, from, to, 0, 500, { ship: c.seat });
  if (VS) { VS.cards.push(card); VS.reactions.push({ card: c.card, ship: c.ship, r: c.r }); } else setTimeout(() => A(ctx, card, [{ opacity: 1 }, { opacity: 0 }], 300, 0, 'ease-in', 'forwards'), ms(ctx, 1400));
  if (c.fromPlan) A(ctx, card.firstElementChild!, [{ transform: 'rotateY(90deg)' }, { transform: 'none' }], 300, 300, 'ease-out', 'backwards');
  await wait(ctx, 520);
  const tgt = VS ? VS.target : null;
  if (c.phase === 'before' && tgt && VS) {
    const vs = VS;
    if (c.r === 'reduce') {
      const tb = bx(ctx, plank(ctx, c.ship === tgt ? tgt : c.ship));
      if (cardName(ctx, c.card) === 'Уйти по ветру') {
        lean(ctx, tgt, 'translateX(10px) rotate(1.2deg)', 420, 'cubic-bezier(.3,1.4,.5,1)');
        if (ctx.rich) for (let k = 0; k < 6; k++) { const st = mk(ctx, 'streak', 0, 0); st.style.width = '120px'; const y = tb.y + 10 + k * (tb.h / 6); A(ctx, st, [{ opacity: 0, transform: `translate(${tb.x - 140}px,${y}px)` }, { opacity: 0.9, offset: 0.4 }, { opacity: 0, transform: `translate(${tb.r + 40}px,${y - 6}px)` }], 700, k * 60, 'ease-in'); }
      } else {
        const ar = overlayAt(ctx, 'armor', tb, 5); vs.extras.push(ar);
        A(ctx, ar, [{ opacity: 0, scale: '1.06' }, { opacity: 1, scale: '1' }], 380, 0, 'ease-out', 'forwards');
        burst(ctx, 'spark', tb.cx, facingY(ctx, c.ship), 120, 10, 14, 34, 500);
      }
    }
    if (c.r === 'redirect') {
      const cov = plank(ctx, c.ship), d0 = bx(ctx, plank(ctx, vs.declared)), c0 = bx(ctx, cov);
      plank(ctx, vs.declared).classList.remove(TARGETED);
      lean(ctx, c.ship, `translate(${(d0.cx - c0.cx) * 0.05}px,${dirOf(ctx, c.ship) * 6}px)`, 450, 'cubic-bezier(.2,.8,.3,1.2)');
      cov.classList.add(TARGETED);
      vs.target = c.ship;
      const np = placePlate(ctx, vs.shooter), op = vs.plateBox!;
      if (Math.abs(np.x - op.x) > 4) {
        A(ctx, vs.plate!, [{ translate: '0 0' }, { translate: `${np.x - op.x}px 0` }], 450, 120, 'cubic-bezier(.3,0,.2,1)', 'forwards');
        vs.plateBox = { ...op, x: np.x };
        vs.cards.forEach((el, k) => setTimeout(() => { if (ctx.run === ctx.live()) moveTo(ctx, el, cardSlot(ctx, vs.plateBox!, k), 450); }, ms(ctx, 120)));
      }
    }
    if (c.r === 'reduce_all') { const g = gapBox(ctx); if (PERSIST.whirl) PERSIST.whirl.remove(); PERSIST.whirl = whirlpool(ctx, ctx.board.clientWidth / 2, g.cy, 0, Math.min(170, ctx.board.clientWidth * 0.35), 6000); }
    if (c.r === 'cancel') {
      const tb = bx(ctx, plank(ctx, tgt));
      const nm = cardName(ctx, c.card);
      if (nm === 'Уйти на глубину') {
        const w = overlayAt(ctx, 'underwater', tb); vs.extras.push(w);
        A(ctx, w, [{ opacity: 0 }, { opacity: 1 }], 500, 0, 'ease-in', 'forwards');
        lean(ctx, tgt, 'translateY(6px) scale(.985)', 500, 'ease-in-out');
        bubbles(ctx, tb.x + 8, tb.b - 4, tb.w - 16, 100, 14, 50);
      } else if (nm === 'Банка с землёй') {
        const jar = mk(ctx, 'blot', 0, 0, '<svg viewBox="0 0 30 34" width="30" height="34"><rect x="8" y="2" width="14" height="5" rx="1.5" fill="#7a5230"/><path d="M6 8 h18 v20 a4 4 0 0 1 -4 4 h-10 a4 4 0 0 1 -4 -4z" fill="rgba(200,220,230,.6)" stroke="#5e6b74" stroke-width="1.5"/><path d="M7 20 h16 v8 a3 3 0 0 1 -3 3 h-10 a3 3 0 0 1 -3 -3z" fill="#6b5236"/></svg>');
        vs.extras.push(jar);
        A(ctx, jar, [{ opacity: 0, transform: `translate(${tb.cx}px,${tb.y - 10}px) scale(.5)` }, { opacity: 1, transform: `translate(${tb.cx}px,${tb.y - 20}px) scale(1.4) rotate(-8deg)`, offset: 0.4 }, { transform: `translate(${tb.cx}px,${tb.y - 20}px) scale(1.4) rotate(8deg)`, offset: 0.6 }, { opacity: 1, transform: `translate(${tb.cx}px,${tb.y - 20}px) scale(1.4) rotate(-6deg)` }], 700, 0, 'ease-in-out', 'forwards');
      } else {
        const n = overlayAt(ctx, 'night', tb); vs.extras.push(n);
        A(ctx, n, [{ opacity: 0 }, { opacity: 1 }], 500, 0, 'ease-in', 'forwards');
        if (ctx.rich) for (let k = 0; k < 8; k++) { const s = mk(ctx, 'sparkle', 0, 0); const x = tb.x + Math.random() * tb.w, y = tb.y + Math.random() * tb.h; A(ctx, s, [{ opacity: 0, transform: `translate(${x}px,${y}px) scale(.5)` }, { opacity: 0.9, offset: 0.5 }, { opacity: 0, transform: `translate(${x}px,${y}px)` }], 900, 300 + k * 80); }
      }
    }
    if (c.r === 'cancel_charge' && vs.cards[0]) {
      const cc = vs.cards[0].querySelector<HTMLElement>('.hcard')!;
      cc.style.position = 'relative';
      cc.insertAdjacentHTML('beforeend', '<svg class="ink" viewBox="0 0 110 128" preserveAspectRatio="none"><path d="M10 12 L100 116" /><path d="M100 14 L12 114" /></svg>');
      vs.cards[0].querySelectorAll('.ink path').forEach((p, k) => A(ctx, p, [{ strokeDashoffset: 110 }, { strokeDashoffset: 0 }], 260, k * 200, 'ease-in', 'forwards'));
      A(ctx, vs.cards[0], [{ opacity: 1 }, { opacity: 0.45 }], 600, 500, 'ease-in', 'forwards');
    }
    if (c.r === 'cancel_crew') {
      const tr = bx(ctx, trackEl(ctx, tgt, 'crew'));
      const bar = overlayAt(ctx, 'barrier', { x: tr.x, y: tr.y, w: tr.w, h: tr.h }, 4); vs.extras.push(bar);
      A(ctx, bar, [{ opacity: 0, translate: `0 ${14 * -dirOf(ctx, tgt)}px` }, { opacity: 1, translate: '0 0' }], 380, 0, 'cubic-bezier(.2,.8,.3,1.3)', 'forwards');
    }
  }
  await wait(ctx, c.phase === 'before' ? 620 : 380);
};

/** The shot: a cannonball = 1 damage; where each one flies — from the layout of planFx (to: track | hull). */
PLAY.shot = async (c, ctx) => {
  if (!VS) VS = { shooter: c.shooter, target: c.target, declared: c.declared, charge: c.charge, reactions: c.reactions, cards: [], extras: [], declDamage: c.damage };
  const vs = VS;
  vs.target = c.target;
  const shooterEl = plank(ctx, c.shooter), tPl = plank(ctx, c.target);
  hint(ctx, `${nick(ctx, c.shooter)} → ${nick(ctx, c.target)}: ${c.damage} по ${TRACK_DATIVE[c.track]}`);
  // the plate: the final breakdown, the new lines of Reactions highlighted, a cancelled Charge struck out
  if (!vs.plate || !vs.plate.isConnected) { const pp = placePlate(ctx, c.shooter); vs.plate = mk(ctx, 'plate', pp.x, pp.y); vs.plate.style.width = pp.w + 'px'; vs.plate.style.setProperty('--pc', shipData(ctx.data, c.shooter).color); vs.plateBox = pp; A(ctx, vs.plate, [{ opacity: 0 }, { opacity: 1 }], 200, 0, 'ease-out', 'forwards'); }
  const cls: Record<string, string> = {};
  for (const r of c.reactions) cls[cardName(ctx, r.card)] = 'new';
  const blocked = c.shots.filter((b) => b.out === 'block').reduce((n, b) => n + b.units, 0);
  const extra = (c.chargeCancelled && c.charge ? `<div class="who"><span class="struck">«${esc(cardName(ctx, c.charge))}»</span> отменён</div>` : '') + (blocked ? `<div class="terms"><span class="new">${esc((c.shots.find((b) => b.out === 'block')!.label || '').replace(/ −\d+$/, ''))}</span><span class="neg new">−${blocked}</span></div>` : '');
  vs.plate.innerHTML = plateHTML(ctx, { shooter: c.shooter, declared: c.declared, target: c.target, track: c.track, damage: c.damage, was: vs.declDamage, terms: c.terms, cls, extra });
  fitPlate(ctx);
  A(ctx, vs.plate, [{ scale: '1' }, { scale: '1.04' }, { scale: '1' }], 300, 0, 'ease-out', 'none');
  await wait(ctx, 260);
  // the cannonballs
  const s = bx(ctx, shooterEl), sy = facingY(ctx, c.shooter), down = dirOf(ctx, c.shooter);
  const muzzle = c.shots.filter((b) => !['under', 'keg', 'joint'].includes(b.kind));
  const sp = Math.min(30, (s.w * 0.55) / Math.max(1, muzzle.length));
  // FX-D (A5 §3.9): the broadside of the prototype — the fuses, the guns one after another (a cone of fire, a shockwave,
  // grains, a jet of powder smoke that stays on the sea a while as a trace), the planks kick back, the table shakes; an
  // iron ball with its trail and shadow; a hit — a fireball, splinters, black smoke, a board falls into the sea; a miss —
  // spouts of water. The timings are fx/timing.ts (VOLLEY_K).
  const FUSE = T.volley.fuse, STEP = T.volley.gunStep, FLY = T.volley.fly, FLY_HIT = T.volley.flyHit;
  const svg = fxSvg(ctx);
  const sea = seaScars(ctx);
  const smoke = ctx.rich && sea ? scar(fxSvg(ctx, sea), 'short', c.shooter) : null;
  const tb0 = bx(ctx, tPl), aimAt = { x: tb0.cx, y: facingY(ctx, c.target) };
  const gunScale = Math.min(1.05, Math.max(0.6, ctx.board.clientWidth / 1300));
  let fallen = false, hits = 0;
  let mi = 0, kTrack = 0, kHull = 0, lastHit = 0, firstHit = true, kegI = 0;
  const cur = { track: shownTrack(ctx, c.target, c.track), hull: shownTrack(ctx, c.target, 'hull') };
  const labelled = new Set<string>();
  c.shots.forEach((b, i) => {
    const t0 = FUSE + i * STEP;
    let p0;
    if (b.kind === 'under') { p0 = { x: s.cx + s.w * 0.32, y: sy + down * 22 }; bubbles(ctx, p0.x - 10, p0.y + 6, 20, t0 - 260, 8, 18); splash(ctx, p0.x, p0.y, t0 - 40); }
    else if (b.kind === 'keg') { const kids = holdEl(ctx, sideOf(ctx, c.shooter)).querySelectorAll('[data-fx-keg]'); const kb = bx(ctx, kids[Math.max(0, ctx.display.powder[sideOf(ctx, c.shooter)] + kegI++)] || kids[0]); p0 = { x: kb.cx, y: kb.cy }; flash(ctx, p0.x, p0.y, t0, 0.8); }
    else if (b.kind === 'joint') { const ally = ships(ctx).find((x) => sideOf(ctx, x) === sideOf(ctx, c.shooter) && x !== c.shooter)!; const ab = bx(ctx, plank(ctx, ally)); p0 = { x: ab.cx, y: facingY(ctx, ally) }; flash(ctx, p0.x, p0.y, t0, 1.2); puff(ctx, p0.x, p0.y + down * 4, t0 + 20); if (b.label) tag(ctx, p0.x, p0.y + down * 18, b.label, t0, 'plus', 1500); }
    else {
      const g = mi++;
      p0 = { x: s.cx - (sp * (muzzle.length - 1)) / 2 + sp * g, y: sy };
      // the fuse spits sparks, then the gun goes off; after the third gun the shots are lighter (the budget of the layer)
      fuseSparks(ctx, svg, p0.x, p0.y, -down, Math.max(0, t0 - FUSE) * 0.3, FUSE * 0.62);
      const full = g < 3;
      gunFire(ctx, svg, full ? smoke : null, p0.x, p0.y + down * 4, Math.atan2(aimAt.y - p0.y, aimAt.x - p0.x), gunScale, t0, { grains: full ? 9 : 3, puffs: full ? 11 : 4, wads: full ? 4 : 0, life: SMOKE_LIFE, flash: T.volley.flash });
      A(ctx, shooterEl, [{ translate: '0 0' }, { translate: `0 ${-down * 6}px`, offset: 0.15 }, { translate: '0 0' }], T.volley.flash, t0, 'ease-out', 'none');
      boom(ctx, Math.max(1, 4 - g), 260, t0);
      if (g === 0) flashBoard(ctx, '#ffcf8a', 0.12, 200, t0);
    }
    // an iron ball of the A5 look (ballFly) where it only flies; the projectiles of the other kinds and the balls that
    // bounce, stick or circle keep their element
    let ballEl: HTMLElement | null = null;
    const ball = () => (ballEl ??= projectile(ctx, b.kind, b.big));
    const flyBall = (pts: Pt[], d: number, delay: number, opt: Parameters<typeof fly>[5] = {}) => {
      if (b.kind === 'core') ballFly(ctx, svg, pts[0], pts[pts.length - 1], d, delay, 18);
      else fly(ctx, ball(), pts, d, delay, opt);
    };
    const spin = b.kind === 'chain' ? 720 : 0;
    const tb = bx(ctx, tPl);
    if (b.out === 'hit') {
      const tr: Track = b.to === 'hull' ? 'hull' : c.track;
      const k = b.to === 'hull' ? kHull : kTrack;
      const now = b.to === 'hull' ? cur.hull : cur.track;
      const markEl = b.kind === 'mark' && (tPl.querySelector('[data-fx-mark] svg') || tPl.querySelector('[data-fx-statuses]'));
      const p1 = markEl ? (() => { const m = bx(ctx, markEl); return { x: m.cx, y: m.cy }; })() : fxPoint(ctx, c.target, tr, now - 1 - k); // «в метку» — the ball hits the blot on the chip
      if (b.to === 'hull') kHull += b.units; else kTrack += b.units;
      const pts = curve(p0, p1, (i % 2 ? 0.06 : -0.06) * down);
      flyBall(pts, FLY_HIT, t0, { spin });
      if (ctx.rich && ['core', 'under', 'joint', 'gold', 'ghost'].includes(b.kind)) for (const [q, op] of [[1, 0.35], [2, 0.18]]) { const gh = mk(ctx, 'ball trail', 0, 0); A(ctx, gh, pts.map((p, j) => ({ offset: j / (pts.length - 1), opacity: j === pts.length - 1 ? 0 : op, transform: `translate(${p.x}px,${p.y}px) scale(${0.8 - q * 0.15})` })), FLY_HIT, t0 + q * 28, 'cubic-bezier(.3,0,.75,1)', 'forwards'); }
      if (b.kind === 'fire' && ctx.rich) for (let q = 0; q < 8; q++) { const em = mk(ctx, 'ember', 0, 0); const j = Math.floor((q / 8) * (pts.length - 2)) + 1; const p = pts[j]; A(ctx, em, [{ opacity: 1, transform: `translate(${p.x}px,${p.y}px)` }, { opacity: 0, transform: `translate(${p.x + (Math.random() - 0.5) * 14}px,${p.y - 10 - Math.random() * 10}px)` }], 500, t0 + (FLY_HIT * j) / (pts.length - 1)); }
      const th = t0 + FLY_HIT;
      lastHit = Math.max(lastHit, th);
      const newV = Math.max(0, now - k - b.units);
      at(ctx, th, () => setTrack(ctx, c.target, tr, newV, '#c0392b'));
      hitBlast(ctx, svg, p1.x, p1.y, 1.1 * gunScale, th, T.volley.blast, hits++ > 0);
      if (hits === 1) { flashBoard(ctx, '#fff6d8', 0.38, 240, th); boom(ctx, 6, 420, th); }
      // the first board of the Hull broken off falls into the sea and stays afloat a while (a long trace)
      if (tr === 'hull' && !fallen && !markEl) { fallen = true; fallBoard(ctx, svg, c.target, p1, th); }
      // FX-A: the soot of the hit stays on the plank for a while (a short trace, fx/scars.ts)
      if (!markEl) at(ctx, th, () => hitMark(ctx, c.target, p1.x, p1.y));
      if (b.kind === 'chain') burst(ctx, 'shred', p1.x, p1.y, th, 8, 14, 32, 650);
      else if (b.kind === 'grape') burst(ctx, 'dust', p1.x, p1.y, th, 5, 6, 20, 700);
      if (b.label && !labelled.has(b.label) && b.kind !== 'joint') { labelled.add(b.label); tag(ctx, p1.x, facingY(ctx, c.target) - 14 * down, b.label, th - 120, 'plus', 1500); }
      if (firstHit) { firstHit = false; at(ctx, th, () => tPl.classList.add('hitframe')); shake(ctx, tPl, th, 3); }
    } else if (b.out === 'overkill' || b.out === 'moon') {
      const p1 = b.out === 'moon' ? fxPoint(ctx, c.target, 'crew', 0) : { x: tb.x + tb.w * (0.3 + 0.4 * Math.random()), y: tb.cy };
      flyBall(curve(p0, p1, 0.05 * down), FLY, t0);
      if (b.out === 'moon') { burst(ctx, 'sparkle', p1.x, p1.y, t0 + FLY, 6, 6, 18, 600); tag(ctx, p1.x, p1.y - 16 * down, b.label || 'Лунный свет −1', t0 + FLY, '', 1500); }
      else { flash(ctx, p1.x, p1.y, t0 + FLY, 1.4); burst(ctx, 'dust', p1.x, p1.y, t0 + FLY, 6, 8, 24, 700); }
      lastHit = Math.max(lastHit, t0 + FLY);
    } else if (b.out === 'water' || b.out === 'wind' || b.out === 'past') {
      const g2 = gapBox(ctx);
      const aim = { x: tb.x + tb.w * 0.4, y: facingY(ctx, c.target) };
      const mid = { x: p0.x + (aim.x - p0.x) * 0.45, y: p0.y + (aim.y - p0.y) * 0.45 };
      const narrow = ctx.board.clientWidth < 701 ? 0.6 : 1;
      let pts, end, d = FLY * 0.85;
      if (b.out === 'water') { end = { x: mid.x + (aim.x > p0.x ? -1 : 1) * 46 * narrow, y: g2.cy + 8 }; pts = curve(p0, end, 0.18 * down); }
      else if (b.out === 'past') { end = { x: tb.x + (i % 2 ? tb.w * 0.95 : tb.w * 0.05), y: facingY(ctx, c.target) - down * 18 }; pts = curve(p0, end, (i % 2 ? -0.1 : 0.1) * down); d = FLY; }
      else { end = { x: mid.x + 78 * narrow, y: g2.cy + 14 }; d = FLY * 1.25; pts = [...curve(p0, mid, 0, 8), ...curve(mid, end, -0.35 * down, 10).slice(1)];
        if (ctx.rich) { const gu = mk(ctx, 'gust', 0, 0, '<svg viewBox="0 0 220 40" width="220" height="40"><g fill="none" stroke="#9FB6C6" stroke-width="2" stroke-linecap="round"><path d="M2 14 C60 4 120 26 218 12"/><path d="M20 30 C80 22 140 38 200 26" opacity=".7"/></g></svg>'); A(ctx, gu, [{ opacity: 0, transform: `translate(${mid.x - 40}px,${mid.y + 6}px) scaleX(.4)` }, { opacity: 0.9, offset: 0.3 }, { opacity: 0, transform: `translate(${mid.x + 90}px,${mid.y + 10}px) scaleX(1)` }], 650, t0 + FLY * 0.35); } }
      flyBall(pts, d, t0, { lift: 0.15 });
      if (VS && VS.dust) { burst(ctx, 'dust', end.x, end.y, t0 + d * 0.6, 8, 6, 22, 700); } else if (b.out === 'past') splash(ctx, end.x, end.y, t0 + d); else missSplash(ctx, svg, end.x, end.y, 0.85 * gunScale, t0 + d, T.volley.splash);
      if (b.label) tag(ctx, end.x + (end.x > ctx.board.clientWidth / 2 ? -10 : 10), end.y - 26 * down, b.label, t0 + d + 40, '', 1700);
    } else if (b.out === 'bounce') {
      const edge = { x: tb.x + tb.w * (0.25 + 0.18 * (i % 3)), y: facingY(ctx, c.target) - down * 6 };
      fly(ctx, ball(), curve(p0, edge, 0.04 * down), FLY * 0.9, t0, { fadeEnd: false });
      const t2 = t0 + FLY * 0.9;
      burst(ctx, 'spark', edge.x, edge.y, t2, 9, 12, 28, 420, down > 0 ? -Math.PI / 2 : Math.PI / 2, Math.PI * 1.3);
      const back = { x: edge.x + (i % 2 ? 34 : -34), y: edge.y - down * 46 };
      A(ctx, ball(), [{ transform: `translate(${edge.x}px,${edge.y}px)`, opacity: 1 }, { transform: `translate(${back.x}px,${back.y}px) scale(.8)`, opacity: 0 }], 420, t2, 'cubic-bezier(.1,.6,.4,1)', 'forwards');
      if (b.label) tag(ctx, edge.x, edge.y - down * 30, b.label, t2, '', 1700);
    } else if (b.out === 'stick') {
      const edge = { x: tb.x + tb.w * 0.82, y: facingY(ctx, c.target) + down * 3 };
      fly(ctx, ball(), curve(p0, edge, 0.05 * down), FLY, t0, { fadeEnd: false });
      burst(ctx, 'splinter', edge.x, edge.y, t0 + FLY, 5, 8, 18, 500); flash(ctx, edge.x, edge.y, t0 + FLY, 0.7);
      if (b.label) tag(ctx, edge.x, edge.y - down * 26, b.label, t0 + FLY, '', 1900);
    } else if (b.out === 'whirl') {
      const g = gapBox(ctx), cx = ctx.board.clientWidth / 2, cy = g.cy, R0 = Math.min(60, ctx.board.clientWidth * 0.12);
      const spiral = Array.from({ length: 14 }, (_, j) => { const a = (j / 13) * Math.PI * 3, rr = R0 * (1 - j / 13); return { x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr * 0.55 }; });
      fly(ctx, ball(), [...curve(p0, { x: cx + R0, y: cy - 6 }, 0.1, 8), ...spiral.slice(1)], FLY * 1.6, t0, { lift: 0.05 });
      if (b.label) tag(ctx, cx, cy - 34, b.label, t0 + FLY, '', 1800);
    } else if (b.out === 'block') {
      const tr = bx(ctx, trackEl(ctx, c.target, 'crew'));
      const end = { x: tr.x + 10 + (i % 3) * 12, y: tr.cy };
      fly(ctx, ball(), curve(p0, end, 0.05 * down), FLY, t0, { fadeEnd: false });
      burst(ctx, 'dust', end.x, end.y, t0 + FLY, 5, 6, 18, 600);
      if (b.label && !labelled.has(b.label)) { labelled.add(b.label); tag(ctx, tr.cx, tr.y - 12, b.label, t0 + FLY, '', 1800); }
    }
  });
  const endShots = FUSE + c.shots.length * STEP + FLY_HIT * 1.2;
  if (c.damage >= 4) at(ctx, lastHit, () => shake(ctx, ctx.board, 0, c.damage >= 6 ? 8 : 4, 320));
  if (c.amount > 0) pillAt(ctx, c.target, c.track, c.amount, lastHit + 60);
  if (c.toHull > 0) pillAt(ctx, c.target, 'hull', c.toHull, lastHit + 160);
  if (c.fire) {
    const hd = bx(ctx, tPl.querySelector('.plank-head')!);
    const fl = mk(ctx, 'flame', 0, 0, FLAME_SVG);
    A(ctx, fl, [{ opacity: 0, transform: `translate(${hd.cx}px,${bx(ctx, tPl).cy}px) scale(.4)` }, { opacity: 1, transform: `translate(${hd.cx}px,${bx(ctx, tPl).cy}px) scale(1.5)`, offset: 0.3 }, { opacity: 1, transform: `translate(${hd.r - 24}px,${hd.cy}px) scale(1)` }, { opacity: 0, transform: `translate(${hd.r - 24}px,${hd.cy}px) scale(1)` }], 900, lastHit + 250, 'ease-in-out', 'forwards');
    burst(ctx, 'ember', hd.r - 24, hd.cy, lastHit + 800, 8, 6, 18, 500);
    tag(ctx, hd.cx, hd.b + 10, 'Пожар', lastHit + 600, 'plus', 1200);
  }
  if (c.souls) soulsFly(ctx, c.target, c.souls, lastHit + 300);
  await wait(ctx, Math.max(endShots, lastHit) + (c.fire ? Math.max(1100, T.volley.linger) : T.volley.linger));
  unleanAll(ctx);
  vs.done = true;
  clearVS(ctx, true);
  await wait(ctx, 260);
};

PLAY.cancel = async (c, ctx) => {
  if (c.card && !c.shooter) { // a card is cancelled (not a Volley)
    const cur = curCard();
    const el = cur && cur.el;
    const g = gapBox(ctx);
    const st = mk(ctx, 'stamp-fx', ctx.board.clientWidth / 2, g.cy, c.lost ? 'Карта пропала' : 'Отменено');
    A(ctx, st, [{ opacity: 0, scale: '1.8' }, { opacity: 1, scale: '1' }], 260, 0, 'cubic-bezier(.3,1.6,.5,1)', 'forwards');
    if (el) { burst(ctx, 'dust', bx(ctx, el).cx, bx(ctx, el).cy, 200, 12, 10, 40, 800); A(ctx, el, [{ opacity: 1 }, { opacity: 0, filter: 'blur(3px)' }], 600, 250, 'ease-in', 'forwards'); }
    await wait(ctx, 1100);
    A(ctx, st, [{ opacity: 1 }, { opacity: 0 }], 200, 0, 'ease-in', 'forwards');
    return;
  }
  const shooter = c.shooter!, target = c.target!;
  if (!VS) VS = { shooter, target, declared: target, charge: null, cards: [], extras: [], reactions: [], declDamage: 0 };
  hint(ctx, `Залп ${gen(ctx, shooter)} отменён${c.by ? ` «${cardName(ctx, c.by)}»` : ''}`);
  if (VS.plate) { const st = document.createElement('span'); st.className = 'stamp'; st.textContent = 'Залп отменён'; VS.plate.appendChild(st); A(ctx, st, [{ opacity: 0, scale: '1.8' }, { opacity: 1, scale: '1' }], 260, 0, 'cubic-bezier(.3,1.6,.5,1)', 'both'); }
  VS.dust = !!c.by && cardName(ctx, c.by) === 'Банка с землёй';
  const n = Math.max(1, VS.declDamage || shownTrack(ctx, shooter, 'guns'));
  const shots: Shot[] = Array.from({ length: Math.min(8, n) }, () => ({ kind: 'core', out: 'past', units: 1, label: null, to: null }));
  await PLAY.shot({ kind: 'shot', ev: [], shooter, target: VS.target || target, declared: VS.declared, track: 'hull', damage: 0, terms: [], charge: null, chargeCancelled: false, reactions: VS.reactions, part: 1, shots, amount: 0, toHull: 0, fire: 0, souls: 0, sea: null }, ctx);
};

/** The answer of a Reaction («Ответный огонь», «Тяжёлый борт», «Огненная стена»…): from the defender to the shooter. */
PLAY.counter = async (c, ctx) => {
  const from = plank(ctx, c.from), fb = bx(ctx, from), fy = facingY(ctx, c.from), down = dirOf(ctx, c.from);
  hint(ctx, `Ответ «${cardName(ctx, c.card)}»: ${nick(ctx, c.from)} → ${nick(ctx, c.to)}`);
  tag(ctx, fb.cx, fy + down * 18, `Ответ: ${cardName(ctx, c.card)}`, 0, 'plus', 1600);
  let n = 0, lastHit = 0;
  const fireCard = cardFx(ctx, c.card).fire;
  // FX-D: the answer fires with the same guns and hits as the Volley (smaller, no smoke left behind)
  const svg = fxSvg(ctx), tb = bx(ctx, plank(ctx, c.to));
  for (const h of c.hits) {
    for (const [tr, units] of [[h.track, h.amount], ['hull', h.toHull]] as [Track, number][]) {
      const now = shownTrack(ctx, c.to, tr);
      for (let j = 0; j < units; j++, n++) {
        const t0 = 120 + n * 170;
        const p0 = { x: fb.cx + ((n % 3) - 1) * 22, y: fy };
        gunFire(ctx, svg, null, p0.x, p0.y + down * 4, Math.atan2(tb.cy - p0.y, tb.cx - p0.x), 0.7, t0, { grains: 4, wads: 0, flash: T.volley.flash });
        const p1 = fxPoint(ctx, c.to, tr, now - 1 - j);
        const kind = fireCard ? 'fire' : KIND_BY_TRACK[tr];
        fly(ctx, projectile(ctx, kind), curve(p0, p1, 0.08), 440, t0, { spin: tr === 'sails' ? 720 : 0 });
        const v = Math.max(0, now - 1 - j);
        at(ctx, t0 + 440, () => setTrack(ctx, c.to, tr, v, '#c0392b'));
        hitBlast(ctx, svg, p1.x, p1.y, 0.8, t0 + 440, T.volley.blast, n > 0);
        if (tr !== 'hull') burst(ctx, tr === 'sails' ? 'shred' : 'dust', p1.x, p1.y, t0 + 440, 7, 14, 32, 600);
        if (n === 0) shake(ctx, plank(ctx, c.to), t0 + 440, 3);
        lastHit = t0 + 440;
      }
      if (units) pillAt(ctx, c.to, tr, units, lastHit + 60);
    }
  }
  if (c.fire) { const hd = bx(ctx, plank(ctx, c.to).querySelector('.plank-head')!); const fl = mk(ctx, 'flame', 0, 0, FLAME_SVG); A(ctx, fl, [{ opacity: 0, transform: `translate(${hd.cx}px,${hd.cy + 20}px) scale(.4)` }, { opacity: 1, transform: `translate(${hd.r - 24}px,${hd.cy}px) scale(1.3)` }, { opacity: 0, transform: `translate(${hd.r - 24}px,${hd.cy}px) scale(1)` }], 900, lastHit + 200, 'ease-in-out', 'forwards'); tag(ctx, hd.cx, hd.b + 10, 'Пожар', lastHit + 400, 'plus', 1200); }
  if (c.souls) soulsFly(ctx, c.to, c.souls, lastHit + 300);
  await wait(ctx, lastHit + 1000);
};

/** «Сердце Дейви Джонса»: the heart on «Индевор» beats twice, a thread to «Голландец», its Crew goes out. */
PLAY.heart = async (c, ctx) => {
  const by = ships(ctx).find((x) => sideOf(ctx, x) === sideOf(ctx, c.ship) && x !== c.ship)!;
  const a = bx(ctx, plank(ctx, by)), b = bx(ctx, plank(ctx, c.ship));
  hint(ctx, `${nick(ctx, by)}: Сердце Дейви Джонса — ещё один Залп ${gen(ctx, c.ship)}`);
  const h = { x: a.x + a.w * 0.62, y: a.cy };
  const heart = mk(ctx, 'heart', 0, 0, '<svg viewBox="0 0 30 26" width="30" height="26"><path d="M15 25 C4 17 0 11 2 6 C4 1 11 0 15 6 C19 0 26 1 28 6 C30 11 26 17 15 25Z" fill="#B23A2E" stroke="#6E1A12" stroke-width="1.5"/></svg>');
  A(ctx, heart, [{ opacity: 0, transform: `translate(${h.x}px,${h.y}px) scale(.4)` }, { opacity: 1, transform: `translate(${h.x}px,${h.y}px) scale(1)`, offset: 0.15 }, { transform: `translate(${h.x}px,${h.y}px) scale(1.4)`, offset: 0.3 }, { transform: `translate(${h.x}px,${h.y}px) scale(1)`, offset: 0.42 }, { transform: `translate(${h.x}px,${h.y}px) scale(1.4)`, offset: 0.56 }, { opacity: 1, transform: `translate(${h.x}px,${h.y}px) scale(1)`, offset: 0.7 }, { opacity: 0, transform: `translate(${h.x}px,${h.y}px) scale(1)` }], 2000, 0, 'ease-in-out');
  const tgt = { x: b.x + b.w * 0.3, y: b.cy }, W = ctx.board.clientWidth, H = ctx.board.clientHeight;
  const svg = mk(ctx, 'svgabs', 0, 0, `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><path d="M${h.x} ${h.y} C ${(h.x + tgt.x) / 2} ${h.y - 40}, ${(h.x + tgt.x) / 2} ${tgt.y + 40}, ${tgt.x} ${tgt.y}" fill="none" stroke="#B23A2E" stroke-width="2.5" stroke-dasharray="600" stroke-dashoffset="600" stroke-linecap="round"/></svg>`);
  A(ctx, svg, [{ opacity: 1 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], 1900, 600);
  A(ctx, svg.querySelector('path')!, [{ strokeDashoffset: 600 }, { strokeDashoffset: 0 }], 600, 750, 'ease-in-out', 'forwards');
  if (c.crew) {
    const now = shownTrack(ctx, c.ship, 'crew'), p = fxPoint(ctx, c.ship, 'crew', now - 1);
    at(ctx, 1400, () => setTrack(ctx, c.ship, 'crew', Math.max(1, now - c.crew), '#b23a2e'));
    flash(ctx, p.x, p.y, 1400, 0.9); tag(ctx, p.x, p.y - 14, `Сердце: −${c.crew} Команда`, 1450, '', 1500);
  }
  await wait(ctx, 2200);
};

/** The scene of the Volley for the queue: keepSet, afterRender, resetFx of page.js, the whirlpool at a «turn». */
export const VOLLEY_SCENE: FxScene = {
  keep: () => {
    const k: Element[] = [];
    if (VS) for (const el of [VS.plate, ...VS.cards, ...VS.extras]) if (el) k.push(el);
    if (PERSIST.whirl) k.push(PERSIST.whirl);
    return k;
  },
  afterRender: (ctx) => {
    if (!VS) return;
    const s = ctx.board.querySelector(`[data-fx-ship="${VS.shooter}"]`), t = ctx.board.querySelector(`[data-fx-ship="${VS.target}"]`);
    if (s) s.classList.add(SHOOTER);
    if (t) t.classList.add(TARGETED);
    for (const [code, tf] of Object.entries(VS.lean || {})) { const el = ctx.board.querySelector<HTMLElement>(`[data-fx-ship="${code}"]`); if (el) el.style.transform = tf; }
  },
  reset: (board) => {
    VS = null;
    PERSIST.whirl = null;
    if (board) unframe(board);
  },
  onTurn: (ctx) => {
    if (PERSIST.whirl) { A(ctx, PERSIST.whirl, [{ opacity: 1 }, { opacity: 0 }], 300, 0, 'ease-in', 'forwards'); PERSIST.whirl = null; }
  },
  alive: () => !!VS,
};

/** For tests: the scene of the current Volley. */
export const volleyScene = () => VS;
