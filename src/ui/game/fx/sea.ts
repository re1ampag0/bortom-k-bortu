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
  A, allPlanks, at, burst, bx, dirOf, facingY, flash, fxPoint, gainKegs, gapBox, hint, holdEl, isTop, mk, plank, ring, setTrack, shake,
  shownTrack, tag, trackEl, trackMark, badgeMark, visible, wait, whirlpool, type FxCtx,
} from './primitives';
import { SEA_BG, seaSvg } from './seaArt';
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
function rain(t: TableCtx, n: number, from: number, to: number) { const ctx = t.fx; if (!ctx.rich) return; for (let i = 0; i < n; i++) { const d = mk(ctx, 'drop', 0, 0); const x = Math.random() * (t.W + 120), y = Math.random() * t.R; A(ctx, d, [{ opacity: 0, transform: `translate(${x}px,${y - 40}px) rotate(22deg)` }, { opacity: 0.35 + Math.random() * 0.5, offset: 0.25 }, { opacity: 0, transform: `translate(${x - 30}px,${y + 70}px) rotate(22deg)` }], 450, from + Math.random() * (to - from)); } }
function boardFlash(t: TableCtx, times: number[]) { for (const tm of times) { const f = mk(t.fx, 'tint', 0, 0); f.style.width = t.W + 'px'; f.style.height = t.R + 'px'; f.style.background = '#fff'; A(t.fx, f, [{ opacity: 0 }, { opacity: 0.35, offset: 0.1 }, { opacity: 0, offset: 0.3 }, { opacity: 0.2, offset: 0.45 }, { opacity: 0 }], 600, tm, 'linear'); } }
function overlay(t: TableCtx, bg: string, kf: Keyframe[], d: number, delay: number, easing = 'ease-in-out') { const o = mk(t.fx, 'tint', 0, 0); o.style.width = t.W + 'px'; o.style.height = t.R + 'px'; o.style.background = bg; A(t.fx, o, kf, d, delay, easing, 'forwards'); return o; }
function svgWide(t: TableCtx, inner: string, h: number, cls = 'svgabs') { return mk(t.fx, cls, 0, 0, `<svg width="${t.W}" height="${h}" viewBox="0 0 ${t.W} ${h}">${inner}</svg>`); }
function wavyPath(w: number, y: number, amp: number, step: number) { let d = `M0 ${y}`; for (let x = 0; x <= w; x += step) d += ` Q ${x + step / 2} ${y + ((x / step) % 2 ? amp : -amp)} ${x + step} ${y}`; return d; }
/** A dashed line on each diagonal with a cross (Туман): the pairs go by places (pos), not by codes. */
function diagLines(t: TableCtx, host?: HTMLElement): HTMLElement[] {
  const ctx = t.fx, out: HTMLElement[] = [];
  for (const [a, b] of seaPairs(ctx, 'diagonal')) {
    const A0 = bx(ctx, plank(ctx, a)), B0 = bx(ctx, plank(ctx, b)); const mx = (A0.cx + B0.cx) / 2, my = (A0.b + B0.y) / 2;
    const html = `<svg width="${t.W}" height="${t.R}"><path d="M${A0.cx} ${A0.b} L${B0.cx} ${B0.y}" stroke="#7C8A94" stroke-width="2" stroke-dasharray="5 7" fill="none"/><g stroke="#B23A2E" stroke-width="3" stroke-linecap="round"><path d="M${mx - 9} ${my - 9} l18 18 M${mx + 9} ${my - 9} l-18 18"/></g></svg>`;
    if (host) { const d = document.createElement('div'); d.className = 'svgabs'; d.style.opacity = '1'; d.innerHTML = html; host.appendChild(d); out.push(d); } else out.push(mk(ctx, 'svgabs', 0, 0, html));
  }
  return out;
}
function rocks(t: TableCtx, host?: HTMLElement): (HTMLElement & { _t?: string })[] {
  const out: (HTMLElement & { _t?: string })[] = [];
  for (const [fx0, dy] of [[0.03, -6], [0.08, 10], [0.92, -8], [0.97, 8], [0.5, 30]]) {
    const html = '<svg viewBox="0 0 40 26" width="40" height="26"><path d="M2 25 L10 8 L18 14 L26 2 L38 25Z" fill="#6B6157"/><path d="M10 8 L14 12 L18 14" stroke="#8A8076" stroke-width="2" fill="none"/></svg>';
    const tr = `translate(${t.W * fx0 - 20}px,${t.g.cy + dy - 13}px)`;
    let el: HTMLElement & { _t?: string };
    if (host) { el = document.createElement('div'); el.className = 'rock'; el.innerHTML = html; host.appendChild(el); el.style.transform = tr; el.style.opacity = '1'; } else el = mk(t.fx, 'rock', 0, 0, html);
    el._t = tr; out.push(el);
  }
  return out;
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
  const kb = bx(ctx, kg); tag(ctx, kb.r + 36, kb.cy, `−${e.amount} Порох`, t0, '', 1300);
}

/** game (S1): a rule of the sea card in the middle of the table (class «rule»: e2e checks it never touches a plank). */
function ruleTag(ctx: FxCtx, x: number, y: number, text: string, delay: number, cls = '', dur = 1500): HTMLElement {
  const el = tag(ctx, x, y, text, delay, cls, dur);
  el.classList.add('rule');
  return el;
}

/**
 * The weather. atmo(t) — the weather while the card is in the middle; apply(t, effects, used) — the changes on the
 * planks by the events; returns its length. The events apply marks in used are not shown again.
 */
interface SeaFx {
  dim?: number;
  rule?: string;
  atmo?: (t: TableCtx) => void;
  apply?: (t: TableCtx, effects: GameEvent[], used: Set<GameEvent>) => number;
  applyAsync?: (t: TableCtx, effects: GameEvent[], used: Set<GameEvent>, events: GameEvent[]) => Promise<number>;
}
export const SEAFX: Record<string, SeaFx> = {
  storm: { atmo(t) { rain(t, 80, 800, 2400); boardFlash(t, [950, 1560]); }, rule: 'Каждый Залп −1 урон' },
  calm: {
    atmo(t) { for (let k = 0; k < 3; k++) { const y = t.g.y + 24 + k * 28; const w = svgWide(t, `<path d="${wavyPath(t.W, 14, 9, 36)}" fill="none" stroke="#9CC3DA" stroke-width="2.5" stroke-linecap="round"/>`, 28); A(t.fx, w, [{ opacity: 0, transform: `translate(0px,${y - 14}px) scaleY(1)` }, { opacity: 0.95, offset: 0.2, transform: `translate(0px,${y - 14}px) scaleY(1)` }, { opacity: 0.95, offset: 0.75, transform: `translate(0px,${y - 14}px) scaleY(.06)` }, { opacity: 0.5, transform: `translate(0px,${y - 14}px) scaleY(.06)` }], 2400, 200 + k * 120); } },
    apply(t) { t.fx.board.querySelectorAll('[data-fx-track="sails"]').forEach((el, i) => A(t.fx, el, [{ opacity: 1, transform: 'none' }, { opacity: 0.35, transform: 'translateY(2px)', offset: 0.5 }, { opacity: 1, transform: 'none' }], 1100, i * 60, 'ease-in-out', 'none')); ruleTag(t.fx, t.W / 2, t.g.cy, 'Смена мест закрыта до конца раунда', 100, '', 1500); return 1300; },
  },
  wind: {
    atmo(t) { for (let k = 0; k < (t.fx.rich ? 18 : 5); k++) { const st = mk(t.fx, 'streak', 0, 0); const y = 20 + Math.random() * (t.R - 40); const len = 80 + Math.random() * 140; st.style.width = len + 'px'; A(t.fx, st, [{ opacity: 0, transform: `translate(${-len}px,${y}px)` }, { opacity: 0.9, offset: 0.3 }, { opacity: 0, transform: `translate(${t.W}px,${y - 12}px)` }], 900 + Math.random() * 400, 250 + Math.random() * 1600, 'ease-in'); } },
    apply(t) { allPlanks(t.fx).forEach((p, i) => A(t.fx, p, [{ transform: 'none' }, { transform: 'translateX(5px) rotate(.5deg)', offset: 0.4 }, { transform: 'none' }], 900, i * 90, 'ease-in-out', 'none')); ruleTag(t.fx, t.W / 2, t.g.cy, 'Перестроение бесплатно для обеих команд', 100, 'plus', 1500); return 1200; },
  },
  fog: {
    atmo(t) { for (let k = 0; k < (t.fx.rich ? 12 : 4); k++) { const f = mk(t.fx, 'fogblob', 0, 0); const left = k % 2 === 0; const sz = 180 + Math.random() * 160; f.style.width = f.style.height = sz + 'px'; f.style.margin = `-${sz / 2}px 0 0 -${sz / 2}px`; const y = Math.random() * t.R; const x0 = left ? -sz : t.W + sz, x1 = left ? Math.random() * t.W * 0.45 : t.W - Math.random() * t.W * 0.45; A(t.fx, f, [{ opacity: 0, transform: `translate(${x0}px,${y}px) scale(.7)` }, { opacity: 0.85, transform: `translate(${x1}px,${y}px) scale(1)`, offset: 0.6 }, { opacity: 0.25, transform: `translate(${(x0 + x1 * 3) / 4}px,${y}px) scale(1.1)` }], 2600, 100 + k * 90, 'ease-out'); } },
    apply(t) { diagLines(t).forEach((el, k) => A(t.fx, el, [{ opacity: 0 }, { opacity: 1 }], 400, k * 200, 'ease-out', 'forwards')); ruleTag(t.fx, t.W / 2, t.g.cy - 22, 'Залпы по диагонали невозможны', 300, '', 1600); return 1500; },
  },
  wave: {
    dim: 0.15,
    apply(t) {
      const ctx = t.fx;
      const h = Math.min(240, t.g.h * 2), y = t.g.cy - h * 0.62, w = Math.min(900, t.W * 0.9);
      const wv = mk(ctx, 'svgabs', 0, 0, `<svg width="${w}" height="${h}" viewBox="0 0 300 120" preserveAspectRatio="none"><defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFE7F2"/><stop offset=".5" stop-color="#5E9CC0"/><stop offset="1" stop-color="#24465C"/></linearGradient></defs><path d="M0 120 C60 120 70 50 130 24 C180 2 230 16 222 46 C216 70 186 66 188 50 C190 40 204 38 206 46 C212 30 186 20 166 32 C138 50 150 112 300 120 Z" fill="url(#wg)" opacity=".92"/><path d="M130 24 C180 2 230 16 222 46" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".9"/></svg>`);
      const t0 = 100, dur = 1800;
      A(ctx, wv, [{ opacity: 0, transform: `translate(${-w}px,${y}px)` }, { opacity: 1, offset: 0.12 }, { opacity: 1, offset: 0.85 }, { opacity: 0, transform: `translate(${t.W}px,${y}px)` }], dur, t0, 'cubic-bezier(.4,0,.6,1)');
      allPlanks(ctx).forEach((p) => { const b = bx(ctx, p); const tx = t0 + dur * ((b.cx + w * 0.35) / (t.W + w)); A(ctx, p, [{ transform: 'none' }, { transform: `translateY(${isTop(ctx, p.dataset.fxShip!) ? 6 : -6}px) rotate(-2deg)`, offset: 0.4 }, { transform: 'rotate(1deg)', offset: 0.7 }, { transform: 'none' }], 700, tx - 200, 'ease-in-out', 'none'); });
      if (ctx.rich) for (let k = 0; k < 18; k++) { const sp = mk(ctx, 'bubble', 0, 0); const x = (k / 18) * t.W; const tt = t0 + dur * ((x + w * 0.6) / (t.W + w)); A(ctx, sp, [{ opacity: 0.9, transform: `translate(${x}px,${t.g.cy - 10}px)` }, { opacity: 0, transform: `translate(${x + 20}px,${t.g.cy - 50 - Math.random() * 40}px)` }], 600, tt); }
      ruleTag(ctx, t.W / 2, t.g.cy, 'В начале каждого хода: −1 Паруса ходящей команде', t0 + dur, '', 1700);
      return t0 + dur + 1500;
    },
    atmo(t) { if (t.fx.rich) for (let k = 0; k < 3; k++) { const y = t.g.y + 24 + k * 28; const w = svgWide(t, `<path d="${wavyPath(t.W, 14, 10, 40)}" fill="none" stroke="#5E9CC0" stroke-width="3" stroke-linecap="round"/>`, 28); A(t.fx, w, [{ opacity: 0, transform: `translate(-40px,${y - 14}px)` }, { opacity: 0.8, offset: 0.3 }, { opacity: 0, transform: `translate(40px,${y - 14}px)` }], 1800, 300 + k * 150); } },
  },
  maelstrom: {
    atmo(t) { whirlpool(t.fx, t.W / 2, t.g.cy, 300, Math.min(260, t.W * 0.5), 2600); allPlanks(t.fx).forEach((p) => { const b = bx(t.fx, p); const toward = b.cx < t.W / 2 ? 1 : -1; A(t.fx, p, [{ transform: 'none' }, { transform: `rotate(${toward * 1.6}deg) translateX(${toward * 4}px)`, offset: 0.5 }, { transform: 'none' }], 1600, 600, 'ease-in-out', 'none'); }); },
    apply(t) { ruleTag(t.fx, t.W / 2, t.g.cy - 30, 'В начале хода ходящие меняются местами · диагональ без штрафа', 100, '', 1800); return 1600; },
  },
  clear: {
    atmo(t) {
      for (let k = 0; k < 6; k++) { const cl = mk(t.fx, 'cloud', 0, 0); const y = 20 + (k % 3) * (t.R / 3); const left = k < 3; A(t.fx, cl, [{ opacity: 0.9, transform: `translate(${t.W / 2 - 110 + (left ? -60 : 60)}px,${y}px)` }, { opacity: 0, transform: `translate(${left ? -260 : t.W + 40}px,${y}px)` }], 1500, 300 + k * 60, 'ease-in'); }
      const rays = mk(t.fx, 'rays', 0, 0); A(t.fx, rays, [{ opacity: 0, transform: `translate(${t.W / 2}px,0px) rotate(0deg) scale(.6)` }, { opacity: 0.7, transform: `translate(${t.W / 2}px,0px) rotate(20deg) scale(1)` }], 2300, 400, 'ease-out', 'forwards');
      overlay(t, 'rgba(255,214,120,.18)', [{ opacity: 0 }, { opacity: 1 }], 1500, 600);
    },
    apply(t) {
      const ctx = t.fx;
      seaPairs(ctx, 'opposite').forEach(([a, b], k) => { const A0 = bx(ctx, plank(ctx, a)), B0 = bx(ctx, plank(ctx, b)); const ln = mk(ctx, 'svgabs', 0, 0, `<svg width="${t.W}" height="${t.R}"><path d="M${A0.cx} ${A0.b} L${B0.cx} ${B0.y}" stroke="#E0A800" stroke-width="3" stroke-dasharray="6 7" stroke-linecap="round"/></svg>`); A(ctx, ln, [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], 1600, k * 200); });
      ruleTag(ctx, t.W / 2, t.g.cy, 'Залпы по кораблю напротив +1', 200, 'plus', 1600); return 1700;
    },
  },
  mermaids: {
    atmo(t) { const ctx = t.fx; if (!ctx.rich) return; allPlanks(ctx).forEach((p, i) => { const b = bx(ctx, p), fy = facingY(ctx, p.dataset.fxShip!), dir = dirOf(ctx, p.dataset.fxShip!); for (let k = 0; k < 5; k++) { const n = mk(ctx, k % 2 ? 'note' : 'sparkle', 0, 0, k % 2 ? '♪' : ''); const x = b.x + 20 + Math.random() * (b.w - 40); A(ctx, n, [{ opacity: 0, transform: `translate(${x}px,${fy + dir * 30}px) scale(.6)` }, { opacity: 1, offset: 0.3 }, { opacity: 0, transform: `translate(${x + (Math.random() - 0.5) * 30}px,${fy + dir * 4}px) scale(1.1)` }], 1300, 300 + i * 150 + k * 160); } }); },
    apply(t, effects, used) {
      const ctx = t.fx;
      let tm = 0;
      effects.forEach((e) => {
        if (e.type !== 'damage' || e.track !== 'crew') return;
        used.add(e);
        const cur = shownTrack(ctx, e.ship, 'crew'), p = fxPoint(ctx, e.ship, 'crew', cur - 1);
        const ghost = mk(ctx, 'pipfloat', 0, 0);
        A(ctx, ghost, [{ opacity: 1, transform: `translate(${p.x}px,${p.y}px)` }, { opacity: 0, transform: `translate(${p.x + 18}px,${p.y + dirOf(ctx, e.ship) * 70}px) rotate(40deg)` }], 1100, tm, 'cubic-bezier(.4,0,.8,1)');
        weatherHit(ctx, e as Hit, tm, '#5AA0A6');
        tm += 240;
      });
      if (!tm) ruleTag(ctx, t.W / 2, t.g.cy, 'Команда 3 и больше теряет 1 — таких нет', 100, '', 1500);
      return tm + 1300;
    },
  },
  tortuga: {
    atmo(t) { for (let k = 0; k < 7; k++) { const l = mk(t.fx, 'lantern', 0, 0); const x = t.W * (0.12 + k * 0.125), y = t.g.cy + (k % 2 ? 10 : -12); A(t.fx, l, [{ opacity: 0, transform: `translate(${x}px,${y + 20}px) scale(.4)` }, { opacity: 1, transform: `translate(${x}px,${y}px) scale(1)`, offset: 0.3 }, { opacity: 1, transform: `translate(${x}px,${y - 4}px) scale(1)`, offset: 0.7 }, { opacity: 0.0, transform: `translate(${x}px,${y}px) scale(.9)` }], 2400, 250 + k * 90, 'ease-in-out'); } },
    apply(t) { ruleTag(t.fx, t.W / 2, t.g.cy, 'Каждая команда: до 2 Пороха → столько же карт (выбор игроков)', 100, '', 1900); return 1800; },
  },
  rum: {
    atmo(t) { const ctx = t.fx; allPlanks(ctx).forEach((p, i) => { const b = bx(ctx, p), fy = facingY(ctx, p.dataset.fxShip!), dir = dirOf(ctx, p.dataset.fxShip!); const br = mk(ctx, 'barrel', 0, 0, '<svg viewBox="0 0 20 24" width="20" height="24"><rect x="1" y="1" width="18" height="22" rx="7" fill="#8A5A32" stroke="#4a2f18" stroke-width="1.5"/><path d="M1 8 H19 M1 16 H19" stroke="#4a2f18" stroke-width="1.5"/></svg>'); const x = b.x + b.w * 0.7, y = fy + dir * 22; A(ctx, br, [{ opacity: 0, transform: `translate(${x}px,${y + dir * 16}px) rotate(-10deg)` }, { opacity: 1, transform: `translate(${x}px,${y}px) rotate(8deg)`, offset: 0.3 }, { transform: `translate(${x}px,${y + 4}px) rotate(-8deg)`, offset: 0.6 }, { opacity: 1, transform: `translate(${x}px,${y}px) rotate(6deg)`, offset: 0.85 }, { opacity: 0, transform: `translate(${x}px,${y - dir * 10}px)` }], 2200, 300 + i * 100, 'ease-in-out'); }); },
    apply(t, effects, used) {
      const ctx = t.fx;
      let tm = 0;
      effects.forEach((e) => { if (e.type !== 'restored') return; used.add(e); weatherRestore(ctx, e, tm); tm += 260; });
      if (!tm) ruleTag(ctx, t.W / 2, t.g.cy, 'Команды и так полные', 100, '', 1400);
      return tm + 1300;
    },
  },
  caravan: {
    atmo(t) { for (let k = 0; k < 3; k++) { const s = mk(t.fx, 'sail', 0, 0, '<svg viewBox="0 0 60 40" width="60" height="40"><path d="M6 32 h44 l-7 7 h-30z" fill="#7A5230"/><path d="M28 30 V2 L46 28 Z" fill="#FFF6E0" stroke="#C9B48C"/><path d="M25 30 V8 L10 28 Z" fill="#FFF6E0" stroke="#C9B48C"/></svg>'); const y = t.g.y + 10 + k * 22; A(t.fx, s, [{ opacity: 0, transform: `translate(-80px,${y}px)` }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.85 }, { opacity: 0, transform: `translate(${t.W + 20}px,${y}px)` }], 2300, 200 + k * 260, 'linear'); } },
    apply(t, effects, used) { let tm = 0; effects.forEach((e) => { if (e.type !== 'powderGained') return; used.add(e); powderFx(t, e, tm); tm += 420; }); return tm + 900; },
  },
  wet: {
    atmo(t) { for (const side of ['ПИРАТЫ', 'КОМПАНИЯ'] as Side[]) { const kg = bx(t.fx, holdEl(t.fx, side)); const wv = mk(t.fx, 'wetband', 0, 0); wv.style.width = kg.w + 60 + 'px'; wv.style.height = kg.h + 12 + 'px'; A(t.fx, wv, [{ opacity: 0, transform: `translate(${kg.x - 60}px,${kg.y - 6}px) scaleX(.2)` }, { opacity: 0.85, transform: `translate(${kg.x - 30}px,${kg.y - 6}px) scaleX(1)`, offset: 0.5 }, { opacity: 0, transform: `translate(${kg.x + 20}px,${kg.y - 6}px) scaleX(1)` }], 1600, 600 + (side === 'КОМПАНИЯ' ? 250 : 0), 'ease-in-out'); } },
    apply(t, effects, used) { let tm = 0; effects.forEach((e) => { if (e.type !== 'powderLost') return; used.add(e); powderFx(t, e, tm); tm += 380; }); if (!tm) ruleTag(t.fx, t.W / 2, t.g.cy, 'Порох отсырел — но терять нечего', 100, '', 1400); return tm + 1100; },
  },
  reefs: {
    atmo(t) { rocks(t).forEach((r, k) => A(t.fx, r, [{ opacity: 0, transform: r._t + ' translateY(26px) scale(.6)' }, { opacity: 1, transform: r._t }], 700, 500 + k * 140, 'cubic-bezier(.2,.8,.3,1.3)', 'forwards')); },
    apply(t) { ruleTag(t.fx, t.W / 2, t.g.cy, 'Смена мест: −1 Корпус тому, кто двигается', 100, '', 1700); return 1500; },
  },
  thunder: {
    dim: 0.35,
    atmo(t) { boardFlash(t, [1300]); },
    apply(t, effects, used) {
      const ctx = t.fx;
      const hits = effects.filter((e): e is Extract<GameEvent, { type: 'damage' }> => e.type === 'damage' && e.track === 'sails');
      if (!hits.length) { ruleTag(ctx, t.W / 2, t.g.cy, 'Парусов нет ни у кого — молния ушла в воду', 100, '', 1500); return 1500; }
      overlay(t, '#1d2a35', [{ opacity: 0 }, { opacity: 0.3, offset: 0.2 }, { opacity: 0.3, offset: 0.8 }, { opacity: 0 }], 1600, 0);
      hits.forEach((e, k) => {
        used.add(e);
        const sp = bx(ctx, trackEl(ctx, e.ship, 'sails')), tm = 250 + k * 380;
        const bolt = mk(ctx, 'svgabs', 0, 0, `<svg width="${t.W}" height="${t.R}"><path d="M${sp.cx - 30} -10 L${sp.cx + 6} ${sp.cy * 0.45} L${sp.cx - 12} ${sp.cy * 0.5} L${sp.cx + 4} ${sp.cy}" fill="none" stroke="#FFE58A" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" style="filter:drop-shadow(0 0 8px #FFD84A)"/></svg>`);
        A(ctx, bolt, [{ opacity: 0 }, { opacity: 1, offset: 0.08 }, { opacity: 0.3, offset: 0.25 }, { opacity: 1, offset: 0.35 }, { opacity: 0 }], 700, tm, 'linear');
        flash(ctx, sp.cx, sp.cy, tm + 60, 2); burst(ctx, 'spark', sp.cx, sp.cy, tm + 60, 12, 14, 40, 500); ring(ctx, sp.cx, sp.cy, tm + 60);
        shake(ctx, plank(ctx, e.ship), tm + 60, 4);
        weatherHit(ctx, e as Hit, tm + 80, '#FFD84A');
      });
      return 250 + hits.length * 380 + 1300;
    },
  },
  fleet: {
    atmo(t) { for (let k = 0; k < 9; k++) { const s = mk(t.fx, 'sail small', 0, 0, '<svg viewBox="0 0 30 30" width="22" height="22"><path d="M14 26 V3 L27 24 Z" fill="#5E8FB0"/><path d="M12 26 V8 L3 24 Z" fill="#5E8FB0"/><path d="M2 26 H28" stroke="#5E8FB0" stroke-width="2"/></svg>'); const x = t.W * (0.06 + k * 0.11); A(t.fx, s, [{ opacity: 0, transform: `translate(${x}px,${t.g.y + 14}px) scale(.3)` }, { opacity: 0.85, transform: `translate(${x}px,${t.g.y + 4}px) scale(1)` }], 700, 400 + k * 120, 'ease-out', 'forwards'); } },
    // game (S1): no «+1 карта» on the head of each plank — the rule is on the card in the middle.
    apply() { return 1400; },
  },
  moon: {
    dim: 0.4,
    atmo(t) { const ctx = t.fx; const m = mk(ctx, 'moonorb', 0, 0); A(ctx, m, [{ opacity: 0, transform: `translate(${t.W * 0.82}px,${t.g.b}px)` }, { opacity: 1, transform: `translate(${t.W * 0.82}px,${t.g.y - 6}px)` }], 1900, 300, 'ease-out', 'forwards'); if (ctx.rich) for (let k = 0; k < 14; k++) { const s = mk(ctx, 'sparkle', 0, 0); const x = Math.random() * t.W, y = Math.random() * t.R; A(ctx, s, [{ opacity: 0, transform: `translate(${x}px,${y}px) scale(.5)` }, { opacity: 0.9, offset: 0.5 }, { opacity: 0, transform: `translate(${x}px,${y}px) scale(1)` }], 900, 500 + Math.random() * 1500); } },
    apply(t) { t.fx.board.querySelectorAll('[data-fx-track="crew"] .cells i.on').forEach((pip, k) => A(t.fx, pip, [{ background: '#2A2521' }, { background: '#E8EEF6', boxShadow: '0 0 6px #C9D8EA', offset: 0.5 }, { background: '#8FA3BC', boxShadow: 'none' }], 900, k * 40, 'ease-out', 'forwards')); ruleTag(t.fx, t.W / 2, t.g.cy, 'Урон по Команде −1 (каждый)', 200, '', 1600); return 1500; },
  },
  current: {
    atmo(t) { for (let k = 0; k < (t.fx.rich ? 10 : 4); k++) { const ar = mk(t.fx, 'chevron', 0, 0, k % 2 ? '›' : '‹'); const y = t.g.y + 18 + (k % 3) * 26; const right = k % 2 === 1; A(t.fx, ar, [{ opacity: 0, transform: `translate(${right ? 20 : t.W - 40}px,${y}px)` }, { opacity: 0.9, offset: 0.2 }, { opacity: 0, transform: `translate(${right ? t.W - 40 : 20}px,${y}px)` }], 1500, 300 + k * 160, 'linear'); } },
    async applyAsync(t, effects, used, events) {
      const sw = effects.filter((e) => e.type === 'swapped'); sw.forEach((e) => used.add(e));
      ruleTag(t.fx, t.W / 2, t.g.cy, 'Обе команды меняются местами', 150, '', 1300);
      if (sw.length) await flipTo(t.fx, events, 700, (e) => e.type === 'swapped' || e.type === 'seaRevealed');
      return 600;
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

const playSea = async (c: SeaClip & { events: GameEvent[] }, ctx: FxCtx) => {
  const t = tableCtx(ctx);
  const key = c.key, S = seaCardByCode(ctx.data, c.card), fxs = SEAFX[key] || {};
  const W = t.W, R = t.R;
  if (c.round) { const g = gapBox(ctx); const bn = mk(ctx, 'banner small', W / 2, g.cy, `Раунд ${c.round}`); A(ctx, bn, [{ opacity: 0, scale: '.85' }, { opacity: 1, scale: '1', offset: 0.2 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], 900, 0); hint(ctx, `Раунд ${c.round}: новая карта моря`); await wait(ctx, 700); }
  if (c.reshuffled) { const db = bx(ctx, ctx.board.querySelector('[data-fx-deck]') || ctx.board); tag(ctx, db.cx, db.y - 10, 'Колода моря перемешана', 0, '', 1200); }
  const dim = mk(ctx, 'dim', 0, 0); dim.style.width = W + 'px'; dim.style.height = R + 'px';
  const dk = fxs.dim ?? 0.22;
  A(ctx, dim, [{ opacity: 0 }, { opacity: dk, offset: 0.15 }, { opacity: dk, offset: 0.8 }, { opacity: 0 }], 2900, 0);
  const storm = key === 'storm';
  const card = mk(ctx, 'seacard', W / 2, R / 2 - 8, `<div class="art" style="background:${SEA_BG[key]}"><span class="kind">Море · ${S.when.toLowerCase()}</span>
      ${storm ? `<svg class="c3" style="position:absolute;left:60px;top:-4px;opacity:.75" width="150" height="56" viewBox="0 0 150 56"><g fill="#6B7A88"><ellipse cx="60" cy="28" rx="44" ry="22"/><ellipse cx="104" cy="30" rx="34" ry="18"/></g></svg>
      <svg class="c1" style="position:absolute;left:6px;top:14px" width="130" height="66" viewBox="0 0 130 66"><g fill="#C9D0D6"><ellipse cx="56" cy="30" rx="36" ry="22"/><ellipse cx="30" cy="40" rx="24" ry="15"/><rect x="18" y="34" width="96" height="22" rx="11"/></g><g fill="#E6EAEE"><ellipse cx="52" cy="24" rx="26" ry="14"/></g><rect x="18" y="46" width="96" height="10" rx="5" fill="#9AA6B0"/></svg>
      <svg class="c2" style="position:absolute;left:112px;top:10px" width="140" height="66" viewBox="0 0 140 66"><g fill="#C9D0D6"><ellipse cx="66" cy="28" rx="34" ry="24"/><ellipse cx="100" cy="40" rx="26" ry="15"/><rect x="14" y="34" width="110" height="22" rx="11"/></g><g fill="#E6EAEE"><ellipse cx="62" cy="20" rx="24" ry="13"/></g><rect x="14" y="46" width="110" height="10" rx="5" fill="#9AA6B0"/></svg>
      <svg class="bolt" style="position:absolute;inset:0;z-index:3" viewBox="0 0 260 124"><path class="b1" d="M132 58 L118 80 L130 82 L114 112 L122 96" fill="none" stroke="#FFE58A" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" style="filter:drop-shadow(0 0 6px #FFD84A)" stroke-dasharray="160" stroke-dashoffset="160"/><path class="b2" d="M200 54 L192 72 L200 74 L188 98" fill="none" stroke="#FFE58A" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" style="filter:drop-shadow(0 0 6px #FFD84A)" stroke-dasharray="120" stroke-dashoffset="120"/></svg>` : `<div class="artmain">${seaSvg(key)}</div>`}
      <div class="fl"></div></div>
      <div class="body"><div class="t">${esc(S.name)}</div><div class="fxl">${esc(S.big)}</div><span class="dur">${S.when === 'Сразу' ? 'действует сразу' : 'до следующей карты моря'}</span></div>`);
  const sc = Math.min(1, (W - 32) / 250);
  A(ctx, card, [{ opacity: 0, transform: `translate(-50%,-50%) scale(${0.78 * sc}) translateY(16px)` }, { opacity: 1, transform: `translate(-50%,-50%) scale(${sc})` }], 450, 0, 'cubic-bezier(.2,.9,.3,1.25)', 'forwards');
  hint(ctx, `Море: «${S.name}» — ${strip(S.text)}`);
  if (storm) {
    A(ctx, card.querySelector('.c1')!, [{ transform: 'translateX(-140px)' }, { transform: 'none' }], 750, 100, 'cubic-bezier(.2,.8,.3,1)');
    A(ctx, card.querySelector('.c2')!, [{ transform: 'translateX(140px)' }, { transform: 'none' }], 750, 150, 'cubic-bezier(.2,.8,.3,1)');
    A(ctx, card.querySelector('.c3')!, [{ transform: 'translateY(-60px)', opacity: 0 }, { transform: 'none', opacity: 0.75 }], 800, 50, 'cubic-bezier(.2,.8,.3,1)');
    A(ctx, card.querySelector('.b1')!, [{ strokeDashoffset: 160, opacity: 1 }, { strokeDashoffset: 0, opacity: 1, offset: 0.2 }, { opacity: 0.25, offset: 0.45 }, { opacity: 1, offset: 0.6 }, { strokeDashoffset: 0, opacity: 0 }], 1100, 950);
    A(ctx, card.querySelector('.b2')!, [{ strokeDashoffset: 120, opacity: 1 }, { strokeDashoffset: 0, opacity: 1, offset: 0.2 }, { strokeDashoffset: 0, opacity: 0 }], 850, 1550);
    A(ctx, card.querySelector('.fl')!, [{ opacity: 0 }, { opacity: 0.9, offset: 0.06 }, { opacity: 0, offset: 0.18 }, { opacity: 0.45, offset: 0.28 }, { opacity: 0, offset: 0.36 }, { opacity: 0, offset: 0.6 }, { opacity: 0.6, offset: 0.64 }, { opacity: 0, offset: 0.72 }, { opacity: 0 }], 1000, 950, 'linear');
    at(ctx, 950, () => shake(ctx, card.querySelector('.art')!, 0, 4));
  } else {
    A(ctx, card.querySelector('.artmain')!, [{ transform: 'scale(.6) translateY(10px)', opacity: 0 }, { transform: 'scale(1.08)', opacity: 1, offset: 0.6 }, { transform: 'scale(1)', opacity: 1 }], 700, 250, 'cubic-bezier(.2,.8,.3,1.2)');
  }
  if (fxs.atmo) fxs.atmo(t);
  // the card flies into the sea chip of the status bar (the chip is outside the board — the card goes over its top edge)
  const chip = document.querySelector('[data-fx-sea-chip]');
  const out = storm ? 2350 : 2150;
  const target = chip ? bx(ctx, chip) : { cx: W - 60, cy: -20 };
  A(ctx, card, [{ opacity: 1, transform: `translate(-50%,-50%) scale(${sc})` }, { opacity: 0, transform: `translate(calc(-50% + ${target.cx - W / 2}px), calc(-50% + ${target.cy - (R / 2 - 8)}px)) scale(.16)` }], 450, out, 'ease-in', 'forwards');
  at(ctx, out + 400, () => {
    // game: the chip and the weather are drawn by React from the displayed state with the new sea card.
    ctx.renderWith(c.events.filter((e) => e.type === 'roundStarted' || e.type === 'seaRevealed'));
    const now = document.querySelector('[data-fx-sea-chip]');
    if (now) A(ctx, now, [{ transform: 'scale(1.25)' }, { transform: 'scale(1)' }], 300, 0, 'ease-out', 'none');
  });
  await wait(ctx, out + 450);
  // the changes on the planks — when the card no longer covers the table
  const effects = (c.effects || []).filter((e) => e.type !== 'seaEffect');
  const used = new Set<GameEvent>();
  let extra = 0;
  if (fxs.applyAsync) extra = await fxs.applyAsync(t, effects, used, c.events);
  else if (fxs.apply) extra = fxs.apply(t, effects, used);
  else if (fxs.rule) { ruleTag(ctx, W / 2, t.g.cy, fxs.rule, 100, '', 1500); extra = 1400; }
  const rest = seaLeftovers(t, effects, used, extra ? extra - 600 : 0);
  await wait(ctx, 250 + Math.max(extra, rest + 900));
};

/** A new round without a new sea card (if there ever is one). */
const playRound = async (c: RoundClip, ctx: FxCtx) => {
  const g = gapBox(ctx); const bn = mk(ctx, 'banner small', ctx.board.clientWidth / 2, g.cy, `Раунд ${c.round}`);
  A(ctx, bn, [{ opacity: 0, scale: '.85' }, { opacity: 1, scale: '1', offset: 0.2 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], 900, 0);
  await wait(ctx, 800);
};

export const PLAY_SEA = { sea: playSea as unknown as ClipPlayer, round: playRound as unknown as ClipPlayer };

/**
 * The quiet weather of the round by the sea card on the displayed table. game: drawn only where the layer plays with
 * rich effects (FxLayer.tsx), so it always moves; `on: false` empties it. Drawn again only when the card, the size of
 * the board or the places of the ships change.
 */
export function renderWeather(ctx: FxCtx, weather: HTMLElement, on: boolean): void {
  const code = on ? ctx.display.sea : null;
  const key = code ? seaKeyOf(ctx, code) : null;
  const D = ctx.display;
  const k2 = `${key}|${ctx.board.clientWidth}|${ctx.board.clientHeight}|${Object.keys(D.ships).map((c) => D.ships[c].pos + (D.ships[c].sunk ? 's' : '')).join('')}`;
  if (k2 === weather.dataset.key) return;
  weather.dataset.key = k2;
  weather.innerHTML = '';
  if (!key || !ctx.board.querySelector('[data-fx-gap]')) return;
  const t = tableCtx(ctx);
  const add = (cls: string, style: Partial<CSSStyleDeclaration> = {}) => { const d = document.createElement('div'); d.className = cls; Object.assign(d.style, style); weather.appendChild(d); return d; };
  if (key === 'storm') for (let i = 0; i < 14; i++) { const d = add('drop'); const x = Math.random() * (t.W + 80), y = Math.random() * t.R; d.animate([{ transform: `translate(${x}px,${y - 40}px) rotate(22deg)`, opacity: 0 }, { opacity: 0.45, offset: 0.2 }, { transform: `translate(${x - 40}px,${y + 70}px) rotate(22deg)`, opacity: 0 }], { duration: 1500 + Math.random() * 900, delay: -Math.random() * 2000, iterations: Infinity }); }
  if (key === 'fog') { for (const [x, y] of [[0, 0], [1, 0], [0, 1], [1, 1]]) add('haze', { left: x ? 'auto' : '-80px', right: x ? '-80px' : 'auto', top: y ? 'auto' : '-60px', bottom: y ? '-60px' : 'auto' }); diagLines(t, weather); }
  if (key === 'calm') { const d = document.createElement('div'); d.className = 'svgabs'; d.style.opacity = '1'; d.innerHTML = `<svg width="${t.W}" height="${t.R}"><g stroke="#9CC3DA" stroke-width="2" opacity=".6"><path d="M20 ${t.g.cy - 14} H${t.W - 20}"/><path d="M60 ${t.g.cy + 12} H${t.W - 60}"/></g></svg>`; weather.appendChild(d); }
  if (key === 'wind') for (let k = 0; k < 3; k++) { const s = add('streak'); s.style.width = '120px'; const y = 30 + k * (t.R / 3); s.animate([{ transform: `translate(-140px,${y}px)`, opacity: 0 }, { opacity: 0.5, offset: 0.4 }, { transform: `translate(${t.W}px,${y - 10}px)`, opacity: 0 }], { duration: 1600, delay: k * 1300, iterations: Infinity, easing: 'ease-in' }); }
  if (key === 'maelstrom') { const w = add('whirl bg'); w.innerHTML = '<svg viewBox="-50 -50 100 100" width="160" height="88"><g fill="none" stroke="#5E86A0" stroke-width="2.5" stroke-linecap="round" opacity=".45"><path d="M0 0 m-4 0 a4 4 0 1 1 8 0 a10 10 0 1 1 -20 0 a16 16 0 1 1 32 0 a22 22 0 1 1 -44 0 a28 28 0 1 1 56 0"/></g></svg>'; Object.assign(w.style, { left: t.W / 2 - 80 + 'px', top: t.g.cy - 44 + 'px', opacity: '1' }); w.firstElementChild!.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-360deg)' }], { duration: 12000, iterations: Infinity }); }
  if (key === 'clear') add('tint', { width: t.W + 'px', height: t.R + 'px', background: 'radial-gradient(ellipse at 50% 0%, rgba(255,214,120,.22), transparent 60%)', opacity: '1' });
  if (key === 'reefs') rocks(t, weather);
  if (key === 'moon') add('tint', { width: t.W + 'px', height: t.R + 'px', background: 'rgba(31,42,68,.12)', opacity: '1' });
  if (key === 'wave') for (let k = 0; k < 2; k++) { const w = document.createElement('div'); w.className = 'svgabs'; w.innerHTML = `<svg width="${t.W}" height="20"><path d="${wavyPath(t.W, 10, 6, 40)}" fill="none" stroke="#5E9CC0" stroke-width="2" opacity=".5"/></svg>`; weather.appendChild(w); w.animate([{ transform: `translate(-40px,${t.g.cy - 16 + k * 22}px)`, opacity: 0.6 }, { transform: `translate(0px,${t.g.cy - 16 + k * 22}px)`, opacity: 0.6 }], { duration: 2600, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out', delay: k * 600 }); }
}
