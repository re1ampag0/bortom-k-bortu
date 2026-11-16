// The story icons of the boards (parts/icons.ts draws the rest): one for each ship ability, in the log beside its name,
// and one for each Legend, under the Legend card once it is played. Same engraved manner and the same kit (icons-kit.ts):
// contour + hatching clipped to the shape, light from the upper left, a 100×100 local box, no filters, no text.
import { K, at, circ, rect, rrect, poly, outside, waveLine, star, f, pp, drop, type Pt } from './icons-kit';

export type StoryName =
  | 'madPlan' | 'swiftWind' | 'greekFire' | 'tritonSword' | 'treasury' | 'heartChest' | 'soulService' | 'dive'
  | 'legendJack' | 'legendBottle' | 'legendArmada' | 'legendKraken';

export const STORY_NAMES: StoryName[] = [
  'madPlan', 'swiftWind', 'greekFire', 'tritonSword', 'treasury', 'heartChest', 'soulService', 'dive',
  'legendJack', 'legendBottle', 'legendArmada', 'legendKraken',
];

export const STORY_TITLES: Record<StoryName, string> = {
  madPlan: 'Безумный план', swiftWind: 'Быстрее ветра', greekFire: 'Греческий огонь', tritonSword: 'Меч Тритона',
  treasury: 'Казна Компании', heartChest: 'Сердце Дейви Джонса', soulService: 'Вечная служба', dive: 'Погружение',
  legendJack: 'Легенда: Джек ускользает', legendBottle: 'Легенда: Корабль в бутылке', legendArmada: 'Легенда: Армада Компании',
  legendKraken: 'Легенда: Кракен',
};

// ---------------------------------------------------------------- local helpers

const g = (tr: string, body: string) => `<g transform="${tr}">${body}</g>`;
/** shrink a drawing about the centre of the box, to keep the margin */
const fit = (s: number, body: string) => g(`translate(${f(50 - 50 * s)} ${f(50 - 50 * s)}) scale(${s})`, body);
/** a coin seen from above-front: face ellipse + a rim edge below */
function coin(k: K, cx: number, cy: number, rx: number, ry: number, th: number): string {
  const edge = `M${f(cx - rx)} ${f(cy)}L${f(cx - rx)} ${f(cy + th)}C${f(cx - rx)} ${f(cy + th + ry * 1.3)} ${f(cx + rx)} ${f(cy + th + ry * 1.3)} ${f(cx + rx)} ${f(cy + th)}L${f(cx + rx)} ${f(cy)}Z`;
  return k.shape(edge, { fill: 'mid', sw: 1.2, h: k.small ? [] : [{ a: 90, g: 1.3, w: 0.7, r: rect(cx, 0, rx + 2, 200) }] }) +
    k.shape(circ(cx, cy, rx, ry), { fill: 'light', sw: 1.2, inner: k.small ? '' : k.S(circ(cx, cy, rx * 0.72, ry * 0.72), 0.7) + k.F(circ(cx - rx * 0.3, cy - ry * 0.2, rx * 0.22, ry * 0.25), 'paper') });
}

// ---------------------------------------------------------------- the abilities

function madPlan(k: K): string {
  // a chart half unrolled: a fat roll on the right, a tight curl on the left, the coast and the route on the sheet,
  // a wax seal with ribbons on the lower edge
  const sheet = rect(16, 24, 54, 50);
  const lRoll = 'M10 24L10 74C10 76.2 18 76.2 18 74L18 24Z', rRoll = 'M68 21L68 77C68 81.4 84 81.4 84 77L84 21Z';
  const all = 'M10 24L68 21L84 21L84 79L68 80L10 75Z';
  let o = g('translate(3 3)', k.shade(all, 45, 1.8));
  const land = 'M16 24L46 24C44 27 41 29 37 30C30 32 29 39 24 41C21 42 18 43 16 46Z';
  const isle = 'M52 58C53 54 58 53 61 55C64 57 62 62 58 62C55 63 51 61 52 58Z';
  o += k.shape(sheet, {
    fill: 'light',
    mid: k.small ? land : '',
    h: [{ a: 0, g: 3.4, w: 0.7, r: rect(54, 20, 20, 60) }, ...(k.small ? [] : [{ a: 45, g: 1.6, w: 0.8, r: land }, { a: 45, g: 1.4, w: 0.7, r: isle }])],
    inner: (k.small ? '' :
      k.S('M16 46C18 43 21 42 24 41C29 39 30 32 37 30C41 29 44 27 46 24', 1.3) + k.S(isle, 1.1) +
      k.S('M18 49C21 47 25 46 28 44C32 41 33 35 39 33', 0.7) +
      k.S('M40 52L68 38M40 52L66 66M40 52L20 70M40 52L56 74', 0.6) + k.F(star(40, 52, 4, 1.2, 4.6, -90), 'ink')) +
      k.S('M26 64C34 62 40 56 46 58C50 59 52 61 55 58', k.small ? 1.6 : 1.3, 'ink', `stroke-dasharray="${k.small ? '3.4 2.6' : '2.4 1.8'}"`) +
      k.S('M54.5 56.5L59 61M59 56.5L54.5 61', k.small ? 2.2 : 1.6),
  });
  // the fat roll: a cylinder with a spiral end, lit on the left
  o += k.shape(rRoll, {
    fill: 'light', mid: rect(74, 0, 20, 100),
    h: [{ a: 90, g: 1.8, r: rect(75, 0, 20, 100) }, { a: 30, g: 2.2, r: rect(80, 0, 20, 100) }],
    hi: rect(70.4, 22, 2.2, 56),
  });
  o += k.shape(circ(76, 21, 8, 3), { fill: 'light', sw: 1.8, inner: k.S('M70 21.3C70 18.8 82 18.8 82 21.3C82 23.2 72 23.4 72.4 21.2C72.6 19.6 80 19.6 79.8 21.3C79.6 22.4 74.6 22.4 75 21.2', 1) });
  // the tight curl
  o += k.shape(lRoll, { fill: 'mid', h: [{ a: 90, g: 1.6, r: rect(14.5, 0, 6, 100) }], hi: rect(11.2, 25, 1.4, 49) });
  o += k.shape(circ(14, 24, 4, 1.6), { fill: 'light', sw: 1.4, inner: k.F(circ(14.6, 24.2, 1.6, 0.7), 'ink') });
  // the seal with two ribbon tails
  const sx = 34, sy = 73;
  o += k.shape(`M${sx - 3} ${sy + 3}L${sx - 9} ${sy + 18}L${sx - 5} ${sy + 16}L${sx - 3.4} ${sy + 20}L${sx + 1} ${sy + 4}Z`, { fill: 'mid', sw: 1.5, h: [{ a: 70, g: 1.7 }] });
  o += k.shape(`M${sx + 3} ${sy + 3}L${sx + 9} ${sy + 18}L${sx + 5} ${sy + 16}L${sx + 3.4} ${sy + 20}L${sx - 1} ${sy + 4}Z`, { fill: 'mid', sw: 1.5, h: [{ a: -70, g: 1.5 }, { a: 20, g: 2 }] });
  const sp: number[] = [];
  for (let i = 0; i < 30; i++) sp.push(...at(sx, sy, i % 2 ? 8 : 9, i * 12));
  o += k.shape(poly(...sp), {
    fill: 'mid', sw: 2,
    h: [{ a: 45, g: 1.8 }, { a: -45, g: 2.1, r: outside(circ(sx - 2.4, sy - 2.4, 7.4)) }],
    inner: k.S(circ(sx, sy, 5.4), 1.1, 'light') + k.F(star(sx, sy, 5, 1.4, 3.6, -90), 'light'),
  });
  return g('rotate(-8 50 52)', o);
}

function swiftWind(k: K): string {
  // one course full of wind, seen three-quarters: the belly bowed to the right, seams following it, the pennant streaming,
  // wind lines with curls blowing in from the left
  let o = k.shape(rect(42, 8, 4, 88), { fill: 'mid', sw: 2, h: [{ a: 90, g: 1.5, r: rect(44.4, 0, 4, 100) }] });
  o += k.shape('M46 7.6C56 4.6 66 9 78 5.6L72.6 9.8L79.6 13C66 14.6 56 10.4 46 12.4Z', {
    fill: 'light', sw: 1.6, h: [{ a: 0, g: 1.8, r: 'M46 10.6C56 9 66 12.4 80 10L80 20L46 20Z' }],
  });
  o += k.shape(circ(44, 7.4, 2.6), { fill: 'light', sw: 1.6 });
  const head: Pt[] = [[29, 21], [79, 15.6]];
  const footQ: Pt[] = [[34, 84], [62, 74], [84, 80]];
  const sail = `M${pp(head[0])}L${pp(head[1])}C96 30 98 58 ${pp(footQ[2])}Q${pp(footQ[1])} ${pp(footQ[0])}C30 64 26 40 ${pp(head[0])}Z`;
  const qa = (p: Pt[], t: number): Pt => {
    const m = 1 - t;
    return [m * m * p[0][0] + 2 * m * t * p[1][0] + t * t * p[2][0], m * m * p[0][1] + 2 * m * t * p[1][1] + t * t * p[2][1]];
  };
  let seams = '';
  for (const u of [0.2, 0.4, 0.6, 0.8]) {
    const T: Pt = [head[0][0] + (head[1][0] - head[0][0]) * u, head[0][1] + (head[1][1] - head[0][1]) * u], B = qa(footQ, u);
    seams += `M${pp(T)}Q${f((T[0] + B[0]) / 2 + 6 + 14 * u * u)} ${f((T[1] + B[1]) / 2)} ${pp(B)}`;
  }
  const shadeR = 'M64 0Q84 50 66 100L110 100L110 0Z', deepR = 'M80 0Q98 50 80 100L110 100L110 0Z';
  const reef = k.small ? '' : k.S('M30.4 31Q56 27 87.6 25.4', 0.9) +
    k.S('M36 30.4L35.6 34M44 29.4L43.8 33M52 28.6L52 32.2M60 27.8L60.2 31.4M68 27L68.6 30.6M76 26.4L76.8 30', 0.8);
  o += k.shape(sail, {
    fill: 'light', mid: shadeR,
    h: [{ a: 75, g: 2.4, r: shadeR }, { a: -15, g: 2.4, r: deepR }, { a: 0, g: 2.6, w: 0.8, r: 'M20 74Q60 66 100 72L100 100L20 100Z' }],
    inner: (k.small ? k.S(seams, 1.3) : k.S(seams, 1.1)) + reef + k.S('M32.6 25C30 40 31 58 35.6 78', k.small ? 2.4 : 2, 'light'),
  });
  o += k.shape('M26 18.2L82 12L82.6 15.8L26.6 22Z', { fill: 'mid', sw: 2, h: [{ a: 0, g: 1.3, w: 0.8, r: rect(0, 17, 100, 8) }] });
  o += k.S('M34 84L30 97M84 80L95 95', 1.3);
  // wind lines with curls
  const wind = (x1: number, y: number, len: number, w: number) =>
    k.S(`M${x1} ${y}Q${f(x1 - len * 0.5)} ${f(y - 2.6)} ${f(x1 - len)} ${f(y)}C${f(x1 - len - 4)} ${f(y + 1.6)} ${f(x1 - len - 3.4)} ${f(y + 6.4)} ${f(x1 - len + 0.4)} ${f(y + 6)}` +
      `C${f(x1 - len + 3.2)} ${f(y + 5.6)} ${f(x1 - len + 2.6)} ${f(y + 2.6)} ${f(x1 - len + 0.6)} ${f(y + 3)}`, w);
  o += wind(25, 36, 17, 2.2) + wind(23, 54, 15, 2.2) + wind(27, 70, 19, 2.2);
  if (!k.small) o += k.S('M24 44Q19 42.6 13 43.6M20 62Q16 61 11.4 61.8M26 78Q20 76.6 14 77.6', 1);
  return o;
}

function greekFire(k: K): string {
  // a clay fire-pot: round belly, narrow neck, two little ears, an incised band; fire roaring out of the mouth
  const pot = 'M39 41L53 41C53 45 52 46 54 49C66 52 72 60 71 68C70 78 60 86 54 89L56 94L36 94L38 89C32 86 22 78 21 68C20 60 26 52 38 49C40 46 39 45 39 41Z';
  let o = g('translate(5 0)', k.shade(circ(52, 94, 22, 3.6), 0, 1.6));
  o += k.S('M39.5 44C31 43 27 49 30.5 54.5M52.5 44C61 43 65 49 61.5 54.5', 3.6) + (k.small ? '' : k.S('M39.5 44C31 43 27 49 30.5 54.5M52.5 44C61 43 65 49 61.5 54.5', 1.2, 'mid'));
  let band = '';
  for (let i = 0; i < 14; i++) {
    const x0 = 22 + i * 3.6;
    band += `M${f(x0)} ${f(66.6 + Math.abs(x0 - 46) * -0.02)}L${f(x0 + 1.8)} ${f(61.4)}L${f(x0 + 3.6)} ${f(66.6)}`;
  }
  o += k.shape(pot, {
    fill: 'mid',
    h: [{ a: 45, g: 2.2, r: outside(circ(37, 60, 22)) }, { a: -45, g: 2.4, r: outside(circ(34, 58, 30)) }],
    hi: 'M27 60C29 54 34 51 39 50.4C35 53 32 57 31 62C30 66 30.4 70 32 74C28 71 26 65 27 60Z',
    inner: k.S('M21 59C30 62.6 62 62.6 71 59M21 69C30 72.6 62 72.6 71 69', k.small ? 1.6 : 1.2) + (k.small ? '' : k.S(band, 0.9) + k.S('M38 89L54 89', 1.2)) +
      k.S('M40 42.6L40.4 47', 1.6, 'light'),
  });
  o += k.shape(rrect(35, 36, 22, 5.4, 2.2), { fill: 'mid', sw: 2, h: [{ a: 90, g: 1.6, r: rect(50, 30, 10, 12) }], hi: rect(37, 37.2, 9, 1.2) });
  o += k.F(circ(46, 37.2, 8.4, 1.8), 'ink');
  // the fire
  const flame = 'M37 37.6C31 31 32 23 37 17C37.4 22.6 40.6 24.6 42.4 22C40 14 43.6 8 50 3C49 10 53.6 13.6 55 19.6C56.4 15.6 59.4 13.4 64 11.6C60.4 17.6 65 25 61.6 31.6C60.2 34.6 58 36.6 55.6 37.8Z';
  o += k.shape(flame, {
    fill: 'mid',
    h: [{ a: 76, g: 2.3 }, { a: -20, g: 2.4, r: 'M56 0L100 0L100 40L58 40C64 30 62 20 56 0Z' }],
    inner: k.small ? '' : k.S('M39 34C35.4 28 37 23 38 20M46 34C44 26 46 16 49 9M57 33C61 27 60 22 61 17', 1),
  });
  o += k.shape('M40 37.8C37.4 33 39.4 29 42 26C42.6 29.6 44.6 30.6 46 29C45 24 47 19.6 50.4 15.6C50.4 21 54 23 54 27.6C55.4 25.6 57 24.6 58.6 24C57.4 28 58.6 32 56.6 35.2C55.6 36.8 54.4 37.6 53 38Z', {
    fill: 'light', sw: 1.4, inner: k.small ? '' : k.S('M45 36C43.6 33 44.4 30.6 45.4 29.4M52 36C53.4 33 53 30.6 53.8 29', 0.8),
  });
  for (const [x, y, r] of [[28, 16, 1.4], [68, 22, 1.2], [66, 6, 1], [32, 6, 0.9]]) o += k.F(star(x, y, 4, r * 0.5, r * 2, 0), 'ink');
  return fit(0.96, o);
}

function tritonSword(k: K): string {
  // a cutlass of the sea: a scallop shell for the guard, a branch of coral for the knuckle-bow, a pearl for the pommel;
  // a wave curls up round the blade and throws spray
  let o = k.shape('M40 98L98 98L98 56C97 46 89 40 80 41C71 42 66 50 69 56C71 60 77 61 79 57C80 54.6 78 52.6 75.6 53.6C77 48.6 85 47.6 89 52C94 58 91 69 81 74C70 79 58 80 50 87C46 91 43 94 40 98Z', {
    fill: 'mid', sw: 2.2,
    h: [{ a: 0, g: 2.4 }, { a: -30, g: 2.6, r: 'M58 100L100 66L100 100Z' }],
    inner: k.S('M52 92C60 84 72 82 82 78C90 74 95 66 94 58', 1.3, 'light') + (k.small ? '' : k.S('M62 95C68 89 79 87 88 83M70 47C76 44 84 44 88 48', 1, 'light')),
  });
  o += k.shape('M76 53.6C77.4 50 83 49.4 85.6 52.6C84 51.6 81 51.6 79.6 53.6Z', { fill: 'light', sw: 1 });
  for (const [x, y, r, a] of [[66, 36, 1.6, 60], [60, 44, 1.3, 40], [90, 34, 1.4, 100], [80, 30, 1.2, 80], [28, 22, 1.4, 120], [20, 30, 1.1, 140]])
    o += drop(k, x, y, r, a);
  // the sword in its own frame: hilt at the origin, blade along +x
  let s = '';
  const blade = 'M2 -4.6Q44 -6.6 83 -15.6Q77 0.4 57 6Q30 9.2 2 6.2Z';
  s += k.shape(blade, {
    fill: 'light',
    mid: 'M0 1.6Q44 0.2 82 -12L90 20L0 20Z',
    h: [{ a: 0, g: 1.7, w: 0.8, r: 'M0 3Q44 2 82 -10L90 20L0 20Z' }],
    inner: k.S('M6 -1.6Q44 -3.2 74 -11.4', 1.1) + k.S('M5 -3.2Q40 -4.6 70 -11.6', 1.6, 'paper') +
      (k.small ? '' : k.S('M12 3Q15 1.2 18 2.8Q21 1 24 2.6Q27 0.8 30 2.4Q33 0.6 36 2Q39 0.2 42 1.6', 0.8)),
  });
  // grip, ferrule, pearl pommel
  s += k.shape(rrect(-26, -3.6, 21, 7.2, 2.4), {
    fill: 'mid', sw: 2,
    h: [{ a: 60, g: 1.6, w: 0.9 }, ...(k.small ? [] : [{ a: -60, g: 2.4, w: 0.6 }]), { a: 0, g: 1.2, r: rect(-30, 1.4, 30, 4) }],
  });
  s += k.shape(circ(-30, 0, 5.4), { fill: 'light', sw: 2, h: [{ a: 45, g: 1.4, r: outside(circ(-31.6, -1.6, 5.4)) }], hi: circ(-31.6, -1.8, 1.8) });
  // the coral knuckle-bow from the shell to the pommel, on the edge side
  const bow = 'M-6 14C-13 16 -22 13 -27 5';
  s += k.S(bow, 3.6) + (k.small ? '' : k.S(bow, 1.4, 'mid') +
    k.S('M-11 15.4L-12 19.6M-18 14.6L-17 18.6M-23 11.4L-26.4 13.8M-14 15.6L-16.6 17.8', 1.6) + k.F(circ(-12, 19.8, 1.1) + circ(-17, 18.8, 1.1) + circ(-26.6, 14, 1) + circ(-16.8, 18, 0.9), 'ink'));
  // the scallop shell guard: hinge toward the blade, the fan cupping the hand
  const hx = 4, R = 16.5, n = 7, a0 = 110, a1 = 250;
  const ep = (a: number) => at(hx, 0, R, a);
  let fan = `M${f(hx)} -3.4L${pp(ep(a0))}`, ribs = '';
  for (let i = 0; i < n; i++) {
    const am = a0 + ((i + 0.5) * (a1 - a0)) / n, ae = a0 + ((i + 1) * (a1 - a0)) / n;
    fan += `Q${pp(at(hx, 0, R + 4, am))} ${pp(ep(ae))}`;
    if (i < n - 1) ribs += `M${pp(at(hx, 0, 4.6, ae))}L${pp(at(hx, 0, R - 0.4, ae))}`;
  }
  fan += `L${f(hx)} 3.4Z`;
  s += k.shape(fan, {
    fill: 'mid', sw: 2.2,
    h: [{ a: 45, g: 1.9, r: rect(-20, 1, 30, 24) }, ...(k.small ? [] : [{ a: -45, g: 2.4, w: 0.8, r: rect(-20, 6, 30, 24) }])],
    hi: 'M-6 -13.4Q-9.6 -9.4 -10.6 -4L-8 -4Q-7.4 -8.8 -4.2 -12.2Z',
    inner: k.S(ribs, k.small ? 1.4 : 1.1) + (k.small ? '' : k.S(circ(hx, 0, R * 0.62), 0.7)),
  });
  s += k.shape(rect(2, -4.8, 5, 9.6), { fill: 'mid', sw: 1.6, h: [{ a: 90, g: 1.4, r: rect(4.4, -6, 4, 12) }] });
  o += g('translate(30 71) rotate(-45) scale(0.92)', s);
  return fit(0.95, o);
}

function treasury(k: K): string {
  // the Company's money: a full sack tied at the neck and open at the mouth, coins spilling to a heap, a stack beside
  let o = g('translate(4 1)', k.shade('M12 94C30 98 70 98 96 94L96 99L12 99Z', 0, 1.5));
  // the stack behind on the right
  for (let i = 0; i < 7; i++) o += coin(k, 80, 89 - i * 4.4, 11, 3.6, 3.4);
  // the sack
  const body = 'M30 34C14 44 7 62 11 79C14 90 26 95 40 95C56 95 66 90 68 79C71 63 62 44 46 34Z';
  o += k.shape(body, {
    fill: 'mid',
    h: [{ a: 45, g: 2.2, r: outside(circ(32, 60, 26)) }, { a: -45, g: 2.6, r: outside(circ(30, 58, 33)) }, { a: 0, g: 2.8, w: 0.8, r: rect(0, 86, 100, 14) }],
    hi: 'M17 66C18 54 24 45 31 40C27 48 24 56 23 66C22 72 23 78 25 82C19 79 16 72 17 66Z',
    inner: k.S('M33 37C28 48 26 60 28 74M43 37C46 48 48 58 46 70M38 38L37 52M50 40C56 48 60 56 60 66', k.small ? 1.4 : 1.1) +
      (k.small ? '' : k.S(circ(40, 72, 9.5, 9), 1.4) + k.S('M40 64L40 80M34 70L46 70M40 64L44 66.6M36 77L40 80L44 77', 1.3)),
  });
  // the tie and the open mouth
  o += k.shape('M30 30C24 23 21 17 24 12C29 14 33 13 38 11C44 13 50 13 55 11C56 18 52 25 47 30Z', {
    fill: 'mid', sw: 2, h: [{ a: 60, g: 2.2, r: rect(42, 0, 20, 40) }], hi: 'M26 15C27 20 29 24 31.6 27L33 27C31 23 29.4 19 29 15Z',
  });
  o += k.F('M26 13.6C32 16.6 46 16.4 53 12.6C49 10.6 44 9.6 39 9.6C33 9.6 29 11 26 13.6Z', 'ink');
  o += coin(k, 34, 11.6, 4.6, 1.8, 1.2) + coin(k, 44, 10.8, 4.6, 1.8, 1.2);
  o += k.shape(rrect(27, 29, 22, 6, 2.6), { fill: 'mid', sw: 2, h: [{ a: 0, g: 1.4, w: 0.8, r: rect(0, 32, 100, 4) }], inner: k.S('M33 29.6L35 34.6M40 29.6L42 34.6', 1) });
  o += k.S('M47 33C51 37 52 42 51 46M47 33C52 35 56 38 57 42', 1.6) + k.F(circ(51, 47, 1.6) + circ(57.2, 43, 1.6), 'ink');
  // the spilled coins in front
  o += coin(k, 30, 92, 7, 2.4, 1.6) + coin(k, 46, 93, 7, 2.4, 1.6) + coin(k, 62, 92, 7, 2.4, 1.6) + coin(k, 54, 87, 7, 2.4, 1.6);
  o += k.shape(circ(20, 88, 3.4, 6.6), { fill: 'light', sw: 1.4, inner: k.S(circ(20, 88, 2.2, 4.4), 0.8), h: [{ a: 0, g: 1.5, r: rect(20.4, 70, 6, 30) }] });
  return fit(0.94, o);
}

function heartChest(k: K): string {
  // a small casket bound in iron: a camel-back lid, straps and corner plates with rivets, a heavy padlock on the hasp
  let o = g('translate(4 3)', k.shade('M10 90L10 38C10 20 84 20 84 38L84 90Z', 45, 1.6));
  const body = rect(10, 50, 74, 40), lid = 'M10 50L10 38C10 20 84 20 84 38L84 50Z';
  const planks = k.S('M10 60L84 60M10 70L84 70M10 80L84 80', 1) + (k.small ? '' : k.S('M10 40L84 40M12 32L82 32', 0.8));
  o += k.shape(lid, {
    fill: 'mid', mid: '', hi: 'M14 38C14 30 22 26 34 25C24 28 19 32 18 40Z',
    h: [{ a: 0, g: 2.6, w: 0.8, r: outside(circ(26, 30, 20, 9)) }, { a: 45, g: 2.2, r: rect(56, 20, 40, 40) }],
    inner: k.small ? '' : k.S('M10 40L84 40M12 32L82 32', 0.8),
  });
  o += k.shape(body, {
    fill: 'mid',
    h: [{ a: 0, g: 2.6, w: 0.8, r: rect(0, 0, 60, 100) }, { a: 45, g: 2, r: rect(56, 40, 40, 60) }, { a: -45, g: 2.6, r: rect(10, 82, 80, 10) }],
    inner: planks,
  });
  // iron: the lid rim, straps, corner plates, rivets
  const iron = (d: string) => k.shape(d, { fill: 'ink', sw: 1.4, hi: '' });
  o += iron(rect(8, 47.6, 78, 5.4));
  for (const x of [20, 66]) {
    o += iron(`M${x} 50L${x} 25.4C${x + 3} 24.6 ${x + 5} 24.4 ${x + 8} 24.4L${x + 8} 50Z`) + iron(rect(x, 53, 8, 37));
  }
  o += iron('M8 80L18 80L18 92L8 92Z') + iron('M86 80L76 80L76 92L86 92Z');
  let rv = '';
  for (const x of [24, 70]) for (const y of [30, 38, 44, 58, 66, 74, 84]) rv += circ(x, y, 1.1);
  rv += circ(13, 50.2, 1) + circ(81, 50.2, 1) + circ(12, 86, 1) + circ(82, 86, 1);
  o += k.F(rv, 'light');
  if (!k.small) o += k.S('M21 26L21 49M67 25.6L67 49M21 54L21 89M67 54L67 89', 0.7, 'mid');
  // the hasp and the padlock
  o += k.shape(rrect(43, 40, 8, 16, 1.6), { fill: 'ink', sw: 1.4, inner: k.F(circ(47, 43, 1) + circ(47, 53, 1), 'light') });
  o += k.S('M40.6 64C40.6 50 53.4 50 53.4 64', 5.4) + k.S('M40.6 64C40.6 50 53.4 50 53.4 64', 2.2, 'mid');
  o += k.shape('M36 62L58 62L58 74C58 82 52 87 47 87C42 87 36 82 36 74Z', {
    fill: 'mid', sw: 2.2,
    h: [{ a: 45, g: 1.6, r: outside(circ(42, 67, 11)) }, ...(k.small ? [] : [{ a: -45, g: 2.2, r: outside(circ(40, 66, 15)) }])],
    hi: 'M38.6 64.6L44 64.6L44 66L38.6 66ZM38.6 68L40 68L40 77L38.6 75Z',
    inner: k.S('M36 65.6L58 65.6', 1.1),
  });
  o += k.F('M47 70C49.4 70 50 72.6 48.4 73.8L49.6 79.4L44.4 79.4L45.6 73.8C44 72.6 44.6 70 47 70Z', 'ink');
  return g('translate(3 0)', o);
}

function soulService(k: K): string {
  // a tall narrow phial hung on a chain: a stoppered teardrop of glass, a pale wisp burning inside, a glass bead at the tip
  const glass = 'M45.4 36C45.4 44 33 50 33 64C33 77 43 85 50 92C57 85 67 77 67 64C67 50 54.6 44 54.6 36Z';
  const glow = star(50, 66, 14, 10.4, 16, -90);
  let o = '';
  // chain: a ring at the top and alternating links
  o += k.S(circ(50, 6.4, 3.4), 2.4);
  if (k.small) o += k.S('M50 9.8L50 24', 2.2);
  else {
    o += k.S(circ(50, 13, 1.9, 3.2), 1.6) + k.S('M50 15.6L50 21.6', 3.2) + k.S('M50 15.6L50 21.6', 1, 'light');
    o += k.S(circ(50, 24, 1.9, 3.2), 1.6);
  }
  o += k.shape(rrect(43, 26, 14, 6, 1.6), { fill: 'mid', sw: 2, h: [{ a: 90, g: 1.5, r: rect(52, 20, 10, 20) }], hi: rect(45, 27, 1.4, 4) });
  o += k.shape(glass, {
    fill: 'mid',
    h: [{ a: 45, g: 2.2, r: outside(glow) }, ...(k.small ? [] : [{ a: -45, g: 2.6, r: outside(glow) }])],
    hi: glow,
    inner: k.S('M39 58C40 51 43 47 46.6 44', k.small ? 3 : 2.6, 'light') + k.S('M47.6 33L47.6 40', 1.8, 'light') + k.F(circ(38.6, 64, 1.4), 'light') +
      (k.small ? '' : k.S('M61 66C60 75 55 81 51 86', 1, 'light')),
  });
  o += k.shape(rrect(44.6, 31, 10.8, 4.2, 1.2), { fill: 'light', sw: 1.8, h: [{ a: 90, g: 1.4, r: rect(52, 26, 10, 10) }] });
  // the wisp: a pale flame-like soul
  o += k.shape('M50 80C44 79 42 73 45 69C48 65.6 47.4 62 45 60C49.6 59.4 53.6 62 53.4 66C53.2 69.4 50.6 71 51.4 74C52 76 54.4 76.4 55.6 74.4C55.8 78 53.4 80.4 50 80Z', {
    fill: 'light', sw: 1.5, inner: k.small ? '' : k.S('M48.4 77.4C45.6 75.6 45.6 72 47.4 70.4', 0.9),
  });
  o += k.F(circ(52, 55.6, 0.9) + circ(47.4, 54.4, 0.7), 'ink');
  o += k.shape(circ(50, 93.6, 2.2), { fill: 'light', sw: 1.4 });
  for (const [x, y, r] of [[30, 44, 1.2], [70, 50, 1.3], [72, 80, 1], [28, 82, 1]]) o += k.F(star(x, y, 4, r * 0.5, r * 2, 0), 'ink');
  return fit(0.95, o);
}

function dive(k: K): string {
  // a great wave curling over: only the mast tops and a pennant still show under its lip
  const wave = 'M2 74L46 74C54 69 62 64 67 57C75 44 72 29 61 26C49 23 37 30 34.4 40C34 37.6 37 37.4 37.6 39.6C38.4 42.6 35 44.6 32 43C28 41 27 35 30 29C37 17 50 9 67 9C84 9 95 30 98 62L98 74Z';
  const crest = 'M46 74C54 69 62 64 67 57C75 44 72 29 61 26C49 23 37 30 34.4 40C34 37.6 37 37.4 37.6 39.6C38.4 42.6 35 44.6 32 43C28 41 27 35 30 29C37 17 50 9 67 9C84 9 95 30 98 62';
  const hollow = 'M34.4 40C37 30 49 23 61 26C72 29 75 44 67 57C62 64 54 69 46 74L26 74C28 62 31 48 34.4 40Z';
  let o = k.shape(wave, {
    fill: 'mid', sw: 0,
    h: [{ a: -32, g: 2.4, r: 'M74 36C86 46 92 60 90 76L100 76L100 30Z' }, { a: 20, g: 2.8, w: 0.8, r: 'M76 22C84 32 90 46 90 62L100 62L100 10Z' }],
    hi: k.small ? '' : 'M40 26C48 18 58 14 68 14.4C60 16 52 19 46 24Z',
    inner: k.S('M94 56C92 34 82 18 67 17C55 16.4 45 22 39 29', k.small ? 2 : 1.6, 'light') +
      (k.small ? '' : k.S('M90 66C88 46 80 30 68 25.4M84 74C84 58 82 46 74 36', 1, 'light')),
  });
  o += k.shape(hollow, { fill: 'light', sw: 0, h: [{ a: 0, g: 2.1, w: 0.8, r: 'M52 20C66 26 72 40 66 60L72 74L74 20Z' }, { a: 0, g: 3.4, w: 0.7 }] });
  o += k.S(crest, k.cw);
  // the mast tops: main and fore, a top, yards, the pennant streaming
  o += k.shape(rect(44.6, 57, 3.2, 17), { fill: 'ink', sw: 1.2 });
  o += k.shape(rect(45.2, 49, 2, 9), { fill: 'ink', sw: 1 });
  o += k.shape('M38 60L54.4 60L52.6 63.6L39.8 63.6Z', { fill: 'mid', sw: 1.6, h: [{ a: 0, g: 1.2, r: rect(0, 61.8, 100, 3) }] });
  o += k.S('M36 68L57 68', 2.4);
  o += k.shape('M46.6 49.6C40 47.6 34 51 26 48.6L29.4 52L25 55C33 54.6 40 53 46.6 54Z', { fill: 'light', sw: 1.5, h: [{ a: 0, g: 1.4, r: rect(0, 52.6, 50, 4) }] });
  o += k.shape(circ(46.2, 48.6, 1.8), { fill: 'light', sw: 1.1 });
  o += k.shape(rect(59.4, 62, 2.6, 13), { fill: 'ink', sw: 1.2 });
  o += k.S('M55 67L66 67', 2);
  // the sea in front, closing; a vignette with no frame below
  const top = waveLine(72, 4.4, 11.8, 3.5, 97, 0);
  o += k.shape(top + 'L97.9 97L3.5 97Z', {
    fill: 'mid', sw: 0,
    h: [{ a: 0, g: 2.4 }, { a: -25, g: 2.6, r: rect(0, 86, 100, 20) }],
    inner: k.S(waveLine(80, 3, 10, 2, 98, 5), 1.3, 'light') + (k.small ? '' : k.S(waveLine(89, 2.4, 13, 2, 98, 0), 1, 'light')),
  });
  o += k.S(top, k.cw);
  // foam fingers hanging from the lip and spray
  o += k.shape('M30 29C27 35 28 41 32 43C30.6 46 28.6 47 26.6 46.4C28 44.6 27.6 42.6 26 42C25 44 23 44.6 21.6 43.6C23.4 41.4 23.6 38.6 22.6 37C25 34 27 31 30 29Z', { fill: 'light', sw: 1.5 });
  for (const [x, y, r, a] of [[18, 30, 1.6, 60], [14, 40, 1.3, 70], [23, 21, 1.4, 50], [10, 50, 1.1, 80], [32, 14, 1.2, 40]]) o += drop(k, x, y, r, a);
  return fit(0.96, o);
}

// ---------------------------------------------------------------- the Legends (printed 22–26 mm: full engraving)

/**
 * A three-masted ship broadside, bow to the left, the waterline at (x, y), s = scale (1 → about 86 wide, 60 tall).
 * Line widths and hatch gaps are given in printed units and divided by s, so a distant ship keeps a visible contour.
 * fine = gunports, shrouds, flags and hatching (off for the far ships).
 */
function ship(k: K, x: number, y: number, s: number, fine: boolean): string {
  const u = (n: number) => n / s;
  let o = '';
  // bowsprit, jib, stays
  o += k.S('M-28 -10L-47 -20', u(1.6));
  o += k.shape('M-44.6 -18.6L-17 -46L-25.6 -14.4Z', { fill: 'light', sw: u(1.2), h: fine ? [{ a: 70, g: u(1.6), w: u(0.6), r: 'M-30 -30L-17 -46L-24 -14Z' }] : [] });
  if (fine) o += k.S('M-47 -20L-16 -50M1 -58L17 -44M-15 -50L1 -58', u(0.6));
  // masts
  for (const [mx, top] of [[-15, -50], [1, -59], [17, -45]]) o += k.shape(rect(mx - 0.9, top, 1.8, -top - 8), { fill: 'mid', sw: u(0.9) });
  // sails: [mast x, yard y, foot y, half width]
  const sails: [number, number, number, number][] = [
    [17, -41, -32.4, 6], [17, -30, -17, 7.4],
    [1, -55, -42, 8.6], [1, -40, -17, 12.6],
    [-15, -47, -35.6, 7.6], [-15, -33.6, -15, 10.6],
  ];
  for (const [mx, yt, yb, hw] of sails) {
    const b = hw * 0.16, arch = (yb - yt) * 0.12;
    const d = `M${f(mx - hw)} ${f(yt)}L${f(mx + hw)} ${f(yt)}C${f(mx + hw + b)} ${f(yt + (yb - yt) * 0.4)} ${f(mx + hw + b)} ${f(yt + (yb - yt) * 0.7)} ${f(mx + hw)} ${f(yb)}` +
      `Q${f(mx)} ${f(yb - arch * 2)} ${f(mx - hw)} ${f(yb)}C${f(mx - hw - b)} ${f(yt + (yb - yt) * 0.7)} ${f(mx - hw - b)} ${f(yt + (yb - yt) * 0.4)} ${f(mx - hw)} ${f(yt)}Z`;
    const shadeR = `M${f(mx + hw * 0.35)} ${f(yt - 2)}Q${f(mx + hw * 0.6)} ${f((yt + yb) / 2)} ${f(mx + hw * 0.35)} ${f(yb + 2)}L${f(mx + hw + 4)} ${f(yb + 2)}L${f(mx + hw + 4)} ${f(yt - 2)}Z`;
    o += k.shape(d, {
      fill: 'light', mid: fine ? '' : shadeR, sw: u(fine ? 1.2 : 1),
      h: fine ? [{ a: 80, g: u(1.4), w: u(0.6), r: shadeR }] : [],
      inner: fine ? k.S(`M${f(mx - hw * 0.35)} ${f(yt)}Q${f(mx - hw * 0.3)} ${f((yt + yb) / 2)} ${f(mx - hw * 0.35)} ${f(yb - arch)}M${f(mx + hw * 0.3)} ${f(yt)}Q${f(mx + hw * 0.36)} ${f((yt + yb) / 2)} ${f(mx + hw * 0.3)} ${f(yb - arch)}`, u(0.5)) : '',
    });
    o += k.S(`M${f(mx - hw - 1)} ${f(yt)}L${f(mx + hw + 1)} ${f(yt)}`, u(fine ? 1.3 : 1.1));
  }
  // flags: pennants from the trucks, the ensign at the stern
  if (fine) {
    for (const [mx, top] of [[-15, -50], [1, -59], [17, -45]]) o += k.shape(`M${mx} ${top}L${mx + 9} ${top + 1}L${mx} ${top + 2.2}Z`, { fill: 'mid', sw: u(0.6) });
    o += k.S('M31 -15L35 -24', u(0.8)) + k.shape('M35 -24L42 -23L41 -19.6L36.4 -20.4Z', { fill: 'mid', sw: u(0.7), h: [{ a: 0, g: u(1.1), w: u(0.5) }] });
  }
  // the hull: a raised bow and a high stern, a light wale, a row of ports
  const hull = 'M-31 -10Q-27 -3 -21 0L22 0Q27 -3 29 -8L31 -15L20 -14.4L14 -10.4L-18 -9.4Z';
  let ports = '';
  if (fine) for (let px = -15; px <= 16; px += 5.2) ports += rect(px, -7.2, 2, 1.8);
  o += k.shape(hull, {
    fill: 'mid', sw: u(fine ? 1.3 : 1.1),
    h: fine ? [{ a: 0, g: u(1.2), w: u(0.6), r: rect(-40, -3.6, 80, 6) }] : [],
    inner: k.S('M-28 -8.8L29 -11.6', u(fine ? 1 : 0.8), 'light') + (fine ? k.F(ports, 'ink') : ''),
  });
  return g(`translate(${f(x)} ${f(y)}) scale(${f(s)})`, o);
}

function legendJack(k: K): string {
  // a small boat, one man at the oars pulling away into a fog bank; far behind, a sail on the horizon
  let o = '';
  // the horizon with the far sail, the sea in engraved lines, closer and heavier toward the front
  o += k.S('M30 50L97 50', 0.8) + ship(k, 86, 50, 0.13, false);
  let sea = '';
  for (let yy = 53, i = 0; yy < 97; yy += 2 + i * 0.4, i++) sea += k.S(`M${f(3 + i)} ${f(yy)}L${f(97 - i * 0.6)} ${f(yy)}`, 0.5 + i * 0.07, 'ink', 'stroke-dasharray="26 2.4 12 3"');
  o += sea;
  // the wake behind the stern and the ripples of the oars
  o += k.S('M80 76Q88 75 96 77M78 79Q86 81 94 83M82 73Q88 72 95 72.6', 1.1) + k.S('M30 82Q34 80 40 82M28 85Q34 83.6 40 85.4', 1);
  // the far oar (behind the boat)
  o += k.S('M64 55L70 64L77 79', 2.6) + k.shape('M73 76L81 81.6L79.6 84L71.6 78.8Z', { fill: 'mid', sw: 1.2 });
  // the rower, seen side-on, facing the stern: coat, legs braced, arms pulling, a cocked hat
  o += k.shape('M49 46C46 51 46 58 48 65L62 65C62.6 59 61.6 52 58 46Z', {
    fill: 'mid', sw: 1.8,
    h: [{ a: 50, g: 1.6, r: rect(54, 40, 12, 28) }, { a: -40, g: 2.2, w: 0.7 }],
    hi: 'M50.4 49C49 53 49 57 49.6 62L51 62C50.6 57 50.8 53 51.8 49Z',
  });
  o += k.S('M58 65L66 60L69 68', 4.4) + k.S('M58 65L66 60L69 68', 1.8, 'mid');
  o += k.S('M55 49C59 53 62 54.6 66.6 54.6', 4.2) + k.S('M55 49C59 53 62 54.6 66.6 54.6', 1.6, 'mid');
  o += k.shape(circ(54.6, 41.4, 4.6), { fill: 'light', sw: 1.6, h: [{ a: 50, g: 1.3, r: rect(56.4, 34, 6, 12) }], inner: k.F(circ(57.2, 41, 0.6), 'ink') });
  o += k.S('M50.4 43.4C48.2 45 47.4 47 47.8 49.6', 1.8);
  o += k.shape('M47 39.6C47.6 33.6 53 31.8 56.6 33.6C59.2 32.2 62 34.4 63 38.2C58 37 52 37.4 47 39.6Z', { fill: 'mid', sw: 1.6, h: [{ a: 30, g: 1.4 }] });
  o += k.shape(circ(67, 54.6, 1.7), { fill: 'light', sw: 1 });
  // the boat: bow to the left, a raised stern, strakes
  const boat = 'M16 60C22 70 31 76 42 77L74 77C80 76 83 70 84 61L76 63.4L26 63.4Z';
  o += k.shape(boat, {
    fill: 'mid', sw: 2.2,
    h: [{ a: 0, g: 1.5, w: 0.8, r: rect(0, 71, 100, 10) }, { a: 60, g: 2, r: 'M64 60L86 60L86 80L60 80Z' }],
    hi: 'M18.6 62C24 66.4 29 68 35 68.4L35 66.8C29 66.4 24 64.6 20 62Z',
    inner: k.S('M20 65.6C30 70 50 70.6 82 66.4M27 71C40 74 62 74 79 71', 0.9) + k.S('M26 63.4L76 63.4', 1.6, 'light') +
      k.F(circ(36, 64.6, 0.6) + circ(50, 64.6, 0.6) + circ(64, 64.6, 0.6), 'ink'),
  });
  // the near oar: from the hands over the gunwale down into the water, a little splash at the blade
  o += k.S('M66.4 54.6L56 64L38 80', 2.8) + k.shape('M40.6 77L35 82.6L32 81.4L36.6 75.4Z', { fill: 'mid', sw: 1.2 });
  for (const [x, y, r, a] of [[32, 77, 1.1, -150], [29, 80.4, 0.9, 180], [38, 75, 0.8, -120]]) o += drop(k, x, y, r, a);
  // the fog bank rolling in from the left: bands of fine lines, each veiling what is behind it, ending raggedly
  const bands: [number, number][] = [[18, 34], [27, 46], [36, 40], [45, 52], [54, 44], [63, 38], [72, 30], [81, 36], [90, 24]];
  let veil = '', fog = '';
  for (const [yy, len] of bands) {
    veil += `M6 ${yy + 1}L${f(len - 4)} ${yy + 1}`;
    [0, 1, 2, 3].forEach((j, n) => { fog += `M4 ${f(yy - 1.4 + j * 1.25)}L${f(len - [6, 0, 3, 10][n])} ${f(yy - 1.4 + j * 1.25)}`; });
  }
  o += k.S(veil, 4.6, 'paper') + k.S(fog, 0.55);
  return o;
}

function legendBottle(k: K): string {
  // a ship in a corked bottle lying on a little stand: the three-master on a painted sea, the glass with its highlights
  let o = g('translate(4 3)', k.shade('M8 80L86 80L86 86L8 86Z', 45, 1.6));
  const bottle = 'M15 26C8 26 5 34 5 51C5 68 8 76 15 76L64 76C71 76 75 71 79 65C81 62 83 61 87 61L87 41C83 41 81 40 79 37C75 31 71 26 64 26Z';
  // the far half of the stand shows through the glass: draw the cradles first
  o += k.shape('M14 70L30 70L32 82L12 82Z', { fill: 'mid', sw: 1.6, h: [{ a: 0, g: 1.4, w: 0.8 }] });
  o += k.shape('M56 70L72 70L74 82L54 82Z', { fill: 'mid', sw: 1.6, h: [{ a: 0, g: 1.4, w: 0.8 }] });
  const sea = 'M7 66C14 63 20 66 27 63.4C34 61 40 64.6 47 62.4C54 60.4 60 63.6 67 61.6C70 61 72 62 74 63L72 72L8 72Z';
  o += k.shape(bottle, {
    fill: 'light',
    h: [{ a: 0, g: 3, w: 0.6, r: rect(0, 28, 100, 14) }, { a: -20, g: 2.4, w: 0.7, r: 'M60 26C76 34 82 50 76 76L100 76L100 26Z' }],
    inner: k.shape(sea, { fill: 'mid', sw: 1, h: [{ a: 0, g: 1.4, w: 0.7 }], inner: k.S(waveLine(66, 1.6, 6, 6, 74, 1), 0.8, 'light') }) +
      ship(k, 40, 64, 0.5, true),
  });
  // glass: its thickness, the base, long highlights over everything
  o += k.S('M15 29.4C10 29.4 8.4 36 8.4 51C8.4 66 10 72.6 15 72.6M10.6 31C14 38 14 64 10.6 71', 0.9);
  o += k.S('M16 31L62 31C68 31 72 34 76 40', 2.6, 'paper') + k.S('M20 34L44 34', 1.2, 'paper') + k.S('M12 40C10.6 46 10.6 54 11.4 60', 2, 'paper');
  o += k.S('M68 71.4C72 70 74.6 67 77 63.6', 1.4, 'paper');
  o += k.S(bottle, k.cw);
  // lip and cork
  o += k.shape(rrect(85.6, 39.4, 4, 23.2, 1.4), { fill: 'light', sw: 1.8, h: [{ a: 0, g: 1.6, w: 0.7, r: rect(80, 54, 20, 10) }] });
  o += k.shape('M89.6 43L95 42.4C97 44 97 58 95 59.6L89.6 59Z', {
    fill: 'mid', sw: 1.8, h: [{ a: 0, g: 1.6, r: rect(80, 52, 20, 10) }],
    inner: k.F(circ(92, 47, 0.7) + circ(93.6, 51, 0.6) + circ(91.4, 55, 0.7) + circ(94.4, 46, 0.5), 'ink'),
  });
  // the stand: a board and the near halves of the two cradles
  o += k.shape(rrect(8, 80, 78, 7, 1.4), {
    fill: 'mid', sw: 2, h: [{ a: 0, g: 1.5, w: 0.8, r: rect(0, 83.6, 100, 4) }, { a: 45, g: 2, r: rect(70, 78, 20, 10) }], hi: rect(10, 81, 50, 1.2),
  });
  o += k.shape('M12 82L14 73C18 77 26 77 30 73L32 82Z', { fill: 'mid', sw: 1.6, h: [{ a: 45, g: 1.6, r: rect(24, 70, 10, 14) }] });
  o += k.shape('M54 82L56 73C60 77 68 77 72 73L74 82Z', { fill: 'mid', sw: 1.6, h: [{ a: 45, g: 1.6, r: rect(66, 70, 10, 14) }] });
  return o;
}

function legendArmada(k: K): string {
  // the Company fleet in line ahead, coming up over the horizon: each ship smaller with distance, an engraved sky and sea
  let o = '';
  // sky: fine horizontal lines, thinning out upward
  let sky = '';
  for (let yy = 52.4; yy > 18; yy -= 2.6 + (52.4 - yy) * 0.08) {
    const t = (52.4 - yy) / 36, x0 = 4 + t * 18, x1 = 96 - t * 10;
    sky += `M${f(x0)} ${f(yy)}L${f(x1)} ${f(yy)}`;
  }
  o += k.S(sky, 0.45, 'ink', 'stroke-dasharray="22 2.4 9 1.8"');
  o += k.S('M3 55L97 55', 1.2);
  // the ships, far to near
  o += ship(k, 94, 55.8, 0.06, false) + ship(k, 85.6, 59.6, 0.15, false);
  // the sea: lines widening toward us
  let sea = '';
  for (let yy = 57, i = 0; yy < 97; yy += 1.5 + i * 0.45, i++) sea += `M${f(3 + i * 0.4)} ${f(yy)}L${f(97 - i * 0.4)} ${f(yy)}`;
  o += k.S(sea, 0.7, 'ink', 'stroke-dasharray="14 2 6 3"');
  o += ship(k, 69, 69, 0.3, true) + ship(k, 35, 86, 0.66, true);
  // the near sea in front of the flagship: wavelets
  o += k.shape(waveLine(88, 2.6, 9.2, 4, 93, 0) + 'L96 97L4 97Z', { fill: 'mid', sw: 0, h: [{ a: 0, g: 1.8, w: 0.8 }], inner: k.S(waveLine(92.6, 2, 7, 3, 97, 3), 1, 'light') });
  o += k.S(waveLine(88, 2.6, 9.2, 4, 93, 0), 1.8);
  return o;
}

interface Tube { d: string; P: Pt[]; N: Pt[]; W: number[] }
/** a tapering tube along a Catmull-Rom spline through pts: half-width w0 at the start, w1 at the tip; N = right-hand normals */
function tube(pts: Pt[], w0: number, w1: number, steps = 10): Tube {
  const P: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 0; j < steps; j++) {
      const t = j / steps, t2 = t * t, t3 = t2 * t;
      P.push([0, 1].map(c => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)) as Pt);
    }
  }
  P.push(pts[pts.length - 1]);
  const N: Pt[] = [], W: number[] = [];
  P.forEach((p, i) => {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    N.push([-dy / l, dx / l]);
    const t = i / (P.length - 1);
    W.push(w1 + (w0 - w1) * Math.pow(1 - t, 0.9));
  });
  const side = (s: number) => P.map((p, i) => [p[0] + N[i][0] * W[i] * s, p[1] + N[i][1] * W[i] * s] as Pt);
  const L = side(-1), R = side(1);
  const e = P.length - 1, tip: Pt = [P[e][0] + (P[e][0] - P[e - 1][0]) * 0.8, P[e][1] + (P[e][1] - P[e - 1][1]) * 0.8];
  const d = 'M' + L.map(pp).join('L') + `Q${pp(tip)} ${pp(R[e])}L` + R.slice().reverse().map(pp).join('L') + 'Z';
  return { d, P, N, W };
}
const offs = (T: Tube, s: number, i0 = 0, i1 = T.P.length) => T.P.slice(i0, i1).map((p, j) => [p[0] + T.N[i0 + j][0] * T.W[i0 + j] * s, p[1] + T.N[i0 + j][1] * T.W[i0 + j] * s] as Pt);

function tentacle(k: K, T: Tube, sucker: number): string {
  const n = T.P.length;
  const shadeR = 'M' + offs(T, 0.05).map(pp).join('L') + 'L' + offs(T, 1.4).reverse().map(pp).join('L') + 'Z';
  const deepR = 'M' + offs(T, 0.55).map(pp).join('L') + 'L' + offs(T, 1.4).reverse().map(pp).join('L') + 'Z';
  const hi = 'M' + offs(T, -0.82, 0, n - 4).map(pp).join('L') + 'L' + offs(T, -0.5, 0, n - 4).reverse().map(pp).join('L') + 'Z';
  // rings across the form (the engraver's contour lines), bowed toward the light
  let rings = '';
  for (let i = 3; i < n - 6; i += 3) {
    const a = offs(T, -1, i, i + 1)[0], b = offs(T, 1, i, i + 1)[0], c: Pt = [T.P[i][0] - T.N[i][0] * T.W[i] * 0.1 + (T.P[i + 1][0] - T.P[i][0]) * 0.8, T.P[i][1] - T.N[i][1] * T.W[i] * 0.1 + (T.P[i + 1][1] - T.P[i][1]) * 0.8];
    rings += `M${pp(a)}Q${pp(c)} ${pp(b)}`;
  }
  let o = k.shape(T.d, {
    fill: 'mid', mid: '',
    h: [{ a: 45, g: 1.8, r: shadeR }, { a: -45, g: 2.2, w: 0.8, r: deepR }],
    hi,
    inner: k.S(rings, 0.6),
  });
  // suckers along the inner (right-hand) side, shrinking to the tip, each a cup with a dark centre
  for (let i = 2; i < n - 3; i += sucker) {
    const w = T.W[i], c: Pt = [T.P[i][0] + T.N[i][0] * w * 0.72, T.P[i][1] + T.N[i][1] * w * 0.72], r = Math.max(0.7, w * 0.36);
    o += k.shape(circ(c[0], c[1], r), { fill: 'light', sw: r > 1.6 ? 1.2 : 0.9, h: [{ a: 45, g: 1.2, w: 0.6, r: rect(c[0], c[1], r + 2, r + 2) }] }) +
      k.F(circ(c[0] + r * 0.12, c[1] + r * 0.12, r * 0.4), 'ink');
  }
  return o;
}

function legendKraken(k: K): string {
  // the great arm rising out of the sea and curling over, suckers along the inside of the curl, a second tip breaking the
  // surface on the left, foam and spray at the base
  let o = '';
  // the horizon and the far sea behind
  o += k.S('M3 66L97 66', 1);
  let far = '';
  for (let yy = 69, i = 0; yy < 80; yy += 2 + i * 0.4, i++) far += `M${f(4)} ${f(yy)}L${f(96)} ${f(yy)}`;
  o += k.S(far, 0.6, 'ink', 'stroke-dasharray="12 2 5 2.6"');
  const small = tube([[22, 90], [19, 80], [13, 71], [13, 62], [19, 57.6], [24.6, 60], [24, 65.4], [20, 66]], 5, 0.6, 8);
  o += tentacle(k, small, 3);
  const big = tube([[51.4, 92], [50, 84], [43, 70], [40, 55], [44, 39], [54, 26], [67, 19], [80, 21], [88, 32], [86, 44], [77, 49], [69, 45], [68, 37], [74, 33], [77.4, 37]], 9.2, 0.8, 10);
  o += tentacle(k, big, 3);
  // the sea closing round the base: a wave line with hatching below, foam collars
  const top = waveLine(82, 3.6, 9, 4, 93, 0);
  o += k.shape(top + 'L94 97L4 97Z', {
    fill: 'mid', sw: 0,
    h: [{ a: 0, g: 1.9 }, { a: -25, g: 2.4, r: rect(0, 90, 100, 10) }],
    inner: k.S(waveLine(88, 2.6, 9, 3, 97, 4), 1.2, 'light') + k.S(waveLine(93.6, 2, 12, 3, 97, 0), 0.9, 'light'),
  });
  o += k.S(top, 2);
  o += k.shape('M36 84C38 79 41 78 43 80C44 76 47 75 49 78C51 74 56 74 57 78C59 76 63 77 63 81C66 80 68 82 67 85C60 87 44 87 36 84Z', {
    fill: 'light', sw: 1.6, h: [{ a: 0, g: 1.4, w: 0.6, r: rect(0, 83, 100, 4) }],
  });
  o += k.shape('M12 86C13 82 16 81.6 18 83.4C19 80.4 23 80 25 83C27 82 30 83.4 29.4 86.4C24 88 16 88 12 86Z', { fill: 'light', sw: 1.4 });
  for (const [x, y, r, a] of [[34, 72, 1.6, 120], [30, 64, 1.2, 110], [60, 70, 1.5, 60], [66, 62, 1.1, 70], [40, 62, 1.1, 100], [10, 74, 1.1, 120], [28, 76, 1, 130], [70, 74, 1.2, 40]])
    o += drop(k, x, y, r, a);
  return o;
}

export const STORY: Record<StoryName, (k: K) => string> = {
  madPlan, swiftWind, greekFire, tritonSword, treasury, heartChest, soulService, dive,
  legendJack, legendBottle, legendArmada, legendKraken,
};
