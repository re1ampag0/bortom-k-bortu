// Engraved icons of the printed game: contour + hatching clipped to the shape, like the cartouches of an 18th-century
// sea chart. Every icon is drawn in a 100x100 local box and placed with a transform. Pure string functions (no node:*),
// no filters, no text. Ids are unique per call because one page repeats the same icon dozens of times.

export type IconName =
  | 'sails' | 'crew' | 'guns' | 'hull' | 'fire' | 'powder' | 'souls' | 'reaction' | 'plan' | 'once'
  | 'cards' | 'legend' | 'effects' | 'seaDeck' | 'seaCard' | 'underwater' | 'surfaced';

/** Two tones + highlight + the paper the icon sits on. */
export interface IconTone { ink: string; mid: string; light: string; paper: string }

export const TONE: Record<'sepia' | 'charcoal' | 'navy' | 'verdigris' | 'red', IconTone> = {
  sepia: { ink: '#2a1c0c', mid: '#a77b45', light: '#f6e7c2', paper: '#f3e6c4' },
  charcoal: { ink: '#1d1d20', mid: '#6b6b70', light: '#f2f1ed', paper: '#ecebe6' },
  navy: { ink: '#14284a', mid: '#5d7fa8', light: '#eef2f7', paper: '#e7ecf2' },
  verdigris: { ink: '#1e3a2e', mid: '#5e8f78', light: '#eef5ef', paper: '#e5eee7' },
  red: { ink: '#4a120c', mid: '#b0402c', light: '#faeadf', paper: '#f4e3d6' },
};

export const ICON_NAMES: IconName[] = [
  'sails', 'crew', 'guns', 'hull', 'fire', 'powder', 'souls', 'reaction', 'plan', 'once',
  'cards', 'legend', 'effects', 'seaDeck', 'seaCard', 'underwater', 'surfaced',
];

// ---------------------------------------------------------------- geometry helpers
// Paths are written with absolute M/L/Q/C/Z only, so every pair of numbers is a point (used for hatch bounding boxes).

type Pt = [number, number];
type Box = [number, number, number, number];
const f = (n: number) => String(Math.round(n * 100) / 100);
const pp = (p: Pt) => `${f(p[0])} ${f(p[1])}`;
const rad = (a: number) => (a * Math.PI) / 180;
const at = (cx: number, cy: number, r: number, a: number): Pt => [cx + r * Math.cos(rad(a)), cy + r * Math.sin(rad(a))];

function circ(cx: number, cy: number, rx: number, ry = rx): string {
  const c = 0.5523, kx = rx * c, ky = ry * c;
  return `M${f(cx - rx)} ${f(cy)}C${f(cx - rx)} ${f(cy - ky)} ${f(cx - kx)} ${f(cy - ry)} ${f(cx)} ${f(cy - ry)}` +
    `C${f(cx + kx)} ${f(cy - ry)} ${f(cx + rx)} ${f(cy - ky)} ${f(cx + rx)} ${f(cy)}` +
    `C${f(cx + rx)} ${f(cy + ky)} ${f(cx + kx)} ${f(cy + ry)} ${f(cx)} ${f(cy + ry)}` +
    `C${f(cx - kx)} ${f(cy + ry)} ${f(cx - rx)} ${f(cy + ky)} ${f(cx - rx)} ${f(cy)}Z`;
}
/** lower half of an ellipse, left to right (open) */
function lowerArc(cx: number, cy: number, rx: number, ry: number): string {
  const c = 0.5523;
  return `M${f(cx - rx)} ${f(cy)}C${f(cx - rx)} ${f(cy + ry * c)} ${f(cx - rx * c)} ${f(cy + ry)} ${f(cx)} ${f(cy + ry)}` +
    `C${f(cx + rx * c)} ${f(cy + ry)} ${f(cx + rx)} ${f(cy + ry * c)} ${f(cx + rx)} ${f(cy)}`;
}
const rect = (x: number, y: number, w: number, h: number) => `M${f(x)} ${f(y)}L${f(x + w)} ${f(y)}L${f(x + w)} ${f(y + h)}L${f(x)} ${f(y + h)}Z`;
function rrect(x: number, y: number, w: number, h: number, r: number): string {
  const X = x + w, Y = y + h;
  return `M${f(x + r)} ${f(y)}L${f(X - r)} ${f(y)}Q${f(X)} ${f(y)} ${f(X)} ${f(y + r)}L${f(X)} ${f(Y - r)}Q${f(X)} ${f(Y)} ${f(X - r)} ${f(Y)}` +
    `L${f(x + r)} ${f(Y)}Q${f(x)} ${f(Y)} ${f(x)} ${f(Y - r)}L${f(x)} ${f(y + r)}Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)}Z`;
}
const poly = (...n: number[]) => {
  let d = '';
  for (let i = 0; i + 1 < n.length; i += 2) d += `${i ? 'L' : 'M'}${f(n[i])} ${f(n[i + 1])}`;
  return d + 'Z';
};
/** everything except the given closed path (for evenodd clips) */
const outside = (d: string) => 'M-60 -60L160 -60L160 160L-60 160Z' + d;
/** a row of waves: rounded troughs, pointed crests at y */
function waveLine(y: number, amp: number, len: number, x0 = -4, x1 = 104, shift = 0): string {
  let d = `M${f(x0 + shift)} ${f(y)}`;
  for (let x = x0 + shift; x < x1; x += len) d += `Q${f(x + len / 2)} ${f(y + amp)} ${f(x + len)} ${f(y)}`;
  return d;
}
/** scallops (arches) for chart-style sea */
function scallops(x0: number, x1: number, y: number, len: number, h: number): string {
  let d = `M${f(x0)} ${f(y)}`;
  for (let x = x0; x < x1 - 0.1; x += len) d += `Q${f(x + len / 2)} ${f(y - h)} ${f(x + len)} ${f(y)}`;
  return d;
}
function star(cx: number, cy: number, n: number, r0: number, r1: number, rot = -90): string {
  const p: number[] = [];
  for (let i = 0; i < n * 2; i++) p.push(...at(cx, cy, i % 2 ? r0 : r1, rot + (i * 180) / n));
  return poly(...p);
}
function bbox(d: string): Box {
  const n = (d.match(/-?\d*\.?\d+/g) ?? []).map(Number);
  const b: Box = [1e9, 1e9, -1e9, -1e9];
  for (let i = 0; i + 1 < n.length; i += 2) {
    b[0] = Math.min(b[0], n[i]); b[1] = Math.min(b[1], n[i + 1]);
    b[2] = Math.max(b[2], n[i]); b[3] = Math.max(b[3], n[i + 1]);
  }
  return b;
}
const meet = (a: Box, b: Box): Box => [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.min(a[3], b[3])];
/** parallel lines at angle a (degrees), spacing g, covering box b */
function lines(a: number, g: number, b: Box): string {
  const cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2, r = Math.hypot(b[2] - b[0], b[3] - b[1]) / 2 + 1;
  if (!(r > 1)) return '';
  const dx = Math.cos(rad(a)), dy = Math.sin(rad(a));
  let d = '';
  for (let o = -r + ((r % g) / 2); o < r; o += g) {
    const px = cx - dy * o, py = cy + dx * o;
    d += `M${f(px - dx * r)} ${f(py - dy * r)}L${f(px + dx * r)} ${f(py + dy * r)}`;
  }
  return d;
}

// ---------------------------------------------------------------- drawing context

type Fill = 'ink' | 'mid' | 'light' | 'paper' | 'none';
interface Hatch { a: number; g?: number; w?: number; r?: string }
interface ShapeOpt { fill?: Fill; mid?: string; hi?: string; h?: Hatch[]; inner?: string; sw?: number }

let seq = 0;
class K {
  defs: string[] = [];
  private n = ++seq;
  private i = 0;
  constructor(public t: IconTone, public small: boolean) {}
  c(x: Fill) { return x === 'none' ? 'none' : this.t[x]; }
  /** contour width; heavier when the icon is printed tiny */
  get cw() { return this.small ? 3.3 : 2.6; }
  w(x: number) { return this.small && x >= 1.4 ? x * 1.25 : x; }
  clip(d: string) {
    const id = `ic${this.n}-${this.i++}`;
    this.defs.push(`<clipPath id="${id}"><path d="${d}" clip-rule="evenodd"/></clipPath>`);
    return `url(#${id})`;
  }
  hatch(h: Hatch, sb: Box): string {
    const b = h.r ? meet(sb, bbox(h.r)) : sb;
    const g = (h.g ?? 2.8) * (this.small ? 1.3 : 1);
    const p = `<path d="${lines(h.a, g, [b[0] - 1, b[1] - 1, b[2] + 1, b[3] + 1])}" fill="none" stroke="${this.t.ink}" stroke-width="${h.w ?? 1}"/>`;
    return h.r ? `<g clip-path="${this.clip(h.r)}">${p}</g>` : p;
  }
  /** a filled shape: base fill, mid-tone zone, hatching, highlight, extra detail — all clipped to it — then the contour */
  shape(d: string, o: ShapeOpt = {}): string {
    let inner = '';
    if (o.mid) inner += `<path d="${o.mid}" fill="${this.t.mid}"/>`;
    const sb = bbox(d);
    for (const h of o.h ?? []) inner += this.hatch(h, sb);
    if (o.hi) inner += `<path d="${o.hi}" fill="${this.t.light}"/>`;
    if (o.inner) inner += o.inner;
    const sw = o.sw === undefined ? this.cw : this.w(o.sw);
    return `<path d="${d}" fill="${this.c(o.fill ?? 'light')}"/>` +
      (inner ? `<g clip-path="${this.clip(d)}">${inner}</g>` : '') +
      (sw ? `<path d="${d}" fill="none" stroke="${this.t.ink}" stroke-width="${f(sw)}"/>` : '');
  }
  /** a stroke */
  S(d: string, w = 1, col: Fill = 'ink', extra = ''): string {
    return `<path d="${d}" fill="none" stroke="${this.c(col)}" stroke-width="${f(this.w(w))}"${extra ? ' ' + extra : ''}/>`;
  }
  F(d: string, col: Fill): string { return `<path d="${d}" fill="${this.c(col)}"/>`; }
  /** hatched shadow with no contour */
  shade(d: string, a = 45, g = 1.8): string { return this.shape(d, { fill: 'none', sw: 0, h: [{ a, g }] }); }
}

// ---------------------------------------------------------------- shared motifs

/** 8-point compass star, one half of every point dark, one light */
function compass(k: K, cx: number, cy: number, R: number, r: number): string {
  let o = '';
  const point = (a: number, len: number, base: number, dark: Fill) => {
    const T = at(cx, cy, len, a), L = at(cx, cy, base, a - 45), Rr = at(cx, cy, base, a + 45);
    return `<path d="M${f(cx)} ${f(cy)}L${pp(T)}L${pp(L)}Z" fill="${k.t.light}"/>` +
      `<path d="M${f(cx)} ${f(cy)}L${pp(T)}L${pp(Rr)}Z" fill="${k.c(dark)}"/>` +
      `<path d="M${pp(L)}L${pp(T)}L${pp(Rr)}M${f(cx)} ${f(cy)}L${pp(T)}" fill="none" stroke="${k.t.ink}" stroke-width="${f(k.w(R > 12 ? 1.2 : 0.9))}"/>`;
  };
  for (const a of [-45, 45, 135, 225]) o += point(a, r, R * 0.2, 'mid');
  for (const a of [-90, 0, 90, 180]) o += point(a, R, R * 0.24, 'ink');
  return o + k.shape(circ(cx, cy, R * 0.12), { fill: 'light', sw: 1 });
}

function cardBack(k: K, x: number, y: number, w: number, h: number, kind: 'lattice' | 'sea'): string {
  const inn = rrect(x + 3.6, y + 3.6, w - 7.2, h - 7.2, 1.8), cx = x + w / 2, cy = y + h / 2;
  let o = k.shape(rrect(x, y, w, h, 3.6), { fill: 'light', sw: 2.2 });
  if (kind === 'lattice') {
    o += k.shape(inn, { fill: 'mid', sw: 1.2, h: [{ a: 50, g: 3.4, w: 0.9 }, { a: -50, g: 3.4, w: 0.9 }] });
    o += k.shape(circ(cx, cy, w * 0.2), { fill: 'light', sw: 1.2 }) + compass(k, cx, cy, w * 0.17, w * 0.09);
  } else {
    let sea = '';
    for (let yy = y + 9; yy < y + h - 4; yy += 4.6) sea += scallops(x + 2, x + w - 2, yy, 6, 3.4);
    o += k.shape(inn, { fill: 'mid', sw: 1.2, inner: k.S(sea, 1) });
    o += k.shape(circ(cx, cy, w * 0.24), { fill: 'light', sw: 1.4 }) + compass(k, cx, cy, w * 0.21, w * 0.12);
  }
  return o;
}

/** teardrop of spray: (cx, cy) body centre, tail toward angle a */
function drop(k: K, cx: number, cy: number, r: number, a: number): string {
  const t = r * 2.8;
  return `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${f(a)})"><path d="M${f(t)} 0C${f(r * 0.6)} ${f(-r)} ${f(-r)} ${f(-r * 1.1)} ${f(-r)} 0C${f(-r)} ${f(r * 1.1)} ${f(r * 0.6)} ${f(r)} ${f(t)} 0Z" fill="${k.t.light}" stroke="${k.t.ink}" stroke-width="${f(k.w(1.2))}"/></g>`;
}

function bubble(k: K, cx: number, cy: number, r: number): string {
  return k.shape(circ(cx, cy, r), { fill: 'light', sw: r > 2.5 ? 1.5 : 1.2 }) + k.F(circ(cx - r * 0.35, cy - r * 0.35, r * 0.28), 'paper');
}

// ---------------------------------------------------------------- the icons

const DRAW: Record<IconName, (k: K) => string> = {
  sails(k) {
    // a course and a topsail seen 3/4 from the front: heads straight on the yards, leeches bowed out, feet arching up,
    // seams curving with the belly, the right half in shade
    let o = k.shape('M52 3L74 6L68 8.4L75 11L52 11.5Z', { fill: 'light', sw: 1.5, h: [{ a: 0, g: 2, r: rect(48, 8.4, 40, 6) }] });
    o += k.shape(rect(47.5, 3, 5, 95), { fill: 'mid', sw: 2, h: [{ a: 90, g: 1.6, r: rect(50.2, 0, 5, 100) }] });
    o += k.shape(circ(50, 3.2, 2.6), { fill: 'light', sw: 1.6 });
    const sail = (x0: number, x1: number, y0: number, y1: number, arch: number, bulge: number) => {
      const w = x1 - x0, cx = (x0 + x1) / 2, h = y1 - y0;
      const d = `M${f(x0)} ${f(y0)}L${f(x1)} ${f(y0)}C${f(x1 + bulge)} ${f(y0 + h * 0.3)} ${f(x1 + bulge * 1.1)} ${f(y0 + h * 0.7)} ${f(x1 + bulge * 0.4)} ${f(y1)}` +
        `Q${f(cx)} ${f(y1 - arch * 2)} ${f(x0 - bulge * 0.4)} ${f(y1)}C${f(x0 - bulge * 1.1)} ${f(y0 + h * 0.7)} ${f(x0 - bulge)} ${f(y0 + h * 0.3)} ${f(x0)} ${f(y0)}Z`;
      let seams = '';
      for (const u of [-0.5, 0, 0.5]) {
        const xt = cx + (u * w) / 2, xb = cx + (u * (w + bulge * 0.8)) / 2, yb = y1 - arch * (1 - u * u);
        seams += `M${f(xt)} ${f(y0)}Q${f(xt + u * bulge * 1.6)} ${f(y0 + h * 0.55)} ${f(xb)} ${f(yb)}`;
      }
      const shadeR = `M${f(cx + 2)} 0Q${f(cx + 2 + bulge * 1.2)} ${f(y0 + h * 0.5)} ${f(cx + 2)} 100L110 100L110 0Z`;
      const deepR = `M${f(x1 - w * 0.12)} 0Q${f(x1 - w * 0.12 + bulge * 1.4)} ${f(y0 + h * 0.5)} ${f(x1 - w * 0.12)} 100L110 100L110 0Z`;
      return k.shape(d, {
        fill: 'light',
        mid: shadeR,
        h: [{ a: 80, g: 2.5, r: shadeR }, { a: -20, g: 2.5, r: deepR }, { a: 2, g: 2.6, w: 0.9, r: `M0 ${f(y1 - arch * 2.4)}Q${f(cx)} ${f(y1 - arch * 4.2)} 110 ${f(y1 - arch * 2.4)}L110 110L0 110Z` }],
        inner: k.S(seams, 1.1) + k.S(`M${f(x0 + w * 0.12)} ${f(y0 + 3)}Q${f(x0 + w * 0.06 - bulge * 0.3)} ${f(y0 + h * 0.5)} ${f(x0 + w * 0.1)} ${f(y1 - 4)}`, 1.6, 'light'),
      });
    };
    const yard = (x0: number, x1: number, y: number) =>
      k.shape(`M${x0} ${f(y)}Q50 ${f(y - 2.6)} ${x1} ${f(y)}L${x1} ${f(y + 4.4)}Q50 ${f(y + 6.4)} ${x0} ${f(y + 4.4)}Z`, { fill: 'mid', sw: 2.2, h: [{ a: 0, g: 1.4, w: 0.8, r: rect(0, y + 2.6, 100, 6) }] });
    o += sail(28, 72, 14.5, 35, 3.4, 4) + yard(20, 80, 10.5);
    o += sail(12, 88, 45, 86, 6.5, 7.5) + yard(3, 97, 40.5);
    o += k.S('M7.5 86L3 98M92.5 86L97 98M24.4 35L13 41M75.6 35L87 41', 1.4);
    return o;
  },

  crew(k) {
    let o = k.shape('M4 100C6 84 18 76 34 72L42 68L58 68L66 72C82 76 94 84 96 100Z', {
      fill: 'mid',
      h: [{ a: 60, g: 2.6, r: rect(52, 60, 50, 40) }, { a: -30, g: 2.6, r: poly(76, 60, 100, 60, 100, 100, 70, 100) }, { a: 60, g: 3.6, w: 0.8, r: rect(0, 60, 24, 40) }],
      hi: 'M12 93C16 85 22 80 31 77L33 80C25 83 19 88 16 95Z',
      inner: k.S('M42 69L35 100M58 69L65 100', 1.5),
    });
    for (const [x, y] of [[38.4, 84], [37, 94], [61.6, 84], [63, 94]]) o += k.shape(circ(x, y, 1.5), { fill: 'light', sw: 1 });
    o += k.shape('M42 68L50 92L58 68Z', { fill: 'light', sw: 1.6, h: [{ a: 0, g: 3.2, w: 1.3 }] });
    o += k.shape(rect(44, 52, 12, 18), { fill: 'light', sw: 2, h: [{ a: 60, g: 2.2, r: rect(51, 50, 10, 22) }] });
    o += k.shape('M36 65Q50 73 64 65L62 72Q50 80 38 72Z', { fill: 'mid', sw: 2, h: [{ a: 45, g: 2.2 }, { a: -45, g: 2.6 }] });
    o += k.shape('M47 78L40 93L45 92L49 80Z', { fill: 'mid', sw: 1.6, h: [{ a: 40, g: 2 }] });
    o += k.shape('M53 78L60 93L55 92L51 80Z', { fill: 'mid', sw: 1.6, h: [{ a: -40, g: 1.8 }, { a: 40, g: 2.4 }] });
    o += k.shape(circ(50, 75.5, 4), { fill: 'mid', sw: 1.8, h: [{ a: 45, g: 1.8 }] });
    o += k.shape(circ(36, 47, 2.6, 4.2), { fill: 'light', sw: 1.6 }) + k.shape(circ(64, 47, 2.6, 4.2), { fill: 'light', sw: 1.6, h: [{ a: 60, g: 1.8 }] });
    o += k.shape(circ(50, 45, 14, 16), {
      fill: 'light',
      h: [{ a: 60, g: 2.3, r: 'M53 20C65 30 67 54 53 66L90 66L90 20Z' }, { a: -20, g: 2.8, r: 'M58 20C68 36 68 54 58 66L90 66L90 20Z' }],
      inner: k.S('M42 42.5Q45 41 47.5 42.5M52.5 42.5Q55 41 58 42.5', 1.4) + k.F(circ(45, 46.5, 1.2), 'ink') + k.F(circ(55, 46.5, 1.2), 'ink') +
        k.S('M50 45L48 53.5L51 54.5', 1.3) + k.S('M45 58Q50 60.5 55 58', 1.5),
    });
    o += k.F('M36.5 36C35 43 35.5 50 37.5 55L39.5 50L39 38Z', 'ink') + k.F('M63.5 36C65 43 64.5 50 62.5 55L60.5 50L61 38Z', 'ink');
    o += k.shape('M30 25C30 5 70 5 70 25Z', { fill: 'mid', h: [{ a: 30, g: 2.2 }, { a: -40, g: 2.4, r: rect(50, 0, 50, 30) }] });
    o += k.shape('M8 33C14 22 26 18 35 20C41 21 46 24 50 24C54 24 59 21 65 20C74 18 86 22 92 33C80 28 62 30 50 41C38 30 20 28 8 33Z', {
      fill: 'mid',
      h: [{ a: 30, g: 2.4 }, { a: -35, g: 2.4, r: rect(50, 0, 50, 50) }],
      inner: k.S('M11.5 31C17 23.5 27 20.5 35 22C41 23 46 26 50 26C54 26 59 23 65 22C73 20.5 83 23.5 88.5 31', 1.6, 'light'),
    });
    o += k.shape(circ(30, 26.5, 3.4), { fill: 'light', sw: 1.3 }) + k.F(circ(30, 26.5, 1.1), 'ink');
    return o;
  },

  guns(k) {
    // carriage cheek, axletree, trucks, quoin, then the barrel on top
    let o = k.shape(rect(12, 80, 66, 6), { fill: 'mid', sw: 1.8, h: [{ a: 0, g: 1.6 }] });
    o += k.shape('M8 84L8 75L18 75L18 69L30 69L30 63L44 63L46 58L68 55L78 58L80 84Z', {
      fill: 'mid',
      h: [{ a: 0, g: 2.3, w: 0.9 }, { a: 50, g: 2.4, r: rect(0, 74, 100, 20) }, { a: -40, g: 2.6, r: rect(70, 50, 30, 40) }],
      hi: 'M18.8 70L29.2 70L29.2 71.2L18.8 71.2ZM30.8 64L43.4 64L43.4 65.2L30.8 65.2ZM9 76L17.2 76L17.2 77.2L9 77.2Z',
    });
    for (const [x, y] of [[38, 71], [56, 70], [70, 64], [24, 77]]) o += k.shape(circ(x, y, 1.5), { fill: 'light', sw: 1 });
    o += k.shape('M16 69L35 69L35 63.5L18 66Z', { fill: 'light', sw: 1.6, h: [{ a: 0, g: 1.6, r: rect(0, 67, 100, 3) }] });
    const wheel = (cx: number, cy: number, r: number) => k.shape(circ(cx, cy, r), {
      fill: 'mid',
      h: [{ a: 45, g: 2.2 }, { a: -45, g: 2.4, r: outside(circ(cx - r * 0.35, cy - r * 0.35, r * 1.05)) }],
      hi: 'M' + pp(at(cx, cy, r * 0.82, 190)) + 'Q' + pp(at(cx, cy, r * 1.05, 225)) + ' ' + pp(at(cx, cy, r * 0.82, 260)) + 'L' + pp(at(cx, cy, r * 0.64, 250)) + 'Q' + pp(at(cx, cy, r * 0.8, 225)) + ' ' + pp(at(cx, cy, r * 0.64, 200)) + 'Z',
      inner: k.S(circ(cx, cy, r * 0.7), 1),
    }) + k.shape(circ(cx, cy, r * 0.3), { fill: 'light', sw: 1.6 }) + k.F(circ(cx, cy, r * 0.11), 'ink');
    o += wheel(24, 86, 10) + wheel(66, 85.5, 11);
    o += k.S('M2 97.5L98 97.5', 1.8);
    const barrel = 'M0 -9L4 -9L4 -8.5L44 -7L44 -8L47 -8L47 -6.5L68 -5.5Q71 -7 76 -7L76 7Q71 7 68 5.5L47 6.5L47 8L44 8L44 7L4 8.5L4 9L0 9Q-2.5 9 -2.5 5L-2.5 -5Q-2.5 -9 0 -9Z';
    let g = k.shape(rect(-6, -1.8, 4, 3.6), { fill: 'mid', sw: 1.4 }) + k.shape(circ(-7.5, 0, 3.4), { fill: 'mid', sw: 1.8, hi: circ(-8.5, -1, 1.2) });
    g += k.shape(barrel, {
      fill: 'mid',
      h: [{ a: 0, g: 1.7, r: rect(-10, 0.5, 100, 12) }, { a: 60, g: 2, r: rect(-10, 4, 100, 10) }, { a: 0, g: 3.2, w: 0.8, r: rect(-10, -12, 100, 6) }],
      inner: k.S('M5 -4.4L43 -3.6M48 -3.2L67 -2.8M70 -3.4L75 -3.4', 2, 'light') + k.S('M4 -8.5L4 8.5M44 -7L44 7M47 -6.5L47 6.5M68 -5.5L68 5.5', 1.4),
    });
    g += k.shape(circ(76, 0, 2.2, 7), { fill: 'mid', sw: 1.8 }) + k.F(circ(76.4, 0, 1.2, 4), 'ink');
    o += `<g transform="translate(22 54) rotate(-9)">${g}</g>`;
    o += k.shape(circ(58, 50.4, 3.4), { fill: 'mid', sw: 1.8, h: [{ a: 45, g: 1.6, r: rect(58, 50, 6, 6) }] });
    o += k.S('M53.5 50Q58 43 62.5 50', 2);
    return o;
  },

  hull(k) {
    // the ship's body in profile: stern castle left, bow right, two wales, a row of gun ports, the sea in front
    const strake = (d: number) => `M2 ${f(36 + d)}Q55 ${f(48 + d)} 100 ${f(33 + d)}`;
    const band = (d0: number, d1: number) => strake(d0) + `L100 ${f(33 + d1)}Q55 ${f(48 + d1)} 2 ${f(36 + d1)}Z`;
    const yAt = (x: number, d: number) => { const t = (x - 2) / 98; return (1 - t) ** 2 * (36 + d) + 2 * t * (1 - t) * (48 + d) + t * t * (33 + d); };
    let o = '';
    for (const [x, y, h] of [[21, 9, 13], [55, 30, 16], [77, 25, 12]]) o += k.shape(rect(x, y, 4.6, h), { fill: 'mid', sw: 1.8, h: [{ a: 90, g: 1.5, r: rect(x + 2.4, 0, 4, 100) }] });
    o += k.shape(poly(86, 31, 99, 22, 100, 25.5, 90, 35), { fill: 'mid', sw: 1.6 });
    const hull = 'M6 18L31 18L32 30L35 32Q60 45 84 32L84 28L94 28C99 42 99 58 95 72Q56 88 17 80L12 64L5 24Z';
    let ports = '';
    for (const x of [26, 36, 46, 56, 66, 76]) {
      const y = yAt(x, 12.5);
      ports += k.shape(rect(x - 2.5, y - 2.2, 5, 4.4), { fill: 'ink', sw: 0 }) + k.S(`M${f(x - 3)} ${f(y - 3.4)}L${f(x + 3)} ${f(y - 3.4)}`, 1.3, 'light');
    }
    let win = '';
    for (const x of [9.5, 15.5, 21.5]) win += rect(x, 23, 4, 4.6);
    o += k.shape(hull, {
      fill: 'mid',
      hi: 'M6 18L31 18L32 30L35 32Q60 45 84 32L84 28L94 28L95 33Q60 50 35 36L32 34L7 34Z',
      h: [
        { a: -35, g: 2.4, r: strake(20) + 'L100 100L0 100Z' },
        { a: 45, g: 2.4, r: strake(28) + 'L100 100L0 100Z' },
        { a: 0, g: 3, w: 0.8, r: rect(0, 0, 100, 60) },
      ],
      inner: k.S(strake(3) + strake(9) + strake(24) + strake(29) + 'M6 34L32 34M31 18L33 34', 1) +
        k.shape(band(5, 8.5), { fill: 'mid', sw: 1.3, h: [{ a: 45, g: 1.4 }, { a: -45, g: 1.6 }] }) +
        k.shape(band(16.5, 20), { fill: 'mid', sw: 1.3, h: [{ a: 45, g: 1.4 }, { a: -45, g: 1.6 }] }) +
        k.F(win, 'ink') + k.S('M8 21.5L30 21.5M8 29.5L30 29.5', 1.3) + ports + k.S('M95 33C99 46 98 60 94 72', 1.4, 'light'),
    });
    o += k.shape(circ(9, 14.5, 2.4, 3.2), { fill: 'light', sw: 1.4 });
    o += k.shape(waveLine(72, 5.4, 11, -6, 106, 1) + 'L106 106L-6 106Z', {
      fill: 'mid', sw: 2.2,
      h: [{ a: 0, g: 2.3 }, { a: -25, g: 2.6, r: rect(0, 86, 100, 20) }],
      inner: k.S(waveLine(80, 3, 9, -6, 106, 5), 1.3, 'light') + k.S(waveLine(89, 2.4, 12, -6, 106), 1, 'light'),
    });
    o += k.S('M92 71C96 66 100 66 101 69M86 73C90 69 92 70 93 72', 1.4);
    return o;
  },

  fire(k) {
    // fire on a ship's deck: planks in slight perspective with seams and nails, a bit of bulwark, flames and a curl of smoke
    const seam = (y: number) => `M-2 ${f(y)}L102 ${f(y)}`;
    const rows = [66, 70.5, 76, 83, 91.5];
    let butts = '', nails = '';
    rows.forEach((y, i) => {
      const y1 = i + 1 < rows.length ? rows[i + 1] : 101, h = y1 - y;
      for (let x = 8 + (i % 2) * 17 + i * 3; x < 100; x += 34) {
        const sx = (x - 50) * 0.1;
        butts += `M${f(x + sx * (y - 60) / 10)} ${f(y)}L${f(x + sx * (y1 - 60) / 10)} ${f(y1)}`;
        nails += circ(x - 2.5 + sx * 0.5, y + h / 2, 0.55 + h * 0.05) + circ(x + 2.5 + sx * 0.5, y + h / 2, 0.55 + h * 0.05);
      }
    });
    let o = k.shape(rect(-2, 66, 104, 36), {
      fill: 'light', sw: 0,
      mid: circ(56, 82, 40, 12),
      h: [{ a: 0, g: 3, w: 0.8 }, { a: 35, g: 2.2, r: circ(56, 82, 38, 11) }, { a: -35, g: 2.2, r: circ(56, 82, 28, 8) }],
      inner: k.S(rows.slice(1).map(seam).join(''), 1.4) + k.S(butts, 1.2) + k.F(nails, 'ink'),
    }) + k.S(seam(66), 2);
    o += k.shape('M-2 44L22 44L24 66L-2 66Z', {
      fill: 'mid', h: [{ a: 0, g: 1.8, w: 0.8 }, { a: 60, g: 2.4, r: rect(12, 40, 20, 30) }],
      inner: k.S('M-2 50L23 50M-2 57L24 57', 1.2) + k.F(circ(5, 53.5, 0.8) + circ(16, 53.5, 0.8) + circ(5, 61, 0.8) + circ(16, 61, 0.8), 'ink'),
    });
    o += k.shape('M-2 40L25 40L25 45L-2 45Z', { fill: 'mid', hi: rect(-2, 41, 26, 1.3) });
    let fl = k.shape('M50 90C28 90 16 76 20 60C23 50 30 46 28 34C38 41 42 50 40 58C42 46 47 36 44 22C55 31 62 42 60 54C64 48 66 42 64 33C77 46 84 64 76 80C72 86 62 90 50 90Z', {
      fill: 'mid',
      h: [{ a: 76, g: 2.6 }, { a: -20, g: 2.6, r: 'M62 0L100 0L100 100L66 100C74 80 72 60 62 0Z' }, { a: -40, g: 3, r: 'M0 0L30 0C22 50 22 70 30 100L0 100Z' }],
      inner: k.S('M30 80C25 68 32 56 29 42M44 74C40 60 48 46 45 30M64 76C70 64 70 52 65 40M73 76C77 68 77 60 73 52', 1.1),
    });
    fl += k.shape('M50 88C38 88 32 80 34 70C36 64 40 62 42 55C46 61 50 66 50 72C52 66 55 62 58 57C64 66 66 78 60 84C57 87 54 88 50 88Z', {
      fill: 'light', sw: 1.6, inner: k.S('M44 84C40 78 42 72 42 66M56 84C59 78 59 72 58 66', 0.9),
    });
    o += `<g transform="translate(6 -6)">${fl}</g>`;
    for (const [x, y, r] of [[22, 30, 1.3], [88, 26, 1.3], [82, 40, 0.9], [30, 18, 0.9]]) o += k.F(star(x, y, 4, r * 0.5, r * 2, 0), 'ink');
    const curl = 'M50 17C46 9 52 3 60 4C68 5 71 13 65 15.5C61 17 58.5 13 61.5 11.5';
    const wisp = 'M66 20C70 15 76 15 79 11C81 8 85 8 86 10';
    o += k.S(curl, 6.4) + k.S(curl, 3.6, 'light') + k.S(wisp, 4.6) + k.S(wisp, 2.2, 'light');
    o += k.S('M55.5 6.5C60 5 65 7 66 11', 0.9);
    return o;
  },

  powder(k) {
    const cx = 44;
    const stave = (s: number): string => {
      const e = Math.sqrt(1 - s * s);
      return `M${f(cx + 24 * s)} ${f(22 + 7 * e)}C${f(cx + 31 * s)} ${f(42 + 7 * e)} ${f(cx + 31 * s)} ${f(66 + 7 * e)} ${f(cx + 24 * s)} ${f(86 + 7 * e)}`;
    };
    const band = (s0: number, s1: number) => {
      const a = stave(s0), b = stave(s1).slice(1).match(/-?\d*\.?\d+/g)!.map(Number);
      return a + `L${f(b[6])} ${f(b[7])}C${f(b[4])} ${f(b[5])} ${f(b[2])} ${f(b[3])} ${f(b[0])} ${f(b[1])}Z`;
    };
    let staves = '', contour = '';
    for (const s of [-0.72, -0.42, -0.12, 0.18, 0.48, 0.76]) staves += stave(s);
    for (let s = 0.3; s < 0.99; s += 0.075 - (s - 0.3) * 0.05) contour += stave(s);
    // spilled powder: a heap with grains
    let grains = '';
    for (let i = 0; i < 26; i++) {
      const x = 70 + ((i * 37) % 26), y = 92 + ((i * 53) % 7) - Math.abs(83 - x) * 0.25;
      grains += circ(x, y, 0.65);
    }
    let o = k.shape('M66 96Q82 84 98 96Z', { fill: 'mid', sw: 1.6, inner: k.F(grains, 'ink') });
    o += k.F(circ(66, 97, 0.8) + circ(62.5, 96.5, 0.6) + circ(59, 97.4, 0.7), 'ink');
    o += k.shape('M20 22C13 40 13 68 20 86C20 89.9 30.7 93 44 93C57.3 93 68 89.9 68 86C75 68 75 40 68 22Z', {
      fill: 'mid',
      h: [{ a: 0, g: 2.4, r: 'M64 0L100 0L100 100L64 100C71 70 71 40 64 0Z' }, { a: 60, g: 3.4, w: 0.8, r: 'M0 0L24 0C18 40 18 70 24 100L0 100Z' }],
      hi: band(-0.6, -0.48),
      inner: k.S(staves, 1.1) + k.S(contour, 0.9),
    });
    for (const yc of [28, 35.5, 70, 77.5]) {
      const w = 24 + 5.25 * (1 - ((yc + 1.6 - 54) / 32) ** 2);
      const top = lowerArc(cx, yc, w, 7), bot = lowerArc(cx, yc + 3.4, w + 0.3, 7);
      const nb = bot.match(/-?\d*\.?\d+/g)!.map(Number);
      const hoop = top + `L${f(nb[12])} ${f(nb[13])}C${f(nb[10])} ${f(nb[11])} ${f(nb[8])} ${f(nb[9])} ${f(nb[6])} ${f(nb[7])}` +
        `C${f(nb[4])} ${f(nb[5])} ${f(nb[2])} ${f(nb[3])} ${f(nb[0])} ${f(nb[1])}Z`;
      o += k.shape(hoop, { fill: 'mid', sw: 1.6, h: [{ a: 0, g: 1.3, w: 0.9, r: rect(cx - 10, 0, 60, 100) }], inner: k.S(lowerArc(cx - 6, yc + 1.4, w - 8, 6.6), 1, 'light') });
    }
    o += k.shape(circ(cx, 22, 24, 7), {
      fill: 'light',
      h: [{ a: 0, g: 1.8, r: rect(50, 0, 50, 40) }],
      inner: k.S(circ(cx, 22.4, 20.5, 5.4), 1) + k.S('M36 15.6L36 28.4M52 15.6L52 28.4', 1),
    });
    o += k.F(circ(48, 21.5, 2.4, 1.2), 'ink');
    o += k.S('M48 21C49 12 58 15 61 9C62.5 6 65 4.5 68 5', 1.9);
    o += k.F(star(69.5, 4.6, 6, 1.4, 4.6, 10), 'ink') + k.F(circ(69.5, 4.6, 1.2), 'light');
    return o;
  },

  souls(k) {
    const glass = 'M42 20L58 20L58 38C70 41 78 51 78 64C78 79.5 65.5 92 50 92C34.5 92 22 79.5 22 64C22 51 30 41 42 38Z';
    const glow = star(50, 66, 16, 15.5, 24, -90);
    let o = k.shape('M41 3L59 3L57 16L43 16Z', {
      fill: 'mid', sw: 2, h: [{ a: 90, g: 1.8, r: rect(51, 0, 10, 20) }, { a: 0, g: 2.6, w: 0.8 }],
      inner: k.S('M44 5L45 14', 1.6, 'light'),
    });
    o += k.shape(glass, {
      fill: 'mid',
      h: [{ a: 45, g: 2.4, r: outside(glow) }, { a: -45, g: 2.6, r: outside(glow) }],
      hi: glow,
      inner: k.S('M29 58C31 49 37 44 43 42', 3.2, 'light') + k.F(circ(28.5, 66, 1.6), 'light') + k.S('M45 22L45 36', 2.2, 'light') +
        k.S('M74 64C74 77 63 88 50 88', 1.2, 'light'),
    });
    o += k.shape('M50 82C41 80 39 71 45 67C51 63 50 57 44 56C51 50 61 54 59 62C58 68 52 70 54 75C56 78 60 77 61 74C62 79 56 83 50 82Z', {
      fill: 'light', sw: 1.6, inner: k.S('M48 78C44 75 45 70 49 68M55 60C55 57 52 56 50 56', 1),
    });
    o += k.F(star(50, 47, 4, 0.7, 2.6, 0), 'ink') + k.F(star(60, 52, 4, 0.5, 1.8, 45), 'ink');
    o += k.shape(rrect(38, 15, 24, 6, 2), { fill: 'light', sw: 2, h: [{ a: 90, g: 1.6, r: rect(54, 0, 10, 30) }] });
    o += k.S('M41.5 26Q50 29 58.5 26', 1.8) + k.S('M42 26.5C38 30 36.5 35 38.5 39M42.5 27C40.5 31 41 35 42.6 37', 1.4);
    return o;
  },

  reaction(k) {
    let g = k.shape('M0 -3L80 -3.6Q90 -4.2 97 -1Q91 2.4 82 4.2Q60 5.2 0 3Z', {
      fill: 'light', sw: 1.9, h: [{ a: 0, g: 1.4, r: rect(0, 0.4, 100, 6) }], inner: k.S('M4 -0.8L72 -1.6', 1),
    });
    g += k.shape('M-24 -3L-2 -3L-2 3L-24 3Z', { fill: 'mid', sw: 1.8, h: [{ a: 65, g: 1.4 }] });
    g += k.S('M0 7C-8 12 -20 11 -26 4', 2.4);
    g += k.shape('M-1.5 -9.5L2.5 -9.5L2.5 9.5L-1.5 9.5Z', { fill: 'mid', sw: 1.8, h: [{ a: 0, g: 1.4, r: rect(-3, 0, 6, 12) }] });
    g += k.shape('M2.5 -8C8 -4 8 4 2.5 8Z', { fill: 'mid', sw: 1.6, h: [{ a: 45, g: 1.5 }] });
    g += k.shape(circ(-27.5, 0, 3.6), { fill: 'mid', sw: 1.8, hi: circ(-28.6, -1.2, 1.2) });
    let o = `<g transform="translate(24 76) rotate(-45)">${g}</g>`;
    const cx = 52, cy = 50;
    let studs = '', rays = '';
    for (let i = 0; i < 12; i++) studs += circ(...at(cx, cy, 27.6, i * 30 + 15), 1.5);
    for (let i = 0; i < 16; i++) rays += `M${pp(at(cx, cy, 12, i * 22.5))}L${pp(at(cx, cy, 24, i * 22.5))}`;
    o += k.shape(circ(cx, cy, 30), {
      fill: 'mid',
      h: [{ a: -45, g: 2.2 }, { a: 45, g: 2.2, r: outside(circ(cx - 9, cy - 9, 34)) }],
      inner: k.F(studs, 'light') + k.S(studs, 0.9),
    });
    o += k.shape(circ(cx, cy, 25.5), {
      fill: 'light',
      mid: outside(circ(cx - 6, cy - 6, 25)),
      h: [{ a: 45, g: 2.4, r: outside(circ(cx - 5, cy - 5, 26)) }, { a: -45, g: 2.4, r: outside(circ(cx - 9, cy - 9, 27.5)) }],
      inner: k.S(rays, 0.9) + k.S(circ(cx, cy, 20.5), 1),
    });
    o += k.shape(circ(cx, cy, 11), { fill: 'light', sw: 1.4 });
    o += k.shape(circ(cx, cy, 8.5), { fill: 'mid', sw: 1.8, h: [{ a: 45, g: 1.6, r: outside(circ(cx - 3, cy - 3, 8.6)) }], hi: circ(cx - 3, cy - 3, 2.6) });
    const hit = at(cx, cy, 30, -135);
    let burst = '';
    for (const da of [-50, -25, 0, 25, 50]) burst += `M${pp(at(hit[0], hit[1], 3.5, -135 + da))}L${pp(at(hit[0], hit[1], da ? 8.5 : 11, -135 + da))}`;
    return o + k.S(burst, 2);
  },

  plan(k) {
    const L = 'M12 26L88 26L88 78L12 78Z';
    let o = `<g transform="translate(3.2 3.2)">${k.shade(L, 45, 1.7)}</g>`;
    o += k.shape(L, {
      fill: 'light',
      mid: poly(88, 26, 88, 78, 54, 50),
      h: [{ a: 30, g: 2.3, r: poly(88, 26, 88, 78, 54, 50) }, { a: -60, g: 3.2, w: 0.9, r: poly(12, 78, 88, 78, 50, 54) }, { a: 90, g: 4, w: 0.8, r: poly(12, 26, 12, 78, 44, 52) }],
      inner: k.S('M12 26L50 56L88 26M12 78L44 52M88 78L56 50', 1.4),
    });
    o += k.shape('M46 60L38 82L42.5 80L45 85L51 62Z', { fill: 'mid', sw: 1.6, h: [{ a: 70, g: 1.6 }] });
    o += k.shape('M54 60L62 82L57.5 80L55 85L49 62Z', { fill: 'mid', sw: 1.6, h: [{ a: -70, g: 1.5 }, { a: 20, g: 2 }] });
    const sealPts: number[] = [];
    for (let i = 0; i < 36; i++) sealPts.push(...at(50, 53, i % 2 ? 11.2 : 12.4, i * 10));
    o += k.shape(poly(...sealPts), {
      fill: 'mid', sw: 2.2,
      h: [{ a: 45, g: 1.9 }, { a: -45, g: 2.2, r: outside(circ(47, 50, 10)) }],
      inner: k.S(circ(50, 53, 7.6), 1.3, 'light') + k.S('M50 48.6L50 58M46.4 51L53.6 51M45.6 55.2Q50 60 54.4 55.2', 1.5, 'light') + k.S(circ(50, 47.2, 1.2), 1.1, 'light'),
    });
    return `<g transform="rotate(-7 50 52)">${o}</g>`;
  },

  once(k) {
    let o = k.shape(rect(18, 3, 64, 6), { fill: 'mid', sw: 2, h: [{ a: 0, g: 1.5, r: rect(0, 6.5, 100, 4) }, { a: 0, g: 3, w: 0.8 }] });
    o += k.S(circ(50, 14, 4.6), 2.6) + k.shape(rect(46, 17, 8, 4), { fill: 'mid', sw: 1.6 });
    let ribs = '';
    for (let u = 0.32; u < 1.0; u += 0.085 - (u - 0.3) * 0.06) ribs += `M${f(50 + 12 * u)} 20C${f(50 + 18 * u)} 31 ${f(50 + 18 * u)} 52 ${f(50 + 33 * u)} 72`;
    const hib = (u0: number, u1: number) => `M${f(50 + 12 * u0)} 20C${f(50 + 18 * u0)} 31 ${f(50 + 18 * u0)} 52 ${f(50 + 33 * u0)} 72L${f(50 + 33 * u1)} 72C${f(50 + 18 * u1)} 52 ${f(50 + 18 * u1)} 31 ${f(50 + 12 * u1)} 20Z`;
    o += k.shape('M38 21C38 17 62 17 62 21C66 23 68 30 68 40C68 54 72 64 82 72L18 72C28 64 32 54 32 40C32 30 34 23 38 21Z', {
      fill: 'mid',
      h: [{ a: 0, g: 2.2, r: 'M70 0L100 0L100 100L82 100C72 70 68 50 70 0Z' }, { a: 75, g: 3.6, w: 0.8, r: rect(0, 0, 38, 100) }],
      hi: hib(-0.62, -0.44),
      inner: k.S(ribs, 0.95) + k.S('M33 33.5Q50 38 67 33.5M33 36.5Q50 41 67 36.5M30 58Q50 63.5 70 58', 1.3),
    });
    o += k.shape('M16 71Q50 79 84 71L85 76.5Q50 85.5 15 76.5Z', { fill: 'mid', sw: 2.2, h: [{ a: 80, g: 1.6 }, { a: 0, g: 1.8, r: rect(50, 70, 50, 20) }], inner: k.S('M18 73.6Q50 81 82 73.6', 1, 'light') });
    o += k.S('M50 84L50 92', 1.8);
    o += k.shape(circ(50, 84, 4), { fill: 'mid', sw: 1.8, h: [{ a: 45, g: 1.5, r: outside(circ(48.6, 82.6, 4)) }], hi: circ(48.6, 82.6, 1.3) });
    o += k.shape(circ(50, 94.5, 3, 3.4), { fill: 'mid', sw: 1.6, h: [{ a: 50, g: 1.4 }, { a: -50, g: 1.6 }] });
    o += k.S('M87 33C93 41 93 55 87 62', 2.8) + k.S('M88.2 29.8L86 31.6M88.2 65.2L86 63.4', 1.4);
    return o;
  },

  cards(k) {
    let o = '';
    for (const a of [-22, 0, 22]) {
      const card = rrect(31, 28, 38, 54, 3.6);
      o += `<g transform="rotate(${a} 50 92)"><g transform="translate(2.4 1.6)">${k.shade(card, 45, 1.6)}</g>${cardBack(k, 31, 28, 38, 54, 'lattice')}</g>`;
    }
    return o;
  },

  legend(k) {
    let o = k.shape('M18 2L34 2L56 40L46 44Z', { fill: 'mid', sw: 2, h: [{ a: 60, g: 2.4, w: 0.9 }], inner: k.S('M26 2L51 42', 3.4, 'light') + k.S('M23 2L48 43M29 2L54 41', 0.9) });
    o += k.shape('M66 2L82 2L54 44L44 40Z', { fill: 'mid', sw: 2, h: [{ a: -60, g: 1.9 }, { a: 30, g: 2.6 }], inner: k.S('M74 2L49 42', 3.4, 'light') + k.S('M71 2L46 41M77 2L52 43', 0.9) });
    o += k.S(circ(50, 38.5, 4.2), 2.8);
    const cx = 50, cy = 66;
    let beads = '';
    for (let i = 0; i < 28; i++) beads += circ(...at(cx, cy, 24.4, i * (360 / 28)), 1.05);
    o += k.shape(circ(cx, cy, 27.5), { fill: 'mid', h: [{ a: -45, g: 2.2 }, { a: 45, g: 2.2, r: outside(circ(cx - 8, cy - 8, 31)) }], inner: k.F(beads, 'light') });
    o += k.shape(circ(cx, cy, 22), {
      fill: 'light',
      h: [{ a: 45, g: 2.6, w: 0.9, r: outside(circ(cx - 4, cy - 4, 22.5)) }],
      inner: k.S(circ(cx, cy, 20.2), 0.9),
    });
    o += compass(k, cx, cy, 19.5, 11.5);
    return o;
  },

  effects(k) {
    const board = (d: string, a: number) => k.shape(d, {
      fill: 'mid',
      h: [{ a, g: 2.6, w: 0.9 }, { a: 0, g: 1.8, r: rect(0, 56, 100, 6) }, { a: 0, g: 1.8, r: rect(0, 82, 100, 8) }],
      inner: k.S('M4 40Q30 37 50 40.5Q72 44 96 39M4 46Q24 44 40 47Q58 49 78 45.5L96 45M4 68Q30 65 52 68Q74 71 96 66M4 76Q26 74 44 77.5Q66 80 96 74', 0.9, 'ink') +
        k.S(circ(74, 77, 4.2, 2.2) + circ(74, 77, 2, 1), 1),
    });
    let o = board('M3 36L97 34L96 61L4 62Z', 2) + board('M4 62L96 61L97 88L3 89Z', -2);
    for (const [x, y] of [[8, 41], [8, 56], [92, 39], [92, 55], [8, 67], [8, 83], [92, 66], [92, 82]]) o += k.shape(circ(x, y, 1.6), { fill: 'light', sw: 1.1 });
    let c = `<g transform="translate(3 3)">${k.shade(rrect(31, 16, 36, 62, 3.2), 40, 1.6)}</g>`;
    c += k.shape(rrect(31, 16, 36, 62, 3.2), { fill: 'light', sw: 2.4 });
    c += k.shape(rect(35, 22, 28, 22), {
      fill: 'light', sw: 1.4,
      h: [{ a: 0, g: 2, w: 0.8, r: rect(0, 0, 100, 34) }, { a: 45, g: 2, r: rect(0, 34, 100, 20) }],
      inner: k.shape(circ(55, 30, 4), { fill: 'light', sw: 1.1 }) + k.shape('M35 44L43 34L49 40L54 36L63 44Z', { fill: 'mid', sw: 1.1, h: [{ a: -45, g: 1.6 }] }),
    });
    c += k.S('M36 50L62 50M36 55L59 55M36 60L62 60M36 65L54 65M36 71L48 71', 1.3);
    o += `<g transform="rotate(7 49 47)">${c}</g>`;
    o += k.S('M45 34L60 39.5', 3.4, 'mid') + k.S('M42 31.6L40 30M43 36.6L41.4 38.6M47.4 36.8L48.4 39', 1);
    let d = k.shape('M0 -2.6L12 -3L12 3L0 2.6Z', { fill: 'light', sw: 1.6, h: [{ a: 0, g: 1.3, r: rect(0, 0.2, 20, 5) }] });
    d += k.shape(rrect(12, -9.5, 3.6, 19, 1.4), { fill: 'mid', sw: 1.8, h: [{ a: 0, g: 1.4, r: rect(0, 1, 30, 10) }] });
    d += k.shape(rrect(15.6, -2.8, 15, 5.6, 1.6), { fill: 'mid', sw: 1.8, h: [{ a: 65, g: 1.4 }] });
    d += k.shape(circ(34.4, 0, 3.8), { fill: 'mid', sw: 1.8, h: [{ a: 45, g: 1.5, r: outside(circ(33, -1.4, 3.8)) }], hi: circ(33.2, -1.3, 1.2) });
    o += `<g transform="translate(44 34) rotate(-32) scale(1.35)">${d}</g>`;
    return o;
  },

  seaDeck(k) {
    let o = '';
    for (let i = 5; i >= 1; i--) o += k.shape(rrect(22 + i * 1.7, 12 + i * 2, 50, 70, 3.6), { fill: i === 5 ? 'mid' : 'light', sw: 1.4, h: i === 5 ? [{ a: 45, g: 1.6 }] : undefined });
    o += `<g transform="translate(3.6 4.2)">${k.shade('M72 16L76 16L76 86L26 86L26 82L72 82Z', 45, 1.5)}</g>`;
    return o + cardBack(k, 22, 12, 50, 70, 'sea');
  },

  seaCard(k) {
    const card = rrect(25, 10, 50, 76, 3.8);
    let c = `<g transform="translate(3 3)">${k.shade(card, 45, 1.6)}</g>` + k.shape(card, { fill: 'light', sw: 2.4 });
    const pic = rect(29.5, 14.5, 41, 67);
    const wave = 'M29 70C33 54 43 41 57 38C68 36 74 45 71 53C69 59 61 58.5 60 53C59 48.5 63 46.5 65.5 48.5C62 44 54 46 52 54C50 64 58 72 72 74L72 82L29 82Z';
    let curls = '';
    for (const d of [4, 8, 12]) curls += `M${f(31 + d * 0.3)} ${f(73 + d * 0.2)}C${f(35 + d * 0.4)} ${f(58 + d)} ${f(44 + d * 0.3)} ${f(46 + d)} ${f(56)} ${f(42 + d)}`;
    let foam = '';
    for (const [x, y, r] of [[59, 36, 1.4], [64, 35.4, 1.1], [69, 37, 1.3], [73, 41, 1.1], [53, 37.6, 1.1]]) foam += circ(x, y, r);
    c += k.shape(pic, {
      fill: 'light', sw: 1.3,
      h: [{ a: 0, g: 2.6, w: 0.8, r: rect(0, 0, 100, 40) }],
      inner: k.S(scallops(29, 72, 77, 5, 2.6), 1) +
        k.shape(wave, { fill: 'mid', sw: 2, h: [{ a: -30, g: 2.2 }, { a: 40, g: 2.4, r: rect(0, 62, 100, 30) }], hi: 'M58 39.6C67 38.4 72 44 70 51C68.6 47 64 42 58 41.6Z', inner: k.S(curls, 1, 'light') }) +
        k.F(foam, 'light') + k.S(foam, 0.9) + k.S(scallops(29, 72, 80, 6, 2.6), 1.2),
    });
    c += k.F(circ(39, 25, 4.6), 'light') + k.S(circ(39, 25, 4.6), 1.1);
    return `<g transform="rotate(-6 50 50)">${c}</g>`;
  },

  underwater(k) {
    let m = k.shape(rect(47, 6, 6, 80), { fill: 'mid', sw: 2, h: [{ a: 90, g: 1.6, r: rect(50.5, 0, 6, 100) }] });
    m += k.shape('M53 4L77 8L71 10.5L78 13.5L53 15Z', { fill: 'light', sw: 1.8, h: [{ a: 80, g: 2, r: rect(66, 0, 20, 20) }, { a: 0, g: 2.2, r: rect(50, 11, 40, 6) }] });
    m += k.shape(circ(50, 5, 2.6), { fill: 'light', sw: 1.6 });
    m += k.S('M24 41L48 28M76 41L52 28', 1.1);
    m += k.shape(rect(22, 40, 56, 3.6), { fill: 'mid', sw: 1.8, h: [{ a: 0, g: 1.3, r: rect(0, 42, 100, 3) }] });
    m += k.S('M36 26L36 20M42 26L42 20M58 26L58 20M64 26L64 20M35 20L65 20', 1.3);
    m += k.shape('M33 26L67 26L63 33L37 33Z', { fill: 'mid', h: [{ a: 0, g: 1.6, r: rect(0, 29, 100, 6) }, { a: 70, g: 2.2, r: rect(56, 20, 20, 20) }], hi: rect(34.5, 27, 30, 1.4) });
    let o = `<g transform="rotate(14 50 70)">${m}</g>`;
    const ghost = `<g transform="rotate(14 50 70)">${k.S('M47 44L47 100M53 44L53 100', 1.2, 'light', 'stroke-dasharray="3 2.4"')}</g>`;
    const top = waveLine(46, 5.4, 11, -6, 106, 2);
    o += k.shape(top + 'L106 106L-6 106Z', {
      fill: 'mid', sw: 2.2,
      h: [{ a: 0, g: 2.4 }, { a: -25, g: 2.6, r: rect(0, 72, 100, 30) }],
      inner: ghost + k.S(waveLine(54, 3, 9, -6, 106, 6), 1.4, 'light') + k.S(waveLine(62, 2.4, 13, -6, 106), 1, 'light'),
    });
    o += k.S('M44 49.5C44 52.5 68 52.5 68 49.5M36 51C36 56 76 56 76 51', 1.2, 'light');
    for (const [x, y, r] of [[40, 62, 3], [44, 71, 1.8], [34, 79, 4], [62, 64, 2.4], [66, 75, 3.4], [58, 86, 2], [45, 90, 2.6], [30, 92, 1.6], [72, 92, 1.8]]) o += bubble(k, x, y, r);
    return o;
  },

  surfaced(k) {
    const sheer = (d: number): Pt[] => [[6 + 0.5 * d, 66 + 0.85 * d], [40 + 0.5 * d, 40 + 0.85 * d], [74 + 0.5 * d, 15 + 0.85 * d]];
    const q = (p: Pt[]) => `M${pp(p[0])}Q${pp(p[1])} ${pp(p[2])}`;
    const qrev = (p: Pt[]) => `L${pp(p[2])}Q${pp(p[1])} ${pp(p[0])}`;
    const ext = (p: Pt[]): Pt[] => [[p[0][0] - 8, p[0][1] + 6], p[1], [p[2][0] + 12, p[2][1] - 9]];
    let strakes = '';
    for (const d of [4, 16, 20.5, 25, 29.5, 34]) strakes += q(ext(sheer(d)));
    const wale = q(ext(sheer(8))) + qrev(ext(sheer(12))) + 'Z';
    const qp = (p: Pt[], t: number): [number, number, number] => {
      const m = 1 - t;
      const x = m * m * p[0][0] + 2 * m * t * p[1][0] + t * t * p[2][0], y = m * m * p[0][1] + 2 * m * t * p[1][1] + t * t * p[2][1];
      const a = Math.atan2(2 * m * (p[1][1] - p[0][1]) + 2 * t * (p[2][1] - p[1][1]), 2 * m * (p[1][0] - p[0][0]) + 2 * t * (p[2][0] - p[1][0]));
      return [x, y, (a * 180) / Math.PI];
    };
    let ports = '';
    for (const t of [0.42, 0.66]) {
      const [x, y, a] = qp(sheer(17.6), t);
      ports += `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)})">${k.shape(rect(-3, -2.6, 6, 5.2), { fill: 'ink', sw: 1.2 })}${k.S('M-3.6 -3.6L3.6 -3.6', 1.4, 'light')}</g>`;
    }
    let o = k.shape(poly(71, 19, 95, 2, 98, 5.5, 75, 23.5), { fill: 'mid', sw: 1.8, h: [{ a: 0, g: 1.4, r: rect(0, 4, 100, 30) }] });
    o += k.S('M96 5L81 32M92 8L84 17', 1.1);
    const hull = 'M2 72L6 66Q40 40 74 15C82 14 86 22 82 33C76 50 64 64 52 74L20 94L2 94Z';
    o += k.shape(hull, {
      fill: 'mid',
      hi: q(sheer(0.6)) + qrev(sheer(3.4)) + 'Z',
      h: [{ a: -35, g: 2.4, r: q(ext(sheer(13))) + 'L100 100L0 100Z' }, { a: 50, g: 2.4, r: q(ext(sheer(26))) + 'L100 100L0 100Z' }, { a: 30, g: 3.2, w: 0.8, r: q(ext(sheer(4))) + qrev(ext(sheer(8))) + 'Z' }],
      inner: k.S(strakes, 1) + k.shape(wale, { fill: 'mid', sw: 1.4, h: [{ a: 45, g: 1.5 }, { a: -45, g: 1.7 }] }) + ports +
        k.S('M30 58C32 63 30 67 33 72M44 48C46 55 44.6 61 47 68M58 38C60 45 58.6 51 61 58M70 30C72 36 71 41 73 46', 1.7, 'light'),
    });
    o += k.S('M77 18L79 14.5', 2.4);
    o += k.shape(waveLine(72, 6, 12, -6, 106, 3) + 'L106 106L-6 106Z', {
      fill: 'mid', sw: 2.2,
      h: [{ a: 0, g: 2.4 }, { a: -25, g: 2.6, r: rect(0, 86, 100, 20) }],
      inner: k.S(waveLine(80, 3, 10, -6, 106, 7), 1.3, 'light'),
    });
    for (const d of ['M16 74C12 62 6 56 1 54C9 53 16 58 20 67L24 74Z', 'M62 72C68 58 80 50 92 50C84 55 76 62 70 74Z', 'M38 74C34 64 32 56 34 47C39 55 43 63 46 72Z', 'M54 72C56 64 60 59 66 56C63 61 61 67 61 73Z'])
      o += k.shape(d, { fill: 'light', sw: 1.6, h: [{ a: 60, g: 2.2, w: 0.8, r: rect(0, 66, 100, 10) }] });
    for (const [x, y, r, a] of [[8, 46, 1.6, 60], [22, 50, 2, 75], [30, 40, 1.4, 80], [86, 40, 1.8, 120], [96, 46, 1.3, 140], [78, 46, 1.5, 110], [44, 42, 1.6, 95], [62, 48, 1.2, 100]])
      o += drop(k, x, y, r, a);
    return o;
  },
};

// ---------------------------------------------------------------- API

/** An icon as an SVG <g> placed in a parent SVG whose units are mm: centre (cx, cy), size s mm (box s×s). */
export function icon(name: IconName, cx: number, cy: number, s: number, tone: IconTone = TONE.sepia): string {
  const k = new K(tone, s < 11);
  const body = DRAW[name](k);
  const sc = String(Math.round((s / 100) * 1e5) / 1e5);
  return `<g transform="translate(${f(cx - s / 2)} ${f(cy - s / 2)}) scale(${sc})" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round">` +
    (k.defs.length ? `<defs>${k.defs.join('')}</defs>` : '') + body + '</g>';
}

/** A standalone <svg> (for HTML), width/height in mm. */
export function iconSvg(name: IconName, s: number, tone: IconTone = TONE.sepia): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}mm" height="${s}mm" viewBox="0 0 ${s} ${s}">${icon(name, s / 2, s / 2, s, tone)}</svg>`;
}
