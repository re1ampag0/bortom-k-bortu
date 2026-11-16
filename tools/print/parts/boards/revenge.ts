// «Месть королевы Анны» — the material of its board: dark red and black, charred wood, wrought brass, firelight.
// A («у борта»): the Revenge's own side in a close-up at dusk, lit by fire from the right. The scale is set by the gun
// ports: the kit ports stand exactly under the Guns cell «0» and under «Залп дан» (one pitch of the ports = the distance
// between them), the port row lies on the Guns row, the cap rail just under the Crew cells (the crew at the bulwark),
// the main course behind the Sails row, the tarred planking under the Hull row; the Fires box sits on the quarterdeck,
// and the glow of fire comes from it. Every Guns cell is set in a dark port. Round it — charred planks with embers in
// the cracks, wrought brass corners; in the free foot of the right column Blackbeard's flag is nailed to the wood.
// The back «Затонул»: the wreck on a murky red-brown floor, light shafts, a gun, shot and charred planks on the sand.
import { ENGRAVING, type Geo, type Layers, type Rect, type RowGeo, type ShipMaterial, type SlotGeo, type WreckGeo } from './frame';
import { compass, engraving, mix, rng, rope, sheet } from './paint';

type Fn = (u: string, L: unknown, o: Record<string, unknown>) => string;
const r = (n: number) => Math.round(n * 100) / 100;
const fn = (g: { kit: Record<string, unknown> }, name: string) => g.kit[name] as Fn;

// ---- colours ----
const C = {
  band: '#1a0907', hair: '#b07a34', ground: '#140806',
  wood: '#24110d', seam: '#060202', char: '#0b0504', sheen: '#4a2a20', ember: '#ff5a1a', emberHot: '#ffb04a',
  brass: { light: '#f0cd85', mid: '#b07f32', dark: '#4a2c0c' },
  port: '#2c0b08', portEdge: '#7a2618', glow: '#ff7a2a',
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
function corner(cx: number, cy: number, sx: number, sy: number, grad: string, L = 17, w = 2.3): string {
  const p = (x: number, y: number) => `${r(cx + sx * x)} ${r(cy + sy * y)}`;
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

/** the dark ports the Guns cells are set in (the frame lays its plates under the words; the side stays open round them) */
function rowsLayer(g: Geo): string {
  const out: string[] = [];
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

// ---- B: the captain's table ----
// A sea chart scorched at its edges, lying on the charred table; the tracks are set into wrought brass rulers (Crew,
// Hull), a knotted log line (Sails) and a slow-match (Guns) that runs on past «Залп дан» and smoulders; the ship is an
// engraving in a black frame with brass corners; a candle, brass dividers and a compass rose in the free foot of the
// right column; the notes of the right column pinned with red pins; the Fires box glows.
const T = {
  paper: '#f6ecd6', grid: '#dcc7a0', rhumb: '#e3d1ad', scorch: '#6a3414', burnt: '#1c0b06',
  coast: '#ecdcb6', coastLine: '#8a6a48', course: '#8A2E1C', sound: '#a88a64',
  hemp: '#b8915c', hempDark: '#5a3e22', match: '#4a3424', matchLight: '#9a7a52',
  note: '#fffaf0', noteLine: '#b98a6a', pin: '#a8261a', ink: '#6a4a2c'
};
/** a ragged round blob (a burnt hole, an island) */
function blob(cx: number, cy: number, R: number, seed: number, n = 30): string {
  const Rn = rng(seed); let d = '';
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, rr = R * (0.8 + Rn() * 0.32); d += `${i ? 'L' : 'M'}${r(cx + Math.cos(a) * rr)} ${r(cy + Math.sin(a) * rr)}`; }
  return d + 'Z';
}
/** the chart: paper with a ragged scorched edge and burnt bites where no word stands (the foot corners, the right edge
 *  under the props), a grid of degrees, rhumb lines from the rose, a barrier coast and the course to it */
function scorchedChart(g: Geo, I: Rect): string {
  const R = rng(g.ship.hull * 3 + 7), step = 1.2, pts: string[] = [], id = `${g.uid}ch`;
  const sides: [number, number, number, number][] = [[I.x, I.y, 1, 0], [I.x + I.w, I.y, 0, 1], [I.x + I.w, I.y + I.h, -1, 0], [I.x, I.y + I.h, 0, -1]];
  for (const [x0, y0, dx, dy] of sides) {
    const len = dx ? I.w : I.h, nx = -dy, ny = dx;
    for (let t = 0; t < len; t += step) { const d = 0.45 + R() * 0.5; pts.push(`${r(x0 + dx * t + nx * d)} ${r(y0 + dy * t + ny * d)}`); }
  }
  const edge = `M${pts.join('L')}Z`, X1 = I.x + I.w, Y1 = I.y + I.h;
  const bites = [blob(I.x + 3, Y1 + 1, 11, 3), blob(X1 - 2, Y1 + 1, 12, 5), blob(X1 + 1.2, 150, 4.6, 8), blob(150, Y1 + 1.4, 4, 11), blob(84, Y1 + 1.2, 3.2, 13)].join('');
  const rose: [number, number] = [g.zones.col.x + 15, g.zones.col.y + g.zones.col.h - 16];
  const out: string[] = [`<rect x="${r(I.x)}" y="${r(I.y)}" width="${r(I.w)}" height="${r(I.h)}" fill="${T.paper}"/>`];
  let grid = '', rh = '';
  for (let x = I.x + 20; x < X1; x += 24) grid += `M${r(x)} ${r(I.y)}V${r(Y1)}`;
  for (let y = I.y + 18; y < Y1; y += 24) grid += `M${r(I.x)} ${r(y)}H${r(X1)}`;
  for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; rh += `M${r(rose[0])} ${r(rose[1])}l${r(Math.cos(a) * 340)} ${r(Math.sin(a) * 340)}`; }
  out.push(`<path d="${grid}" stroke="${T.grid}" stroke-width=".2" fill="none"/><path d="${rh}" stroke="${T.rhumb}" stroke-width=".18" fill="none"/>`);
  out.push(coast(g));
  // the scorch: a brown band inward from every burnt edge, darkest at the edge
  out.push(`<path d="${edge}${bites}" fill="none" stroke="${T.scorch}" stroke-width="4.2" stroke-opacity=".16"/><path d="${edge}${bites}" fill="none" stroke="${T.scorch}" stroke-width="2.2" stroke-opacity=".3"/><path d="${edge}${bites}" fill="none" stroke="${T.burnt}" stroke-width=".9" stroke-opacity=".85"/>`);
  // embers on the rims of the bites
  const Re = rng(19); let emb = '';
  for (const [cx, cy, Rb, a0, da] of [[I.x + 3, Y1 + 1, 11, 1.5, 0.5], [X1 - 2, Y1 + 1, 12, 1, 0.5], [X1 + 1.2, 150, 4.6, 0.5, 1]] as const) for (let i = 0; i < 7; i++) {
    const a = (a0 + Re() * da) * Math.PI, rr = Rb * (0.85 + Re() * 0.2), x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
    if (x < I.x || x > X1 || y < I.y || y > Y1) continue;
    emb += `<circle cx="${r(x)}" cy="${r(y)}" r="1.3" fill="${C.ember}" fill-opacity=".2"/><circle cx="${r(x)}" cy="${r(y)}" r="${r(0.25 + Re() * 0.3)}" fill="${Re() < 0.5 ? C.emberHot : C.ember}"/>`;
  }
  return `<defs><clipPath id="${id}a"><path d="${edge}"/></clipPath><clipPath id="${id}b"><path d="M0 0H${g.page.w}V${g.page.h}H0Z${bites}" clip-rule="evenodd"/></clipPath></defs>` +
    `<g clip-path="url(#${id}a)"><g clip-path="url(#${id}b)">${out.join('')}</g></g>${emb}`;
}
/** a barrier coast with an inlet between the Crew and the Guns rows, sounding dots, and the dashed course of the
 *  Revenge between the Guns and the Hull rows to a cross — all in the free pockets of the tracks, under no word */
function coast(g: Geo): string {
  const crew = g.rows.find(rw => rw.key === 'crew')!, guns = g.rows.find(rw => rw.key === 'guns')!, hull = g.rows.find(rw => rw.key === 'hull')!;
  const y0 = crew.cells[0].y + crew.cells[0].h + 3.6, y1 = guns.top - 1.6, x0 = 60, x1 = 114, R = rng(23);
  const isl = (a: number, b: number, k: number) => {
    const n = 14, top: string[] = [], bot: string[] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = a + (b - a) * t, yc = y1 - 3.2 - (x - x0) / (x1 - x0) * (y1 - y0 - 6.4) + Math.sin(t * 5 + k) * 0.5, w = 0.4 + Math.sin(t * Math.PI) * (1.3 + R() * 0.4);
      top.push(`${r(x)} ${r(yc - w)}`); bot.unshift(`${r(x)} ${r(yc + w)}`);
    }
    return `M${top.join('L')}L${bot.join('L')}Z`;
  };
  const land = isl(x0 + 1, 85, 1) + isl(88.5, x1 - 1, 3);
  const off = (dy: number) => `M${r(x0)} ${r(y1 - 3.2 + dy)}L${r(x1)} ${r(y0 + 3.2 + dy)}`;
  let dots = '';
  for (let i = 0; i < 12; i++) { const t = R(), x = x0 + 2 + t * (x1 - x0 - 4), y = y1 - 3.2 - t * (y1 - y0 - 6.4) - 2.2 - R() * 3; if (y > y0 + 0.5) dots += `<circle cx="${r(x)}" cy="${r(y)}" r=".28" fill="${T.sound}"/>`; }
  const cy0 = guns.cells[0].y + guns.cells[0].h + 6.5, cy1 = hull.top - 1.8, cx0 = 44, cx1 = 108;
  const course = `M${cx0} ${r(cy1 - 0.4)}C${cx0 + 20} ${r(cy1 - 3)} ${cx0 + 34} ${r(cy0 + 1)} ${cx1 - 3} ${r(cy0 + 1.6)}`;
  const X = (x: number, y: number) => `M${r(x - 1.3)} ${r(y - 1.3)}l2.6 2.6M${r(x + 1.3)} ${r(y - 1.3)}l-2.6 2.6`;
  return `<path d="${off(1.6)}${off(3)}" stroke="${T.grid}" stroke-width=".22" fill="none" stroke-dasharray="2.4 .8"/>` +
    `<path d="${land}" fill="${T.coast}" stroke="${T.coastLine}" stroke-width=".28"/>${dots}` +
    `<path d="${course}" stroke="${T.course}" stroke-width=".4" fill="none" stroke-dasharray="1.6 1.1" stroke-opacity=".75"/><path d="${X(cx1, cy0 + 1.6)}" stroke="${T.course}" stroke-width=".5"/>`;
}
/** a wrought brass ruler the cells of a row are set into: seen in the gaps (a rivet in each), at its ends, its lower lip
 *  with ticks; its top stays under the cells (the numbers stand on the chart) */
function wroughtRuler(rw: RowGeo, ext: number, id: string): string {
  const c0 = rw.cells[0], cl = rw.cells[rw.cells.length - 1], x = rw.x0 - 0.9, y = c0.y - 0.1, x2 = cl.x + cl.w + ext, h = c0.h + 0.75, w = x2 - x;
  let ticks = '', rv = '';
  for (let t = c0.x, i = 0; t < x2 - 0.5; t += (cl.x - c0.x) / Math.max(1, rw.cells.length - 1) / 5 || 2.9, i++) ticks += `M${r(t)} ${r(y + h)}v${i % 5 ? -0.45 : -0.75}`;
  for (let i = 0; i + 1 < rw.cells.length; i++) { const gx = (rw.cells[i].x + rw.cells[i].w + rw.cells[i + 1].x) / 2; rv += [-3.4, 3.4].map(d => `<circle cx="${r(gx)}" cy="${r(rw.cy + d)}" r=".48" fill="${C.brass.light}" stroke="${C.brass.dark}" stroke-width=".15"/>`).join(''); }
  const hole = ext > 3 ? `<circle cx="${r(x2 - ext / 2 + 0.2)}" cy="${r(rw.cy)}" r="1.15" fill="${T.paper}" stroke="${C.brass.dark}" stroke-width=".35"/><circle cx="${r(x2 - ext / 2 + 0.2)}" cy="${r(rw.cy)}" r="1.7" fill="none" stroke="${C.brass.light}" stroke-width=".25"/>` : '';
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6dc9c"/><stop offset=".22" stop-color="#ffbe6a"/><stop offset=".55" stop-color="${C.brass.mid}"/><stop offset=".88" stop-color="#6a4214"/><stop offset="1" stop-color="${C.brass.dark}"/></linearGradient></defs>` +
    `<rect x="${r(x + 0.5)}" y="${r(y + 0.6)}" width="${r(w)}" height="${r(h)}" rx="1" fill="#1a0804" fill-opacity=".3"/>` +
    `<rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" rx="1" fill="url(#${id})" stroke="${C.brass.dark}" stroke-width=".3"/><path d="${ticks}" stroke="${C.brass.dark}" stroke-width=".2"/>${rv}${hole}`;
}
/** the log line under the Sails: a laid rope through the cells, a knot in every gap, a whipped and frayed end */
function logLine(rw: RowGeo, ext: number): string {
  const y = rw.cy, cl = rw.cells[rw.cells.length - 1], x1 = rw.x0 - 1.2, x2 = cl.x + cl.w + ext, o = { color: T.hemp, dark: T.hempDark, w: 3 };
  let knots = '';
  for (let i = 0; i + 1 < rw.cells.length; i++) {
    const gx = (rw.cells[i].x + rw.cells[i].w + rw.cells[i + 1].x) / 2;
    knots += `<ellipse cx="${r(gx)}" cy="${r(y)}" rx="2" ry="2.5" fill="${T.hemp}" stroke="${T.hempDark}" stroke-width=".3"/><path d="M${r(gx - 1.3)} ${r(y - 1.5)}Q${r(gx + 1.6)} ${r(y)} ${r(gx - 1.3)} ${r(y + 1.5)}M${r(gx + 1.2)} ${r(y - 1.6)}l-.9 3.2" stroke="${T.hempDark}" stroke-width=".28" fill="none"/>`;
  }
  const whip = [0.4, 0.95, 1.5].map(d => `<rect x="${r(x2 - 2.2 + d)}" y="${r(y - 1.35)}" width=".38" height="2.7" fill="${T.hempDark}"/>`).join('');
  const fray = [-0.9, -0.3, 0.3, 0.9].map((d, i) => `M${r(x2)} ${r(y + d * 0.9)}l${r(0.9 + (i % 2) * 0.3)} ${r(d * 0.7)}`).join('');
  return `<line x1="${r(x1 + 0.4)}" y1="${r(y + 0.7)}" x2="${r(x2 + 0.4)}" y2="${r(y + 0.7)}" stroke="#1a0804" stroke-opacity=".25" stroke-width="2.6"/>` + rope(x1, y, x2, y, o) + knots + whip +
    `<path d="${fray}" stroke="${T.hemp}" stroke-width=".3" stroke-linecap="round"/>`;
}
/** the slow-match under the Guns: a tarred cord through the cells and «Залп дан», then loose, smouldering at its end */
function slowMatch(rw: RowGeo, vol: SlotGeo, id: string): string {
  const y = rw.cy, xs = rw.x0 - 1.2, xe = vol.x + vol.w, tx = xe + 23.5, ty = y - 7.2;
  const d = `M${r(xs)} ${r(y)}H${r(xe)}C${r(xe + 7)} ${r(y)} ${r(xe + 8.5)} ${r(y + 7)} ${r(xe + 14)} ${r(y + 5.6)}C${r(xe + 20)} ${r(y + 4)} ${r(xe + 18.5)} ${r(ty + 3.4)} ${r(tx)} ${r(ty)}`;
  return `<defs><radialGradient id="${id}"><stop offset="0" stop-color="#fff2b0"/><stop offset=".45" stop-color="${C.ember}"/><stop offset="1" stop-color="#8a1a08"/></radialGradient></defs>` +
    `<path d="${d}" stroke="#1a0804" stroke-opacity=".25" stroke-width="1.6" fill="none" transform="translate(.4 .6)"/>` +
    `<path d="${d}" stroke="${T.match}" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${T.matchLight}" stroke-width="1.2" fill="none" stroke-dasharray=".35 .6" stroke-opacity=".75"/>` +
    `<circle cx="${r(tx)}" cy="${r(ty)}" r="3.4" fill="${C.glow}" fill-opacity=".16"/><circle cx="${r(tx)}" cy="${r(ty)}" r="1.9" fill="${C.glow}" fill-opacity=".28"/>` +
    `<circle cx="${r(tx - 0.5)}" cy="${r(ty + 0.4)}" r=".95" fill="${C.char}"/><circle cx="${r(tx)}" cy="${r(ty)}" r=".75" fill="url(#${id})"/>` +
    `<path d="M${r(tx + 0.3)} ${r(ty - 0.9)}q1.4 -1.1 .2 -2.2t.6 -2.1M${r(tx + 0.9)} ${r(ty - 0.6)}q1.2 -.6 .8 -1.6" stroke="#8a7a70" stroke-width=".3" fill="none" stroke-opacity=".6" stroke-linecap="round"/>`;
}
/** a red-headed pin (in Layers.over, at a corner of a field the frame drew, clear of its words) */
function pin(x: number, y: number, id: string): string {
  return `<defs><radialGradient id="${id}" cx=".35" cy=".32" r=".7"><stop offset="0" stop-color="#ffd8c4"/><stop offset=".42" stop-color="${T.pin}"/><stop offset="1" stop-color="#2a0603"/></radialGradient></defs>` +
    `<circle cx="${r(x + 0.35)}" cy="${r(y + 0.45)}" r="1.25" fill="#140402" fill-opacity=".4"/><circle cx="${r(x)}" cy="${r(y)}" r="1.25" fill="url(#${id})"/>`;
}
/** the free foot of the right column: a compass rose, brass dividers, a candle in a wrought holder and its light */
function tableProps(g: Geo, I: Rect): string {
  const c = g.zones.col, x0 = c.x, y1 = c.y + c.h, u = g.uid;
  const rose = compass(x0 + 15, y1 - 16, 11.5, { line: T.ink, fill: T.paper, accent: T.course });
  // dividers: two tapered legs from a hinge, steel points
  const hx = x0 + 45, hy = y1 - 41, legs: [number, number][] = [[x0 + 34, y1 - 3.5], [x0 + 58.5, y1 - 7]];
  const leg = (tx: number, ty: number, dx = 0, dy = 0, fillC = `url(#${u}dv)`) => {
    const L = Math.hypot(tx - hx, ty - hy), ux = (tx - hx) / L, uy = (ty - hy) / L, px = -uy, py = ux, w0 = 1.05;
    const sx = hx + ux * (L - 3.2), sy = hy + uy * (L - 3.2);
    return `<path d="M${r(hx + px * w0 + dx)} ${r(hy + py * w0 + dy)}L${r(sx + px * 0.45 + dx)} ${r(sy + py * 0.45 + dy)}L${r(sx - px * 0.45 + dx)} ${r(sy - py * 0.45 + dy)}L${r(hx - px * w0 + dx)} ${r(hy - py * w0 + dy)}Z" fill="${fillC}" stroke="${dx ? 'none' : C.brass.dark}" stroke-width=".22"${dx ? ' fill-opacity=".28"' : ''}/>` +
      (dx ? '' : `<path d="M${r(sx + px * 0.45)} ${r(sy + py * 0.45)}L${r(tx)} ${r(ty)}L${r(sx - px * 0.45)} ${r(sy - py * 0.45)}Z" fill="#5a5450" stroke="#2a2420" stroke-width=".15"/>`);
  };
  const dividers = `<defs>${brassGrad(`${u}dv`)}</defs>` + legs.map(([a, b]) => leg(a, b, 0.7, 0.9, '#140402')).join('') + legs.map(([a, b]) => leg(a, b)).join('') +
    `<circle cx="${r(hx)}" cy="${r(hy)}" r="2.3" fill="url(#${u}dv)" stroke="${C.brass.dark}" stroke-width=".3"/><circle cx="${r(hx)}" cy="${r(hy)}" r=".8" fill="${C.brass.light}" stroke="${C.brass.dark}" stroke-width=".2"/>`;
  // the candle: a tallow stub in a wrought brass dish with a ring handle, its flame, the light it throws on the chart
  const cx = x0 + 73, by = y1 - 4.5, ct = by - 22, fx = cx, fy = ct - 3.4, cw = 5.6;
  const glow = `<defs><radialGradient id="${u}cl" cx="${r(fx)}" cy="${r(fy)}" r="30" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffb04a" stop-opacity=".5"/><stop offset=".35" stop-color="#ff9a3a" stop-opacity=".2"/><stop offset="1" stop-color="#ff8a2a" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="${u}cw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d8c09a"/><stop offset=".55" stop-color="#fff2d6"/><stop offset="1" stop-color="#b89a70"/></linearGradient>` +
    `<radialGradient id="${u}cf" cx=".5" cy=".7" r=".6"><stop offset="0" stop-color="#fff8d0"/><stop offset=".5" stop-color="#ffc45a"/><stop offset="1" stop-color="#ff7a1a"/></radialGradient></defs>` +
    `<clipPath id="${u}cc"><rect x="${r(I.x)}" y="${r(I.y)}" width="${r(I.w)}" height="${r(I.h)}"/></clipPath>`;
  const drip = `M${r(cx - cw / 2)} ${r(ct + 0.6)}q.4 3 .1 5.2q.5 .9 .9 -.1q-.2 -2.6 .4 -4.6M${r(cx + 1.1)} ${r(ct + 0.4)}q.3 2 .1 3.4q.4 .6 .7 0q-.1 -1.8 .3 -3.2`;
  const candle = `<ellipse cx="${r(cx + 1)}" cy="${r(by + 1.1)}" rx="9.4" ry="2.6" fill="#140402" fill-opacity=".3"/>` +
    `<circle cx="${r(cx + 10.2)}" cy="${r(by - 0.6)}" r="2.6" fill="none" stroke="${C.brass.dark}" stroke-width="1.2"/><circle cx="${r(cx + 10.2)}" cy="${r(by - 0.6)}" r="2.6" fill="none" stroke="${C.brass.mid}" stroke-width=".6"/>` +
    `<ellipse cx="${r(cx)}" cy="${r(by)}" rx="8.6" ry="2.5" fill="url(#${u}cg2)" stroke="${C.brass.dark}" stroke-width=".3"/><ellipse cx="${r(cx)}" cy="${r(by - 0.5)}" rx="6.4" ry="1.6" fill="none" stroke="${C.brass.light}" stroke-width=".3" stroke-opacity=".8"/>` +
    `<rect x="${r(cx - 3.6)}" y="${r(by - 3)}" width="7.2" height="2.6" rx=".8" fill="url(#${u}cg2)" stroke="${C.brass.dark}" stroke-width=".25"/>` +
    `<rect x="${r(cx - cw / 2)}" y="${r(ct)}" width="${cw}" height="${r(by - 2.6 - ct)}" fill="url(#${u}cw)" stroke="#8a6a44" stroke-width=".2"/><ellipse cx="${r(cx)}" cy="${r(ct)}" rx="${r(cw / 2)}" ry=".8" fill="#fff4dc" stroke="#a88a60" stroke-width=".2"/>` +
    `<path d="${drip}" fill="#fff0d0" stroke="#b89a70" stroke-width=".15"/>` +
    `<path d="M${r(cx)} ${r(ct)}q.3 -.9 -.1 -1.7" stroke="#1a0a04" stroke-width=".35" fill="none"/>` +
    `<path d="M${r(fx)} ${r(fy - 4.2)}C${r(fx + 1.9)} ${r(fy - 1.4)} ${r(fx + 1.6)} ${r(fy + 1.6)} ${r(fx)} ${r(fy + 1.9)}C${r(fx - 1.6)} ${r(fy + 1.6)} ${r(fx - 1.9)} ${r(fy - 1.4)} ${r(fx)} ${r(fy - 4.2)}Z" fill="url(#${u}cf)"/>` +
    `<ellipse cx="${r(fx)}" cy="${r(fy + 0.6)}" rx=".55" ry="1.1" fill="#fffbe8"/>`;
  return `<defs>${brassGrad(`${u}cg2`)}</defs>${glow}<g clip-path="url(#${u}cc)"><rect x="${r(fx - 30)}" y="${r(fy - 30)}" width="60" height="60" fill="url(#${u}cl)"/></g>${rose}${dividers}${candle}`;
}
/** the engraving of the Revenge in a charred black frame with a brass bead and wrought brass corners */
async function engravingB(g: Geo): Promise<string> {
  const E = ENGRAVING, id = `${g.uid}eg`;
  const inner = await engraving(g, { paper: '#f6ecd8', ink: '#2a0e0a', frame: '#2a1410', frameDark: '#0c0504', light: g.kit.LIGHTS.revenge as Record<string, unknown> });
  return `<defs>${brassGrad(id)}</defs><rect x="1.3" y="1.9" width="${E.w - 1.2}" height="${E.h - 1.2}" rx="1.4" fill="#140402" fill-opacity=".35"/>` + inner +
    `<rect x="2.1" y="2.1" width="${E.w - 4.2}" height="${E.h - 4.2}" fill="none" stroke="${C.brass.mid}" stroke-width=".35"/>` +
    corner(0.6, 0.6, 1, 1, id, 9, 1.7) + corner(E.w - 0.6, 0.6, -1, 1, id, 9, 1.7) + corner(0.6, E.h - 0.6, 1, -1, id, 9, 1.7) + corner(E.w - 0.6, E.h - 0.6, -1, -1, id, 9, 1.7);
}

export const material: ShipMaterial = {
  async a(g: Geo): Promise<Layers> {
    const F = { x: 11.2, y: 11.2, w: g.page.w - 22.4, h: 197 - 11.2 }, col = g.zones.col, u = g.uid;
    const glowB = `<defs><radialGradient id="${u}gb" cx=".5" cy="1" r=".75"><stop offset="0" stop-color="${C.glow}" stop-opacity=".4"/><stop offset="1" stop-color="${C.glow}" stop-opacity="0"/></radialGradient></defs><rect x="${F.x}" y="120" width="${F.w}" height="77" fill="url(#${u}gb)"/>`;
    const under = sheet(g, { band: C.band, line: C.hair, ground: C.ground, w: 1.4 }) + charred(F, g.ship.hull * 7 + 3, `${u}cw`) + glowB +
      flag(col.x + col.w / 2, col.y + col.h - 22, 62, `${u}fl`) + await sideArt(g) + rowsLayer(g);
    const W = g.page.w, H = g.page.h, cg = `${u}cg`;
    const over = `<defs>${brassGrad(cg)}</defs>` + corner(8.6, 8.6, 1, 1, cg) + corner(W - 8.6, 8.6, -1, 1, cg) + corner(8.6, H - 8.6, 1, -1, cg) + corner(W - 8.6, H - 8.6, -1, -1, cg);
    const s = g.scope;
    return { under, over, css: `${s} .bo2-box{border-color:#9a6a2a;box-shadow:.5mm .7mm 0 rgba(12,3,1,.6)}` };
  },
  async b(g: Geo): Promise<Layers> {
    const W = g.page.w, H = g.page.h, u = g.uid, I = { x: 9.6, y: 9.6, w: W - 19.2, h: H - 19.2 };
    const rows = (k: string) => g.rows.find(rw => rw.key === k)!, vol = g.slots.find(s => s.kind === 'volley')!, fire = g.boxes[0];
    const tracks = logLine(rows('sails'), 1.4) + wroughtRuler(rows('crew'), 1.6, `${u}rc`) + wroughtRuler(rows('hull'), 4.6, `${u}rh`) + slowMatch(rows('guns'), vol, `${u}sm`);
    const fireGlow = `<defs><radialGradient id="${u}fg" cx="${r(fire.x + fire.w / 2)}" cy="${r(fire.y + fire.h * 0.7)}" r="${r(fire.w * 0.62)}" gradientUnits="userSpaceOnUse"><stop offset=".55" stop-color="${C.glow}" stop-opacity=".34"/><stop offset="1" stop-color="${C.glow}" stop-opacity="0"/></radialGradient></defs>` +
      `<rect x="${r(fire.x - 6)}" y="${r(fire.y - 1)}" width="${r(fire.w + 12)}" height="${r(fire.h + 8)}" fill="url(#${u}fg)"/>`;
    const under = sheet(g, { band: C.band, line: C.hair, ground: C.ground, w: 1.4 }) + charred(I, g.ship.hull * 5 + 1, `${u}tw`) + scorchedChart(g, I) + fireGlow + tracks + tableProps(g, I);
    const cg = `${u}cg`;
    const over = `<defs>${brassGrad(cg)}</defs>` + corner(8.6, 8.6, 1, 1, cg) + corner(W - 8.6, 8.6, -1, 1, cg) + corner(8.6, H - 8.6, 1, -1, cg) + corner(W - 8.6, H - 8.6, -1, -1, cg) +
      pin(fire.x + fire.w - 1.9, fire.y + 1.9, `${u}pf`);
    const s = g.scope, pinBg = `radial-gradient(circle at 35% 32%,#ffd8c4 0,${T.pin} 42%,#2a0603 100%)`;
    const css = `${s} .bo2-col .bo2-box{background:${T.note};border-color:${T.noteLine};box-shadow:.6mm .8mm 0 rgba(26,8,4,.3)}` +
      `${s} .bo2-col .bo2-legend{background:#fcf1d2;border-color:${C.brass.mid}}` +
      `${s} .bo2-ab{transform:rotate(-.35deg)}${s} .bo2-legend{transform:rotate(.45deg)}${s} .bo2-powder{transform:rotate(-.6deg)}` +
      `${s} .bo2-col .bo2-box::after{content:'';position:absolute;right:1.7mm;top:.6mm;width:2.5mm;height:2.5mm;border-radius:50%;background:${pinBg};box-shadow:.3mm .4mm 0 rgba(20,4,2,.4)}`;
    return { under, over, css, engraving: await engravingB(g) };
  },
  async wreck(w: WreckGeo): Promise<Layers> {
    return { under: `<rect x="${w.zones.art.x}" y="${w.zones.art.y}" width="${w.zones.art.w}" height="${w.zones.art.h}" rx="2.4" fill="#0f0808"/>` + await wreckScene(w) };
  }
};
