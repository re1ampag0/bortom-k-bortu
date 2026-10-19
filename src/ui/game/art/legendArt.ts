// The pictures of the Legends (FX-B), ported almost word for word from docs/mockups/a5/fx/src/fx3.js (ANIMATIONS.md §4):
// the tentacle TENT, the compass compassArt, the pictures of the Legend cards EMBLEM with ART_FRAME and RAYS, the price
// icons, the wax seal «ЛЕГЕНДА», the crack in the wood crackArt, the bottle on its side bottleArt. Own SVG only.
// What changed: the types, `export`, and the seal and the bottle take a uid for their ids (several on one page).
import { bigShip } from './bigShips';

const R1 = (n: number) => Math.round(n * 10) / 10;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export const TENT = (uid: string | number, k = 1, kx = 1): string => `<g transform="scale(${R1(k * kx * 100) / 100} ${k})"><defs><linearGradient id="pgT${uid}" x1="0" x2="1"><stop offset="0" stop-color="#3a2a48"/><stop offset=".5" stop-color="#7a5a90"/><stop offset="1" stop-color="#2a1e36"/></linearGradient></defs>
  <path d="M-14 0 C-20 -40 6 -62 -4 -104 C-10 -126 4 -146 18 -140 C30 -134 24 -118 14 -120 C8 -112 14 -100 14 -84 C14 -56 4 -34 14 0 Z" fill="url(#pgT${uid})" stroke="#1a1022" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="M8 -4 C2 -34 12 -60 6 -100" fill="none" stroke="#c9a6d6" stroke-width="5" opacity=".35" stroke-linecap="round"/>
  ${[[9, -12, 4], [10, -28, 3.7], [9, -44, 3.4], [8, -60, 3], [8, -76, 2.7], [8, -92, 2.3], [9, -106, 2], [14, -118, 1.6]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${R1(r * .8)}" fill="#e9c9d6" stroke="#6a4a6e" stroke-width=".7"/><ellipse cx="${x}" cy="${y}" rx="${R1(r * .45)}" ry="${R1(r * .35)}" fill="#a0708a"/>`).join('')}</g>`;

/* ----- the compass: a brass bezel, a cream dial with a fine tick ring, an eight-point faceted rose, the letters С В Ю З,
   a blued-steel needle with a red north, a brass cap, the glass glint. Simple shapes, careful proportions. ----- */

export function compassArt(uid: string | number, r = 74, o: { needle?: boolean; shadow?: boolean } = {}): string {
  const id = (k: string) => `pgC${uid}${k}`, P = (a: number) => [Math.cos(a), Math.sin(a)], f = (n: number) => R1(n * 100) / 100;
  const ticks = Array.from({length: 120}, (_, i) => { const a = i * 3 * Math.PI / 180 - Math.PI / 2, big = i % 30 === 0, mid = i % 10 === 0, half = i % 5 === 0;
    const r0 = r * .855, l = r * (big ? .1 : mid ? .072 : half ? .05 : .03), [c, sn] = P(a);
    return `<path d="M${f(c * r0)} ${f(sn * r0)} L${f(c * (r0 - l))} ${f(sn * (r0 - l))}" stroke="#2a2018" stroke-width="${f(r * (big ? .02 : mid ? .013 : .008))}"/>`; }).join('');
  const point = (deg: number, len: number, wid: number, light: string, dark: string) => { const a = deg * Math.PI / 180 - Math.PI / 2, [c, sn] = P(a), [lc, ls] = P(a - Math.PI / 2);
    return `<path d="M0 0 L${f(lc * wid)} ${f(ls * wid)} L${f(c * len)} ${f(sn * len)} Z" fill="${light}"/><path d="M0 0 L${f(c * len)} ${f(sn * len)} L${f(-lc * wid)} ${f(-ls * wid)} Z" fill="${dark}"/>`; };
  const mute = o.needle !== false;   // with a needle on top the rose steps back, so the needle reads at once
  const minor = Array.from({length: 8}, (_, i) => point(22.5 + i * 45, r * .36, r * .045, mute ? '#e6d8b2' : '#d9c38e', mute ? '#c4aa6c' : '#a8873e')).join('');
  const inter = [45, 135, 225, 315].map(d => point(d, r * .5, r * .085, mute ? '#f2e8cc' : '#efe2bf', mute ? '#bfa266' : '#8f6e2c')).join('');
  const card = ([[0, mute ? '#eab4a6' : '#e0503a', mute ? '#c98a7a' : '#9c2216'], ...[90, 180, 270].map(d => [d, mute ? '#faf5ea' : '#f7f1e3', mute ? '#a8957a' : '#2c241c'])] as [number, string, string][]).map(([d, l, dk]) => point(d, r * .6, r * .115, l, dk)).join('');
  const letters = ([['С', 0, '#b8281c'], ['В', 90, '#2a2018'], ['Ю', 180, '#2a2018'], ['З', 270, '#2a2018']] as [string, number, string][]).map(([t, d, c]) => { const [x, y] = P(d * Math.PI / 180 - Math.PI / 2); return `<text x="${f(x * r * .69)}" y="${f(y * r * .69 + r * .05)}" font-family="'Old Standard TT',Georgia,serif" font-weight="700" font-size="${f(r * .14)}" text-anchor="middle" fill="${c}">${t}</text>`; }).join('');
  const nl = r * .8, nw = r * .062;
  const needle = `<g class="nd"><path d="M${f(r * .03)} ${f(-nl + r * .04)} L${f(nw + r * .03)} ${f(r * .04)} L${f(r * .03)} ${f(nl + r * .04)} L${f(-nw + r * .03)} ${f(r * .04)} Z" fill="#000" opacity=".28"/>
    <path d="M0 ${f(-nl)} L${f(nw)} 0 L0 ${f(nl)} L${f(-nw)} 0 Z" fill="url(#${id('st')})" stroke="#0b1016" stroke-width="${f(r * .006)}"/><path d="M0 ${f(-nl)} L${f(nw)} 0 L${f(-nw)} 0 Z" fill="url(#${id('rd')})" stroke="#5a0c08" stroke-width="${f(r * .006)}"/>
    <circle cy="${f(nl * .78)}" r="${f(r * .045)}" fill="none" stroke="#1f2a34" stroke-width="${f(r * .018)}"/><path d="M0 ${f(-r * .7)} L0 ${f(r * .7)}" stroke="#fff" stroke-width="${f(r * .008)}" opacity=".35"/></g>`;
  return `<g><defs>
      <linearGradient id="${id('bz')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbe7a6"/><stop offset=".35" stop-color="#d7ac52"/><stop offset=".6" stop-color="#8a6420"/><stop offset=".85" stop-color="#e6c06a"/><stop offset="1" stop-color="#6e4c14"/></linearGradient>
      <radialGradient id="${id('dl')}" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#fbf5e6"/><stop offset=".8" stop-color="#efe3c6"/><stop offset="1" stop-color="#dcc9a0"/></radialGradient>
      <linearGradient id="${id('st')}" x1="0" x2="1"><stop offset="0" stop-color="#5b6a78"/><stop offset=".5" stop-color="#1f2a34"/><stop offset="1" stop-color="#0e151c"/></linearGradient>
      <linearGradient id="${id('rd')}" x1="0" x2="1"><stop offset="0" stop-color="#ef6a52"/><stop offset=".5" stop-color="#c0291c"/><stop offset="1" stop-color="#7e150c"/></linearGradient>
      <radialGradient id="${id('cp')}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff2c2"/><stop offset=".5" stop-color="#d1a24a"/><stop offset="1" stop-color="#6e4c14"/></radialGradient></defs>
    ${o.shadow !== false ? `<ellipse cx="${f(r * .06)}" cy="${f(r * .1)}" rx="${f(r * 1.02)}" ry="${f(r * 1.02)}" fill="#000" opacity=".28"/>` : ''}
    <circle r="${f(r)}" fill="url(#${id('bz')})"/><circle r="${f(r * .97)}" fill="none" stroke="#fff3c8" stroke-width="${f(r * .012)}" opacity=".7"/>
    <circle r="${f(r * .9)}" fill="#5a3e10"/><circle r="${f(r * .885)}" fill="url(#${id('dl')})"/>
    <circle r="${f(r * .855)}" fill="none" stroke="#2a2018" stroke-width="${f(r * .01)}"/><circle r="${f(r * .755)}" fill="none" stroke="#2a2018" stroke-width="${f(r * .006)}"/>
    ${ticks}${letters}
    <circle r="${f(r * .44)}" fill="none" stroke="#a8873e" stroke-width="${f(r * .008)}"/><circle r="${f(r * .41)}" fill="none" stroke="#a8873e" stroke-width="${f(r * .004)}" stroke-dasharray="${f(r * .02)} ${f(r * .02)}"/>
    ${minor}${inter}${card}
    ${o.needle !== false ? needle : ''}
    <circle r="${f(r * .07)}" fill="url(#${id('cp')})" stroke="#5a3e10" stroke-width="${f(r * .01)}"/><circle cx="${f(-r * .02)}" cy="${f(-r * .02)}" r="${f(r * .022)}" fill="#fff8de" opacity=".8"/>
    <path d="M${f(-r * .7)} ${f(-r * .3)} A${f(r * .78)} ${f(r * .78)} 0 0 1 ${f(r * .3)} ${f(-r * .72)}" fill="none" stroke="#fff" stroke-width="${f(r * .06)}" stroke-linecap="round" opacity=".22"/>
    <path d="M${f(-r * .5)} ${f(-r * .62)} A${f(r * .8)} ${f(r * .8)} 0 0 1 ${f(-r * .1)} ${f(-r * .8)}" fill="none" stroke="#fff" stroke-width="${f(r * .025)}" stroke-linecap="round" opacity=".5"/></g>`;
}


/* the pictures on the Legend cards: 150×99, many small careful details */
const waves = (y: number, amp: number, step: number, x0 = -10, x1 = 160) => { let d = `M${x0} ${y}`; for(let x = x0; x < x1; x += step) d += ` q${step / 4} ${-amp} ${step / 2} 0 t${step / 2} 0`; return d; };
const gull = (x: number, y: number, k = 1) => `<path d="M${x - 4 * k} ${y} q${2 * k} ${-2.4 * k} ${4 * k} 0 q${2 * k} ${-2.4 * k} ${4 * k} 0" fill="none" stroke="#2a2a2a" stroke-width="${R1(.7 * k * 10) / 10}" stroke-linecap="round"/>`;
const puff = (x: number, y: number, r: number, c = '#f4f1ea') => `<g fill="${c}"><circle cx="${x}" cy="${y}" r="${r}"/><circle cx="${x + r * .9}" cy="${y - r * .4}" r="${R1(r * .8)}"/><circle cx="${x - r * .9}" cy="${y - r * .2}" r="${R1(r * .7)}"/><circle cx="${x + r * .2}" cy="${y - r * .9}" r="${R1(r * .7)}"/></g>`;

/* the grand dressing of every Legend picture: rays of light from behind the subject, a deep vignette, gilded corner
   flourishes, a thin gold inner line and a small jewel at the top */
export const RAYS = (cx: number, cy: number, n: number, r: number, c = '#fff2c4', o = .22, a0 = 0): string => `<g opacity="${o}">${Array.from({length: n}, (_, i) => { const a = a0 + i / n * Math.PI * 2, w = Math.PI / n * .55; return `<path d="M${cx} ${cy} L${R1(cx + Math.cos(a - w) * r)} ${R1(cy + Math.sin(a - w) * r)} L${R1(cx + Math.cos(a + w) * r)} ${R1(cy + Math.sin(a + w) * r)} Z" fill="${c}"/>`; }).join('')}</g>`;
export const ART_FRAME = (): string => { const corner = (x: number, y: number, sx: number, sy: number) => `<g transform="translate(${x} ${y}) scale(${sx} ${sy})"><path d="M2 2 H20 M2 2 V16" stroke="#e8c76a" stroke-width="1.6" fill="none"/><path d="M5 5 C11 5 13 9 11 12 C9 14 6 12 8 10" stroke="#e8c76a" stroke-width="1.1" fill="none" stroke-linecap="round"/><path d="M5 5 C5 10 8 13 11 12" stroke="#b8902e" stroke-width=".8" fill="none"/><circle cx="2" cy="2" r="2" fill="#fff0b8" stroke="#8a6420" stroke-width=".5"/></g>`;
  return `<defs><radialGradient id="pgVig" cx=".5" cy=".46" r=".72"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#140c04" stop-opacity=".55"/></radialGradient></defs>
    <rect width="150" height="99" fill="url(#pgVig)"/><rect x="3" y="3" width="144" height="93" rx="2" fill="none" stroke="#e8c76a" stroke-width=".6" opacity=".8"/>
    ${corner(1, 1, 1, 1)}${corner(149, 1, -1, 1)}${corner(1, 98, 1, -1)}${corner(149, 98, -1, -1)}
    <g transform="translate(75 3.4)"><path d="M-10 0 H-3 M3 0 H10" stroke="#e8c76a" stroke-width=".8"/><path d="M0 -3 L3 0 L0 3 L-3 0 Z" fill="#c0291c" stroke="#e8c76a" stroke-width=".7"/></g>`; };

export const EMBLEM: Record<'kraken' | 'armada' | 'bottle' | 'jack', () => string> = {
  kraken: () => `<defs><linearGradient id="pgKs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1a24"/><stop offset="1" stop-color="#2c5466"/></linearGradient>
      <linearGradient id="pgKw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d4a5a"/><stop offset="1" stop-color="#06161d"/></linearGradient>
      <radialGradient id="pgKm"><stop offset="0" stop-color="#fff6d6" stop-opacity=".9"/><stop offset=".35" stop-color="#f2e2a8" stop-opacity=".35"/><stop offset="1" stop-color="#f2e2a8" stop-opacity="0"/></radialGradient>
      <radialGradient id="pgKe" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff4a0"/><stop offset=".55" stop-color="#f2b21c"/><stop offset="1" stop-color="#8a4a08"/></radialGradient></defs>
    <rect width="150" height="99" fill="url(#pgKs)"/>
    <circle cx="122" cy="18" r="34" fill="url(#pgKm)"/>${RAYS(122, 18, 14, 60, "#f6ecc6", .07)}<circle cx="122" cy="18" r="8.5" fill="#f6ecc6"/><circle cx="119.5" cy="16" r="1.6" fill="#d9cc9e"/><circle cx="124.5" cy="21" r="1.1" fill="#d9cc9e"/>
    ${[[14, 10], [32, 22], [58, 8], [86, 16], [100, 6], [140, 40], [8, 34]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".7" fill="#e8f0f4"/>`).join('')}
    <path d="M0 30 q20 -8 44 -2 t50 -6 t60 4 V40 H0 Z" fill="#081620" opacity=".55"/>
    <ellipse cx="44" cy="30" rx="40" ry="22" fill="#cfe6ff" opacity=".18"/><path d="M48 4 L41 22 L48 22 L38 44 L52 20 L45 20 L54 4 Z" fill="#fff8d8" stroke="#d6ecff" stroke-width=".6"/><path d="M44 30 L36 36 M42 34 L46 40" stroke="#fff8d8" stroke-width=".8"/>
    <g stroke="#cfe0ea" stroke-width=".5" opacity=".35">${Array.from({length: 26}, (_, i) => `<path d="M${(i * 37) % 150} ${(i * 23) % 60} l-3 9"/>`).join('')}</g>
    <path d="M0 56 H150 V99 H0 Z" fill="url(#pgKw)"/><path d="M96 56 L150 56 L150 60 Z" fill="#f6ecc6" opacity=".12"/>
    ${[60, 66, 74, 84].map((y, i) => `<path d="${waves(y, 1.6 + i * .5, 12 + i * 4)}" fill="none" stroke="#5f97aa" stroke-width="${R1(.6 + i * .2)}" opacity="${R1(.7 - i * .1)}"/>`).join('')}
    ${[[110, 57], [118, 58.6], [126, 57.4], [134, 59]].map(([x, y]) => `<path d="M${x} ${y} h5" stroke="#f6ecc6" stroke-width=".8" opacity=".6"/>`).join('')}
    <g transform="rotate(-7 84 66)">${bigShip('pearl', 84, 66, .5)}</g>
    <path d="M68 68 q8 -4 16 -1 q10 3 18 -1" fill="none" stroke="#e9f3f6" stroke-width="1.6" stroke-linecap="round"/>
    <g transform="translate(28 99)">${TENT('e1', .62, 1.3)}</g><g transform="translate(138 99) scale(-1 1)">${TENT('e2', .5, 1.3)}</g>
    <path d="M62 69 C72 62 86 74 98 67 C106 62 112 66 114 72" fill="none" stroke="#5a3a6e" stroke-width="7" stroke-linecap="round"/><path d="M62 69 C72 62 86 74 98 67 C106 62 112 66 114 72" fill="none" stroke="#9a78b0" stroke-width="2.4" stroke-linecap="round" opacity=".7" transform="translate(0 -1.4)"/>
    ${[[68, 67.5], [76, 66], [84, 69], [92, 69], [100, 65.6], [108, 66.6]].map(([x, y]) => `<circle cx="${x}" cy="${y + 2}" r="1.3" fill="#e9c9d6" stroke="#6a4a6e" stroke-width=".4"/>`).join('')}
    <g fill="#e9f3f6">${[[26, 76], [30, 73], [134, 80], [138, 78], [112, 72]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2"/>`).join('')}</g>
    <path d="M20 79 q6 -9 12 0 M128 82 q5 -8 11 0" fill="none" stroke="#e9f3f6" stroke-width="1.2" stroke-linecap="round"/>
    <g transform="translate(66 88)"><ellipse rx="19" ry="9.5" fill="#0a1218"/><ellipse rx="16" ry="7.4" fill="url(#pgKe)" stroke="#3a1e04" stroke-width=".8"/>
      ${Array.from({length: 10}, (_, k) => { const a = k / 10 * Math.PI * 2; return `<path d="M${R1(Math.cos(a) * 3)} ${R1(Math.sin(a) * 2.2)} L${R1(Math.cos(a) * 14)} ${R1(Math.sin(a) * 6.6)}" stroke="#a85a0a" stroke-width=".4" opacity=".7"/>`; }).join('')}
      <ellipse rx="2.2" ry="6.8" fill="#070707"/><ellipse cx="-6" cy="-3" rx="2.4" ry="1.4" fill="#fff" opacity=".85"/><path d="M-19 -1 Q0 -14 19 -1" fill="none" stroke="#2a1830" stroke-width="2.2"/></g>
    ${Array.from({length: 9}, (_, k) => `<circle cx="${R1(40 + k * 9 + (k % 2) * 3)}" cy="${R1(76 + (k % 3) * 5)}" r="${R1(.8 + (k % 3) * .4)}" fill="none" stroke="#bfe0ea" stroke-width=".5"/>`).join('')}`,
  armada: () => `<defs><linearGradient id="pgAs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bcd8e4"/><stop offset=".7" stop-color="#efe6cc"/><stop offset="1" stop-color="#f6dfae"/></linearGradient>
      <linearGradient id="pgAw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fa9bc"/><stop offset="1" stop-color="#2f5f74"/></linearGradient>
      <radialGradient id="pgAsun"><stop offset="0" stop-color="#fff6d0"/><stop offset=".4" stop-color="#ffe08a" stop-opacity=".8"/><stop offset="1" stop-color="#ffe08a" stop-opacity="0"/></radialGradient></defs>
    <rect width="150" height="99" fill="url(#pgAs)"/>
    <circle cx="118" cy="30" r="26" fill="url(#pgAsun)"/>${RAYS(118, 30, 16, 140, "#fff6d0", .22, .1)}${Array.from({length: 12}, (_, k) => { const a = k / 12 * Math.PI * 2; return `<path d="M${R1(118 + Math.cos(a) * 11)} ${R1(30 + Math.sin(a) * 11)} L${R1(118 + Math.cos(a) * 17)} ${R1(30 + Math.sin(a) * 17)}" stroke="#f2c25a" stroke-width=".8" opacity=".7"/>`; }).join('')}<circle cx="118" cy="30" r="8" fill="#ffe7a0" stroke="#e8b84a" stroke-width=".6"/>
    ${puff(34, 22, 6, '#fbf8f0')}${puff(70, 14, 4, '#fbf8f0')}${puff(146, 50, 5, '#f6f1e4')}
    ${gull(52, 30, 1.1)}${gull(62, 26, .8)}${gull(88, 34, .9)}
    <path d="M0 60 H150" stroke="#2f5f74" stroke-width=".6"/><rect y="60" width="150" height="39" fill="url(#pgAw)"/>
    <path d="M104 61 L132 61 L126 80 L110 80 Z" fill="#fff4cc" opacity=".2"/>
    ${[64, 70, 78, 88].map((y, i) => `<path d="${waves(y, 1.2 + i * .5, 10 + i * 4)}" fill="none" stroke="#d6e8ee" stroke-width="${R1(.5 + i * .15)}" opacity="${R1(.75 - i * .12)}"/>`).join('')}
    ${bigShip('company', 30, 66, .36)}${bigShip('company', 124, 66, .36)}
    ${puff(46, 63, 4.2)}${puff(53, 61, 3.4)}${puff(106, 63, 4)}${puff(99, 61, 3)}
    ${[[42, 64], [108, 64]].map(([x, y]) => `<path d="M${x} ${y} l3 -1.6 l-.6 1.6 l3 .4 l-3 .8 l.8 1.6 Z" fill="#ffb347"/>`).join('')}
    ${bigShip('company', 76, 72, .5)}
    ${puff(60, 69, 5)}${puff(68, 66, 4.4)}${puff(92, 68, 5)}${[[56, 70], [95, 70]].map(([x, y]) => `<path d="M${x} ${y} l-4 -2 l1 2 l-4 1 l4 1 l-1 2 Z" fill="#ffcf6a"/>`).join('')}
    <path d="M58 76 q18 3 36 0" fill="none" stroke="#f2f8fa" stroke-width="1.2" stroke-linecap="round"/>
    <g transform="translate(20 21)">${[-1, 1].map(sx => `<g transform="scale(${sx} 1)">${Array.from({length: 6}, (_, i) => { const a = Math.PI * (.62 + i * .1); return `<ellipse cx="${R1(Math.cos(a) * 15)}" cy="${R1(Math.sin(a) * 15)}" rx="3.4" ry="1.5" fill="#4f7a3a" stroke="#2a4a1e" stroke-width=".4" transform="rotate(${R1(a * 180 / Math.PI + 90)} ${R1(Math.cos(a) * 15)} ${R1(Math.sin(a) * 15)})"/>`; }).join('')}</g>`).join('')}<path d="M-6 -15 L-3 -19 L0 -15 L3 -19 L6 -15 L6 -12 H-6 Z" fill="#e0bd62" stroke="#8a6420" stroke-width=".5"/></g>
    <g transform="translate(20 21)"><circle r="12" fill="#2f4f66" stroke="#e0bd62" stroke-width="1.6"/><circle r="9.6" fill="none" stroke="#e0bd62" stroke-width=".5"/>
      <g fill="none" stroke="#f6e3a8" stroke-width="1.5" stroke-linecap="round"><path d="M0 -6 V6.4 M-3.6 -3 H3.6 M-6 2.2 Q-5.4 7 0 7.4 Q5.4 7 6 2.2"/><circle cx="0" cy="-7.4" r="1.4"/></g></g>`,
  bottle: () => `<defs><radialGradient id="pgBb" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#f8efd8"/><stop offset="1" stop-color="#e2cfa4"/></radialGradient>
      <radialGradient id="pgBglow"><stop offset="0" stop-color="#fff4c8" stop-opacity=".95"/><stop offset=".6" stop-color="#ffe08a" stop-opacity=".35"/><stop offset="1" stop-color="#ffe08a" stop-opacity="0"/></radialGradient><linearGradient id="pgBw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a87444"/><stop offset="1" stop-color="#5e3a1a"/></linearGradient></defs>
    <rect width="150" height="99" fill="url(#pgBb)"/>
    <g stroke="#b89a64" stroke-width=".4" opacity=".55">${Array.from({length: 16}, (_, k) => { const a = k / 16 * Math.PI * 2; return `<path d="M18 17 L${R1(18 + Math.cos(a) * 170)} ${R1(17 + Math.sin(a) * 170)}"/>`; }).join('')}</g>
    <g stroke="#c9b282" stroke-width=".35" opacity=".5">${Array.from({length: 8}, (_, k) => `<path d="M0 ${k * 14} H150 M${k * 20} 0 V99"/>`).join('')}</g>
    <g transform="translate(18 17)">${compassArt('bb', 10, {needle: false, shadow: false})}</g>
    <circle cx="76" cy="52" r="46" fill="url(#pgBglow)"/>${RAYS(76, 52, 18, 90, "#fff0b0", .28, .2)}
    <ellipse cx="78" cy="86" rx="56" ry="5" fill="#3a2410" opacity=".22"/>
    <path d="M36 86 q-2 -14 8 -16 h4 q8 2 6 16 Z M100 86 q-2 -14 8 -16 h4 q8 2 6 16 Z" fill="url(#pgBw)" stroke="#3a2410" stroke-width=".8"/>
    <rect x="24" y="84" width="110" height="7" rx="2" fill="url(#pgBw)" stroke="#3a2410" stroke-width=".8"/><path d="M28 87 H130" stroke="#c99a64" stroke-width=".6" opacity=".7"/>
    <g transform="translate(76 52) scale(.5)">${bottleArt({ship: true, cork: true})}</g>
    <path d="M128 48 q4 4 0 8 q-4 4 0 8" fill="none" stroke="#8a6a3a" stroke-width="1.6" stroke-linecap="round"/><path d="M126 50 l5 -1 M126 58 l5 -1" stroke="#c9a06a" stroke-width="1.2"/>
    <path d="M136.5 46 q2 3 0 6" fill="#a11d17" stroke="#6a100b" stroke-width=".5"/><circle cx="137" cy="52" r="1.2" fill="#a11d17"/>
    ${Array.from({length: 7}, (_, i) => { const x = [18, 44, 62, 98, 116, 136, 84][i], y = [58, 18, 14, 16, 24, 30, 10][i], r = [2.4, 3, 2, 3.4, 2.2, 2.6, 1.8][i]; return `<path d="M${x} ${y - r} L${R1(x + r * .3)} ${R1(y - r * .3)} L${x + r} ${y} L${R1(x + r * .3)} ${R1(y + r * .3)} L${x} ${y + r} L${R1(x - r * .3)} ${R1(y + r * .3)} L${x - r} ${y} L${R1(x - r * .3)} ${R1(y - r * .3)} Z" fill="#c9a048"/>`; }).join('')}`,
  jack: () => `<defs><linearGradient id="pgJs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e2b4"/><stop offset="1" stop-color="#f1d49a"/></linearGradient>
      <radialGradient id="pgJglow"><stop offset="0" stop-color="#fff6d6" stop-opacity=".9"/><stop offset="1" stop-color="#fff6d6" stop-opacity="0"/></radialGradient><linearGradient id="pgJw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f9fb4"/><stop offset="1" stop-color="#244e60"/></linearGradient></defs>
    <rect width="150" height="99" fill="url(#pgJs)"/><circle cx="38" cy="44" r="50" fill="url(#pgJglow)"/>${RAYS(38, 44, 20, 120, "#fff2c0", .32)}${puff(120, 18, 5, '#fbf3e0')}${puff(92, 10, 3.4, '#fbf3e0')}${gull(104, 30, .9)}${gull(114, 26, .7)}
    <rect y="68" width="150" height="31" fill="url(#pgJw)"/><path d="M0 68 H150" stroke="#2f5f74" stroke-width=".6"/>
    ${[71, 77, 85].map((y, i) => `<path d="${waves(y, 1.2 + i * .5, 11 + i * 4)}" fill="none" stroke="#d6e8ee" stroke-width="${R1(.5 + i * .15)}" opacity="${R1(.7 - i * .15)}"/>`).join('')}
    <path d="M66 52 C88 44 100 58 108 74" fill="none" stroke="#c9a048" stroke-width="1.8" stroke-dasharray="4 3" stroke-linecap="round"/><path d="M106 70 l3 5 l1 -6" fill="none" stroke="#c9a048" stroke-width="1.6" stroke-linecap="round"/>
    <g opacity=".18">${bigShip('pearl', 96, 82, .42, true)}</g><g opacity=".32">${bigShip('pearl', 106, 82, .42, true)}</g>${bigShip('pearl', 118, 82, .42, true)}
    <path d="M94 81 q-10 1 -20 -1 M94 84 q-12 2 -24 0" stroke="#eef6f8" stroke-width="1.2" fill="none" stroke-linecap="round"/><path d="M140 80 q4 -2 6 0" stroke="#fff" stroke-width="1" fill="none"/>
    <g transform="translate(38 44)">${compassArt('je', 32, {needle: true}).replace('<g class="nd">', '<g class="nd" transform="rotate(62)">')}</g>
    ${[[78, 30], [70, 18], [88, 22]].map(([x, y]) => `<path d="M${x} ${y - 2.4} L${x + .7} ${y - .7} L${x + 2.4} ${y} L${x + .7} ${y + .7} L${x} ${y + 2.4} L${x - .7} ${y + .7} L${x - 2.4} ${y} L${x - .7} ${y - .7} Z" fill="#c9a048"/>`).join('')}`,
};

export const COST_ICON: Record<'powder' | 'souls', string> = {
  powder: `<svg width="15" height="19" viewBox="0 0 27 34" aria-hidden="true"><path d="M5 3 Q13.5 0 22 3 Q26 17 22 31 Q13.5 34 5 31 Q1 17 5 3 Z" fill="#a8703a" stroke="#3a2412" stroke-width="1.6"/><path d="M3.4 10 Q13.5 7.6 23.6 10 M3.4 24 Q13.5 26.4 23.6 24" stroke="#3a3530" stroke-width="2.2" fill="none"/><path d="M10 3 Q8.6 17 10 31 M17 3 Q18.4 17 17 31" stroke="#7a4f24" stroke-width="1"/></svg>`,
  souls: `<svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6 C6.6 2.6 3.4 6.4 3.4 10.8 C3.4 13.6 4.8 15.4 6.6 16.4 V19.6 Q6.6 21.2 8.2 21.2 H15.8 Q17.4 21.2 17.4 19.6 V16.4 C19.2 15.4 20.6 13.6 20.6 10.8 C20.6 6.4 17.4 2.6 12 2.6 Z" fill="#dff7e8" stroke="#1e3a2a" stroke-width="1.3"/><ellipse cx="8.8" cy="11.4" rx="2.3" ry="2.6" fill="#1e3a2a"/><ellipse cx="15.2" cy="11.4" rx="2.3" ry="2.6" fill="#1e3a2a"/><path d="M12 14 L10.9 16.4 H13.1 Z" fill="#1e3a2a"/><path d="M9.4 21 V18.6 M12 21 V18.6 M14.6 21 V18.6" stroke="#1e3a2a" stroke-width="1"/></svg>`};
export const COST_WORD = (n: number, k: 'powder' | 'souls'): string => k === 'souls' ? `${n} ${n === 1 ? 'Душа' : n < 5 ? 'Души' : 'Душ'}` : `${n} ${n === 1 ? 'Порох' : n < 5 ? 'Пороха' : 'Пороха'}`;

export const SEAL_HTML = (() => {
  const blob = Array.from({length: 36}, (_, i) => { const a = i / 36 * Math.PI * 2, r = 40.5 + Math.sin(i * 2.7) * 1.6 + (i % 5 === 0 ? 2.2 : 0); return (i ? 'L' : 'M') + R1(Math.cos(a) * r) + ' ' + R1(Math.sin(a) * r); }).join(' ') + ' Z';
  const star = Array.from({length: 10}, (_, i) => { const a = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? 4.6 : 10.6; return (i ? 'L' : 'M') + R1(Math.cos(a) * r) + ' ' + R1(Math.sin(a) * r); }).join(' ') + ' Z';
  const dots = [66, 90, 114].map(d => { const a = d * Math.PI / 180; return `<path transform="translate(${R1(Math.cos(a) * 28.5)} ${R1(Math.sin(a) * 28.5)})" d="M0 -3 L2.2 0 L0 3 L-2.2 0 Z" fill="#f2c94c" stroke="#4a0a07" stroke-width=".6"/>`; }).join('');
  return `<svg width="96" height="96" viewBox="-48 -48 96 96" aria-hidden="true"><defs><path id="pgSealTop" d="M-25.6 7 A26.5 26.5 0 1 1 25.6 7"/>
    <radialGradient id="pgWax" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#d8412f"/><stop offset=".55" stop-color="#a41e17"/><stop offset="1" stop-color="#6a100b"/></radialGradient></defs>
    <path d="${blob}" fill="url(#pgWax)" stroke="#560d09" stroke-width="1.2"/>
    <circle r="37" fill="none" stroke="#560d09" stroke-width="1.1" opacity=".75"/><circle cx="-.6" cy="-.6" r="36" fill="none" stroke="#f08a78" stroke-width=".8" opacity=".55"/>
    <circle r="19" fill="#8e1812" stroke="#560d09" stroke-width="1.3"/><circle cx="-.6" cy="-.6" r="18" fill="none" stroke="#e8705e" stroke-width=".8" opacity=".6"/>
    <text font-family="'Old Standard TT',Georgia,serif" font-size="11" font-weight="700" letter-spacing="1.6" fill="#fff3e4" stroke="#43090600" text-anchor="middle"><textPath href="#pgSealTop" startOffset="50%">ЛЕГЕНДА</textPath></text>
    <text font-family="'Old Standard TT',Georgia,serif" font-size="11" font-weight="700" letter-spacing="1.6" fill="none" stroke="#430906" stroke-width="2.6" stroke-linejoin="round" text-anchor="middle" opacity=".9" style="mix-blend-mode:multiply"><textPath href="#pgSealTop" startOffset="50%">ЛЕГЕНДА</textPath></text>
    <text font-family="'Old Standard TT',Georgia,serif" font-size="11" font-weight="700" letter-spacing="1.6" fill="#fff3e4" text-anchor="middle"><textPath href="#pgSealTop" startOffset="50%">ЛЕГЕНДА</textPath></text>
    ${dots}<path d="${star}" fill="#f2c94c" stroke="#5a0c08" stroke-width="1" stroke-linejoin="round"/>
    <path d="M-30 -20 Q-18 -34 2 -34" stroke="#ffb0a0" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".45"/></svg>`;
})();

export function crackArt(uid: string | number, x0: number, y0: number, len: number, ang: number, w0 = 4): string {
  const walk = (x: number, y: number, a0: number, L: number): number[][] => { const pts = [[x, y]]; let a = a0; for(let d = 0; d < L;){ const kink = Math.random() < .28; a = a0 + Math.max(-.32, Math.min(.32, a - a0 + rnd(-.22, .22))); const aa = kink ? a + (Math.random() < .5 ? -1 : 1) * rnd(.45, .75) : a, st = kink ? rnd(3, 6) : rnd(7, 15); d += st; x += Math.cos(aa) * st; y += Math.sin(aa) * st; pts.push([x, y]); } return pts; };
  const poly = (pts: number[][], w: number) => { const L: number[][] = [], Rr: number[][] = []; pts.forEach(([px, py], i) => { const [qx, qy] = pts[Math.min(i + 1, pts.length - 1)], [ox, oy] = pts[Math.max(i - 1, 0)]; const dx = qx - ox, dy = qy - oy, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d, ww = w * Math.pow(1 - i / (pts.length - 1), 1.1) + .15;
      const j1 = rnd(.4, 1.4), j2 = rnd(.4, 1.4); L.push([px + nx * ww * j1, py + ny * ww * j1]); Rr.push([px - nx * ww * j2, py - ny * ww * j2]); });
    return 'M' + L.concat(Rr.reverse()).map(([a, b]) => `${R1(a)} ${R1(b)}`).join(' L') + ' Z'; };
  const line = (pts: number[][]) => 'M' + pts.map(([a, b]) => `${R1(a)} ${R1(b)}`).join(' L');
  const main = walk(x0, y0, ang, len), parts: [number[][], number][] = [[main, w0]];
  for(let k = 0; k < 3; k++){ const i = Math.floor(rnd(1, main.length * .75)), [bx, by] = main[i], wi = w0 * (1 - i / main.length) * .55; parts.push([walk(bx, by, ang + (k % 2 ? 1 : -1) * rnd(.35, .7), rnd(8, 22)), wi]); }
  const chips = Array.from({length: 5}, () => { const a = rnd(0, Math.PI * 2), r = rnd(3, 9), cx = x0 + Math.cos(a) * r, cy = Math.max(1, y0 + Math.abs(Math.sin(a)) * r); return `<path d="M${R1(cx)} ${R1(cy)} l${R1(rnd(-3, 3))} ${R1(rnd(1, 3))} l${R1(rnd(1, 3))} ${R1(rnd(-1, 2))} Z" fill="#2a1a0c" opacity=".8"/>`; }).join('');
  return `<g><defs><mask id="pgCr${uid}" maskUnits="userSpaceOnUse" x="-50" y="-50" width="${R1(x0 + len + 200)}" height="${R1(len + 200)}"><circle class="rv" r="${R1(len * 1.15)}" fill="#fff" style="transform:translate(${R1(x0)}px,0px) scale(0)"/></mask></defs>
    <g mask="url(#pgCr${uid})">
      <ellipse cx="${R1(x0)}" cy="${R1(y0 + 3)}" rx="${R1(w0 * 3.4)}" ry="${R1(w0 * 1.8)}" fill="#5a3a1c" opacity=".18"/><path d="M${R1(x0 - 6)} ${R1(y0)} L${R1(x0 - 1)} ${R1(y0 + 6)} L${R1(x0 + 2)} ${R1(y0 + 2)} L${R1(x0 + 7)} ${R1(y0)} Z" fill="#1c1006"/>
      ${parts.map(([pts, w]) => `<path d="${line(pts)}" fill="none" stroke="#6b4a2a" stroke-width="${R1(w + 1.2)}" stroke-linecap="round" stroke-linejoin="round" opacity=".16"/>`).join('')}
      ${main.filter((_, i) => i % 2 && i < main.length - 2).map(([px, py], i) => `<path d="M${R1(px + (i % 2 ? 1.5 : -1.5))} ${R1(py)} l${i % 2 ? 3.4 : -3.4} ${R1(rnd(-1, 2))} l${i % 2 ? -1 : 1} ${R1(rnd(2, 4))} Z" fill="#ead6ac" stroke="#9a7444" stroke-width=".4"/>`).join('')}
      ${parts.map(([pts]) => `<path d="${line(pts.map(([a, b]) => [a + 1, b + 1.1]))}" fill="none" stroke="#fffaf0" stroke-width="1" stroke-linejoin="round" opacity=".85"/>`).join('')}
      ${parts.map(([pts, w]) => `<path d="${poly(pts, w)}" fill="#1c1006"/>`).join('')}
      ${parts.map(([pts, w]) => `<path d="${line(pts.map(([a, b]) => [a - w * .25, b - .4]))}" fill="none" stroke="#5a3418" stroke-width="${R1(Math.max(.6, w * .35))}" opacity=".9"/>`).join('')}
      ${chips}</g></g>`;
}

export const BOTTLE_PATH = 'M-82 -44 H40 C62 -44 72 -30 80 -15 H103 V-19 H112 V19 H103 V15 H80 C72 30 62 44 40 44 H-82 C-96 44 -100 36 -100 22 V-22 C-100 -36 -96 -44 -82 -44 Z';
export const BOTTLE_SEA = 'M-104 26' + ' q9 -5 18 0 t18 0'.repeat(1) + ' t18 0'.repeat(11) + ' V60 H-104 Z';
export const CORK = `<g><rect x="-11" y="-13" width="22" height="26" rx="3.5" fill="#c9a06a" stroke="#5a3a1c" stroke-width="1.6"/><path d="M-5 -10 v20 M2 -11 v22" stroke="#9a7444" stroke-width="1"/><path d="M-8 -8 h3 M3 5 h3" stroke="#ead0a4" stroke-width="1"/></g>`;
export function bottleArt(o: { ship?: boolean; cork?: boolean } = {}): string {
  return `<defs><clipPath id="pgBotClip"><path d="${BOTTLE_PATH}"/></clipPath><linearGradient id="pgBotG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0fbf6" stop-opacity=".6"/><stop offset=".45" stop-color="#bfe3d6" stop-opacity=".2"/><stop offset="1" stop-color="#6fae98" stop-opacity=".45"/></linearGradient></defs>
    <path class="gfill" d="${BOTTLE_PATH}" fill="url(#pgBotG)"/>
    <g clip-path="url(#pgBotClip)">${o.ship ? bigShip('company', -24, 28, .62) : ''}<path class="bsea" d="${BOTTLE_SEA}" fill="#4f88a0" opacity=".62"/><path d="M-104 26 q9 -5 18 0${' t18 0'.repeat(12)}" fill="none" stroke="#dff1f4" stroke-width="1.4" opacity=".8"/></g>
    <path class="glass" d="${BOTTLE_PATH}" fill="none" stroke="#e8f7f0" stroke-width="3" stroke-linejoin="round"/>
    <path d="${BOTTLE_PATH}" fill="none" stroke="#2f5a4a" stroke-width=".8" opacity=".55" transform="translate(0 1.4)"/>
    <ellipse cx="-95" cy="0" rx="4" ry="26" fill="none" stroke="#ffffff" stroke-width="1.6" opacity=".35"/>
    <g class="hl"><path d="M-82 -35 H38 C52 -35 60 -31 66 -25" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".6"/><path d="M-70 35 H-26" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".45"/><path d="M86 -9 H100" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".65"/></g>
    ${o.cork ? `<g transform="translate(118 0)">${CORK}</g>` : ''}`;
}

/* ----- Корабль в бутылке: a glass bottle draws itself on its side, a vortex of sparks pulls «Индевор» in through the neck, the cork
   flies in from «Месть» — «чпок», the bottle drops onto the sea and floats there ----- */
