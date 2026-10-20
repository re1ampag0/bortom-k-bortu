// FX-C: the weather of the round on the sea (applyRoundWeather, stormLayer, waveLayer of the A5 prototype —
// docs/mockups/a5/fx/src/template.html, fx3.js; ANIMATIONS.md §3.10). It stays for the whole round and lies in the
// layer of the weather (.fx-weather, clipped to the water): under the traces and under the planks.
// game: drawn in the coordinates of the real sea (.sea-water), the prototype's numbers of its 1022×404 sea scale with it;
// the loops are endless Web Animations of the weather layer (no SMIL: the layer keeps them, «Сразу итог» leaves them);
// a phone has the same weather as a laptop (PH 7: all the drops, the blurred clouds); «простые спецэффекты» — the weather stands still
// (the same picture, nothing moves, no filters). The planks pitch (storm) or heave (the Ninth wave) by CSS (game.css,
// .board[data-wx-move]), the sea picture is tinted by CSS (.board[data-wx]).
import { bigShip } from '../art/bigShips';
import { bx, filters, plank, type Box, type FxCtx } from './primitives';

const NS = 'http://www.w3.org/2000/svg';
const R1 = (n: number) => Math.round(n * 10) / 10;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

/** The round-long weathers of the prototype (ROUND_LONG); the others are «сразу» cards with no weather. */
export const ROUND_LONG = ['calm', 'wind', 'fog', 'storm', 'wave', 'maelstrom', 'clear', 'reefs', 'fleet', 'moon'];

interface Wx {
  ctx: FxCtx;
  /** the sea in the coordinates of the board */
  sea: Box;
  W: number;
  H: number;
  /** the prototype's 1022×404 sea → this one */
  kx: number;
  ky: number;
  moving: boolean;
  /** blur, turbulence */
  soft: boolean;
}
/** An endless loop of the weather (a negative delay — a phase); nothing when the weather stands still. */
function loop(w: Wx, el: Element, kf: Keyframe[], dur: number, delay = 0, easing = 'linear'): void {
  if (!w.moving) return;
  el.animate(kf, { duration: dur, delay, iterations: Infinity, easing });
}
/** An svg over the sea (its own coordinates: 0..W × 0..H). */
function seaSvg(w: Wx, host: HTMLElement, cls: string, inner: string): SVGSVGElement {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('class', `wx ${cls}`);
  s.setAttribute('width', String(R1(w.W)));
  s.setAttribute('height', String(R1(w.H)));
  s.setAttribute('aria-hidden', 'true');
  s.style.cssText = `left:${R1(w.sea.x)}px;top:${R1(w.sea.y)}px;overflow:hidden;pointer-events:none;opacity:1`;
  s.innerHTML = inner;
  host.appendChild(s);
  return s;
}
/** The box of a plank in the coordinates of the sea. */
const inSea = (w: Wx, b: Box) => ({ x: b.x - w.sea.x, y: b.y - w.sea.y, w: b.w, h: b.h, cx: b.cx - w.sea.x, cy: b.cy - w.sea.y, r: b.r - w.sea.x, b: b.b - w.sea.y });

/** The storm: no flat dimming — the sea turns grey-green (CSS on the sea picture), cloud shadows sweep, curtains of rain,
 *  sheets of rain, whitecaps flash; far lightning at the edge; the planks pitch (CSS). */
function storm(w: Wx, host: HTMLElement): void {
  const { W, H, kx, ky } = w;
  const clouds = w.soft ? [[0, 120, 260, 22], [1, 300, 200, 30], [2, 40, 300, 26]] : [];
  const s = seaSvg(w, host, 'wx-storm', `<defs>${w.soft ? '<filter id="wxCloudB" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="26"/></filter>' : ''}
<linearGradient id="wxCurtain" x1="0" x2="1"><stop offset="0" stop-color="#cfdde2" stop-opacity="0"/><stop offset=".5" stop-color="#cfdde2" stop-opacity=".22"/><stop offset="1" stop-color="#cfdde2" stop-opacity="0"/></linearGradient>
<radialGradient id="wxStormV" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#05090c" stop-opacity=".45"/></radialGradient></defs>
${clouds.map(([, y, rx]) => `<ellipse class="cl" cx="0" cy="${R1(y * ky)}" rx="${R1(rx * kx)}" ry="${R1(rx * kx * 0.45)}" fill="#0a141a" opacity=".42" filter="url(#wxCloudB)"/>`).join('')}
${[0, 1].map(() => `<g class="cu"><rect x="0" y="0" width="${R1(220 * kx)}" height="${R1(H)}" fill="url(#wxCurtain)"/>${Array.from({ length: 40 }, () => `<path d="M${R1(rnd(10, 210) * kx)} ${R1(rnd(-20, H))} l-7 26" stroke="#e6f0f3" stroke-width="1.2" opacity=".6"/>`).join('')}</g>`).join('')}
${[0, 1].map((k) => `<g opacity="${k ? 0.4 : 0.62}"><g class="sh">${Array.from({ length: 80 }, () => `<path d="M${R1(rnd(-40, W + 60))} ${R1(rnd(-60, H))} l-6 ${k ? 16 : 22}" stroke="#d9e8ee" stroke-width="${k ? 0.8 : 1.1}" stroke-linecap="round"/>`).join('')}</g></g>`).join('')}
${Array.from({ length: 34 }, () => { const x = R1(rnd(20, W - 40)), y = R1(rnd(20, H - 10)), ww = R1(rnd(10, 24) * Math.max(0.7, kx)); return `<path class="wc" d="M${x} ${y} q${R1(ww / 2)} -5 ${ww} 0 q-${R1(ww * 0.3)} 2 -${R1(ww * 0.6)} 1" fill="#f2f7f8" stroke="#f2f7f8" stroke-width="1" opacity="${w.moving ? 0 : 0.45}"/>`; }).join('')}
<rect width="${R1(W)}" height="${R1(H)}" fill="url(#wxStormV)"/>
${[[120, 7], [880, 9.5], [520, 12]].map(([x]) => `<g class="bo" opacity="0"><ellipse cx="${R1(x * kx)}" cy="0" rx="160" ry="70" fill="#f4f8ff" opacity=".35"/><path d="M${R1(x * kx)} -4 l-8 18 l10 2 l-14 26 l6 -18 l-10 -2 Z" fill="#fff8d8"/></g>`).join('')}`);
  s.querySelectorAll('.cl').forEach((c, i) => { const [, , rx, d] = clouds[i]; loop(w, c, [{ transform: `translateX(${R1((-rx - i * 300) * kx)}px)` }, { transform: `translateX(${R1(W + rx * kx)}px)` }], d * 1000, -i * 8000); });
  s.querySelectorAll('.cu').forEach((c, i) => { if (!w.moving) c.setAttribute('transform', `translate(${R1(W * (0.2 + 0.45 * i))} 0)`); loop(w, c, [{ transform: `translateX(${R1(-300 * kx)}px)` }, { transform: `translateX(${R1(W + 100 * kx)}px)` }], (9 + i * 4) * 1000, -i * 5000); });
  s.querySelectorAll('.sh').forEach((c, k) => loop(w, c, [{ transform: 'translate(0px,-60px)' }, { transform: 'translate(-30px,0px)' }], k ? 900 : 550));
  s.querySelectorAll('.wc').forEach((c) => loop(w, c, [{ opacity: 0 }, { opacity: 0.9 }, { opacity: 0.6 }, { opacity: 0 }], rnd(1.6, 3.4) * 1000, -rnd(0, 3000)));
  s.querySelectorAll('.bo').forEach((c, i) => loop(w, c, [{ opacity: 0, offset: 0 }, { opacity: 0, offset: 0.9 }, { opacity: 1, offset: 0.905 }, { opacity: 0.2, offset: 0.915 }, { opacity: 1, offset: 0.925 }, { opacity: 0, offset: 0.94 }, { opacity: 0, offset: 1 }], [7, 9.5, 12][i] * 1000, -i * 3000));
}

/** The Ninth wave: a real swell — a lifted back, a dark front, a torn foam crest throwing spray back, every 8 s; the
 *  planks ride up and down as it passes under their middle (CSS, a delay by the place of each). */
function wave(w: Wx, host: HTMLElement): void {
  const { W, H, kx } = w, P = 8000, run = 0.62;
  const off = (y: number) => 52 * kx * Math.sin((Math.PI * (y + 30)) / (H + 60)); // the crest bows forward in the middle
  const line = (dx: number, step = 12, jit = 5) => { const pts: string[] = []; for (let y = -30; y < H + 40; y += step) pts.push(`${R1(off(y) + dx + rnd(-jit, jit))} ${y}`); return 'M' + pts.join(' L'); };
  const crestD = line(0);
  const blobs = Array.from({ length: 90 }, () => { const y = rnd(-10, H + 10); return `<ellipse cx="${R1(off(y) + rnd(-10, 8))}" cy="${R1(y)}" rx="${R1(rnd(4, 12))}" ry="${R1(rnd(3, 7))}" fill="#f4f9fa" opacity="${R1(rnd(0.6, 1))}"/>`; }).join('');
  const lace = Array.from({ length: 12 }, (_, i) => `<path d="${line((-22 - i * 16 - rnd(0, 8)) * Math.max(0.6, kx), 16, 8)}" fill="none" stroke="#e8f4f7" stroke-width="${R1(2.2 - i * 0.14)}" stroke-dasharray="${R1(rnd(10, 30))} ${R1(rnd(8, 26))}" opacity="${R1(0.75 - i * 0.05)}" stroke-linecap="round"/>`).join('');
  const spray = Array.from({ length: 34 }, () => { const y = rnd(0, H); return `<circle class="sp" cx="${R1(off(y))}" cy="${R1(y)}" r="${R1(rnd(1.2, 2.8))}" fill="#f4f9fa"/>`; }).join('');
  const band = (dx: number, sw: number, c: string, o: number) => `<path d="${line(dx * kx, 20, 0)}" fill="none" stroke="${c}" stroke-width="${R1(sw * kx)}" opacity="${o}"/>`;
  const s = seaSvg(w, host, 'wx-wave', `<defs>${w.soft ? '<filter id="wxFoam" x="-30%" y="-5%" width="160%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="10"/></filter><filter id="wxSoft" x="-50%" y="-5%" width="200%" height="110%"><feGaussianBlur stdDeviation="14 2"/></filter>' : ''}</defs>
<g class="crest"><g ${w.soft ? 'filter="url(#wxSoft)"' : ''}>${band(-260, 160, '#2a5e72', 0.35)}${band(-120, 120, '#4c8ca2', 0.45)}${band(-34, 60, '#86c0d2', 0.55)}${band(50, 70, '#04141b', 0.6)}${band(110, 60, '#04141b', 0.25)}</g>
${lace}<g ${w.soft ? 'filter="url(#wxFoam)"' : ''}><path d="${crestD}" fill="none" stroke="#f4f9fa" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>${blobs}</g>
<path d="${crestD}" fill="none" stroke="#ffffff" stroke-width="3.4" transform="translate(9 0)" opacity=".95"/>${spray}</g>`);
  const crest = s.querySelector('.crest')!;
  const from = -420 * kx, to = W + 140 * kx;
  if (w.moving) loop(w, crest, [{ transform: `translateX(${R1(from)}px)`, offset: 0 }, { transform: `translateX(${R1(to)}px)`, offset: run }, { transform: `translateX(${R1(to)}px)`, offset: 1 }], P);
  else crest.setAttribute('transform', `translate(${R1(W * 0.42)} 0)`);
  s.querySelectorAll('.sp').forEach((c) => { const dx = rnd(30, 80), d = rnd(600, 1100); loop(w, c, [{ transform: 'translate(0px,0px)', opacity: 1 }, { transform: `translate(${R1(-dx / 2)}px,${R1(-rnd(6, 18))}px)`, opacity: 0.6 }, { transform: `translate(${R1(-dx)}px,4px)`, opacity: 0 }], d, -rnd(0, d)); });
  // the ships heave as the crest passes their middle: a delay by the place of each (pgheave of the prototype)
  if (w.moving) for (const p of w.ctx.board.querySelectorAll<HTMLElement>('[data-fx-ship]')) {
    const b = inSea(w, bx(w.ctx, p)), crestAt = b.cx - off(b.cy);
    const tc = (P / 1000) * run * ((crestAt - from) / (to - from));
    p.style.setProperty('--wx-heave', `${R1(tc - 0.42)}s`);
  }
}

/** The maelstrom that draws in: the foam runs down the spiral arms into the eye, the eye breathes, wreckage goes down. */
function maelstrom(w: Wx, host: HTMLElement): void {
  const { W, H } = w, cx = W / 2, cy = (H * 196) / 404, R = Math.min(250 * w.kx, W * 0.42, (H * 0.48) / 0.36), sq = 0.36;
  const spiral = (r0: number, r1: number, turns: number, a0: number, n = 140) => { const pts: [number, number][] = []; for (let i = 0; i <= n; i++) { const t = i / n, r = r0 * Math.pow(r1 / r0, t), a = a0 + t * turns * Math.PI * 2; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * sq]); } return pts; };
  const arms = [0, 1.05, 2.1, 3.15, 4.2, 5.25].map((a0) => spiral(R * 0.84, 7, 2.2, a0));
  const d = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${R1(x)} ${R1(y)}`).join(' ');
  const s = seaSvg(w, host, 'wx-maelstrom', `<defs><radialGradient id="wxMael" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#06141a"/><stop offset=".18" stop-color="#0f2a35"/><stop offset=".55" stop-color="#1d4656" stop-opacity=".8"/><stop offset="1" stop-color="#2a5a6c" stop-opacity="0"/></radialGradient></defs>
<ellipse cx="${R1(cx)}" cy="${R1(cy)}" rx="${R1(R)}" ry="${R1(R * sq)}" fill="url(#wxMael)"/>
${Array.from({ length: 7 }, (_, i) => { const k = 1 - i / 7.5; return `<ellipse cx="${R1(cx)}" cy="${R1(cy + i * 3.2)}" rx="${R1(R * 0.8 * k)}" ry="${R1(R * 0.29 * k)}" fill="#0a1e27" opacity="${R1(0.1 + i * 0.06)}" stroke="#7fb2c4" stroke-width=".6" stroke-opacity="${R1(0.5 - i * 0.05)}"/>`; }).join('')}
<ellipse class="rim" cx="${R1(cx)}" cy="${R1(cy)}" rx="${R1(R * 0.86)}" ry="${R1(R * 0.31)}" fill="none" stroke="#eef6f8" stroke-width="2.6" stroke-dasharray="4 7 14 9" opacity=".75"/>
${Array.from({ length: 14 }, (_, i) => { const t = (i / (14)) * Math.PI * 2; return `<circle class="fd" cx="${R1(cx + Math.cos(t) * R * 0.86)}" cy="${R1(cy + Math.sin(t) * R * 0.31)}" r="1.6" fill="#eef6f8" opacity="${w.moving ? 0 : 0.6}"/>`; }).join('')}
${arms.map((pts, i) => `<path class="arm" d="${d(pts)}" fill="none" stroke="#cfe8ef" stroke-width="${i % 2 ? 1.4 : 2.4}" stroke-linecap="round" stroke-dasharray="26 18" opacity="${i % 2 ? 0.55 : 0.85}"/><path class="arm2" d="${d(pts)}" fill="none" stroke="#8fc0cf" stroke-width="1" stroke-dasharray="8 12" opacity=".7"/>`).join('')}
<ellipse class="eye" cx="${R1(cx)}" cy="${R1(cy)}" rx="16" ry="6" fill="#030a0d" style="transform-box:fill-box;transform-origin:center"/>
${w.moving ? (['plank', 'barrel', 'plank', 'plank', 'barrel'] as const).map((k) => `<g class="db">${k === 'plank' ? '<rect x="-9" y="-2.4" width="18" height="4.8" rx="1" fill="#a8703a" stroke="#3a2412" stroke-width=".7"/><path d="M-6 -2.4 V2.4 M2 -2.4 V2.4" stroke="#6b4422" stroke-width=".6"/>' : '<ellipse rx="6" ry="7.4" fill="#8a5a32" stroke="#3a2412" stroke-width=".7"/><path d="M-6 -2.4 H6 M-6 2.4 H6" stroke="#3a3530" stroke-width="1.1"/>'}</g>`).join('') : ''}`);
  const rim = s.querySelector('.rim');
  if (rim) loop(w, rim, [{ strokeDashoffset: 0 }, { strokeDashoffset: -68 }], 2400);
  s.querySelectorAll('.fd').forEach((c, i) => { const dd = (1 + (i % 4) * 0.3) * 1000; loop(w, c, [{ transform: 'translateY(0px)', opacity: 0 }, { transform: 'translateY(-7px)', opacity: 1 }, { transform: 'translateY(0px)', opacity: 0 }], dd); });
  s.querySelectorAll('.arm').forEach((c, i) => loop(w, c, [{ strokeDashoffset: 0 }, { strokeDashoffset: -176 }], (2.6 + i * 0.2) * 1000));
  s.querySelectorAll('.arm2').forEach((c, i) => loop(w, c, [{ strokeDashoffset: 0 }, { strokeDashoffset: -120 }], (1.6 + i * 0.15) * 1000));
  const eye = s.querySelector('.eye');
  if (eye) loop(w, eye, [{ transform: 'scale(.88,.84)' }, { transform: 'scale(1.38,1.34)' }, { transform: 'scale(.88,.84)' }], 2200, 0, 'ease-in-out');
  // the wreckage goes down the arms: along the spiral, smaller and gone at its end
  s.querySelectorAll('.db').forEach((g, i) => {
    const pts = arms[[0, 2, 4, 1, 3][i]], dur = [6.5, 8, 7.2, 9.4, 10][i] * 1000, n = 24;
    const kf = Array.from({ length: n + 1 }, (_, j) => { const k = Math.min(pts.length - 2, Math.floor((j / n) * (pts.length - 1))), [x, y] = pts[k], [x2, y2] = pts[k + 1], a = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI, t = j / n; return { transform: `translate(${R1(x)}px,${R1(y)}px) rotate(${R1(a)}deg) scale(${t < 0.75 ? 1 : R1(1 - ((t - 0.75) / 0.25) * 0.75)})`, opacity: t < 0.8 ? 1 : R1(1 - (t - 0.8) / 0.2) }; });
    loop(w, g, kf, dur, -i * 2100);
  });
}

/** The diagonals crossed out (Туман): from the inner edge of a ship of the top row to the one of the other place below. */
function fogDiagonals(w: Wx): string {
  const ctx = w.ctx, bottom = ctx.bottom, D = ctx.display, out: string[] = [];
  const at = (side: 'top' | 'bottom', pos: number) => Object.keys(D.ships).find((c) => !D.ships[c].sunk && D.ships[c].pos === pos && (ctx.data.ships.find((s) => s.code === c)!.side === bottom) === (side === 'bottom'));
  const pairs = [0, 1].map((p) => [at('top', p), at('bottom', 1 - p)] as const).filter(([a, b]) => a && b) as [string, string][];
  for (const [a, b] of pairs) {
    const A0 = inSea(w, bx(ctx, plank(ctx, a))), B0 = inSea(w, bx(ctx, plank(ctx, b)));
    const dir = Math.sign(B0.cx - A0.cx) || 1, x0 = A0.cx + dir * A0.w * 0.25, x1 = B0.cx - dir * B0.w * 0.25, y0 = A0.b + 4, y1 = B0.y - 4;
    out.push(`<path d="M${R1(x0)} ${R1(y0)} L${R1(x1)} ${R1(y1)}" stroke="#f4f7f8" stroke-width="2.6" stroke-dasharray="9 9" opacity=".9" fill="none"/>`);
    out.push(`<g transform="translate(${R1((x0 + x1) / 2)} ${R1((y0 + y1) / 2)})"><circle r="17" fill="#3a4a54" opacity=".6"/><path d="M-9 -9 L9 9 M9 -9 L-9 9" stroke="#e06a52" stroke-width="3.4" stroke-linecap="round"/></g>`);
  }
  return out.join('');
}

/** Fog banks drift under the planks; the diagonals are crossed out — no Volleys by the diagonal. */
function fog(w: Wx, host: HTMLElement): void {
  const { W, H, kx, ky } = w;
  const banks = [[180, 150, 260, 60, 22], [640, 210, 300, 70, 30], [380, 300, 260, 54, 26], [900, 120, 220, 56, 18]];
  const s = seaSvg(w, host, 'wx-fog', `<defs><radialGradient id="wxFogB"><stop offset="0" stop-color="#eef1f3" stop-opacity=".95"/><stop offset="1" stop-color="#eef1f3" stop-opacity="0"/></radialGradient><radialGradient id="wxFogT"><stop offset="0" stop-color="#eef1f3" stop-opacity=".26"/><stop offset="1" stop-color="#eef1f3" stop-opacity="0"/></radialGradient></defs>
<rect width="${R1(W)}" height="${R1(H)}" fill="#c9d3d8" opacity=".22"/>
${banks.map(([x, y, rx, ry]) => `<ellipse class="fb" cx="${R1(x * kx)}" cy="${R1(y * ky)}" rx="${R1(rx * kx)}" ry="${R1(ry * ky)}" fill="url(#wxFogB)" opacity=".8"/>`).join('')}
${fogDiagonals(w)}
${[[260, 80, 240], [760, 330, 260]].map(([x, y, rx]) => `<ellipse class="ft" cx="${R1(x * kx)}" cy="${R1(y * ky)}" rx="${R1(rx * kx)}" ry="40" fill="url(#wxFogT)"/>`).join('')}`);
  s.querySelectorAll('.fb').forEach((e, i) => loop(w, e, [{ transform: 'translateX(0px)', opacity: 0.8 }, { transform: `translateX(${R1((i % 2 ? -90 : 90) * kx)}px)`, opacity: 1 }, { transform: 'translateX(0px)', opacity: 0.8 }], banks[i][4] * 1000, 0, 'ease-in-out'));
  s.querySelectorAll('.ft').forEach((e, i) => loop(w, e, [{ transform: 'translateX(0px)' }, { transform: `translateX(${R1((i ? -140 : 140) * kx)}px)` }, { transform: 'translateX(0px)' }], (26 + i * 6) * 1000, 0, 'ease-in-out'));
}

/** Calm: the sea stands still (its waves stop — CSS), rare glints. */
function calm(w: Wx, host: HTMLElement): void {
  const { W, H, kx, ky } = w;
  const s = seaSvg(w, host, 'wx-calm', `<rect width="${R1(W)}" height="${R1(H)}" fill="#9fc6cf" opacity=".16"/>${Array.from({ length: 9 }, (_, i) => `<path class="gl" d="M${R1(rnd(40, 900) * kx)} ${R1((30 + i * 42) * ky)} h${R1(rnd(60, 160) * kx)}" stroke="#eaf5f7" stroke-width="1.4" stroke-linecap="round" opacity="${w.moving ? 0 : 0.35}"/>`).join('')}`);
  s.querySelectorAll('.gl').forEach((e) => loop(w, e, [{ opacity: 0 }, { opacity: 0.6 }, { opacity: 0 }], rnd(4, 7) * 1000, -rnd(0, 6000)));
}
/** Wind: the crests run faster (CSS), gusts sweep over the sea. */
function wind(w: Wx, host: HTMLElement): void {
  const { W, H, kx } = w;
  const s = seaSvg(w, host, 'wx-wind', Array.from({ length: 12 }, (_, i) => { const y = R1(20 + (i * (H - 40)) / (12) + rnd(-8, 8)), len = R1(rnd(70, 160) * Math.max(0.6, kx)); return `<path class="gu" d="M0 ${y} q${R1(len / 2)} -6 ${len} 0 q${R1(len * 0.15)} 3 ${R1(len * 0.3)} -4" fill="none" stroke="#eef6f8" stroke-width="${i % 3 ? 1.4 : 2.2}" stroke-linecap="round" opacity=".75" ${w.moving ? '' : `transform="translate(${R1(rnd(0, W - len))} 0)"`}/>`; }).join(''));
  s.querySelectorAll('.gu').forEach((e) => loop(w, e, [{ transform: `translateX(${R1(-200 * kx)}px)` }, { transform: `translateX(${R1(W + 40)}px)` }], rnd(1.4, 2.4) * 1000, -rnd(0, 2000)));
}
/**
 * Clear sky (B5; seaEffect2 → key === 'clear' and .pg-lightfx.clear of the prototype): a warm soft glow of the sun on the water —
 * a radial gradient #ffe7a4 (.7 → 0), its centre at the top right of the sea (.62, .2, r .7), no disc, no rings — and 34 four-pointed
 * glints (#fff8de, 4–8 px), each flashing and fading on its own round. Only over the water: the glow is masked by the planks and
 * the glints keep clear of them. It comes in a little stronger and settles (1 → .8). Standing still (simple effects, reduced
 * motion): the glow alone, no glints.
 */
function clear(w: Wx, host: HTMLElement): void {
  const { W, H } = w;
  const planks = Array.from(w.ctx.board.querySelectorAll('[data-fx-ship]')).map((p) => inSea(w, bx(w.ctx, p)));
  const hit = (x: number, y: number, r: number) => planks.some((b) => x + r > b.x && x - r < b.r && y + r > b.y && y - r < b.b);
  const glints = Array.from({ length: 34 }, () => {
    let x = 0, y = 0, r = 0, n = 0;
    do { x = R1(rnd(20, W - 20)); y = R1(rnd(20, H - 20)); r = R1(rnd(4, 8)); } while (hit(x, y, r + 2) && ++n < 40);
    return n >= 40 ? '' : `<path class="sk" d="M${x} ${R1(y - r)} L${R1(x + r * 0.25)} ${R1(y - r * 0.25)} L${R1(x + r)} ${y} L${R1(x + r * 0.25)} ${R1(y + r * 0.25)} L${x} ${R1(y + r)} L${R1(x - r * 0.25)} ${R1(y + r * 0.25)} L${R1(x - r)} ${y} L${R1(x - r * 0.25)} ${R1(y - r * 0.25)} Z" fill="#fff8de" opacity="0"/>`;
  }).join('');
  const s = seaSvg(w, host, 'wx-clear', `<defs><radialGradient id="wxSun" cx=".62" cy=".2" r=".7"><stop offset="0" stop-color="#ffe7a4" stop-opacity=".7"/><stop offset="1" stop-color="#ffe7a4" stop-opacity="0"/></radialGradient>
<mask id="wxSunM"><rect width="${R1(W)}" height="${R1(H)}" fill="#fff"/>${planks.map((b) => `<rect x="${R1(b.x)}" y="${R1(b.y)}" width="${R1(b.w)}" height="${R1(b.h)}" fill="#000"/>`).join('')}</mask></defs><rect width="${R1(W)}" height="${R1(H)}" fill="url(#wxSun)" mask="url(#wxSunM)"/>
${w.moving ? glints : ''}`);
  // it comes in a little stronger and settles
  if (w.moving) s.animate([{ opacity: 1 }, { opacity: 0.8 }], { duration: 2200, fill: 'forwards', easing: 'ease-out' });
  else s.style.opacity = '0.8';
  s.querySelectorAll('.sk').forEach((e) => loop(w, e, [{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }], rnd(1.6, 3) * 1000, -rnd(0, 3000)));
}
/** Moon: the night, the moon road on the water, stars. */
function moon(w: Wx, host: HTMLElement): void {
  const { W, H, kx, ky } = w, mx = W / 2;
  const s = seaSvg(w, host, 'wx-moon', `<rect width="${R1(W)}" height="${R1(H)}" fill="#0a1430" opacity=".45"/><ellipse cx="${R1(mx)}" cy="-30" rx="${R1(120 * kx)}" ry="60" fill="#f3e6b0" opacity=".12"/>
${Array.from({ length: 18 }, (_, i) => { const y = R1((12 + i * 22) * ky), ww = R1((26 + i * 7) * Math.max(0.6, kx)); return `<path class="rd" d="M${R1(mx - ww / 2 + rnd(-12, 12))} ${y} h${ww}" stroke="#f3e6b0" stroke-opacity="${R1(0.95 - i * 0.04)}" stroke-width="${R1(3 - i * 0.08)}" stroke-linecap="round" opacity=".7"/>`; }).join('')}
${Array.from({ length: 16 }, () => `<circle class="st" cx="${R1(rnd(20, W - 20))}" cy="${R1(rnd(10, H - 10))}" r="${R1(rnd(0.8, 1.6))}" fill="#f3e6b0" opacity="${w.moving ? 0 : 0.6}"/>`).join('')}`);
  s.querySelectorAll('.rd').forEach((e) => loop(w, e, [{ opacity: 0.35 }, { opacity: 1 }, { opacity: 0.35 }], rnd(1.5, 2.6) * 1000, -rnd(0, 2000)));
  s.querySelectorAll('.st').forEach((e) => loop(w, e, [{ opacity: 0 }, { opacity: 0.9 }, { opacity: 0 }], rnd(2, 4) * 1000, -rnd(0, 4000)));
}
/** Reefs: rocks with surf. */
function reefs(w: Wx, host: HTMLElement): void {
  const { kx, ky } = w, k0 = Math.max(0.6, Math.min(kx, ky));
  const rock = (x: number, y: number, k: number) => `<g transform="translate(${R1(x * kx)} ${R1(y * ky)}) scale(${R1(k * k0 * 100) / 100})"><ellipse class="sf" cx="0" cy="4" rx="30" ry="7" fill="none" stroke="#eef6f8" stroke-width="2" style="transform-box:fill-box;transform-origin:center"/><path d="M-22 4 L-12 -14 L-6 -6 L2 -24 L10 -10 L16 -16 L24 4 Z" fill="#6f665d" stroke="#22190f" stroke-width="1.2" stroke-linejoin="round"/><path d="M2 -24 L4 -10 L10 -10 M-12 -14 L-10 -4" stroke="#9a9086" stroke-width="1" fill="none"/><path d="M-26 4 q6 -5 12 0 q6 -5 12 0 q6 -5 12 0 q6 -5 12 0 q6 -5 12 0" fill="none" stroke="#eef6f8" stroke-width="1.6"/></g>`;
  const s = seaSvg(w, host, 'wx-reefs', rock(120, 200, 1) + rock(511, 192, 1.2) + rock(890, 206, 0.9) + rock(300, 380, 0.7) + rock(740, 30, 0.7));
  s.querySelectorAll('.sf').forEach((e) => loop(w, e, [{ transform: 'scaleX(.87)', opacity: 0.9 }, { transform: 'scaleX(1.2)', opacity: 0.3 }, { transform: 'scaleX(.87)', opacity: 0.9 }], 2400));
}
/** The fleet on the horizon: ships pass along the middle of the sea, bow first (to the right: flipped, as the caravan). */
function fleet(w: Wx, host: HTMLElement): void {
  const { W, ky, kx } = w, y = 214 * ky, k = Math.max(0.3, 0.42 * Math.min(1, kx));
  const s = seaSvg(w, host, 'wx-fleet', `<path d="M0 ${R1(y)} H${R1(W)}" stroke="#eef6f8" stroke-width="1" opacity=".25" stroke-dasharray="2 6"/>${[0, 1, 2, 3].map((i) => `<g class="fl" opacity="${R1(0.8 - i * 0.1)}" ${w.moving ? '' : `transform="translate(${R1(W * (0.15 + i * 0.22))} ${R1(y + (i % 2) * 8)})"`}>${bigShip('merchant', 0, 0, R1((k - i * 0.03) * 100) / 100, true)}</g>`).join('')}`);
  s.querySelectorAll('.fl').forEach((e, i) => loop(w, e, [{ transform: `translate(${R1(-140 * kx)}px,${R1(y + (i % 2) * 8)}px)` }, { transform: `translate(${R1(W + 140 * kx)}px,${R1(y + (i % 2) * 8)}px)` }], 40000, -i * 10000));
}

/**
 * e2e and scenes only: «&wxStill=1» keeps the planks still in the storm and the Ninth wave (the weather itself is drawn
 * and moves as usual) — the checks of the layout measure the planks and press their buttons without the pitch.
 */
const planksStillForTest = () => typeof location !== 'undefined' && new URLSearchParams(location.search).get('wxStill') === '1';

/**
 * Draws the weather of the round `key` into `host` (emptied before). `moving` — false with «простые спецэффекты»: the
 * same picture standing still. Sets the board's data-wx (the tint of the sea picture) and data-wx-move (the planks
 * pitch / heave) — game.css; both go when there is no weather.
 */
export function drawWeather(ctx: FxCtx, host: HTMLElement, key: string | null, moving: boolean): void {
  const board = ctx.board;
  host.innerHTML = '';
  for (const p of board.querySelectorAll<HTMLElement>('[data-fx-ship]')) p.style.removeProperty('--wx-heave');
  const water = board.querySelector('.sea-water');
  if (!key || !ROUND_LONG.includes(key) || !water) { delete board.dataset.wx; delete board.dataset.wxMove; return; }
  board.dataset.wx = key;
  if (moving && (key === 'storm' || key === 'wave') && !planksStillForTest()) board.dataset.wxMove = key;
  else delete board.dataset.wxMove;
  const sea = bx(ctx, water);
  const w: Wx = { ctx, sea, W: sea.w, H: sea.h, kx: sea.w / 1022, ky: sea.h / 404, moving, soft: moving && filters(ctx) };
  if (key === 'storm') storm(w, host);
  else if (key === 'wave') wave(w, host);
  else if (key === 'maelstrom') maelstrom(w, host);
  else if (key === 'fog') fog(w, host);
  else if (key === 'calm') calm(w, host);
  else if (key === 'wind') wind(w, host);
  else if (key === 'clear') clear(w, host);
  else if (key === 'moon') moon(w, host);
  else if (key === 'reefs') reefs(w, host);
  else if (key === 'fleet') fleet(w, host);
}
