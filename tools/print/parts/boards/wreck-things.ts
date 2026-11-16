// Own drawings of the things on the sea floor of the backs «Затонул» (wreck-props.ts puts them into the sand and ages
// them). Each is drawn in its local frame: the foot at (0, 0), x right, y down (up is minus), 1 = 1 mm at s = 1, lit
// from the upper left. Only own shapes: the Company's mark is a merchant's mark of our own (a staff with a pennant over
// a heart in a ring), no emblem from the films.
type P = [number, number];
const f = (n: number) => String(Math.round(n * 100) / 100);
const hex = (c: string) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const mix = (a: string, b: string, k: number) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * k).toString(16).padStart(2, '0')).join('');
const lin = (id: string, stops: [number, string, number?][], x1 = 0, y1 = 0, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`;
const rad = (id: string, stops: [number, string, number?][], cx = 0.35, cy = 0.3, r = 0.8) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</radialGradient>`;
const pts = (p: P[]) => p.map(q => `${f(q[0])},${f(q[1])}`).join(' ');
const poly = (p: P[]) => `M${pts(p).replace(/ /g, 'L')}Z`;
/** a jagged run from a to b: n teeth of depth d */
function jag(a: P, b: P, n: number, d: number, R: () => number): P[] {
  const out: P[] = [], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  for (let i = 1; i < n; i++) { const t = (i + (R() - 0.5) * 0.6) / n, k = (i % 2 ? 1 : -0.5) * d * (0.4 + R() * 0.9); out.push([a[0] + dx * t + nx * k, a[1] + dy * t + ny * k]); }
  return out;
}
/** irregular blotches inside a box (rust crust, peeled paint): n blobs of size r */
function blots(x0: number, y0: number, x1: number, y1: number, n: number, r: number, color: string, op: number, R: () => number): string {
  let d = '';
  for (let i = 0; i < n; i++) {
    const cx = x0 + R() * (x1 - x0), cy = y0 + R() * (y1 - y0), rr = r * (0.4 + R() * 0.9), m = 7, ps: P[] = [];
    for (let k = 0; k < m; k++) { const a = (k / m) * Math.PI * 2, q = rr * (0.6 + R() * 0.6); ps.push([cx + Math.cos(a) * q, cy + Math.sin(a) * q * 0.8]); }
    d += poly(ps);
  }
  return `<path d="${d}" fill="${color}" fill-opacity="${op}"/>`;
}
const pits = (x0: number, y0: number, x1: number, y1: number, n: number, R: () => number, r = 0.22) => {
  let o = '';
  for (let i = 0; i < n; i++) { const x = x0 + R() * (x1 - x0), y = y0 + R() * (y1 - y0), q = r * (0.5 + R()); o += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(q * 1.5)}" fill="#a0602e" fill-opacity=".5"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(q)}" fill="#120c08" fill-opacity=".8"/>`; }
  return o;
};

// ---- iron ----
/** a heap of round shot gone matte: 3 to 5 balls (three on the sand, the rest on them), a crust of orange rust, pits */
export function shotHeap(id: string, R: () => number, n = 4): string {
  const r = 2.7, at: P[] = [[-5.3, -2.6], [0.1, -2.75], [5.4, -2.55], [-2.6, -7.1], [2.8, -7.2]].slice(0, Math.max(3, Math.min(5, n))) as P[];
  if (n === 4) at[3] = [-2.4, -7.15];
  let out = `<defs>${rad(id + 'g', [[0, '#625c56'], [0.45, '#36312d'], [0.85, '#191614'], [1, '#0e0c0b']], 0.36, 0.3, 0.78)}</defs>`;
  at.forEach(([x, y], i) => {
    const cid = `${id}c${i}`;
    if (y < -5) out += `<ellipse cx="${f(x + 0.6)}" cy="${f(y + r * 0.85)}" rx="${f(r * 0.9)}" ry="${f(r * 0.32)}" fill="#000" fill-opacity=".5"/>`;
    out += `<clipPath id="${cid}"><circle cx="${f(x)}" cy="${f(y)}" r="${r}"/></clipPath><circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="url(#${id}g)"/>` +
      `<g clip-path="url(#${cid})">${blots(x - r, y - r * 0.6, x + r, y + r, 5, 1.1, '#7a3c18', 0.75, R)}${blots(x - r, y - r * 0.2, x + r, y + r, 4, 0.7, '#a85a26', 0.6, R)}${blots(x - r, y - r, x + r * 0.3, y, 2, 0.6, '#2a2420', 0.6, R)}${pits(x - r, y - r, x + r, y + r, 4, R, 0.18)}` +
      `<path d="M${f(x - r * 0.9)} ${f(y - r * 0.15)}A${r} ${f(r * 0.3)} 0 0 0 ${f(x + r * 0.9)} ${f(y - r * 0.1)}" fill="none" stroke="#0e0c0a" stroke-width=".18" stroke-opacity=".6"/>` +
      `<circle cx="${f(x - r * 0.25)}" cy="${f(y - r * 0.2)}" r="${f(r * 1.05)}" fill="none" stroke="#000" stroke-width="${f(r * 0.5)}" stroke-opacity=".22" transform="translate(${f(r * 0.3)} ${f(r * 0.3)})"/></g>` +
      `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="none" stroke="#0c0a09" stroke-width=".22"/>`;
  });
  return out;
}

/** a four-pronged grappling hook: the shank with an eye, two prongs in profile curving up with barbed points, one
 *  turned to us (short, foreshortened), one behind; a rotten stub of rope bent to the eye, its end splayed */
export function grapnel(id: string, R: () => number, rope: boolean): string {
  const iron = `url(#${id}i)`, dark = '#141210';
  const prong = (pth: string, w: number) => `<path d="${pth}" fill="none" stroke="${dark}" stroke-width="${f(w + 0.45)}" stroke-linecap="round"/><path d="${pth}" fill="none" stroke="${iron}" stroke-width="${f(w)}" stroke-linecap="round"/>`;
  const barb = (x: number, y: number, a: number, k = 1) => `<path d="M${f(x)} ${f(y)}l${f(Math.cos(a) * 1.6 * k)} ${f(Math.sin(a) * 1.6 * k)}l${f(-Math.sin(a) * 0.9 * k)} ${f(Math.cos(a) * 0.9 * k)}Z" fill="#2c2926" stroke="${dark}" stroke-width=".14"/>`;
  let out = `<defs>${lin(id + 'i', [[0, '#77736c'], [0.4, '#45413c'], [1, '#161412']], 0, 0, 1, 1)}</defs>`;
  // the prong behind (dark, thin), the shank, the prongs in profile, the crown, the prong towards us
  out += `<path d="M.3 -3.4C1.8 -5.6 3.4 -7.6 3.2 -10.4" fill="none" stroke="#0e0d0c" stroke-width="1.1" stroke-linecap="round"/>${barb(3.1, -10.2, -2.1, 0.9)}`;
  out += `<path d="M-.6 -3.2L-.48 -15H.48L.6 -3.2Z" fill="${iron}" stroke="${dark}" stroke-width=".2"/>`;
  out += `<ellipse cx="0" cy="-16.7" rx="1.55" ry="1.75" fill="none" stroke="${dark}" stroke-width="1"/><ellipse cx="0" cy="-16.7" rx="1.55" ry="1.75" fill="none" stroke="#5e5a54" stroke-width=".45" stroke-dasharray="2.2 1.4"/>`;
  out += prong('M-.2 -3C-4.4 -1.9 -8.4 -3.6 -9.2 -9.6', 1.5) + barb(-9.25, -9.4, -1.9, 1.3) + prong('M.2 -3C4.4 -1.9 8.4 -3.6 9.2 -9.6', 1.5) + barb(9.25, -9.4, -1.25, 1.3);
  out += `<circle cx="0" cy="-3" r="1.3" fill="${iron}" stroke="${dark}" stroke-width=".2"/>`;
  out += prong('M-.3 -2.4C-1.2 -.6 -3 -.2 -4.4 -1.6', 1.45) + `<path d="M-5 -1.1L-3.7 -3.4L-3.4 -1.1Z" fill="#2c2926" stroke="${dark}" stroke-width=".14"/>`;
  // rust: blooms on the crown and the prongs, streaks down the shank
  out += `<path d="M-.2 -6v2.4M.2 -11v1.8" stroke="#8a4a20" stroke-width=".35" stroke-opacity=".7"/><circle cx="-4.6" cy="-3.4" r=".55" fill="#8a4a20" fill-opacity=".7"/><circle cx="5.2" cy="-4" r=".45" fill="#a0582a" fill-opacity=".6"/><circle cx=".5" cy="-3.3" r=".5" fill="#7a3c18" fill-opacity=".7"/>`;
  if (rope) {
    // the stub: thick and dark at the eye, rotting to loose strands, drooping down to the sand at the right
    const d = 'M1.2 -17.4C3.4 -19.4 6.2 -18.8 6.8 -16.6C7.3 -14.8 6.8 -13.8 7.6 -12.4';
    out += `<path d="${d}" fill="none" stroke="#2c241a" stroke-width="1.5" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#6e6250" stroke-width="1"/><path d="${d}" fill="none" stroke="#3a3024" stroke-width="1" stroke-dasharray=".4 .6"/>`;
    for (let i = 0; i < 7; i++) { const a = 1.2 + (R() - 0.5) * 1.6, l = 1.2 + R() * 1.8; out += `<path d="M7.6 -12.4q${f(Math.cos(a) * l * 0.5 + (R() - 0.5))} ${f(Math.sin(a) * l * 0.5)} ${f(Math.cos(a) * l)} ${f(Math.sin(a) * l)}" fill="none" stroke="${R() < 0.5 ? '#6e6250' : '#4a3e2e'}" stroke-width="${f(0.18 + R() * 0.16)}" stroke-linecap="round"/>`; }
    out += `<path d="M5.6 -19.1l.5 1.1M8.3 -16.6l.9 .5" stroke="#9a8c70" stroke-width=".25" stroke-opacity=".7"/>`;
  }
  return out;
}

/** a cast-iron gun barrel lying on its side, the muzzle to the right a little turned to us: the cascabel knob, the base
 *  ring, two reinforces with their rings, the trunnion standing out at the middle, the long chase with its astragal, the
 *  swelling muzzle and the dark bore; the vent on the top of the breech. len — its length (46) */
export function gun(id: string, R: () => number, len = 46): string {
  const k = len / 46, X = (x: number) => x * k;
  // the profile: [x, radius] from the breech to the muzzle; the axis lies at the breech's radius over the sand
  const prof: P[] = [[-22.6, 4.3], [-22, 4.6], [-21.2, 4.6], [-20.6, 4.25], [-9, 4.05], [-8.6, 4.4], [-7.6, 4.4], [-7.2, 3.85], [2, 3.6], [2.4, 3.95], [3.2, 3.95], [3.6, 3.35], [15.6, 2.95], [16, 3.2], [16.6, 3.2], [17, 2.9], [19.6, 3.05], [21.4, 3.6], [22.4, 3.75], [22.6, 3.5]];
  const ax = -4.6, top = prof.map(([x, r]): P => [X(x), ax - r]), bot = prof.map(([x, r]): P => [X(x), ax + r]).reverse();
  let out = `<defs>${lin(id + 'i', [[0, '#76726a'], [0.3, '#4a4640'], [0.7, '#24211e'], [1, '#100f0d']])}${rad(id + 'k', [[0, '#6e6a62'], [1, '#141210']], 0.35, 0.3, 0.8)}</defs>`;
  // the cascabel: a neck and a knob behind the base ring
  out += `<path d="M${f(X(-22.6))} ${f(ax - 1.4)}L${f(X(-24.4))} ${f(ax - 0.9)}L${f(X(-24.4))} ${f(ax + 0.9)}L${f(X(-22.6))} ${f(ax + 1.4)}Z" fill="url(#${id}i)" stroke="#0c0b0a" stroke-width=".18"/><circle cx="${f(X(-25.6))}" cy="${ax}" r="${f(1.7 * k)}" fill="url(#${id}k)" stroke="#0c0b0a" stroke-width=".18"/>`;
  out += `<path d="M${pts([...top, ...bot]).replace(/ /g, 'L')}Z" fill="url(#${id}i)" stroke="#0c0b0a" stroke-width=".22" stroke-linejoin="round"/>`;
  // the rings drawn across the barrel (a light edge and a dark one), the highlight along its top
  for (const x of [-21.6, -8.1, 2.8, 16.3]) out += `<path d="M${f(X(x) - 0.5)} ${f(ax - 4)}V${f(ax + 4)}" stroke="#0c0b0a" stroke-width=".22" stroke-opacity=".7"/><path d="M${f(X(x) + 0.1)} ${f(ax - 4)}V${f(ax + 3)}" stroke="#8a867c" stroke-width=".2" stroke-opacity=".6"/>`;
  out += `<path d="M${f(X(-20))} ${f(ax - 3.2)}L${f(X(-9))} ${f(ax - 3.05)}M${f(X(-7))} ${f(ax - 2.85)}L${f(X(2))} ${f(ax - 2.65)}M${f(X(4))} ${f(ax - 2.4)}L${f(X(15))} ${f(ax - 2.15)}M${f(X(17.4))} ${f(ax - 2.4)}L${f(X(21.6))} ${f(ax - 2.9)}" stroke="#b4b0a2" stroke-width=".7" stroke-opacity=".55" stroke-linecap="round"/>`;
  // the trunnion: a short round stub towards us with its end face
  out += `<ellipse cx="${f(X(-3.4))}" cy="${f(ax + 0.2)}" rx="${f(1.9 * k)}" ry="${f(2 * k)}" fill="url(#${id}k)" stroke="#0c0b0a" stroke-width=".2"/><ellipse cx="${f(X(-3.1))}" cy="${f(ax + 0.1)}" rx="${f(1.2 * k)}" ry="${f(1.35 * k)}" fill="#3a3632" stroke="#0c0b0a" stroke-width=".12"/>`;
  // the vent and its patch
  out += `<rect x="${f(X(-18.6))}" y="${f(ax - 4.45)}" width="${f(1.6 * k)}" height=".5" fill="#2a2724"/><circle cx="${f(X(-17.8))}" cy="${f(ax - 4.2)}" r=".3" fill="#050404"/>`;
  // the muzzle turned a little to us: its face and the bore
  out += `<ellipse cx="${f(X(22.6))}" cy="${ax}" rx="${f(1.2 * k)}" ry="${f(3.5 * k)}" fill="#3a3632" stroke="#0c0b0a" stroke-width=".2"/><ellipse cx="${f(X(22.75))}" cy="${ax}" rx="${f(0.75 * k)}" ry="${f(2 * k)}" fill="#050404"/><path d="M${f(X(22.3))} ${f(ax - 3)}Q${f(X(23.4))} ${f(ax)} ${f(X(22.3))} ${f(ax + 3)}" fill="none" stroke="#8a867c" stroke-width=".18" stroke-opacity=".6"/>`;
  void R; return out;
}
/** a broken piece of a gun carriage: one stepped cheek of oak gone grey, bolts rusted to stumps, the fore truck still
 *  on its axle, the after end broken off in splinters */
export function carriage(id: string, R: () => number): string {
  const cheek: P[] = [[-10, 0], [9, 0], [9.6, -1.4], [9, -7.8], [3.4, -7.8], [3.4, -6.4], [-1.6, -6.4], [-1.6, -5.1], [-6.2, -5.1], [-6.2, -3.9], ...jag([-6.2, -3.9], [-10, 0], 5, 1.1, R)];
  let out = `<defs>${lin(id + 'w', [[0, '#9a9078'], [0.5, '#6e6450'], [1, '#3a3226']])}${rad(id + 't', [[0, '#8a806a'], [0.6, '#5a5040'], [1, '#2a241c']], 0.4, 0.35, 0.75)}</defs>`;
  out += `<path d="${poly(cheek)}" fill="url(#${id}w)" stroke="#2a221a" stroke-width=".22"/>`;
  out += `<path d="M-8 -1.4H8.4M-5.6 -3.4H8.6M-1 -5.4H8.8" stroke="#3a3226" stroke-width=".16" stroke-opacity=".6"/><path d="M-9 -.5L-6.4 -3.6" stroke="#d8ccae" stroke-width=".2"/>`;
  for (const [x, y] of [[6.2, -6.6], [1.2, -5.4], [-3.8, -4.2], [7.6, -2.2]] as P[]) out += `<circle cx="${x}" cy="${y}" r=".55" fill="#3a2214"/><path d="M${x} ${y + 0.5}v1.4" stroke="#8a4a20" stroke-width=".35" stroke-opacity=".7"/>`;
  // the truck: a thick wooden wheel on the axle, a crack across it
  out += `<circle cx="5.2" cy="-3.1" r="3.1" fill="url(#${id}t)" stroke="#20180f" stroke-width=".25"/><circle cx="5.2" cy="-3.1" r="2.3" fill="none" stroke="#2a221a" stroke-width=".15" stroke-opacity=".6"/><circle cx="5.2" cy="-3.1" r=".9" fill="#3a2a1c" stroke="#120c08" stroke-width=".18"/><circle cx="5.2" cy="-3.1" r=".45" fill="#6a3a1c"/>` +
    `<path d="M3 -5.2L4.6 -3.6L4.2 -2.2L5.6 -.6" fill="none" stroke="#120c08" stroke-width=".18"/>`;
  return out;
}

// ---- wood ----
/** a barrel lying on its side: weathered staves, rusted hoops with rivets, the head towards us. broken — the head stove
 *  in (a ragged hole into the dark), a stave sprung, the black powder run out on the sand; foreign — another ship's
 *  cask: a band of faded paint and a branded mark on the bilge */
export function keg(id: string, R: () => number, kind: 'broken' | 'foreign' | 'whole'): string {
  const L0 = -10, L1 = 9, Rr = 6.2, bul = 0.9;
  const top = (x: number) => -Rr - bul * (1 - Math.pow((x - (L0 + L1) / 2) / ((L1 - L0) / 2), 2)) - Rr;
  const bot = (x: number) => -top(x) - 2 * Rr;
  const xs: number[] = []; for (let x = L0; x <= L1 + 0.01; x += 1) xs.push(x);
  const body = `M${L0} ${f(top(L0))}${xs.map(x => `L${f(x)} ${f(top(x))}`).join('')}L${L1} ${f(bot(L1) - 0)}${[...xs].reverse().map(x => `L${f(x)} ${f(bot(x) - 0.0)}`).join('')}Z`;
  const wood = kind === 'foreign' ? ['#8a7a5c', '#5e5038', '#2c2418'] : ['#7e705a', '#54483a', '#241c14'];
  let out = `<defs>${lin(id + 'w', [[0, wood[0]], [0.35, wood[1]], [1, wood[2]]])}${lin(id + 'h', [[0, '#9a8a6c'], [1, '#4a3e2e']], 0, 0, 1, 1)}<clipPath id="${id}k"><path d="${body}"/></clipPath></defs>`;
  out += `<path d="${body}" fill="url(#${id}w)" stroke="#1a140e" stroke-width=".22"/>`;
  // the staves: seams along the barrel following the bulge
  let st = '';
  for (let k = 1; k < 7; k++) { const t = k / 7; st += `M${L0} ${f(top(L0) + t * (bot(L0) - top(L0)))}Q${f((L0 + L1) / 2)} ${f(top((L0 + L1) / 2) + t * (bot((L0 + L1) / 2) - top((L0 + L1) / 2)))} ${L1} ${f(top(L1) + t * (bot(L1) - top(L1)))}`; }
  let inner = `<path d="${st}" fill="none" stroke="#1a140e" stroke-width=".2" stroke-opacity=".7"/><path d="${st}" fill="none" stroke="#a89878" stroke-width=".14" stroke-opacity=".35" transform="translate(0 .3)"/>`;
  if (kind === 'foreign') {
    inner += `<rect x="-3.4" y="-15" width="4.2" height="16" fill="#5a6e86" fill-opacity=".55"/><rect x="-3.4" y="-15" width="4.2" height="16" fill="#e8dcc0" fill-opacity=".12"/>`;
    inner += `<g transform="translate(4.6 -6.6)" fill="none" stroke="#1e140c" stroke-width=".42" stroke-opacity=".75"><circle r="2.3"/><path d="M-1.4 1.1L0 -1.5L1.4 1.1Z"/><path d="M0 -1.5V-2.3"/></g>`;
  }
  // the hoops: iron bands bent over the bilge, rust running from them, rivets
  const hoop = (x: number, w: number) => `<path d="M${f(x)} ${f(top(x) - 0.1)}Q${f(x + 0.3)} ${f((top(x) + bot(x)) / 2)} ${f(x)} ${f(bot(x) + 0.1)}" fill="none" stroke="#2a1a10" stroke-width="${f(w + 0.3)}"/><path d="M${f(x)} ${f(top(x) - 0.1)}Q${f(x + 0.3)} ${f((top(x) + bot(x)) / 2)} ${f(x)} ${f(bot(x) + 0.1)}" fill="none" stroke="#6e3e1e" stroke-width="${f(w)}"/>` +
    `<circle cx="${f(x + 0.15)}" cy="${f(top(x) + 2.2)}" r=".3" fill="#1a0e08"/><circle cx="${f(x + 0.28)}" cy="${f((top(x) + bot(x)) / 2)}" r=".3" fill="#1a0e08"/><path d="M${f(x + 0.3)} ${f((top(x) + bot(x)) / 2 + 0.4)}v${f(1.5 + R() * 2)}" stroke="#8a4a20" stroke-width=".4" stroke-opacity=".55"/>`;
  for (const x of [L0 + 1.4, L0 + 3.6, L1 - 3.6, L1 - 1.4]) inner += hoop(x, 0.85);
  if (kind === 'broken') {
    // a stave sprung out of the bilge
    inner += `<path d="M-6 ${f(top(-6) + 0.2)}L4.5 ${f(top(4.5) - 2.6)}L5 ${f(top(5) - 1.6)}L-5.6 ${f(top(-5.6) + 1.2)}Z" fill="#3a2e22" stroke="#120c08" stroke-width=".15"/>`;
  }
  out += `<g clip-path="url(#${id}k)">${inner}</g>`;
  // the head towards us at the right: the chime, the head boards; broken — a ragged hole and the powder run out
  const hc: P = [L1, -Rr], hx = 2.3;
  out += `<ellipse cx="${f(hc[0])}" cy="${f(hc[1])}" rx="${hx}" ry="${f(Rr + 0.05)}" fill="url(#${id}h)" stroke="#1a140e" stroke-width=".25"/><ellipse cx="${f(hc[0] + 0.2)}" cy="${f(hc[1])}" rx="${f(hx * 0.78)}" ry="${f(Rr * 0.86)}" fill="none" stroke="#2a2018" stroke-width=".22"/>`;
  out += `<path d="M${f(hc[0] - 1.2)} ${f(hc[1] - 3.8)}Q${f(hc[0] + 0.3)} ${f(hc[1])} ${f(hc[0] - 1.2)} ${f(hc[1] + 3.8)}M${f(hc[0] + 0.6)} ${f(hc[1] - 5)}Q${f(hc[0] + 2)} ${f(hc[1])} ${f(hc[0] + 0.6)} ${f(hc[1] + 5)}" fill="none" stroke="#2a2018" stroke-width=".18" stroke-opacity=".7"/>`;
  if (kind === 'broken') {
    const hole: P[] = [[hc[0] - 0.9, hc[1] - 3.2], ...jag([hc[0] - 0.9, hc[1] - 3.2], [hc[0] + 1.6, hc[1] + 2.8], 6, 0.7, R), [hc[0] + 1.6, hc[1] + 2.8], [hc[0] - 0.6, hc[1] + 3.6], ...jag([hc[0] - 0.6, hc[1] + 3.6], [hc[0] - 0.9, hc[1] - 3.2], 5, 0.5, R)];
    out += `<path d="${poly(hole)}" fill="#0a0806"/><polyline points="${pts(hole.slice(0, 7))}" fill="none" stroke="#b8a888" stroke-width=".2"/>`;
    // the powder: a fan of black grains run out over the chime onto the sand
    let gr = `<path d="M${f(hc[0] - 0.4)} ${f(hc[1] + 3)}C${f(hc[0] + 2)} ${f(hc[1] + 4.6)} ${f(hc[0] + 4.6)} -1.4 ${f(hc[0] + 7.6)} -.15L${f(hc[0] + 1)} -.1C${f(hc[0] + 0.6)} -1 ${f(hc[0] - 0.4)} ${f(hc[1] + 4.4)} ${f(hc[0] - 0.4)} ${f(hc[1] + 3)}Z" fill="#1e1c1a"/>`;
    for (let i = 0; i < 26; i++) { const x = hc[0] + 1 + R() * 7, y = -0.15 - R() * Math.max(0.2, 1.6 - (x - hc[0]) * 0.18); gr += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.1 + R() * 0.18)}" fill="${R() < 0.6 ? '#141210' : '#4a4642'}"/>`; }
    out += gr;
  } else out += `<rect x="${f(hc[0] + 0.1)}" y="${f(hc[1] - 0.9)}" width=".9" height="1.8" rx=".3" fill="#2a1e14"/>`;
  out += `<path d="M${L0 + 0.6} ${f(top(L0 + 0.6) + 0.6)}Q${f((L0 + L1) / 2)} ${f(top((L0 + L1) / 2) + 0.7)} ${L1 - 0.6} ${f(top(L1 - 0.6) + 0.6)}" fill="none" stroke="#c8b898" stroke-width=".35" stroke-opacity=".45"/>`;
  return out;
}

/** a scrap of sail lying on the sand: a crumpled sheet, folds lit and shaded, a torn edge with threads, holes, a boltrope */
export function canvas(id: string, R: () => number, color: string): string {
  const n = 9, top: P[] = [], w = 22;
  for (let i = 0; i <= n; i++) { const x = -w / 2 + (w * i) / n; top.push([x + (R() - 0.5) * 1.2, -1.2 - Math.sin((i / n) * Math.PI) * 3.6 - R() * 2.2]); }
  const foot: P[] = [[w / 2 + 1, -0.1], [-w / 2 - 0.8, 0]];
  const shape = [...top, ...foot], dark = mix(color, '#000000', 0.5), light = mix(color, '#ffffff', 0.32);
  let out = `<defs>${lin(id + 'c', [[0, light], [0.6, color], [1, dark]])}<clipPath id="${id}k"><path d="${poly(shape)}"/></clipPath></defs><path d="${poly(shape)}" fill="url(#${id}c)"/>`;
  let folds = '';
  for (let i = 1; i < n; i += 1 + Math.floor(R() * 2)) { const [x, y] = top[i]; folds += `<path d="M${f(x)} ${f(y + 0.3)}Q${f(x + 1.4)} ${f(y * 0.5)} ${f(x + 0.4 + (R() - 0.5) * 3)} -.1" fill="none" stroke="${dark}" stroke-width=".55" stroke-opacity=".5"/><path d="M${f(x - 0.5)} ${f(y + 0.4)}Q${f(x + 0.9)} ${f(y * 0.5)} ${f(x - 0.2 + (R() - 0.5) * 3)} -.2" fill="none" stroke="${light}" stroke-width=".3" stroke-opacity=".45"/>`; }
  let holes = '';
  for (let i = 0; i < 3; i++) { const x = -w / 2 + 3 + R() * (w - 6), y = -1 - R() * 2; holes += `<path d="M${f(x)} ${f(y)}l${f(0.6 + R())} ${f(-0.4 - R() * 0.4)}l${f(0.5)} ${f(0.8)}l${f(-0.9)} ${f(0.5)}Z" fill="${mix(color, '#000000', 0.7)}" fill-opacity=".8"/>`; }
  out += `<g clip-path="url(#${id}k)">${folds}${holes}<path d="M${f(-w / 2)} -.5H${f(w / 2)}" stroke="${dark}" stroke-width="1" stroke-opacity=".35"/></g>`;
  out += `<polyline points="${pts(top.slice(0, 5))}" fill="none" stroke="${mix(color, '#000000', 0.6)}" stroke-width=".6" stroke-linecap="round"/>`;
  let thr = '';
  for (const [x, y] of top.slice(4)) for (let j = 0; j < 2; j++) thr += `<path d="M${f(x + (R() - 0.5))} ${f(y)}q${f((R() - 0.5) * 1.2)} ${f(-0.6 - R())} ${f(0.6 + R() * 0.8)} ${f(-1 - R() * 1.2)}" fill="none" stroke="${color}" stroke-width=".18" stroke-opacity=".8"/>`;
  return out + thr;
}

// ---- the Company's goods (the Endeavour) ----
/** the Company's mark, stencilled: a ring, in it a staff with a cross-bar and a pennant over a heart, a bale number
 *  under it (own design, a merchant's mark) */
export function coMark(x: number, y: number, r: number, color: string, op: number): string {
  return `<g transform="translate(${f(x)} ${f(y)})" fill="none" stroke="${color}" stroke-opacity="${op}" stroke-width="${f(r * 0.13)}" stroke-linecap="round" stroke-linejoin="round">` +
    `<circle r="${f(r)}"/><circle r="${f(r * 0.82)}" stroke-width="${f(r * 0.05)}"/>` +
    `<path d="M0 ${f(-r * 0.62)}V${f(r * 0.14)}M${f(-r * 0.3)} ${f(-r * 0.38)}H${f(r * 0.3)}M0 ${f(-r * 0.62)}L${f(r * 0.42)} ${f(-r * 0.44)}L0 ${f(-r * 0.26)}"/>` +
    `<path d="M0 ${f(r * 0.62)}C${f(-r * 0.12)} ${f(r * 0.42)} ${f(-r * 0.5)} ${f(r * 0.36)} ${f(-r * 0.42)} ${f(r * 0.14)}C${f(-r * 0.36)} ${f(-r * 0.02)} ${f(-r * 0.08)} ${f(r * 0.02)} 0 ${f(r * 0.16)}C${f(r * 0.08)} ${f(r * 0.02)} ${f(r * 0.36)} ${f(-r * 0.02)} ${f(r * 0.42)} ${f(r * 0.14)}C${f(r * 0.5)} ${f(r * 0.36)} ${f(r * 0.12)} ${f(r * 0.42)} 0 ${f(r * 0.62)}Z"/></g>`;
}
/** a Company crate seen from the front and a little from the right: planked sides, corner battens, iron corner straps
 *  rusted, the mark stencilled on the front, the bale number under it. state: 'whole' — the lid on, one board sprung;
 *  'burst' — the front stove in, its boards splintered and bent out, the lid knocked askew, the dark inside with gold */
export function coCrate(id: string, R: () => number, state: 'whole' | 'burst', n = 7): string {
  const W = 12, H = 17, ox = 7, oy = 4.6;
  const wood = ['#b0a080', '#8a7a5c', '#4e4232'];
  let out = `<defs>${lin(id + 'f', [[0, wood[0]], [0.5, wood[1]], [1, wood[2]]], 0, 0, 0.4, 1)}${lin(id + 's', [[0, mix(wood[1], '#000000', 0.25)], [1, mix(wood[2], '#000000', 0.35)]])}${lin(id + 't', [[0, mix(wood[0], '#ffffff', 0.12)], [1, wood[1]]])}${rad(id + 'g', [[0, '#f0d080'], [0.5, '#b08a30'], [1, '#4a3410']], 0.4, 0.3, 0.8)}</defs>`;
  const front: P[] = [[-W, -H], [W, -H], [W, 0], [-W, 0]], side: P[] = [[W, -H], [W + ox, -H - oy], [W + ox, -oy], [W, 0]], lid: P[] = [[-W, -H], [W, -H], [W + ox, -H - oy], [-W + ox, -H - oy]];
  out += `<path d="${poly(side)}" fill="url(#${id}s)" stroke="#1e160e" stroke-width=".22"/>`;
  out += `<path d="${poly(front)}" fill="url(#${id}f)" stroke="#1e160e" stroke-width=".22"/>`;
  // planks of the front and the side, of different widths, a gap between them
  let pl = ''; const ys: number[] = []; for (let y = -2.6 - R(); y > -H + 1.5; y -= 2.8 + R() * 1.6) ys.push(y);
  for (const y of ys) pl += `M${-W} ${f(y)}H${W}L${W + ox} ${f(y - oy)}`;
  out += `<path d="${pl}" fill="none" stroke="#1e160e" stroke-width=".38" stroke-opacity=".8"/><path d="${pl}" fill="none" stroke="#d8c8a2" stroke-width=".18" stroke-opacity=".35" transform="translate(0 .35)"/>`;
  // grain
  let gr = ''; for (let i = 0; i < 14; i++) { const y = -H + 1 + R() * (H - 2), x0 = -W + R() * W, l = 3 + R() * 9; gr += `M${f(x0)} ${f(y)}h${f(l)}`; }
  out += `<path d="${gr}" stroke="#3e3426" stroke-width=".12" stroke-opacity=".5"/>`;
  // the mark, stencilled in faded red-brown, half worn off
  out += coMark(-0.6, -H * 0.58, 4.6, '#5a2418', 0.62);
  out += `<g fill="none" stroke="#5a2418" stroke-opacity=".55" stroke-width=".55" stroke-linecap="round"><path d="M-3.6 -3.4v-2.6l1.8 2.6v-2.6M-.8 -3.9a.8 1 0 1 0 1.6 0a.8 1 0 1 0 -1.6 0"/><path d="M${n === 7 ? 'M2.2 -6H4.2L2.8 -3.2' : 'M2.2 -5.6Q3.2 -6.6 4 -5.6Q3.4 -4.6 2.4 -3.3H4.2'}"/></g>`;
  // corner battens and the iron corner straps, rusted, nails
  for (const x of [-W, W - 2]) out += `<rect x="${x}" y="${-H}" width="2" height="${H}" fill="${x < 0 ? wood[0] : wood[1]}" fill-opacity=".7" stroke="#1e160e" stroke-width=".18"/>`;
  for (const [x, y, sx, sy] of [[-W, -H, 1, 1], [W, -H, -1, 1], [-W, 0, 1, -1], [W, 0, -1, -1]] as [number, number, number, number][]) out += `<path d="M${x} ${y}h${sx * 3.4}l${-sx * 0.2} ${sy * 0.9}h${-sx * 2.3}v${sy * 2.5}l${-sx * 0.9} ${sy * 0.2}Z" fill="#4a2a18" stroke="#1a0e08" stroke-width=".15"/><circle cx="${x + sx * 1.6}" cy="${y + sy * 0.5}" r=".28" fill="#1a0e08"/>`;
  for (const y of ys) for (const x of [-W + 1, W - 1]) out += `<circle cx="${x}" cy="${f(y + 1.2)}" r=".25" fill="#2a1a10"/>`;
  if (state === 'whole') {
    out += `<path d="${poly(lid)}" fill="url(#${id}t)" stroke="#1e160e" stroke-width=".22"/><path d="M${-W + ox * 0.33} ${f(-H - oy * 0.33)}H${f(W + ox * 0.33)}M${-W + ox * 0.66} ${f(-H - oy * 0.66)}H${f(W + ox * 0.66)}" stroke="#1e160e" stroke-width=".3" stroke-opacity=".7"/>`;
    // one board sprung at the top of the front: its end bent out, the nails pulled
    const y0 = ys[ys.length - 1];
    out += `<path d="M2 ${f(y0)}L${W + 0.4} ${f(y0 - 0.2)}L${W + 2.6} ${f(y0 - 2.6)}L${W + 0.8} ${f(y0 - 2.8)}L2.4 ${f(-H)}Z" fill="${wood[1]}" stroke="#1e160e" stroke-width=".18"/><path d="M${W + 2.6} ${f(y0 - 2.6)}l.5 -.5l-.2 .9Z" fill="#d8c8a2"/>`;
    return out;
  }
  // burst: the upper front stove in — a dark hole with splintered board ends; the lid knocked askew
  const hole: P[] = [[-W + 2.2, -H + 0.2], [W - 2, -H + 0.2], ...jag([W - 2, -H + 0.2], [W - 3.6, -H * 0.42], 4, 1.3, R), [W - 3.6, -H * 0.42], ...jag([W - 3.6, -H * 0.42], [-W + 2.6, -H * 0.5], 7, 1.6, R), [-W + 2.6, -H * 0.5]];
  out += `<path d="${poly(hole)}" fill="#120d08"/>`;
  // gold inside: a heap of coins and the corner of an ingot catching the light
  out += `<path d="M${-W + 3} ${f(-H * 0.5)}Q-2 ${f(-H * 0.78)} ${W - 4} ${f(-H * 0.45)}Z" fill="url(#${id}g)" fill-opacity=".9"/>`;
  for (let i = 0; i < 9; i++) { const x = -W + 4 + R() * (2 * W - 9), y = -H * (0.5 + R() * 0.16); out += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="1" ry=".42" fill="#e8c060" stroke="#6a4a14" stroke-width=".12"/>`; }
  out += `<path d="M1 ${f(-H * 0.6)}l4.2 -1.2l1.2 .6l-4.2 1.3Z" fill="#f0cc6a" stroke="#6a4a14" stroke-width=".14"/>`;
  out += `<polyline points="${pts(hole.slice(2, 14))}" fill="none" stroke="#e0d0aa" stroke-width=".22"/>`;
  // splintered board ends bent outwards over the hole
  for (const x of [-7, -2.5, 3.5]) out += `<path d="M${f(x)} ${f(-H * 0.5 + 0.2)}l${f(1.4 + R())} ${f(-3.2 - R() * 1.5)}l.5 1l.4 -.8l.2 3.4Z" fill="${wood[0]}" stroke="#1e160e" stroke-width=".14"/>`;
  // the lid, knocked off: lying askew on top, one corner on the sand side
  out += `<g transform="rotate(-9 ${W} ${-H})"><path d="${poly(lid.map(([x, y]): P => [x + 2.4, y - 1.2]))}" fill="url(#${id}t)" stroke="#1e160e" stroke-width=".22"/><path d="M${-W + 2.4 + ox * 0.5} ${f(-H - 1.2 - oy * 0.5)}H${f(W + 2.4 + ox * 0.5)}" stroke="#1e160e" stroke-width=".3" stroke-opacity=".7"/></g>`;
  return out;
}
/** gold ingots: bars cast as long trapezoids (the top face lit, the long side, the end), a stamp on each; lying askew */
export function ingots(id: string, R: () => number, n = 3): string {
  let out = `<defs>${lin(id + 't', [[0, '#fff0b0'], [0.5, '#e8c45c'], [1, '#b08a2c']], 0, 0, 1, 1)}${lin(id + 'f', [[0, '#c89a36'], [1, '#6a4a14']])}${lin(id + 'e', [[0, '#9a7424'], [1, '#4a3410']])}</defs>`;
  const bar = (x: number, y: number, a: number) => {
    const L = 10, W = 3.2, H = 2.2, k = 0.7;
    const top: P[] = [[-L / 2 + k, -H], [L / 2 - k, -H], [L / 2 - k + 1.6, -H - 1.4], [-L / 2 + k + 1.6, -H - 1.4]];
    const side: P[] = [[-L / 2, 0], [L / 2, 0], [L / 2 - k, -H], [-L / 2 + k, -H]];
    const end: P[] = [[L / 2, 0], [L / 2 + 1.7, -1.5], [L / 2 - k + 1.6, -H - 1.4], [L / 2 - k, -H]];
    void W;
    return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)})"><path d="${poly(end)}" fill="url(#${id}e)" stroke="#3a2808" stroke-width=".15"/><path d="${poly(side)}" fill="url(#${id}f)" stroke="#3a2808" stroke-width=".15"/><path d="${poly(top)}" fill="url(#${id}t)" stroke="#3a2808" stroke-width=".15"/>` +
      `<rect x="-1.6" y="${f(-H - 1)}" width="3.2" height=".9" fill="none" stroke="#7a5a18" stroke-width=".18" transform="skewX(-40)"/><path d="M${-L / 2 + 1} -.6H${L / 2 - 1}" stroke="#fff0b0" stroke-width=".18" stroke-opacity=".5"/></g>`;
  };
  const at: [number, number, number][] = [[-4.6, 0, 3], [5.4, -0.2, -4], [0.6, -2.3, -12], [9, -0.5, 18]];
  at.slice(0, n).forEach(([x, y, a]) => { out += bar(x, y, a + (R() - 0.5) * 3); });
  return out;
}
/** loose coins run out over the sand: big enough to read — a raised rim, a cross-and-star struck in the face, the edge
 *  of each; most lie tilted showing their face, some stand on edge, one leans on another */
export function coinSpill(id: string, R: () => number, n = 10, w = 18): string {
  let out = `<defs>${lin(id + 'c', [[0, '#fff0a8'], [0.45, '#e2b44a'], [1, '#8a6018']], 0, 0, 1, 1)}${lin(id + 'e', [[0, '#b08428'], [1, '#5a3c0c']])}</defs>`;
  const cs: [number, number, number, number][] = [];
  for (let i = 0; i < n; i++) { const t = n > 1 ? i / (n - 1) : 0.5, x = -w / 2 + t * w + (R() - 0.5) * 2, y = -0.3 - R() * 1.6 - Math.sin(t * Math.PI) * 1.2, tilt = R(); cs.push([x, y, tilt, (R() - 0.5) * 50]); }
  cs.sort((a, b) => a[1] - b[1]);
  const r = 2.2;
  for (const [x, y, tilt, a] of cs) {
    if (tilt < 0.18) {   // on edge: a narrow upright ellipse with its milled edge
      out += `<g transform="rotate(${f(a * 0.4)} ${f(x)} ${f(y - r)})"><ellipse cx="${f(x)}" cy="${f(y - r)}" rx=".75" ry="${r}" fill="url(#${id}e)" stroke="#4a3008" stroke-width=".12"/><ellipse cx="${f(x - 0.15)}" cy="${f(y - r)}" rx=".5" ry="${f(r * 0.95)}" fill="url(#${id}c)"/></g>`;
      continue;
    }
    const ry = r * (0.42 + tilt * 0.35);
    out += `<g transform="rotate(${f(a * 0.25)} ${f(x)} ${f(y)})"><ellipse cx="${f(x)}" cy="${f(y + 0.35)}" rx="${r}" ry="${f(ry)}" fill="url(#${id}e)"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${r}" ry="${f(ry)}" fill="url(#${id}c)" stroke="#5a3e10" stroke-width=".14"/>` +
      `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 0.76)}" ry="${f(ry * 0.76)}" fill="none" stroke="#8a6420" stroke-width=".16"/>` +
      `<path d="M${f(x)} ${f(y - ry * 0.5)}V${f(y + ry * 0.5)}M${f(x - r * 0.45)} ${f(y)}H${f(x + r * 0.45)}" stroke="#8a6420" stroke-width=".22"/><circle cx="${f(x - r * 0.3)}" cy="${f(y - ry * 0.3)}" r=".18" fill="#8a6420"/><circle cx="${f(x + r * 0.3)}" cy="${f(y + ry * 0.3)}" r=".18" fill="#8a6420"/>` +
      `<path d="M${f(x - r * 0.75)} ${f(y - ry * 0.35)}Q${f(x - r * 0.2)} ${f(y - ry * 0.95)} ${f(x + r * 0.45)} ${f(y - ry * 0.8)}" fill="none" stroke="#fffbe0" stroke-width=".22" stroke-opacity=".75"/></g>`;
  }
  return out;
}
/** a brass spyglass of three draws, the barrel covered in leather (its stitching), the objective's glass gone milky
 *  and cracked, the eyepiece with its slide; lying along x, the objective at the right */
export function spyglass(id: string, R: () => number): string {
  let out = `<defs>${lin(id + 'b', [[0, '#f0d48c'], [0.35, '#b08a3c'], [1, '#3e2a10']])}${lin(id + 'l', [[0, '#8a5a34'], [0.4, '#5a3a20'], [1, '#22140a']])}${rad(id + 'g', [[0, '#d8e4dc'], [0.6, '#8aa49a'], [1, '#3a5048']], 0.35, 0.3, 0.8)}</defs>`;
  const seg = (x0: number, x1: number, r: number, fill: string) => `<rect x="${f(x0)}" y="${f(-r * 2)}" width="${f(x1 - x0)}" height="${f(r * 2)}" fill="${fill}" stroke="#2a1a08" stroke-width=".16"/>`;
  out += seg(-14, -10, 0.85, `url(#${id}b)`) + seg(-10, -5.4, 1.15, `url(#${id}b)`) + seg(-5.4, -0.6, 1.45, `url(#${id}b)`);
  out += seg(-0.6, 11, 1.95, `url(#${id}l)`) + `<path d="M0 -3.4H10.4" stroke="#c49a6a" stroke-width=".14" stroke-dasharray=".45 .35" stroke-opacity=".7"/>`;
  out += seg(11, 13.4, 2.25, `url(#${id}b)`) + seg(-1.2, -0.3, 1.75, `url(#${id}b)`);
  for (const x of [-10, -5.4]) out += `<rect x="${f(x - 0.3)}" y="${f(-(x < -6 ? 1.15 : 1.45) * 2 - 0.15)}" width=".6" height="${f((x < -6 ? 1.15 : 1.45) * 2 + 0.3)}" fill="#7a5a26" stroke="#2a1a08" stroke-width=".12"/>`;
  out += `<ellipse cx="13.4" cy="-2.25" rx=".75" ry="2.25" fill="url(#${id}b)" stroke="#2a1a08" stroke-width=".16"/><ellipse cx="13.6" cy="-2.25" rx=".55" ry="1.75" fill="url(#${id}g)"/><path d="M13.4 -3.6L13.8 -2.2L13.4 -1.2M13.8 -2.2l.2 -.9" fill="none" stroke="#ffffff" stroke-width=".12" stroke-opacity=".8"/>`;
  out += `<ellipse cx="-14" cy="-.85" rx=".35" ry=".85" fill="#5a4018" stroke="#2a1a08" stroke-width=".12"/><path d="M-13 -1.6H-10.6M-9 -2.1H-5.8M-4.4 -2.7H-1.2M11.4 -4H13" stroke="#fff4c8" stroke-width=".25" stroke-opacity=".55"/>`;
  void R; return out;
}
/** an officer's epaulette fallen from the coat, lying flat: the crescent pad laced with gold, its strap running back
 *  (short, seen from the front) to a button, the heavy bullion fringe of twisted gold cords spread round the front of
 *  the crescent on the sand; tarnished */
export function epaulette(id: string, R: () => number): string {
  let out = `<defs>${lin(id + 'p', [[0, '#e0c070'], [0.5, '#a07c30'], [1, '#4a3410']])}${lin(id + 'r', [[0, '#9a3a2a'], [1, '#4a1810']])}${lin(id + 'f', [[0, '#e8c868'], [1, '#7a5a1a']], 0, 0, 1, 0)}</defs>`;
  // the strap behind the pad, going back (up the picture) and narrowing, a button at its end
  out += `<path d="M-2.8 -4.4L-1.6 -7.6H1.6L2.8 -4.4Z" fill="url(#${id}r)" stroke="#2e1008" stroke-width=".18"/><path d="M-2.1 -5.4H2.1M-1.8 -6.6H1.8" stroke="#d8b860" stroke-width=".35" stroke-opacity=".75"/><ellipse cx="0" cy="-7.7" rx="1" ry=".7" fill="url(#${id}p)" stroke="#2e2008" stroke-width=".15"/>`;
  // the fringe: thick twisted cords fanned out round the front half of the crescent, each curling at its end
  let fr = '';
  for (let i = 0; i < 17; i++) {
    const t = i / 16, a = Math.PI * (0.06 + t * 0.88), x0 = -Math.cos(a) * 5.6, y0 = -3 + Math.sin(a) * 1.3, l = 2.6 + R() * 1.4, dx = -Math.cos(a) * l * 1.1, dy = Math.sin(a) * l * 0.55;
    const e: P = [x0 + dx, Math.min(-0.2, y0 + dy)];
    fr += `<path d="M${f(x0)} ${f(y0)}Q${f(x0 + dx * 0.6)} ${f(y0 + dy * 0.2)} ${f(e[0])} ${f(e[1])}" fill="none" stroke="#3e2c0c" stroke-width="1.15" stroke-linecap="round"/><path d="M${f(x0)} ${f(y0)}Q${f(x0 + dx * 0.6)} ${f(y0 + dy * 0.2)} ${f(e[0])} ${f(e[1])}" fill="none" stroke="url(#${id}f)" stroke-width=".8" stroke-linecap="round"/>` +
      `<path d="M${f(x0)} ${f(y0)}Q${f(x0 + dx * 0.6)} ${f(y0 + dy * 0.2)} ${f(e[0])} ${f(e[1])}" fill="none" stroke="#5a400e" stroke-width=".8" stroke-dasharray=".22 .38"/>`;
  }
  out += fr;
  // the crescent pad: an oval of gold lace with a raised rim, an embroidered star in its middle
  out += `<ellipse cx="0" cy="-3.6" rx="6" ry="2.4" fill="url(#${id}p)" stroke="#2e2008" stroke-width=".22"/><ellipse cx="0" cy="-3.7" rx="4.9" ry="1.7" fill="none" stroke="#f0d48a" stroke-width=".4" stroke-dasharray=".55 .35" stroke-opacity=".8"/>` +
    `<path d="M0 -4.7L.35 -3.95L1.15 -3.9L.55 -3.45L.75 -2.75L0 -3.15L-.75 -2.75L-.55 -3.45L-1.15 -3.9L-.35 -3.95Z" fill="#6a4a14"/>`;
  return out;
}
/** a uniform button: a domed brass button with a star in a rope ring, its shank to the side, green with verdigris */
export function button(id: string): string {
  return `<defs>${rad(id + 'b', [[0, '#f4dc94'], [0.55, '#b08a3a'], [1, '#4a3410']], 0.35, 0.3, 0.8)}</defs><path d="M2.6 -1.4h1.4v1.2h-1.4Z" fill="#6a4a18"/>` +
    `<ellipse cx="0" cy="-1.6" rx="2.8" ry="1.6" fill="url(#${id}b)" stroke="#3a2808" stroke-width=".15"/><ellipse cx="0" cy="-1.7" rx="2.1" ry="1.15" fill="none" stroke="#6a4a18" stroke-width=".18" stroke-dasharray=".3 .2"/>` +
    `<path d="M0 -2.55L.3 -1.95L.95 -1.9L.45 -1.55L.6 -1L0 -1.3L-.6 -1L-.45 -1.55L-.95 -1.9L-.3 -1.95Z" fill="#5a4014"/>`;
}

// ---- the Dutchman's floor: other ships' wreckage, shells ----
/** a ship's wheel standing half buried, a little turned from us (an ellipse): the rim of two rings, eight turned spokes
 *  running out to handles, the hub with its brass boss; two handles broken off */
export function wheel(id: string, R: () => number): string {
  const rx = 7.2, ry = 9, cy = -9.2;
  let out = `<defs>${lin(id + 'w', [[0, '#8a7458'], [0.5, '#5e4c36'], [1, '#2a2016']], 0, 0, 1, 1)}${rad(id + 'h', [[0, '#d8b870'], [0.6, '#8a6a2a'], [1, '#3a2808']], 0.35, 0.3, 0.8)}</defs>`;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2, c = Math.cos(a), s = Math.sin(a), broken = i === 2 || i === 5;
    const e = broken ? 1.06 : 1.42, x1 = c * rx * e, y1 = cy + s * ry * e;
    out += `<path d="M${f(c * 1.4)} ${f(cy + s * 1.7)}L${f(x1)} ${f(y1)}" stroke="#1e160e" stroke-width="1.15" stroke-linecap="round"/><path d="M${f(c * 1.4)} ${f(cy + s * 1.7)}L${f(x1)} ${f(y1)}" stroke="url(#${id}w)" stroke-width=".75" stroke-linecap="round"/>`;
    if (!broken) out += `<ellipse cx="${f(c * rx * 1.32)}" cy="${f(cy + s * ry * 1.32)}" rx=".7" ry=".7" fill="url(#${id}w)" stroke="#1e160e" stroke-width=".18"/>`;
    else out += `<path d="M${f(x1 - 0.4)} ${f(y1)}l.4 -.6l.4 .7Z" fill="#c8b490"/>`;
  }
  out += `<ellipse cx="0" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="#1e160e" stroke-width="1.9"/><ellipse cx="0" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="url(#${id}w)" stroke-width="1.4"/>`;
  out += `<ellipse cx="0" cy="${cy}" rx="${f(rx - 0.75)}" ry="${f(ry - 0.75)}" fill="none" stroke="#2a2016" stroke-width=".2"/><ellipse cx="-.3" cy="${f(cy - 0.3)}" rx="${rx}" ry="${ry}" fill="none" stroke="#c8b490" stroke-width=".25" stroke-opacity=".4" stroke-dasharray="6 30"/>`;
  out += `<ellipse cx="0" cy="${cy}" rx="1.9" ry="2.2" fill="url(#${id}w)" stroke="#1e160e" stroke-width=".2"/><ellipse cx="0" cy="${cy}" rx="1.05" ry="1.2" fill="url(#${id}h)" stroke="#2a1a08" stroke-width=".15"/>`;
  void R; return out;
}
/** a piece of another ship's mast lying on the sand with its yard still crossed on it: the mast's round with its
 *  hoops and the cap at its head, the yard lashed across it by the parrel, a rag of sail on the yard, rope ends */
export function mastYard(id: string, R: () => number, sail: string): string {
  let out = `<defs>${lin(id + 'm', [[0, '#9a8a6a'], [0.45, '#6a5a42'], [1, '#2a2218']])}${lin(id + 'y', [[0, '#8a7a5c'], [1, '#2e261c']])}</defs>`;
  const L0 = -22, L1 = 22, r = 2.1;
  // the yard behind, crossing at a shallow angle (its far end on the sand)
  out += `<g transform="rotate(-11 4 -2.6)"><rect x="-13" y="-4.2" width="30" height="2.1" rx="1" fill="url(#${id}y)" stroke="#1a140e" stroke-width=".18"/>` +
    `<path d="M-6 -2.1C-5 1 -3.5 2.4 -1.6 3.4L4 3.6C5.2 2 7 1.2 8.6 -2.1Z" fill="${sail}" fill-opacity=".85"/>` +
    `<path d="M-1.6 3.4l-.3 1.6M.4 3.6l.2 1.4M2.2 3.6l-.2 1.8M4 3.6l.5 1.2" stroke="${sail}" stroke-width=".25"/></g>`;
  // the mast
  const tip: P[] = [[L1, -r * 2], ...jag([L1, -r * 2], [L1 - 1.2, 0], 6, 1.6, R), [L1 - 1.2, 0]];
  out += `<path d="M${L0} ${f(-r * 2 - 0.3)}L${L1} ${-r * 2}L${pts(tip.slice(1)).replace(/ /g, 'L')}L${L0} .2Z" fill="url(#${id}m)" stroke="#1a140e" stroke-width=".2"/>`;
  out += `<polyline points="${pts(tip)}" fill="none" stroke="#d8c8a2" stroke-width=".22"/>`;
  for (const x of [-12, -2, 9]) out += `<rect x="${x}" y="${f(-r * 2 - 0.25)}" width="1.1" height="${f(r * 2 + 0.4)}" fill="#3a2414"/><path d="M${x + 0.5} ${f(-r * 2 + 0.6)}v1.8" stroke="#9a5426" stroke-width=".3" stroke-opacity=".6"/>`;
  // the cap at the head: a block with the hole of the topmast
  out += `<path d="M${L0 - 1.2} ${f(-r * 2 - 1.2)}h4.6v${f(r * 2 + 1.6)}h-4.6Z" fill="#3e3224" stroke="#140e08" stroke-width=".2"/><ellipse cx="${L0 + 1.1}" cy="${f(-r)}" rx=".9" ry="1.1" fill="#0e0a06"/>`;
  // the parrel: rope turns where the yard crosses, rope ends trailing
  out += `<path d="M2.4 -4.6q1 2.4 0 4.6M3.4 -4.6q1 2.4 0 4.6M4.4 -4.6q1 2.4 0 4.6" fill="none" stroke="#4a3e2c" stroke-width=".55"/><path d="M5 -.2C6.4 .6 7.4 -.2 8.6 .1" fill="none" stroke="#5a4e3a" stroke-width=".4"/>`;
  out += `<path d="M${L0 + 6} ${f(-r * 2 + 0.3)}h8M${L0 + 18} ${f(-r * 0.5)}h10" stroke="#c8b898" stroke-width=".25" stroke-opacity=".4"/>`;
  return out;
}
/** a big conch shell lying on its side: the spire, the whorls with their knobs, the flared lip and the pink inside */
export function conch(id: string): string {
  return `<defs>${rad(id + 's', [[0, '#f2e6cc'], [0.55, '#d0b892'], [1, '#7a6448']], 0.4, 0.3, 0.85)}${rad(id + 'i', [[0, '#e8b8a0'], [1, '#9a5a4a']], 0.6, 0.6, 0.7)}</defs>` +
    `<path d="M-9 -2.4C-8.2 -3.6 -6 -5.2 -3 -6.2C0 -7.2 4 -7.4 6.6 -6C8.6 -4.8 9.4 -2.4 8.6 -.6C7.6 .2 4 0 1 -.2L-6 -.6C-8 -.8 -9.4 -1.4 -9 -2.4Z" fill="url(#${id}s)" stroke="#5a4630" stroke-width=".22"/>` +
    `<path d="M-9 -2.4L-11.4 -2.9L-9.2 -1.6Z" fill="#c8b08a" stroke="#5a4630" stroke-width=".15"/>` +
    `<path d="M-6.6 -4.7C-6 -3.2 -6 -1.6 -6.8 -.7M-3.6 -6C-2.8 -4 -2.8 -1.6 -3.6 -.3M0 -6.9C1 -4.4 1 -1.6 0 -.2" fill="none" stroke="#7a6448" stroke-width=".28"/>` +
    `<path d="M-5.2 -5.6l.4 -1M-1.8 -6.6l.3 -1.2M1.8 -7.2l.4 -1" stroke="#a89070" stroke-width=".9" stroke-linecap="round"/>` +
    `<path d="M2.6 -1.2C3.6 -4.6 6.6 -5.8 8.2 -4C9.2 -2.6 8.4 -.8 6 -.6C4.6 -.5 3.2 -.6 2.6 -1.2Z" fill="url(#${id}i)" stroke="#6a4434" stroke-width=".2"/>` +
    `<path d="M-6 -4.2C-2 -5.6 2 -6.2 5.4 -5.6" fill="none" stroke="#fff6e0" stroke-width=".45" stroke-opacity=".55"/>`;
}
/** a clump of shells grown on a broken timber end: mussels in a bunch, an oyster, scallops, a little spiral shell */
export function shellBed(id: string, R: () => number): string {
  let out = `<defs>${lin(id + 'w', [[0, '#6a5e4a'], [1, '#2a241a']])}${lin(id + 'm', [[0, '#3a4258'], [0.6, '#1a1e2a'], [1, '#0a0c12']], 0, 0, 1, 1)}</defs>`;
  out += `<path d="M-9 0L-8.6 -4.4L6 -5.2L7.4 -3.6L6.8 -1.4L8.2 0Z" fill="url(#${id}w)" stroke="#1a140e" stroke-width=".18"/>`;
  // mussels: dark blue-black ovals in a bunch, their beaks together
  for (let i = 0; i < 9; i++) {
    const x = -6.4 + i * 1.3 + (R() - 0.5), y = -5 - R() * 2.2, a = -60 + i * 14 + (R() - 0.5) * 20;
    out += `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)})"><ellipse rx="1.9" ry=".85" fill="url(#${id}m)" stroke="#05060a" stroke-width=".12"/><path d="M-1.4 -.3Q0 -.8 1.6 -.2" fill="none" stroke="#7a86a0" stroke-width=".18" stroke-opacity=".7"/></g>`;
  }
  // an oyster on the side, scallops, the spiral shell
  out += `<path d="M2.6 -3.4C3.4 -6 6.6 -6.4 7.6 -4.6C8.4 -3 7 -1.6 5.2 -1.6C4 -1.6 2.8 -2.2 2.6 -3.4Z" fill="#b8ae98" stroke="#4a4436" stroke-width=".18"/><path d="M3.6 -3.4Q5.4 -5 7.2 -4.2M3.4 -2.6Q5.4 -3.6 7.2 -3" fill="none" stroke="#6a6250" stroke-width=".18"/>`;
  for (const [x, y, a] of [[-7.6, -1.2, -20], [-3.6, -0.4, 14]] as [number, number, number][]) {
    let ribs = ''; for (let i = 0; i < 7; i++) { const t = -1.1 + i * 0.37; ribs += `M0 0L${f(Math.sin(t) * 2.6)} ${f(-Math.cos(t) * 2.6)}`; }
    out += `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M0 0L-2.5 -1.2C-2.3 -2.8 -1.1 -3.1 0 -3.1C1.1 -3.1 2.3 -2.8 2.5 -1.2Z" fill="#d8c8aa" stroke="#6a5c46" stroke-width=".18"/><path d="${ribs}" stroke="#9a8a6c" stroke-width=".15"/></g>`;
  }
  out += `<path d="M5.4 -.2C3.8 -.2 3.4 -2 4.6 -2.8C5.8 -3.6 7.4 -2.6 7 -1.2C6.8 -.2 5.6 0 5.4 -.8" fill="#d0c4a8" stroke="#5a5040" stroke-width=".2"/>`;
  return out;
}
/** a broken board of another ship: wide, its paint faded to a ghost of its colour and peeling, a ragged break at one end,
 *  nail holes and rust, a bolt; the other end sawn square */
export function board(id: string, R: () => number, len: number, th: number, paint: string | null): string {
  const L0 = -len / 2, L1 = len / 2;
  const end: P[] = [[L1, -th], ...jag([L1, -th], [L1 - 2.2, 0], 8, 2.6, R).map(([x, y]): P => [x + (R() - 0.3) * 3, y]), [L1 - 2.2, 0]];
  const shape = `M${L0} ${f(-th)}L${pts(end).replace(/ /g, 'L')}L${L0} 0Z`;
  let out = `<defs>${lin(id + 'w', [[0, '#a89c80'], [0.55, '#7a6e56'], [1, '#3a3226']])}<clipPath id="${id}k"><path d="${shape}"/></clipPath></defs><path d="${shape}" fill="url(#${id}w)" stroke="#2a221a" stroke-width=".2"/>`;
  let inner = '';
  if (paint) inner += blots(L0, -th, L1 - 3, 0, Math.round(len / 3), th * 0.5, paint, 0.6, R);
  let g = ''; for (let i = 0; i < th * 2.2; i++) { const y = -th * (0.12 + 0.76 * R()), x0 = L0 + R() * len * 0.3, x1 = L1 - R() * len * 0.25; g += `M${f(x0)} ${f(y)}Q${f((x0 + x1) / 2)} ${f(y + (R() - 0.5) * 0.9)} ${f(x1)} ${f(y + (R() - 0.5) * 0.5)}`; }
  inner += `<path d="${g}" fill="none" stroke="#3a3226" stroke-width=".14" stroke-opacity=".6"/><path d="M${L0} ${f(-th + 0.25)}H${f(L1 - 1)}" stroke="#d8ccae" stroke-width=".3" stroke-opacity=".5"/><path d="M${L0} -.3H${L1}" stroke="#1a140e" stroke-width=".5" stroke-opacity=".4"/>`;
  for (let i = 0; i < Math.round(len / 8); i++) { const x = L0 + 2.5 + R() * (len - 8), y = -th * (0.3 + 0.4 * R()); inner += `<circle cx="${f(x)}" cy="${f(y)}" r=".36" fill="#2a1a10"/><path d="M${f(x)} ${f(y + 0.35)}q.2 ${f(0.8 + R())} -.1 ${f(1.4 + R() * 1.4)}" stroke="#8a4a20" stroke-width=".35" stroke-opacity=".55" fill="none"/>`; }
  out += `<g clip-path="url(#${id}k)">${inner}</g><polyline points="${pts(end)}" fill="none" stroke="#e0d2b0" stroke-width=".28"/>`;
  out += `<rect x="${f(L0 + 1.2)}" y="${f(-th * 0.62)}" width="1.1" height="1.1" fill="#2a1a10"/><path d="M${f(L0 + 1.75)} ${f(-th * 0.62 + 1.1)}v${f(th * 0.4)}" stroke="#8a4a20" stroke-width=".4" stroke-opacity=".6"/>`;
  return out;
}
