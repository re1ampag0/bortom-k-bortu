// The drawing kit of the engraved icons (parts/icons.ts, parts/icons-story.ts): geometry helpers, the drawing context K
// (contour + hatching clipped to the shape, mid-tone, highlight) and the shared motifs. Pure string functions.
import type { IconTone } from './icons';
// ---------------------------------------------------------------- geometry helpers
// Paths are written with absolute M/L/Q/C/Z only, so every pair of numbers is a point (used for hatch bounding boxes).

export type Pt = [number, number];
export type Box = [number, number, number, number];
export const f = (n: number) => String(Math.round(n * 100) / 100);
export const pp = (p: Pt) => `${f(p[0])} ${f(p[1])}`;
export const rad = (a: number) => (a * Math.PI) / 180;
export const at = (cx: number, cy: number, r: number, a: number): Pt => [cx + r * Math.cos(rad(a)), cy + r * Math.sin(rad(a))];

export function bz(p: Pt[], t: number): Pt {
  const m = 1 - t;
  const a = m * m * m, b = 3 * m * m * t, c = 3 * m * t * t, e = t * t * t;
  return [a * p[0][0] + b * p[1][0] + c * p[2][0] + e * p[3][0], a * p[0][1] + b * p[1][1] + c * p[2][1] + e * p[3][1]];
}

export function circ(cx: number, cy: number, rx: number, ry = rx): string {
  const c = 0.5523, kx = rx * c, ky = ry * c;
  return `M${f(cx - rx)} ${f(cy)}C${f(cx - rx)} ${f(cy - ky)} ${f(cx - kx)} ${f(cy - ry)} ${f(cx)} ${f(cy - ry)}` +
    `C${f(cx + kx)} ${f(cy - ry)} ${f(cx + rx)} ${f(cy - ky)} ${f(cx + rx)} ${f(cy)}` +
    `C${f(cx + rx)} ${f(cy + ky)} ${f(cx + kx)} ${f(cy + ry)} ${f(cx)} ${f(cy + ry)}` +
    `C${f(cx - kx)} ${f(cy + ry)} ${f(cx - rx)} ${f(cy + ky)} ${f(cx - rx)} ${f(cy)}Z`;
}
/** lower half of an ellipse, left to right (open) */
export function lowerArc(cx: number, cy: number, rx: number, ry: number): string {
  const c = 0.5523;
  return `M${f(cx - rx)} ${f(cy)}C${f(cx - rx)} ${f(cy + ry * c)} ${f(cx - rx * c)} ${f(cy + ry)} ${f(cx)} ${f(cy + ry)}` +
    `C${f(cx + rx * c)} ${f(cy + ry)} ${f(cx + rx)} ${f(cy + ry * c)} ${f(cx + rx)} ${f(cy)}`;
}
export const rect = (x: number, y: number, w: number, h: number) => `M${f(x)} ${f(y)}L${f(x + w)} ${f(y)}L${f(x + w)} ${f(y + h)}L${f(x)} ${f(y + h)}Z`;
export function rrect(x: number, y: number, w: number, h: number, r: number): string {
  const X = x + w, Y = y + h;
  return `M${f(x + r)} ${f(y)}L${f(X - r)} ${f(y)}Q${f(X)} ${f(y)} ${f(X)} ${f(y + r)}L${f(X)} ${f(Y - r)}Q${f(X)} ${f(Y)} ${f(X - r)} ${f(Y)}` +
    `L${f(x + r)} ${f(Y)}Q${f(x)} ${f(Y)} ${f(x)} ${f(Y - r)}L${f(x)} ${f(y + r)}Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)}Z`;
}
export const poly = (...n: number[]) => {
  let d = '';
  for (let i = 0; i + 1 < n.length; i += 2) d += `${i ? 'L' : 'M'}${f(n[i])} ${f(n[i + 1])}`;
  return d + 'Z';
};
/** everything except the given closed path (for evenodd clips) */
export const outside = (d: string) => 'M-60 -60L160 -60L160 160L-60 160Z' + d;
/** a row of waves: rounded troughs, pointed crests at y */
export function waveLine(y: number, amp: number, len: number, x0 = -4, x1 = 104, shift = 0): string {
  let d = `M${f(x0 + shift)} ${f(y)}`;
  for (let x = x0 + shift; x < x1; x += len) d += `Q${f(x + len / 2)} ${f(y + amp)} ${f(x + len)} ${f(y)}`;
  return d;
}
/** scallops (arches) for chart-style sea */
export function scallops(x0: number, x1: number, y: number, len: number, h: number): string {
  let d = `M${f(x0)} ${f(y)}`;
  for (let x = x0; x < x1 - 0.1; x += len) d += `Q${f(x + len / 2)} ${f(y - h)} ${f(x + len)} ${f(y)}`;
  return d;
}
export function star(cx: number, cy: number, n: number, r0: number, r1: number, rot = -90): string {
  const p: number[] = [];
  for (let i = 0; i < n * 2; i++) p.push(...at(cx, cy, i % 2 ? r0 : r1, rot + (i * 180) / n));
  return poly(...p);
}
export function bbox(d: string): Box {
  const n = (d.match(/-?\d*\.?\d+/g) ?? []).map(Number);
  const b: Box = [1e9, 1e9, -1e9, -1e9];
  for (let i = 0; i + 1 < n.length; i += 2) {
    b[0] = Math.min(b[0], n[i]); b[1] = Math.min(b[1], n[i + 1]);
    b[2] = Math.max(b[2], n[i]); b[3] = Math.max(b[3], n[i + 1]);
  }
  return b;
}
export const meet = (a: Box, b: Box): Box => [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.min(a[3], b[3])];
/** parallel lines at angle a (degrees), spacing g, covering box b */
export function lines(a: number, g: number, b: Box): string {
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

export type Fill = 'ink' | 'mid' | 'light' | 'paper' | 'none';
/** a layer of hatching: angle a, gap g, width w, clipped to region r; fine layers are dropped when the icon is tiny */
export interface Hatch { a: number; g?: number; w?: number; r?: string; fine?: boolean }
export interface ShapeOpt { fill?: Fill; mid?: string; hi?: string; h?: Hatch[]; inner?: string; sw?: number }

let seq = 0;
export class K {
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
    if (h.fine && this.small) return '';
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
  /** a detail drawn only when the icon is printed large */
  fine(s: string): string { return this.small ? '' : s; }
  /** cast shadow of a shape, moved down-right (light from the upper left); draw it before the shape */
  cast(d: string, dx = 3, dy = 3, g = 1.7): string { return `<g transform="translate(${f(dx)} ${f(dy)})">${this.shade(d, 45, g)}</g>`; }
  /** graded shade of a rounded body (centre, radii) lit from the upper left: a hatch on the half turned away, a cross-hatch
   *  on the core shadow, a fine third layer in the deepest part */
  round(cx: number, cy: number, rx: number, ry = rx, a = 45, g = 2.4): Hatch[] {
    const o = (u: number, s: number) => outside(circ(cx - rx * u, cy - ry * u, rx * s, ry * s));
    return [{ a, g, r: o(0.3, 1.0) }, { a: a - 90, g: g * 1.1, r: o(0.42, 1.2) }, { a: a - 45, g: g * 1.25, w: 0.8, fine: true, r: o(0.5, 1.36) }];
  }
  /** graded shade across a cylinder lying along y (x0..x1), lit from the left: shade from the middle, core shadow near the
   *  right edge with a strip of reflected light, a light hatch on the far left edge */
  cyl(x0: number, x1: number, a = 90, g = 2.2): Hatch[] {
    const R = (u0: number, u1: number) => rect(x0 + (x1 - x0) * u0, -60, (x1 - x0) * (u1 - u0), 220);
    return [
      { a, g, r: R(0.55, 1.02) }, { a: a + 55, g: g * 1.15, r: R(0.72, 0.93) },
      { a: a - 55, g: g * 1.3, w: 0.8, fine: true, r: R(0.8, 0.9) }, { a, g: g * 1.6, w: 0.8, fine: true, r: R(-0.02, 0.08) },
    ];
  }
}

/** a smooth curve through the points (quadratic through the midpoints); 'M' starts a path, 'L' continues one */
export function curve(p: Pt[], start: 'M' | 'L' = 'M'): string {
  let d = `${start}${pp(p[0])}`;
  for (let i = 1; i < p.length - 1; i++) d += `Q${pp(p[i])} ${pp([(p[i][0] + p[i + 1][0]) / 2, (p[i][1] + p[i + 1][1]) / 2])}`;
  return d + `L${pp(p[p.length - 1])}`;
}
/** wood grain: n gently waving lines along a board x0..x1, y0..y1, broken at pseudo-random places */
export function grain(x0: number, y0: number, x1: number, y1: number, n: number, amp = 0.7, seed = 1): string {
  let d = '';
  for (let i = 0; i < n; i++) {
    const y = y0 + ((i + 0.5) * (y1 - y0)) / n, r = (j: number) => ((i * 37 + seed * 17 + j * 11) % 23) / 23;
    const a = x0 + (x1 - x0) * r(1) * 0.25, b = x1 - (x1 - x0) * r(2) * 0.25, len = (b - a) / 3;
    d += `M${f(a)} ${f(y)}`;
    for (let s = 0; s < 3; s++) d += `Q${f(a + len * (s + 0.5))} ${f(y + (s % 2 ? -amp : amp) * (0.6 + r(s + 3)))} ${f(a + len * (s + 1))} ${f(y)}`;
  }
  return d;
}
/** a rope between two points: a dark cord with a light core and the twist as short slanted ticks */
export function rope(k: K, x0: number, y0: number, x1: number, y1: number, w = 2.6): string {
  const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L;
  let t = '';
  if (!k.small) for (let s = w; s < L - w * 0.5; s += w * 0.9) {
    const cx = x0 + ux * s, cy = y0 + uy * s, h = w * 0.42;
    t += `M${f(cx - uy * h - ux * h)} ${f(cy + ux * h - uy * h)}L${f(cx + uy * h + ux * h)} ${f(cy - ux * h + uy * h)}`;
  }
  const d = `M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`;
  return k.S(d, w + 1.2) + k.S(d, w - 0.6, 'mid') + (t ? k.S(t, 0.7) : '');
}

// ---------------------------------------------------------------- shared motifs

/** 8-point compass star, one half of every point dark, one light */
export function compass(k: K, cx: number, cy: number, R: number, r: number): string {
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

export function cardBack(k: K, x: number, y: number, w: number, h: number, kind: 'lattice' | 'sea'): string {
  const inn = rrect(x + 3.6, y + 3.6, w - 7.2, h - 7.2, 1.8), cx = x + w / 2, cy = y + h / 2;
  let o = k.shape(rrect(x, y, w, h, 3.6), { fill: 'light', sw: 2.2, inner: k.fine(k.S(rrect(x + 1.8, y + 1.8, w - 3.6, h - 3.6, 2.4), 0.6)) });
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
export function drop(k: K, cx: number, cy: number, r: number, a: number): string {
  const t = r * 2.8;
  return `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${f(a)})"><path d="M${f(t)} 0C${f(r * 0.6)} ${f(-r)} ${f(-r)} ${f(-r * 1.1)} ${f(-r)} 0C${f(-r)} ${f(r * 1.1)} ${f(r * 0.6)} ${f(r)} ${f(t)} 0Z" fill="${k.t.light}" stroke="${k.t.ink}" stroke-width="${f(k.w(1.2))}"/></g>`;
}

export function bubble(k: K, cx: number, cy: number, r: number): string {
  return k.shape(circ(cx, cy, r), { fill: 'light', sw: r > 2.5 ? 1.5 : 1.2 }) + k.F(circ(cx - r * 0.35, cy - r * 0.35, r * 0.28), 'paper');
}

/** a billowing cloud of smoke: n lobes round an ellipse, each bulging outward; seed varies the lobes */
export function cloud(cx: number, cy: number, rx: number, ry: number, n = 7, bump = 0.5, seed = 0): string {
  const p: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = rad(-90 + (i * 360) / n + ((seed * 29 + i * 47) % 17) - 8), s = 0.86 + (((seed * 13 + i * 31) % 11) / 11) * 0.22;
    p.push([cx + rx * s * Math.cos(a), cy + ry * s * Math.sin(a)]);
  }
  let d = `M${pp(p[0])}`;
  for (let i = 0; i < n; i++) {
    const a = p[i], b = p[(i + 1) % n], m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const ox = m[0] - cx, oy = m[1] - cy, L = Math.hypot(ox, oy) || 1, len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const c: Pt = [m[0] + (ox / L) * len * bump, m[1] + (oy / L) * len * bump];
    d += `Q${pp(c)} ${pp(b)}`;
  }
  return d + 'Z';
}
