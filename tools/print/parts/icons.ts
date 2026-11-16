// Engraved icons of the printed game: contour + hatching clipped to the shape, like the cartouches of an 18th-century
// sea chart. Every icon is drawn in a 100x100 local box and placed with a transform. Pure string functions (no node:*),
// no filters, no text. Ids are unique per call because one page repeats the same icon dozens of times.

import { K, at, bz, bbox, circ, lowerArc, rect, rrect, poly, outside, waveLine, scallops, star, f, pp, rad, compass, cardBack, drop, bubble, curve, grain, rope, cloud, type Pt } from './icons-kit';
import { STORY, STORY_NAMES, STORY_TITLES, type StoryName } from './icons-story';
/** the icons drawn here; the ability and Legend icons are in icons-story.ts */
export type BaseName =
  | 'sails' | 'crew' | 'guns' | 'hull' | 'fire' | 'powder' | 'souls' | 'reaction' | 'plan' | 'once'
  | 'cards' | 'legend' | 'effects' | 'seaDeck' | 'seaCard' | 'underwater' | 'surfaced'
  | 'sinking' | 'volley' | 'phaseSea' | 'phasePirates' | 'phaseCompany';
export type IconName = BaseName | StoryName;

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
  'sinking', 'volley', 'phaseSea', 'phasePirates', 'phaseCompany', ...STORY_NAMES,
];

/** what each icon means, in plain words (the icon sheet, tools/print/icon-sheet.ts) */
export const ICON_TITLES: Partial<Record<IconName, string>> = {
  sails: 'Паруса', crew: 'Команда', guns: 'Пушки', hull: 'Корпус', fire: 'Пожар', powder: 'Порох', souls: 'Души',
  reaction: 'Реакция', plan: 'План', once: 'Раз в ход', cards: 'Карты', legend: 'Легенда', effects: 'Эффекты',
  seaDeck: 'Колода моря', seaCard: 'Карта моря', underwater: 'Под водой', surfaced: 'Всплыл',
  sinking: 'Тонет', volley: 'Залп дан', phaseSea: 'Фаза: Море', phasePirates: 'Фаза: ходят Пираты', phaseCompany: 'Фаза: ходит Компания',
  ...STORY_TITLES,
};

/** a band of sea from x0 to x1 with n whole waves on top at y, closed down to `bottom` (stays inside the box) */
function seaBand(y: number, amp: number, len: number, x0 = 3, x1 = 97, bottom = 97): string {
  const n = Math.max(1, Math.round((x1 - x0) / len)), l = (x1 - x0) / n;
  let d = `M${f(x0)} ${f(bottom)}L${f(x0)} ${f(y)}`;
  for (let i = 0; i < n; i++) d += `Q${f(x0 + l * (i + 0.5))} ${f(y + amp)} ${f(x0 + l * (i + 1))} ${f(y)}`;
  return d + `L${f(x1)} ${f(bottom)}Z`;
}

// ---------------------------------------------------------------- the icons

const DRAW: Record<IconName, (k: K) => string> = {
  ...STORY,
  phaseSea: k => phase(k, 'sea'),
  phasePirates: k => phase(k, 'pirates'),
  phaseCompany: k => phase(k, 'company'),
  sails(k) {
    // a course and a topsail seen 3/4 from the front: heads straight on the yards, leeches bowed out, feet arching up,
    // seams curving with the belly, the right half in shade
    let o = k.shape('M52 3Q58 2.6 63 4.6Q68 6.4 74 6L68 8.4L75 11Q68 11.6 63 10.2Q58 9 52 11.5Z', { fill: 'light', sw: 1.5, h: [{ a: 0, g: 2, r: rect(48, 8.4, 40, 6) }, { a: 80, g: 1.6, w: 0.8, fine: true, r: rect(62, 0, 8, 14) }] });
    o += k.shape(rect(47.5, 3, 5, 95), { fill: 'mid', sw: 2, h: k.cyl(47.5, 52.5, 90, 1.6), hi: rect(48.4, 4, 0.9, 90) });
    o += k.fine(k.S('M50 5L21 10.5M50 5L79 10.5M50 37L5 41M50 37L95 41', 0.8));
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
      let reef = '', reefKnots = '';
      for (let x = x0 + 4; x < x1 - 2; x += 4.4) { reef += `M${f(x)} ${f(y0 + 4)}L${f(x + 0.4)} ${f(y0 + 7.4)}`; reefKnots += circ(x, y0 + 4, 0.7); }
      const shadeR = `M${f(cx + 2)} 0Q${f(cx + 2 + bulge * 1.2)} ${f(y0 + h * 0.5)} ${f(cx + 2)} 100L110 100L110 0Z`;
      const deepR = `M${f(x1 - w * 0.12)} 0Q${f(x1 - w * 0.12 + bulge * 1.4)} ${f(y0 + h * 0.5)} ${f(x1 - w * 0.12)} 100L110 100L110 0Z`;
      return k.shape(d, {
        fill: 'light',
        mid: shadeR,
        h: [{ a: 80, g: 2.5, r: shadeR }, { a: -20, g: 2.5, r: deepR }, { a: 2, g: 2.6, w: 0.9, r: `M0 ${f(y1 - arch * 2.4)}Q${f(cx)} ${f(y1 - arch * 4.2)} 110 ${f(y1 - arch * 2.4)}L110 110L0 110Z` }],
        inner: k.S(seams, 1.1) + k.S(`M${f(x0 + w * 0.12)} ${f(y0 + 3)}Q${f(x0 + w * 0.06 - bulge * 0.3)} ${f(y0 + h * 0.5)} ${f(x0 + w * 0.1)} ${f(y1 - 4)}`, 1.6, 'light') +
          k.fine(k.S(reef, 0.9) + k.F(reefKnots, 'ink') + k.S(d, 3, 'mid')),
      });
    };
    const yard = (x0: number, x1: number, y: number) => k.fine(k.S(`M${x0 + 3} ${f(y + 5)}Q50 ${f(y + 10.5)} ${x1 - 3} ${f(y + 5)}`, 0.9)) +
      k.shape(`M${x0} ${f(y)}Q50 ${f(y - 2.6)} ${x1} ${f(y)}L${x1} ${f(y + 4.4)}Q50 ${f(y + 6.4)} ${x0} ${f(y + 4.4)}Z`, { fill: 'mid', sw: 2.2, h: [{ a: 0, g: 1.4, w: 0.8, r: rect(0, y + 2.6, 100, 6) }], hi: `M${x0 + 2} ${f(y + 0.4)}Q50 ${f(y - 1.8)} ${x1 - 2} ${f(y + 0.4)}L${x1 - 2} ${f(y + 1.4)}Q50 ${f(y - 0.8)} ${x0 + 2} ${f(y + 1.4)}Z`,
        inner: k.fine(k.S(`M${x0 + 6} ${f(y)}L${x0 + 6} ${f(y + 5)}M${x1 - 6} ${f(y)}L${x1 - 6} ${f(y + 5)}M44 ${f(y - 1)}L44 ${f(y + 6)}M56 ${f(y - 1)}L56 ${f(y + 6)}`, 1.2)) });
    o += sail(28, 72, 14.5, 35, 3.4, 4) + yard(20, 80, 10.5);
    o += sail(12, 88, 45, 86, 6.5, 7.5) + yard(3, 97, 40.5);
    o += k.S('M7.5 86L3 98M92.5 86L97 98M24.4 35L13 41M75.6 35L87 41', 1.4);
    return o;
  },

  crew(k) {
    let o = k.shape('M4 100C6 84 18 76 34 72L42 68L58 68L66 72C82 76 94 84 96 100Z', {
      fill: 'mid',
      h: [{ a: 60, g: 2.6, r: rect(52, 60, 50, 40) }, { a: -30, g: 2.6, r: poly(76, 60, 100, 60, 100, 100, 70, 100) }, { a: 15, g: 2.6, w: 0.8, fine: true, r: poly(84, 70, 100, 70, 100, 100, 80, 100) }, { a: 60, g: 3.6, w: 0.8, r: rect(0, 60, 24, 40) }],
      hi: 'M12 93C16 85 22 80 31 77L33 80C25 83 19 88 16 95Z',
      inner: k.S('M42 69L35 100M58 69L65 100', 1.5) + k.fine(k.S('M20 82C24 88 25 94 24 100M80 82C76 88 75 94 76 100M70 78C73 84 74 90 73 96', 0.9) + k.S('M40.5 74L37.5 88M41 76L39 82', 1, 'light')),
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
    o += k.fine(k.shape('M60 54C66 56 70 60 69 66L64 64C64 60 62 57 59 56Z', { fill: 'ink', sw: 0 }));
    o += k.shape('M30 25C30 5 70 5 70 25Z', { fill: 'mid', h: [{ a: 30, g: 2.2 }, { a: -40, g: 2.4, r: rect(50, 0, 50, 30) }, { a: 0, g: 2.4, w: 0.8, fine: true, r: rect(58, 0, 20, 30) }], hi: 'M36 20C36 12 42 8 47 7.4C41 10 38.6 15 38.6 21Z' });
    o += k.shape('M8 33C14 22 26 18 35 20C41 21 46 24 50 24C54 24 59 21 65 20C74 18 86 22 92 33C80 28 62 30 50 41C38 30 20 28 8 33Z', {
      fill: 'mid',
      h: [{ a: 30, g: 2.4 }, { a: -35, g: 2.4, r: rect(50, 0, 50, 50) }],
      inner: k.S('M11.5 31C17 23.5 27 20.5 35 22C41 23 46 26 50 26C54 26 59 23 65 22C73 20.5 83 23.5 88.5 31', 1.6, 'light'),
    });
    o += k.shape(circ(30, 26.5, 3.4), { fill: 'light', sw: 1.3 }) + k.F(circ(30, 26.5, 1.1), 'ink');
    return o;
  },

  guns(k) {
    // cast shadow on the deck, the breeching rope, carriage cheek, axletree, trucks, quoin, then the barrel on top
    let o = k.shade('M10 97.5Q14 92 30 92L84 92Q96 93 97 97.5Z', 45, 1.5);
    o += rope(k, 4, 74, 12, 76, 2.4) + k.fine(k.shape(circ(89, 92.5, 3.6), { fill: 'mid', sw: 1.3, h: k.round(89, 92.5, 3.6), hi: circ(88, 91.4, 1) }) + k.shape(circ(93.6, 94, 3.4), { fill: 'mid', sw: 1.3, h: k.round(93.6, 94, 3.4), hi: circ(92.6, 93, 1) }));
    o += k.shape(rect(12, 80, 66, 6), { fill: 'mid', sw: 1.8, h: [{ a: 0, g: 1.6 }] });
    o += k.shape('M8 84L8 75L18 75L18 69L30 69L30 63L44 63L46 58L68 55L78 58L80 84Z', {
      fill: 'mid',
      h: [{ a: 0, g: 2.3, w: 0.9 }, { a: 50, g: 2.4, r: rect(0, 74, 100, 20) }, { a: -40, g: 2.6, r: rect(70, 50, 30, 40) }],
      hi: 'M18.8 70L29.2 70L29.2 71.2L18.8 71.2ZM30.8 64L43.4 64L43.4 65.2L30.8 65.2ZM9 76L17.2 76L17.2 77.2L9 77.2Z',
      inner: k.fine(k.S(grain(9, 66, 79, 83, 4, 0.7, 5), 0.8)),
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
    // the hull in section (as before, df77e0e), drawn for 8 mm: a thick cut wall, two decks, knees, one pillar, the keel,
    // the waterline; few lines, wide hatching, so it does not turn to mud when small
    const O1: Pt[] = [[18, 8], [10, 22], [4, 36], [5, 50]], O2: Pt[] = [[5, 50], [6, 66], [28, 84], [46, 88]];
    const I1: Pt[] = [[27, 8], [20, 23], [14.5, 36], [15, 50]], I2: Pt[] = [[15, 50], [16, 61], [33, 74], [46, 77]];
    const mir = (s: Pt[]) => s.map(([x, y]) => [100 - x, y] as Pt);
    const side = (a: Pt[], b: Pt[]) => {
      const ma = mir(a), mb = mir(b);
      return `M${pp(a[0])}C${pp(a[1])} ${pp(a[2])} ${pp(a[3])}C${pp(b[1])} ${pp(b[2])} ${pp(b[3])}L${pp(mb[3])}` +
        `C${pp(mb[2])} ${pp(mb[1])} ${pp(mb[0])}C${pp(ma[2])} ${pp(ma[1])} ${pp(ma[0])}`;
    };
    const outer = side(O1, O2), inner = side(I1, I2);
    // the sea under the waterline, outside the hull only
    let o = k.shape(rect(2, 60, 96, 38), { fill: "none", sw: 0, h: [{ a: 0, g: 5.6, w: 1 }], inner: k.fine(k.S(scallops(2, 98, 66.6, 6, 2) + scallops(5, 98, 77.8, 6, 2) + scallops(2, 98, 89, 6, 2), 0.9)) });
    o += k.shape(inner + 'Z', { fill: 'light', sw: 0, h: [{ a: 0, g: 3, w: 0.7, fine: true, r: rect(0, 62, 100, 40) }] });
    // the hold: two casks and a sack on the lower deck
    o += k.fine(k.shape(circ(36, 66, 4.4, 5), { fill: 'mid', sw: 1.4, h: k.round(36, 66, 4.4, 5), inner: k.S('M31.6 63.4L40.4 63.4M31.6 68.6L40.4 68.6', 1.1) }) +
      k.shape(circ(63.6, 66.6, 4, 4.6), { fill: 'mid', sw: 1.4, h: k.round(63.6, 66.6, 4, 4.6), inner: k.S('M59.6 64.2L67.6 64.2M59.6 69L67.6 69', 1.1) }));
    // decks, knees, pillar, keelson — solid, so they read as one figure at 8 mm
    const beam = (y: number, x0: number) => k.shape(rect(x0, y, 100 - 2 * x0, 5), { fill: 'mid', sw: 2, h: [{ a: 45, g: 3 }], hi: rect(x0, y, 100 - 2 * x0, 1.2), inner: k.fine(k.S(`M${x0 + 12} ${y}L${x0 + 12} ${y + 5}M${x0 + 30} ${y}L${x0 + 30} ${y + 5}M${100 - x0 - 20} ${y}L${100 - x0 - 20} ${y + 5}`, 0.9)) });
    o += beam(22, 18) + beam(46, 13);
    for (const s of [1, -1]) {
      const X = (x: number) => (s > 0 ? x : 100 - x);
      o += k.shape(poly(X(19), 27, X(30), 27, X(18), 38), { fill: 'ink', sw: 1.2 });
      o += k.shape(poly(X(15), 51, X(27), 51, X(15.5), 62), { fill: 'ink', sw: 1.2 });
    }
    o += k.shape(rect(47.5, 27, 5, 19), { fill: 'mid', sw: 1.8, h: k.cyl(47.5, 52.5, 90, 1.6) });
    o += k.shape(rect(47, 51, 6, 22), { fill: 'mid', sw: 1.8, h: k.cyl(47, 53, 90, 1.6) });
    o += k.shape(rect(38, 72, 24, 6), { fill: 'mid', sw: 2, h: [{ a: 45, g: 3 }] });
    // the cut wall: hatched like a section, the frames as a few strong ticks
    let ticks = '';
    for (const [A, B] of [[O1, I1], [O2, I2], [mir(O1), mir(I1)], [mir(O2), mir(I2)]] as Pt[][][])
      for (const t of [0.25, 0.75]) ticks += `M${pp(bz(A, t))}L${pp(bz(B, t))}`;
    o += k.shape(outer + 'Z' + inner + 'Z', { fill: 'mid', sw: 0, h: [{ a: 45, g: 3 }], inner: k.S(ticks, 1.6) });
    o += k.shape(rect(43.5, 85, 13, 12), { fill: 'ink', sw: 2 });
    o += k.S(outer, k.cw) + k.S(inner, 2.4) + k.S('M17.5 8L27.5 8M82.5 8L72.5 8', 2.6);
    o += k.S('M2 60L13 60M87 60L98 60', 2, 'ink', 'stroke-dasharray="4 2.6"');
    return o;
  },

  fire(k) {
    // a ship on fire: the hull side with its sheer, rail, wale and gun ports, the bowsprit; flames engulf the deck,
    // climb the mast and burst out of a gun port; smoke billows away to the left; the fire is mirrored in the sea
    const Q = (d: number, x2 = 100): Pt[] => [[2, 52 + d], [50, 62 + d], [x2, 44 + d - (x2 - 88) * 1.4]];
    const qd = (p: Pt[]) => `M${pp(p[0])}Q${pp(p[1])} ${pp(p[2])}`;
    const qr = (p: Pt[]) => `L${pp(p[2])}Q${pp(p[1])} ${pp(p[0])}`;
    const on = (d: number, t: number): [number, number, number] => {
      const p = Q(d, 88), m = 1 - t;
      const x = m * m * p[0][0] + 2 * m * t * p[1][0] + t * t * p[2][0], y = m * m * p[0][1] + 2 * m * t * p[1][1] + t * t * p[2][1];
      return [x, y, Math.atan2(2 * m * (p[1][1] - p[0][1]) + 2 * t * (p[2][1] - p[1][1]), 2 * m * (p[1][0] - p[0][0]) + 2 * t * (p[2][0] - p[1][0])) * 180 / Math.PI];
    };
    // smoke behind everything
    const smoke = (cx: number, cy: number, rx: number, ry: number, n: number, seed: number) => k.shape(cloud(cx, cy, rx, ry, n, 0.42, seed), {
      fill: 'mid', sw: 2, h: [{ a: 40, g: 2.4 }, ...k.round(cx, cy, rx, ry, -50, 2.4).slice(0, 2)],
      inner: k.fine(k.S(`M${f(cx - rx * 0.8)} ${f(cy - ry * 0.1)}Q${f(cx - rx * 0.7)} ${f(cy - ry * 0.75)} ${f(cx - rx * 0.2)} ${f(cy - ry * 0.85)}`, 1.4, 'light') +
        k.S(`M${f(cx - rx * 0.35)} ${f(cy + ry * 0.5)}Q${f(cx - rx * 0.4)} ${f(cy - ry * 0.1)} ${f(cx)} ${f(cy - ry * 0.05)}M${f(cx + rx * 0.25)} ${f(cy + ry * 0.45)}Q${f(cx + rx * 0.3)} ${f(cy - ry * 0.25)} ${f(cx + rx * 0.65)} ${f(cy - ry * 0.2)}`, 1.1)),
    });
    let o = smoke(15, 22, 11, 8, 6, 1) + smoke(30, 12, 22, 9.5, 9, 2);
    // the mast with its top, the stay to the bowsprit, the shrouds
    o += k.S('M57 8L94 32', 1.3) + k.S('M48 14L36 56M56 14L72 52', 1.4);
    o += k.shape(rect(50.5, 3, 5, 58), { fill: 'mid', sw: 2, h: k.cyl(50.5, 55.5) });
    o += k.shape(rect(49.5, 2.5, 7, 3.4), { fill: 'mid', sw: 1.6 });
    o += k.shape('M37 25L69 13.5L70 16.5L38 28Z', { fill: 'mid', sw: 1.8, h: [{ a: -20, g: 1.4, r: 'M37 28L70 16L70 20L37 32Z' }] });
    // the flames: sinuous tongues with a pinched waist and a thin hooked tip, tall ones behind, short ones in front;
    // each a warm outer flame round a light core, with a line along its middle
    const tongue = (bx: number, by: number, w: number, h: number, L: number) => {
      const T: Pt = [bx + L, by - h], m1: Pt = [bx - w * 0.36 + L * 0.35, by - h * 0.5], m2: Pt = [bx + w * 0.26 + L * 0.45, by - h * 0.52];
      return `M${f(bx - w / 2)} ${f(by)}C${f(bx - w * 0.72)} ${f(by - h * 0.18)} ${f(m1[0] - w * 0.2)} ${f(m1[1] + h * 0.16)} ${pp(m1)}` +
        `C${f(m1[0] + w * 0.16)} ${f(m1[1] - h * 0.14)} ${f(T[0] + w * 0.12)} ${f(T[1] + h * 0.3)} ${pp(T)}` +
        `C${f(T[0] + w * 0.2)} ${f(T[1] + h * 0.18)} ${f(m2[0] - w * 0.16)} ${f(m2[1] - h * 0.12)} ${pp(m2)}` +
        `C${f(m2[0] + w * 0.26)} ${f(m2[1] + h * 0.14)} ${f(bx + w * 0.66)} ${f(by - h * 0.16)} ${f(bx + w / 2)} ${f(by)}Z`;
    };
    for (const [bx, h, w, L] of [[40, 62, 30, -8], [20, 50, 28, -7], [62, 52, 28, -7], [12, 34, 14, -4], [30, 42, 24, -6], [51, 40, 24, -5], [73, 36, 22, -5], [16, 24, 18, -3], [42, 26, 22, -4], [62, 22, 18, -3], [82, 20, 12, -3]]) {
      const by = 66;
      o += k.shape(tongue(bx, by, w, h, L), {
        fill: 'light', sw: h > 30 ? 2 : 1.8,
        h: [{ a: 72, g: 2.4, w: 0.7, fine: true, r: `M${f(bx + w * 0.12)} 70C${f(bx + w * 0.05)} ${f(by - h * 0.5)} ${f(bx + L + w * 0.2)} ${f(by - h * 0.8)} ${f(bx + L)} ${f(by - h)}L100 0L100 70Z` }],
        inner: k.S(tongue(bx - 0.5, by + 3, w * 0.5, h * 0.62, L * 0.8), 1),
      });
    }
    // the hull: rail cap, bulwark with gun ports, wale, lower strakes; darker toward the water
    const hull = 'M5 50.5Q50 60 89 42C94 50 96 64 92 88L9 88C5 76 3 62 5 50.5Z';
    let strakes = '';
    for (const d of [4, 7.5, 18.5, 22, 25.5, 29, 32.5]) strakes += qd(Q(d));
    o += k.shape(hull, {
      fill: 'mid',
      h: [{ a: 3, g: 2.2, w: 0.8 }, { a: -40, g: 2.8, w: 0.8, r: qd(Q(17)) + 'L100 100L0 100Z' }, { a: 40, g: 3.2, w: 0.7, fine: true, r: qd(Q(28)) + 'L100 100L0 100Z' }],
      hi: 'M89 43C92 50 93 58 92 66L90 66C90 58 89 50 87.5 44Z',
      inner: k.S(strakes, 1.4) + k.shape(qd(Q(12)) + qr(Q(16.5)) + 'Z', { fill: 'mid', sw: 1.8, h: [{ a: 40, g: 1.7 }, { a: -40, g: 1.9 }], inner: k.S(qd(Q(13)), 1.3, 'light') }),
    });
    o += k.shape(qd(Q(-2, 89)) + qr(Q(1.6, 89.6)) + 'Z', { fill: 'mid', sw: 2, inner: k.S(qd(Q(-1.4, 89)), 1.2, 'light') });
    o += k.shape('M83 47L94.5 31.5L96.5 34L86 49.5Z', { fill: 'mid', sw: 1.8, h: [{ a: 55, g: 1.5, r: 'M84 49L97 33L100 36L86 52Z' }] });
    let ports = '';
    for (const [t, fire] of [[0.2, 0], [0.47, 2], [0.72, 1]] as const) {
      const [x, y, a] = on(9.6, t);
      ports += `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)})">` + k.shape(rect(-4.2, -3.6, 8.4, 7.2), { fill: 'ink', sw: 1.6, inner: fire === 1 ? k.F('M-2 3.6C-2 0 0 -1 0 -3C2 0 2.5 2 2 3.6Z', 'light') : '' }) + '</g>';
    }
    o += ports;
    // fire bursting out of the middle gun port and licking up the side over the rail
    const [px, py] = on(9.6, 0.47);
    o += `<g transform="translate(${f(px - 46)} ${f(py - 67)})">` + k.shape('M42 70C38 64 44 60 42 54C41 48 35 46 37 39C43 44 48 47 47 54C51 50 50 45 54 42C56 50 56 58 51 63C53 66 52 69 51 70Z', {
      fill: 'light', sw: 2, h: [{ a: 70, g: 2.6, r: rect(48, 30, 20, 50) }],
      inner: k.shape('M44 70C43 65 47 62 46 57C50 60 51 66 50 70Z', { fill: 'light', sw: 1.2 }),
    }) + '</g>';
    // the sea, with the fire mirrored in it
    o += k.shape(seaBand(86, 3, 10), {
      fill: 'mid', sw: 2.2,
      h: [{ a: 0, g: 2.2 }, { a: -20, g: 2.8, fine: true, r: rect(56, 88, 50, 12) }],
      inner: k.S('M12 90L22 90M30 91L44 91M20 94L30 94M48 90.5L58 90.5M38 95L46 95', 1.6, 'light'),
    });
    for (const [x, y, r] of [[40, 3, 1.2], [68, 12, 1.3], [80, 26, 1], [84, 38, 1.2], [62, 6, 0.9]]) o += k.fine(k.F(star(x, y, 4, r * 0.45, r * 2, 0), 'ink'));
    return o;
  },

  sinking(k) {
    // a ship going down by the head: her stern stands up out of a whirlpool — taffrail and lantern, quarter gallery,
    // gun ports, rudder, the stump of the mizzen; the near half of the whirlpool closes over the rest; bubbles rise
    const cx = 50, cy = 78;
    const spiral = (arm: number) => {
      const pts: Pt[] = [];
      for (let i = 0; i <= 28; i++) { const th = rad(arm * 120 + 20 + i * 13), r = 9 + i * 1.33; pts.push([cx + r * Math.cos(th), cy + r * 0.36 * Math.sin(th)]); }
      return curve(pts);
    };
    const sp = spiral(0) + spiral(2), fo = spiral(1);
    const water = (inner = '') => ({
      fill: 'mid' as const, sw: 0,
      h: [{ a: 0, g: 2.2, w: 0.9 }, { a: -30, g: 2.8, r: outside(circ(cx - 8, cy - 5, 42, 14)) }],
      inner: k.S(sp, 1.4) + k.S(fo, 2.4, 'light') + k.fine(k.S(fo, 0.8)) + inner,
    });
    let o = k.shape(circ(cx, cy, 47, 17), water()) + k.S(circ(cx, cy, 47, 17), k.cw);
    o += k.shape(circ(cx + 2, cy, 13, 4.4), { fill: 'ink', sw: 1.4 });
    // the ship, drawn level (stern to the left), then stood on her head
    let s = k.shape('M30 28L29 4L31.5 7L33 3L34 28Z', { fill: 'mid', sw: 1.8, h: k.cyl(29, 34) });
    s += k.S('M31 8L12 26M32 8L52 34', 1.1);
    const hull = 'M6 26L36 26L38 32L110 32L110 64L28 64C20 64 15 58 13 50L9 38Z';
    s += k.shape(hull, {
      fill: 'mid',
      h: [{ a: 0, g: 2.8, w: 0.75, r: 'M0 45L120 45L120 80L0 80Z' }, { a: 50, g: 3, w: 0.85, r: 'M0 53L120 53L120 80L0 80Z' }, { a: -40, g: 3, w: 0.7, fine: true, r: 'M0 58L120 58L120 80L0 80Z' }],
      hi: 'M7.5 27L35.5 27L36 28.6L8 28.6ZM38.6 33L110 33L110 34.4L38.8 34.4Z',
      inner: k.S('M9 38L110 38M12 48L110 48M14 53L110 53', 1.3) + k.shape('M9 40L110 40L110 45L11 45Z', { fill: 'mid', sw: 1.4, h: [{ a: 45, g: 1.6 }, { a: -45, g: 1.8 }], inner: k.S('M9.4 40.8L110 40.8', 1, 'light') }) +
        k.F([40, 52, 64, 76].map(x => rect(x, 33.4, 5, 4.2)).join(''), 'ink') + k.fine(k.S(grain(14, 54, 110, 63, 3, 0.6, 2), 0.8)),
    });
    s += k.shape('M12 26L26 26L26 40Q20 46 15 42L13 34Z', { fill: 'light', sw: 1.6, h: [{ a: 90, g: 1.6, r: rect(22, 0, 10, 50) }], inner: k.F(rect(15, 29, 3.4, 5) + rect(20, 29, 3.4, 5), 'ink') + k.S('M13 37L26 37', 1.2) });
    s += k.shape('M9 38L5.5 39L7.5 51C9.5 60 15 66 23 67L25 64C19 63 15 58 13.5 50Z', { fill: 'mid', sw: 1.6, h: [{ a: 60, g: 1.5 }], inner: k.S('M6 44L11 43M7.5 52L13 50M11 59L16 56', 1.2) });
    s += k.S('M6 26L5 21', 1.6) + k.shape('M2.4 14L7.4 14L6.8 21L3 21Z', { fill: 'light', sw: 1.4, h: [{ a: 90, g: 1.3, r: rect(5, 0, 4, 30) }] }) + k.shape('M3.6 14L6.2 14L4.9 11Z', { fill: 'mid', sw: 1.2 });
    o += `<g clip-path="${k.clip(rect(0, 0, 100, cy + 0.5))}"><g transform="translate(54 ${cy}) rotate(45) scale(1.2) translate(-50 -50)">${s}</g></g>`;
    // the near half of the whirlpool and the foam where she goes in
    const near = `M${cx - 47} ${cy}C${cx - 47} ${cy + 9.4} ${cx - 26} ${cy + 17} ${cx} ${cy + 17}C${cx + 26} ${cy + 17} ${cx + 47} ${cy + 9.4} ${cx + 47} ${cy}Z`;
    o += k.shape(near, water(k.S(`M${cx - 30} ${cy + 1.5}Q${cx - 4} ${cy + 7} ${cx + 26} ${cy + 1}`, 2.4, 'light') + k.fine(k.S(scallops(cx - 30, cx + 26, cy + 0.6, 4, 2), 1))));
    o += k.S(lowerArc(cx, cy, 47, 17), k.cw);
    for (const [x, y, r] of [[82, 56, 3], [88, 44, 2], [79, 38, 1.4], [92, 64, 1.6], [12, 70, 1.8], [20, 84, 1.4]]) o += bubble(k, x, y, r);
    return o;
  },

  volley(k) {
    // a gun run out of its port fires: the muzzle with its swell and rings, a flash from the bore, a cloud of smoke
    // rolling out ahead and the ball flying clear of it
    const A = (s: number, p: number): Pt => [17 + 0.766 * s + 0.643 * p, 74 - 0.643 * s + 0.766 * p];
    // the ball and its wake
    let o = k.fine(k.S(`M${pp(A(78, -4))}L${pp(A(88, -3))}M${pp(A(76, 1))}L${pp(A(88, 1))}M${pp(A(79, 5))}L${pp(A(88, 4))}`, 1.2));
    const [bx, by] = A(96, 0);
    o += k.shape(circ(bx, by, 5.6), { fill: 'ink', sw: 1.6, hi: circ(bx - 1.8, by - 1.8, 1.6), inner: k.fine(k.S(`M${f(bx - 4)} ${f(by + 0.5)}Q${f(bx - 3.5)} ${f(by - 3.5)} ${f(bx)} ${f(by - 4)}`, 0.9, 'mid')) });
    // smoke rolling out: one big billow, two smaller ones in front
    for (const [s, p, rx, ry, n, sd] of [[66, -3, 19, 15, 9, 1], [56, 12, 10, 8, 6, 3], [52, -11, 9, 7.5, 6, 4]]) {
      const [x, y] = A(s, p);
      o += k.shape(cloud(x, y, rx, ry, n, 0.3, sd), {
        fill: 'light', sw: 2,
        h: [{ a: 40, g: 2.4, r: outside(circ(x - rx * 0.3, y - ry * 0.3, rx * 0.95, ry * 0.95)) }, { a: -50, g: 2.6, r: outside(circ(x - rx * 0.4, y - ry * 0.4, rx * 1.15, ry * 1.15)) }],
        inner: k.fine(k.S(`M${f(x - rx * 0.6)} ${f(y + ry * 0.2)}Q${f(x - rx * 0.6)} ${f(y - ry * 0.4)} ${f(x - rx * 0.1)} ${f(y - ry * 0.45)}M${f(x + rx * 0.05)} ${f(y + ry * 0.55)}Q${f(x)} ${f(y)} ${f(x + rx * 0.45)} ${f(y - ry * 0.05)}`, 1.1)),
      });
    }
    // the flash from the bore, longest forward
    const fl: number[] = [];
    for (let i = 0; i < 18; i++) {
      const a = -40 + i * 20, d = Math.cos(rad(a + 40)), r = i % 2 ? 5.5 : 9 + 14 * Math.max(0, d) ** 1.5 + (i % 4 ? 0 : 3);
      fl.push(...at(...A(40, 0), r, a));
    }
    o += k.shape(poly(...fl), { fill: 'light', sw: 2, h: [{ a: 50, g: 2.4, w: 0.8, r: outside(circ(...A(38, -3), 9)) }], inner: k.shape(star(...A(41, 0), 9, 3, 7.5, -40), { fill: 'light', sw: 1 }) });
    // the ship's side with the port, planked, the gun run out of it
    const side = 'M2 44L34 58L34 98L2 98Z';
    o += k.shape(side, {
      fill: 'mid', h: [{ a: 24, g: 2.2, w: 0.8 }, { a: -50, g: 2.8, r: 'M2 84L34 90L34 100L2 100Z' }],
      inner: k.S('M2 51L34 65M2 58L34 72M2 89L34 96M2 94L34 100', 1.2) + k.fine(k.S(grain(4, 60, 32, 68, 2, 0.6, 3), 0.7)),
    });
    o += k.shape('M2 41L35 55.4L35 59.4L2 45Z', { fill: 'mid', sw: 2, inner: k.S('M2 42.4L35 56.8', 1.2, 'light') });
    // the port: a heavy frame round a dark opening, its lid swung up on its hinges
    o += k.shape('M5 59L30 70L30 91L5 80ZM8.5 64L26.5 72L26.5 86L8.5 78Z', { fill: 'mid', sw: 1.8, h: [{ a: 24, g: 1.5, r: 'M0 76L40 92L40 100L0 100Z' }], inner: k.S('M5.6 60.2L29.4 70.8', 1.2, 'light') });
    o += k.F('M8.5 64L26.5 72L26.5 86L8.5 78Z', 'ink');
    o += k.shape('M5 59L30 70L24 52L2 44Z', { fill: 'mid', sw: 1.8, h: [{ a: 70, g: 1.8, r: 'M18 40L40 50L40 80L22 70Z' }], inner: k.S('M6 55L27 64.4M4 50L25.4 59.6', 1) + k.fine(k.F(circ(9, 57.8, 0.8) + circ(22, 63.6, 0.8), 'ink')) });
    let g = k.shape('M-4 -7.2L22 -6.2L24 -7.6L28 -7.6Q31 -9.2 34 -9.2L34 9.2Q31 9.2 28 7.6L24 7.6L22 6.2L-4 7.2Z', {
      fill: 'mid',
      h: [{ a: 0, g: 1.6, r: rect(-10, 1.4, 60, 12) }, { a: 70, g: 2, r: rect(-10, 4.4, 60, 10) }, { a: 0, g: 3, w: 0.8, fine: true, r: rect(-10, -12, 60, 5.6) }],
      inner: k.S('M-2 -3.6L21 -3.2M25 -4L33 -5', 1.8, 'light') + k.S('M8 -6.8L8 6.8M22 -6.2L22 6.2M24 -7.6L24 7.6M28 -7.6L28 7.6', 1.3),
    });
    g += k.shape(circ(34, 0, 2.6, 9.2), { fill: 'mid', sw: 1.8 }) + k.F(circ(34.6, 0, 1.4, 5), 'ink');
    o += `<g transform="translate(17 74) rotate(-40)">${g}</g>`;
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
    let o = k.shade('M30 94Q46 99 70 95.6L72 91Q52 95 30 94Z', 45, 1.4);
    o += k.shape('M66 96Q82 84 97 96Z', { fill: 'mid', sw: 1.6, inner: k.F(grains, 'ink') });
    o += k.F(circ(66, 97, 0.8) + circ(62.5, 96.5, 0.6) + circ(59, 97.4, 0.7), 'ink');
    o += k.shape('M20 22C13 40 13 68 20 86C20 89.9 30.7 93 44 93C57.3 93 68 89.9 68 86C75 68 75 40 68 22Z', {
      fill: 'mid',
      h: [{ a: 0, g: 2.4, r: 'M64 0L100 0L100 100L64 100C71 70 71 40 64 0Z' }, { a: 60, g: 3.4, w: 0.8, r: 'M0 0L24 0C18 40 18 70 24 100L0 100Z' }],
      hi: band(-0.6, -0.48),
      inner: k.S(staves, 1.1) + k.S(contour, 0.9) + k.fine(k.S(grain(24, 40, 62, 66, 7, 0.9, 4), 0.7) + k.shape(circ(38, 52, 3.2, 2.4), { fill: 'mid', sw: 1.1, h: [{ a: 45, g: 1.2 }] })),
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
    o += k.F(star(69.5, 5, 6, 1.4, 4.4, 10), 'ink') + k.F(circ(69.5, 5, 1.2), 'light') + k.fine(k.F(star(75, 9.5, 4, 0.4, 1.6, 0) + star(64, 2.8, 4, 0.3, 1.2, 45) + star(76, 3.4, 4, 0.3, 1.2, 20), 'ink'));
    return o;
  },

  souls(k) {
    const glass = 'M42 20L58 20L58 38C70 41 78 51 78 64C78 79.5 65.5 92 50 92C34.5 92 22 79.5 22 64C22 51 30 41 42 38Z';
    const glow = star(50, 66, 16, 15.5, 24, -90);
    let o = k.shade('M30 92Q50 99 82 93.4Q80 89 70 88Q54 94 30 92Z', 45, 1.4);
    o += k.shape('M41 3L59 3L57 16L43 16Z', {
      fill: 'mid', sw: 2, h: [{ a: 90, g: 1.8, r: rect(51, 0, 10, 20) }, { a: 0, g: 2.6, w: 0.8 }],
      inner: k.S('M44 5L45 14', 1.6, 'light') + k.fine(k.F(circ(48, 7, 0.6) + circ(53, 10, 0.5) + circ(50.6, 13, 0.6), 'ink')),
    });
    o += k.shape(glass, {
      fill: 'mid',
      h: [{ a: 45, g: 2.4, r: outside(glow) }, { a: -45, g: 2.6, r: outside(glow) }],
      hi: glow,
      inner: k.S('M29 58C31 49 37 44 43 42', 3.2, 'light') + k.F(circ(28.5, 66, 1.6), 'light') + k.S('M45 22L45 36', 2.2, 'light') +
        k.S('M74 64C74 77 63 88 50 88', 1.2, 'light') + k.fine(k.S('M33 78C36 83 41 86 46 87.4', 1.6, 'light') + k.S('M30 52C33 47 37 44 41 42.6', 0.8)),
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
      inner: k.F(studs, 'light') + k.S(studs, 0.9) + k.fine(k.S(`M${pp(at(cx, cy, 28.4, 200))}Q${pp(at(cx, cy, 31, 225))} ${pp(at(cx, cy, 28.4, 250))}`, 1.6, 'light')),
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
      inner: k.S('M12 26L50 56L88 26M12 78L44 52M88 78L56 50', 1.4) + k.S('M14 27.6L50 55.6', 1.2, 'light') +
        k.fine(k.S('M17 66Q19 64 21 66T25 66T29 66M17 71Q19 69 21 71T25 71T29 71T33 71', 0.9) + k.shape(poly(88, 30, 88, 78, 66, 60), { fill: 'none', sw: 0, h: [{ a: -30, g: 2.6, w: 0.7 }] })),
    });
    o += k.shape('M46 60L38 82L42.5 80L45 85L51 62Z', { fill: 'mid', sw: 1.6, h: [{ a: 70, g: 1.6 }], inner: k.fine(k.S('M45.6 64L41 78', 1, 'light')) });
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
    let o = k.shape(rect(18, 3, 64, 6), { fill: 'mid', sw: 2, h: [{ a: 0, g: 1.5, r: rect(0, 6.5, 100, 4) }], hi: rect(19, 3.6, 62, 1), inner: k.fine(k.S(grain(18, 3.6, 82, 6.6, 2, 0.5, 2), 0.7) + k.F(circ(22, 6, 0.9) + circ(78, 6, 0.9), 'ink')) });
    o += k.S('M18 6C12 6 10 10 12 13C14 15 17 13 15.6 11', 2) + k.S('M82 6C88 6 90 10 88 13C86 15 83 13 84.4 11', 2);
    o += k.S(circ(50, 14, 4.6), 2.6) + k.shape(rect(46, 17, 8, 4), { fill: 'mid', sw: 1.6 });
    let ribs = '';
    for (let u = 0.32; u < 1.0; u += 0.085 - (u - 0.3) * 0.06) ribs += `M${f(50 + 12 * u)} 20C${f(50 + 18 * u)} 31 ${f(50 + 18 * u)} 52 ${f(50 + 33 * u)} 72`;
    const hib = (u0: number, u1: number) => `M${f(50 + 12 * u0)} 20C${f(50 + 18 * u0)} 31 ${f(50 + 18 * u0)} 52 ${f(50 + 33 * u0)} 72L${f(50 + 33 * u1)} 72C${f(50 + 18 * u1)} 52 ${f(50 + 18 * u1)} 31 ${f(50 + 12 * u1)} 20Z`;
    o += k.shape('M38 21C38 17 62 17 62 21C66 23 68 30 68 40C68 54 72 64 82 72L18 72C28 64 32 54 32 40C32 30 34 23 38 21Z', {
      fill: 'mid',
      h: [{ a: 0, g: 2.2, r: 'M70 0L100 0L100 100L82 100C72 70 68 50 70 0Z' }, { a: 80, g: 2.6, w: 0.8, r: 'M60 0L100 0L100 100L74 100C64 70 60 50 60 0Z' }, { a: 40, g: 2.6, w: 0.7, fine: true, r: 'M64 0L100 0L100 100L78 100C68 70 64 50 64 0Z' }, { a: 75, g: 3.6, w: 0.8, r: rect(0, 0, 38, 100) }],
      hi: hib(-0.62, -0.44) + hib(-0.3, -0.24),
      inner: k.S(ribs, 0.95) + k.S('M33 33.5Q50 38 67 33.5M33 36.5Q50 41 67 36.5M30 58Q50 63.5 70 58', 1.3),
    });
    o += k.shape('M16 71Q50 79 84 71L85 76.5Q50 85.5 15 76.5Z', { fill: 'mid', sw: 2.2, h: [{ a: 80, g: 1.6 }, { a: 0, g: 1.8, r: rect(50, 70, 50, 20) }], inner: k.S('M18 73.6Q50 81 82 73.6', 1, 'light') });
    o += k.S('M50 84L50 92', 1.8) + k.F('M22 74.6Q50 82 78 74.6Q50 79 22 74.6Z', 'ink');
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
    let o = k.shape('M18 3L34 3L56 40L46 44Z', { fill: 'mid', sw: 2, h: [{ a: 60, g: 2.4, w: 0.9 }, { a: 0, g: 2.4, w: 0.7, fine: true, r: rect(0, 26, 100, 20) }], inner: k.S('M26 3L51 42', 3.4, 'light') + k.S('M23 3L48 43M29 3L54 41', 0.9) });
    o += k.shape('M66 3L82 3L54 44L44 40Z', { fill: 'mid', sw: 2, h: [{ a: -60, g: 1.9 }, { a: 30, g: 2.6 }], inner: k.S('M74 3L49 42', 3.4, 'light') + k.S('M71 3L46 41M77 3L52 43', 0.9) });
    o += k.S(circ(50, 38.5, 4.2), 2.8);
    const cx = 50, cy = 66;
    let beads = '';
    for (let i = 0; i < 28; i++) beads += circ(...at(cx, cy, 24.4, i * (360 / 28)), 1.05);
    o += k.shape(circ(cx, cy, 27.5), { fill: 'mid', h: [{ a: -45, g: 2.2 }, { a: 45, g: 2.2, r: outside(circ(cx - 8, cy - 8, 31)) }, { a: 0, g: 2.4, w: 0.7, fine: true, r: outside(circ(cx - 10, cy - 10, 34)) }], inner: k.F(beads, 'light') + k.fine(k.S(`M${pp(at(cx, cy, 26, 195))}Q${pp(at(cx, cy, 29.5, 225))} ${pp(at(cx, cy, 26, 255))}`, 1.4, 'light')) });
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
      inner: k.S('M4 40Q30 37 50 40.5Q72 44 96 39M4 46Q24 44 40 47Q58 49 78 45.5L96 45M4 68Q30 65 52 68Q74 71 96 66M4 76Q26 74 44 77.5Q66 80 96 74', 0.9, 'ink') + k.fine(k.S(grain(4, 49, 96, 56, 2, 0.6, 7) + grain(4, 79, 96, 86, 2, 0.6, 9), 0.7)) + k.S('M5 36.6L96 34.6M5 62.6L96 61.6', 1.2, 'light') +
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
    c += k.shape('M67 70L67 74.8Q67 78 63.8 78L59 78Q62.6 76 62.6 73.4Q65 73 67 70Z', { fill: 'mid', sw: 1.4, h: [{ a: 45, g: 1.3 }] });
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
    let rays = '';
    for (let i = 0; i < 12; i++) rays += `M${pp(at(39, 25, 6.4, i * 30))}L${pp(at(39, 25, i % 2 ? 8.2 : 9.6, i * 30))}`;
    c += k.F(circ(39, 25, 4.6), 'light') + k.S(circ(39, 25, 4.6), 1.1) + k.fine(k.S(rays, 0.9));
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
    o += k.shape(seaBand(46, 5.4, 11), {
      fill: 'mid', sw: 2.2,
      h: [{ a: 0, g: 2.4 }, { a: -25, g: 2.6, r: rect(0, 72, 100, 30) }, { a: 25, g: 2.8, w: 0.7, fine: true, r: rect(0, 84, 100, 20) }],
      inner: ghost + k.fine(k.S('M14 52L8 92M24 54L20 92M80 52L86 92', 2.2, 'mid')) + k.S(waveLine(54, 3, 9, -6, 106, 6), 1.4, 'light') + k.S(waveLine(62, 2.4, 13, -6, 106), 1, 'light'),
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
    o += k.shape(seaBand(72, 6, 12), {
      fill: 'mid', sw: 2.2,
      h: [{ a: 0, g: 2.4 }, { a: -25, g: 2.6, r: rect(0, 86, 100, 20) }, { a: 25, g: 2.8, w: 0.7, fine: true, r: rect(0, 90, 100, 20) }],
      inner: k.S(waveLine(80, 3, 10, -6, 106, 7), 1.3, 'light') + k.fine(k.S(waveLine(88, 2, 8, -6, 106, 3), 0.9, 'light')),
    });
    for (const d of ['M16 74C12 62 6 56 1 54C9 53 16 58 20 67L24 74Z', 'M62 72C68 58 80 50 92 50C84 55 76 62 70 74Z', 'M38 74C34 64 32 56 34 47C39 55 43 63 46 72Z', 'M54 72C56 64 60 59 66 56C63 61 61 67 61 73Z'])
      o += k.shape(d, { fill: 'light', sw: 1.6, h: [{ a: 60, g: 2.2, w: 0.8, r: rect(0, 66, 100, 10) }] });
    for (const [x, y, r, a] of [[8, 46, 1.6, 60], [22, 50, 2, 75], [30, 40, 1.4, 80], [86, 40, 1.8, 120], [96, 46, 1.3, 140], [78, 46, 1.5, 110], [44, 42, 1.6, 95], [62, 48, 1.2, 100]])
      o += drop(k, x, y, r, a);
    return o;
  },
};

/** The three phases of a round: one medallion with the chart's scale border (a ring of alternate dark and light bars),
 *  sea below, and the subject breaking out of it so that it still shows round an 11 mm marker laid on the icon:
 *  the compass points (Sea), the black flag (Pirates), the striped ensign of the Company. */
function phase(k: K, kind: 'sea' | 'pirates' | 'company'): string {
  const cx = 50, cy = 56, R = 35;
  let bars = '';
  for (let i = 0; i < 36; i += 2) {
    const a0 = i * 10, a1 = a0 + 10, p = (r: number, a: number) => pp(at(cx, cy, r, a));
    bars += `M${p(R, a0)}L${p(R, a1)}L${p(R - 5, a1)}L${p(R - 5, a0)}Z`;
  }
  let sea = '';
  for (let y = 66; y < 96; y += 5) sea += scallops(10, 92, y, 7, 3.4);
  let o = k.shape(circ(cx, cy, R), { fill: 'light', sw: 2.4, inner: k.F(bars, 'ink') + k.S(circ(cx, cy, R - 5), 1.6) });
  o += k.shape(circ(cx, cy, R - 5), {
    fill: 'light', sw: 0,
    h: [{ a: 0, g: 2.8, w: 0.8, r: rect(0, 0, 100, 60) }, { a: -40, g: 2.6, fine: true, r: outside(circ(cx - 6, cy - 6, R - 4)) }],
    inner: k.shape(rect(0, 64, 100, 40), { fill: 'mid', sw: 0, h: [{ a: 0, g: 2 }], inner: k.S(sea, 1.2, 'light') }) + k.S('M10 64L90 64', 1.6),
  });
  if (kind === 'sea') {
    // the compass rose behind a breaking wave; its points break the border on three sides
    o += compass(k, 50, 44, 42, 22);
    const wave = 'M14 86C18 70 30 58 46 56C60 54 70 62 68 70C66 76 58 76 57 71C56 67 60 65 62.5 67C60 62 52 63 50 70C48 80 58 88 76 88C82 86 88 82 92 80L92 96L10 96Z';
    let curls = '';
    for (const d of [4, 8, 12]) curls += `M${f(16 + d * 0.4)} ${f(88)}C${f(20 + d * 0.5)} ${f(74 + d)} ${f(32 + d * 0.3)} ${f(62 + d)} ${f(46)} ${f(59 + d)}`;
    o += `<g clip-path="${k.clip(circ(cx, cy, R - 5) + rect(0, 0, 100, 60))}">` + k.shape(wave, {
      fill: 'mid', sw: 2.2,
      h: [{ a: -30, g: 2.3 }, { a: 40, g: 2.6, r: rect(0, 78, 100, 30) }],
      hi: 'M46 57.6C58 56 67 61 67 68C64 63 56 59.5 46 59.6Z',
      inner: k.S(curls, 1, 'light'),
    }) + '</g>' + k.S(circ(cx, cy, R - 5), 1.6);
    for (const [x, y, r] of [[70, 56, 1.6], [74, 60, 1.2], [64, 53, 1.3], [78, 66, 1.1]]) o += k.shape(circ(x, y, r), { fill: 'light', sw: 1 });
    return o;
  }
  // a flag staff from below the medallion up past its top, a flag flying to the right over the border
  const top = (x: number) => 9 + 3.2 * Math.sin(((x - 27) / 66) * Math.PI * 2.2) * ((x - 27) / 66) - (x - 27) * 0.02;
  const H = 38, droop = (x: number) => (x - 27) * 0.1;
  const X1 = kind === 'pirates' ? 95 : 96;
  const edge = (y0: number, dy = 0): Pt[] => { const p: Pt[] = []; for (let x = 28; x <= X1 + 0.1; x += (X1 - 28) / 12) p.push([x, top(x) + y0 + droop(x) * (y0 / H) + dy]); return p; };
  const tE = edge(0), bE = edge(H);
  let fly = '';
  if (kind === 'pirates') {
    const a = tE[tE.length - 1], b = bE[bE.length - 1];
    fly = `L${f(a[0] - 3)} ${f(a[1] + H * 0.22)}L${f(a[0] + 1)} ${f(a[1] + H * 0.3)}L${f(a[0] - 10)} ${f((a[1] + b[1]) / 2)}L${f(b[0] + 1)} ${f(b[1] - H * 0.28)}L${f(b[0] - 3)} ${f(b[1] - H * 0.18)}`;
  }
  const flag = curve(tE) + fly + curve([...bE].reverse(), 'L') + 'Z';
  // the folds: shaded where the cloth turns away (slope of the wave), highlit on the crests
  let folds = '';
  for (let i = 0; i < 3; i++) {
    const x0 = 27 + (66 / 2.2) * (i + 0.25), x1 = x0 + 66 / 4.4;
    folds += rect(x0, 0, x1 - x0, 100);
  }
  // the staff and its finial, the halyard
  o += k.shape('M24.5 6L29.5 6L28.5 98L25.5 98Z', { fill: 'mid', sw: 2, h: k.cyl(24.5, 29.5) });
  if (kind === 'pirates') o += k.shape('M27 0.5L30 6.5L24 6.5Z', { fill: 'mid', sw: 1.6, h: [{ a: 90, g: 1.3, r: rect(27, 0, 4, 8) }] });
  else o += k.shape(circ(27, 4, 3), { fill: 'mid', sw: 1.6, h: k.round(27, 4, 3).slice(0, 1), hi: circ(26, 3, 0.9) });
  if (kind === 'pirates') {
    // the black flag, ragged at the fly, with a shot hole; a skull of our own over two crossed cutlasses
    let fl = '';
    for (let i = 0; i < 3; i++) { const x = 27 + (66 / 2.2) * (i + 0.05) + 4; fl += `M${f(x)} ${f(top(x) + 3)}C${f(x + 2)} ${f(top(x) + 14)} ${f(x - 1)} ${f(top(x) + 26)} ${f(x + 1.5)} ${f(top(x) + H - 2)}`; }
    o += k.shape(flag + circ(80, 22, 1.6) + circ(86, 34, 1.1), { fill: 'ink', sw: 2, inner: k.S(fl, 1.5, 'mid') });
    const blade = (s: number) => {
      // a curved cutlass across the flag; s = 1 from lower left to upper right, -1 mirrored about x = 58
      const X = (x: number) => (s > 0 ? x : 116 - x);
      return k.shape(`M${X(44)} 41.4C${X(55)} 39.4 ${X(67)} 33 ${X(77)} 21C${X(76)} 28 ${X(66)} 38 ${X(45)} 45.4Z`, { fill: 'light', sw: 1.4 }) +
        k.shape(`M${X(41)} 41L${X(47)} 46L${X(46)} 47.4L${X(40)} 42.4Z`, { fill: 'light', sw: 1.2 }) + k.S(`M${X(43)} 47Q${X(38)} 48 ${X(39)} 43`, 1.4, 'light');
    };
    o += blade(1) + blade(-1);
    o += k.shape('M58 14C51.5 14 48 18.4 48 23.6C48 27.4 50 29.6 52.6 30.6L53 34L63 34L63.4 30.6C66 29.6 68 27.4 68 23.6C68 18.4 64.5 14 58 14Z', {
      fill: 'light', sw: 1.4,
      h: [{ a: 50, g: 1.8, w: 0.8, fine: true, r: outside(circ(56, 21, 9.6)) }],
      inner: k.F(circ(54, 24, 2.6, 2.3) + circ(62, 24, 2.6, 2.3) + 'M58 27L56.6 30L59.4 30Z', 'ink') + k.S('M55 31.4L55 34M57 31.6L57 34M59 31.6L59 34M61 31.4L61 34', 0.9),
    });
    return o;
  }
  // the Company's ensign: red and white stripes, a canton with a cross
  const n = 9, cantonX = 52, cantonN = 5;
  let red = '';
  for (let i = 0; i < n; i += 2) {
    const a = edge((H * i) / n), b = edge((H * (i + 1)) / n);
    red += curve(a) + curve([...b].reverse(), 'L') + 'Z';
  }
  const cy0 = (H * cantonN) / n;
  const ce = (y: number) => { const e = edge(y).filter(q => q[0] < cantonX - 1); return [...e, [cantonX, top(cantonX) + y + droop(cantonX) * (y / H)] as Pt]; };
  const cross = curve(ce(cy0 / 2 - 2.8)) + curve(ce(cy0 / 2 + 2.8).reverse(), 'L') + 'Z' + `M37.2 0L42.8 0L42.8 ${f(top(40) + cy0 + 1)}L37.2 ${f(top(40) + cy0 + 1)}Z`;
  const canton = curve(ce(0)) + curve(ce(cy0).reverse(), 'L') + 'Z';
  // the 18th-century Company ensign has the Union in the canton (1707–1801): the saltire under the cross — it also keeps
  // the ensign from reading as a modern flag
  const cb = bbox(canton), sw2 = 2.2, band = (x0: number, y0: number, x1: number, y1: number) => { const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy), nx = -dy / l * sw2, ny = dx / l * sw2; return `M${f(x0 + nx)} ${f(y0 + ny)}L${f(x1 + nx)} ${f(y1 + ny)}L${f(x1 - nx)} ${f(y1 - ny)}L${f(x0 - nx)} ${f(y0 - ny)}Z`; };
  const saltire = band(cb[0] - 2, cb[1] - 2, cb[2] + 2, cb[3] + 2) + band(cb[0] - 2, cb[3] + 2, cb[2] + 2, cb[1] - 2);
  o += k.shape(flag, {
    fill: 'light', sw: 2,
    mid: red,
    h: [{ a: 80, g: 2.4, w: 0.8, r: folds }],
    inner: k.shape(canton, { fill: 'light', sw: 1.2, inner: k.shape(saltire, { fill: 'mid', sw: 0.7 }) + k.shape(cross, { fill: 'mid', sw: 1 }) + k.hatch({ a: 80, g: 2.4, w: 0.8, r: folds }, bbox(canton)) }),
  });
  return o;
}

/** the measured ink extent of the icons that touch the edge of their box (contours included, small and large mode):
 *  icon() shrinks and shifts each so that it keeps a margin of 2.5 inside 0..100 */
const EXTENT: Partial<Record<IconName, [number, number, number, number]>> = {
  sails: [1, -1, 99, 100], crew: [2, 8, 98, 102], guns: [1, 33, 101, 99], hull: [0.5, 5, 99.5, 99], fire: [0, 0, 99, 99],
  powder: [13, 1, 98.5, 98.5], souls: [20, 1, 82, 96], reaction: [0, 5, 93, 101], once: [10, 1, 94, 99], legend: [17, 1, 83, 96],
  effects: [1, 2, 99, 91], underwater: [1, 3, 99, 99], surfaced: [0, 1, 99, 99], sinking: [1, 6, 99, 97], volley: [0, 5, 97, 100],
  phaseSea: [7, 1, 93, 93], phasePirates: [13, -1, 98, 100], phaseCompany: [13, 0, 98, 100],
};
function fitted(name: IconName, body: string): string {
  const e = EXTENT[name];
  if (!e) return body;
  const [x0, y0, x1, y1] = [e[0] - 0.5, e[1] - 0.5, e[2] + 0.5, e[3] + 0.5], lo = 2.5, hi = 97.5;
  const s = Math.min(1, (hi - lo) / (x1 - x0), (hi - lo) / (y1 - y0));
  const place = (a: number, b: number) => { const c = (a + b) / 2, h = (s * (b - a)) / 2; return Math.min(Math.max(c, lo + h), hi - h) - s * c; };
  return `<g transform="translate(${f(place(x0, x1))} ${f(place(y0, y1))}) scale(${f(Math.round(s * 1e4) / 1e4)})">${body}</g>`;
}

// ---------------------------------------------------------------- API

/** An icon as an SVG <g> placed in a parent SVG whose units are mm: centre (cx, cy), size s mm (box s×s). */
export function icon(name: IconName, cx: number, cy: number, s: number, tone: IconTone = TONE.sepia): string {
  const k = new K(tone, s < 11);
  const body = fitted(name, DRAW[name](k));
  const sc = String(Math.round((s / 100) * 1e5) / 1e5);
  return `<g transform="translate(${f(cx - s / 2)} ${f(cy - s / 2)}) scale(${sc})" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round">` +
    (k.defs.length ? `<defs>${k.defs.join('')}</defs>` : '') + body + '</g>';
}

/** A standalone <svg> (for HTML), width/height in mm. */
export function iconSvg(name: IconName, s: number, tone: IconTone = TONE.sepia): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}mm" height="${s}mm" viewBox="0 0 ${s} ${s}">${icon(name, s / 2, s / 2, s, tone)}</svg>`;
}
