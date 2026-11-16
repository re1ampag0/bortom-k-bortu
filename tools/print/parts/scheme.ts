// 04b — the «Схема боя», the centre of the table (A4 landscape, one side). The whole sheet is the engraved chart of the
// Caribbean (tools/print/map/chart.ts, the plain keeping of the stand-alone preview, moved a little east and north so
// the battle lies in the open sea of the Mar del Norte and Tortuga with Hispaniola shows between the plates):
//   - top right: the battle — 2 brass nests of the Company (the far row) opposite 2 nests of the Pirates (the near row)
//     for the ship tokens 30 × 30 mm, a flag of the side at each nest, the side's name plate between its two nests;
//     thin course lines from nest to nest with the captain's ink notes «напротив — полный урон», «по диагонали −1»;
//   - bottom: three brass nests for whole cards (opening 64 × 89 mm): the sea deck, the sea card, «Эффекты этого хода»,
//     a parchment label over each;
//   - the left column: the title, the phase of the round (a brass rail with three berths ≥ 13 mm for the 11 mm mark),
//     the joint volley, and the lasting effects in a cartouche like the captain's entry.
// Every plate is marked data-plate, every word data-in="<its plate>" (tools/print/check-layout.ts).
import fs from 'node:fs';
import path from 'node:path';
import { HERE, data, esc, fontCss, type Ctx, type Part } from '../kit';
import { darken } from '../colors';
import { chartSvg, type Rect } from '../map/chart';
import { rasterJpeg } from '../map/raster';
import { icon, TONE, type IconName } from './icons';
import { measureMissing, widthOf, type TO } from './boards/frame';

export const SCHEME_FILE = '04b-skhema-boya';

interface SchemeText {
  partTitle: string; title: string; tag: string; lead: string; phase: { title: string; sub: string; steps: string[] }; company: string; pirates: string;
  front: string[]; diag: string; joint: string[]; seaDeck: { title: string; lines: string[] }; seaCard: { title: string; lines: string[] };
  effects: { title: string; cards: string[] }; long: { title: string; cards: string[]; text: string };
}
const S = (JSON.parse(fs.readFileSync(path.join(HERE, 'text/tokens.json'), 'utf8')) as { scheme: SchemeText }).scheme;
const fill = (s: string, v: Record<string, number | string>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? `{${k}}`));
/** a card of the data by its name: the printed names must be exactly the data's */
const cardName = (name: string): string => {
  const all = [...Object.values(data.decks).flat(), ...Object.values(data.legends)];
  if (!all.some(c => c.name === name)) throw new Error(`tokens.json: no card «${name}» in data/game-data.json`);
  return `«${name}»`;
};

// ---- geometry, mm ----
const PAGE = { w: 297, h: 210 };
/** the chart: the preview's scale; Tortuga put at this point of the sheet */
const VIEW = { mmPerDeg: 11.2, anchor: { lon: -72.8, lat: 20.05, x: 124, y: 64 }, inset: 4 };
/** the left column */
const COL = { x: 7, w: 67, top: 6, bottom: 204 };
/** a ship nest: brass frame, opening 31 mm (the token 30 × 30 with 0.5 mm round it) */
const NEST = { size: 35, rim: 2 };
const NX = [160, 242], NY = { company: 6, pirates: 56.5 };
/** a card nest: brass frame 1.5 mm, opening 64 × 89 (a card 63 × 88 lies in it whole); its label above */
const SLOT = { w: 67, h: 92, rim: 1.5, y: 112, xs: [79, 151, 223] };
const LABEL = { y: 94.5, h: 16.5 };
/** a berth of the phase rail: 15 mm brass, the well 13 mm (the 11 mm mark) */
const BERTH = { size: 15, rim: 1, pitch: 19 };

// ---- colours ----
const INKC = '#2a1c0c';
const NOTE_INK = '#2a2018';
const PIRATES = '#2b2420';
const COMPANY = '#8a6520';
const COMPANY_INK = darken(COMPANY, 0.4);
const SEA_INK = '#1f4654';
const LOOK = { paper: '#f1e4c2', paperLine: '#5a4024', soft: '#4f3d28', cell: '#f7eed6', cellDeep: '#e3d1a6', brass: ['#f3d68c', '#c4954a', '#5e4214'] as const, halo: '#efe3c6' };
const SIDE = {
  company: { name: S.company, ink: COMPANY_INK, plate: COMPANY_INK, tint: '#efe2c0' },
  pirates: { name: S.pirates, ink: PIRATES, plate: PIRATES, tint: '#e9e2d2' }
};
type Side = keyof typeof SIDE;

const r = (n: number) => Math.round(n * 100) / 100;
const pt = (n: number) => n * 25.4 / 72;
const W = (s: string, size: number, o: TO = {}) => widthOf(s, size, o);
interface TO2 extends TO { in?: string; name?: string; halo?: boolean; lh?: number }
const text = (x: number, y: number, s: string, size: number, o: TO2 = {}) => {
  const a = `x="${r(x)}" y="${r(y)}" font-family="${o.font ?? 'Alegreya Sans'}" font-weight="${o.w ?? 500}"${o.italic ? ' font-style="italic"' : ''} font-size="${r(pt(size))}"${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.ls ? ` letter-spacing="${o.ls}"` : ''}`;
  // several lines (\n) are one element: tspans lh mm apart
  const body = s.includes('\n') ? s.split('\n').map((l, i) => `<tspan x="${r(x)}" y="${r(y + i * (o.lh ?? pt(size) * 1.2))}">${esc(l)}</tspan>`).join('') : esc(s);
  const halo = o.halo ? `<text ${a} fill="none" stroke="${LOOK.halo}" stroke-width="${r(pt(size) * 0.28)}" stroke-opacity=".9" stroke-linejoin="round">${body}</text>` : '';
  return `${halo}<text${o.in ? ` data-in="${o.in}"` : ''}${o.name ? ` data-name="${esc(o.name)}"` : ''} ${a} fill="${o.color ?? INKC}">${body}</text>`;
};
const plateRect = (id: string, b: Rect) => `<rect data-plate="${id}" x="${r(b.x)}" y="${r(b.y)}" width="${r(b.w)}" height="${r(b.h)}" fill="none" stroke="none"/>`;
const ico = (name: IconName, cx: number, cy: number, s: number, id: string, op = 1) => `<rect data-plate="${id}" x="${r(cx - s / 2)}" y="${r(cy - s / 2)}" width="${s}" height="${s}" fill="none"/>${op < 1 ? `<g opacity="${op}">` : ''}${icon(name, cx, cy, s, TONE.sepia)}${op < 1 ? '</g>' : ''}`;
const hex = (c: string) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const mix = (a: string, b: string, k: number) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * k).toString(16).padStart(2, '0')).join('');

// ---- SVG pieces (the manner of the boards v2: brass gradients, parchment slips) ----
const ID = 'sc';
function defs(): string {
  const [bl, bm, bd] = LOOK.brass;
  return `<defs>
<linearGradient id="${ID}br" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bl}"/><stop offset=".42" stop-color="${bm}"/><stop offset=".55" stop-color="${bm}"/><stop offset="1" stop-color="${bd}"/></linearGradient>
<linearGradient id="${ID}brh" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bl}"/><stop offset=".5" stop-color="${bm}"/><stop offset="1" stop-color="${bd}"/></linearGradient>
<linearGradient id="${ID}well" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${LOOK.cellDeep}"/><stop offset=".3" stop-color="${LOOK.cell}"/><stop offset="1" stop-color="${LOOK.cell}"/></linearGradient>
<linearGradient id="${ID}paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${LOOK.paper}"/><stop offset="1" stop-color="${mix(LOOK.paper, '#8a6a3a', 0.08)}"/></linearGradient>
</defs>`;
}
const shadow = (b: Rect, rx: number, op = 0.28) => `<rect x="${r(b.x + 0.5)}" y="${r(b.y + 0.75)}" width="${r(b.w)}" height="${r(b.h)}" rx="${rx}" fill="#1a0e04" fill-opacity="${op}"/>`;
/** a slip of parchment on the chart: a soft shadow, a double rule */
function slip(pid: string, b: Rect, op = 0.94): string {
  return shadow(b, 1.4, 0.24) +
    `<rect data-plate="${pid}" x="${r(b.x)}" y="${r(b.y)}" width="${r(b.w)}" height="${r(b.h)}" rx="1.4" fill="url(#${ID}paper)" fill-opacity="${op}" stroke="${LOOK.paperLine}" stroke-opacity=".55" stroke-width=".25"/>` +
    `<rect x="${r(b.x + 1)}" y="${r(b.y + 1)}" width="${r(b.w - 2)}" height="${r(b.h - 2)}" rx=".8" fill="none" stroke="${LOOK.paperLine}" stroke-opacity=".6" stroke-width=".18"/>`;
}
const rivet = (x: number, y: number, R = 0.9) => `<circle cx="${r(x)}" cy="${r(y)}" r="${R}" fill="${LOOK.brass[0]}" stroke="${LOOK.brass[2]}" stroke-width=".22"/><circle cx="${r(x - R * 0.3)}" cy="${r(y - R * 0.3)}" r="${r(R * 0.3)}" fill="#fff8e0" fill-opacity=".7"/>`;
/** a brass frame round an opening: the frame is the plate, the opening a clean recessed well */
function frame(pid: string, b: Rect, rim: number, rx: number, well: string): string {
  return shadow(b, rx, 0.32) +
    `<rect data-plate="${pid}" x="${r(b.x)}" y="${r(b.y)}" width="${r(b.w)}" height="${r(b.h)}" rx="${rx}" fill="url(#${ID}brh)" stroke="${LOOK.brass[2]}" stroke-width=".3"/>` +
    `<path d="M${r(b.x + rx)} ${r(b.y + 0.35)}H${r(b.x + b.w - rx)}" stroke="#fff6d8" stroke-opacity=".6" stroke-width=".25"/>` +
    `<rect x="${r(b.x + rim)}" y="${r(b.y + rim)}" width="${r(b.w - 2 * rim)}" height="${r(b.h - 2 * rim)}" rx="${r(Math.max(0.6, rx - rim * 0.6))}" fill="${well}" stroke="${LOOK.brass[2]}" stroke-width=".28"/>`;
}

// ---- the flags of the sides (own drawings): Pirates — black with crossed sabres; Company — red and white stripes ----
/** a flag on a staff: the foot of the staff (x, y), the flag flies to dir (±1); h — the staff's height */
function flag(side: Side, x: number, y: number, dir: 1 | -1, h = 12, pid?: string): string {
  const fw = h * 0.62, fh = h * 0.42, top = y - h + 0.6, x1 = x + dir * fw, wave = (yy: number) => `Q${r(x + dir * fw * 0.5)} ${r(yy - fh * 0.16)} ${r(x1)} ${r(yy + fh * 0.06)}`;
  const outline = `M${r(x)} ${r(top)}${wave(top)}L${r(x1)} ${r(top + fh + fh * 0.06)}Q${r(x + dir * fw * 0.5)} ${r(top + fh - fh * 0.16)} ${r(x)} ${r(top + fh)}Z`;
  const clip = `${ID}fl${Math.round(x * 10)}${Math.round(y * 10)}`;
  let body = '';
  if (side === 'pirates') {
    const cx = x + dir * fw * 0.52, cy = top + fh * 0.5, s = fh * 0.34;
    body = `<path d="${outline}" fill="#181512"/>` +
      `<path d="M${r(cx - s)} ${r(cy - s)}Q${r(cx)} ${r(cy - s * 0.2)} ${r(cx + s)} ${r(cy + s)}M${r(cx + s)} ${r(cy - s)}Q${r(cx)} ${r(cy - s * 0.2)} ${r(cx - s)} ${r(cy + s)}" fill="none" stroke="#f3ead6" stroke-width="${r(h * 0.035)}" stroke-linecap="round"/>` +
      `<path d="M${r(cx - s * 0.75)} ${r(cy + s * 0.45)}l${r(s * 0.5)} ${r(s * 0.3)}M${r(cx + s * 0.75)} ${r(cy + s * 0.45)}l${r(-s * 0.5)} ${r(s * 0.3)}" stroke="#f3ead6" stroke-width="${r(h * 0.03)}" stroke-linecap="round"/>`;
  } else {
    let stripes = '';
    for (let i = 0; i < 7; i += 2) stripes += `<rect x="${r(Math.min(x, x1) - 1)}" y="${r(top - 1 + i * (fh + 2) / 7)}" width="${r(fw + 2)}" height="${r((fh + 2) / 7)}" fill="#a8261c"/>`;
    const cw = fw * 0.4, ch = fh * 0.5, cx0 = dir > 0 ? x : x - cw;
    body = `<clipPath id="${clip}"><path d="${outline}"/></clipPath><path d="${outline}" fill="#f6efe0"/><g clip-path="url(#${clip})">${stripes}` +
      `<rect x="${r(cx0)}" y="${r(top - 1)}" width="${r(cw)}" height="${r(ch + 1)}" fill="#f6efe0"/><path d="M${r(cx0 + cw / 2)} ${r(top - 1)}V${r(top + ch)}M${r(cx0)} ${r(top + ch * 0.55)}H${r(cx0 + cw)}" stroke="#a8261c" stroke-width="${r(fh * 0.12)}"/></g>`;
  }
  return `<g${pid ? ` data-plate="${pid}"` : ''}>${body}<path d="${outline}" fill="none" stroke="#1a120a" stroke-width=".16"/>` +
    `<path d="M${r(x)} ${r(y)}V${r(top - 0.4)}" stroke="#3a2412" stroke-width="${r(Math.max(0.3, h * 0.04))}" stroke-linecap="round"/><circle cx="${r(x)}" cy="${r(top - 0.6)}" r="${r(h * 0.045)}" fill="${LOOK.brass[1]}" stroke="${LOOK.brass[2]}" stroke-width=".12"/></g>`;
}

// ---- the battle ----
const nestBox = (side: Side, i: number): Rect => ({ x: NX[i], y: NY[side], w: NEST.size, h: NEST.size });
const nestC = (side: Side, i: number) => { const b = nestBox(side, i); return { x: b.x + b.w / 2, y: b.y + b.h / 2 }; };
function nestSvg(side: Side, i: number): string {
  const b = nestBox(side, i), m = NEST.rim, o = NEST.size - 2 * m, t = 30, g = (o - t) / 2, sd = SIDE[side];
  const out = [frame(`nest-${side}-${i}`, b, m, 2.4, mix(LOOK.cell, sd.tint, 0.6))];
  // where the token lies: a fine dashed square; the side's flag faint in the well (seen while the nest is empty)
  out.push(`<rect x="${r(b.x + m + g)}" y="${r(b.y + m + g)}" width="${t}" height="${t}" rx=".8" fill="none" stroke="${LOOK.paperLine}" stroke-opacity=".55" stroke-width=".22" stroke-dasharray="1.4 1"/>`);
  out.push(`<g opacity=".16">${flag(side, b.x + b.w / 2 - 5.5, b.y + b.h / 2 + 8.5, 1, 17)}</g>`);
  for (const [dx, dy] of [[1.25, 1.25], [b.w - 1.25, 1.25], [1.25, b.h - 1.25], [b.w - 1.25, b.h - 1.25]]) out.push(rivet(b.x + dx, b.y + dy, 0.62));
  // the flag of the side on a pin at the nest's outer upper corner
  const outer = i === 0 ? -1 : 1, fx = i === 0 ? b.x - 2.4 : b.x + b.w + 2.4;
  out.push(flag(side, fx, b.y + 15, outer as 1 | -1, 13, `flag-${side}-${i}`));
  return out.join('');
}
/** the side's name between its two nests: a dark plate with a brass rule */
function namePlate(side: Side): { svg: string; box: Rect } {
  const sd = SIDE[side], size = 11, so: TO = { font: 'Alegreya SC', w: 800, ls: '.12em' }, word = sd.name.toUpperCase();
  const tw = W(word, size, so), cy = NY[side] + NEST.size / 2, cx = (NX[0] + NEST.size + NX[1]) / 2, w = tw + 10, h = 8.6, b = { x: cx - w / 2, y: cy - h / 2, w, h };
  return {
    box: b,
    svg: shadow(b, 1.3, 0.3) + `<rect data-plate="name-${side}" x="${r(b.x)}" y="${r(b.y)}" width="${r(w)}" height="${h}" rx="1.3" fill="${sd.plate}" stroke="${LOOK.brass[2]}" stroke-width=".3"/>` +
      `<rect x="${r(b.x + 0.8)}" y="${r(b.y + 0.8)}" width="${r(w - 1.6)}" height="${r(h - 1.6)}" rx=".8" fill="none" stroke="${LOOK.brass[1]}" stroke-width=".3"/>` +
      text(cx + pt(size) * 0.06, cy + pt(size) * 0.33, word, size, { ...so, color: '#fff4d8', anchor: 'middle', in: `name-${side}` })
  };
}
/** the part of the segment a→b outside the rect c (Liang–Barsky): 0, 1 or 2 pieces */
function cutOut(a: { x: number; y: number }, b: { x: number; y: number }, c: Rect | null): [number, number][] {
  if (!c) return [[0, 1]];
  const dx = b.x - a.x, dy = b.y - a.y; let t0 = 0, t1 = 1;
  for (const [p, q] of [[-dx, a.x - c.x], [dx, c.x + c.w - a.x], [-dy, a.y - c.y], [dy, c.y + c.h - a.y]]) {
    if (p === 0) { if (q < 0) return [[0, 1]]; continue; }
    const t = q / p;
    if (p < 0) t0 = Math.max(t0, t); else t1 = Math.min(t1, t);
  }
  if (t0 >= t1) return [[0, 1]];
  return [[0, t0], [t1, 1]].filter(([u, v]) => v - u > 0.02) as [number, number][];
}
/** a course line in ink between two nests, an arrowhead at both ends; dashed for the diagonal; a halo of paper under it */
function course(a: { x: number; y: number }, b: { x: number; y: number }, dash: string, cut: Rect | null): string {
  const len = Math.hypot(b.x - a.x, b.y - a.y), ux = (b.x - a.x) / len, uy = (b.y - a.y) / len, hd = 2.2, hw = 0.9;
  const P = (t: number) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  const tip = (x: number, y: number, s: number) => `<path d="M${r(x)} ${r(y)}L${r(x + s * ux * hd - uy * hw)} ${r(y + s * uy * hd + ux * hw)}L${r(x + s * ux * hd + uy * hw)} ${r(y + s * uy * hd - ux * hw)}Z" fill="${NOTE_INK}"/>`;
  let d = '';
  for (const [u, v] of cutOut(a, b, cut)) {
    const p = P(u), q = P(v), s0 = u === 0 ? hd * 0.8 : 0, s1 = v === 1 ? hd * 0.8 : 0;
    d += `M${r(p.x + ux * s0)} ${r(p.y + uy * s0)}L${r(q.x - ux * s1)} ${r(q.y - uy * s1)}`;
  }
  return `<path d="${d}" stroke="${LOOK.halo}" stroke-opacity=".75" stroke-width="1.3" fill="none" stroke-linecap="round"/>` +
    `<path d="${d}" stroke="${NOTE_INK}" stroke-width=".42" fill="none"${dash ? ` stroke-dasharray="${dash}"` : ''}/>${tip(a.x, a.y, 1)}${tip(b.x, b.y, -1)}`;
}
/** the point where the segment from the centre c towards p leaves the nest box (plus a gap) */
function edgePoint(c: { x: number; y: number }, p: { x: number; y: number }, b: Rect, gap: number): { x: number; y: number } {
  const dx = p.x - c.x, dy = p.y - c.y, hw = b.w / 2 + gap, hh = b.h / 2 + gap, t = Math.min(dx ? hw / Math.abs(dx) : 1e9, dy ? hh / Math.abs(dy) : 1e9);
  return { x: c.x + dx * t, y: c.y + dy * t };
}
function battleSvg(): { svg: string; plates: Rect[] } {
  const out: string[] = [], plates: Rect[] = [], diag = Math.abs((data.ships[0].diagDamage as { offset: number }).offset);
  for (const side of ['company', 'pirates'] as Side[]) for (const i of [0, 1]) { out.push(nestSvg(side, i)); plates.push(nestBox(side, i)); }
  // the captain's ink notes: «по диагонали −1» on the crossing of the diagonals, «напротив — полный урон» by the left course
  const nsize = 10, no: TO2 = { font: 'Alegreya', w: 500, italic: true, color: NOTE_INK, halo: true };
  const c00 = nestC('company', 0), c01 = nestC('company', 1), c10 = nestC('pirates', 0), c11 = nestC('pirates', 1);
  const X = { x: (c00.x + c11.x) / 2, y: (c00.y + c11.y) / 2 }, dWord = fill(S.diag, { diag }), dw = W(dWord, nsize, no), em = pt(nsize);
  const dBox = { x: X.x - dw / 2 - 2.1, y: X.y - em * 0.7 - 2.1, w: dw + 4.2, h: em * 1.3 + 4.2 };
  const gap = 0.9;
  for (const [p, q] of [[c00, c11], [c01, c10]]) out.push(course(edgePoint(p, q, nestBox('company', p === c00 ? 0 : 1), gap), edgePoint(q, p, nestBox('pirates', q === c11 ? 1 : 0), gap), '1.7 1.1', dBox));
  for (const i of [0, 1]) { const a = nestC('company', i), b = nestC('pirates', i); out.push(course({ x: a.x, y: NY.company + NEST.size + gap }, { x: b.x, y: NY.pirates - gap }, '', null)); }
  out.push(plateRect('note-diag', dBox) + text(X.x, X.y + em * 0.3, dWord, nsize, { ...no, anchor: 'middle', in: 'note-diag' }));
  plates.push(dBox);
  const fx = c00.x - 3, f0 = S.front[0], f1 = S.front[1], fw = Math.max(W(f0, nsize, no), W(f1, nsize, no)), mid = (NY.company + NEST.size + NY.pirates) / 2, lh = em * 1.2;
  const fBox = { x: fx - fw - 2.1, y: mid - lh / 2 - em * 0.75 - 2.1, w: fw + 4.2, h: lh + em * 1.3 + 4.2 };
  out.push(plateRect('note-front', fBox) + text(fx, mid - lh / 2 + em * 0.3, `${f0}\n${f1}`, nsize, { ...no, anchor: 'end', lh, in: 'note-front', name: `${f0} ${f1}` }));
  plates.push(fBox);
  for (const side of ['company', 'pirates'] as Side[]) { const np = namePlate(side); out.push(np.svg); plates.push(np.box); }
  return { svg: out.join('\n'), plates };
}

// ---- the card nests ----
interface Place { key: string; icon: IconName; title: string; lines: string[] }
const places = (): Place[] => {
  const eff = S.effects.cards.map(cardName);
  return [
    { key: 'deck', icon: 'seaDeck', title: S.seaDeck.title, lines: S.seaDeck.lines },
    { key: 'card', icon: 'seaCard', title: S.seaCard.title, lines: S.seaCard.lines },
    { key: 'effects', icon: 'effects', title: S.effects.title, lines: [eff.slice(0, 2).join(', ') + ',', eff.slice(2).join(', ')] }
  ];
};
function slotSvg(p: Place, x: number): string {
  const b = { x, y: SLOT.y, w: SLOT.w, h: SLOT.h }, m = SLOT.rim, out = [frame(`slot-${p.key}`, b, m, 2.2, `url(#${ID}well)`)];
  const cx = x + SLOT.w / 2, cy = SLOT.y + SLOT.h / 2;
  out.push(`<rect x="${r(cx - 31.5)}" y="${r(cy - 44)}" width="63" height="88" rx="3" fill="none" stroke="${LOOK.paperLine}" stroke-opacity=".5" stroke-width=".25" stroke-dasharray="1.6 1.1"/>`);
  out.push(ico(p.icon, cx, cy, 34, `slot-${p.key}-icon`, 0.55));
  for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    const X = dx ? b.x + b.w : b.x, Y = dy ? b.y + b.h : b.y, sx = dx ? -1 : 1, sy = dy ? -1 : 1, a = 6.5;
    out.push(`<path d="M${r(X)} ${r(Y)}h${r(sx * a)}L${r(X)} ${r(Y + sy * a)}Z" fill="url(#${ID}br)" stroke="${LOOK.brass[2]}" stroke-width=".25"/>`);
  }
  // the label over the nest: the name, then its rule
  const lb = { x, y: LABEL.y, w: SLOT.w, h: LABEL.h }, ts = 10.5, ls = 8.5, tO: TO2 = { font: 'Alegreya', w: 700, color: INKC, anchor: 'middle', in: `label-${p.key}` };
  out.push(slip(`label-${p.key}`, lb, 0.97));
  // the box of a line of text in the browser: 1.0 em above the baseline, 0.2 em under it
  const lh = pt(ls) * 1.22, block = pt(ts) * 1.2 + 0.5 + p.lines.length * lh, base = lb.y + (lb.h - block) / 2 + pt(ts);
  out.push(text(cx, base, p.title, ts, tO));
  p.lines.forEach((l, i) => out.push(text(cx, base + pt(ts) * 0.2 + 0.5 + i * lh + pt(ls), l, ls, { color: LOOK.soft, anchor: 'middle', in: `label-${p.key}` })));
  return out.join('');
}

// ---- the left column ----
/** the phase of the round: a brass rail with three berths, the steps beside them */
function phaseSvg(y: number): { svg: string; box: Rect } {
  const p = S.phase, b = { x: COL.x, y, w: COL.w, h: 14 + 3 * BERTH.size + 2 * (BERTH.pitch - BERTH.size) + 4.5 }, out = [slip('phase', b)];
  const hs = 10.5, ss = 8.5;
  out.push(text(b.x + 3.2, b.y + 7.4, p.title, hs, { font: 'Alegreya', w: 700, in: 'phase' }));
  out.push(text(b.x + b.w - 3.2, b.y + 7.4, p.sub, ss, { color: LOOK.soft, anchor: 'end', in: 'phase' }));
  const railX = b.x + 3.5, railW = BERTH.size + 3, y0 = b.y + 11.5, railH = 3 * BERTH.size + 2 * (BERTH.pitch - BERTH.size) + 3;
  out.push(shadow({ x: railX, y: y0, w: railW, h: railH }, 1.6, 0.3));
  out.push(`<rect data-plate="phase-rail" x="${r(railX)}" y="${r(y0)}" width="${r(railW)}" height="${r(railH)}" rx="1.6" fill="url(#${ID}br)" stroke="${LOOK.brass[2]}" stroke-width=".3"/>`);
  const colors = [SEA_INK, SIDE.pirates.ink, SIDE.company.ink];
  for (let i = 0; i < 3; i++) {
    const bx = railX + 1.5, by = y0 + 1.5 + i * BERTH.pitch, s = BERTH.size, m = BERTH.rim;
    out.push(`<rect x="${r(bx)}" y="${r(by)}" width="${s}" height="${s}" rx="1.6" fill="url(#${ID}brh)" stroke="${LOOK.brass[2]}" stroke-width=".25"/><rect x="${r(bx + m)}" y="${r(by + m)}" width="${r(s - 2 * m)}" height="${r(s - 2 * m)}" rx="1.1" fill="url(#${ID}well)" stroke="${LOOK.brass[2]}" stroke-width=".22"/>`);
    // an engraved arrow down the rail to the next berth
    if (i < 2) { const ax = bx + s / 2, a0 = by + s + 0.5, a1 = by + BERTH.pitch - 0.5; out.push(`<path d="M${r(ax)} ${r(a0)}V${r(a1 - 1)}M${r(ax - 1.2)} ${r(a1 - 1.5)}L${r(ax)} ${r(a1)}L${r(ax + 1.2)} ${r(a1 - 1.5)}" fill="none" stroke="#2a1a08" stroke-width=".42" stroke-linecap="round" stroke-linejoin="round"/>`); }
    // the step: a sign (waves / the side's flag) and the words
    const cy = by + s / 2, sx = railX + railW + 2.6, fs = 10.5;
    if (i === 0) out.push(`<g data-plate="phase-sign-${i}">${[-1.3, 0.3, 1.9].map(d => `<path d="M${r(sx)} ${r(cy + d)}q.85 -.75 1.7 0t1.7 0t1.7 0" fill="none" stroke="${SEA_INK}" stroke-width=".42" stroke-linecap="round"/>`).join('')}</g>`);
    else out.push(flag(i === 1 ? 'pirates' : 'company', sx + 0.4, cy + 3.6, 1, 7.6, `phase-sign-${i}`));
    out.push(text(sx + 7.2, cy + pt(fs) * 0.3, p.steps[i], fs, { font: 'Alegreya', w: 700, color: colors[i], in: 'phase' }));
  }
  return { svg: out.join(''), box: b };
}
/** a cartouche: a slip with flourishes at its corners */
function cartouche(pid: string, b: Rect): string {
  const c = LOOK.paperLine, curl = (x: number, y: number, sx: number, sy: number) => `<path d="M${r(x + sx * 1.6)} ${r(y + sy * 5.5)}C${r(x + sx * 1.6)} ${r(y + sy * 2.6)} ${r(x + sx * 2.6)} ${r(y + sy * 1.6)} ${r(x + sx * 5.5)} ${r(y + sy * 1.6)}M${r(x + sx * 2.9)} ${r(y + sy * 2.9)}m${r(sx * -0.7)} 0a.7 .7 0 1 0 ${r(sx * 1.4)} 0a.7 .7 0 1 0 ${r(sx * -1.4)} 0" fill="none" stroke="${c}" stroke-width=".3" stroke-opacity=".75"/>`;
  return slip(pid, b, 0.96) + curl(b.x, b.y, 1, 1) + curl(b.x + b.w, b.y, -1, 1) + curl(b.x, b.y + b.h, 1, -1) + curl(b.x + b.w, b.y + b.h, -1, -1);
}

export const SCHEME_CSS = `
.sc{position:absolute;inset:0}
.sc-svg{position:absolute;left:0;top:0;width:297mm;height:210mm}
.sc-abs{position:absolute}
.sc-lead{font:italic 500 9.5pt/1.22 Alegreya,serif;color:#3f2f1c}
.sc-joint{font:500 9pt/1.2 'Alegreya Sans',sans-serif;color:${INKC}}
.sc-joint b{font:700 9.5pt/1.2 Alegreya,serif;display:block}
.sc-long{font:italic 500 9.2pt/1.24 Alegreya,serif;color:#2c2016;text-wrap:pretty;hyphens:manual}
.sc-long-h{font:800 10pt/1.2 'Alegreya SC',serif;letter-spacing:.06em;color:${INKC};text-align:center;font-style:normal;margin-bottom:.8mm}
`;
/** heights of HTML blocks at their widths, measured in the browser (mm) */
async function heights(ctx: Ctx, blocks: { html: string; w: number }[]): Promise<number[]> {
  const page = await ctx.browser.newPage();
  try {
    await page.setContent(`<!doctype html><meta charset="utf-8"><style>${fontCss()}body{font-variant-numeric:lining-nums}${SCHEME_CSS}</style>${blocks.map((b, i) => `<div id="b${i}" class="sc-abs" style="left:0;top:0;width:${b.w}mm">${b.html}</div>`).join('')}`);
    await page.evaluate(async () => { await document.fonts.ready; });
    return await page.evaluate((n: number) => Array.from({ length: n }, (_, i) => document.getElementById('b' + i)!.getBoundingClientRect().height * 25.4 / 96), blocks.length);
  } finally { await page.close(); }
}

/** the page: the chart, then the plates over it */
async function schemePage(ctx: Ctx): Promise<string> {
  // the widths of the single lines come from the browser: a dry run collects them
  battleSvg(); places().forEach((p, i) => slotSvg(p, SLOT.xs[i])); phaseSvg(0); W(S.title, 22, { font: 'Alegreya SC', w: 800 }); W(S.tag, 9, { font: 'Alegreya SC', w: 700, ls: '.08em' });
  await measureMissing(ctx);
  const pad = 3.2, tw = COL.w - 2 * pad;
  const lead = `<div class="sc-lead">${esc(S.lead)}</div>`;
  const joint = `<div class="sc-joint"><b>${esc(S.joint[0])}</b>${S.joint.slice(1).map(l => `<div>${esc(l)}</div>`).join('')}</div>`;
  const longText = fill(S.long.text, { cards: S.long.cards.map(cardName).join(', ') });
  const long = `<div class="sc-long"><div class="sc-long-h">${esc(S.long.title)}</div>${esc(longText)}</div>`;
  const jointW = tw - 12, longW = tw - 3;
  const [hLead, hJoint, hLong] = await heights(ctx, [{ html: lead, w: tw }, { html: joint, w: jointW }, { html: long, w: longW }]);

  const svg: string[] = [], html: string[] = [], calm: Rect[] = [];
  // the title slip: «Схема боя», the tag, the lead
  const tb = { x: COL.x, y: COL.top, w: COL.w, h: 12.4 + hLead + 2.6 };
  svg.push(cartouche('title', tb));
  svg.push(text(tb.x + pad, tb.y + 9.6, S.title, 22, { font: 'Alegreya SC', w: 800, in: 'title' }));
  svg.push(text(tb.x + tb.w - pad, tb.y + 9.2, S.tag, 9, { font: 'Alegreya SC', w: 700, ls: '.08em', color: '#7a5a22', anchor: 'end', in: 'title' }));
  html.push(`<div class="sc-abs" data-in="title" data-name="подзаголовок" style="left:${r(tb.x + pad)}mm;top:${r(tb.y + 12.2)}mm;width:${r(tw)}mm">${lead}</div>`);
  calm.push(tb);
  // the phase rail
  const ph = phaseSvg(tb.y + tb.h + 4.5);
  svg.push(ph.svg); calm.push(ph.box);
  // the joint volley
  const jb = { x: COL.x, y: ph.box.y + ph.box.h + 4.5, w: COL.w, h: hJoint + 2 * 2.8 };
  svg.push(slip('joint', jb));
  svg.push(ico('guns', jb.x + 6.8, jb.y + jb.h / 2, 8.4, 'joint-icon'));
  html.push(`<div class="sc-abs" data-in="joint" data-name="совместный залп" style="left:${r(jb.x + pad + 9)}mm;top:${r(jb.y + 2.8)}mm;width:${r(jointW)}mm">${joint}</div>`);
  calm.push(jb);
  // the lasting effects: the captain's entry in a cartouche, its foot on the line of the card nests' foot
  const lb = { x: COL.x, y: 0, w: COL.w, h: hLong + 2 * 4 };
  lb.y = COL.bottom - lb.h;
  if (lb.y < jb.y + jb.h + 4) console.warn(`warning: 04b: the lasting effects (${r(lb.h)} mm) crowd the joint volley`);
  svg.push(cartouche('long', lb));
  html.push(`<div class="sc-abs" data-in="long" data-name="долгие эффекты" style="left:${r(lb.x + (COL.w - longW) / 2)}mm;top:${r(lb.y + 4)}mm;width:${r(longW)}mm">${long}</div>`);
  calm.push(lb);
  // the battle and the card nests
  const bt = battleSvg();
  svg.push(bt.svg); calm.push(...bt.plates);
  places().forEach((p, i) => { svg.push(slotSvg(p, SLOT.xs[i])); calm.push({ x: SLOT.xs[i], y: LABEL.y, w: SLOT.w, h: SLOT.y + SLOT.h - LABEL.y }); });

  // the chart under it all: calmed under the plates, its lettering off them and off the battle's courses
  const flags: Rect[] = [];
  for (const side of ['company', 'pirates'] as Side[]) for (const i of [0, 1]) flags.push({ x: i === 0 ? NX[0] - 11 : NX[1] + NEST.size, y: NY[side], w: 11, h: 16 });
  const courses = { x: NX[0], y: NY.company, w: NX[1] + NEST.size - NX[0], h: NY.pirates + NEST.size - NY.company };
  const chart = chartSvg({
    style: 'plain', w: PAGE.w, h: PAGE.h, center: [0, 0], mmPerDeg: VIEW.mmPerDeg, anchor: VIEW.anchor, inset: VIEW.inset, seed: 11,
    calm, avoid: [...flags, courses],
    roses: [{ x: 100, y: 24, r: 11 }],
    ships: [{ x: 132, y: 30, s: 0.6 }]
  });
  const jpg = await rasterJpeg(ctx.browser, 'scheme-chart', chart, PAGE.w, PAGE.h, ctx.opts.draft ? 150 : 240);
  return `<div class="sc"><svg class="sc-svg" viewBox="0 0 ${PAGE.w} ${PAGE.h}">${defs()}<image href="${jpg.url}" x="0" y="0" width="${PAGE.w}" height="${PAGE.h}" preserveAspectRatio="none"/>${svg.join('\n')}</svg>\n${html.join('\n')}</div>`;
}

export async function schemePart(ctx: Ctx): Promise<Part> {
  return { file: SCHEME_FILE, title: S.partTitle, css: SCHEME_CSS, pages: [{ html: await schemePage(ctx), land: true }] };
}
