// 04 — the two holds and the tokens (docs/tasks/print-kit.md 3.6 with review-print 13–14 and review-player 3.1, 3.5,
// 3.7, 3.9). Portrait A4, one side.
//   sheet 1: «Трюм Пиратов», «Трюм Компании» (8 cells Ø 22 mm each), Powder × 24, Fire × 9, track markers × 17,
//            «Под водой»
//   sheet 2: the optional «Схема боя» — a 100 × 70 mm field and four ship tokens 30 × 30 mm
// Tokens are squares in grids without gaps: the cut lines are shared and run a few millimetres past the grid.
import fs from 'node:fs';
import path from 'node:path';
import { HERE, data, esc, mm, type Ctx, type PageSpec, type Part } from '../kit';
import { A4, COUNTS, DECKS, HOLD, TOKEN, type Ship } from '../layout';
import { BRASS, BRASS_DARK, BRASS_LIGHT, DECK_KEY, INK, PARCHMENT, darken, lighten } from '../colors';
import { iconImg } from '../icons';
import { bigShip } from '../../../src/ui/game/art/bigShips';

interface HoldText { side: 'pirates' | 'company'; name: string; rule: string }
const TXT = JSON.parse(fs.readFileSync(path.join(HERE, 'text/tokens.json'), 'utf8')) as {
  partTitle: string; title: string; lead: string; hint: string; footer: string; holds: HoldText[];
  powder: string; fire: string; markers: string; underwaterCaption: string; underwater: { title: string; lines: string[] };
  scheme: { title: string; optional: string; note: string; field: string; tokens: string; company: string; pirates: string; front: string; diag: string };
};
const fill = (s: string, v: Record<string, number | string>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? `{${k}}`));

// ---- colours of this part
const PAPER = '#fbf6ea';        // the light ground of tokens and holds
const CELL = '#fffdf7';
const PIRATES = '#2b2420';
const COMPANY = '#8a6520';
const CUT = '#8c8c8c';          // cut lines on light grounds
const CUT_ON_DARK = '#e6e1d6';  // the same lines between two dark tokens
const CUT_W = 0.25;
/** How far a cut line runs past its grid into the margin. */
const TICK = 4;

// ---- geometry of the sheets, mm
const HOLD_ROW = HOLD.cells * HOLD.cell + (HOLD.cells - 1) * HOLD.gap;            // 190
/** The cut line is 8 mm from the sheet edge; the cells start 2 mm inside it. */
const HOLD_BOX = { x: (A4.w - HOLD_ROW) / 2 - 2, y: 28, w: HOLD_ROW + 4, h: 44, cy: 27.5, pad: 2, tick: 3 };
const POWDER = { cols: 8, rows: 3, x: (A4.w - 8 * TOKEN.powder) / 2, y: 130 };
const FIRE = { cols: 9, rows: 1, x: (A4.w - 9 * TOKEN.fire) / 2, y: 205 };
/** Markers: 8 in the first row (Ж, М), 9 in the second (И, Г and the Soul marker). */
const MARK = { x: 11, y: 240, perRow: 8 };
const UNDER = { x: 124, y: 240 };
const FIELD = { x: (A4.w - 100) / 2, y: 40, w: 100, h: 70, slot: TOKEN.shipToken };
const SHIPS = { x: (A4.w - 4 * TOKEN.shipToken) / 2, y: 132 };

const ships = (): Ship[] => DECKS.map(code => data.ships.find(s => s.code === code)!);
const R = (n: number) => Math.round(n * 1000) / 1000;

/** Cut lines of a grid cols × rows of cells w × h at (x, y): every line is shared and runs tick mm past the grid. */
const gridCuts = (x: number, y: number, cols: number, rows: number, w: number, h: number, tick = TICK): string => {
  let d = '';
  for (let c = 0; c <= cols; c++) d += `M${R(x + c * w)} ${R(y - tick)}V${R(y + rows * h + tick)}`;
  for (let r = 0; r <= rows; r++) d += `M${R(x - tick)} ${R(y + r * h)}H${R(x + cols * w + tick)}`;
  return `<path d="${d}" stroke="${CUT}" stroke-width="${CUT_W}" fill="none"/>`;
};
const cutLayer = (inner: string) => `<svg class="tk-cut" viewBox="0 0 ${A4.w} ${A4.h}" style="position:absolute;left:0;top:0;width:${A4.w}mm;height:${A4.h}mm">${inner}</svg>`;
const box = (x: number, y: number, w: number, h: number, inner = '', cls = '', style = '') =>
  `<div class="${cls}" style="position:absolute;left:${mm(x)};top:${mm(y)};width:${mm(w)};height:${mm(h)};${style}">${inner}</div>`;
const cap = (x: number, y: number, text: string) => `<div class="tk-cap" style="left:${mm(x)};top:${mm(y)}">${esc(text)}</div>`;

const head = (title: string, lead: string, tag: string) =>
  `<div class="tk-title">${esc(title)}</div><div class="tk-tag">${esc(tag)}</div><div class="tk-lead">${esc(lead)}</div>`
  + `<svg style="position:absolute;left:10mm;top:23mm;width:190mm;height:1mm" viewBox="0 0 190 1"><path d="M0 .5H190" stroke="${BRASS}" stroke-width=".45"/><path d="M0 .5H38" stroke="${BRASS_DARK}" stroke-width=".9"/></svg>`;
const foot = (n: number, of: number) => `<div class="tk-foot">${esc(fill(TXT.footer, { n, of }))}</div>`;

// ---- holds
function holdHtml(t: HoldText, y: number, rule: string): string {
  const accent = t.side === 'pirates' ? PIRATES : COMPANY, { w, h, cy, pad } = HOLD_BOX, r = HOLD.cell / 2;
  const cells = Array.from({ length: HOLD.cells }, (_, i) => {
    const cx = pad + r + i * (HOLD.cell + HOLD.gap);
    return `<circle cx="${cx}" cy="${cy}" r="${r - 0.175}" fill="${CELL}" stroke="${lighten(accent, 0.3)}" stroke-width=".35" stroke-dasharray="1.3 .9"/>`
      + `<text x="${cx}" y="${cy + 2.35}" text-anchor="middle" font-family="Alegreya SC" font-weight="400" font-size="7" fill="#a08c62">${i + 1}</text>`;
  }).join('');
  return box(HOLD_BOX.x, y, w, h,
    `<svg viewBox="0 0 ${w} ${h}" style="position:absolute;left:0;top:0;width:100%;height:100%">`
    + `<rect x="1" y="1.6" width="${w - 2}" height="${h - 3.2}" rx="2.2" fill="${PAPER}" stroke="${accent}" stroke-width=".6"/>`
    + `<path d="M3.6 13.4H${w - 3.6}" stroke="${lighten(accent, 0.45)}" stroke-width=".25"/>${cells}</svg>`
    + `<div class="tk-hold-name" style="color:${accent}">${esc(t.name)}</div><div class="tk-hold-rule">${esc(rule)}</div>`,
    'tk-hold');
}

// ---- Fire: an own drawing. Light, glow and shadow are gradients (no filters), so the picture stays vector in the PDF;
// it is one SVG picture placed nine times by the same URL.
const FLAME_OUT = 'M52 14C53 26 66 33 69 48C72 62 63 79 50 79C37 79 28 68 30 54C31 46 35 41 37 33C39 38 42 41 45 41C44 31 47 21 52 14Z';
const FLAME_MID = 'M51 32C52 41 61 46 62 57C63 68 57 76.5 50 76.5C43 76.5 37 69 38 60C38.5 54 41 51 42.5 46C44 50 46 52 48 51C47.5 44 49 37 51 32Z';
const FLAME_IN = 'M50.5 50C51 56 56 59 56 65C56 71 53.5 74.5 50 74.5C46.5 74.5 44 71 44 66C44 62 46 60 47 57C48 59 49 60 50 59.5C49.8 56 50 53 50.5 50Z';
const FIRE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs>`
  + `<radialGradient id="fSh"><stop offset="0" stop-color="#2a1408" stop-opacity=".5"/><stop offset=".84" stop-color="#2a1408" stop-opacity=".46"/><stop offset="1" stop-color="#2a1408" stop-opacity="0"/></radialGradient>`
  + `<radialGradient id="fBg" cx=".5" cy=".64" r=".62"><stop offset="0" stop-color="#96300f"/><stop offset=".5" stop-color="#55160b"/><stop offset="1" stop-color="#210806"/></radialGradient>`
  + `<linearGradient id="fRing" x1=".1" y1="0" x2=".9" y2="1"><stop offset="0" stop-color="#f8e19a"/><stop offset=".45" stop-color="${BRASS_LIGHT}"/><stop offset="1" stop-color="#a87a2c"/></linearGradient>`
  + `<linearGradient id="fOut" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c01c0e"/><stop offset=".5" stop-color="#ec4a14"/><stop offset="1" stop-color="#ff8f1c"/></linearGradient>`
  + `<linearGradient id="fMid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8410"/><stop offset="1" stop-color="#ffd140"/></linearGradient>`
  + `<linearGradient id="fIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe680"/><stop offset="1" stop-color="#fffdf2"/></linearGradient>`
  + `<radialGradient id="fGlow"><stop offset="0" stop-color="#ffb040" stop-opacity=".9"/><stop offset=".55" stop-color="#ff6a10" stop-opacity=".42"/><stop offset="1" stop-color="#ff5a00" stop-opacity="0"/></radialGradient>`
  + `<radialGradient id="fEmb"><stop offset="0" stop-color="#ffc45a" stop-opacity=".75"/><stop offset="1" stop-color="#ff8a20" stop-opacity="0"/></radialGradient>`
  + `<clipPath id="fClip"><circle cx="50" cy="50" r="33.4"/></clipPath></defs>`
  + `<circle cx="50" cy="52.8" r="45" fill="url(#fSh)"/>`
  + `<circle cx="50" cy="50" r="40" fill="${BRASS_DARK}"/><circle cx="50" cy="50" r="38.1" fill="url(#fRing)"/>`
  + `<path d="M17.5 37A35.6 35.6 0 0 1 45 14.2" stroke="#fffbe6" stroke-width=".9" stroke-linecap="round" fill="none" opacity=".7"/>`
  + `<circle cx="50" cy="50" r="34.7" fill="${BRASS_DARK}"/><circle cx="50" cy="50" r="33.4" fill="url(#fBg)"/>`
  + `<g clip-path="url(#fClip)"><ellipse cx="50" cy="56" rx="31" ry="34" fill="url(#fGlow)"/><ellipse cx="50" cy="80" rx="24" ry="7" fill="url(#fEmb)"/></g>`
  + `<g transform="translate(50 79) scale(.93) translate(-50 -79)">`
  + `<path d="${FLAME_OUT}" fill="none" stroke="#ff7a1a" stroke-width="4.5" stroke-linejoin="round" opacity=".28"/>`
  + `<path d="${FLAME_OUT}" fill="url(#fOut)" stroke="#7c1508" stroke-width="1.1" stroke-linejoin="round"/>`
  + `<path d="M34.5 50C33 58 36 68 43 73.5" stroke="#ffa257" stroke-width="1.3" stroke-linecap="round" fill="none" opacity=".6"/>`
  + `<path d="${FLAME_MID}" fill="url(#fMid)"/><path d="${FLAME_IN}" fill="url(#fIn)"/>`
  + `<path d="M41.6 59.5C41.2 64 43 69 46 72" stroke="#fff6c4" stroke-width=".9" stroke-linecap="round" fill="none" opacity=".75"/></g>`
  + `<circle cx="34.5" cy="33" r="1.5" fill="#ffc650"/><circle cx="66" cy="31.5" r="1.2" fill="#ffb040"/><circle cx="62.5" cy="23.5" r=".9" fill="#ffd77a"/><circle cx="29" cy="43" r=".8" fill="#ff9a30"/>`
  + `</svg>`;
const FIRE_URI = 'data:image/svg+xml;base64,' + Buffer.from(FIRE_SVG).toString('base64');

// ---- track markers: a square of the ship's colour, the deck letter on a darker disc
function markersHtml(ctx: Ctx): { html: string; cuts: string } {
  const m = TOKEN.marker, list = ships().flatMap(s => Array.from({ length: 4 }, () => s)), n = MARK.perRow;
  if (list.length + 1 !== COUNTS.markers) throw new Error(`markers: ${list.length + 1}, expected ${COUNTS.markers}`);
  const pos = (i: number) => ({ x: (i < n ? i : i - n) * m, y: i < n ? 0 : m });
  const w = (list.length + 1 - n) * m, h = 2 * m, soul = pos(list.length);
  const svg = list.map((s, i) => {
    const p = pos(i), cx = p.x + m / 2, cy = p.y + m / 2;
    return `<rect x="${R(p.x)}" y="${R(p.y)}" width="${m}" height="${m}" fill="${s.color}"/>`
      + `<circle cx="${R(cx)}" cy="${R(cy)}" r="4.2" fill="${darken(s.color, 0.32)}" stroke="${lighten(s.color, 0.45)}" stroke-width=".25"/>`
      + `<text x="${R(cx)}" y="${R(cy + 1.95)}" text-anchor="middle" font-family="Alegreya SC" font-weight="800" font-size="6.2" fill="#fff4d8">${esc(s.code)}</text>`;
  }).join('')
    + `<rect x="${R(soul.x)}" y="${R(soul.y)}" width="${m}" height="${m}" fill="#e2f3ee"/>`
    + `<circle cx="${R(soul.x + m / 2)}" cy="${R(soul.y + m / 2)}" r="4.6" fill="#f6fcfa" stroke="#58a898" stroke-width=".25"/>`;
  const fd = 5, fh = fd * 54 / 44;
  const html = box(MARK.x, MARK.y, w, h, `<svg viewBox="0 0 ${w} ${h}" style="position:absolute;left:0;top:0;width:100%;height:100%">${svg}</svg>`
    + iconImg(ctx, 'flask', soul.x + (m - fd) / 2, soul.y + (m - fh) / 2 - 0.1, fd));
  // the outline with its ticks: grey; the lines between two dark markers: light
  const x = MARK.x, y = MARK.y, w1 = n * m;
  let d = '', light = '';
  for (let c = 0; c <= n + 1; c++) d += `M${R(x + c * m)} ${R((c > n ? y + m : y) - TICK)}V${R(y + h + TICK)}`;
  d += `M${R(x - TICK)} ${y}H${R(x + w1 + TICK)}M${R(x - TICK)} ${R(y + m)}H${R(x + w + TICK)}M${R(x - TICK)} ${R(y + h)}H${R(x + w + TICK)}`;
  for (let c = 1; c < n; c++) light += `M${R(x + c * m)} ${y}V${R(y + h)}`;
  light += `M${x} ${R(y + m)}H${R(x + w1)}`;
  return { html, cuts: `<path d="${d}" stroke="${CUT}" stroke-width="${CUT_W}" fill="none"/><path d="${light}" stroke="${CUT_ON_DARK}" stroke-width="${CUT_W}" fill="none"/>` };
}

// ---- «Под водой»
function underwaterHtml(): string {
  const g = data.ships.find(s => s.code === 'Г')!, { w, h } = TOKEN.underwater, rules = data.rules as Record<string, number>;
  const wave = (y: number, o: number, sw: number) => `<path d="M-2 ${y}q3.25 -1.5 6.5 0t6.5 0t6.5 0t6.5 0t6.5 0t6.5 0t6.5 0t6.5 0t6.5 0" stroke="#bfe6dc" stroke-width="${sw}" fill="none" opacity="${o}"/>`;
  return box(UNDER.x, UNDER.y, w, h,
    `<svg viewBox="0 0 ${w} ${h}" style="position:absolute;left:0;top:0;width:100%;height:100%"><defs><linearGradient id="tkSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${darken(g.color, 0.08)}"/><stop offset="1" stop-color="${darken(g.color, 0.3)}"/></linearGradient></defs>`
    + `<rect width="${w}" height="${h}" fill="url(#tkSea)"/>${wave(1.5, 0.4, 0.3)}${wave(23.6, 0.4, 0.3)}`
    + `<path d="${[3.6, 41.4].map(x => [4.1, 5.9].map(y => `M${x} ${y}q1.25 -1.1 2.5 0t2.5 0`).join('')).join('')}" stroke="#bfe6dc" stroke-width=".4" fill="none" stroke-linecap="round"/></svg>`
    + `<div class="tk-uw-t">${esc(TXT.underwater.title)}</div>`
    + `<div class="tk-uw-l">${TXT.underwater.lines.map(l => `<div>${esc(fill(l, { surface: rules.surfaceBonus }))}</div>`).join('')}</div>`,
    'tk-uw');
}

// ---- «Схема боя»
/** A straight double-headed arrow. */
function arrow(x1: number, y1: number, x2: number, y2: number, color: string, w: number, dash = '', hd = 1.7): string {
  const len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len, hw = hd * 0.42;
  const tip = (x: number, y: number, s: number) => `<path d="M${R(x)} ${R(y)}L${R(x + s * ux * hd - uy * hw)} ${R(y + s * uy * hd + ux * hw)}L${R(x + s * ux * hd + uy * hw)} ${R(y + s * uy * hd - ux * hw)}Z" fill="${color}"/>`;
  return `<path d="M${R(x1 + ux * hd * 0.8)} ${R(y1 + uy * hd * 0.8)}L${R(x2 - ux * hd * 0.8)} ${R(y2 - uy * hd * 0.8)}" stroke="${color}" stroke-width="${w}" fill="none"${dash ? ` stroke-dasharray="${dash}"` : ''}/>${tip(x1, y1, 1)}${tip(x2, y2, -1)}`;
}
function fieldHtml(): string {
  const { w, h, slot } = FIELD, s = TXT.scheme, xl = 4, xr = w - 4 - slot, yt = 2, yb = h - 2 - slot, mid = w / 2;
  const diag = Math.abs((data.ships[0].diagDamage as { offset: number }).offset);
  const place = (x: number, y: number, c: string) => `<rect x="${x}" y="${y}" width="${slot}" height="${slot}" rx="1.6" fill="${CELL}" stroke="${lighten(c, 0.25)}" stroke-width=".35" stroke-dasharray="1.3 .9"/>`;
  const plate = (y: number, c: string, t: string) => `<rect x="${mid - 13}" y="${y}" width="26" height="5.4" rx="1.1" fill="${c}"/><text x="${mid}" y="${y + 3.85}" text-anchor="middle" font-family="Alegreya SC" font-weight="700" font-size="3.3" letter-spacing=".3" fill="#fff4d8">${esc(t.toUpperCase())}</text>`;
  const legend = (y: number, t: string) => t.split(/(?<=—) /).map((l, i) => `<text x="${mid}" y="${y + i * 3.6}" text-anchor="middle" font-family="Alegreya Sans" font-weight="500" font-size="3" fill="${INK}">${esc(l)}</text>`).join('');
  const line = '#3a2c1c', dline = '#6a5a44';
  return box(FIELD.x, FIELD.y, w, h,
    `<svg viewBox="0 0 ${w} ${h}" style="position:absolute;left:0;top:0;width:100%;height:100%">`
    + place(xl, yt, COMPANY) + place(xr, yt, COMPANY) + place(xl, yb, PIRATES) + place(xr, yb, PIRATES)
    + arrow(xl + slot / 2, yt + slot + 0.5, xl + slot / 2, yb - 0.5, line, 0.55) + arrow(xr + slot / 2, yt + slot + 0.5, xr + slot / 2, yb - 0.5, line, 0.55)
    + arrow(xl + slot + 0.8, 25, xr - 0.8, 45, dline, 0.45, '1.5 1') + arrow(xr - 0.8, 25, xl + slot + 0.8, 45, dline, 0.45, '1.5 1')
    + plate(3.2, COMPANY, s.company) + arrow(mid - 6, 12.2, mid + 6, 12.2, line, 0.55) + legend(16.7, s.front)
    + arrow(mid - 6, 49.4, mid + 6, 49.4, dline, 0.45, '1.5 1') + legend(53.9, fill(s.diag, { diag }))
    + plate(h - 3.2 - 5.4, PIRATES, s.pirates) + `</svg>`,
    'tk-field');
}
function shipTokensHtml(): string {
  const t = TOKEN.shipToken, list = ships();
  const one = (s: Ship, i: number) => {
    const x = i * t;
    return `<rect x="${x}" y="0" width="${t}" height="${t}" fill="${PAPER}"/><rect x="${x}" y="21.4" width="${t}" height="${t - 21.4}" fill="${s.color}"/>`
      + `<path d="M${x} 21.4H${x + t}" stroke="${BRASS_LIGHT}" stroke-width=".35"/>`
      + bigShip(DECK_KEY[s.code], x + 16.2, 20.2, 0.172)
      + `<circle cx="${x + 5.6}" cy="5.6" r="3.3" fill="${s.color}" stroke="${BRASS_LIGHT}" stroke-width=".3"/>`
      + `<text x="${x + 5.6}" y="7.05" text-anchor="middle" font-family="Alegreya SC" font-weight="800" font-size="4.3" fill="#fff4d8">${esc(s.code)}</text>`
      + `<text x="${x + t / 2}" y="26.85" text-anchor="middle" font-family="Alegreya SC" font-weight="700" font-size="3.5" letter-spacing=".12" fill="#fff4d8">${esc(s.nick)}</text>`;
  };
  return box(SHIPS.x, SHIPS.y, list.length * t, t, `<svg viewBox="0 0 ${list.length * t} ${t}" style="position:absolute;left:0;top:0;width:100%;height:100%">${list.map(one).join('')}</svg>`);
}

// ---- pages
export function tokenPages(ctx: Ctx): PageSpec[] {
  const econ = data.econ as { income: number; first_income: number; cap: number; second_start: number }, rules = data.rules as Record<string, number>;
  const nums = { income: econ.income, first: econ.first_income, cap: econ.cap, start: econ.second_start, firstGame: rules.firstGameSecondStart };
  const pd = TOKEN.powder, fr = TOKEN.fire, coinD = 15;
  const cells = (g: { cols: number; rows: number; x: number; y: number }, size: number, count: number, inner: (i: number) => string) => {
    if (g.cols * g.rows !== count) throw new Error(`token grid ${g.cols} × ${g.rows}, expected ${count}`);
    return box(g.x, g.y, g.cols * size, g.rows * size, Array.from({ length: count }, (_, i) => box((i % g.cols) * size, Math.floor(i / g.cols) * size, size, size, inner(i), 'tk-tok')).join(''), '', `background:${PAPER}`);
  };
  const markers = markersHtml(ctx);
  const page1 = head(TXT.title, TXT.lead, fill('лист {n} из {of}', { n: 1, of: 2 }))
    + TXT.holds.map((h, i) => holdHtml(h, HOLD_BOX.y + i * HOLD_BOX.h, fill(h.rule, nums))).join('')
    + cap(POWDER.x, POWDER.y - 8.8, fill(TXT.powder, { n: COUNTS.powder }))
    + cells(POWDER, pd, COUNTS.powder, () => iconImg(ctx, 'coin', (pd - coinD) / 2, (pd - coinD) / 2, coinD))
    + cap(FIRE.x, FIRE.y - 8.8, fill(TXT.fire, { n: COUNTS.fire }))
    + cells(FIRE, fr, COUNTS.fire, () => `<img src="${FIRE_URI}" style="position:absolute;left:0;top:0;width:${fr}mm;height:${fr}mm" alt="">`)
    + cap(MARK.x, MARK.y - 8.8, TXT.markers) + markers.html
    + cap(UNDER.x, UNDER.y - 8.8, TXT.underwaterCaption) + underwaterHtml()
    + `<div class="tk-hint">${esc(TXT.hint)}</div>` + foot(1, 2)
    + cutLayer(gridCuts(HOLD_BOX.x, HOLD_BOX.y, 1, TXT.holds.length, HOLD_BOX.w, HOLD_BOX.h, HOLD_BOX.tick)
      + gridCuts(POWDER.x, POWDER.y, POWDER.cols, POWDER.rows, pd, pd) + gridCuts(FIRE.x, FIRE.y, FIRE.cols, FIRE.rows, fr, fr)
      + markers.cuts + gridCuts(UNDER.x, UNDER.y, 1, 1, TOKEN.underwater.w, TOKEN.underwater.h));
  const s = TXT.scheme, st = TOKEN.shipToken;
  const page2 = head(s.title, s.note, s.optional)
    + cap(FIELD.x, FIELD.y - 8.8, s.field) + fieldHtml()
    + cap(SHIPS.x, SHIPS.y - 8.8, fill(s.tokens, { n: ships().length })) + shipTokensHtml() + foot(2, 2)
    + cutLayer(gridCuts(FIELD.x, FIELD.y, 1, 1, FIELD.w, FIELD.h) + gridCuts(SHIPS.x, SHIPS.y, ships().length, 1, st, st));
  return [{ html: page1 }, { html: page2 }];
}

export const TOKENS_CSS = `
.tk-title{position:absolute;left:10mm;top:8mm;font:800 22pt/1 'Alegreya SC',serif;color:${INK};letter-spacing:.01em}
.tk-tag{position:absolute;right:10mm;top:11.5mm;font:500 8.5pt/1 'Alegreya Sans',sans-serif;color:#7a6a52;letter-spacing:.09em;text-transform:uppercase}
.tk-lead{position:absolute;left:10mm;top:17.4mm;font:italic 400 10pt/1.2 Alegreya,serif;color:#4a3a26}
.tk-cap{position:absolute;font:700 10pt/1.2 Alegreya,serif;color:${INK};white-space:nowrap}
.tk-foot{position:absolute;left:10mm;top:285mm;font:500 7pt/1 'Alegreya Sans',sans-serif;color:#8a7a62;letter-spacing:.09em;text-transform:uppercase}
.tk-hint{position:absolute;left:10mm;right:10mm;top:271.5mm;font:italic 400 9.5pt/1.2 Alegreya,serif;color:#4a3a26;text-align:center}
.tk-hold{background:${PARCHMENT}}
.tk-hold-name{position:absolute;left:3.8mm;top:5.1mm;font:800 15pt/1 'Alegreya SC',serif;letter-spacing:.03em;white-space:nowrap}
.tk-hold-rule{position:absolute;right:3.8mm;top:7.1mm;font:500 9pt/1 'Alegreya Sans',sans-serif;color:${INK};white-space:nowrap}
.tk-tok{overflow:hidden}
.tk-uw{color:#fff}
.tk-uw-t{position:absolute;left:0;right:0;top:2.7mm;text-align:center;font:800 12pt/1 'Alegreya SC',serif;letter-spacing:.05em;color:#fff}
.tk-uw-l{position:absolute;left:2mm;right:2mm;top:7.9mm;text-align:center;font:700 8pt/1.2 'Alegreya Sans',sans-serif;color:#fff;white-space:nowrap}
.tk-field{background:${PAPER}}
`;

export async function build(ctx: Ctx): Promise<Part[]> {
  return [{ file: '04-tryumy-zhetony', title: TXT.partTitle, css: TOKENS_CSS, pages: tokenPages(ctx) }];
}
