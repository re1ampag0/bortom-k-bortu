// «Индевор» — the material of its board: the East India Company. A: the Company's ledger laid over the ship's own side —
// every track is a ruled ledger slip lying on the part of the ship it counts (Sails on the main course, Crew on the
// bulwark at the rail, Guns along the upper row of open ports, Hull on the black strake of planking), the cells set into
// that part (canvas, the rail, ports red inside, planks with treenails); a navy morocco binding with gilt fillets round
// it, a red wax seal with the Company's bale mark in the header, brass dividers and a compass card in the column's foot.
// The back: the Endeavour on the sea floor, the Company's strongbox spilling its gold beside her. B: the shared simple
// material (paint.ts) in the Company's colours. See the interface at the top of frame.ts.
import type { Geo, Layers, Pal, Rect, RowGeo, ShipMaterial, TrackKey, WreckGeo } from './frame';
import { compass, rng, rope, sheet, simpleMaterial } from './paint';

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

// ---- the ledger slips: the dimming layer under every row (paper with fill-opacity over the JPEG), ruled like the Company's books ----
function slip(rw: RowGeo): string {
  const b = rw.band, x = b.x - 1.6, y = b.y - 1.6, w = b.w + 3.2, h = b.h + 3.2, out: string[] = [];
  out.push(`<rect x="${r(x + 0.7)}" y="${r(y + 0.8)}" width="${r(w)}" height="${r(h)}" rx="1.2" fill="${C.navyDeep}" fill-opacity=".42"/>`);
  out.push(`<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" rx="1.2" fill="${C.paper}" fill-opacity=".885"/>`);
  // the blue rule the label is written on, the column rules between the numbers, the red double margins at both ends
  out.push(`<line x1="${r(x + 2.2)}" y1="${r(rw.labelY + 0.85)}" x2="${r(x + w - 2.2)}" y2="${r(rw.labelY + 0.85)}" stroke="${C.rule}" stroke-width=".2"/>`);
  let d = '';
  for (const c of rw.cells.slice(1)) d += `M${r(c.x - 0.75)} ${r(rw.labelY + 1.3)}V${r(c.y)}`;
  out.push(`<path d="${d}" stroke="${C.rule}" stroke-width=".16"/>`);
  for (const mx of [x + 0.7, x + 1.15, x + w - 1.15, x + w - 0.7]) out.push(`<line x1="${r(mx)}" y1="${r(y + 0.4)}" x2="${r(mx)}" y2="${r(y + h - 0.4)}" stroke="${C.red}" stroke-width=".18"/>`);
  return out.join('');
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
    ...g.rows.map(slip),
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

const simple = simpleMaterial({
  wood: { base: '#1f3556', seam: '#0f1d33', grain: '#2a4570', nails: '#c9a35a' }, band: '#9C7A2C', hair: '#e0c27a',
  sky: ['#d6dfe6', '#f3f1e8'], sea: ['#6f8ea4', '#355068'], focus: 0,
  dim: '#fdfaf0', dimOpacity: 0.87,
  chart: { paper: '#f4ecd6', line: '#c9c0a2', coast: '#e3d6b0' }, brass: { light: '#f4dc92', mid: '#c9a04a', dark: '#6a4c16' },
  note: '#fffcf2', noteLine: '#9fb3cf', pin: '#1f3556',
  extraB: g => { let d = ''; for (let y = 36; y < 170; y += 6.2) d += `M11.2 ${y.toFixed(1)}H${(g.page.w - 11.2).toFixed(1)}`; return `<path d="${d}" stroke="#9fb3cf" stroke-width=".2"/><line x1="116" y1="11.2" x2="116" y2="197" stroke="#d48a8a" stroke-width=".3"/>` + waxSeal(274, 162, 6.4, 7, false); },
  wreck: { water: ['#4c6476', '#1a2733'], sand: '#a99f86', sandDark: '#6a6252' }
});

export const material: ShipMaterial = { palette: PALETTE, a: faceA, b: simple.b, wreck: wreckB };
