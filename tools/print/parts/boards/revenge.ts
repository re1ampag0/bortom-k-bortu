// «Месть королевы Анны» — the material of its board: dark red and black, charred wood, wrought brass, firelight.
// A («у борта»): the Revenge's own side in a close-up at dusk, lit by fire from the right. The scale is set by the gun
// ports: the kit ports stand exactly under the Guns cell «0» and under «Залп дан» (one pitch of the ports = the distance
// between them), the port row lies on the Guns row, the cap rail just under the Crew cells (the crew at the bulwark),
// the main course behind the Sails row, the tarred planking under the Hull row; the Fires box sits on the quarterdeck,
// and the glow of fire comes from it. Every Guns cell is set in a dark port. Round it — charred planks with embers in
// the cracks, wrought brass corners; in the free foot of the right column Blackbeard's flag is nailed to the wood.
// The back «Затонул»: the wreck on a murky red-brown floor, light shafts, a gun, shot and charred planks on the sand.
import type { Geo, Layers, Rect, ShipMaterial, WreckGeo } from './frame';
import { mix, rng, sheet, simpleMaterial } from './paint';

type Fn = (u: string, L: unknown, o: Record<string, unknown>) => string;
const r = (n: number) => Math.round(n * 100) / 100;
const fn = (g: { kit: Record<string, unknown> }, name: string) => g.kit[name] as Fn;

// ---- colours ----
const C = {
  band: '#1a0907', hair: '#b07a34', ground: '#140806',
  wood: '#24110d', seam: '#060202', char: '#0b0504', sheen: '#4a2a20', ember: '#ff5a1a', emberHot: '#ffb04a',
  brass: { light: '#f0cd85', mid: '#b07f32', dark: '#4a2c0c' },
  dim: '#fbf1e1', port: '#2c0b08', portEdge: '#7a2618', glow: '#ff7a2a',
  sky: ['#2a0f0d', '#8e3a22'] as [string, string], sea: ['#3a2220', '#100909'] as [string, string]
};

/** charred planks: alligator checks across the grain, deep seams, a few cracks still glowing */
function charred(b: Rect, seed: number, id: string): string {
  const R = rng(seed), h = 10.5, out: string[] = [`<rect x="${r(b.x)}" y="${r(b.y)}" width="${r(b.w)}" height="${r(b.h)}" fill="${C.wood}"/>`];
  let cracks = '', checks = '', embers = '', glowD = '', sheen = '';
  for (let y = b.y, i = 0; y < b.y + b.h; y += h, i++) {
    const hh = Math.min(h, b.y + b.h - y);
    out.push(`<rect x="${r(b.x)}" y="${r(y)}" width="${r(b.w)}" height="${r(hh)}" fill="${mix(C.wood, i % 2 ? '#000000' : '#3a1a12', 0.12 + R() * 0.18)}"/>`);
    out.push(`<rect x="${r(b.x)}" y="${r(y + hh - 1.4)}" width="${r(b.w)}" height="1.4" fill="${C.char}" fill-opacity=".45"/>`);
    out.push(`<line x1="${r(b.x)}" y1="${r(y)}" x2="${r(b.x + b.w)}" y2="${r(y)}" stroke="${C.seam}" stroke-width=".5"/>`);
    // butt joints with two nails of black iron
    for (let x = b.x + R() * 70, x0 = b.x; x0 < b.x + b.w; x0 = x, x += 60 + R() * 55) {
      out.push(`<rect x="${r(x0)}" y="${r(y)}" width="${r(Math.min(x, b.x + b.w) - x0)}" height="${r(hh)}" fill="${R() < 0.5 ? '#000000' : '#5a2a1c'}" fill-opacity="${r(0.05 + R() * 0.12)}"/>`);
      if (x < b.x + b.w) out.push(`<line x1="${r(x)}" y1="${r(y)}" x2="${r(x)}" y2="${r(y + hh)}" stroke="${C.seam}" stroke-width=".45"/><circle cx="${r(x + 1.6)}" cy="${r(y + hh / 2)}" r=".55" fill="#0a0605" stroke="${C.sheen}" stroke-width=".15"/><circle cx="${r(x - 1.6)}" cy="${r(y + hh / 2)}" r=".55" fill="#0a0605" stroke="${C.sheen}" stroke-width=".15"/>`);
    }
    // char: long cracks along the grain, short checks across it in loose blocks, a burnt sheen on the ridges
    for (let x = b.x + R() * 6; x < b.x + b.w; x += 4 + R() * 9) {
      const y0 = y + 1 + R() * (hh - 2.6), l = 6 + R() * 22;
      cracks += `M${r(x)} ${r(y0)}q${r(l / 2)} ${r((R() - 0.5) * 0.8)} ${r(l)} ${r((R() - 0.5) * 0.6)}`;
      if (R() < 0.35) { const n = 2 + Math.floor(R() * 4); for (let j = 0; j < n; j++) checks += `M${r(x + 1 + j * (1.6 + R()))} ${r(y0 - 0.9 - R())}v${r(1.8 + R() * 1.6)}`; }
      if (R() < 0.5) sheen += `M${r(x + 1)} ${r(y0 - 0.7)}q${r(l * 0.3)} -.2 ${r(l * 0.6)} 0`;
      if (R() < 0.05) { const l3 = 3 + R() * 7, yy = y0 + 0.1; embers += `M${r(x + 2)} ${r(yy)}l${r(l3)} ${r((R() - 0.5) * 0.4)}`; glowD += `M${r(x + 2)} ${r(yy)}l${r(l3)} 0`; }
    }
  }
  out.push(`<path d="${checks}" stroke="${C.char}" stroke-width=".3" fill="none" stroke-linecap="round" stroke-opacity=".8"/>`);
  out.push(`<path d="${cracks}" stroke="${C.char}" stroke-width=".38" fill="none" stroke-linecap="round"/>`);
  out.push(`<path d="${sheen}" stroke="${C.sheen}" stroke-width=".3" fill="none" stroke-linecap="round" stroke-opacity=".8"/>`);
  out.push(`<path d="${glowD}" stroke="${C.ember}" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-opacity=".18"/><path d="${embers}" stroke="${C.ember}" stroke-width=".45" fill="none" stroke-linecap="round" stroke-opacity=".85"/><path d="${embers}" stroke="${C.emberHot}" stroke-width=".18" fill="none" stroke-linecap="round"/>`);
  return `<defs><clipPath id="${id}"><rect x="${r(b.x)}" y="${r(b.y)}" width="${r(b.w)}" height="${r(b.h)}" rx="2"/></clipPath></defs><g clip-path="url(#${id})">${out.join('')}</g>`;
}

/** a brass gradient, and a wrought-brass corner: an L of bar with a scroll end and rivets, inside the frame band */
const brassGrad = (id: string) => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.brass.light}"/><stop offset=".5" stop-color="${C.brass.mid}"/><stop offset="1" stop-color="${C.brass.dark}"/></linearGradient>`;
function corner(cx: number, cy: number, sx: number, sy: number, grad: string): string {
  const L = 17, w = 2.3, p = (x: number, y: number) => `${r(cx + sx * x)} ${r(cy + sy * y)}`;
  const d = `M${p(0, 0)}L${p(L, 0)}Q${p(L + 1.6, w / 2)} ${p(L, w)}L${p(w, w)}L${p(w, L)}Q${p(w / 2, L + 1.6)} ${p(0, L)}Z`;
  const rv = (x: number, y: number) => `<circle cx="${r(cx + sx * x)}" cy="${r(cy + sy * y)}" r=".55" fill="${C.brass.light}" stroke="${C.brass.dark}" stroke-width=".2"/>`;
  return `<path d="${d}" fill="url(#${grad})" stroke="${C.brass.dark}" stroke-width=".3"/>` + rv(w / 2, w / 2) + rv(L - 2, w / 2) + rv(w / 2, L - 2);
}

/** Blackbeard's flag (the old one: a horned skeleton with an hourglass, a spear at a bleeding heart), nailed flat */
function flag(cx: number, cy: number, w: number, id: string): string {
  const h = w * 0.62, x = cx - w / 2, y = cy - h / 2, R = rng(9), bone = '#e9dcc4', boneD = '#a8987e', red = '#b3261a';
  // the fly is torn: a ragged right edge
  let edge = `M${r(x)} ${r(y)}L${r(x + w - 3)} ${r(y + 0.6)}`;
  for (let t = 0; t <= 1.0001; t += 0.125) edge += `L${r(x + w - 3 + (t * 8 % 2 < 1 ? 2.6 : -0.4) - R() * 2.2)} ${r(y + 0.6 + t * (h - 1.2))}`;
  edge += `L${r(x)} ${r(y + h)}Z`;
  const folds = [0.22, 0.47, 0.71].map((t, i) => `<rect x="${r(x + w * t)}" y="${r(y)}" width="${r(w * 0.09)}" height="${r(h)}" fill="${i % 2 ? '#000000' : '#3a302c'}" fill-opacity=".35"/>`).join('');
  const sx = x + w * 0.42, sy = y + h * 0.3, k = h / 34;           // the skeleton: skull at (sx, sy), k mm per unit
  const P = (dx: number, dy: number) => `${r(sx + dx * k)} ${r(sy + dy * k)}`;
  const skel = `<g fill="none" stroke="${bone}" stroke-linecap="round" stroke-linejoin="round">` +
    `<path d="M${P(-2.6, -3.2)}q-1.6 ${r(-2.6 * k)} ${r(-0.8 * k)} ${r(-4.2 * k)}M${P(2.6, -3.2)}q${r(1.6 * k)} ${r(-2.6 * k)} ${r(0.8 * k)} ${r(-4.2 * k)}" stroke-width="${r(0.9 * k)}"/>` +
    `<path d="M${P(0, 4)}V${P(0, 16).split(' ')[1]}" stroke-width="${r(1.1 * k)}"/>` +
    [6.2, 8.4, 10.6].map(dy => `<path d="M${P(-4.2 + dy * 0.12, dy)}Q${P(0, dy - 1.4)} ${P(4.2 - dy * 0.12, dy)}" stroke-width="${r(0.75 * k)}"/>`).join('') +
    `<path d="M${P(-5.2, 13.6)}Q${P(0, 18.6)} ${P(5.2, 13.6)}" stroke-width="${r(0.9 * k)}"/>` +
    `<path d="M${P(-3.6, 5)}L${P(-8, 9.5)}L${P(-11.2, 6.8)}M${P(3.6, 5)}L${P(8.2, 8.8)}L${P(11.4, 5.4)}" stroke-width="${r(0.9 * k)}"/>` +
    `<path d="M${P(-3.4, 16.4)}L${P(-4.6, 23)}L${P(-6, 29.5)}M${P(3.4, 16.4)}L${P(4.8, 23)}L${P(6.6, 29.5)}" stroke-width="${r(1 * k)}"/></g>` +
    `<path d="M${P(-3.3, -1)}a${r(3.4 * k)} ${r(3.6 * k)} 0 1 1 ${r(6.6 * k)} 0v${r(2.4 * k)}h${r(-1.2 * k)}v${r(1.4 * k)}h${r(-4.2 * k)}v${r(-1.4 * k)}h${r(-1.2 * k)}z" fill="${bone}"/>` +
    `<circle cx="${r(sx - 1.3 * k)}" cy="${r(sy - 0.6 * k)}" r="${r(0.95 * k)}" fill="#0d0b0b"/><circle cx="${r(sx + 1.3 * k)}" cy="${r(sy - 0.6 * k)}" r="${r(0.95 * k)}" fill="#0d0b0b"/>`;
  // the hourglass in the left hand, the spear from the right hand down at the heart
  const hx = sx - 11.6 * k, hy = sy + 7.2 * k, hg = `<path d="M${r(hx - 1.7 * k)} ${r(hy - 3.2 * k)}h${r(3.4 * k)}l${r(-1.5 * k)} ${r(3.2 * k)}l${r(1.5 * k)} ${r(3.2 * k)}h${r(-3.4 * k)}l${r(1.5 * k)} ${r(-3.2 * k)}z" fill="none" stroke="${bone}" stroke-width="${r(0.6 * k)}"/><path d="M${r(hx - 1.1 * k)} ${r(hy + 2.7 * k)}l${r(1.1 * k)} ${r(-1.6 * k)}l${r(1.1 * k)} ${r(1.6 * k)}z" fill="${bone}"/><path d="M${r(hx - 2.2 * k)} ${r(hy - 3.3 * k)}h${r(4.4 * k)}M${r(hx - 2.2 * k)} ${r(hy + 3.3 * k)}h${r(4.4 * k)}" stroke="${bone}" stroke-width="${r(0.7 * k)}"/>`;
  const ex = sx + 11.4 * k, ey = sy + 5.4 * k, tx = sx + 17.5 * k, ty = sy + 21 * k;
  const spear = `<path d="M${r(ex - 1.2 * k)} ${r(ey - 6 * k)}L${r(tx)} ${r(ty)}" stroke="${boneD}" stroke-width="${r(0.6 * k)}"/><path d="M${r(tx)} ${r(ty)}l${r(-1.5 * k)} ${r(-2.4 * k)}l${r(2.4 * k)} ${r(-0.6 * k)}z" fill="${bone}"/>`;
  const hcx = tx + 1.6 * k, hcy = ty + 2.2 * k, hs = 1.25 * k;
  const heart = `<path d="M${r(hcx)} ${r(hcy + 2.6 * hs)}C${r(hcx - 3.2 * hs)} ${r(hcy + 0.4 * hs)} ${r(hcx - 2.6 * hs)} ${r(hcy - 2.4 * hs)} ${r(hcx)} ${r(hcy - 1.1 * hs)}C${r(hcx + 2.6 * hs)} ${r(hcy - 2.4 * hs)} ${r(hcx + 3.2 * hs)} ${r(hcy + 0.4 * hs)} ${r(hcx)} ${r(hcy + 2.6 * hs)}z" fill="${red}"/>` +
    [[-0.9, 3.6], [0.5, 4.6], [1.6, 3.5]].map(([dx, dy]) => `<path d="M${r(hcx + dx * hs)} ${r(hcy + dy * hs)}q${r(0.45 * hs)} ${r(0.8 * hs)} 0 ${r(1.1 * hs)}q${r(-0.45 * hs)} ${r(-0.3 * hs)} 0 ${r(-1.1 * hs)}z" fill="${red}"/>`).join('');
  const tack = (px: number, py: number) => `<circle cx="${r(px)}" cy="${r(py)}" r=".9" fill="url(#${id}b)" stroke="${C.brass.dark}" stroke-width=".25"/>`;
  return `<defs><clipPath id="${id}"><path d="${edge}"/></clipPath>${brassGrad(id + 'b')}</defs>` +
    `<path d="${edge}" fill="#000000" fill-opacity=".45" transform="translate(.9 1.1)"/>` +
    `<g clip-path="url(#${id})"><rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" fill="#141111"/>${folds}${skel}${hg}${spear}${heart}</g>` +
    `<path d="${edge}" fill="none" stroke="#000000" stroke-width=".3"/>` + tack(x + 1.6, y + 1.6) + tack(x + 1.6, y + h - 1.6) + tack(x + w - 5, y + 2) + tack(x + w - 5.5, y + h - 2.2);
}

// ---- A: the close-up of the side ----
async function sideArt(g: Geo): Promise<string> {
  const P = g.zones.picture, K = g.kit, k = 0.7, kind = g.kind;
  const guns = g.rows.find(rw => rw.key === 'guns')!, c0 = guns.cells[0], vol = g.slots.find(s => s.kind === 'volley')!;
  const pr = (K.SHIP_SPECS[kind].ports as unknown as { h: number; n: number; x0: number; x1: number }[])[0], pitch = (pr.x1 - pr.x0) / (pr.n - 1), J = 5;
  // mm per ship unit: one pitch of the ports from the cell «0» to «Залп дан»; X0 — the port under the cell «0»
  const s = (vol.x + vol.w / 2 - c0.cx) / pitch, X0 = pr.x0 + J * pitch, geo = K.shipGeom(kind, { x: 0, y: 0, scale: 1 });
  const railH = -geo.nearRail(X0)[1], free = (K.SHIP_SPECS[kind] as unknown as { free: number }).free, portH = pr.h * railH / free;
  const wl = guns.cy + (portH + 0.6) * s, shipX = c0.cx - X0 * s;   // the waterline and the hull's X = 0, page mm
  const b = Math.ceil(Math.max(0, (P.w / k - 200) / 2, (P.h / k - 280) / 2)) + 2, U = (mmX: number, mmY: number) => [(mmX - P.x) / k - b, (mmY - P.y) / k - b];
  const [sx, sy] = U(shipX, wl), [, hy] = U(0, wl - 4);
  const L = K.makeLight({ time: 'dusk', haze: 0.4, key: { type: 'sun', az: 128, el: 14, color: '#ffa25a', power: 1.05 }, fill: { color: '#7a4a52', power: 0.42 } }, { horizon: hy });
  const W = 200 + 2 * b, H = 280 + 2 * b, fire = g.boxes[0], [fx, fy] = U(fire.x + fire.w / 2, fire.y + fire.h * 0.75);
  const smoke = fn(g, 'smoke')('bo2rs', L, { x: fx - 40, y: fy + 30, w: 90, h: 150, wind: -0.7, seed: 8, glow: { color: '#ff8a3a', power: 0.55 }, opacity: 0.8 })
    + fn(g, 'smoke')('bo2rs2', L, { x: fx + 30, y: fy + 40, w: 70, h: 120, wind: -0.5, seed: 3, glow: { color: '#ff7a2a', power: 0.5 }, opacity: 0.7 });
  const ship = K.ship('bo2r' + kind, L, { kind, x: sx, y: sy, scale: s / k, sails: 'full', heel: 0, seed: 11, detail: 'near', lights: true });
  const mf = g.zones.midFree, [lx, ly] = mf ? U(mf.x + mf.w - 12, mf.y + 36) : [0, 0];
  const lantern = mf ? fn(g, 'lantern')('bo2rl', L, { x: lx, y: ly, s: 0.95, lit: true, hang: 26, seed: 5 }) + fn(g, 'localGlow')('bo2rlg', L, { x: lx, y: ly - 12, color: '#ffb24a', power: 0.6, radius: 45 } as unknown as Record<string, unknown>) : '';
  const glow = fn(g, 'localGlow')('bo2rg', L, { x: fx, y: fy + 10, color: '#ff8a3a', power: 0.55, radius: 150 } as unknown as Record<string, unknown>);
  const R = rng(17); let sparks = '';
  for (let i = 0; i < 70; i++) { const x = fx - 160 + R() * 230, y = fy + 60 - R() * 200; sparks += `<circle cx="${r(x)}" cy="${r(y)}" r="${r(0.25 + R() * 0.6)}" fill="${R() < 0.5 ? '#ffd27a' : '#ff8a3a'}" opacity="${r(0.4 + R() * 0.6)}"/>`; }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-b} ${-b} ${W} ${H}"><defs><linearGradient id="bo2rsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.sky[0]}"/><stop offset="1" stop-color="${C.sky[1]}"/></linearGradient><linearGradient id="bo2rsea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.sea[0]}"/><stop offset="1" stop-color="${C.sea[1]}"/></linearGradient></defs>` +
    `<rect x="${-b}" y="${-b}" width="${W}" height="${H}" fill="url(#bo2rsky)"/><rect x="${-b}" y="${r(hy)}" width="${W}" height="${r(H - hy - b)}" fill="url(#bo2rsea)"/>${smoke}${sparks}${ship}${glow}${lantern}</svg>`;
  const url = await g.art(`board-a-${kind}`, svg, b), id = `${g.uid}rp`;
  return `<defs><clipPath id="${id}"><rect x="${r(P.x)}" y="${r(P.y)}" width="${r(P.w)}" height="${r(P.h)}" rx="2.2"/></clipPath>` +
    `<radialGradient id="${id}f" cx="${r(fire.x + fire.w / 2)}" cy="${r(fire.y + fire.h * 0.6)}" r="70" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${C.glow}" stop-opacity=".5"/><stop offset=".5" stop-color="${C.glow}" stop-opacity=".16"/><stop offset="1" stop-color="${C.glow}" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${id}v" cx="${r(P.x + P.w * 0.55)}" cy="${r(P.y + P.h * 0.45)}" r="${r(P.w * 0.62)}" gradientUnits="userSpaceOnUse"><stop offset=".6" stop-color="#0c0302" stop-opacity="0"/><stop offset="1" stop-color="#0c0302" stop-opacity=".6"/></radialGradient></defs>` +
    `<g clip-path="url(#${id})"><image href="${url}" x="${r(P.x)}" y="${r(P.y)}" width="${r(W * k)}" height="${r(H * k)}" preserveAspectRatio="none"/>` +
    `<rect x="${r(P.x)}" y="${r(P.y)}" width="${r(P.w)}" height="${r(P.h)}" fill="url(#${id}v)"/><rect x="${r(P.x)}" y="${r(P.y)}" width="${r(P.w)}" height="${r(P.h)}" fill="url(#${id}f)"/>${embers(g)}</g>` +
    `<rect x="${r(P.x - 0.4)}" y="${r(P.y - 0.4)}" width="${r(P.w + 0.8)}" height="${r(P.h + 0.8)}" rx="2.4" fill="none" stroke="${C.brass.mid}" stroke-width=".6"/>`;
}

/** sparks rising round the Fires box (over the picture, under the dimming) */
function embers(g: Geo): string {
  const f = g.boxes[0], R = rng(31); let out = '';
  for (let i = 0; i < 46; i++) {
    const x = f.x - 6 + R() * (f.w + 12), y = f.y - 8 + R() * (f.h + 70);
    if (x > f.x - 1 && x < f.x + f.w + 1 && y > f.y - 1 && y < f.y + f.h + 1) continue;
    const rr = 0.18 + R() * 0.45;
    out += `<circle cx="${r(x)}" cy="${r(y)}" r="${r(rr * 3)}" fill="${C.glow}" fill-opacity=".14"/><circle cx="${r(x)}" cy="${r(y)}" r="${r(rr)}" fill="${R() < 0.5 ? '#ffd88a' : C.emberHot}"/>`;
  }
  return out;
}

/** the dimming over the JPEG under every row (fill-opacity only), and the dark ports the Guns cells are set in */
function rowsLayer(g: Geo): string {
  const pad = 1.6, out: string[] = [];
  for (const rw of g.rows) { const b = rw.band; out.push(`<rect x="${r(b.x - pad)}" y="${r(b.y - pad)}" width="${r(b.w + 2 * pad)}" height="${r(b.h + 2 * pad)}" rx="2.2" fill="${C.dim}" fill-opacity=".885" stroke="${C.brass.dark}" stroke-opacity=".55" stroke-width=".3"/>`); }
  const guns = g.rows.find(rw => rw.key === 'guns')!, cells: Rect[] = [...guns.cells, ...g.slots.filter(s => s.kind === 'volley' || s.kind === 'volley2')];
  for (const c of cells) out.push(`<rect x="${r(c.x - 1)}" y="${r(c.y + 0.8)}" width="${r(c.w + 2)}" height="${r(c.h + 0.1)}" rx="1.4" fill="${C.port}" stroke="${C.portEdge}" stroke-width=".3"/>`);
  return out.join('');
}

// ---- the back: the wreck ----
async function wreckScene(w: WreckGeo): Promise<string> {
  const A = w.zones.art, kind = w.kind, K = w.kit, k = 0.9, b = Math.ceil(Math.max(0, (A.w / k - 200) / 2)) + 1, box = K.shipBox(kind, { x: 0, y: 0, scale: 1 });
  const W = 200 + 2 * b, H = 280 + 2 * b, vh = A.h / k, floor = -b + vh * 0.86, s = 150 / box.w * (A.w / k) / 200;
  const U = (mmX: number, mmY: number) => [(mmX - A.x) / k - b, (mmY - A.y) / k - b];
  const L = K.makeLight({ time: 'fog', haze: 0.7, key: { type: 'sun', az: 150, el: 60, color: '#d8b898', power: 0.75 }, fill: { color: '#6a4a46', power: 0.5 } }, { horizon: -b + 10 });
  const water: [string, string] = ['#46302c', '#0f0808'], sand = '#7a6450', sandDark = '#3a2a20';
  const body = K.ship('bo2wr' + kind, L, { kind, x: -b + W * 0.58, y: floor + 6, scale: s, sails: 'furled', heel: 16, seed: 23 });
  const R = rng(41);
  let rays = '';
  for (let i = 0; i < 6; i++) { const x0 = -b + W * (0.35 + i * 0.12 + R() * 0.05), wd = 8 + R() * 16, dx = -60 - R() * 30; rays += `<path d="M${r(x0)} ${-b}h${r(wd)}l${r(dx + wd * 1.6)} ${r(floor + b)}h${r(-wd * 3.2)}z" fill="url(#bo2wray)" opacity="${r(0.5 + R() * 0.5)}"/>`; }
  let sandD = '';
  for (let i = 0; i < 70; i++) sandD += `<ellipse cx="${r(-b + R() * W)}" cy="${r(floor + 4 + R() * 30)}" rx="${r(2 + R() * 6)}" ry="${r(0.4 + R())}" fill="${sandDark}" fill-opacity=".35"/>`;
  // charred planks and spars lying on the sand
  let debris = '';
  for (const [mx, my, len, rot] of [[30, 184, 34, -8], [62, 191, 22, 14], [116, 194, 40, -3], [232, 192, 26, 9], [276, 186, 18, -16]] as const) {
    const [x, y] = U(mx, my), l = len / k;
    debris += `<g transform="rotate(${rot} ${r(x)} ${r(y)})"><rect x="${r(x - l / 2)}" y="${r(y - 2.2)}" width="${r(l)}" height="4.4" rx=".8" fill="#1c0e0a"/><rect x="${r(x - l / 2)}" y="${r(y - 2.2)}" width="${r(l)}" height="1.1" fill="#4a2a1e" opacity=".7"/>` +
      Array.from({ length: Math.floor(l / 3) }, (_, j) => `<path d="M${r(x - l / 2 + 1.5 + j * 3)} ${r(y - 1.6)}v${r(1.2 + R() * 1.6)}" stroke="#070302" stroke-width=".5"/>`).join('') + `</g>`;
  }
  const [gx, gy] = U(44, 187), [px, py] = U(96, 193), [ax, ay] = U(258, 194);
  const gun = fn(w, 'cannon')('bo2wg', L, { x: gx, y: gy, s: 0.42, carriage: false, elev: -6, rot: -4, seed: 4 });
  const shot = fn(w, 'shotPile')('bo2wsp', L, { x: px, y: py, s: 0.75, n: 3, garland: false, seed: 6 });
  const anc = fn(w, 'anchor')('bo2wa', L, { x: ax, y: ay, s: 0.55, rot: -72, seed: 3 });
  let bub = '';
  for (let i = 0; i < 26; i++) { const x = -b + W * (0.45 + R() * 0.3), y = floor - 20 - R() * 160, rr = 0.4 + R() * 1.2; bub += `<circle cx="${r(x)}" cy="${r(y)}" r="${r(rr)}" fill="none" stroke="#e8d2bc" stroke-width=".3" opacity="${r(0.3 + R() * 0.4)}"/>`; }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-b} ${-b} ${W} ${H}"><defs><linearGradient id="bo2wwat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${water[0]}"/><stop offset="1" stop-color="${water[1]}"/></linearGradient>` +
    `<linearGradient id="bo2wray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2d6b4" stop-opacity=".32"/><stop offset=".7" stop-color="#f2d6b4" stop-opacity=".06"/><stop offset="1" stop-color="#f2d6b4" stop-opacity="0"/></linearGradient></defs>` +
    `<rect x="${-b}" y="${-b}" width="${W}" height="${H}" fill="url(#bo2wwat)"/>${rays}${body}<path d="M${-b} ${r(floor + 4)}q${r(W / 4)} -5 ${r(W / 2)} -1t${r(W / 2)} 1V${H}H${-b}Z" fill="${sand}"/>${sandD}${debris}${gun}${shot}${anc}${bub}` +
    `<rect x="${-b}" y="${-b}" width="${W}" height="${H}" fill="${water[1]}" fill-opacity=".24"/></svg>`;
  const url = await w.art(`board-wreck-${kind}`, svg, b), id = `${w.uid}wa`;
  return `<defs><clipPath id="${id}"><rect x="${r(A.x)}" y="${r(A.y)}" width="${r(A.w)}" height="${r(A.h)}" rx="2.4"/></clipPath></defs><g clip-path="url(#${id})"><image href="${url}" x="${r(A.x)}" y="${r(A.y)}" width="${r(W * k)}" height="${r(H * k)}" preserveAspectRatio="none"/></g>` +
    `<rect x="${r(A.x)}" y="${r(A.y)}" width="${r(A.w)}" height="${r(A.h)}" rx="2.4" fill="none" stroke="${C.brass.mid}" stroke-width=".6"/>`;
}

export const material: ShipMaterial = {
  async a(g: Geo): Promise<Layers> {
    const F = { x: 11.2, y: 11.2, w: g.page.w - 22.4, h: 197 - 11.2 }, col = g.zones.col, u = g.uid;
    const glowB = `<defs><radialGradient id="${u}gb" cx=".5" cy="1" r=".75"><stop offset="0" stop-color="${C.glow}" stop-opacity=".4"/><stop offset="1" stop-color="${C.glow}" stop-opacity="0"/></radialGradient></defs><rect x="${F.x}" y="120" width="${F.w}" height="77" fill="url(#${u}gb)"/>`;
    const under = sheet(g, { band: C.band, line: C.hair, ground: C.ground, w: 1.4 }) + charred(F, g.ship.hull * 7 + 3, `${u}cw`) + glowB +
      flag(col.x + col.w / 2, col.y + col.h - 22, 62, `${u}fl`) + await sideArt(g) + rowsLayer(g);
    const W = g.page.w, H = g.page.h, cg = `${u}cg`;
    const rivets = g.rows.filter(rw => rw.key !== 'hull').map(rw => `<circle cx="${r(rw.band.x + rw.band.w + 0.6)}" cy="${r(rw.band.y + rw.band.h + 0.6)}" r=".6" fill="${C.brass.mid}" stroke="${C.brass.dark}" stroke-width=".2"/>`).join('');
    const over = `<defs>${brassGrad(cg)}</defs>` + corner(8.6, 8.6, 1, 1, cg) + corner(W - 8.6, 8.6, -1, 1, cg) + corner(8.6, H - 8.6, 1, -1, cg) + corner(W - 8.6, H - 8.6, -1, -1, cg) + rivets;
    const s = g.scope;
    return { under, over, css: `${s} .bo2-box{border-color:#9a6a2a;box-shadow:.5mm .7mm 0 rgba(12,3,1,.6)}` };
  },
  async b(g: Geo): Promise<Layers> {
    // concept B is not this agent's task: the earlier placeholder look (a chart, brass rulers, an engraving)
    return simpleMaterial({
      wood: { base: '#2a1512', seam: '#0d0605', grain: '#3e211b', nails: '#8a6a3a' }, band: '#8A2E1C', hair: '#c8913a',
      sky: ['#d8c2b0', '#f1e4d4'], sea: ['#6a5a56', '#33282a'], dim: '#fdf6ea',
      chart: { paper: '#ecdcc0', line: '#c4a582', coast: '#d9bf98' }, brass: { light: '#e9c27a', mid: '#a8782e', dark: '#4e3010' },
      note: '#fff7ec', noteLine: '#c79a7a', pin: '#8a2e1c',
      wreck: { water: ['#4a3c3a', '#1a1213'], sand: '#9a8a72', sandDark: '#5e4e40' }
    }).b(g);
  },
  async wreck(w: WreckGeo): Promise<Layers> {
    return { under: `<rect x="${w.zones.art.x}" y="${w.zones.art.y}" width="${w.zones.art.w}" height="${w.zones.art.h}" rx="2.4" fill="#0f0808"/>` + await wreckScene(w) };
  }
};
