// V7: the panorama of the victory sheet — a port of docs/mockups/a5/art/pano.py. The low sun behind the ships, clouds,
// rays, an island with palms, gulls, the sun path; the winners under sail with a warm rim of light (vlit) and a blurred
// reflection; the sunk ships as dark silhouettes against the sun (vback), heeling, half in the water, burning, the smoke
// going left; planks, a barrel, a longboat. Who is where comes from the end of the game (panoShips): the places of the
// winners hold the ships afloat, the places of the sinking — the ships sunk. The ids are unique for each picture.
import SHIPS from './panoShips.json';
import { createRng } from '../../../engine/rng';

type Kind = keyof typeof SHIPS;
const KIND: Record<string, Kind> = { Ж: 'pearl', М: 'revenge', И: 'endeavour', Г: 'dutch' };

const f1 = (n: number) => String(Math.round(n * 10) / 10);
const f2 = (n: number) => String(Math.round(n * 100) / 100);

let uid = 0;
/** Unique ids (and the url(#…) to them) inside one piece of SVG: fx3.js uidSvg. */
function uniq(svg: string, tag: string): string {
  const sfx = `${tag}${++uid}`;
  return svg.replace(/id="([^"]+)"/g, (_, a) => `id="${a}_${sfx}"`).replace(/url\(#([^)]+)\)/g, (_, a) => `url(#${a}_${sfx})`);
}

function ship(kind: Kind, x: number, y: number, s: number, rot = 0): string {
  return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${rot}) scale(${f2(s)})"><g transform="translate(-60 -71)">${uniq(SHIPS[kind], 'p')}</g></g>`;
}

function cloud(x: number, y: number, w: number): string {
  const k = w / 100;
  const blobs: [number, number, number, number][] = [[0, 0, 22, 9], [20, -7, 20, 11], [42, -4, 22, 10], [62, 1, 18, 8], [-18, 3, 14, 6]];
  const body = blobs.map(([a, b, rx, ry]) => `<ellipse cx="${f1(x + a * k)}" cy="${f1(y + b * k)}" rx="${f1(rx * k)}" ry="${f1(ry * k)}"/>`).join('');
  return `<g fill="#fff6e2" opacity=".85">${body}</g><ellipse cx="${f1(x + 24 * k)}" cy="${f1(y + 6 * k)}" rx="${f1(46 * k)}" ry="${f1(4.5 * k)}" fill="#f2b48a" opacity=".55"/>`;
}

function gull(x: number, y: number, s = 1, o = 0.75): string {
  return `<path d="M${f1(x - 5 * s)} ${f1(y)} q${f1(2.5 * s)} ${f1(-3 * s)} ${f1(5 * s)} 0 q${f1(2.5 * s)} ${f1(-3 * s)} ${f1(5 * s)} 0" stroke="#3a2e26" stroke-width="${f1(Math.max(0.8, 1.1 * s))}" fill="none" opacity="${o}" stroke-linecap="round"/>`;
}

function palm(x: number, y: number, h: number, lean = 4): string {
  const tx = x + lean, ty = y - h;
  const fr = [[-9, 3], [-6, 6], [8, 2], [6, 6], [1, -4]].map(([dx, dy]) => `<path d="M${tx} ${ty} q${f1(dx * 0.5)} ${dy - 3} ${dx} ${dy}" stroke="#55665f" stroke-width="1.6" fill="none" stroke-linecap="round"/>`).join('');
  return `<path d="M${x} ${y} Q${f1(x + lean * 0.2)} ${f1(y - h * 0.6)} ${tx} ${ty}" stroke="#55665f" stroke-width="1.6" fill="none"/>` + fr;
}

/** A rising column bending with the wind (to the left). */
function smoke(x: number, y: number, h: number, w: number, drift: number): string {
  const rnd = createRng(Math.round(x * 7 + y));
  const u = (a: number, b: number) => a + (b - a) * rnd.next();
  const n = 16;
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const cx = x - drift * t * t + u(-2, 2), cy = y - h * t;
    const r = w * (0.6 + t * 1.1) * u(0.85, 1.15);
    const c = t < 0.45 ? '#4a4440' : t < 0.75 ? '#8a847c' : '#b8b2a8';
    out.push(`<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}" fill="${c}" opacity="${f2(0.6 - t * 0.38)}"/>`);
  }
  // the sunlit edge of the smoke
  for (let i = 5; i < n; i += 2) {
    const t = i / (n - 1), cx = x - drift * t * t, cy = y - h * t, r = w * (0.6 + t * 1.1);
    out.push(`<path d="M${f1(cx + r * 0.2)} ${f1(cy - r * 0.95)} A${f1(r)} ${f1(r)} 0 0 1 ${f1(cx + r * 0.95)} ${f1(cy - r * 0.1)}" stroke="#ffd9a0" stroke-width="${f1(Math.max(0.8, r * 0.18))}" fill="none" opacity=".45"/>`);
  }
  return `<g class="pano-smoke" filter="url(#vsoft)">${out.join('')}</g>`;
}

function flames(x: number, y: number, s = 1): string {
  const v = (n: number) => f1(n * s);
  return (
    `<ellipse cx="${x}" cy="${f1(y)}" rx="${v(12)}" ry="${v(8)}" fill="url(#vfire)"/>` +
    `<path d="M${f1(x - 4 * s)} ${f1(y + 2 * s)} q${v(-1)} ${v(-5)} ${v(2)} ${v(-9)} q0 ${v(4)} ${v(2)} ${v(5)} q${v(1)} ${v(-4)} ${v(3)} ${v(-6)} q${v(2)} ${v(5)} ${v(-1)} ${v(10)} Z" fill="#f08a2c"/>` +
    `<path d="M${f1(x - 2 * s)} ${f1(y + 2 * s)} q0 ${v(-3)} ${v(1.5)} ${v(-5)} q${v(0.5)} ${v(2.5)} ${v(1.5)} ${v(2.5)} q${v(0.5)} ${v(1.5)} ${v(-0.5)} ${v(2.5)} Z" fill="#ffd36a"/>`
  );
}

function plank(x: number, y: number, w: number, rot: number): string {
  return `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="${-w / 2}" y="-1.2" width="${w}" height="2.4" rx=".6" fill="#6b4a2c"/><rect x="${-w / 2}" y="-1.2" width="${w}" height=".8" fill="#a07a4c"/></g>`;
}

function barrel(x: number, y: number): string {
  return (
    `<g transform="translate(${x} ${y}) rotate(-12)"><rect x="-4" y="-3.4" width="8" height="5" rx="1.6" fill="#7a5230"/>` +
    `<path d="M-4 -1.8 H4 M-4 .4 H4" stroke="#2f2a26" stroke-width=".8"/><path d="M-3.2 -3 H-1" stroke="#c49a62" stroke-width=".8"/></g>` +
    `<path d="M${x - 7} ${y + 2} q3 -1.4 6 0 t6 0" stroke="#e3f0f1" stroke-width=".8" fill="none" opacity=".7"/>`
  );
}

function longboat(x: number, y: number, k = 1): string {
  const rowers = [-4, 1, 6]
    .map(
      (dx) =>
        `<circle cx="${f1(x + dx * k)}" cy="${f1(y - 5.2 * k)}" r="${f1(1.3 * k)}" fill="#2f2620"/><path d="M${f1(x + dx * k)} ${f1(y - 4 * k)} v${f1(2.6 * k)}" stroke="#2f2620" stroke-width="${f1(1.8 * k)}"/>` +
        `<path d="M${f1(x + (dx - 1) * k)} ${f1(y - 2.6 * k)} L${f1(x + (dx - 5) * k)} ${f1(y + 2.2 * k)}" stroke="#6b4a2c" stroke-width="${f1(0.7 * k)}"/>`,
    )
    .join('');
  const v = (n: number) => f1(n * k);
  return (
    `<ellipse cx="${x}" cy="${f1(y + 1.4 * k)}" rx="${v(13)}" ry="${v(1.4)}" fill="#173844" opacity=".45"/>${rowers}` +
    `<path d="M${f1(x - 11 * k)} ${f1(y - 2.4 * k)} L${f1(x + 10 * k)} ${f1(y - 2.4 * k)} L${f1(x + 12 * k)} ${f1(y - 3.6 * k)} Q${f1(x + 10 * k)} ${f1(y + 1.2 * k)} ${f1(x + 6 * k)} ${f1(y + 1.2 * k)} L${f1(x - 8 * k)} ${f1(y + 1.2 * k)} Q${f1(x - 11 * k)} ${f1(y)} ${f1(x - 11 * k)} ${f1(y - 2.4 * k)} Z" fill="#7a5230" stroke="#2a1d12" stroke-width="${v(0.6)}"/>` +
    `<path d="M${f1(x - 10.6 * k)} ${f1(y - 1.6 * k)} L${f1(x + 10.6 * k)} ${f1(y - 1.6 * k)}" stroke="#b08454" stroke-width="${v(0.6)}"/>` +
    `<path d="M${f1(x - 14 * k)} ${f1(y + 1.6 * k)} q4 -1.6 8 0 M${f1(x + 11 * k)} ${f1(y + 1.2 * k)} q3 -1 6 0" stroke="#e3f0f1" stroke-width=".8" fill="none" opacity=".7"/>`
  );
}

function sunpath(sx: number, y0: number, y1: number, spread: number, n = 34, seed = 3): string {
  const rnd = createRng(seed);
  const u = (a: number, b: number) => a + (b - a) * rnd.next();
  // Box–Muller: random.gauss of pano.py
  const gauss = () => Math.sqrt(-2 * Math.log(1 - rnd.next())) * Math.cos(2 * Math.PI * rnd.next());
  const out = [`<path d="M${f1(sx - spread * 0.25)} ${y0} L${f1(sx + spread * 0.25)} ${y0} L${f1(sx + spread * 1.4)} ${y1} L${f1(sx - spread * 1.4)} ${y1} Z" fill="#ffe2a0" opacity=".12"/>`];
  for (let i = 0; i < n; i++) {
    const t = rnd.next() ** 0.8, y = y0 + (y1 - y0) * t;
    const w = 1.5 + t * 9 * u(0.4, 1.3), x = sx + gauss() * 0.55 * spread * (0.2 + t * 1.1);
    out.push(`<path d="M${f1(x - w / 2)} ${f1(y)} q${f1(w / 2)} -.6 ${f1(w)} 0" stroke="#fff0c0" stroke-width="${f1(0.5 + t * 0.7)}" fill="none" stroke-linecap="round" opacity="${f2(0.9 - t * 0.45)}"/>`);
  }
  return out.join('');
}

/** A place of a winner: x, the waterline, the scale. */
type WinSlot = [number, number, number];
/** A place of a sinking ship: x, the waterline, the scale, the heel, the fire, the smoke (height, width, drift). */
type SinkSlot = [number, number, number, number, [number, number], [number, number, number]];

export interface PanoLayout {
  W: number;
  H: number;
  hz: number;
  sun: [number, number];
  sunR: number;
  spread: number;
  clouds: [number, number, number][];
  rays: [number, number][];
  island: string;
  palms: [number, number, number, number][];
  gulls: [number, number, number][];
  ripples: [number, number, number][];
  planks: [number, number, number, number][];
  barrels: [number, number][];
  boats: [number, number, number][];
  /** By the number of the ships afloat (1–4): their places, the first in front. */
  win: WinSlot[][];
  /** By the number of the ships sunk (1–3). */
  sink: SinkSlot[][];
}

/** The laptop: 772×170 (pano.py WIDE; two winners and two sunk are its own places). */
export const WIDE: PanoLayout = {
  W: 772, H: 170, hz: 118, sun: [598, 100], sunR: 13, spread: 26,
  clouds: [[70, 30, 120], [250, 22, 90], [470, 42, 110], [690, 26, 80]],
  rays: [[-180, 40], [-60, 30], [60, 34], [170, 40]],
  island: 'M466 118 Q478 109 492 110 Q506 101 522 106 Q536 104 548 113 L556 118 Z',
  palms: [[498, 110, 13, 3], [512, 106, 15, -4], [528, 107, 11, 4]],
  gulls: [[300, 40, 1], [318, 50, 0.8], [720, 60, 0.7], [120, 66, 0.6]],
  ripples: [[30, 140, 26], [150, 160, 30], [300, 152, 22], [520, 160, 30], [640, 146, 26], [720, 160, 28], [440, 136, 18], [90, 124, 14], [360, 126, 12]],
  planks: [[560, 140, 14, 18], [586, 134, 9, -10], [680, 146, 12, 6], [742, 138, 8, 30], [520, 152, 10, -6]],
  barrels: [[640, 150]],
  boats: [[486, 146, 1.1]],
  win: [
    [[260, 150, 1.95]],
    [[168, 150, 1.95], [386, 140, 1.62]],
    [[120, 150, 1.6], [290, 142, 1.4], [440, 135, 1.15]],
    [[95, 150, 1.35], [228, 144, 1.2], [352, 138, 1.05], [462, 133, 0.9]],
  ],
  sink: [
    [[650, 124, 0.62, 14, [642, 96], [84, 9, 70]]],
    [[620, 124, 0.62, 14, [612, 96], [84, 9, 70]], [712, 126, 0.5, -20, [712, 106], [64, 7, 52]]],
    [[600, 124, 0.58, 14, [592, 98], [84, 9, 70]], [690, 126, 0.48, -20, [690, 107], [64, 7, 52]], [748, 121, 0.36, 10, [747, 111], [48, 5, 40]]],
  ],
};

/** The phone: 400×150 (pano.py PHONE). */
export const PHONE: PanoLayout = {
  W: 400, H: 150, hz: 108, sun: [356, 90], sunR: 10, spread: 16,
  clouds: [[30, 22, 64], [190, 14, 52], [318, 30, 44]],
  rays: [[-120, 26], [-40, 20], [40, 22]],
  island: 'M196 108 Q204 102 212 103 Q222 97 232 101 Q240 101 246 106 L250 108 Z',
  palms: [[214, 102, 9, 2], [224, 100, 10, -3]],
  gulls: [[150, 30, 0.8], [162, 38, 0.6], [300, 52, 0.5]],
  ripples: [[14, 132, 20], [120, 146, 22], [210, 128, 16], [300, 146, 20], [370, 132, 14]],
  planks: [[318, 124, 8, 18], [334, 132, 6, -10], [372, 138, 7, 6]],
  barrels: [[356, 142]],
  boats: [[300, 136, 0.7]],
  win: [
    [[160, 142, 1.45]],
    [[98, 142, 1.45], [252, 134, 1.18]],
    [[72, 142, 1.15], [182, 136, 1.0], [282, 131, 0.85]],
    [[56, 142, 0.95], [146, 137, 0.85], [230, 132, 0.75], [302, 129, 0.68]],
  ],
  sink: [
    [[364, 114, 0.36, 14, [360, 98], [56, 5, 40]]],
    [[352, 114, 0.36, 14, [348, 98], [56, 5, 40]], [390, 116, 0.28, -20, [390, 106], [40, 4, 30]]],
    [[328, 113, 0.34, 14, [324, 98], [56, 5, 40]], [366, 116, 0.28, -20, [366, 106], [40, 4, 30]], [394, 111, 0.22, 10, [393, 104], [32, 3, 24]]],
  ],
};

/** Who stands where: the winners afloat (the first in front) and the sunk ships, by their codes. */
export interface PanoCast {
  afloat: string[];
  sunk: string[];
}

/**
 * Who the panorama shows at the end of a game: the places of the winners hold the ships of the winning side afloat
 * (on a draw — all the ships afloat), the places of the sinking — all the sunk ships. `order` — the codes in the order
 * of the sheet (the first one stands in front).
 */
export function panoCast(order: string[], sideOf: (code: string) => string, sunk: (code: string) => boolean, winner: string | null): PanoCast {
  return {
    afloat: order.filter((c) => !sunk(c) && (winner === 'НИЧЬЯ' || !winner || sideOf(c) === winner)).slice(0, 4),
    sunk: order.filter((c) => sunk(c)).slice(0, 3),
  };
}

/** The panorama as an <svg> (viewBox of the layout, it covers its box: preserveAspectRatio slice). */
export function panoSvg(L: PanoLayout, cast: PanoCast): string {
  const { W, H, hz } = L;
  const [sx, sy] = L.sun;
  const win = cast.afloat.map((c, i) => [KIND[c] ?? 'pearl', ...(L.win[cast.afloat.length - 1] ?? [])[i]] as [Kind, number, number, number]);
  const sink = cast.sunk.map((c, i) => [KIND[c] ?? 'endeavour', ...(L.sink[cast.sunk.length - 1] ?? [])[i]] as [Kind, ...SinkSlot]);
  const d: string[] = [
    `<svg class="pano-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">`,
    '<defs>' +
      '<linearGradient id="vsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9a27a"/><stop offset=".35" stop-color="#ebc48e"/><stop offset=".75" stop-color="#f8e2b6"/><stop offset="1" stop-color="#fcefd2"/></linearGradient>' +
      '<linearGradient id="vsea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a9ea2"/><stop offset=".25" stop-color="#4f7f8c"/><stop offset="1" stop-color="#1f4352"/></linearGradient>' +
      '<radialGradient id="vsun"><stop offset="0" stop-color="#fff7d8"/><stop offset=".25" stop-color="#ffe39a" stop-opacity=".9"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="vfire"><stop offset="0" stop-color="#ffcf6a" stop-opacity=".95"/><stop offset=".5" stop-color="#f07a2a" stop-opacity=".55"/><stop offset="1" stop-color="#c8401a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="vvig" cx=".5" cy=".45" r=".75"><stop offset=".6" stop-color="#2a1a10" stop-opacity="0"/><stop offset="1" stop-color="#2a1a10" stop-opacity=".35"/></radialGradient>' +
      // the sun is behind and to the right: dim the ships a touch and put a warm rim on their right/top edges
      '<filter id="vlit" x="-4%" y="-4%" width="108%" height="108%" color-interpolation-filters="sRGB">' +
      '<feOffset in="SourceAlpha" dx="-.55" dy=".45" result="o"/><feComposite in="SourceAlpha" in2="o" operator="out" result="rim"/>' +
      '<feFlood flood-color="#ffd585"/><feComposite in2="rim" operator="in" result="rimc"/>' +
      '<feComponentTransfer in="SourceGraphic" result="dim"><feFuncR type="linear" slope=".9" intercept=".02"/><feFuncG type="linear" slope=".84"/><feFuncB type="linear" slope=".76"/></feComponentTransfer>' +
      '<feMerge><feMergeNode in="dim"/><feMergeNode in="rimc"/></feMerge></filter>' +
      // the sunk ships are backlit against the sun: almost silhouettes, warm haze
      '<filter id="vback" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".32 .12 .04 0 .12  .22 .2 .04 0 .08  .14 .12 .1 0 .06  0 0 0 1 0"/></filter>' +
      '<filter id="vsoft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4"/></filter><filter id="vblur"><feGaussianBlur stdDeviation="1.1"/></filter>' +
      `<clipPath id="vseaC"><rect x="0" y="${hz}" width="${W}" height="${H - hz}"/></clipPath>` +
      sink.map(([, , wl], i) => `<clipPath id="vsink${i}"><rect x="0" y="0" width="${W}" height="${wl}"/></clipPath>`).join('') +
      '</defs>',
    `<rect width="${W}" height="${H}" fill="url(#vsky)"/>`,
    `<circle cx="${sx}" cy="${sy}" r="${L.sunR * 5}" fill="url(#vsun)"/>`,
    L.clouds.map(([x, y, w]) => cloud(x, y, w)).join(''),
    `<circle cx="${sx}" cy="${sy}" r="${L.sunR}" fill="#fff4cf"/>`,
    // sun rays through the haze
    `<g opacity=".18" fill="#fff2c8">${L.rays.map(([a, b]) => `<path d="M${sx} ${sy} L${sx + a} 0 L${sx + a + b} 0 Z"/>`).join('')}</g>`,
    // a hazy island on the horizon with palms
    `<g opacity=".72"><path d="${L.island}" fill="#8f9c92"/>${L.palms.map(([x, y, h, l]) => palm(x, y, h, l)).join('')}</g>`,
    L.gulls.map(([x, y, s]) => gull(x, y, s)).join(''),
    // the sea
    `<rect x="0" y="${hz}" width="${W}" height="${H - hz}" fill="url(#vsea)"/>`,
    `<rect x="0" y="${hz - 0.5}" width="${W}" height="2" fill="#fff0c4" opacity=".55"/>`,
    sunpath(sx, hz + 2, H, L.spread),
    `<g stroke="#cfe3e6" fill="none" stroke-linecap="round">${L.ripples.map(([x, y, w]) => `<path d="M${x} ${y} q${f1(w / 4)} -${f1(w / 8)} ${f1(w / 2)} 0 t${f1(w / 2)} 0" stroke-width="${f1(1 + (y - hz) / (H - hz))}" opacity="${f2(0.25 + (0.35 * (y - hz)) / (H - hz))}"/>`).join('')}</g>`,
  ];
  // the sunk ships: burning, heeling, going down near the sun
  sink.forEach(([kind, x, wl, s, rot, fire, sm], i) => {
    d.push(smoke(fire[0], fire[1], ...sm));
    d.push(`<g clip-path="url(#vsink${i})" data-pano-sunk="${cast.sunk[i]}"><g filter="url(#vback)" opacity=".92">${ship(kind, x, wl + 6 * s, s, rot)}</g></g>`);
    d.push(flames(fire[0], fire[1] + 3, s * 1.1));
    d.push(`<path d="M${f1(x - 46 * s)} ${f1(wl)} q${f1(12 * s)} -${f1(3 * s)} ${f1(24 * s)} 0 t${f1(24 * s)} 0 t${f1(24 * s)} 0 t${f1(24 * s)} 0" stroke="#fff3d6" stroke-width="1.2" fill="none" opacity=".8"/>`);
    d.push(([[-20, 2, 1.2], [6, 4, 0.9], [22, 1, 1.4], [-6, 6, 0.7]] as const).map(([dx, dy, r]) => `<circle cx="${f1(x + dx * s)}" cy="${f1(wl + 3 + dy)}" r="${r}" fill="none" stroke="#e8f3f4" stroke-width=".6" opacity=".7"/>`).join(''));
  });
  // debris and a longboat of survivors — where a ship went down
  if (sink.length > 0) d.push(L.planks.map(([x, y, w, r]) => plank(x, y, w, r)).join('') + L.barrels.map(([x, y]) => barrel(x, y)).join('') + L.boats.map(([x, y, k]) => longboat(x, y, k)).join(''));
  // the winners: reflections first (blurred, broken), then the ships lit from behind
  for (const [kind, x, y, s] of win) d.push(`<g clip-path="url(#vseaC)" opacity=".26" filter="url(#vblur)"><g transform="translate(0 ${f1(2 * y)}) scale(1 -1)">${ship(kind, x, y + 1.5, s)}</g></g>`);
  win.forEach(([kind, x, y, s], i) => {
    d.push(`<g class="pano-sway" data-pano-afloat="${cast.afloat[i]}" style="animation-delay:${-i * 1.7}s"><g filter="url(#vlit)">${ship(kind, x, y, s)}</g></g>`);
    d.push(`<path d="M${f1(x - 58 * s)} ${f1(y + 1.5)} q${f1(6 * s)} -${f1(2 * s)} ${f1(12 * s)} 0 M${f1(x + 30 * s)} ${f1(y + 2)} q${f1(10 * s)} ${f1(2 * s)} ${f1(24 * s)} 0" stroke="#fff" stroke-width="1.3" fill="none" opacity=".75" stroke-linecap="round"/>`);
  });
  // foreground swell, warm light, vignette
  d.push(`<path d="M0 ${H - 6} q${f1(W / 16)} -5 ${f1(W / 8)} 0 ${Array.from({ length: 7 }, () => `t${f1(W / 8)} 0`).join(' ')} V${H} H0 Z" fill="#183a48" opacity=".55"/>`);
  d.push(`<rect width="${W}" height="${H}" fill="url(#vvig)"/>`);
  d.push('</svg>');
  return uniq(d.join(''), 'v');
}
