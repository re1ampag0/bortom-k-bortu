// 04 — the two holds and the tokens (docs/tasks/print-kit.md 3.6 with review-print 13–14 and review-player 3.1, 3.5,
// 3.7, 3.9; docs/tasks/print-kit-boards.md step 5). Portrait A4, one side.
//   sheet 1: «Трюм Пиратов», «Трюм Компании» (8 cells Ø 22 mm each and the cells «Перестроение», «Совместный залп +1»),
//            Powder × 24, Fire × 9, track markers × 17
//   sheet 2: four ship tokens 30 × 30 mm, the identical marks 11 × 11 mm (TABLE.marks and TABLE.spareMarks) and the
//            two-sided dive token «Под водой» / «Всплыл» as a pair to fold and glue (diveHtml)
//   sheet 3 (--counters strip): the four counter strips (parts/boards/v2.ts counterStripsPage)
// The «Схема боя» is a landscape sheet of its own: parts/scheme.ts → 04b-skhema-boya.pdf.
// The look is the world of the boards v2 and the battle scheme (parts/tokens-art.ts): parchment slips, brass rims and
// coins, the engraved icons of parts/icons.ts. Tokens are squares in grids without gaps: the cut lines are shared and
// run a few millimetres past the grid; nothing that matters is closer than 2 mm to a cut.
// Every plate is marked data-plate, every block of words data-in="<its plate>" (tools/print/check-layout.ts).
import fs from 'node:fs';
import path from 'node:path';
import { HERE, data, esc, type Ctx, type PageSpec, type Part } from '../kit';
import { A4, COUNTS, DECKS, HOLD, TABLE, TOKEN, type Ship } from '../layout';
import { DECK_KEY, darken } from '../colors';
import { bigShip } from '../../../src/ui/game/art/bigShips';
import { createRequire } from 'node:module';
import { ROOT } from '../kit';
import { rasterJpeg } from '../map/raster';
import { counterStripsPage } from './boards/v2';
import { measureMissing, widthOf, type TO } from './boards/frame';
import { icon, TONE, type IconTone } from './icons';
import { schemePart } from './scheme';
import { markArt } from './mark-coin';
import {
  ART_CSS, CREAM, LOOK, WELL, brassCell, brassDisc, brassRing, capWord, cartouche, deepOf, defs, flag, ico, mix, plaque, plateRect, pt, r, rivet,
  word, wordAt, type Rect, type WO
} from './tokens-art';

const require = createRequire(import.meta.url);
/** the kit ships (tools/card-art/scenes/kit): the same ships as on the card backs and the boards (--tokens new) */
const KIT = require(path.join(ROOT, 'tools/card-art/scenes/kit/index.cjs')) as {
  ship(u: string, L: unknown, o: Record<string, unknown>): string; makeLight(l: unknown, cam: { horizon: number }): unknown;
  shipBox(kind: string, o: { x: number; y: number; scale: number; flip?: boolean; wind?: number }): { x0: number; x1: number; top: number; y: number; w: number; h: number }; LIGHTS: Record<string, unknown>;
  shipGeom(kind: string, o: Record<string, unknown>): { hb: number; nearRail(X: number): [number, number] };
  splash(u: string, o: Record<string, unknown>): string; foam(u: string, o: Record<string, unknown>): string; sky(u: string, L: unknown, o: Record<string, unknown>): string; water(u: string, L: unknown, o: Record<string, unknown>): string;
  sunMoon(u: string, L: unknown, o: Record<string, unknown>): string; cloud(u: string, L: unknown, o: Record<string, unknown>): string; cloudBank(u: string, L: unknown, o: Record<string, unknown>): string;
  fog(u: string, L: unknown, o: Record<string, unknown>): string; localGlow(u: string, loc: Record<string, unknown>, o?: Record<string, unknown>): string;
  shipSilhouette(kind: string, o: Record<string, unknown>): string; mix(a: string, b: string, t: number): string; rng(seed: number): () => number;
  SHIP_SPECS: Record<string, { len: number; bow: number[] }>;
};
/** the picture part of a ship token (above its band), mm */
const PIC = { w: 30, h: 21.4 };
/** a kit ship on the token's paper, a JPEG of PIC (no CSS filters in the PDF): the plain picture of the track markers */
async function kitMarkerPics(ctx: Ctx): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const s of ships()) {
    const kind = DECK_KEY[s.code], b = KIT.shipBox(kind, { x: 0, y: 0, scale: 1 }), m = 1.2, wl = PIC.h - 1.4, k = Math.min((PIC.w - 2 * m) / b.w, (wl - m) / b.h);
    const body = KIT.ship('tk' + kind, KIT.makeLight(KIT.LIGHTS.endeavour, { horizon: wl - 2 }), { kind, x: PIC.w / 2 - k * (b.x0 + b.x1) / 2, y: wl, scale: k });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PIC.w} ${PIC.h}"><rect width="${PIC.w}" height="${PIC.h}" fill="${PAPER}"/>${body}<path d="M1 ${wl + 0.5}q1.2 -.6 2.4 0${'t2.4 0'.repeat(11)}" fill="none" stroke="#6f8a96" stroke-width=".25"/></svg>`;
    out[s.code] = (await rasterJpeg(ctx.browser, 'token-ship-' + kind, svg, PIC.w, PIC.h, ctx.opts.draft ? 300 : 600, 0.92)).url;
  }
  return out;
}

// ---- the ship tokens' pictures: the deck's ship at sea in the light of its own card back (tools/card-art/scenes/
// backs4/*.cjs, backs-pilot.cjs): the Pearl at night against the moon, the Revenge at sunset, the Endeavour by day (lit as
// on her board — the kit's day light, her ochre kept light), the Dutchman in green fog under a pale moon. The scene is in
// the kit's units, 200 wide (1 mm = 6.67 units): sky with clouds, the sea with its crests, the ship with her reflection,
// the foam along her side, her wake and the bow wave; the whole ship (mast tops, flags, bowsprit) TS.m inside the cut.
const TS = { w: 200, h: Math.round(200 * PIC.h / PIC.w * 1000) / 1000, hz: 98, wl: 107, m: 11.5 };
/** each deck: its light, the ship's side (flip: bow right), the place of the sun or moon, the sky and the sea */
interface TokenSea { flip: boolean; wind: number; seed: number; grow?: number; sky(u: string): { L: unknown; Ls: unknown; back: string; kant?: string; over?: string; front?: string } }
const tsGrad = (id: string, y0: number, y1: number, color: string, a0: number, a1: number) =>
  `<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${y0}" x2="0" y2="${y1}"><stop offset="0" stop-color="${color}" stop-opacity="${a0}"/><stop offset="1" stop-color="${color}" stop-opacity="${a1}"/></linearGradient></defs><rect x="-10" y="${y0}" width="${TS.w + 20}" height="${R(y1 - y0)}" fill="url(#${id})"/>`;
const tsVignette = (id: string, cx: number, cy: number, color: string, a: number) =>
  `<defs><radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="150"><stop offset=".55" stop-color="${color}" stop-opacity="0"/><stop offset="1" stop-color="${color}" stop-opacity="${a}"/></radialGradient></defs><rect x="-10" y="-10" width="${TS.w + 20}" height="${R(TS.h + 20)}" fill="url(#${id})"/>`;
/** a long thin streak of sunset cloud lit from below by the low sun (backs4/revenge.cjs streak) */
function tsStreak(id: string, sun: { x: number; y: number }, o: { x: number; y: number; w: number; h: number; seed: number; lit: string; dark: string; op: number; blur: number }): string {
  const x0 = o.x - o.w / 2, rnd = KIT.rng(o.seed), top: number[][] = [], bot: number[][] = [];
  for (let i = 0; i <= 12; i++) { const t = i / 12, x = x0 + o.w * t, e = Math.sin(Math.PI * t), wob = (rnd() - 0.5) * o.h * 0.5; top.push([x, o.y - o.h * e * (0.7 + rnd() * 0.5) + wob * 0.4]); bot.unshift([x, o.y + o.h * 0.35 * e + wob * 0.2]); }
  const d = 'M' + top.concat(bot).map(p => `${R(p[0])} ${R(p[1])}`).join('L') + 'Z', lx = Math.sign(sun.x - o.x) || 1;
  return `<defs><linearGradient id="${id}g" gradientUnits="userSpaceOnUse" x1="${R(o.x + lx * o.w * 0.1)}" y1="${R(o.y + o.h * 0.4)}" x2="${R(o.x - lx * o.w * 0.05)}" y2="${R(o.y - o.h)}"><stop offset="0" stop-color="${o.lit}" stop-opacity="${o.op}"/><stop offset=".35" stop-color="${KIT.mix(o.lit, o.dark, 0.55)}" stop-opacity="${R(o.op * 0.95)}"/><stop offset="1" stop-color="${o.dark}" stop-opacity="${R(o.op * 0.85)}"/></linearGradient>`
    + `<filter id="${id}b" filterUnits="userSpaceOnUse" x="${R(x0 - 10)}" y="${R(o.y - o.h * 2 - 10)}" width="${R(o.w + 20)}" height="${R(o.h * 3 + 20)}"><feGaussianBlur stdDeviation="${o.blur}"/></filter></defs><path d="${d}" fill="url(#${id}g)" filter="url(#${id}b)"/>`;
}
type SeaLight = { pal: { sea: string[]; sky: string[] }; shadowTint: string; keyColor: string };
/** one near swell seen from the side (backs.cjs swellCrest): the back lit by the sky, the face in shadow with light
 *  through its thin top, a lace of foam along the crest and streaks down the back; it dies out at both ends */
function tsSwell(id: string, Lx: unknown, o: { x: number; y: number; w: number; h: number; seed: number; lean: number; foam: number }): string {
  const L = Lx as SeaLight, { x, y, w, h } = o, rnd = KIT.rng(o.seed), P = L.pal, x0 = x - w / 2, x1 = x + w / 2, px = x + o.lean * w * 0.18, py = y - h, th = h * 1.3;
  const top = KIT.mix(P.sea[0], P.sky[3], 0.35), face = KIT.mix(P.sea[1], P.sea[2], 0.35), deep = KIT.mix(P.sea[2], L.shadowTint, 0.25), glow = KIT.mix(P.sea[0], '#bfeee0', 0.45), foam = KIT.mix('#f6fcff', L.keyColor, 0.3);
  const ridge = `M${R(x0)} ${R(y)}C${R(x0 + w * 0.25)} ${R(y - h * 0.15)} ${R(px - w * 0.2)} ${R(py)} ${R(px)} ${R(py)}C${R(px + w * 0.1)} ${R(py)} ${R(px + w * 0.16)} ${R(y - h * 0.45)} ${R(x1)} ${R(y + h * 0.25)}`;
  const body = ridge + `L${R(x1)} ${R(y + th)}C${R(x + w * 0.2)} ${R(y + th * 1.15)} ${R(x - w * 0.2)} ${R(y + th * 0.85)} ${R(x0)} ${R(y + th)}Z`;
  let lace = '';
  for (let i = 0, n = Math.round(46 * o.foam); i < n; i++) {
    const xx = x0 + w * (0.25 + rnd() * 0.6), near = 1 - Math.min(1, Math.abs(xx - px) / (w * 0.32)), yy = py + (1 - near) * h * 0.55 + (rnd() - 0.3) * 1.6, rr = (0.35 + rnd() * 0.9) * (0.5 + near) * (0.4 + 0.6 * o.foam);
    if (near > 0) lace += `<ellipse cx="${R(xx)}" cy="${R(yy)}" rx="${R(rr * (1.3 + rnd()))}" ry="${R(rr * 0.6)}" opacity="${R(0.45 + rnd() * 0.5)}"/>`;
  }
  for (let i = 0, n = Math.round(7 * o.foam); i < n; i++) { const sx = px - w * (0.05 + rnd() * 0.3), sy = py + h * (0.25 + rnd() * 0.5), l = w * (0.08 + rnd() * 0.14); lace += `<path d="M${R(sx)} ${R(sy)}q${R(-l / 2)} ${R(h * 0.12)} ${R(-l)} ${R(h * 0.28)}" stroke="${foam}" stroke-width="${R(0.3 + rnd() * 0.35)}" fill="none" opacity="${R(0.35 + rnd() * 0.3)}"/>`; }
  return `<defs><linearGradient id="${id}g" gradientUnits="userSpaceOnUse" x1="0" y1="${R(py)}" x2="0" y2="${R(y + th)}"><stop offset="0" stop-color="${top}" stop-opacity=".95"/><stop offset=".35" stop-color="${face}" stop-opacity=".9"/><stop offset=".75" stop-color="${deep}" stop-opacity=".55"/><stop offset="1" stop-color="${deep}" stop-opacity="0"/></linearGradient>`
    + `<radialGradient id="${id}w" gradientUnits="userSpaceOnUse" cx="${R(px + w * 0.05)}" cy="${R(py + h * 0.45)}" r="${R(w * 0.22)}"><stop offset="0" stop-color="${glow}" stop-opacity=".55"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient>`
    + `<filter id="${id}l" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation=".35"/></filter>`
    + `<linearGradient id="${id}n" gradientUnits="userSpaceOnUse" x1="${R(x0)}" y1="0" x2="${R(x1)}" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".22" stop-color="#fff"/><stop offset=".72" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`
    + `<mask id="${id}m" maskUnits="userSpaceOnUse" x="${R(x0 - 2)}" y="${R(py - 6)}" width="${R(w + 4)}" height="${R(h + th + 12)}"><rect x="${R(x0 - 2)}" y="${R(py - 6)}" width="${R(w + 4)}" height="${R(h + th + 12)}" fill="url(#${id}n)"/></mask></defs>`
    + `<g mask="url(#${id}m)"><path d="${body}" fill="url(#${id}g)"/><path d="${body}" fill="url(#${id}w)"/><path d="${ridge}" fill="none" stroke="${KIT.mix(top, '#ffffff', 0.4)}" stroke-width=".7" opacity=".7" stroke-linecap="round"/><g fill="${foam}" filter="url(#${id}l)">${lace}</g></g>`;
}
/** the ship's reflection torn by the ripples (backs.cjs brokenReflection): her group under a mask of short soft dashes
 *  in the rows y0..y1, so each band of the reflection breaks into pieces with the water showing in the breaks */
function tsBroken(id: string, body: string, o: { x0: number; x1: number; y0: number; y1: number; seed: number }): string {
  const rnd = KIT.rng(o.seed);
  let cuts = '';
  for (let y = o.y0 + rnd() * 0.6; y < o.y1; y += 0.9 + rnd() * 0.9) {
    const t = (y - o.y0) / (o.y1 - o.y0);
    for (let x = o.x0 - rnd() * 20; x < o.x1;) { const l = 2.5 + rnd() * (6 + 12 * t), gap = 5 + rnd() * (22 - 12 * t); cuts += `<rect x="${R(x)}" y="${R(y)}" width="${R(l)}" height="${R(0.5 + rnd() * (0.7 + t * 0.6))}" rx=".4" opacity="${R(0.55 + rnd() * 0.45)}"/>`; x += l + gap; }
  }
  return `<defs><filter id="${id}b" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation=".35"/></filter><mask id="${id}m" maskUnits="userSpaceOnUse" x="-40" y="-40" width="280" height="240"><rect x="-40" y="-40" width="280" height="240" fill="#fff"/><g fill="#000" filter="url(#${id}b)">${cuts}</g></mask></defs><g mask="url(#${id}m)">${body}</g>`;
}
const TOKEN_SEAS: Record<string, TokenSea> = {
  // night: the moon upper left over the bowsprit, the black ship against a moonlit sky, a silver kant on her edges
  pearl: { flip: false, wind: -1, seed: 3, sky: u => {
    const base = KIT.LIGHTS.pearl as { key: Record<string, unknown>; fill: Record<string, number>; rim: Record<string, unknown> }, MOON = { x: 27, y: 25 };
    const light = { ...base, key: { type: base.key.type, color: base.key.color, power: base.key.power, x: MOON.x, y: MOON.y }, fill: { ...base.fill, power: base.fill.power * 0.5 }, rim: { ...base.rim, power: 0.75 } };
    const L = KIT.makeLight(light, { horizon: TS.hz });
    const Ls = KIT.makeLight({ ...light, key: { ...light.key, power: (light.key.power as number) * 0.55 }, fill: { ...light.fill, power: light.fill.power * 0.6 }, rim: { ...light.rim, power: 0.9 } }, { horizon: TS.hz });
    const back = KIT.sky(u, L, { horizon: TS.hz, stars: 46, seed: 4 }) + KIT.sunMoon(u, L, { r: 7.5 })
      + KIT.cloud(u, L, { x: 150, y: 62, w: 96, h: 18, seed: 9, far: 0.55 }) + KIT.cloudBank(u, L, { y: TS.hz - 2, h: 8, x0: -30, x1: 230, n: 6, seed: 11, far: 0.8 })
      + KIT.localGlow(u, { x: 70, y: 52, color: '#cfe0ff', power: 0.42, radius: 92 }, { core: false })
      + KIT.water(u, L, { horizon: TS.hz, bottom: TS.h + 6, swell: 1, seed: 6, glitter: MOON.x })
      + tsGrad(u + 'gw', TS.wl + 14, TS.h, '#060a16', 0, 0.4);
    return { L, Ls, back, kant: '#c4d4f2', over: '#16130f', front: tsVignette(u + 'vg', 100, 60, '#05070e', 0.45) };
  } },
  // sunset: the sun low on the left behind her stern, the fiery sky streaked with cloud, a hot kant on her edges
  revenge: { flip: true, wind: 1, seed: 5, sky: u => {
    const base = KIT.LIGHTS.revenge as Record<string, unknown>, SUN = { x: 15, y: 79 };
    const light = { ...base, haze: 0.5, key: { type: 'sun', color: '#ffb468', power: 1, x: SUN.x, y: SUN.y }, fill: { color: '#7a3448', power: 0.4 }, rim: { az: 300, color: '#ffc27a', power: 0.8 } };
    const pal = { sky: ['#2c0a0e', '#7c1a16', '#d4482a', '#ffb45e'], sea: ['#e0844a', '#6e2420', '#1c0a0e'], cloudLit: '#ffa060', cloudShade: '#4a1420' };
    const L = KIT.makeLight(light, { horizon: TS.hz }) as { pal: Record<string, unknown> }, Ls = KIT.makeLight({ ...light, key: { ...light.key, power: 0.8 }, rim: { ...light.rim, power: 0.95 } }, { horizon: TS.hz }) as { pal: Record<string, unknown> };
    L.pal = { ...L.pal, ...pal }; Ls.pal = L.pal;
    let back = KIT.sky(u, L, { horizon: TS.hz, stars: false, seed: 13 });
    for (const [x, y, w, h, sd] of [[150, 18, 120, 3.6, 3], [60, 32, 100, 3, 4], [150, 48, 110, 3.2, 5], [80, 62, 100, 2.6, 6], [175, 72, 80, 2.2, 7], [120, 84, 90, 1.8, 9]]) {
      const near = 1 - Math.min(1, Math.hypot(x - SUN.x, y - SUN.y) / 170), hi = 1 - y / TS.hz;
      back += tsStreak(`${u}st${sd}`, SUN, { x, y, w, h, seed: sd, lit: KIT.mix('#ff8a48', '#ffe0a0', near * 0.7), dark: KIT.mix('#4a1018', '#8a2a24', 1 - hi), op: R(0.55 + 0.3 * hi), blur: R(0.5 + hi * 0.6) });
    }
    back += KIT.sunMoon(u, L, { r: 7 }) + KIT.cloudBank(u, L, { y: TS.hz - 1, h: 7, x0: -30, x1: 230, n: 7, seed: 41, far: 0.55 })
      + KIT.water(u, L, { horizon: TS.hz, bottom: TS.h + 6, swell: 1, seed: 6, glitter: SUN.x })
      + tsGrad(u + 'gw', TS.wl + 14, TS.h, '#14060a', 0, 0.4);
    return { L, Ls, back, kant: '#ffc477', front: KIT.localGlow(u, { x: SUN.x, y: SUN.y, color: '#ffc080', power: 0.3, radius: 40 }, { core: false }) + tsVignette(u + 'vg', 110, 70, '#16050a', 0.45) };
  } },
  // a clear day: the sun high behind the viewer on the right (the kit's day light, as on her board), cumulus, the light sea
  endeavour: { flip: false, wind: -1, seed: 4, grow: 1.05, sky: u => {
    const L = KIT.makeLight(KIT.LIGHTS.endeavour, { horizon: TS.hz }) as { pal: { sky: string[] } };
    const back = KIT.sky(u, L, { horizon: TS.hz, stars: false, seed: 5 }) + tsGrad(u + 'zn', -10, 60, '#1f4a7e', 0.5, 0)
      + KIT.cloud(u, L, { x: 34, y: 40, w: 60, h: 16, seed: 7, far: 0.3 }) + KIT.cloud(u, L, { x: 176, y: 30, w: 50, h: 12, seed: 13, far: 0.45 })
      + KIT.cloudBank(u, L, { y: TS.hz - 1.5, h: 9, x0: -30, x1: 230, n: 7, seed: 5, far: 0.85 })
      + KIT.water(u, L, { horizon: TS.hz, bottom: TS.h + 6, swell: 1, seed: 9 })
      + tsGrad(u + 'gw', TS.wl + 14, TS.h, '#082436', 0, 0.35);
    return { L, Ls: L, back, front: tsVignette(u + 'vg', 100, 60, '#0a2238', 0.3) };
  } },
  // green fog: a pale moon upper left behind her high stern, shafts of moonlight, banks of mist, a pale green kant
  dutch: { flip: true, wind: 1, seed: 6, sky: u => {
    const base = KIT.LIGHTS.dutchman as { key: Record<string, unknown>; fill: Record<string, number> }, MOON = { x: 26, y: 24 };
    const light = { ...base, key: { ...base.key, x: MOON.x, y: MOON.y, power: 0.65 }, fill: { ...base.fill, power: base.fill.power * 0.7 }, rim: { az: 340, color: '#cff6e2', power: 0.8 } };
    const L = KIT.makeLight(light, { horizon: TS.hz });
    let shafts = '';
    for (const [a, b, c, d] of [[8, 16, 14, 34], [18, 26, 46, 62], [30, 38, 84, 96]]) shafts += `<path d="M${MOON.x + a} ${MOON.y + 4}L${MOON.x + b} ${MOON.y + 4}L${MOON.x + d} ${TS.hz + 6}L${MOON.x + c} ${TS.hz + 6}Z" fill="url(#${u}sh)"/>`;
    const back = KIT.sky(u, L, { horizon: TS.hz, stars: 20, seed: 8 }) + tsGrad(u + 'zn', -10, 50, '#040b09', 0.6, 0) + KIT.sunMoon(u, L, { r: 7.5, seed: 3 })
      + KIT.cloud(u, L, { x: 150, y: 46, w: 90, h: 14, seed: 12, far: 0.45 }) + KIT.cloudBank(u, L, { y: TS.hz - 2, h: 8, x0: -30, x1: 230, n: 6, seed: 19, far: 0.85 })
      + `<defs><linearGradient id="${u}sh" gradientUnits="userSpaceOnUse" x1="${MOON.x}" y1="${MOON.y}" x2="${MOON.x + 80}" y2="${TS.hz + 10}"><stop offset="0" stop-color="#cff6e2" stop-opacity=".26"/><stop offset=".6" stop-color="#9fd0bc" stop-opacity=".1"/><stop offset="1" stop-color="#9fd0bc" stop-opacity="0"/></linearGradient><filter id="${u}sb" filterUnits="userSpaceOnUse" x="-40" y="-20" width="300" height="200"><feGaussianBlur stdDeviation="2.6"/></filter></defs>`
      + `<g filter="url(#${u}sb)" style="mix-blend-mode:screen">${shafts}</g>`
      + KIT.water(u, L, { horizon: TS.hz, bottom: TS.h + 6, swell: 0.9, seed: 12, glitter: MOON.x }) + KIT.fog(u, L, { y: TS.hz - 14, h: 24, density: 0.5, seed: 4 })
      + tsGrad(u + 'gw', TS.wl + 14, TS.h, '#030a08', 0, 0.45);
    return { L, Ls: L, back, kant: '#c8f0dc',
      front: KIT.fog(u, L, { y: TS.wl + 4, h: 14, density: 0.28, seed: 9 }) + KIT.localGlow(u, { x: 100, y: TS.wl + 4, color: '#7fe3c0', power: 0.18, radius: 70 }, { squash: 0.25, core: false }) + tsVignette(u + 'vg', 100, 60, '#020806', 0.5) };
  } }
};
/** the ship of a token picture: the deck's ship fitted TS.m inside the cut (left, right, top) above the waterline TS.wl;
 *  grow — the kit's box is roomier round some ships than their drawing (measured: the Endeavour's top is 0.7 mm lower) */
export function tokenShip(kind: string): Record<string, unknown> & { x: number; scale: number } {
  const sea = TOKEN_SEAS[kind], b = KIT.shipBox(kind, { x: 0, y: 0, scale: 1, flip: sea.flip, wind: sea.wind }), k = Math.min((TS.w - 2 * TS.m) / b.w, (TS.wl - TS.m) / b.h) * (sea.grow ?? 1);
  return { kind, x: R(TS.w / 2 - k * (b.x0 + b.x1) / 2), y: TS.wl, scale: R(k), flip: sea.flip, wind: sea.wind, sails: 'full', seed: sea.seed };
}
/** the whole picture of a ship token, an SVG of TS.w × TS.h units (PIC mm) */
export function tokenSceneSvg(kind: string): string {
  const u = 'ts' + kind.slice(0, 2), sea = TOKEN_SEAS[kind], sc = sea.sky(u), po = { ...tokenShip(kind), wake: true, reflect: true, lights: true };
  const sp = KIT.SHIP_SPECS[kind], dir = sea.flip ? -1 : 1, k = po.scale, x = po.x, wl = TS.wl;
  const stem = x + dir * k * (2 - sp.len / 2 - sp.bow[0]), stern = x + dir * k * (sp.len / 2 + 2);
  const sil = (c: string, s: string) => KIT.shipSilhouette(kind, { ...po, color: c, u: u + s });
  let s = sc.back;
  // near swells, bigger towards us, their crests lit, a lace of foam on them; the nearest at the sides, clear of her reflection
  for (const [sx, sy, sw, sh, sd, fm] of [[150, 117, 30, 1.6, 7, 0.3], [52, 121, 32, 1.9, 8, 0.3], [112, 129, 34, 2.2, 9, 0.25], [24, 131, 46, 3.2, 3, 0.55], [178, 138, 44, 3, 4, 0.5], [92, 142, 40, 2.6, 5, 0.35]])
    s += tsSwell(`${u}w${sd}`, sc.L, { x: sx, y: sy, w: sw, h: sh, seed: sd, lean: 0.25, foam: fm });
  // the wake: two arms of foam lace running back from her stern, the far one towards the horizon, the near one to us
  for (let i = 0; i < 4; i++) {
    const ax = stern + dir * (5 + i * 12);
    s += KIT.foam(u, { x: R(ax), y: R(wl - 0.4 - i * 0.9), w: R(15 - i * 2.2), h: R(1.1 - i * 0.15), seed: 11 + i, L: sc.L })
      + KIT.foam(u, { x: R(ax + dir * 3), y: R(wl + 2 + i * 2.4), w: R(16 - i * 2), h: R(1.3 - i * 0.15), seed: 21 + i, L: sc.L });
  }
  // the kant of the moon or the low sun (backs-pilot.cjs): the silhouette in pale light shifted towards the source, a thin ring round her outline
  if (sc.kant) {
    const src = (sc.L as { source?: { x: number; y: number } }).source ?? { x: 100, y: 0 }, dx = Math.sign(src.x - x) * 0.9;
    s += `<defs><filter id="${u}dl" filterUnits="userSpaceOnUse" x="-60" y="-60" width="320" height="300"><feMorphology operator="dilate" radius="1"/></filter>`
      + `<mask id="${u}mk" maskUnits="userSpaceOnUse" x="-60" y="-60" width="320" height="300"><g filter="url(#${u}dl)">${sil('#ffffff', 'd')}</g>${sil('#000000', 'e')}</mask></defs>`
      + `<g mask="url(#${u}mk)"><g transform="translate(${R(dx)} -.7)">${sil(sc.kant, 'm')}</g></g>`;
  }
  // the ship, her reflection torn by the ripples
  s += tsBroken(u + 'rk', KIT.ship(u, sc.Ls, po), { x0: 0, x1: 200, y0: wl + 2.4, y1: wl + 30, seed: 21 });
  if (sc.over) s += `<g style="mix-blend-mode:multiply" opacity=".66">${sil(sc.over, 's')}</g>`;
  if (kind === 'revenge') s += `<defs><clipPath id="${u}sc"><rect x="-20" y="-20" width="240" height="${wl - 10 + 20}"/></clipPath></defs><g clip-path="url(#${u}sc)" style="mix-blend-mode:multiply" opacity=".5">${sil('#c4544c', 's2')}</g>`;
  // the bow wave and the foam along her side: she runs before the wind
  s += KIT.splash(u, { x: R(stem - dir * 1.5), y: wl, w: 15, h: 8.5, seed: 5, L: sc.L, wind: sea.wind }) + KIT.foam(u, { x: R(stem - dir * 15), y: wl + 0.4, w: 30, h: 1.8, seed: 3, L: sc.L });
  s += sc.front ?? '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TS.w} ${TS.h}">${s}</svg>`;
}
async function kitTokenPics(ctx: Ctx): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const s of ships()) out[s.code] = (await rasterJpeg(ctx.browser, 'token-sea-' + DECK_KEY[s.code], tokenSceneSvg(DECK_KEY[s.code]), PIC.w, PIC.h, ctx.opts.draft ? 300 : 600, 0.92)).url;
  return out;
}

interface HoldText { side: 'pirates' | 'company'; name: string; rule: string }
const TXT = JSON.parse(fs.readFileSync(path.join(HERE, 'text/tokens.json'), 'utf8')) as {
  partTitle: string; title: string; lead: string; hint: string; footer: string; holds: HoldText[];
  powder: string; fire: string; markers: string; underwaterCaption: string; underwaterFold: string; underwater: { title: string; lines: string[] };
  page: string; holdCells: { regroup: string[]; joint: string[] };
  marksPage: { title: string; lead: string; ships: string; marks: string; uses: string[]; sweep: string };
  strips: { title: string; lead: string };
};
/** the two sides of the dive token (text/boards.json → frame): the words of each side moved here from the Dutchman's board
 *  (boards v7, item 3) — the face «Под водой», the back «Всплыл» */
const BTXT = (JSON.parse(fs.readFileSync(path.join(HERE, 'text/boards.json'), 'utf8')) as { frame: { underwater: { title: string; note: string }; surfaced: { title: string; note: string } } }).frame;
const fill = (s: string, v: Record<string, number | string>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? `{${k}}`));

// ---- colours of this part
const PAPER = '#fbf6ea';        // the light ground of the token pictures (the kit ships)
const GROUND = '#f8f0dc';       // the light ground of the Powder, Fire and mark grids and of the holds
const SIDE_INK = { pirates: '#2b2420', company: darken('#8a6520', 0.4) };
const CUT = '#8c8c8c';          // cut lines on light grounds
const CUT_ON_DARK = '#e6e1d6';  // the same lines between two dark tokens
const CUT_W = 0.25;
/** numbers in empty hold cells: decoration, seen until a token covers them */
const FAINT = '#9a8458';
/** the field of the Fire coin: warm red-orange, so Fire and the cream Powder coins differ from across the table */
const FIRE_FIELD = '#ec8a52';
/** the engraved icons: sepia on parchment, the fire in red, the Souls in teal */
const SOUL_TONE: IconTone = { ink: '#0f3a33', mid: '#3f9a88', light: '#e6f6f1', paper: '#cfeee6' };
/** How far a cut line runs past its grid into the margin. */
const TICK = 4;

// ---- geometry of the sheets, mm
const HOLD_ROW = HOLD.cells * HOLD.cell + (HOLD.cells - 1) * HOLD.gap;            // 190
/** The cut line is 8 mm from the sheet edge; the cells start 2 mm inside it. The head of a hold (above sep) carries the
 * name, the rule and the two cells «Перестроение», «Совместный залп +1» (TABLE.cell) at cellY. */
const HOLD_BOX = { x: (A4.w - HOLD_ROW) / 2 - 2, y: 28, w: HOLD_ROW + 4, h: 46, cy: 30.6, pad: 2, tick: 3, sep: 18.1, cellY: 3.5 };
/** Captions stand CAP mm above their grid (clear of the grid's cut ticks); GAP — from the ticks of one grid to the next caption. */
const CAP = 8.8, GAP = 5;
const POWDER = { cols: 8, rows: 3, x: (A4.w - 8 * TOKEN.powder) / 2, y: HOLD_BOX.y + 2 * HOLD_BOX.h + GAP + CAP };
const FIRE = { cols: 9, rows: 1, x: (A4.w - 9 * TOKEN.fire) / 2, y: POWDER.y + 3 * TOKEN.powder + GAP + CAP };
/** Markers: 8 in the first row (Ж, М), 9 in the second (И, Г and the Soul marker), centred (the dive token is on sheet 2). */
const MARK = { x: (A4.w - 9 * TOKEN.marker) / 2, y: FIRE.y + TOKEN.fire + GAP + CAP, perRow: 8 };
// sheet 2
const SHIPS = { x: (A4.w - 4 * TOKEN.shipToken) / 2, y: 42 };
const MARKS = { cols: TABLE.marksPerRow, rows: (TABLE.marks + TABLE.spareMarks) / TABLE.marksPerRow, x: (A4.w - TABLE.marksPerRow * TOKEN.marker) / 2, y: SHIPS.y + TOKEN.shipToken + GAP + 4 + CAP };
/** the page header (a cartouche) and the footer line */
const HEAD = { x: 10, y: 5, w: 190, h: 19 };
const FOOT_Y = 286.2;

const ships = (): Ship[] => DECKS.map(code => data.ships.find(s => s.code === code)!);
const R = (n: number) => Math.round(n * 1000) / 1000;
const W = (s: string, size: number, o: TO = {}) => widthOf(s, size, o);

/** Cut lines of a grid cols × rows of cells w × h at (x, y): every line is shared and runs tick mm past the grid. */
const gridCuts = (x: number, y: number, cols: number, rows: number, w: number, h: number, tick = TICK): string => {
  let d = '';
  for (let c = 0; c <= cols; c++) d += `M${R(x + c * w)} ${R(y - tick)}V${R(y + rows * h + tick)}`;
  for (let rr = 0; rr <= rows; rr++) d += `M${R(x - tick)} ${R(y + rr * h)}H${R(x + cols * w + tick)}`;
  return `<path d="${d}" stroke="${CUT}" stroke-width="${CUT_W}" fill="none"/>`;
};
const cutLayer = (inner: string) => `<svg class="tk-cut" viewBox="0 0 ${A4.w} ${A4.h}" style="position:absolute;left:0;top:0;width:${A4.w}mm;height:${A4.h}mm">${inner}</svg>`;
const pageSvg = (inner: string) => `<svg class="tk-svg" viewBox="0 0 ${A4.w} ${A4.h}">${inner}</svg>`;

// ---- the page header and footer (also on the strips page of v2) ----
const TITLE_O: WO = { font: 'Alegreya SC', w: 800, size: 22, lh: 9.85, color: LOOK.ink };
const LEAD_O: WO = { font: 'Alegreya', italic: true, w: 400, size: 9.5, lh: 4.1, color: '#3f2f1c' };
const TAG_O: WO = { w: 700, size: 8, lh: 3, ls: '.1em', upper: true, color: LOOK.engrave };
const FOOT_O: WO = { w: 500, size: 7, lh: 2.8, ls: '.09em', upper: true, color: '#6b5a42' };
function head(id: string, title: string, lead: string, tag: string): string {
  const b = HEAD, cy = b.y + 6.5, tw = W(tag.toUpperCase(), TAG_O.size, { w: TAG_O.w, ls: TAG_O.ls }), pw = tw + 7.4;
  const pb = { x: b.x + b.w - 3.4 - pw, y: cy - 3.2, w: pw, h: 6.4 };
  const svg = defs(id) + cartouche('head', b, id) + plaque('head-tag', pb, id)
    // a brass rule under the title, a lozenge at its end
    + `<path d="M${r(b.x + 4)} ${r(b.y + 10.95)}H${r(b.x + 4 + W(title, TITLE_O.size, { font: TITLE_O.font, w: 800 }))}" stroke="${LOOK.brass[1]}" stroke-width=".45"/>`;
  return pageSvg(svg)
    + wordAt('head', b.x + 4, cy, title, TITLE_O)
    + wordAt('head-tag', pb.x + pw / 2, cy, tag, { ...TAG_O, anchor: 'middle' })
    + word('head', b.x + 4.2, b.y + 11.5, lead, LEAD_O);
}
function foot(n: number, of: number): string {
  const s = fill(TXT.footer, { n, of }), tw = W(s.toUpperCase(), FOOT_O.size, { w: FOOT_O.w, ls: FOOT_O.ls }), x = 12, x1 = x + tw + 3;
  const svg = plateRect('foot', { x: 9, y: FOOT_Y - 3, w: 192, h: 6 })
    + `<path d="M${r(x1)} ${FOOT_Y}H196" stroke="${LOOK.brass[1]}" stroke-width=".3"/><path d="M196 ${r(FOOT_Y - 1)}L197.2 ${FOOT_Y}L196 ${r(FOOT_Y + 1)}L194.8 ${FOOT_Y}Z" fill="${LOOK.brass[1]}"/>`;
  return pageSvg(svg) + wordAt('foot', x, FOOT_Y, s, FOOT_O);
}

// ---- captions over the grids: a small sign and the words ----
const CAP_O: WO = { font: 'Alegreya', w: 700, size: 10, lh: 4.2, color: LOOK.ink };
function caption(pid: string, x: number, gridY: number, s: string, sign: string): { svg: string; html: string } {
  const cy = gridY - 6.7, tx = x + 6.2, tw = W(s, CAP_O.size, { font: CAP_O.font, w: 700 });
  return {
    svg: plateRect(pid, { x: x - 1.6, y: cy - 3.7, w: tx - x + tw + 3.2, h: 7.4 }) + `<g data-plate="${pid}-sign">${sign}</g>`,
    html: wordAt(pid, tx, cy, s, CAP_O)
  };
}
const capSign = (x: number, gridY: number) => ({ cx: x + 2.3, cy: gridY - 6.7 });

// ---- holds ----
/** Перестроение: the two ships change places (own engraved line drawing, 24 units) */
const REGROUP = '<path d="M4 8.5H18.5M15 5L18.5 8.5L15 12M20 15.5H5.5M9 12L5.5 15.5L9 19"/>';
const lineIcon = (body: string, cx: number, cy: number, s: number, color: string, sw = 1.7) =>
  `<g transform="translate(${r(cx - s / 2)} ${r(cy - s / 2)}) scale(${r(s / 24)})" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${body}</g>`;
/** a cell for one mark (TABLE.cell), the sign of what it counts engraved faintly inside: an inline SVG (its own plate) */
function markCell(pid: string, id: string, inner: (c: number) => string): string {
  const c = TABLE.cell;
  return `<svg data-plate="${pid}" viewBox="-.2 -.2 ${c + 0.8} ${c + 0.8}" style="width:${r(c + 0.8)}mm;height:${r(c + 0.8)}mm;margin:-.2mm -.6mm -.6mm -.2mm;flex:none;display:block">${brassCell(pid + '-r', 0, 0, c, id, { inner: inner(c) })}</svg>`;
}
const HC_B: WO = { w: 700, size: 9, lh: 3.6, color: LOOK.ink, align: 'right' };
function holdHtml(t: HoldText, i: number, rule: string, id: string): { svg: string; html: string } {
  const { x, w, h, cy, pad, sep, cellY } = HOLD_BOX, y = HOLD_BOX.y + i * h, side = t.side, ink = SIDE_INK[side], pid = `hold-${i}`, cr = HOLD.cell / 2;
  const svg: string[] = [];
  // the parchment, its double rule; the plate is the outer rule (1.2 mm inside the cut)
  svg.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${GROUND}"/>`);
  svg.push(`<rect data-plate="${pid}" x="${r(x + 1.2)}" y="${r(y + 1.2)}" width="${r(w - 2.4)}" height="${r(h - 2.4)}" rx="1.2" fill="url(#${id}paper)" fill-opacity=".55" stroke="${LOOK.paperLine}" stroke-opacity=".6" stroke-width=".25"/>`);
  svg.push(`<rect x="${r(x + 2)}" y="${r(y + 2)}" width="${r(w - 4)}" height="${r(h - 4)}" rx=".8" fill="none" stroke="${LOOK.paperLine}" stroke-opacity=".5" stroke-width=".16"/>`);
  svg.push(`<path d="M${r(x + 3.6)} ${r(y + sep)}H${r(x + w - 3.6)}" stroke="${ink}" stroke-opacity=".5" stroke-width=".25"/>`);
  // the name and the side's flag after it
  const nameO: WO = { font: 'Alegreya SC', w: 800, size: 15, lh: 6, color: ink, ls: '.03em' }, nw = W(t.name, 15, { font: 'Alegreya SC', w: 800, ls: '.03em' });
  const fx = x + 4.2 + nw + 3.2;
  svg.push(flag(side, fx, y + 10.4, 1, 7.8, `${id}fl${i}`, `${pid}-flag`));
  // the eight cells: a brass ring round a recessed well, the number engraved faintly
  const html: string[] = [];
  for (let k = 0; k < HOLD.cells; k++) {
    const cx = x + pad + cr + k * (HOLD.cell + HOLD.gap), cyy = y + cy;
    svg.push(`<circle cx="${r(cx + 0.35)}" cy="${r(cyy + 0.5)}" r="${cr}" fill="#1a0e04" fill-opacity=".22"/>` + brassRing(`${pid}-c${k}`, cx, cyy, cr, 0.95, id, WELL));
    svg.push(`<circle cx="${r(cx)}" cy="${r(cyy)}" r="${r(cr - 2.4)}" fill="none" stroke="${LOOK.paperLine}" stroke-opacity=".35" stroke-width=".2" stroke-dasharray="1.2 .9"/>`);
    html.push(capWord(`${pid}-c${k}`, cx, cyy, String(k + 1), 4.8, { color: FAINT }));
  }
  html.push(wordAt(pid, x + 4.2, y + 7.3, t.name, nameO));
  html.push(word(pid, x + 4.2, y + 10.7, rule, { w: 500, size: 9, lh: 3.45, color: LOOK.ink, width: 88, style: 'text-wrap:balance' }));
  // the two cells of the head, the words right of each
  const group = (key: string, lines: string[], inner: (c: number) => string) => `<div class="tk-hc">`
    + `<div data-in="${pid}" class="tk-hc-l"><b>${esc(lines[0])}</b>${lines.slice(1).map(l => `<span>${esc(l)}</span>`).join('')}</div>${markCell(`${pid}-${key}`, id, inner)}</div>`;
  html.push(`<div class="tk-hcs" style="right:${r(A4.w - (x + w) + 4)}mm;top:${r(y + cellY)}mm">`
    + group('regroup', TXT.holdCells.regroup, c => `<g opacity=".5">${lineIcon(REGROUP, c / 2, c / 2, 8.4, LOOK.ink)}</g>`)
    + group('joint', TXT.holdCells.joint, c => ico('guns', c / 2, c / 2, 9, TONE.sepia, undefined, 0.42)) + `</div>`);
  return { svg: svg.join(''), html: html.join('') };
}

// ---- Powder and Fire: a brass coin with the engraved keg / the fire on deck in its well ----
function coinToken(id: string, k: string, x: number, y: number, s: number, well: string, inner: string): string {
  const cx = x + s / 2, cy = y + s / 2, R0 = s / 2 - 1.5, rim = 1.25;
  return `<defs><clipPath id="${id}${k}"><circle cx="${r(cx)}" cy="${r(cy)}" r="${r(R0 - rim)}"/></clipPath></defs>`
    + `<circle cx="${r(cx + 0.3)}" cy="${r(cy + 0.45)}" r="${r(R0)}" fill="#1a0e04" fill-opacity=".22"/>`
    + brassRing(null, cx, cy, R0, rim, id, well)
    + `<g clip-path="url(#${id}${k})">${inner}</g>`
    + `<circle cx="${r(cx)}" cy="${r(cy)}" r="${r(R0 - rim - 0.55)}" fill="none" stroke="${LOOK.brass[2]}" stroke-opacity=".35" stroke-width=".18"/>`;
}
function tokenGrid(id: string, g: { cols: number; rows: number; x: number; y: number }, size: number, count: number, one: (i: number, x: number, y: number) => string): string {
  if (g.cols * g.rows !== count) throw new Error(`token grid ${g.cols} × ${g.rows}, expected ${count}`);
  let s = `<rect x="${g.x}" y="${g.y}" width="${g.cols * size}" height="${g.rows * size}" fill="${GROUND}"/>`;
  for (let i = 0; i < count; i++) s += one(i, g.x + (i % g.cols) * size, g.y + Math.floor(i / g.cols) * size);
  return s;
}

// ---- track markers: the ship's colour, a brass rim, the deck letter large (cap 6.6 mm); the Soul marker beside them ----
const LETTER = { cap: 6.6, maxW: 6.9 };
function markerArt(x: number, y: number, color: string, field: string): string {
  const m = TOKEN.marker, [bl, bm, bd] = LOOK.brass, a = 0.6, b = m - 0.6, k = 1.4;
  return `<rect x="${R(x)}" y="${R(y)}" width="${m}" height="${m}" fill="${color}"/>`
    + `<rect x="${R(x + a)}" y="${R(y + a)}" width="${R(b - a)}" height="${R(b - a)}" rx="${k}" fill="${bm}" stroke="${bd}" stroke-width=".2"/>`
    // light along the top and the left edge, shade along the bottom and the right
    + `<path d="M${R(x + a + 0.35)} ${R(y + b - k)}V${R(y + a + k)}Q${R(x + a + 0.35)} ${R(y + a + 0.35)} ${R(x + a + k)} ${R(y + a + 0.35)}H${R(x + b - k)}" fill="none" stroke="${bl}" stroke-width=".42" stroke-linecap="round"/>`
    + `<path d="M${R(x + a + k)} ${R(y + b - 0.32)}H${R(x + b - k)}Q${R(x + b - 0.32)} ${R(y + b - 0.32)} ${R(x + b - 0.32)} ${R(y + b - k)}V${R(y + a + k)}" fill="none" stroke="${bd}" stroke-opacity=".4" stroke-width=".36" stroke-linecap="round"/>`
    + `<rect x="${R(x + 1.3)}" y="${R(y + 1.3)}" width="${R(m - 2.6)}" height="${R(m - 2.6)}" rx=".8" fill="${field}" stroke="${bd}" stroke-width=".2"/>`
    + `<path d="M${R(x + 1.75)} ${R(y + m - 2.2)}V${R(y + 2.1)}Q${R(x + 1.75)} ${R(y + 1.75)} ${R(x + 2.1)} ${R(y + 1.75)}H${R(x + m - 2.2)}" fill="none" stroke="#ffffff" stroke-opacity=".22" stroke-width=".25" stroke-linecap="round"/>`;
}
/** the new marker, like the new ship token in small: a brass rim; above, the ship's picture (the token's raster, its sails
 *  over the sky); below, a band in the ship's colour under a brass line; over the seam a brass medallion with the letter —
 *  the letter is what is read from across the table, the ship is the ornament. The Soul marker in pair: a sea-green
 *  band, pale rays in the sky, the soul flask in the medallion. */
const MEDAL = { cy: 6.45, R: 3.25, band: 5.9 };
function markerNew(x: number, y: number, pic: string | null, band: string, sky: string, uid: string): string {
  const m = TOKEN.marker, [bl, bm, bd] = LOOK.brass, a = 0.6, b = m - 0.6, k = 1.4, f0 = 1.2, f1 = m - 1.2;
  let o = `<rect x="${R(x)}" y="${R(y)}" width="${m}" height="${m}" fill="${band}"/>`
    + `<rect x="${R(x + a)}" y="${R(y + a)}" width="${R(b - a)}" height="${R(b - a)}" rx="${k}" fill="${bm}" stroke="${bd}" stroke-width=".2"/>`
    + `<path d="M${R(x + a + 0.35)} ${R(y + b - k)}V${R(y + a + k)}Q${R(x + a + 0.35)} ${R(y + a + 0.35)} ${R(x + a + k)} ${R(y + a + 0.35)}H${R(x + b - k)}" fill="none" stroke="${bl}" stroke-width=".42" stroke-linecap="round"/>`
    + `<path d="M${R(x + a + k)} ${R(y + b - 0.32)}H${R(x + b - k)}Q${R(x + b - 0.32)} ${R(y + b - 0.32)} ${R(x + b - 0.32)} ${R(y + b - k)}V${R(y + a + k)}" fill="none" stroke="${bd}" stroke-opacity=".4" stroke-width=".36" stroke-linecap="round"/>`
    + `<defs><clipPath id="mk${uid}"><rect x="${R(x + f0)}" y="${R(y + f0)}" width="${R(f1 - f0)}" height="${R(MEDAL.band - f0)}" rx=".6"/></clipPath></defs>`
    + `<rect x="${R(x + f0)}" y="${R(y + f0)}" width="${R(f1 - f0)}" height="${R(f1 - f0)}" rx=".7" fill="${band}" stroke="${bd}" stroke-width=".2"/>`
    + `<g clip-path="url(#mk${uid})"><rect x="${R(x + f0)}" y="${R(y + f0)}" width="${R(f1 - f0)}" height="${R(MEDAL.band - f0)}" fill="${sky}"/>`;
  if (pic) { const w = f1 - f0, h = w * PIC.h / PIC.w; o += `<image href="${pic}" x="${R(x + f0)}" y="${R(y + MEDAL.band + 0.1 - h * (PIC.h - 1.4) / PIC.h)}" width="${R(w)}" height="${R(h)}" preserveAspectRatio="none"/>`; }
  else for (let i = 0; i < 9; i++) { const t = -Math.PI * (0.08 + 0.84 * i / 8); o += `<path d="M${R(x + m / 2)} ${R(y + MEDAL.cy)}L${R(x + m / 2 + 7 * Math.cos(t))} ${R(y + MEDAL.cy + 7 * Math.sin(t))}" stroke="#3f9a88" stroke-opacity=".45" stroke-width=".28"/>`; }
  o += `</g><rect x="${R(x + f0)}" y="${R(y + MEDAL.band - 0.2)}" width="${R(f1 - f0)}" height=".45" fill="${bl}"/><rect x="${R(x + f0)}" y="${R(y + MEDAL.band + 0.25)}" width="${R(f1 - f0)}" height=".15" fill="${bd}"/>`;
  return o;
}
function markersHtml(pics: Record<string, string> | null): { svg: string; html: string; cuts: string } {
  const m = TOKEN.marker, list = ships().flatMap(s => Array.from({ length: 4 }, () => s)), n = MARK.perRow;
  if (list.length + 1 !== COUNTS.markers) throw new Error(`markers: ${list.length + 1}, expected ${COUNTS.markers}`);
  const pos = (i: number) => ({ x: MARK.x + (i < n ? i : i - n) * m, y: MARK.y + (i < n ? 0 : m) });
  let svg = '';
  const html: string[] = [];
  list.forEach((s, i) => {
    const p = pos(i), pid = `marker-${i}`;
    if (pics) {
      svg += markerNew(p.x, p.y, pics[s.code], deepOf(s.color), PAPER, String(i)) + brassRing(`${pid}-medal`, p.x + m / 2, p.y + MEDAL.cy, MEDAL.R, 0.55, 'mk', deepOf(s.color));
      html.push(capWord(`${pid}-medal`, p.x + m / 2, p.y + MEDAL.cy, s.code, MEDAL.R * 1.02, { color: CREAM, maxW: MEDAL.R * 1.3, inset: 0.9, name: `${s.code} (маркер)` }));
    } else {
      svg += markerArt(p.x, p.y, s.color, deepOf(s.color)) + `<rect data-plate="${pid}" x="${R(p.x)}" y="${R(p.y)}" width="${m}" height="${m}" fill="none"/>`;
      html.push(capWord(pid, p.x + m / 2, p.y + m / 2, s.code, LETTER.cap, { color: CREAM, maxW: LETTER.maxW }));
    }
  });
  const soul = pos(list.length);
  svg += pics ? markerNew(soul.x, soul.y, null, '#2f7a6c', '#e6f6f1', 'soul') + brassRing('marker-soul-medal', soul.x + m / 2, soul.y + MEDAL.cy, MEDAL.R, 0.55, 'mk', '#eef8f4') + ico('souls', soul.x + m / 2, soul.y + MEDAL.cy + 0.05, 4.9, SOUL_TONE, 'marker-soul')
    : markerArt(soul.x, soul.y, '#d9efe8', '#eef8f4') + ico('souls', soul.x + m / 2, soul.y + m / 2 + 0.1, 7.4, SOUL_TONE, 'marker-soul');
  // the outline with its ticks: grey; the lines between two dark markers: light
  const x = MARK.x, y = MARK.y, w = (list.length + 1 - n) * m, h = 2 * m, w1 = n * m;
  let d = '', light = '';
  for (let c = 0; c <= n + 1; c++) d += `M${R(x + c * m)} ${R((c > n ? y + m : y) - TICK)}V${R(y + h + TICK)}`;
  d += `M${R(x - TICK)} ${y}H${R(x + w1 + TICK)}M${R(x - TICK)} ${R(y + m)}H${R(x + w + TICK)}M${R(x - TICK)} ${R(y + h)}H${R(x + w + TICK)}`;
  for (let c = 1; c < n; c++) light += `M${R(x + c * m)} ${y}V${R(y + h)}`;
  light += `M${x} ${R(y + m)}H${R(x + w1)}`;
  return { svg, html: html.join(''), cuts: `<path d="${d}" stroke="${CUT}" stroke-width="${CUT_W}" fill="none"/><path d="${light}" stroke="${CUT_ON_DARK}" stroke-width="${CUT_W}" fill="none"/>` };
}

// ---- «Под водой» / «Всплыл»: one two-sided token of the Dutchman, printed as a fold-over pair (face | back) ----
// Why a pair to fold and not a back page: sheet 04 is printed on one side (its lead says so), a copy shop's duplex is off by
// 1–2 mm (on a 50 × 25 token the back's frame would run off its edge), a back page would cost a sheet for one token; the
// pair has its two halves on the same side of the sheet, so they meet exactly at the fold, and glued it is twice as thick
// — it is turned over every time the Dutchman surfaces. Both halves are upright: folded along the short edge, the back
// reads upright when the token is turned over side to side (as the boards are, DuplexFlipShortEdge). The art runs BLEED
// mm past the outer cut; nothing that matters is closer than 2 mm to a cut or to the fold.
const DIVE_BLEED = 1.5;
/** the art of a side: scene units (4 per mm, the kit's scale: 200 × 100 a side) */
const DU = 4;
/** where the words of a side stand (diveHtml), in the art's units of that side (x from its fold or outer cut, y from the
 *  top cut): the title right of the icon and the lines under it. The art keeps this field calm and dark — no bubbles,
 *  no motes, no shafts; only the dark water — so every word stands on it */
const DIVE_WORDS = { titleX1: 36 * DU, titleY1: 9 * DU, textX1: 31 * DU };
/** the two sides as SVG (exported for the scratch renders): the face under water (the Dutchman deep in the green dark,
 *  light shafts from the surface, bubbles rising beside her), the back surfacing (the Dutchman bursting up through the
 *  fog-green sea, bow high, water pouring off her rails and out of her ports, spray at the stem). Both halves are dark
 *  at every edge: the bleed past the cut is the same dark as the water at the cut, no light band runs out of the token;
 *  the words of each side (left) stand on a calm dark field */
export function diveSvgs(): { face: string; back: string; wmm: number; hmm: number } {
  const b = DIVE_BLEED * DU, W0 = 200, H0 = 100, { titleX1, titleY1, textX1 } = DIVE_WORDS;
  let q = 11; const rnd = () => (q = (q * 16807) % 2147483647) / 2147483647;
  /** a bubble may stand here: right of the words (and of the title above them), inside the frame */
  const free = (x: number, y: number, rr: number) => x - rr > (y - rr < titleY1 ? titleX1 : textX1) + 4 && x + rr < W0 - 9 && y - rr > 9 && y + rr < H0 - 9;
  // the calm dark field under the words and the dark edge all round: solid from past the bleed to EDGE.solid inside the
  // cut (under the brass frame, 1.7 mm in), then a soft fade inwards — a cut off by a millimetre still shows the same dark
  const EDGE = { solid: 0.4, soft: 5 }, o0 = -b - 4;
  const ring = (i: number) => `M${o0} ${o0}H${W0 - o0}V${H0 - o0}H${o0}Z M${i} ${i}V${H0 - i}H${W0 - i}V${i}Z`;
  const calm =(id: string, c: string, a: number) => `<defs><linearGradient id="${id}c" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${textX1 + 30}" y2="0"><stop offset="0" stop-color="${c}" stop-opacity="${a}"/><stop offset="${R((textX1 - 8) / (textX1 + 30))}" stop-color="${c}" stop-opacity="${R(a * 0.92)}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient>`
    + `<filter id="${id}e" filterUnits="userSpaceOnUse" x="${-b - 30}" y="${-b - 30}" width="${W0 + 2 * b + 60}" height="${H0 + 2 * b + 60}"><feGaussianBlur stdDeviation="2.2"/></filter></defs>`
    + `<rect x="${-b - 10}" y="${-b}" width="${textX1 + 40 + b}" height="${H0 + 2 * b}" fill="url(#${id}c)"/>`
    + `<path d="${ring(EDGE.soft)}" fill="${c}" fill-rule="evenodd" opacity=".85" filter="url(#${id}e)"/><path d="${ring(EDGE.solid)}" fill="${c}" fill-rule="evenodd"/>`;
  // the face: the green dark under water, light from the surface above her (upper right), the ship, a veil of water over
  // her, shafts of light and motes on her side only, bubbles rising beside her (never over the words)
  const Lf = KIT.makeLight(KIT.LIGHTS.dutchman, { horizon: 10 }), fx = 150, fwl = H0 + 8;
  let shafts = '', bubbles = '', motes = '';
  for (const [x0, w, op] of [[150, 12, 0.16], [178, 16, 0.12], [205, 10, 0.16], [128, 8, 0.1]]) shafts += `<path d="M${x0} ${-b}h${w}l${-w * 0.5 - 20} ${H0 + 2 * b}h${-w * 1.6}Z" fill="#c8fff0" opacity="${op}"/>`;
  for (const [bx0, n, sp] of [[fx - 16, 9, 1], [fx + 8, 8, 1.1], [fx + 32, 6, 0.9]]) for (let i = 0; i < n; i++) {
    const t = (i + rnd() * 0.7) / n, y = fwl - 30 - t * (fwl - 48), x = bx0 + Math.sin(t * 6 + bx0) * 4 * sp + (rnd() - 0.5) * 3, br = 0.9 + (1 - t) * 2.4 * (0.5 + rnd() * 0.7);
    if (!free(x, y, br + 0.5)) continue;
    bubbles += `<circle cx="${R(x)}" cy="${R(y)}" r="${R(br)}" fill="#dffff6" fill-opacity=".22" stroke="#e8fffa" stroke-opacity=".8" stroke-width=".45"/><circle cx="${R(x - br * 0.35)}" cy="${R(y - br * 0.38)}" r="${R(br * 0.3)}" fill="#ffffff" fill-opacity=".9"/>`;
  }
  for (let i = 0; i < 60; i++) { const x = textX1 + 6 + rnd() * (W0 - textX1 - 6), y = 10 + rnd() * (H0 - 20); if (free(x, y, 1)) motes += `<circle cx="${R(x)}" cy="${R(y)}" r="${R(0.25 + rnd() * 0.5)}" fill="#bff5e6" opacity="${R(0.2 + rnd() * 0.4)}"/>`; }
  const face = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-b} ${-b} ${W0 + b} ${H0 + 2 * b}">`
    + `<defs><linearGradient id="dvf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#245e5a"/><stop offset=".3" stop-color="#1b4c4a"/><stop offset=".65" stop-color="#123635"/><stop offset="1" stop-color="#081d20"/></linearGradient>`
    + `<radialGradient id="dvl" gradientUnits="userSpaceOnUse" cx="168" cy="-6" r="120"><stop offset="0" stop-color="#7fd0bf" stop-opacity=".55"/><stop offset=".45" stop-color="#4f9e90" stop-opacity=".22"/><stop offset="1" stop-color="#4f9e90" stop-opacity="0"/></radialGradient>`
    + `<linearGradient id="dvv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f8a84" stop-opacity=".38"/><stop offset=".45" stop-color="#1d5653" stop-opacity=".34"/><stop offset="1" stop-color="#061a1c" stop-opacity=".6"/></linearGradient>`
    + `<filter id="dvb" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.4"/></filter><filter id="dvs" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation=".35"/></filter></defs>`
    + `<rect x="${-b}" y="${-b}" width="${W0 + 2 * b}" height="${H0 + 2 * b}" fill="url(#dvf)"/><rect x="${-b}" y="${-b}" width="${W0 + 2 * b}" height="${H0 + 2 * b}" fill="url(#dvl)"/>`
    + `<g filter="url(#dvs)">${KIT.ship('dvf', Lf, { kind: 'dutch', x: fx, y: fwl, scale: 0.82, flip: true, heel: 4, sails: 'reefed', detail: 'mid' })}</g>`
    + `<rect x="${-b}" y="${-b}" width="${W0 + 2 * b}" height="${H0 + 2 * b}" fill="url(#dvv)"/>`
    + `<g filter="url(#dvb)">${shafts}</g>${calm('dvq', '#061a1c', 0.62)}${motes}${bubbles}</svg>`;
  // the back: the fog-green sky and sea, the ship rising bow first, water pouring off her, foam and spray at the waterline
  const hz = 58, bwl = 76, bx = 151, Lb = KIT.makeLight(KIT.LIGHTS.dutchman, { horizon: hz });
  const o = { kind: 'dutch', x: bx, y: bwl, scale: 0.5, flip: true, heel: -9, sails: 'reefed', detail: 'mid', wake: true };
  const g = KIT.shipGeom('dutch', o), hb = g.hb;
  let pour = '';
  for (let i = 0; i < 15; i++) {
    const X = -hb * 0.8 + (i + rnd() * 0.9) / 15 * hb * 1.6, [x, y0] = g.nearRail(X), port = rnd() < 0.35, y = port ? y0 + 3 + rnd() * 4 : y0 + 0.8;
    const len = bwl - y + 1, wob = (rnd() - 0.5) * 2, wd = 0.35 + rnd() * 0.8, cut = 0.35 + rnd() * 0.4, op = 0.35 + rnd() * 0.4;
    pour += `<path d="M${R(x)} ${R(y)}q${R(wob * 0.3)} ${R(len * cut * 0.5)} ${R(wob * 0.5)} ${R(len * cut)}" fill="none" stroke="#e6fff7" stroke-width="${R(wd)}" stroke-linecap="round" opacity="${R(op + 0.2)}"/>`
      + `<path d="M${R(x + wob * 0.55)} ${R(y + len * (cut + 0.08))}q${R(wob * 0.3)} ${R(len * (0.9 - cut) * 0.5)} ${R(wob * 0.6)} ${R(len * (0.92 - cut))}" fill="none" stroke="#e6fff7" stroke-width="${R(wd * 0.8)}" stroke-linecap="round" opacity="${R(op)}" stroke-dasharray="${R(1 + rnd() * 2)} ${R(0.6 + rnd())}"/>`;
    for (let k = 0; k < 2; k++) pour += `<circle cx="${R(x + wob + (rnd() - 0.5) * 3)}" cy="${R(y + rnd() * len)}" r="${R(0.25 + rnd() * 0.45)}" fill="#e6fff7" opacity=".6"/>`;
  }
  pour += KIT.foam('dvb', { x: g.nearRail(0)[0], y: bwl + 0.6, w: hb * 2 * o.scale + 8, h: 2.2, seed: 6, L: Lb });
  const splashes = [[g.nearRail(-hb * 0.95)[0], 12, 18, 1], [g.nearRail(hb * 0.7)[0], 10, 12, 2], [g.nearRail(0)[0], 14, 9, 4]]
    .map(([x, w, h, sd]) => KIT.splash('dvb' + sd, { x, y: bwl + 1, w, h, seed: sd, L: Lb, wind: 1 })).join('');
  // the back's words stand at its left (from the fold): the calm field there, mirrored into the back's own units
  const back = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${-b} ${W0 + b} ${H0 + 2 * b}"><g transform="translate(${-b} 0)">`
    + KIT.sky('dvb', Lb, { horizon: hz, top: -b, w: W0 + 2 * b + 2 * b, stars: false }) + KIT.water('dvb', Lb, { horizon: hz, bottom: H0 + b, w: W0 + 3 * b, seed: 5, glitter: false })
    + `</g>${KIT.ship('dvb', Lb, o)}${pour}${splashes}${calm('dvk', '#071512', 0.5)}</svg>`;
  return { face, back, wmm: (W0 + b) / DU, hmm: (H0 + 2 * b) / DU };
}
async function diveArt(ctx: Ctx): Promise<{ face: string; back: string }> {
  const d = diveSvgs(), dpi = ctx.opts.draft ? 300 : 600;
  return { face: (await rasterJpeg(ctx.browser, 'dive-face', d.face, d.wmm, d.hmm, dpi, 0.92)).url, back: (await rasterJpeg(ctx.browser, 'dive-back', d.back, d.wmm, d.hmm, dpi, 0.92)).url };
}
/** the pair on the sheet at (x, y): the two pictures, a brass frame round each side, the words; the cut round the pair
 *  (grey, ticks past it) and the fold between them (dashed, in the margins only) */
/** the words of a side: groups of lines, a little gap between the groups */
const block = (groups: string[][]) => groups.map((g, i) => `<span style="display:block${i ? ';margin-top:.6mm' : ''}">${g.map(l => esc(l).replace(/ — /g, '\u00a0— ')).join('<br>')}</span>`).join('');
/** a line of the board's words: a line break after each comma (the comma kept) */
const byComma = (s: string) => s.split(', ').map((l, i, a) => i < a.length - 1 ? l + ',' : l);
function diveHtml(id: string, x: number, y: number, art: { face: string; back: string } | null): { svg: string; html: string; cuts: string } {
  const { w, h } = TOKEN.underwater, bl = DIVE_BLEED, rules = data.rules as Record<string, number>, svg: string[] = [], html: string[] = [];
  const g = data.ships.find(s => s.code === 'Г')!;
  if (art) svg.push(`<image href="${art.face}" x="${R(x - bl)}" y="${R(y - bl)}" width="${R(w + bl)}" height="${R(h + 2 * bl)}" preserveAspectRatio="none"/><image href="${art.back}" x="${R(x + w)}" y="${R(y - bl)}" width="${R(w + bl)}" height="${R(h + 2 * bl)}" preserveAspectRatio="none"/>`);
  else svg.push(`<rect x="${R(x - bl)}" y="${R(y - bl)}" width="${R(2 * w + 2 * bl)}" height="${R(h + 2 * bl)}" fill="${darken(g.color, 0.38)}"/>`);
  const sides = [
    // the words of each side that stood on the board (boards v7, item 3): a line at each « · » and after each comma, a
    // little gap between «how she dives» and what holds while she is under (the face's two old lines)
    { pid: 'uw', ic: 'underwater' as const, title: BTXT.underwater.title, sc: false, lines: block([BTXT.underwater.note.split(' · ').flatMap(byComma), TXT.underwater.lines.slice(0, 2).map(l => fill(l, { surface: rules.surfaceBonus }))]) },
    { pid: 'uw-back', ic: 'surfaced' as const, title: BTXT.surfaced.title, sc: true, lines: block(BTXT.surfaced.note.split(' · ').map(byComma)) }
  ];
  sides.forEach((sd, i) => {
    const x0 = x + i * w, rd = 2.7, icx = x0 + 3.9 + rd, ty = y + 5.9, fr = 1.7;
    svg.push(`<rect data-plate="${sd.pid}" x="${r(x0 + fr)}" y="${r(y + fr)}" width="${r(w - 2 * fr)}" height="${r(h - 2 * fr)}" rx="1" fill="none" stroke="${LOOK.brass[1]}" stroke-width=".42"/>`
      + `<rect x="${r(x0 + fr + 0.55)}" y="${r(y + fr + 0.55)}" width="${r(w - 2 * fr - 1.1)}" height="${r(h - 2 * fr - 1.1)}" rx=".7" fill="none" stroke="${LOOK.brass[0]}" stroke-opacity=".6" stroke-width=".15"/>`
      + [[fr + 0.9, fr + 0.9], [w - fr - 0.9, fr + 0.9], [fr + 0.9, h - fr - 0.9], [w - fr - 0.9, h - fr - 0.9]].map(([dx, dy]) => rivet(x0 + dx, y + dy, 0.42)).join('')
      + `<defs><clipPath id="${id}uwc${i}"><circle cx="${r(icx)}" cy="${r(ty)}" r="${r(rd - 0.5)}"/></clipPath></defs>`
      + `<g>${brassRing(`${sd.pid}-icon`, icx, ty, rd, 0.5, id, '#e5eee7')}<g clip-path="url(#${id}uwc${i})">${icon(sd.ic, icx, ty + 0.3, 5.2, TONE.verdigris)}</g></g>`);
    html.push(wordAt(sd.pid, icx + rd + 1.6, ty, sd.title, { font: 'Alegreya SC', w: 800, size: 12, lh: 5, ls: '.05em', color: CREAM }));
    html.push(word(sd.pid, x0 + 4.1, y + 9.1, sd.lines, { w: 700, size: 7.6, lh: 3.0, color: CREAM, name: i ? 'всплыл: правила' : 'под водой: правила' }));
  });
  const T = TICK, d = `M${R(x)} ${R(y - T)}V${R(y + h + T)}M${R(x + 2 * w)} ${R(y - T)}V${R(y + h + T)}M${R(x - T)} ${R(y)}H${R(x + 2 * w + T)}M${R(x - T)} ${R(y + h)}H${R(x + 2 * w + T)}`;
  const fold = `M${R(x + w)} ${R(y - 3.4)}V${R(y - 0.8)}M${R(x + w)} ${R(y + h + 0.8)}V${R(y + h + T)}`;
  return { svg: svg.join(''), html: html.join(''), cuts: `<path d="${d}" stroke="${CUT}" stroke-width="${CUT_W}" fill="none"/><path d="${fold}" stroke="${LOOK.brass[2]}" stroke-width=".3" stroke-dasharray="1 .7" fill="none"/>` };
}

// ---- ship tokens ----
function shipTokensHtml(id: string, pics: Record<string, string> | null): { svg: string; html: string } {
  const t = TOKEN.shipToken, list = ships(), y = SHIPS.y, band = 21.4, svg: string[] = [], html: string[] = [];
  list.forEach((s, i) => {
    const x = SHIPS.x + i * t, deep = deepOf(s.color), pid = `ship-${i}`;
    svg.push(`<rect x="${x}" y="${y}" width="${t}" height="${t}" fill="${PAPER}"/>`);
    if (pics) svg.push(`<image href="${pics[s.code]}" x="${x}" y="${y}" width="${PIC.w}" height="${PIC.h}" preserveAspectRatio="none"/>`);
    else svg.push(`<g transform="translate(0 ${y})">${bigShip(DECK_KEY[s.code], x + 16.2, 20.2, 0.172)}</g>`);
    svg.push(`<rect x="${x}" y="${y + band}" width="${t}" height="${r(t - band)}" fill="${deep}"/>`);
    if (pics) {
      // the gold edge: a brass bar between the picture and the band (dark rules on both sides of it) and a fine gold
      // rule round the band 1.6 mm inside the cut, its left end under the medallion
      const [bl, bm, bd] = LOOK.brass, gx0 = x + 1.6, gx1 = x + t - 1.6, gy0 = y + band + 1.1, gy1 = y + t - 1.6;
      svg.push(`<rect x="${x}" y="${r(y + band - 0.5)}" width="${t}" height="1" fill="${bd}"/><rect x="${x}" y="${r(y + band - 0.33)}" width="${t}" height=".66" fill="url(#${id}br)"/>`
        + `<rect x="${r(gx0)}" y="${r(gy0)}" width="${r(gx1 - gx0)}" height="${r(gy1 - gy0)}" rx=".8" fill="none" stroke="${bd}" stroke-width=".5"/>`
        + `<rect x="${r(gx0)}" y="${r(gy0)}" width="${r(gx1 - gx0)}" height="${r(gy1 - gy0)}" rx=".8" fill="none" stroke="${bm}" stroke-width=".26"/>`
        + `<path d="M${r(gx0 + 0.8)} ${r(gy0 - 0.06)}H${r(gx1 - 0.8)}" stroke="${bl}" stroke-width=".15"/>`);
    } else svg.push(`<rect x="${x}" y="${r(y + band - 0.3)}" width="${t}" height=".7" fill="url(#${id}br)"/>`);
    svg.push(`<rect data-plate="${pid}-band" x="${r(x + 0.5)}" y="${r(y + band + 0.4)}" width="${r(t - 1)}" height="${r(t - band - 0.9)}" fill="none"/>`);
    // new: the letter in the band, left of the name, off the sails; old: the letter over the sky, the name centred in the band
    const m = pics ? { cx: x + 4.4, cy: y + 25.75, R: 3.15 } : { cx: x + 5.6, cy: y + 5.6, R: 3.5 };
    svg.push(brassRing(`${pid}-medal`, m.cx, m.cy, m.R, 0.6, id, deep));
    html.push(capWord(`${pid}-medal`, m.cx, m.cy, s.code, m.R * 0.92, { color: CREAM, maxW: m.R * 1.2, inset: 1.2, name: `${s.code} (жетон)` }));
    const nx = pics ? x + 18.4 : x + t / 2, room = pics ? 17.4 : 25, nO: TO = { font: 'Alegreya SC', w: 700, ls: '.06em' };
    let size = 9.6; while (size > 7 && W(s.nick, size, nO) > room) size = Math.round((size - 0.2) * 10) / 10;
    html.push(wordAt(`${pid}-band`, nx, y + 25.75, s.nick, { font: 'Alegreya SC', w: 700, size, lh: pt(size) * 1.2, ls: '.06em', color: CREAM, anchor: 'middle' }));
  });
  return { svg: svg.join(''), html: html.join('') };
}

// ---- the identical marks: parts/mark-coin.ts (markArt)
function marksHtml(id: string): { svg: string; cuts: string } {
  const m = TOKEN.marker, { cols, rows, x, y } = MARKS;
  let svg = `<rect x="${x}" y="${y}" width="${cols * m}" height="${rows * m}" fill="${GROUND}"/>`;
  for (let i = 0; i < cols * rows; i++) svg += markArt(x + (i % cols) * m + m / 2, y + Math.floor(i / cols) * m + m / 2, id);
  return { svg, cuts: gridCuts(x, y, cols, rows, m, m) };
}
/** a mark drawn small, inline in HTML (its own plate) */
const markIcon = (pid: string, d: number, id: string) => `<svg data-plate="${pid}" viewBox="0 0 ${TOKEN.marker} ${TOKEN.marker}" style="width:${d}mm;height:${d}mm;flex:none;display:block">${markArt(TOKEN.marker / 2, TOKEN.marker / 2, id)}</svg>`;

// ---- pages
function pages(ctx: Ctx, pics: Record<string, string> | null, strips: boolean, dive: { face: string; back: string } | null, markerPics: Record<string, string> | null): PageSpec[] {
  const econ = data.econ as { income: number; first_income: number; cap: number; second_start: number }, rules = data.rules as Record<string, number>;
  const nums = { income: econ.income, first: econ.first_income, cap: econ.cap, start: econ.second_start, firstGame: rules.firstGameSecondStart };
  const pd = TOKEN.powder, fr = TOKEN.fire, of = strips ? 3 : 2, page = (n: number) => fill(TXT.page, { n, of });
  void ctx;

  // sheet 1
  const id1 = 'tk1', s1: string[] = [defs(id1)], h1: string[] = [];
  TXT.holds.forEach((t, i) => { const hd = holdHtml(t, i, fill(t.rule, nums), id1); s1.push(hd.svg); h1.push(hd.html); });
  const cPow = caption('cap-powder', POWDER.x, POWDER.y, fill(TXT.powder, { n: COUNTS.powder }), ico('powder', capSign(POWDER.x, POWDER.y).cx, capSign(POWDER.x, POWDER.y).cy, 4.8, TONE.sepia));
  s1.push(cPow.svg, tokenGrid(id1, POWDER, pd, COUNTS.powder, (i, x, y) => coinToken(id1, `pw${i}`, x, y, pd, WELL, icon('powder', x + pd / 2 + 0.2, y + pd / 2 + 0.1, 11.6, TONE.sepia))));
  h1.push(cPow.html);
  const cFire = caption('cap-fire', FIRE.x, FIRE.y, fill(TXT.fire, { n: COUNTS.fire }), ico('fire', capSign(FIRE.x, FIRE.y).cx, capSign(FIRE.x, FIRE.y).cy, 4.8, TONE.red));
  s1.push(cFire.svg, tokenGrid(id1, FIRE, fr, COUNTS.fire, (i, x, y) => coinToken(id1, `fr${i}`, x, y, fr, FIRE_FIELD, icon('fire', x + fr / 2, y + fr / 2 + 0.3, 13.2, TONE.red))));
  h1.push(cFire.html);
  const mk = markersHtml(markerPics), sg = capSign(MARK.x, MARK.y);
  const cMark = caption('cap-markers', MARK.x, MARK.y, TXT.markers,
    `<rect x="${r(sg.cx - 2.3)}" y="${r(sg.cy - 2.3)}" width="4.6" height="4.6" rx=".8" fill="url(#${id1}brh)" stroke="${LOOK.brass[2]}" stroke-width=".2"/><rect x="${r(sg.cx - 1.6)}" y="${r(sg.cy - 1.6)}" width="3.2" height="3.2" rx=".4" fill="${deepOf(data.ships.find(s => s.code === 'М')!.color)}"/>`);
  s1.push(cMark.svg, mk.svg); h1.push(cMark.html, mk.html);
  s1.push(plateRect('hint', { x: 10, y: 272, w: 190, h: 7.4 }));
  h1.push(wordAt('hint', A4.w / 2, 275.7, TXT.hint, { font: 'Alegreya', italic: true, w: 400, size: 9.5, lh: 4, color: '#3f2f1c', anchor: 'middle' }));
  const page1 = head(id1 + 'h', TXT.title, TXT.lead, page(1)) + pageSvg(s1.join('\n')) + h1.join('\n') + foot(1, of)
    + cutLayer(gridCuts(HOLD_BOX.x, HOLD_BOX.y, 1, TXT.holds.length, HOLD_BOX.w, HOLD_BOX.h, HOLD_BOX.tick)
      + gridCuts(POWDER.x, POWDER.y, POWDER.cols, POWDER.rows, pd, pd) + gridCuts(FIRE.x, FIRE.y, FIRE.cols, FIRE.rows, fr, fr)
      + mk.cuts);

  // sheet 2
  const id2 = 'tk2', mp = TXT.marksPage, st = TOKEN.shipToken, s2: string[] = [defs(id2)], h2: string[] = [];
  const ss = capSign(SHIPS.x, SHIPS.y), cShips = caption('cap-ships', SHIPS.x, SHIPS.y, fill(mp.ships, { n: ships().length }), ico('sails', ss.cx, ss.cy, 4.8, TONE.sepia));
  const tok = shipTokensHtml(id2, pics);
  s2.push(cShips.svg, tok.svg); h2.push(cShips.html, tok.html);
  const ms = capSign(MARKS.x, MARKS.y), cMarks = caption('cap-marks', MARKS.x, MARKS.y, fill(mp.marks, { n: TABLE.marks, spare: TABLE.spareMarks }),
    `<g transform="translate(${r(ms.cx - 2.4)} ${r(ms.cy - 2.4)}) scale(${r(4.8 / TOKEN.marker)})">${markArt(TOKEN.marker / 2, TOKEN.marker / 2, id2)}</g>`);
  const marks = marksHtml(id2);
  s2.push(cMarks.svg, marks.svg); h2.push(cMarks.html);
  // how the marks are used: a parchment slip under the grid
  const ub: Rect = { x: 10, y: MARKS.y + MARKS.rows * TOKEN.marker + TICK + 3, w: 190, h: 15.2 };
  s2.push(cartouche('uses', ub, id2));
  h2.push(`<div class="tk-uses-r" style="left:${r(ub.x)}mm;top:${r(ub.y + 2.6)}mm;width:${r(ub.w)}mm">`
    + mp.uses.map((u, i) => `<span>${markIcon(`use-${i}`, 4.6, id2)}<span data-in="uses" class="tk-use">${esc(u)}</span></span>`).join('') + `</div>`);
  h2.push(wordAt('uses', A4.w / 2, ub.y + 11.1, mp.sweep, { font: 'Alegreya', italic: true, w: 500, size: 9.5, lh: 4, color: LOOK.ink, anchor: 'middle' }));
  // the dive token of the Dutchman: a pair to cut out, fold and glue (diveHtml), how to make it under the pair
  const dx = (A4.w - 2 * TOKEN.underwater.w) / 2, dy = ub.y + ub.h + GAP + CAP + 2, su = capSign(dx, dy);
  const cUw = caption('cap-underwater', dx, dy, TXT.underwaterCaption, ico('underwater', su.cx, su.cy, 4.8, TONE.verdigris)), dv = diveHtml(id2, dx, dy, dive);
  s2.push(cUw.svg, dv.svg); h2.push(cUw.html, dv.html);
  const fb: Rect = { x: dx - 6, y: dy + TOKEN.underwater.h + TICK + 2.5, w: 2 * TOKEN.underwater.w + 12, h: 11.4 };
  s2.push(plateRect('dive-fold', fb));
  h2.push(word('dive-fold', A4.w / 2, fb.y + 1.6, TXT.underwaterFold, { font: 'Alegreya', italic: true, w: 500, size: 9.5, lh: 4.1, color: LOOK.ink, anchor: 'middle', align: 'center', width: fb.w - 3.4, style: 'text-wrap:balance' }));
  const page2 = head(id2 + 'h', mp.title, mp.lead, page(2)) + pageSvg(s2.join('\n')) + h2.join('\n') + foot(2, of)
    + cutLayer(gridCuts(SHIPS.x, SHIPS.y, ships().length, 1, st, st) + marks.cuts + dv.cuts);

  const out: PageSpec[] = [{ html: page1 }, { html: page2 }];
  // concept B with the counters off the board: the four strips «Осталось карт» / «Реакций сыграно» (cut along the lines)
  if (strips) out.push(counterStripsPage(head('tk3h', TXT.strips.title, TXT.strips.lead, page(3)), foot(3, of)));
  return out;
}
/** the sheets of part 04: a dry run collects the words to measure, the browser measures them, then the real run */
export async function tokenPages(ctx: Ctx, pics: Record<string, string> | null = null, strips = false, markerPics = pics): Promise<PageSpec[]> {
  const dive = await diveArt(ctx);
  pages(ctx, pics, strips, dive, markerPics);
  await measureMissing(ctx);
  return pages(ctx, pics, strips, dive, markerPics);
}

export const TOKENS_CSS = `${ART_CSS}
.tk-svg{position:absolute;left:0;top:0;width:210mm;height:297mm}
.tk-hcs{position:absolute;display:flex;gap:4.5mm}
.tk-hc{display:flex;align-items:center;gap:1.8mm}
.tk-hc-l{display:flex;flex-direction:column;align-items:flex-end;text-align:right;font:500 7.5pt/3.05mm 'Alegreya Sans',sans-serif;color:${LOOK.ink};white-space:nowrap}
.tk-hc-l b{font:700 9pt/3.6mm 'Alegreya Sans',sans-serif}
.tk-uses-r{position:absolute;display:flex;justify-content:center;gap:5mm}
.tk-uses-r>span{display:inline-flex;align-items:center;gap:1.4mm;white-space:nowrap}
.tk-use{font:500 9pt/3.8mm 'Alegreya Sans',sans-serif;color:${LOOK.ink};display:block}
`;

export async function build(ctx: Ctx): Promise<Part[]> {
  const fresh = (ctx.opts.tokens ?? 'new') === 'new', pics = fresh ? await kitTokenPics(ctx) : null;
  const pages = await tokenPages(ctx, pics, (ctx.opts.board ?? 'b') === 'b' && ctx.opts.counters === 'strip', fresh ? await kitMarkerPics(ctx) : null);
  return [{ file: '04-tryumy-zhetony', title: TXT.partTitle, css: TOKENS_CSS, pages }, await schemePart(ctx)];
}
