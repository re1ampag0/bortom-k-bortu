// «Индевор» — the material of its board: the East India Company. A: the ship's own side, every track lying on the part
// of the ship it counts, a thin ledger rule along its label line (Sails on the main course, Crew on the
// bulwark at the rail, Guns along the upper row of open ports, Hull on the black strake of planking), the cells set into
// that part (canvas, the rail, ports red inside, planks with treenails); a navy morocco binding with gilt fillets round
// it, a red wax seal with the Company's bale mark in the header, brass dividers and a compass card in the column's foot.
// The back: the Endeavour on the sea floor, the Company's strongbox spilling its gold beside her. B: the captain's table —
// the Company's chart (grid, rhumb lines, a coast, a compass rose, dividers) under the tracks, every track on a brass
// rule; the ship an engraving in blue ink in a navy frame; the right column a ruled ledger, the abilities the Company's
// charter with its seal, the Legend and Powder notes pinned on it; a sextant, a parallel rule and the seal at its foot.
// See the interface at the top of frame.ts.
import { ENGRAVING, type Geo, type Layers, type Pal, type Rect, type RowGeo, type ShipMaterial, type TrackKey, type WreckGeo } from './frame';
import { compass, engraving, rng, rope, sheet } from './paint';

const r = (n: number) => Math.round(n * 100) / 100;
type Fn = (u: string, L: unknown, o: Record<string, unknown>) => string;

/** the Company's colours */
const C = {
  navy: '#172a47', navyDeep: '#0b1628', navyLine: '#2c4570', ribbon: '#23477c', ribbonDark: '#12284a',
  gilt: '#c9a04a', giltLight: '#efd690', giltDark: '#6e5018',
  paper: '#fbf5e2', rule: '#8ea6c9', red: '#c0574b',
  ochre: '#c49536', ochreDark: '#7e5a1a', tar: '#2b2a2f', tarSeam: '#101014', tarLight: '#46444b',
  canvas: '#ece0c0', canvasSeam: '#c7b386', port: '#14110f', portRed: '#a8342a',
  wax: '#9b2620', waxDark: '#5c110c', waxLight: '#cf6457'
};
const PALETTE = (base: Pal): Pal => ({ ...base, deep: '#1d3a66', field: '#fcf7e8', fieldLine: '#9fb2cf', soft: '#3d2f1f' });

const rowOf = (g: Geo, k: TrackKey) => g.rows.find(rw => rw.key === k)!;
const rect = (b: Rect, fill: string, extra = '') => `<rect x="${r(b.x)}" y="${r(b.y)}" width="${r(b.w)}" height="${r(b.h)}" fill="${fill}"${extra}/>`;

// ---- the picture: the Endeavour's side, the rail at the Crew row, her upper ports along the Guns row ----
async function sideView(g: Geo): Promise<string> {
  const P = g.zones.picture, K = g.kit, kind = g.kind, k = 0.7, FOCUS = 6;   // FOCUS: the mainmast a little left of the picture's middle
  const crew = rowOf(g, 'crew'), guns = rowOf(g, 'guns'), PORT = Math.max(...(K.SHIP_SPECS[kind]?.ports ?? [{ h: 14 }]).map(p => p.h));
  const railH = -K.shipGeom(kind, { x: 0, y: 0, scale: 1 }).nearRail(FOCUS)[1];
  // the rail runs through the Crew cells, the upper row of ports through the Guns cells → the scale; the Hull row falls
  // on the black strake under the middle row of ports and the waterline lies below the picture
  const railY = crew.cy - 0.4, sMM = (guns.cy - railY) / (railH - PORT), wl = guns.cy + PORT * sMM;
  const b = Math.ceil(Math.max(0, (P.w / k - 200) / 2, (P.h / k - 280) / 2)) + 2, W = 200 + 2 * b, H = 280 + 2 * b;
  const toU = (mmX: number, mmY: number) => [(mmX - P.x) / k - b, (mmY - P.y) / k - b];
  const [sx, sy] = toU(P.x + P.w / 2 - FOCUS * sMM, wl);
  const L = K.makeLight(K.LIGHTS.endeavour, { horizon: sy - 30 });
  const shipSvg = K.ship('bo2' + kind, L, { kind, x: sx, y: sy, scale: sMM / k, sails: 'full', heel: 0, seed: 11, detail: 'near' });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-b} ${-b} ${W} ${H}"><defs><linearGradient id="bo2isky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fbfd8"/><stop offset=".55" stop-color="#cddbe2"/><stop offset="1" stop-color="#efe8d2"/></linearGradient><linearGradient id="bo2isea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f7d98"/><stop offset="1" stop-color="#1c3a52"/></linearGradient></defs><rect x="${-b}" y="${-b}" width="${W}" height="${H}" fill="url(#bo2isky)"/><rect x="${-b}" y="${r(sy)}" width="${W}" height="${r(H - sy - b)}" fill="url(#bo2isea)"/>${shipSvg}</svg>`;
  const url = await g.art(`board-close-${kind}`, svg, b), id = `${g.uid}pc`;
  return `<defs><clipPath id="${id}"><rect x="${r(P.x)}" y="${r(P.y)}" width="${r(P.w)}" height="${r(P.h)}" rx="2.2"/></clipPath></defs><g clip-path="url(#${id})"><image href="${url}" x="${r(P.x)}" y="${r(P.y)}" width="${r(W * k)}" height="${r(H * k)}" preserveAspectRatio="none"/></g>` +
    `<rect x="${r(P.x - 0.55)}" y="${r(P.y - 0.55)}" width="${r(P.w + 1.1)}" height="${r(P.h + 1.1)}" rx="2.6" fill="none" stroke="${C.gilt}" stroke-width=".35"/>`;
}

// ---- the ledger: one thin blue rule along each label line, as in the Company's books; the frame's plates hug the words
// on it, the ship shows round them ----
function ledgerRule(rw: RowGeo): string {
  const y = rw.labelY + 1, x0 = rw.x0 - 1.2, x1 = rw.band.x + rw.band.w + 1.2;
  return `<line x1="${r(x0)}" y1="${r(y)}" x2="${r(x1)}" y2="${r(y)}" stroke="${C.rule}" stroke-width=".3"/>` +
    [x0 - 0.3, x0 + 0.15].map(x => `<line x1="${r(x)}" y1="${r(rw.top - 1)}" x2="${r(x)}" y2="${r(y + 0.6)}" stroke="${C.red}" stroke-width=".22"/>`).join('');
}

/** the strip of the ship's part the cells are set into; seen in the gaps between the cells and round their ends */
function partStrip(g: Geo, rw: RowGeo): string {
  const c0 = rw.cells[0], cl = rw.cells[rw.cells.length - 1], volley = rw.key === 'guns' ? g.slots.filter(s => s.kind === 'volley' || s.kind === 'volley2') : [];
  const xEnd = (volley.length ? volley[volley.length - 1].x + volley[volley.length - 1].w : cl.x + cl.w) + 1.4;
  const below = rw.key === 'hull' ? 1.3 : 0.65, S: Rect = { x: c0.x - 1.4, y: c0.y + 0.2, w: xEnd - c0.x + 1.4, h: c0.h - 0.2 + below };
  const R = rng(rw.cells.length * 31 + rw.top), out: string[] = [], id = `${g.uid}ps${rw.key}`;
  const holes = [...rw.cells, ...volley];
  if (rw.key === 'sails') {
    // the main course: cloths of canvas, their seams, the bolt rope along the foot and reef points hanging in the gaps
    out.push(rect(S, C.canvas, ' rx="1"'));
    let d = ''; for (let x = S.x + 1.2; x < S.x + S.w; x += 2.4) d += `M${r(x)} ${r(S.y)}V${r(S.y + S.h)}`;
    out.push(`<path d="${d}" stroke="${C.canvasSeam}" stroke-width=".2"/>`);
    for (const c of rw.cells.slice(1)) out.push(`<path d="M${r(c.x - 0.75)} ${r(c.y + 2.5)}q.5 2 -.2 4.2" fill="none" stroke="#8b7650" stroke-width=".35" stroke-linecap="round"/>`);
    out.push(rope(S.x + 0.5, S.y + S.h - 0.35, S.x + S.w - 0.5, S.y + S.h - 0.35, { color: '#cdb37a', dark: '#7d6a44', w: 0.75 }));
  } else if (rw.key === 'crew') {
    // the bulwark: black, an ochre moulding, the oak rail cap through the cells' middle (the rail of the picture)
    out.push(rect(S, C.tar, ' rx="1"'));
    out.push(rect({ x: S.x, y: rw.cy - 0.9, w: S.w, h: 1.8 }, '#6b4a2a') + rect({ x: S.x, y: rw.cy - 0.9, w: S.w, h: 0.45 }, '#9a7046'));
    out.push(rect({ x: S.x, y: rw.cy + 3.6, w: S.w, h: 1.2 }, C.ochre));
    for (const c of rw.cells.slice(1)) out.push(`<circle cx="${r(c.x - 0.75)}" cy="${r(rw.cy - 3.8)}" r=".42" fill="${C.gilt}"/>`);
  } else if (rw.key === 'guns') {
    // the ochre band of the upper gun deck: planks, every cell in an open port — black inside, the lid's red reveal
    out.push(rect(S, C.ochre, ' rx="1"'));
    let d = ''; for (let y = S.y + 2.6; y < S.y + S.h; y += 2.9) d += `M${r(S.x)} ${r(y)}H${r(S.x + S.w)}`;
    out.push(`<path d="${d}" stroke="${C.ochreDark}" stroke-width=".18" stroke-opacity=".7"/>`);
    for (const c of holes) out.push(`<rect x="${r(c.x - 0.55)}" y="${r(c.y - 0.2)}" width="${r(c.w + 1.1)}" height="${r(c.h + 0.85)}" rx="2.3" fill="${C.port}"/><rect x="${r(c.x - 0.22)}" y="${r(c.y + 0.1)}" width="${r(c.w + 0.44)}" height="${r(c.h + 0.3)}" rx="2.1" fill="none" stroke="${C.portRed}" stroke-width=".38"/>`);
  } else {
    // the black strake: tarred planks, a butt joint in every gap with two treenails, a seam along the middle
    out.push(rect(S, C.tar, ' rx="1"'));
    out.push(`<path d="M${r(S.x)} ${r(rw.cy)}H${r(S.x + S.w)}" stroke="${C.tarSeam}" stroke-width=".3"/><path d="M${r(S.x)} ${r(rw.cy + 0.35)}H${r(S.x + S.w)}" stroke="${C.tarLight}" stroke-width=".2"/>`);
    for (const c of rw.cells.slice(1)) {
      const x = c.x - 0.75, up = R() < 0.5;
      out.push(`<line x1="${r(x)}" y1="${r(up ? S.y : rw.cy)}" x2="${r(x)}" y2="${r(up ? rw.cy : S.y + S.h)}" stroke="${C.tarSeam}" stroke-width=".3"/>`);
      for (const ty of [c.y + 2.6, rw.cy - 1.8, rw.cy + 2.4, c.y + c.h - 1.6]) out.push(`<circle cx="${r(x)}" cy="${r(ty)}" r=".34" fill="#8a7a5c"/>`);
    }
    out.push(rect({ x: S.x, y: S.y + S.h - 0.5, w: S.w, h: 0.5 }, C.ochre));
  }
  return `<defs><clipPath id="${id}"><rect x="${r(S.x)}" y="${r(S.y)}" width="${r(S.w)}" height="${r(S.h)}" rx="1"/></clipPath></defs><g clip-path="url(#${id})">${out.join('')}</g>`;
}

/** past the «Залп дан» cell the row of open ports goes on to the slip's end: two guns run out, lids hauled up */
function portsOn(g: Geo, rw: RowGeo): string {
  const v = g.slots.filter(s => s.kind === 'volley' || s.kind === 'volley2'), last = v.length ? v[v.length - 1] : rw.cells[rw.cells.length - 1];
  const x0 = last.x + last.w + 3, x1 = rw.band.x + rw.band.w, y = rw.cells[0].y, out: string[] = [];
  if (x1 - x0 < 14) return '';
  const n = Math.floor((x1 - x0) / 14), step = (x1 - x0) / n;
  out.push(`<rect x="${r(x0 - 1.4)}" y="${r(y + 0.2)}" width="${r(x1 - x0 + 2.8)}" height="${r(13.45)}" rx="1" fill="${C.ochre}"/>`);
  for (let i = 0; i < n; i++) {
    const cx = x0 + step * (i + 0.5), pw = 9, ph = 7.6, py = y + 5;
    out.push(`<rect x="${r(cx - pw / 2 - 0.6)}" y="${r(py - 0.5)}" width="${r(pw + 1.2)}" height="${r(ph + 1)}" rx=".5" fill="${C.ochreDark}"/>`);
    out.push(`<rect x="${r(cx - pw / 2)}" y="${r(py)}" width="${pw}" height="${ph}" fill="${C.port}"/>`);
    // the lid hauled up: red inside, its edge black
    out.push(`<path d="M${r(cx - pw / 2 - 0.3)} ${r(py - 0.6)}L${r(cx - pw / 2 + 0.6)} ${r(y + 0.9)}H${r(cx + pw / 2 - 0.6)}L${r(cx + pw / 2 + 0.3)} ${r(py - 0.6)}Z" fill="${C.portRed}" stroke="${C.port}" stroke-width=".35"/>`);
    // the muzzle: the swell, the bore, a glint
    out.push(`<circle cx="${r(cx)}" cy="${r(py + ph * 0.55)}" r="2.7" fill="#3c3f45" stroke="#0c0c0e" stroke-width=".3"/><circle cx="${r(cx)}" cy="${r(py + ph * 0.55)}" r="1.3" fill="#060607"/><path d="M${r(cx - 2)} ${r(py + ph * 0.55 - 1)}a2.3 2.3 0 0 1 1.6 -1.5" fill="none" stroke="#9aa3ad" stroke-width=".35" stroke-linecap="round"/>`);
  }
  return out.join('');
}

/** the fires lie on the deck: pine planks round the field of the Fires, its coaming dark */
function deckUnder(g: Geo): string {
  const f = g.boxes[0], m = 2.2, b = { x: f.x - m, y: f.y - m, w: f.w + 2 * m, h: f.h + 2 * m }, id = `${g.uid}dk`;
  let d = ''; for (let y = b.y + 1.5; y < b.y + b.h; y += 3) d += `M${r(b.x)} ${r(y)}H${r(b.x + b.w)}`;
  const R = rng(17); let butts = '';
  for (let y = b.y + 1.5; y < b.y + b.h - 1; y += 3) { const x = b.x + 4 + R() * 30; butts += `M${r(x)} ${r(y)}v3M${r(x + 38 + R() * 10)} ${r(y)}v3`; }
  return `<defs><clipPath id="${id}"><rect x="${r(b.x)}" y="${r(b.y)}" width="${r(b.w)}" height="${r(b.h)}" rx="1.4"/></clipPath></defs><rect x="${r(b.x + 0.7)}" y="${r(b.y + 0.8)}" width="${r(b.w)}" height="${r(b.h)}" rx="1.4" fill="${C.navyDeep}" fill-opacity=".42"/>` +
    `<g clip-path="url(#${id})">${rect(b, '#bf9a64')}<path d="${d}" stroke="#7a5a32" stroke-width=".28"/><path d="${butts}" stroke="#7a5a32" stroke-width=".25"/></g><rect x="${r(b.x)}" y="${r(b.y)}" width="${r(b.w)}" height="${r(b.h)}" rx="1.4" fill="none" stroke="#3a2614" stroke-width=".5"/>`;
}

// ---- brass and wax ----
/** the Company's bale mark: a heart quartered by a cross, the staff with the «sign of four» on top */
const baleMark = (cx: number, cy: number, s: number, color: string, w: number) =>
  `<path transform="translate(${r(cx)} ${r(cy)}) scale(${s})" d="M0 4.2C-3.4 1.6 -4.4 -.2 -4.4 -1.6a2.2 2.2 0 0 1 4.4 -.6a2.2 2.2 0 0 1 4.4 .6C4.4 -.2 3.4 1.6 0 4.2ZM0 -2.2V4.2M-4.2 .2H4.2M0 -2.2V-6.6M0 -6.6L2.2 -4.6H-1" fill="none" stroke="${color}" stroke-width="${r(w / s)}" stroke-linejoin="round" stroke-linecap="round"/>`;
function waxSeal(cx: number, cy: number, R0: number, seed: number, ribbon = true): string {
  const R = rng(seed), n = 16, pts: string[] = [];
  for (let i = 0; i < n; i++) { const a = i / n * 2 * Math.PI, rr = R0 * (1 + 0.07 * Math.sin(3 * a + seed) + (R() - 0.5) * 0.08); pts.push(`${r(cx + Math.cos(a) * rr)} ${r(cy + Math.sin(a) * rr)}`); }
  const blob = `M${pts.join('L')}Z`, out: string[] = [];
  if (ribbon) for (const s of [-1, 1]) {
    const x1 = cx + s * R0 * 0.35, x2 = cx + s * R0 * 1.15, y2 = cy + R0 * 1.75;
    out.push(`<path d="M${r(x1 - 1.6)} ${r(cy)}L${r(x2 - 1.5)} ${r(y2)}L${r(x2 + s * 0.2)} ${r(y2 - 1.1)}L${r(x2 + 1.5)} ${r(y2 + 0.2)}L${r(x1 + 1.6)} ${r(cy)}Z" fill="${s < 0 ? C.ribbon : C.ribbonDark}" stroke="${C.navyDeep}" stroke-width=".25" stroke-linejoin="round"/>`);
  }
  out.push(`<path d="${blob}" fill="${C.waxDark}" transform="translate(.45 .55)" opacity=".55"/><path d="${blob}" fill="${C.wax}" stroke="${C.waxDark}" stroke-width=".35" stroke-linejoin="round"/>`);
  out.push(`<circle cx="${r(cx)}" cy="${r(cy)}" r="${r(R0 * 0.7)}" fill="#86201a" stroke="${C.waxLight}" stroke-width=".3"/><circle cx="${r(cx)}" cy="${r(cy)}" r="${r(R0 * 0.6)}" fill="none" stroke="${C.waxLight}" stroke-width=".22" stroke-dasharray=".35 .4"/>`);
  out.push(baleMark(cx + 0.18, cy + 0.6 + 0.2, R0 * 0.085, C.waxDark, 0.5) + baleMark(cx, cy + 0.6, R0 * 0.085, C.waxLight, 0.42));
  out.push(`<path d="M${r(cx - R0 * 0.78)} ${r(cy - R0 * 0.3)}A${r(R0 * 0.85)} ${r(R0 * 0.85)} 0 0 1 ${r(cx - R0 * 0.1)} ${r(cy - R0 * 0.84)}" fill="none" stroke="#e59a8f" stroke-width=".35" stroke-opacity=".7" stroke-linecap="round"/>`);
  return out.join('');
}
/** brass dividers lying open: two tapered legs from a round joint, steel points */
function dividers(hx: number, hy: number, a1: number, a2: number, len: number, id: string): string {
  const leg = (a: number) => {
    const ux = Math.cos(a), uy = Math.sin(a), px = -uy, py = ux, tx = hx + ux * len, ty = hy + uy * len, sx = hx + ux * len * 0.82, sy = hy + uy * len * 0.82;
    return `<path d="M${r(hx + px * 1.3)} ${r(hy + py * 1.3)}L${r(sx + px * 0.55)} ${r(sy + py * 0.55)}L${r(sx - px * 0.55)} ${r(sy - py * 0.55)}L${r(hx - px * 1.3)} ${r(hy - py * 1.3)}Z" fill="url(#${id})" stroke="${C.giltDark}" stroke-width=".25"/>` +
      `<path d="M${r(sx + px * 0.5)} ${r(sy + py * 0.5)}L${r(tx)} ${r(ty)}L${r(sx - px * 0.5)} ${r(sy - py * 0.5)}Z" fill="#b9c0c7" stroke="#4a5058" stroke-width=".2"/>`;
  };
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.giltLight}"/><stop offset=".5" stop-color="${C.gilt}"/><stop offset="1" stop-color="${C.giltDark}"/></linearGradient></defs>` +
    `<g transform="translate(.5 .6)" opacity=".5">${leg(a1).replace(/fill="[^"]*"/g, `fill="${C.navyDeep}"`)}${leg(a2).replace(/fill="[^"]*"/g, `fill="${C.navyDeep}"`)}</g>` +
    leg(a1) + leg(a2) + `<circle cx="${r(hx)}" cy="${r(hy)}" r="2.3" fill="url(#${id})" stroke="${C.giltDark}" stroke-width=".3"/><circle cx="${r(hx)}" cy="${r(hy)}" r=".8" fill="${C.giltDark}"/><line x1="${r(hx - 0.6)}" y1="${r(hy)}" x2="${r(hx + 0.6)}" y2="${r(hy)}" stroke="${C.giltLight}" stroke-width=".25"/>`;
}
/** a brass compass card in its bowl */
function brassCompass(cx: number, cy: number, R0: number, id: string): string {
  return `<defs><radialGradient id="${id}" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="${C.giltLight}"/><stop offset=".55" stop-color="${C.gilt}"/><stop offset="1" stop-color="${C.giltDark}"/></radialGradient></defs>` +
    `<circle cx="${r(cx + 0.6)}" cy="${r(cy + 0.7)}" r="${r(R0)}" fill="${C.navyDeep}" opacity=".5"/><circle cx="${r(cx)}" cy="${r(cy)}" r="${r(R0)}" fill="url(#${id})" stroke="${C.giltDark}" stroke-width=".35"/>` +
    compass(cx, cy, R0 * 0.8, { line: '#5c4214', fill: '#f3e6c0', accent: C.wax });
}
/** a gilt corner tool of the binding */
const corner = (x: number, y: number, sx: number, sy: number) =>
  `<g transform="translate(${r(x)} ${r(y)}) scale(${sx} ${sy})" fill="none" stroke="${C.gilt}" stroke-width=".3"><path d="M0 0H12M0 0V-5.2M1.2 -1.2H9M1.2 -1.2V-4"/><path d="M12 0q2.2 -1.6 3.6 0q-1.4 1.6 -3.6 0Z" fill="${C.gilt}"/><circle cx="4.6" cy="-3" r=".55" fill="${C.gilt}"/><path d="M6.2 -3q1.6 -1.6 3.4 -.4" stroke-linecap="round"/></g>`;

/** the navy morocco of the binding: the ground, a fine grain, gilt hairlines */
function binding(g: Geo): string {
  const id = `${g.uid}gr`;
  return sheet(g, { band: C.navyDeep, line: C.gilt, ground: C.navy, hair: C.gilt, w: 1.4 }) +
    `<defs><pattern id="${id}" patternUnits="userSpaceOnUse" width="1.3" height="1.3"><path d="M0 1.3L1.3 0" stroke="#ffffff" stroke-opacity=".05" stroke-width=".22"/></pattern></defs><rect x="9.6" y="9.6" width="${r(g.page.w - 19.2)}" height="${r(g.page.h - 19.2)}" rx="2.4" fill="url(#${id})"/>`;
}

async function faceA(g: Geo): Promise<Layers> {
  const col = g.zones.col, guns = rowOf(g, 'guns'), hx = col.x + 18, hy = col.y + col.h - 19;
  const under = [
    binding(g),
    await sideView(g),
    ...g.rows.map(ledgerRule),
    ...g.rows.map(rw => partStrip(g, rw)),
    portsOn(g, guns),
    deckUnder(g),
    // the column's foot: the dividers and the compass card (the column's boxes cover them if they ever grow down to here)
    dividers(hx, hy, Math.PI * 0.2, Math.PI * 0.52, 18, `${g.uid}dv`),
    brassCompass(col.x + col.w - 11, col.y + col.h - 10.5, 9, `${g.uid}cp`),
    corner(12.6, 195.6, 1, 1), corner(g.page.w - 12.6, 195.6, -1, 1)
  ].join('');
  // over: the wax seal in the header's free middle, a red double rule under the header like a ledger's head
  const h = g.zones.header, over = `<path d="M${r(h.x + 21)} ${r(h.y + h.h - 1.2)}H${r(h.x + h.w - 1.5)}M${r(h.x + 21)} ${r(h.y + h.h - 0.7)}H${r(h.x + h.w - 1.5)}" stroke="${C.red}" stroke-width=".2"/>` +
    waxSeal(h.x + h.w * 0.66, h.y + h.h / 2 - 1.2, 6.4, 7);
  const s = g.scope, margin = `linear-gradient(90deg,transparent 1mm,${C.red} 1mm,${C.red} 1.2mm,transparent 1.2mm,transparent 1.5mm,${C.red} 1.5mm,${C.red} 1.7mm,transparent 1.7mm)`;
  const css = `${s} .bo2-col .bo2-box{background:${margin},var(--f);outline:.3mm solid ${C.gilt};outline-offset:.5mm;box-shadow:none}` +
    `${s} .bo2-col .bo2-legend{background:${margin},#fcf1d2}`;
  return { under, over, css };
}

// ---- the back: the Endeavour on the sea floor, the Company's strongbox spilling its gold beside her ----
async function wreckB(w: WreckGeo): Promise<Layers> {
  const A = w.zones.art, kind = w.kind, K = w.kit, k = 0.9, b = Math.ceil(Math.max(0, (A.w / k - 200) / 2)) + 1, box = K.shipBox(kind, { x: 0, y: 0, scale: 1 });
  const W = 200 + 2 * b, H = 280 + 2 * b, vh = A.h / k, floor = -b + vh * 0.85, s = 0.66 * (A.w / k) / box.w;
  const L = K.makeLight({ ...(K.LIGHTS.endeavour as Record<string, unknown>), haze: 0.55 }, { horizon: -b + 10 });
  const body = K.ship('bo2w' + kind, L, { kind, x: -b + W * 0.6, y: floor + 10, scale: s, sails: 'furled', heel: 14, seed: 23 });
  const Rr = rng(5);
  let sand = '', rays = '', bubbles = '';
  for (let i = 0; i < 70; i++) sand += `<ellipse cx="${r(-b + Rr() * W)}" cy="${r(floor + 4 + Rr() * 34)}" rx="${r(2 + Rr() * 7)}" ry="${r(0.4 + Rr())}" fill="#5c4e34" fill-opacity=".35"/>`;
  for (let i = 0; i < 6; i++) { const x = -b + W * (0.08 + i * 0.17 + Rr() * 0.05), wd = 8 + Rr() * 14; rays += `<path d="M${r(x)} ${-b}h${r(wd)}l${r(28 + Rr() * 20)} ${r(vh)}h${r(-wd * 2.4)}Z" fill="#dcefff" fill-opacity="${r(0.05 + Rr() * 0.05)}"/>`; }
  for (let i = 0; i < 24; i++) bubbles += `<circle cx="${r(-b + W * 0.62 + (Rr() - 0.5) * 30)}" cy="${r(floor - 20 - Rr() * 120)}" r="${r(0.4 + Rr() * 1.1)}" fill="none" stroke="#cfe6f2" stroke-opacity=".45" stroke-width=".35"/>`;
  const P = (n: string) => K[n] as Fn;
  // the props lie on the sand: the strongbox open with gold, coins strewn, a gun off its carriage, the anchor
  const props = P('anchor')('bo2wa', L, { x: -b + W * 0.86, y: floor + 15, s: 1.1, rot: 64, seed: 4 }) +
    P('cannon')('bo2wc', L, { x: -b + W * 0.3, y: floor + 17, s: 1.05, carriage: false, rot: -7, seed: 6 }) +
    P('chest')('bo2wx', L, { x: -b + W * 0.1, y: floor + 16, s: 1.25, open: 0.75, gold: true, seed: 8 }) +
    P('coins')('bo2wk', L, { x: -b + W * 0.19, y: floor + 22, s: 1.2, n: 11, seed: 9 });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-b} ${-b} ${W} ${H}"><defs><linearGradient id="bo2iwat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f6b84"/><stop offset=".55" stop-color="#1d3a55"/><stop offset="1" stop-color="#0c1a2c"/></linearGradient></defs>` +
    `<rect x="${-b}" y="${-b}" width="${W}" height="${H}" fill="url(#bo2iwat)"/>${rays}${body}<path d="M${-b} ${r(floor + 4)}q${r(W / 4)} -6 ${r(W / 2)} -1t${r(W / 2)} 2V${H}H${-b}Z" fill="#9c8a62"/>${sand}${props}${bubbles}` +
    `<rect x="${-b}" y="${-b}" width="${W}" height="${H}" fill="#0f2238" fill-opacity=".3"/></svg>`;
  const url = await w.art(`board-wreck-${kind}`, svg, b), id = `${w.uid}wa`;
  const under = `<defs><clipPath id="${id}"><rect x="${r(A.x)}" y="${r(A.y)}" width="${r(A.w)}" height="${r(A.h)}" rx="2.4"/></clipPath></defs><g clip-path="url(#${id})"><image href="${url}" x="${r(A.x)}" y="${r(A.y)}" width="${r(W * k)}" height="${r(H * k)}" preserveAspectRatio="none"/></g>` +
    `<rect x="${r(A.x - 0.5)}" y="${r(A.y - 0.5)}" width="${r(A.w + 1)}" height="${r(A.h + 1)}" rx="2.8" fill="none" stroke="${C.navyDeep}" stroke-width="1"/><rect x="${r(A.x + 0.9)}" y="${r(A.y + 0.9)}" width="${r(A.w - 1.8)}" height="${r(A.h - 1.8)}" rx="1.8" fill="none" stroke="${C.gilt}" stroke-width=".3"/>`;
  // the Company's seal on the loss: pressed beside the title, on the dark water
  const t = w.zones.title, seal = waxSeal(t.x + t.w + 12, t.y + t.h / 2 + 1, 7, 11);
  return { under: under + seal };
}

// ---- B: the captain's table — the Company's chart, a ledger with its documents, brass instruments ----
const B = {
  chart: '#f4ead0', grid: '#b9c4cf', rhumb: '#c7b994', land: '#ead7a6', landLine: '#7d6a44', coast: '#5f7795',
  ledger: '#fbf5e3', ledgerRule: '#c3d0e3', ink: '#1a2a44', shadow: '#0b1628'
};
/** a brass gradient (vertical or diagonal) */
const brassGrad = (id: string, diag = false) => `<linearGradient id="${id}" x1="0" y1="0" x2="${diag ? 1 : 0}" y2="1"><stop offset="0" stop-color="${C.giltLight}"/><stop offset=".45" stop-color="${C.gilt}"/><stop offset="1" stop-color="${C.giltDark}"/></linearGradient>`;
const pt = (cx: number, cy: number, a: number, d: number) => `${r(cx + Math.cos(a) * d)} ${r(cy + Math.sin(a) * d)}`;

/** the rhumb lines and the grid of degrees stay off the words of the rows: a mask with the label lines, the notes beside
 *  the short rows, the thresholds under the cells and the Volley's caption cut out */
function chartLines(g: Geo, F: Rect, rose: [number, number]): string {
  const id = `${g.uid}cm`, holes: Rect[] = [];
  for (const rw of g.rows) {
    const c0 = rw.cells[0];
    holes.push({ x: rw.x0 - 1, y: rw.top - 0.8, w: Math.max(rw.lineEnd, rw.x1) + 3 - rw.x0, h: c0.y - rw.top + 0.8 });
    holes.push({ x: rw.x0 - 1, y: c0.y + c0.h, w: 46, h: 4 });
    if (rw.x1 < 60) holes.push({ x: rw.x1 + 1.5, y: rw.cy - 3.4, w: 50, h: 6 });
  }
  for (const v of g.slots.filter(sl => sl.kind === 'volley')) holes.push({ x: v.x - 6, y: v.y - 9, w: v.w + 26, h: 9 });
  let grid = '';
  for (let x = F.x + 14.5; x < F.x + F.w; x += 29) grid += `M${r(x)} ${r(F.y)}V${r(F.y + F.h)}`;
  for (let y = F.y + 9; y < F.y + F.h; y += 29) grid += `M${r(F.x)} ${r(y)}H${r(F.x + F.w)}`;
  let rh = '', rd = '';
  for (let i = 0; i < 32; i++) { const a = i * Math.PI / 16, l = `M${pt(rose[0], rose[1], a, 11)}L${pt(rose[0], rose[1], a, 320)}`; if (i % 2) rd += l; else rh += l; }
  return `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${g.page.w}" height="${g.page.h}">${rect(F, '#fff')}${holes.map(h => rect(h, '#000', ' rx="1"')).join('')}</mask></defs>` +
    `<g mask="url(#${id})"><path d="${grid}" stroke="${B.grid}" stroke-width=".25"/><path d="${rh}" stroke="${B.rhumb}" stroke-width=".2"/><path d="${rd}" stroke="${B.rhumb}" stroke-width=".16" stroke-dasharray="1.2 1.1"/></g>`;
}
/** the coast between the header and the middle column, an island off it: land tint, the coastline and its water lines */
function coast(): string {
  const pts: [number, number][] = [[79, 30.4], [81.5, 33.2], [86, 34.4], [89.5, 37.6], [94.5, 38.2], [98.5, 41.6], [103.5, 42.4], [106.5, 46], [111, 47.6], [113.5, 51.2], [117, 52.8]];
  const line = (dx: number, dy: number) => 'M' + pts.map(([x, y]) => `${r(x + dx)} ${r(y + dy)}`).join('L');
  const land = `${line(0, 0)}L117 30.4Z`, R = rng(41);
  let hach = '';
  for (let i = 0; i < 46; i++) { const k = R() * (pts.length - 1), j = Math.floor(k), t = k - j, x = pts[j][0] + (pts[j + 1][0] - pts[j][0]) * t, y = pts[j][1] + (pts[j + 1][1] - pts[j][1]) * t, d = 0.8 + R() * 2.4; if (x + d * 0.7 < 116.6 && y - d > 30.6) hach += `M${r(x + d * 0.5)} ${r(y - d)}l.9 -.5`; }
  const isle = 'M108.4 89.6c1.4 -1.6 3.6 -1.5 4.6 -.4c.9 1 2.4 .8 2.5 2c.1 1.3 -1.5 1.7 -3 1.8c-1.6 0 -2.3 1 -3.6 .6c-1.3 -.4 -1.4 -2.8 -.5 -4Z';
  return `<path d="${land}" fill="${B.land}"/><path d="${hach}" stroke="${B.landLine}" stroke-width=".2" stroke-opacity=".7"/>` +
    `<path d="${line(0, 0)}" fill="none" stroke="${B.landLine}" stroke-width=".35" stroke-linejoin="round"/>` +
    [[-0.6, 0.9, 0.22], [-1.3, 1.9, 0.18], [-2.1, 3, 0.15]].map(([dx, dy, w]) => `<path d="${line(dx, dy)}" fill="none" stroke="${B.coast}" stroke-width="${w}" stroke-opacity=".75"/>`).join('') +
    `<path d="${isle}" fill="${B.land}" stroke="${B.landLine}" stroke-width=".3"/><path d="${isle}" fill="none" stroke="${B.coast}" stroke-width=".18" stroke-opacity=".7" transform="translate(111.6 91) scale(1.35) translate(-111.6 -91)"/>` +
    // rocks off the coast: little crosses, no soundings (no numbers on the chart)
    [[90, 41.8], [96.4, 44.6], [108.6, 52]].map(([x, y]) => `<path d="M${x - 0.6} ${y}h1.2M${x} ${y - 0.6}v1.2" stroke="${B.landLine}" stroke-width=".25"/>`).join('');
}
/** the Company's rule under a track row: brass, an engraved border, a graduation mark in every gap, screws at the ends;
 *  its top stays under the numbers' baseline, its foot over the thresholds under the cells */
function companyRule(g: Geo, rw: RowGeo, i: number): string {
  const c0 = rw.cells[0], cl = rw.cells[rw.cells.length - 1], volley = rw.key === 'guns' ? g.slots.filter(sl => sl.kind === 'volley') : [];
  const last = volley.length ? volley[volley.length - 1] : cl, x0 = c0.x - 1.3, x1 = last.x + last.w + (volley.length ? 2.4 : 1.3);
  const y0 = c0.y - 0.45, y1 = c0.y + c0.h + 0.6, id = `${g.uid}cr${i}`, out: string[] = [];
  out.push(`<defs>${brassGrad(id)}</defs><rect x="${r(x0 + 0.5)}" y="${r(y0 + 0.6)}" width="${r(x1 - x0)}" height="${r(y1 - y0)}" rx=".9" fill="${B.shadow}" fill-opacity=".28"/>`);
  out.push(`<rect x="${r(x0)}" y="${r(y0)}" width="${r(x1 - x0)}" height="${r(y1 - y0)}" rx=".9" fill="url(#${id})" stroke="${C.giltDark}" stroke-width=".3"/>`);
  out.push(`<rect x="${r(x0 + 0.35)}" y="${r(y0 + 0.25)}" width="${r(x1 - x0 - 0.7)}" height="${r(y1 - y0 - 0.5)}" rx=".6" fill="none" stroke="${C.giltDark}" stroke-width=".14"/>`);
  let d = '';
  const cells = [...rw.cells, ...volley];
  for (let k = 1; k < cells.length; k++) { const gx = (cells[k - 1].x + cells[k - 1].w + cells[k].x) / 2; if (cells[k].x - cells[k - 1].x - cells[k - 1].w > 4) continue; d += `M${r(gx)} ${r(y0 + 0.3)}v3.2M${r(gx)} ${r(y1 - 0.3)}v-3.2M${r(gx)} ${r(c0.y + c0.h / 2 - 0.8)}v1.6`; }
  // between the last Guns cell and the «Залп дан» cell: a run of fine graduation
  if (volley.length) { const a = cl.x + cl.w, b = volley[0].x; for (let x = a + 0.8; x < b - 0.4; x += 0.8) d += `M${r(x)} ${r(y1 - 0.3)}v${(x - a) % 2.4 < 0.8 ? -2.4 : -1.2}M${r(x)} ${r(y0 + 0.3)}v${(x - a) % 2.4 < 0.8 ? 2.4 : 1.2}`; }
  out.push(`<path d="${d}" stroke="${C.giltDark}" stroke-width=".22"/>`);
  out.push(`<line x1="${r(x0 + 0.6)}" y1="${r(y0 + 0.5)}" x2="${r(x1 - 0.6)}" y2="${r(y0 + 0.5)}" stroke="#fff3c6" stroke-width=".18" stroke-opacity=".8"/>`);
  for (const sx of [x0 + 0.65, x1 - (volley.length ? 1.2 : 0.65)]) out.push(`<circle cx="${r(sx)}" cy="${r(rw.cy)}" r=".5" fill="${C.giltLight}" stroke="${C.giltDark}" stroke-width=".15"/><path d="M${r(sx - 0.35)} ${r(rw.cy + 0.2)}l.7 -.4" stroke="${C.giltDark}" stroke-width=".14"/>`);
  return out.join('');
}
/** a brass sextant lying on the ledger: apex up, the arc with its graduation down, the index arm, mirrors, telescope */
function sextant(ax: number, ay: number, R0: number, id: string): string {
  const a1 = Math.PI / 3, a2 = 2 * Math.PI / 3, Ri = R0 - 2.6, out: string[] = [];
  const bar = (a: number, w: number, to: number) => { const ux = Math.cos(a), uy = Math.sin(a), px = -uy * w / 2, py = ux * w / 2; return `M${r(ax + px)} ${r(ay + py)}L${r(ax + ux * to + px)} ${r(ay + uy * to + py)}L${r(ax + ux * to - px)} ${r(ay + uy * to - py)}L${r(ax - px)} ${r(ay - py)}Z`; };
  const limb = `M${pt(ax, ay, a1, R0)}A${R0} ${R0} 0 0 1 ${pt(ax, ay, a2, R0)}L${pt(ax, ay, a2, Ri)}A${Ri} ${Ri} 0 0 0 ${pt(ax, ay, a1, Ri)}Z`;
  const brace = `M${pt(ax, ay, a1, R0 * 0.55 - 0.7)}A${R0 * 0.55} ${R0 * 0.55} 0 0 1 ${pt(ax, ay, a2, R0 * 0.55 - 0.7)}`;
  const frame = `${limb}${bar(a1, 1.7, Ri)}${bar(a2, 1.7, Ri)}`;
  out.push(`<defs>${brassGrad(id, true)}</defs><g transform="translate(.5 .6)" fill="${B.shadow}" fill-opacity=".3"><path d="${frame}"/></g>`);
  out.push(`<path d="${frame}" fill="url(#${id})" stroke="${C.giltDark}" stroke-width=".25" stroke-linejoin="round"/><path d="${brace}" fill="none" stroke="${C.giltDark}" stroke-width="1.5"/><path d="${brace}" fill="none" stroke="${C.gilt}" stroke-width="1"/>`);
  // the silver scale on the arc
  out.push(`<path d="M${pt(ax, ay, a1 + 0.02, R0 - 0.3)}A${R0 - 0.3} ${R0 - 0.3} 0 0 1 ${pt(ax, ay, a2 - 0.02, R0 - 0.3)}" fill="none" stroke="#dfe3e6" stroke-width="1.3"/>`);
  let d = '';
  for (let k = 0; k <= 30; k++) { const a = a1 + 0.03 + k * (a2 - a1 - 0.06) / 30, l = k % 5 ? 0.7 : 1.3; d += `M${pt(ax, ay, a, R0 - 0.05)}L${pt(ax, ay, a, R0 - l)}`; }
  out.push(`<path d="${d}" stroke="#3a3f45" stroke-width=".13"/>`);
  // the telescope across the frame, the horizon mirror on the left bar
  const ty = ay + R0 * 0.36;
  out.push(`<rect x="${r(ax - R0 * 0.36)}" y="${r(ty - 0.75)}" width="${r(R0 * 0.62)}" height="1.5" rx=".4" fill="${C.ochreDark}" stroke="#3b2a0c" stroke-width=".2"/>` +
    [-0.3, 0.05, 0.22].map(k => `<rect x="${r(ax + R0 * k)}" y="${r(ty - 0.95)}" width=".7" height="1.9" fill="${C.giltLight}" stroke="${C.giltDark}" stroke-width=".12"/>`).join(''));
  const hx = ax + Math.cos(a2) * R0 * 0.72, hy = ay + Math.sin(a2) * R0 * 0.72;
  out.push(`<rect x="${r(hx - 1.3)}" y="${r(hy - 1.6)}" width="2.6" height="3.2" fill="#c9d3dc" stroke="#4a5058" stroke-width=".2" transform="rotate(-30 ${r(hx)} ${r(hy)})"/>`);
  // the index arm on its pivot, the vernier at the arc, the index mirror at the apex
  const ia = Math.PI * 0.46, ux = Math.cos(ia), uy = Math.sin(ia);
  out.push(`<path d="${bar(ia, 1.3, R0 + 0.6)}" fill="${C.gilt}" stroke="${C.giltDark}" stroke-width=".2"/><rect x="${r(ax + ux * (R0 - 1.4) - 1.6)}" y="${r(ay + uy * (R0 - 1.4) - 0.9)}" width="3.2" height="1.8" rx=".3" fill="#dfe3e6" stroke="#4a5058" stroke-width=".15" transform="rotate(${r(ia * 180 / Math.PI - 90)} ${r(ax + ux * (R0 - 1.4))} ${r(ay + uy * (R0 - 1.4))})"/>`);
  out.push(`<rect x="${r(ax - 1.8)}" y="${r(ay - 1.2)}" width="3.6" height="2.4" fill="#c9d3dc" stroke="#4a5058" stroke-width=".2"/><circle cx="${r(ax)}" cy="${r(ay + 1.6)}" r="1.1" fill="${C.giltLight}" stroke="${C.giltDark}" stroke-width=".2"/><circle cx="${r(ax)}" cy="${r(ay + 1.6)}" r=".35" fill="${C.giltDark}"/>`);
  return out.join('');
}
/** a brass parallel rule: two bars, two links with rivets */
function parallelRule(x: number, y: number, w: number, id: string): string {
  const h = 3.2, gap = 4.6, out: string[] = [`<defs>${brassGrad(id)}</defs>`];
  const bars = [y, y + h + gap];
  out.push(bars.map(by => `<rect x="${r(x + 0.5)}" y="${r(by + 0.6)}" width="${w}" height="${h}" rx=".5" fill="${B.shadow}" fill-opacity=".3"/>`).join(''));
  const links = [x + w * 0.22, x + w * 0.7].map(lx => [lx, y + h / 2, lx + 3.2, y + h + gap + h / 2]);
  out.push(links.map(([x1, y1, x2, y2]) => `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke="${C.giltDark}" stroke-width="1.6" stroke-linecap="round"/><line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke="${C.gilt}" stroke-width="1.1" stroke-linecap="round"/>`).join(''));
  out.push(bars.map(by => `<rect x="${r(x)}" y="${r(by)}" width="${w}" height="${h}" rx=".5" fill="url(#${id})" stroke="${C.giltDark}" stroke-width=".25"/><line x1="${r(x + 0.5)}" y1="${r(by + 0.45)}" x2="${r(x + w - 0.5)}" y2="${r(by + 0.45)}" stroke="#fff3c6" stroke-width=".16"/>`).join(''));
  out.push(links.map(([x1, y1, x2, y2]) => [[x1, y1], [x2, y2]].map(([cx, cy]) => `<circle cx="${r(cx)}" cy="${r(cy)}" r=".55" fill="${C.giltLight}" stroke="${C.giltDark}" stroke-width=".15"/>`).join('')).join(''));
  return out.join('');
}
/** the ledger the Company's documents lie on: under the right column, ruled in blue, a red double margin */
function ledger(g: Geo): string {
  const c = g.zones.col, L: Rect = { x: c.x - 1.2, y: c.y - 2.4, w: g.page.w - 11.2 - c.x + 1.2, h: g.zones.strip.y - 0.6 - c.y + 2.4 };
  let d = ''; for (let y = L.y + 6; y < L.y + L.h - 0.5; y += 5.2) d += `M${r(L.x + 0.6)} ${r(y)}H${r(L.x + L.w - 0.6)}`;
  return `<rect x="${r(L.x - 0.9)}" y="${r(L.y + 0.9)}" width="${r(L.w)}" height="${r(L.h)}" rx=".8" fill="${B.shadow}" fill-opacity=".25"/>` +
    `<rect x="${r(L.x - 0.45)}" y="${r(L.y + 0.45)}" width="${r(L.w)}" height="${r(L.h)}" rx=".8" fill="#efe6cc" stroke="#b8a77e" stroke-width=".2"/>` +
    `<rect x="${r(L.x)}" y="${r(L.y)}" width="${r(L.w)}" height="${r(L.h)}" rx=".8" fill="${B.ledger}" stroke="#b8a77e" stroke-width=".25"/>` +
    `<path d="${d}" stroke="${B.ledgerRule}" stroke-width=".22"/>` +
    [L.x + 5.4, L.x + 6.1].map(x => `<line x1="${r(x)}" y1="${r(L.y + 0.4)}" x2="${r(x)}" y2="${r(L.y + L.h - 0.4)}" stroke="${C.red}" stroke-width=".22"/>`).join('');
}
/** a hard shadow under a field of the frame: the documents lie on the chart */
const dropShadow = (b: Rect, pad = 0) => `<rect x="${r(b.x - pad + 0.6)}" y="${r(b.y - pad + 0.7)}" width="${r(b.w + 2 * pad)}" height="${r(b.h + 2 * pad)}" rx="2" fill="${B.shadow}" fill-opacity=".22"/>`;
/** the engraving: the kit ship in the Company's blue ink on plate paper, a navy frame with gilt fillets */
async function engravingB(g: Geo): Promise<string> {
  const E = ENGRAVING, base = await engraving(g, { paper: '#f8f1dc', ink: B.ink, frame: C.navy, frameDark: C.navyDeep, sails: 'full', seed: 5 });
  const gilt = `<rect x="1.55" y="1.55" width="${E.w - 3.1}" height="${E.h - 3.1}" rx=".9" fill="none" stroke="${C.gilt}" stroke-width=".3"/>` +
    `<rect x="2.6" y="2.6" width="${E.w - 5.2}" height="${E.h - 5.2}" fill="none" stroke="${C.giltLight}" stroke-width=".35"/>` +
    `<rect x="4.4" y="4.4" width="${E.w - 8.8}" height="${E.h - 8.8}" fill="none" stroke="${B.ink}" stroke-width=".18"/>` +
    [[1.55, 1.55], [E.w - 1.55, 1.55], [1.55, E.h - 1.55], [E.w - 1.55, E.h - 1.55]].map(([x, y]) => `<circle cx="${r(x)}" cy="${r(y)}" r=".7" fill="${C.gilt}"/>`).join('');
  return base + gilt;
}
/** the wax seal as a small SVG for CSS (it sits on an HTML box, above the material's SVG layers) */
const sealUri = () => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-5 -5 10 10">${waxSeal(0, 0, 4.1, 13, false)}</svg>`)}`;

async function faceB(g: Geo): Promise<Layers> {
  const F: Rect = { x: 11.2, y: 11.2, w: g.page.w - 22.4, h: 197 - 11.2 }, rose: [number, number] = [98, 66], z = g.zones, col = z.col, m = z.mid;
  const E = z.engraving, eh = E ? Math.min(E.w / ENGRAVING.w, E.h / ENGRAVING.h) * ENGRAVING.h : 0, ew = E ? Math.min(E.w / ENGRAVING.w, E.h / ENGRAVING.h) * ENGRAVING.w : 0;
  const foot = col.y + col.h;
  const under = [
    binding(g),
    `<rect x="${r(F.x)}" y="${r(F.y)}" width="${r(F.w)}" height="${r(F.h)}" rx="1.2" fill="${B.chart}"/>`,
    chartLines(g, F, rose),
    coast(),
    compass(rose[0], rose[1], 10, { line: '#41546f', fill: B.chart, accent: C.wax }),
    dividers(rose[0] + 2, rose[1] + 20, Math.PI * 0.63, Math.PI * 0.37, 17, `${g.uid}dv`),
    ledger(g),
    // the documents of the frame lie on the chart: hard shadows under the header, the Fires, the strip, the footer
    dropShadow(z.header, 0.4), dropShadow(g.boxes[0]), dropShadow({ x: m.x, y: m.y - 0.6, w: m.w, h: 5.6 }, 0.4),
    dropShadow({ x: z.strip.x, y: z.strip.y - 0.6, w: z.strip.w, h: z.strip.h + 1.2 }, 0.6),
    dropShadow({ x: z.footer.x + 30, y: z.footer.y - 0.2, w: z.footer.w - 60, h: z.footer.h + 0.4 }, 0.6),
    E ? `<rect x="${r(E.x + (E.w - ew) / 2 + 0.7)}" y="${r(E.y + (E.h - eh) / 2 + 0.9)}" width="${r(ew)}" height="${r(eh)}" rx="1.2" fill="${B.shadow}" fill-opacity=".3"/>` : '',
    ...g.rows.map((rw, i) => companyRule(g, rw, i)),
    // the ledger's foot under the column's documents: the sextant, the parallel rule, the Company's seal
    sextant(col.x + 13, foot - 17.6, 16, `${g.uid}sx`),
    parallelRule(col.x + 28, foot - 13.6, 30, `${g.uid}pr`),
    waxSeal(col.x + col.w - 12, foot - 11.2, 5.4, 7)
  ].join('');
  // over: a red double rule under the header, as at the head of a ledger page
  const h = z.header, over = `<path d="M${r(h.x + 21)} ${r(h.y + h.h - 1.2)}H${r(h.x + h.w - 1.5)}M${r(h.x + 21)} ${r(h.y + h.h - 0.7)}H${r(h.x + h.w - 1.5)}" stroke="${C.red}" stroke-width=".2"/>`;
  const s = g.scope, margin = `linear-gradient(90deg,transparent 1mm,${C.red} 1mm,${C.red} 1.2mm,transparent 1.2mm,transparent 1.5mm,${C.red} 1.5mm,${C.red} 1.7mm,transparent 1.7mm)`;
  const pin = `content:'';position:absolute;left:50%;top:-1.3mm;width:2.6mm;height:2.6mm;margin-left:-1.3mm;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff6d8 0,${C.gilt} 45%,${C.giltDark} 100%)`;
  const css = `${s} .bo2-col .bo2-box{border-color:${C.rule};box-shadow:none}` +
    // the abilities: the Company's charter — a navy head band with an ochre line, the ledger margin, the seal by the title
    `${s} .bo2-ab{border-top:1.6mm solid ${C.navy};background:${margin},var(--f);box-shadow:inset 0 .45mm 0 ${C.ochre}}` +
    `${s} .bo2-ab::after{content:'';position:absolute;right:20mm;top:.5mm;width:7.4mm;height:7.4mm;background:url("${sealUri()}") center/contain no-repeat}` +
    // the Legend and the Powder: notes pinned to the ledger with brass pins
    `${s} .bo2-legend{background:${margin},#fcf1d2}${s} .bo2-powder{background:${margin},var(--f)}` +
    `${s} .bo2-legend::before,${s} .bo2-powder::before{${pin}}`;
  return { under, over, css, engraving: await engravingB(g) };
}

export const material: ShipMaterial = { palette: PALETTE, a: faceA, b: faceB, wreck: wreckB };
