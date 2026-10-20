// The sea cards: the clip «sea» (a new round → the table darkens → the sea card in the middle with its weather → the
// card flies into the sea chip of the status bar → the changes on the planks by the real events of the clip) and the
// quiet weather of the round (renderWeather). A port of docs/mockups/anim/level1/play-sea.js (see PORTING.md): the code
// is the reference's, what changed is how an element is found (the data-fx-* DOM contract), the globals (the context
// `ctx`) and the types. The pictures of the cards are in seaArt.ts (P3), not copied here.
// Changes against the reference («game:»):
//  - the sea chip is React's (StatusBar, drawn from the displayed state): the clip does not write into it, it draws the
//    table with the events of the new sea (renderWith) — the chip and the weather follow; then the chip pulses;
//  - the weather of the round is drawn from the displayed state after each render (FxLayer.tsx); it is off — empty — in
//    «простые спецэффекты», with prefers-reduced-motion and at «мгновенно» (the layer is off then), so where it is
//    drawn it always moves (moving of the reference is true).
import { seaCardByCode, type GameEvent } from '../../../engine/state';
import type { Side } from '../../../engine/types';
import { flipTo, weatherHit } from './misc';
import type { RoundClip, SeaClip } from './planFx';
import {
  A, at, badgeMark, bx, capFirst, ring, filters, flashBoard, fxPoint, fxSvg, gainKegs, gapBox, hint, holdEl, holdTag, isTop, mk, plank, ringSvg, rnd, room,
  seaTemp, setTrack, shake, shownTrack, sparksSvg, sv, tag, trackEl, trackMark, visible, wait, waterColumn, flameEl, smolderEl, type FxCtx,
} from './primitives';
import { CELLS } from '../art/cells';
import { bigShip } from '../art/bigShips';
import { plankScars, scar } from './scars';
import { T } from './timing';
import { ROUND_LONG } from './weather';
import { wxSvg } from '../art/wx';
import { drawWeather } from './weather';

const R1 = (n: number) => Math.round(n * 10) / 10;
import type { ClipPlayer } from './FxLayer';

const esc = (s: string) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]!);
const strip = (h: string) => String(h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').replace(/ ([.,:;!?])/g, '$1').trim();
const other = (side: Side): Side => (side === 'ПИРАТЫ' ? 'КОМПАНИЯ' : 'ПИРАТЫ');

/** The ship of a side at a place (pos) on the displayed table: the pairs «opposite» and «diagonal» go by places, not by codes. */
export function shipAt(ctx: Pick<FxCtx, 'display' | 'data'>, side: Side, pos: number): string | undefined {
  const D = ctx.display;
  return Object.keys(D.ships).find((c) => ctx.data.ships.find((s) => s.code === c)?.side === side && D.ships[c].pos === pos && !D.ships[c].sunk);
}
/** «Напротив» — the same place of the other row; «по диагонали» — the other place (RULES.md: the columns are not mirrored). */
export function seaPairs(ctx: Pick<FxCtx, 'display' | 'data' | 'bottom'>, kind: 'opposite' | 'diagonal'): [string, string][] {
  const top = other(ctx.bottom), bot = ctx.bottom, out: [string, string][] = [];
  for (const p of [0, 1]) {
    const a = shipAt(ctx, top, p), b = shipAt(ctx, bot, kind === 'opposite' ? p : 1 - p);
    if (a && b) out.push([a, b]);
  }
  return out;
}
const seaKeyOf = (ctx: Pick<FxCtx, 'data'>, code: string) => seaCardByCode(ctx.data, code).key;

/* ——— the helpers of the weather ——— */
interface TableCtx { W: number; R: number; g: ReturnType<typeof gapBox>; fx: FxCtx }
function tableCtx(ctx: FxCtx): TableCtx {
  const rows = ctx.board.querySelectorAll(':scope > .team-row');
  const R = rows.length ? bx(ctx, rows[rows.length - 1]).b + 4 : ctx.board.clientHeight;
  return { W: ctx.board.clientWidth, R, g: gapBox(ctx), fx: ctx };
}
type Hit = { ship: string; track: 'hull' | 'sails' | 'guns' | 'crew'; amount: number; toHull: number };
type Fix = { ship: string; track: 'hull' | 'sails' | 'guns' | 'crew'; amount: number };
type Keg = { type: 'powderGained' | 'powderLost'; side: Side; amount: number };
function weatherRestore(ctx: FxCtx, e: Fix, t0: number, color = '#2F7A4F') {
  const now = shownTrack(ctx, e.ship, e.track);
  for (let j = 0; j < e.amount; j++) { const p = fxPoint(ctx, e.ship, e.track, now + j), t = t0 + j * 140; at(ctx, t, () => setTrack(ctx, e.ship, e.track, now + j + 1, color)); ring(ctx, p.x, p.y, t, 0.8, color); }
  trackMark(ctx, e.ship, e.track, e.amount, t0 + 100, true);
}
function powderFx(t: TableCtx, e: Keg, t0: number) {
  const ctx = t.fx;
  if (e.type === 'powderGained') { gainKegs(ctx, e.side, e.amount, { x: t.W / 2, y: t.g.cy }, t0); return; }
  const kg = holdEl(ctx, e.side), kids = kg.querySelectorAll('[data-fx-keg]'), n = ctx.display.powder[e.side];
  for (let k = 0; k < e.amount; k++) { const keg = kids[n - 1 - k]; if (!keg) continue; A(ctx, keg, [{ background: '#2A2521', transform: 'scale(1)' }, { background: '#5E86A0', transform: 'scale(1.3) translateY(2px)', offset: 0.4 }, { background: 'rgba(0,0,0,0)', transform: 'scale(.8) translateY(4px)' }], 700, t0 + k * 120, 'ease-in', 'forwards'); const kb = bx(ctx, keg); const dr = mk(ctx, 'bubble', 0, 0); A(ctx, dr, [{ opacity: 1, transform: `translate(${kb.cx}px,${kb.cy}px)` }, { opacity: 0, transform: `translate(${kb.cx}px,${kb.cy + 16}px)` }], 600, t0 + k * 120 + 200); }
  holdTag(ctx, kg, `−${e.amount} Порох`, t0, '', 1300);
}

/** game (S1): a rule of the sea card in the middle of the table (class «rule»: e2e checks it never touches a plank). The
 *  Legends (L1) put their explanations there too. */
export function ruleTag(ctx: FxCtx, x: number, y: number, text: string, delay: number, cls = '', dur = 1500): HTMLElement {
  const el = tag(ctx, x, y, text, delay, cls, dur);
  el.classList.add('rule');
  return el;
}

/**
 * The sea cards. A weather of the round (ROUND_LONG) rolls in over the sea and stays (fx/weather.ts); `rule` — its rule in
 * the middle of the table. A card «сразу» plays its own effect by the events of the clip: apply(t, effects, used) —
 * returns its length; the events it marks in used are not shown again.
 */
interface SeaFx {
  dim?: number;
  rule?: string;
  good?: boolean;
  apply?: (t: TableCtx, effects: GameEvent[], used: Set<GameEvent>) => number;
  applyAsync?: (t: TableCtx, effects: GameEvent[], used: Set<GameEvent>, events: GameEvent[]) => Promise<number>;
}
type Dmg = Extract<GameEvent, { type: 'damage' }>;
type Restored = Extract<GameEvent, { type: 'restored' }>;
const sv2 = (ctx: FxCtx) => fxSvg(ctx);
/** The edge of a plank to the sea and the side of the gap (−1 — the gap is above: a ship of the bottom row). */
const facing = (ctx: FxCtx, code: string) => { const b = bx(ctx, plank(ctx, code)); const top = isTop(ctx, code); return { b, y: top ? b.b : b.y, dir: top ? 1 : -1 }; };
/** A jagged bolt drawn from the sky with branches; white core, gold glow (bolt of template.html). */
function bolt(ctx: FxCtx, svg: Element, x0: number, y0: number, x1: number, y1: number, d: number): void {
  const pts: [number, number][] = [[x0, y0]], n = 11;
  for (let i = 1; i < n; i++) { const k = i / n; pts.push([x0 + (x1 - x0) * k + rnd(-18, 18) * (1 - k * 0.6), y0 + (y1 - y0) * k + rnd(-6, 6)]); }
  pts.push([x1, y1]);
  const path = 'M' + pts.map(([x, y]) => `${R1(x)} ${R1(y)}`).join(' L');
  let br = '';
  for (const k of [3, 5, 6]) { const [bx2, by2] = pts[k]; br += `M${R1(bx2)} ${R1(by2)} l${R1(rnd(-34, 34))} ${R1(rnd(16, 34))} l${R1(rnd(-12, 12))} ${R1(rnd(8, 16))}`; }
  const g = sv(svg, `<g><path d="${path}" fill="none" stroke="#ffd34a" stroke-width="16" stroke-linejoin="round" opacity=".45" ${filters(ctx) ? 'style="filter:blur(5px)"' : ''}/><path d="${br}" fill="none" stroke="#fff3c4" stroke-width="2" opacity=".9"/><path d="${path}" fill="none" stroke="#fff1b0" stroke-width="5" stroke-linejoin="round"/><path d="${path}" fill="none" stroke="#fff" stroke-width="2"/></g>`);
  A(ctx, g, [{ opacity: 0 }, { opacity: 1, offset: 0.05 }, { opacity: 0.25, offset: 0.2 }, { opacity: 1, offset: 0.3 }, { opacity: 0.9, offset: 0.7 }, { opacity: 0 }], d, 0, 'linear');
}
/** The table goes dark for a while (dimRoot of template.html), over the sea, not over the hand. */
function dimTable(t: TableCtx, alpha: number, d: number): void {
  const f = mk(t.fx, 'tint', 0, 0); f.style.width = t.W + 'px'; f.style.height = t.R + 'px'; f.style.background = `rgba(10,16,26,${alpha})`;
  A(t.fx, f, [{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.82 }, { opacity: 0 }], d, 0, 'linear');
}
/** A short mark at a box (the Hold): its text by the events. */
const nearHold = (ctx: FxCtx, side: Side) => bx(ctx, holdEl(ctx, side));

export const SEAFX: Record<string, SeaFx> = {
  storm: { rule: 'Каждый Залп −1 урон' },
  calm: { rule: 'Смена мест закрыта до конца раунда' },
  wind: { rule: 'Перестроение бесплатно для обеих команд', good: true },
  fog: { rule: 'Залпы по диагонали невозможны' },
  wave: { rule: 'В начале каждого хода: −1 Паруса ходящей команде' },
  maelstrom: { rule: 'В начале хода ходящие меняются местами · диагональ без штрафа' },
  clear: { rule: 'Залпы по кораблю напротив +1', good: true },
  reefs: { rule: 'Смена мест: −1 Корпус тому, кто двигается' },
  moon: { rule: 'Урон по Команде −1 (каждый)' },
  fleet: {},
  /** Гроза: the sky goes black, two far flashes, then the bolt strikes the sails of the ships the events hit; the sails
   *  burn and smoulder (a medium trace on the plank). */
  thunder: {
    applyAsync: async (t, effects, used) => {
      const ctx = t.fx, S = T.sea;
      const hits = effects.filter((e): e is Dmg => e.type === 'damage' && e.track === 'sails');
      if (!hits.length) { ruleTag(ctx, t.W / 2, t.g.cy, 'Парусов нет ни у кого — молния ушла в воду', 100, '', 1500); return 1500; }
      dimTable(t, 0.55, S.thunderDim);
      await wait(ctx, S.flash1); flashBoard(ctx, '#cfe0ff', 0.18, 300);
      await wait(ctx, S.flash2); flashBoard(ctx, '#cfe0ff', 0.22, 300);
      await wait(ctx, S.boltAt);
      const hi = sv2(ctx);
      for (const e of hits) {
        used.add(e);
        const now = shownTrack(ctx, e.ship, 'sails'), lost = Array.from({ length: e.amount }, (_, j) => fxPoint(ctx, e.ship, 'sails', now - 1 - j));
        const cx = lost.reduce((a, p) => a + p.x, 0) / lost.length, cy = lost[0].y, sa = bx(ctx, ctx.board.querySelector('[data-fx-gap]')!);
        bolt(ctx, hi, cx + rnd(-80, 80), Math.min(sa.y, cy) - 60, cx, cy, S.bolt);
        flashBoard(ctx, '#ffffff', 0.32, 420);
        shake(ctx, plank(ctx, e.ship), 0, 6, 460);
        sparksSvg(ctx, hi, cx, cy, 24);
        ringSvg(ctx, hi, cx, cy, 4, 46, '#fff3c4', 500, 0, 3);
        A(ctx, trackEl(ctx, e.ship, 'sails'), [{ filter: 'drop-shadow(0 0 0 #ffd34a)' }, { filter: 'drop-shadow(0 0 6px #ffd34a) brightness(1.5)', offset: 0.15 }, { filter: 'drop-shadow(0 0 4px #e8562a) sepia(.6)', offset: 0.6 }, { filter: 'none' }], 1600, 0, 'ease-out', 'none');
        for (const p of lost) { const f = flameEl(ctx, p.x, p.y + 10, 20); ctx.layer.appendChild(f); A(ctx, f, [{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1.2)', opacity: 1, offset: 0.2 }, { transform: 'scale(1)', opacity: 1, offset: 0.8 }, { transform: 'scale(.4) translateY(-6px)', opacity: 0 }], 1500, 80); }
        await wait(ctx, S.burn);
        weatherHit(ctx, e as Hit, 0, '#FFD84A');
        // the sails smoulder for the rest of the round (a medium trace of the ship)
        const host = plankScars(ctx, e.ship);
        if (host && ctx.rich) { const hb = bx(ctx, host), sm = smolderEl(lost[lost.length - 1].x - hb.x + 6, lost[lost.length - 1].y - hb.y - 8); host.appendChild(sm); scar(sm, 'medium', e.ship); }
        await wait(ctx, S.thunderNext);
      }
      return S.end;
    },
  },
  /** Русалки: a tail rises by the plank, a song goes up, a sailor is drawn into the sea — the ships of the events. */
  mermaids: {
    applyAsync: async (t, effects, used) => {
      const ctx = t.fx, S = T.sea, hi = sv2(ctx);
      let any = false;
      for (const e of effects) {
        if (e.type !== 'damage' || e.track !== 'crew') continue;
        used.add(e); any = true;
        const f = facing(ctx, e.ship), tx = f.b.x + f.b.w * 0.8, tyTop = f.dir > 0 ? f.y + 10 : f.y - 100, ty = tyTop + 84;
        const glow = sv(hi, `<ellipse cx="${R1(tx)}" cy="${R1(ty)}" rx="60" ry="16" fill="#7fe0c4"/>`);
        A(ctx, glow, [{ opacity: 0 }, { opacity: 0.35, offset: 0.3 }, { opacity: 0.25, offset: 0.8 }, { opacity: 0 }], S.tail);
        const tail = sv(hi, '<g><path d="M8 54 C8 34 20 22 26 10 C24 26 22 34 24 44 C32 40 40 42 46 48 C38 48 30 52 26 60 C22 54 16 54 8 54Z" fill="#9FD3C7" stroke="#2f6f78" stroke-width="1.2"/><path d="M16 50 q4 -8 8 -4 M20 42 q4 -6 6 -2" stroke="#2f6f78" stroke-width=".8" fill="none"/></g>');
        const kx = 1.6;
        A(ctx, tail, [{ opacity: 0, transform: `translate(${R1(tx - 26 * kx)}px,${R1(tyTop + 40)}px) scale(${kx})` }, { opacity: 1, transform: `translate(${R1(tx - 26 * kx)}px,${R1(tyTop - 4)}px) scale(${kx})`, offset: 0.3 }, { opacity: 1, transform: `translate(${R1(tx - 26 * kx)}px,${R1(tyTop)}px) scale(${kx}) rotate(3deg)`, offset: 0.8 }, { opacity: 0, transform: `translate(${R1(tx - 26 * kx)}px,${R1(tyTop + 50)}px) scale(${kx})` }], S.tail);
        ringSvg(ctx, hi, tx, ty, 6, 70, '#eef6f8', 1000, 0, 2);
        for (let i = 0, m = room(ctx, 5); i < m; i++) {
          const n = sv(hi, '<g><path d="M0 0 V-10 L7 -12 V-2" fill="none" stroke="#f6fff9" stroke-width="1.6"/><ellipse cx="-2" cy="0" rx="2.8" ry="2.1" fill="#f6fff9"/><ellipse cx="5" cy="-2" rx="2.8" ry="2.1" fill="#f6fff9"/></g>');
          A(ctx, n, [{ transform: `translate(${R1(tx)}px,${R1(ty - 30)}px) scale(1.6)`, opacity: 0 }, { opacity: 1, offset: 0.2 }, { transform: `translate(${R1(tx - 40 - i * 30)}px,${R1(ty - 30 + f.dir * -50)}px) scale(1.6)`, opacity: 0 }], 1500, 300 + i * 220);
        }
        await wait(ctx, S.drawAt);
        const now = shownTrack(ctx, e.ship, 'crew'), p = fxPoint(ctx, e.ship, 'crew', now - 1);
        const fl = mk(ctx, 'lg-fly', 0, 0, CELLS.CREW.replace('width="14" height="17"', 'width="20" height="24"'));
        A(ctx, fl, [{ transform: `translate(${R1(p.x - 10)}px,${R1(p.y - 12)}px) rotate(0deg)`, opacity: 1 }, { transform: `translate(${R1((p.x + tx) / 2)}px,${R1(Math.min(p.y, ty) - 40)}px) rotate(-120deg)`, opacity: 1, offset: 0.5 }, { transform: `translate(${R1(tx)}px,${R1(ty)}px) rotate(-300deg) scale(.6)`, opacity: 0 }], S.draw, 0, 'cubic-bezier(.4,0,.6,1)');
        weatherHit(ctx, e as Hit, 0, '#5AA0A6');
        waterColumn(ctx, hi, tx, ty + 8, 30, S.draw - 20);
        await wait(ctx, S.draw + S.mermaidNext);
      }
      if (!any) { ruleTag(ctx, t.W / 2, t.g.cy, 'Команда 3 и больше теряет 1 — таких нет', 100, '', 1500); return 1500; }
      return S.end;
    },
  },
  /** Ром в волнах: a bottle bobs up to the plank, its cork pops, the sailor is back on his feet — the events. */
  rum: {
    applyAsync: async (t, effects, used) => {
      const ctx = t.fx, S = T.sea, hi = sv2(ctx);
      let any = false;
      for (const e of effects) {
        if (e.type !== 'restored') continue;
        used.add(e); any = true;
        const f = facing(ctx, e.ship), now = shownTrack(ctx, e.ship, e.track), p = fxPoint(ctx, e.ship, e.track, now);
        const bot = sv(hi, '<g><g transform="rotate(-20)"><path d="M-3 -16 H3 V-11 Q8 -8 8 -2 V12 Q8 15 5 15 H-5 Q-8 15 -8 12 V-2 Q-8 -8 -3 -11 Z" fill="#6a4a2a" stroke="#22190f" stroke-width="1"/><rect x="-6" y="0" width="12" height="7" rx="1" fill="#efe3c8" stroke="#22190f" stroke-width=".5"/><rect x="-3.2" y="-20" width="6.4" height="4.6" rx="1" fill="#c9a06a" stroke="#22190f" stroke-width=".6"/></g></g>');
        A(ctx, bot, [{ transform: `translate(${R1(f.b.x + 80)}px,${R1(f.y + f.dir * 60)}px) scale(.6)`, opacity: 0 }, { opacity: 1, offset: 0.2 }, { transform: `translate(${R1(p.x)}px,${R1(p.y - 18)}px) scale(1.1)`, opacity: 1, offset: 0.75 }, { transform: `translate(${R1(p.x)}px,${R1(p.y - 22)}px) scale(1.1)`, opacity: 0 }], S.bottle, 0, 'ease-out');
        await wait(ctx, S.popAt);
        const cork = sv(hi, '<rect x="-3.2" y="-2.3" width="6.4" height="4.6" rx="1" fill="#c9a06a" stroke="#22190f" stroke-width=".6"/>');
        A(ctx, cork, [{ transform: `translate(${R1(p.x - 6)}px,${R1(p.y - 38)}px) rotate(0deg)`, opacity: 1 }, { transform: `translate(${R1(p.x - 30)}px,${R1(p.y - 70)}px) rotate(-200deg)`, opacity: 1, offset: 0.5 }, { transform: `translate(${R1(p.x - 46)}px,${R1(p.y - 20)}px) rotate(-420deg)`, opacity: 0 }], S.cork, 0, 'ease-out');
        sparksSvg(ctx, hi, p.x, p.y, 14, 0, ['#fff', '#c8f0d0', '#7fd59a']);
        weatherRestore(ctx, e as Restored as Fix, 0);
        await wait(ctx, S.rumNext);
      }
      if (!any) { ruleTag(ctx, t.W / 2, t.g.cy, 'Команды и так полные', 100, '', 1400); return 1400; }
      return S.end;
    },
  },
  /** Торговый караван: a detailed merchantman (×1.25) crosses the sea in the gap under the planks, pitching, with a bow
   *  wave and a wake, and throws the barrels of the events into the Holds. */
  caravan: {
    applyAsync: async (t, effects, used) => {
      const ctx = t.fx, S = T.sea, g = t.g;
      const k = R1(Math.min(1.25, (g.h * 0.7) / 78, t.W / 640) * 100) / 100, y = g.cy + 30 * k, x0 = -140 * k, x1 = t.W + 140 * k;
      const sea = seaTemp(ctx);
      const ship = sv(sea, `<g><g fill="none" stroke-linecap="round"><path d="M${R1(-60 * k)} -2 C${R1(-140 * k)} -6 ${R1(-240 * k)} -16 ${R1(-360 * k)} -22 M${R1(-60 * k)} 4 C${R1(-140 * k)} 8 ${R1(-240 * k)} 18 ${R1(-360 * k)} 24" stroke="#eef6f8" stroke-width="3" opacity=".85"/><path d="M${R1(-80 * k)} 0 q-40 3 -120 0 q-60 -2 -140 0" stroke="#cfe4ea" stroke-width="1.6" opacity=".7"/><path d="M${R1(62 * k)} -2 q8 -6 14 -2 M${R1(62 * k)} 2 q8 6 14 2" stroke="#fff" stroke-width="2"/></g><g class="lg-pitch">${bigShip('merchant', 0, 0, k, true)}</g></g>`);
      A(ctx, ship, [{ transform: `translate(${R1(x0)}px,${R1(y)}px)` }, { transform: `translate(${R1(x1)}px,${R1(y)}px)` }], S.caravan, 0, 'linear');
      if (ctx.rich) A(ctx, ship.querySelector('.lg-pitch')!, Array.from({ length: 9 }, (_, j) => ({ transform: `rotate(${j % 2 ? 1.6 : -1.4}deg)` })), S.caravan, 0, 'ease-in-out', 'none');
      await wait(ctx, S.caravan * 0.4);
      const from = { x: x0 + (x1 - x0) * 0.4, y: y - 60 * k };
      let tm = 0;
      for (const e of effects) { if (e.type !== 'powderGained') continue; used.add(e); tm = Math.max(tm, gainKegs(ctx, e.side, e.amount, from, 0)); }
      await wait(ctx, S.caravan * 0.6);
      return Math.max(300, tm - S.caravan * 0.6 + 300);
    },
  },
  /** Сырой порох: a raincloud stops over each Hold; the barrels of the events soak and fall apart; a puddle. */
  wet: {
    applyAsync: async (t, effects, used) => {
      const ctx = t.fx, S = T.sea, hi = sv2(ctx);
      const lost = effects.filter((e): e is Keg & { type: 'powderLost' } => e.type === 'powderLost');
      for (const side of ['ПИРАТЫ', 'КОМПАНИЯ'] as Side[]) {
        // fix-ui: the cloud stands over the middle of the tray of kegs, its bottom just above it; the Hold at the very top of the
        // window (a laptop) has no room above it — the cloud is flatter there and covers only the top of the tray
        const b = nearHold(ctx, side), w = Math.min(170, Math.max(90, b.w)), x = b.cx - w / 2, k = w / 40;
        const above = b.y - 2, ky = Math.max(0.5 * k, Math.min(k, (above + b.h * 0.4) / 20.6)), y = Math.max(0, above - 20.6 * ky), bottom = y + 20.6 * ky;
        const cl = sv(hi, `<g><g transform="translate(${R1(x)} ${R1(y)}) scale(${R1(k * 100) / 100} ${R1(ky * 100) / 100})"><path d="M8 17 C4.6 17 3 15 3.4 12.6 C3.8 10.2 6 9 8.4 9.4 C9.4 5.4 13 3.4 17 4 C20 4.4 22.4 6.4 23.2 9 C24.6 7.8 27 7.6 28.8 8.6 C30.6 9.6 31.4 11.4 31.2 13 C34 13 36 14.6 36 16.8 C36 19 34 20.6 31.6 20.6 H9 C6 20.6 4.6 19 5 17.4 Z" fill="#5d6268" stroke="#2a2e33"/></g>${((nd: number) => Array.from({ length: nd }, (_, i) => `<path class="dr" d="M${R1(x + 6 + (i * (w - 12)) / Math.max(1, nd - 1))} ${R1(bottom - 1)} l-2 7" stroke="#9cc4d4" stroke-width="1.3" stroke-linecap="round"/>`).join(''))(room(ctx, 16) || 6)}</g>`);
        A(ctx, cl, [{ opacity: 0, transform: 'translateY(-20px)' }, { opacity: 1, transform: 'none', offset: 0.2 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], S.cloud);
        cl.querySelectorAll('.dr').forEach((d) => A(ctx, d, Array.from({ length: 13 }, (_, j) => ({ transform: j % 2 ? `translate(-3px,${R1(w * 0.55)}px)` : 'translate(0px,0px)', opacity: j % 2 ? 0 : 1 })), S.cloud, rnd(0, 400), 'linear', 'none'));
      }
      await wait(ctx, S.soakAt);
      let tm = 0;
      for (const e of lost) { used.add(e); powderFx(t, e, tm); tm += S.soakStep * e.amount + 200; }
      if (!lost.length) ruleTag(ctx, t.W / 2, t.g.cy, 'Порох отсырел — но терять нечего', 100, '', 1400);
      else { const b = nearHold(ctx, lost[0].side), p = mk(ctx, 'fx-puddle', b.x + 8, b.y + b.h - 10); p.style.width = Math.max(40, b.w - 16) + 'px'; A(ctx, p, [{ opacity: 0, transform: 'scaleX(.3)' }, { opacity: 1, transform: 'scaleX(1)' }], 600, tm + 300, 'ease-out'); }
      return tm + S.wetEnd;
    },
  },
  /** Тортуга: the lanterns of the haven over the sea; the Holds glow — each team may change up to 2 Powder for cards. */
  tortuga: {
    apply(t) {
      const ctx = t.fx, S = T.sea, hi = sv2(ctx), n = 14;
      for (let i = 0; i < n; i++) {
        const x = 40 + (i * (t.W - 80)) / (n - 1), y = t.g.cy + (i % 2 ? 14 : -14);
        const l = sv(hi, '<g><circle r="14" fill="#ffcf6a" opacity=".25"/><rect x="-4" y="-6" width="8" height="10" rx="2" fill="#f6c95a" stroke="#5a3a1c" stroke-width="1"/><path d="M-4 -6 H4 M0 -6 V-10" stroke="#5a3a1c" stroke-width="1"/></g>');
        A(ctx, l, [{ transform: `translate(${R1(x)}px,${R1(y + 40)}px) scale(.4)`, opacity: 0 }, { transform: `translate(${R1(x)}px,${R1(y)}px) scale(1)`, opacity: 1, offset: 0.3 }, { transform: `translate(${R1(x)}px,${R1(y - 8)}px) scale(1)`, opacity: 1, offset: 0.8 }, { transform: `translate(${R1(x)}px,${R1(y - 30)}px) scale(.8)`, opacity: 0 }], S.lantern, i * S.lanternStep, 'ease-out');
      }
      for (const side of ['ПИРАТЫ', 'КОМПАНИЯ'] as Side[]) A(ctx, holdEl(ctx, side), [{ boxShadow: '0 0 0 0 rgba(255,200,90,0)' }, { boxShadow: '0 0 0 3px rgba(255,200,90,.8), 0 0 24px rgba(255,200,90,.7)', offset: 0.4 }, { boxShadow: '0 0 0 0 rgba(255,200,90,0)' }], S.glow, S.glowAt, 'ease-in-out', 'none');
      ruleTag(ctx, t.W / 2, t.g.cy, 'Каждая команда: до 2 Пороха → столько же карт (выбор игроков)', 100, 'plus', 1900);
      return S.tortugaEnd;
    },
  },
  /** Течение: each team's pair rides a gyre — foam streams circle, debris rides them; the ships follow the arcs, the
   *  pairs one after the other (the top pair: the right one through the gap; the bottom pair: the left one). */
  current: {
    async applyAsync(t, effects, used, events) {
      const ctx = t.fx, S = T.sea, sea = seaTemp(ctx), hi = sv2(ctx);
      const sw = effects.filter((e): e is Extract<GameEvent, { type: 'swapped' }> => e.type === 'swapped');
      sw.forEach((e) => used.add(e));
      ruleTag(ctx, t.W / 2, t.g.cy, 'Обе команды меняются местами', 150, '', 1300);
      const rows = [ctx.board.querySelector('.planks.top'), ctx.board.querySelector('.planks.bottom')];
      rows.forEach((row, i) => {
        const ps = row ? [...row.querySelectorAll<HTMLElement>('[data-fx-ship]')].map((p) => bx(ctx, p)) : [];
        if (ps.length < 2) return;
        const s = i === 0 ? 1 : -1, [a, c] = ps.sort((p, q) => p.cx - q.cx);
        const cx = (a.cx + c.cx) / 2, cy = s > 0 ? a.b + 24 : a.y - 24, rx = Math.abs(c.cx - a.cx) / 2 + 40, ry = 32;
        const el = (k: number) => `M${R1(cx - rx * k)} ${R1(cy)} A${R1(rx * k)} ${R1(ry * k)} 0 1 ${s > 0 ? 1 : 0} ${R1(cx + rx * k)} ${R1(cy)} A${R1(rx * k)} ${R1(ry * k)} 0 1 ${s > 0 ? 1 : 0} ${R1(cx - rx * k)} ${R1(cy)}`;
        const g0 = sv(sea, `<g><path d="${el(0.9)}" fill="none" stroke="#a8d8e6" stroke-width="22" opacity=".22"/><path d="${el(0.9)}" fill="none" stroke="#06222c" stroke-width="6" opacity=".25" transform="translate(0 4)"/>${[1, 0.82, 0.64].map((k, j) => `<path class="st" d="${el(k)}" fill="none" stroke="${j ? '#bfe0ea' : '#eef6f8'}" stroke-width="${3 - j}" stroke-dasharray="${18 - j * 4} ${12 + j * 2}" stroke-linecap="round" opacity=".85"/>`).join('')}</g>`);
        A(ctx, g0, [{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], S.gyre, 0, 'linear');
        g0.querySelectorAll('.st').forEach((p, j) => A(ctx, p, [{ strokeDashoffset: 0 }, { strokeDashoffset: -R1(((30 - j * 2) * 4 * S.gyre) / ((1 + j * 0.3) * 1000)) }], S.gyre, 0, 'linear'));
        // the debris rides the gyre: around the ellipse, its way along it
        for (let q = 0, m = room(ctx, 8); q < m; q++) {
          const look = q % 3 === 0 ? '<rect x="-7" y="-2" width="14" height="4" rx="1" fill="#a8703a" stroke="#3a2412" stroke-width=".5"/>' : q % 3 === 1 ? '<path d="M-6 0 l6 -4 l6 4" fill="none" stroke="#f4f9fa" stroke-width="2" stroke-linecap="round"/>' : '<path d="M-6 0 q3 -4 6 0 t6 0" fill="none" stroke="#3f7a5a" stroke-width="2"/>';
          const d0 = sv(sea, `<g>${look}</g>`), turns = S.gyre / 2600, n = 40;
          A(ctx, d0, Array.from({ length: n + 1 }, (_, j) => { const a = s * (q / 8 + (j / n) * turns) * Math.PI * 2, x = cx - Math.cos(a) * rx, y = cy - Math.sin(a) * ry; return { transform: `translate(${R1(x)}px,${R1(y)}px) rotate(${R1((a * 180) / Math.PI + 90 * s)}deg)`, opacity: j === 0 || j === n ? 0 : 1 }; }), S.gyre, 0, 'linear');
        }
      });
      await wait(ctx, S.rideAt);
      // the ships ride the arcs, the pairs one after the other
      const top = sw.find((e) => e.side !== ctx.bottom), bot = sw.find((e) => e.side === ctx.bottom), done: GameEvent[] = [];
      for (const [e, gapRight] of [[top, true], [bot, false]] as const) {
        if (!e) continue;
        done.push(e);
        const xs = Object.fromEntries(e.ships.map((s) => [s, bx(ctx, plank(ctx, s)).cx]));
        const pick = e.ships.length > 1 ? (gapRight ? e.ships.reduce((a, b) => (xs[a] > xs[b] ? a : b)) : e.ships.reduce((a, b) => (xs[a] < xs[b] ? a : b))) : e.ships[0];
        await flipTo(ctx, events, S.ride, (x) => x.type === 'seaRevealed' || done.includes(x), { arc: (s) => (s === pick ? 64 : -8) });
        for (const s of e.ships) { const f = facing(ctx, s); ringSvg(ctx, hi, f.b.cx, f.y + f.dir * 10, 20, 160, '#eef6f8', S.rings); }
      }
      return S.currentEnd;
    },
  },
};

/** The events of the weather the card itself did not show (for new cards and rules). */
function seaLeftovers(t: TableCtx, effects: GameEvent[], used: Set<GameEvent>, t0: number): number {
  const ctx = t.fx;
  let tm = t0;
  for (const e of effects) {
    if (used.has(e)) continue;
    if (e.type === 'damage') { weatherHit(ctx, e as Hit, tm, '#24465C'); tm += 300; }
    else if (e.type === 'restored') { weatherRestore(ctx, e, tm); tm += 300; }
    else if (e.type === 'powderGained' || e.type === 'powderLost') { powderFx(t, e, tm); tm += 380; }
    else if (e.type === 'soulsGained') { const badge = plank(ctx, e.ship).querySelector('[data-fx-souls]'); if (badge && visible(badge)) badgeMark(ctx, badge, `+${e.amount}`, tm, true); tm += 200; }
  }
  return tm - t0;
}

/** The back of a sea card: a compass rose and «Море» (the pg-back of playRound). */
const SEA_BACK = `<svg width="112" height="112" viewBox="-20 -20 40 40" aria-hidden="true">${Array.from({ length: 16 }, (_, i) => { const a = (i * Math.PI) / 8 - Math.PI / 2, r = i % 4 === 0 ? 17 : i % 2 === 0 ? 11 : 6; return `<path d="M0 0 L${(Math.cos(a - 0.14) * 3).toFixed(1)} ${(Math.sin(a - 0.14) * 3).toFixed(1)} L${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)} Z" fill="${i % 2 ? '#c9a048' : '#e9d29a'}"/>`; }).join('')}<circle r="13" fill="none" stroke="#c9a048" stroke-width=".8"/><circle r="18.6" fill="none" stroke="#c9a048" stroke-width=".5"/></svg><b>Море</b>`;

/**
 * The start of a round and its sea card (playRound of template.html, ANIMATIONS.md §3.12; T.round): the banner
 * «— Раунд N —» unrolls; the sea card comes up on its back (a compass rose), turns over, is shown; it flies into the
 * plaque of the sea (the chip of the status bar — the table is drawn with the new sea, the plaque flashes); then what the
 * card does: a weather of the round rolls in over the sea and stays (fx/weather.ts), a card «сразу» plays its effect.
 */
const playSea = async (c: SeaClip & { events: GameEvent[] }, ctx: FxCtx) => {
  const R = T.round, t = tableCtx(ctx);
  const key = c.key, S = seaCardByCode(ctx.data, c.card), fxs = SEAFX[key] || {};
  const W = t.W, Rb = t.R;
  if (c.round) {
    const g = gapBox(ctx), bn = mk(ctx, 'banner small', W / 2, g.cy, `— Раунд ${c.round} —`);
    A(ctx, bn, [{ opacity: 0, transform: 'translate(-50%,-50%) scaleX(.2)' }, { opacity: 1, transform: 'translate(-50%,-50%) scaleX(1.04)', offset: 0.3 }, { opacity: 1, transform: 'translate(-50%,-50%) scaleX(1)', offset: 0.8 }, { opacity: 0, transform: 'translate(-50%,-60%)' }], R.banner, 0);
    hint(ctx, `Раунд ${c.round}: новая карта моря`);
    await wait(ctx, R.bannerWait);
  }
  if (c.reshuffled) { const db = bx(ctx, ctx.board.querySelector('[data-fx-deck]') || ctx.board); tag(ctx, db.cx, db.y - 10, 'Колода моря перемешана', 0, '', 1200); }
  const dim = mk(ctx, 'dim', 0, 0); dim.style.width = W + 'px'; dim.style.height = Rb + 'px';
  const dk = fxs.dim ?? 0.22, upFor = R.cardWait + R.show + R.fly;
  A(ctx, dim, [{ opacity: 0 }, { opacity: dk, offset: 0.12 }, { opacity: dk, offset: 0.85 }, { opacity: 0 }], upFor, 0);
  // A3: the drawing of the card is the weather icon of the prototype (art/wx.ts) on the paper of the card; its parts move (.wx-live) with the rich effects
  const face = `<div class="art"><span class="kind">Море · ${S.when.toLowerCase()}</span><div class="artmain">${wxSvg(key, 150, 128)}</div><div class="fl"></div></div>
      <div class="body"><div class="t">${esc(S.name)}</div><div class="fxl">${esc(S.big)}</div><span class="dur">${S.when === 'Сразу' ? 'действует сразу' : 'до следующей карты моря'}</span></div>`;
  const card = mk(ctx, 'seacard', W / 2, Rb / 2 - 8, `<div class="sc-face${ctx.rich ? ' wx-live' : ''}" data-k="${key}">${face}</div><div class="sc-back">${SEA_BACK}</div>`);
  const sc = Math.min(1, (W - 32) / 250);
  // the card comes up on its back
  A(ctx, card, [{ opacity: 0, transform: `translate(-50%,-30%) scale(${R1(0.6 * sc * 100) / 100})` }, { opacity: 1, transform: `translate(-50%,-50%) scale(${sc})` }], R.cardIn, 0, 'cubic-bezier(.2,.8,.3,1.1)', 'forwards');
  A(ctx, card.querySelector('.sc-face')!, [{ transform: 'perspective(800px) rotateY(-180deg)' }], 1, 0, 'linear', 'forwards');
  await wait(ctx, R.cardWait);
  // it turns over
  A(ctx, card.querySelector('.sc-back')!, [{ transform: 'perspective(800px) rotateY(0deg)' }, { transform: 'perspective(800px) rotateY(180deg)' }], R.flip, 0, 'ease-in-out', 'forwards');
  A(ctx, card.querySelector('.sc-face')!, [{ transform: 'perspective(800px) rotateY(-180deg)' }, { transform: 'perspective(800px) rotateY(0deg)' }], R.flip, 0, 'ease-in-out', 'forwards');
  hint(ctx, `Море: «${S.name}» — ${strip(S.text)}`);
  // the drawing comes alive
  const d0 = R.flip * 0.6;
  A(ctx, card.querySelector('.artmain')!, [{ transform: 'scale(.6) translateY(10px)', opacity: 0 }, { transform: 'scale(1.08)', opacity: 1, offset: 0.6 }, { transform: 'scale(1)', opacity: 1 }], 700, d0, 'cubic-bezier(.2,.8,.3,1.2)');
  await wait(ctx, R.show);
  // it flies into the plaque of the sea (the chip is outside the board — the card goes over its top edge)
  const chip = document.querySelector('[data-fx-sea-chip]');
  const target = chip ? bx(ctx, chip) : { cx: W - 60, cy: -20 };
  A(ctx, card, [{ opacity: 1, transform: `translate(-50%,-50%) scale(${sc})` }, { opacity: 0.3, transform: `translate(calc(-50% + ${R1((target.cx - W / 2) * 0.9)}px), calc(-50% + ${R1((target.cy - (Rb / 2 - 8)) * 0.9)}px)) scale(.2)`, offset: 0.9 }, { opacity: 0, transform: `translate(calc(-50% + ${R1(target.cx - W / 2)}px), calc(-50% + ${R1(target.cy - (Rb / 2 - 8))}px)) scale(.16)` }], R.fly, 0, 'cubic-bezier(.5,0,.8,.4)', 'forwards');
  await wait(ctx, R.flyWait);
  // game: the chip and the weather are drawn by React from the displayed state with the new sea card
  ctx.renderWith(c.events.filter((e) => e.type === 'roundStarted' || e.type === 'seaRevealed'));
  const now = document.querySelector('[data-fx-sea-chip]');
  if (now) A(ctx, now, [{ boxShadow: '0 0 0 3px #e0bd62, 0 0 22px rgba(255,200,100,.9)' }, { boxShadow: 'none' }], R.plaque, 0, 'ease-out', 'none');
  await wait(ctx, R.after);
  // what the card does — on the table, by its own drawing
  const effects = (c.effects || []).filter((e) => e.type !== 'seaEffect');
  const used = new Set<GameEvent>();
  let extra = 0;
  if (ROUND_LONG.includes(key)) {
    // the weather rolls in over the sea, then stays for the round
    const wx = ctx.board.querySelector<HTMLElement>('.fx-weather');
    if (wx) A(ctx, wx, [{ opacity: 0 }, { opacity: 1 }], R.roll, 0, 'ease-out', 'none');
    if (key === 'storm') flashBoard(ctx, '#eef4ff', 0.16, 700, 200);
    if (key === 'maelstrom') { const hi = fxSvg(ctx), w0 = bx(ctx, ctx.board.querySelector('.sea-water') ?? ctx.board); for (let i = 0; i < 4; i++) ringSvg(ctx, hi, w0.cx, w0.y + (w0.h * 196) / 404, Math.max(10, 260 - i * 50) * 0.04, Math.max(40, (260 - i * 50) * Math.min(1, w0.w / 1022)), '#cfe8ef', 1400, i * 220, 2); }
    ruleTag(ctx, W / 2, t.g.cy, fxs.rule ?? capFirst(S.big), 300, fxs.good ? 'plus' : '', 1500);
    extra = R.rollEnd;
  } else if (fxs.applyAsync) extra = await fxs.applyAsync(t, effects, used, c.events);
  else if (fxs.apply) extra = fxs.apply(t, effects, used);
  else if (fxs.rule) { ruleTag(ctx, W / 2, t.g.cy, fxs.rule, 100, '', 1500); extra = 1400; }
  const rest = seaLeftovers(t, effects, used, 0);
  await wait(ctx, Math.max(extra, rest + 900));
};

/** A new round without a new sea card (if there ever is one). */
const playRound = async (c: RoundClip, ctx: FxCtx) => {
  const g = gapBox(ctx); const bn = mk(ctx, 'banner small', ctx.board.clientWidth / 2, g.cy, `— Раунд ${c.round} —`);
  A(ctx, bn, [{ opacity: 0, transform: 'translate(-50%,-50%) scaleX(.2)' }, { opacity: 1, transform: 'translate(-50%,-50%) scaleX(1.04)', offset: 0.3 }, { opacity: 1, transform: 'translate(-50%,-50%) scaleX(1)', offset: 0.8 }, { opacity: 0, transform: 'translate(-50%,-60%)' }], T.round.banner, 0);
  await wait(ctx, T.round.bannerWait);
};

export const PLAY_SEA = { sea: playSea as unknown as ClipPlayer, round: playRound as unknown as ClipPlayer };

/**
 * The weather of the round by the sea card on the displayed table (FX-C, ANIMATIONS.md §3.10: fx/weather.ts). Drawn
 * where the layer plays (FxLayer.tsx); with «простые спецэффекты» it stands still; `on: false` empties it. Drawn again
 * only when the card, the size of the board, the places of the ships or the richness change.
 */
export function renderWeather(ctx: FxCtx, weather: HTMLElement, on: boolean): void {
  const code = on ? ctx.display.sea : null;
  const key = code ? seaKeyOf(ctx, code) : null;
  const D = ctx.display;
  const k2 = `${key}|${ctx.rich}|${ctx.board.clientWidth}|${ctx.board.clientHeight}|${Object.keys(D.ships).map((c) => D.ships[c].pos + (D.ships[c].sunk ? 's' : '')).join('')}`;
  if (k2 === weather.dataset.key) return;
  weather.dataset.key = k2;
  drawWeather(ctx, weather, key && ctx.board.querySelector('[data-fx-gap]') ? key : null, ctx.rich);
}
