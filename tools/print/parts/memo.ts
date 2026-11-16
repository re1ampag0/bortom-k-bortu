// 02 — the memos: four A5 memos, one per ship (data.ships order), two-sided, two A5s per landscape A4 sharing one cut
// line; the PDF is printed duplex on the short edge (the back of the left memo is the right half of the back page). Then
// «Подготовка к игре», A5, two copies on one landscape A4 (page 5, printed on one side).
// The face is in the world of the ship boards v2 (parts/boards/v2.ts): a parchment cartouche with the ship's letter in a
// brass medallion, the ship's paper and inks, the engraved icons (parts/icons.ts), brass cells and number discs; the
// back («Справка») is the same on all four, so a wrong flip shows no other ship. The text is tools/print/text/memo.md
// (the mark-up of rules.ts; «---» — the line between the face and the back), the labels are text/memo-ships.json;
// «Мой корабль» and the setup sheet are taken from rules.md word for word.
// Each side gets the largest of SIZES at which it fits its A5; never below 9 pt.
// Every plate is marked data-plate, every block of words data-in="<its plate>" (plate names carry the side, L or R, as
// the two memos of a sheet must not share one): tools/print/check-layout.ts checks that each block lies inside its plate
// with 1.5 mm to spare and touches no other block and no other plate (icons, cells, number discs, medals).
import fs from 'node:fs';
import path from 'node:path';
import { HERE, data, esc, fontCss, type Ctx, type Part } from '../kit';
import { BRASS, BRASS_DARK, DECK_KEY, INK, TYPE, contrast, darken, lighten, type CardType } from '../colors';
import { BOARD, type Ship } from '../layout';
import { iconImg } from '../icons';
import { icon, TONE, type IconName, type IconTone } from './icons';
import { basePalette } from './boards/frame';
import { DIAGRAM_CSS, TEXT_CSS, diagram, inline, loadText, measure, parse, type Block } from './rules';

interface Labels {
  partTitle: string; cut: string;
  back: { title: string; sub: string };
  path: { section: string; sign: string };
  ticks: { section: string; title: string; items: string[] };
  ship: { section: string; more: string; rulesHeading: string };
  icons: Record<string, string>;
  setup: { title: string; sub: string; rulesHeading: string; secretAfter: number; secretFrom: string };
}
const L = JSON.parse(fs.readFileSync(path.join(HERE, 'text/memo-ships.json'), 'utf8')) as Labels;

const SHEET_W = 297, A5 = { w: 148.5, h: 210, pad: 7 };
const W = A5.w - 2 * A5.pad, H = A5.h - 2 * A5.pad; // 134.5 × 196
const BAND = { face: 16.4, back: 12, setup: 12.5 }, PANEL_GAP = 1.2, PX = 3, PY = 1.8; // the cartouches; the slip under them
const IW = W - 2 * PX, KEYW = 28.5, CELL = BOARD.cell; // the inner width; the column of section names; the tick cell (13 mm: an 11 mm marker fits)
const KEY_IC = 5;
/** the column of section names: the tinted strip reaches STRIP_OUT mm into the panel's margin, its words keep KPAD mm from
 *  its right edge, the strip stops KGAP mm before the text; the names are KEY_UP pt larger than the text */
const STRIP_OUT = 1.4, KPAD = 1, KGAP = 1.5, IC_GAP = 1.1, KEY_UP = 2, SEP = 0.4;
const KEY_W = KEYW - KGAP - KPAD, KEY_W1 = KEY_W - KEY_IC - IC_GAP; // the words' width: under the icon, beside it
const keyPt = (fs: number) => fs + KEY_UP, keyLh = (fs: number) => r(keyPt(fs) * 1.2 * 0.3528); // the engraved icon of a section, mm
const SIZES = [10.5, 10, 9.5, 9], SETUP_SIZES = [12, 11.5, 11, ...SIZES]; // pt; never below 9
const CREAM = '#fff8e6', G0 = 0.6, GMAX = 2.4; // the space above and below a section: at least G0, the spare room shared up to GMAX
const r = (n: number) => Math.round(n * 100) / 100;
const pt = (n: number) => n * 25.4 / 72;

// ---- the look: the paper, inks and brass of each ship as on its board (boards/v2.ts LOOKS); the back is plain sepia ----
interface Look { tone: IconTone; paper: string; paperLine: string; soft: string; cell: string; cellDeep: string; noteLine: string; brass: [string, string, string] }
const BRASS3: [string, string, string] = ['#f3d68c', '#c4954a', '#5e4214'];
const LOOKS: Record<'pearl' | 'revenge' | 'endeavour' | 'dutch' | 'back', Look> = {
  pearl: { tone: TONE.sepia, paper: '#f1e4c2', paperLine: '#5a4024', soft: '#4f3d28', cell: '#f7eed6', cellDeep: '#e3d1a6', noteLine: '#b9a47a', brass: BRASS3 },
  revenge: { tone: TONE.red, paper: '#f2e2c0', paperLine: '#5a2416', soft: '#4f3326', cell: '#f8ecd2', cellDeep: '#e6cca0', noteLine: '#c4a07a', brass: BRASS3 },
  endeavour: { tone: TONE.navy, paper: '#f8f1de', paperLine: '#1f2a3a', soft: '#33405a', cell: '#fbf6e8', cellDeep: '#e6dcc0', noteLine: '#a8b8cc', brass: ['#f6dc94', '#c99a46', '#5e4214'] },
  dutch: { tone: TONE.verdigris, paper: '#e9e4c8', paperLine: '#22322a', soft: '#33443a', cell: '#f0ecd6', cellDeep: '#d4d0b0', noteLine: '#9aa890', brass: ['#d8cf98', '#8f8a52', '#3a3a22'] },
  back: { tone: TONE.sepia, paper: '#f1e4c2', paperLine: '#5a4024', soft: '#4f3d28', cell: '#f8f0da', cellDeep: '#e3d1a6', noteLine: '#b9a47a', brass: BRASS3 }
};

// ---- colours: the ship colour is the accent (keys, discs, the name); the text stands on the light paper of the slip ----
/** strip — the light band of the ship's colour under the column of section names */
interface Pal { head: string; disc: string; field: string; strip: string; line: string; chip: string; look: Look }
function check(fg: string, bg: string, min: number, what: string) {
  const c = contrast(fg, bg);
  if (c < min) throw new Error(`memo: ${what} — contrast ${c.toFixed(2)} : 1, need ≥ ${min}`);
}
const hex = (c: string) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const mix = (a: string, b: string, k: number) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * k).toString(16).padStart(2, '0')).join('');
function palette(color: string, look: Look, what: string, head0?: string): Pal {
  const field = look.cell, base = basePalette(color), strip = mix(field, color, 0.1);
  let head = head0 ?? base.deep, disc = base.solid;
  for (let k = 0.05; contrast(head, strip) < 7 && k < 0.9; k += 0.05) head = darken(head0 ?? color, k); // keys are bold type on the strip: 7 : 1, not only 4.5
  for (let k = 0.05; contrast(CREAM, disc) < 7 && k < 0.9; k += 0.05) disc = darken(color, k);
  const pal = { head, disc, field, strip, line: mix(look.noteLine, field, 0.15), chip: mix(field, '#ffffff', 0.55), look };
  check(head, strip, 7, `${what}: headings on the strip`);
  check(INK, field, 7, `${what}: text on the field`); check(INK, pal.chip, 7, `${what}: text on a chip`); check(INK, look.paper, 7, `${what}: text on the cartouche`);
  check(head, field, 7, `${what}: headings`); check(head, look.paper, 4.5, `${what}: the name on the cartouche`); check(look.soft, look.paper, 4.5, `${what}: soft words on the cartouche`);
  check(CREAM, disc, 7, `${what}: the number discs`);
  return pal;
}

// ---- the icons of the sections: the engraved set (parts/icons.ts) where it has the thing; own line drawings otherwise ----
const ENGRAVED: Record<string, IconName> = {
  round: 'seaCard', cards: 'cards', cannon: 'guns', ship: 'sails', shield: 'reaction', coin: 'powder', flame: 'fire', burst: 'hull', sunk: 'underwater'
};
const LINE: Record<string, string> = {
  hourglass: '<path d="M6 3h12M6 21h12"/><path d="M7.5 3v2.5c0 2.6 4.5 4 4.5 6.5s-4.5 3.9-4.5 6.5V21M16.5 3v2.5c0 2.6-4.5 4-4.5 6.5s4.5 3.9 4.5 6.5V21"/><path d="M9.6 19.6c.8-1.6 1.6-2.4 2.4-2.4s1.6.8 2.4 2.4z" fill="currentColor" stroke="none"/>',
  hook: '<rect x="3" y="7" width="9" height="13" rx="1.5"/><path d="M18 2.5v10a3 3 0 0 1-6 0v-1.5"/>',
  deck: '<rect x="7" y="3" width="12" height="16" rx="1.5"/><path d="M4.5 6v13.5A1.5 1.5 0 0 0 6 21h10.5"/>',
  check: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 12.5l3.5 3.5L17 8.5"/>',
  flag: '<path d="M5.5 21.5V2.5"/><path d="M5.5 4h12.5l-3 4 3 4H5.5"/>'
};
const BOLT = '<path d="M13.5 2L5 13.5h6.2L10 22l8.8-12H12.5z" fill="currentColor" stroke="none"/>';
const boltSvg = (size: number, color: string, cls: string, plate = '') =>
  `<svg class="${cls}"${plate ? ` data-plate="${plate}"` : ''} style="width:${size}mm;height:${size}mm;color:${color}" viewBox="0 0 24 24">${BOLT}</svg>`;
/** a section's icon: a box of KEY_IC mm marked as a plate, the words keep clear of it */
function keyIcon(old: string, pal: Pal, plate: string): string {
  const s = KEY_IC, open = `<svg class="me-ic" data-plate="${plate}"`;
  if (old === 'nocannon') // «это не Залп»: the cannon struck through, a line of the field under the red stroke
    return `${open} viewBox="0 0 ${s} ${s}">${icon('guns', s / 2, s / 2, s, pal.look.tone)}<path d="M.5 .7L${s - 0.5} ${s - 0.7}" stroke="${pal.field}" stroke-width="1.1" stroke-linecap="round"/><path d="M.5 .7L${s - 0.5} ${s - 0.7}" stroke="#9a1f14" stroke-width=".5" stroke-linecap="round"/></svg>`;
  if (ENGRAVED[old]) return `${open} viewBox="0 0 ${s} ${s}">${icon(ENGRAVED[old], s / 2, s / 2, s, pal.look.tone)}</svg>`;
  if (LINE[old]) return `${open} viewBox="0 0 24 24" fill="none" stroke="${pal.look.tone.ink}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" color="${pal.look.tone.ink}">${LINE[old]}</svg>`;
  throw new Error(`memo: no icon «${old}»`);
}

// ---- brass: the gradients of a side (ids carry the side: «@P» is replaced by L or R), a disc with a number, a cell ----
const defsOf = (look: Look) => {
  const [bl, bm, bd] = look.brass;
  return `<defs><linearGradient id="@Pbr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bl}"/><stop offset=".42" stop-color="${bm}"/><stop offset=".55" stop-color="${bm}"/><stop offset="1" stop-color="${bd}"/></linearGradient>
<linearGradient id="@Pbrh" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bl}"/><stop offset=".5" stop-color="${bm}"/><stop offset="1" stop-color="${bd}"/></linearGradient>
<linearGradient id="@Pwell" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${look.cellDeep}"/><stop offset=".35" stop-color="${look.cell}"/><stop offset="1" stop-color="${look.cell}"/></linearGradient>
<linearGradient id="@Ppaper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${look.paper}"/><stop offset="1" stop-color="${mix(look.paper, '#8a6a3a', 0.08)}"/></linearGradient></defs>`;
};
/** a number in a brass-rimmed disc of the ship's colour; the digit stands on its optical centre (half the cap height
 *  under the middle). The digit's box is the font's ascent to descent, so it keeps only 0.4 mm from the rim (data-inset). */
function discSvg(n: string, pal: Pal, plate: string, cls: string): string {
  const fsz = 5.4, base = 5 + 0.34 * fsz;
  return `<svg class="${cls}" data-plate="${plate}" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4.95" fill="url(#@Pbrh)"/><circle cx="5" cy="5" r="4.05" fill="${pal.disc}"/>` +
    `<text data-in="${plate}" data-inset=".4" x="5" y="${r(base)}" text-anchor="middle" font-family="'Alegreya Sans',sans-serif" font-weight="800" font-size="${fsz}" fill="${CREAM}">${esc(n)}</text></svg>`;
}
/** a tick cell: a brass rim round a clean recessed well (boards v2) */
const cellSvg = (plate: string, look: Look) => `<svg data-plate="${plate}" viewBox="0 0 ${CELL} ${CELL}"><rect x=".1" y=".1" width="${CELL - 0.2}" height="${CELL - 0.2}" rx="1.8" fill="url(#@Pbrh)" stroke="${look.brass[2]}" stroke-width=".22"/>` +
  `<rect x=".95" y=".95" width="${r(CELL - 1.9)}" height="${r(CELL - 1.9)}" rx="1.1" fill="url(#@Pwell)" stroke="${look.brass[2]}" stroke-width=".2"/></svg>`;
/** a compass star, light and dark halves of each point (the medallion of the back and of the setup sheet) */
function starSvg(cx: number, cy: number, R: number, light: string, dark: string): string {
  const out: string[] = [];
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 4, q = i % 2 ? R * 0.55 : R, s = R * 0.2, at = (rr: number, b: number) => `${r(cx + rr * Math.cos(b))} ${r(cy + rr * Math.sin(b))}`;
    out.push(`<path d="M${cx} ${cy}L${at(q, a)}L${at(s, a + Math.PI / 4)}Z" fill="${light}"/><path d="M${cx} ${cy}L${at(q, a)}L${at(s, a - Math.PI / 4)}Z" fill="${dark}"/>`);
  }
  return out.join('') + `<circle cx="${cx}" cy="${cy}" r="${r(R * 0.12)}" fill="${light}"/>`;
}

const lhOf = (fs: number) => +(fs * 1.2 * 0.3528).toFixed(2);
// One CSS for every side: the type size and line height of a side are the vars --fs (pt) and --lh (mm) of its flow.
const CSS = `${TEXT_CSS}
.me{position:absolute;top:${A5.pad}mm;width:${W}mm;height:${H}mm}
.me-band{position:absolute;left:0;top:0;width:${W}mm}
.me-band>svg,.me-bg{position:absolute;left:0;top:0;display:block}
.me-nm{position:absolute;font:800 15pt/7mm 'Alegreya SC',serif;letter-spacing:.01em;white-space:nowrap}
.me-cap{position:absolute;font:italic 500 9.5pt/4.4mm Alegreya,serif;white-space:nowrap}
.me-cap b{font:800 7.5pt/4.4mm 'Alegreya Sans',sans-serif;font-style:normal;letter-spacing:.12em;text-transform:uppercase}
.me-tt{position:absolute;font:italic 500 14pt/6.6mm Alegreya,serif;white-space:nowrap;color:${INK}}
.me-ts{position:absolute;font:500 8.5pt/4.4mm 'Alegreya Sans',sans-serif;white-space:nowrap}
.me-bt{position:absolute;font:800 15pt/7mm 'Alegreya SC',serif;letter-spacing:.02em;white-space:nowrap}
.me-panel{position:absolute;left:0;width:${W}mm;box-sizing:border-box;padding:${PY}mm ${PX}mm}
.me-m{position:relative;font:400 var(--fs)/var(--lh) Alegreya,serif;color:${INK}}
.me-m b{font-weight:700}
.me-sec{display:flex;align-items:stretch}
.me-key{flex:none;width:${KEYW + STRIP_OUT - KGAP}mm;margin:0 ${KGAP}mm 0 -${STRIP_OUT}mm;box-sizing:border-box;padding:var(--g) ${KPAD}mm var(--g) ${STRIP_OUT}mm;background:var(--t);font:800 var(--kf)/var(--kl) 'Alegreya Sans',sans-serif;color:var(--h)}
.me-kr{display:flex;align-items:center;gap:${IC_GAP}mm}
.me-kt{flex:1;min-width:0;white-space:nowrap}
.me-kt2{white-space:normal}
.me-ic{flex:none;display:block;width:min(${KEY_IC}mm, calc(var(--kl) - .2mm));height:min(${KEY_IC}mm, calc(var(--kl) - .2mm));margin:max(.1mm, calc((var(--kl) - ${KEY_IC}mm) / 2)) 0}
.me-val{flex:1;min-width:0;padding:var(--g) 0}
.me-sep{display:block;margin-left:-${STRIP_OUT}mm}
.me-p{margin:0}
.me-p+.me-p,.me-li+.me-p,.me-sub+.me-p,.me-path+.me-p{margin-top:var(--a)}
.me-li{position:relative;padding-left:4.6mm}
.me-li+.me-li,.me-sub+.me-li{margin-top:calc(var(--a) * .5)}
.me-mk{position:absolute;left:0;top:0;font-weight:800;color:var(--h)}
.me-bu{position:absolute;left:1.2mm;top:calc(var(--lh) / 2 - .55mm);width:1.1mm;height:1.1mm;border-radius:50%;background:var(--h)}
.me-sub{margin:calc(var(--a) * .4) 0 0 4.6mm;padding-left:2.2mm;border-left:.5mm solid var(--l)}
.me-sub .me-li{padding-left:3.4mm}
.me-sub .me-bu{left:.6mm;width:.9mm;height:.9mm;top:calc(var(--lh) / 2 - .45mm)}
.me-sub .me-li+.me-li{margin-top:0}
.me-split{display:flex;align-items:flex-start;gap:3mm}
.me-split>.me-main{flex:1;min-width:0}
.me-tk{flex:none;width:${2 * CELL + 3}mm;text-align:center}
.me-tkt{font:800 8pt/3.6mm 'Alegreya Sans',sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--h)}
.me-tkr{display:flex;justify-content:space-between;margin-top:.8mm}
.me-tc{width:${CELL + 1}mm;display:flex;flex-direction:column;align-items:center}
.me-tc>svg{display:block;width:${CELL}mm;height:${CELL}mm}
.me-tc>div{margin-top:.6mm;font:700 8pt/3.3mm 'Alegreya Sans',sans-serif;color:${INK}}
.me-path{display:flex;align-items:center;gap:.8mm}
.me-chip{flex:1 1 auto;display:flex;align-items:center;gap:1.4mm;min-height:calc(var(--lh) * 2 + 3.1mm);box-sizing:border-box;padding:1.25mm 1.8mm 1.25mm 1.4mm;line-height:calc(var(--lh) * .92)}
.me-chip,.me-ship,.su-note{background:var(--c);border:.3mm solid var(--lb);border-radius:1.5mm}
.me-chip b{display:block;font-weight:700;line-height:var(--lh)}
.me-chip small{display:block;font-size:max(8pt, calc(var(--fs) - 2pt));line-height:calc(var(--lh) * .85)}
.me-num{flex:none;display:block;position:relative;width:5mm;height:5mm}
.me-arr{flex:none;display:block;width:3.6mm;height:3mm}
.me-sign{flex:none;display:flex;flex-direction:column;align-items:center;font:800 8pt/3.4mm 'Alegreya Sans',sans-serif;letter-spacing:.04em;color:var(--h)}
.me-sign>svg{display:block}
.me-bolt{display:inline-block;vertical-align:-.7mm;margin-right:.6mm}
.me-ship{padding:1.3mm 2.2mm 1.4mm}
.me-more{margin-top:calc(var(--a) * .5);font-style:italic}
.me-grid{display:flex;flex-wrap:wrap}
.me-ty{position:relative;width:50%;height:9.2mm;box-sizing:border-box;padding:2.2mm 0 0 11.6mm;font:500 10pt/4.8mm Alegreya,serif;white-space:nowrap}
.me-ty b{font:800 10pt/4.8mm 'Alegreya Sans',sans-serif;letter-spacing:.05em}
.me-md{position:absolute;left:.6mm;top:.4mm;width:8.4mm;height:8.4mm}
.me-types{padding-top:var(--g)}
.su-num{position:absolute;left:0;top:0;display:block;width:var(--lh);height:var(--lh)}
.su-li{position:relative;padding-left:calc(var(--lh) + 2.2mm)}
.su-li+.su-li{margin-top:var(--a)}
.su-sub{margin:calc(var(--a) * .5) 0 0;padding-left:2.4mm;border-left:.5mm solid var(--l)}
.su-dg{display:flex;justify-content:center;margin-top:var(--g)}
.su-note{margin-top:var(--g);padding:1.6mm 2.6mm 1.8mm}
.su-note i{font-style:italic}
${DIAGRAM_CSS}
`;


// ---- memo.md → sections ----
interface Section { key: string; parts: string[]; afterLi: boolean }
type Side = { sections: Section[]; types: string[][] | null };
const IN = 'data-in="@P-panel"';

function sideOf(ctx: Ctx, blocks: Block[]): Side {
  const sections: Section[] = [];
  let types: string[][] | null = null;
  const cur = () => { const s = sections[sections.length - 1]; if (!s) throw new Error('memo.md: text before the first «## SECTION»'); return s; };
  // mark: the block is a block of words of the panel; inside a sub-list the sub-list is the block
  const one = (b: Block, mark = true): string => {
    const m = mark ? ' ' + IN : '';
    if (b.kind === 'p') return `<p class="me-p"${m}>${inline(ctx, b.text)}</p>`;
    if (b.kind === 'li') return `<div class="me-li"${m}>${b.mark === '-' ? '<span class="me-bu"></span>' : `<span class="me-mk">${b.mark}</span>`}${inline(ctx, b.text)}</div>`;
    throw new Error(`memo.md: «${b.kind}» is not expected inside a section`);
  };
  for (const b of blocks) {
    if (b.kind === 'h2') sections.push({ key: b.text, parts: [], afterLi: false });
    else if (b.kind === 'add' && b.title) sections.push({ key: b.title, parts: b.body.map(x => one(x)), afterLi: false });
    else if (b.kind === 'add') {
      // an untitled «::: add» continues its section; after a numbered item it is the item's own sub-list
      const s = cur();
      s.parts.push(s.afterLi ? `<div class="me-sub" ${IN}>${b.body.map(x => one(x, false)).join('')}</div>` : b.body.map(x => one(x)).join(''));
    } else if (b.kind === 'p' || b.kind === 'li') { const s = cur(); s.parts.push(one(b)); s.afterLi = b.kind === 'li' && b.mark !== '-'; }
    else if (b.kind === 'types') types = b.rows;
    else throw new Error(`memo.md: «${b.kind}» is not expected in the memo`);
  }
  return { sections, types };
}

const ARROW = (color: string) => `<svg class="me-arr" viewBox="0 0 3.6 3"><path d="M.2 1.5H2.6M1.8.5L3.1 1.5 1.8 2.5" fill="none" stroke="${color}" stroke-width=".42" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
/** «1. Море (открыть карту) · 2. Ход Пиратов · 3. Ход Компании» → a path of three paper chips, the number of each in a
 *  brass disc; the «Сразу» sign between the sea and the Pirates. */
function pathOf(html: string, pal: Pal): string {
  const m = html.match(/^<p class="me-p"[^>]*>(.*)<\/p>$/s);
  if (!m) throw new Error(`memo.md: «${L.path.section}» must start with the line of the round`);
  const steps = m[1].split(' · ').map((s, i) => {
    const x = s.replace(/ /g, ' ').match(/^(\d+)\.\s*(.*?)(?:\s*(\(.*\)))?$/);
    if (!x) throw new Error(`memo.md: a step of the round «${s}» is not «N. name (note)»`);
    return `<div class="me-chip" data-plate="@P-chip${i}">${discSvg(x[1], pal, `@P-chipn${i}`, 'me-num')}<div data-in="@P-chip${i}"><b>${x[2]}</b>${x[3] ? `<small>${x[3]}</small>` : ''}</div></div>`;
  });
  if (steps.length !== 3) throw new Error(`memo.md: the round has ${steps.length} steps, expected 3`);
  const sign = `<div class="me-sign">${boltSvg(4.2, pal.head, '', '@P-bolt')}<span ${IN}>${esc(L.path.sign)}</span></div>`;
  return `<div class="me-path">${steps[0]}${ARROW(pal.head)}${sign}${ARROW(pal.head)}${steps[1]}${ARROW(pal.head)}${steps[2]}</div>`;
}

function sectionHtml(ctx: Ctx, s: Section, pal: Pal, i: number, fs: number): string {
  const ic = L.icons[s.key];
  if (!ic) throw new Error(`memo-ships.json: no icon for the section «${s.key}» (icon + word)`);
  let parts = s.parts.slice();
  if (s.key === L.path.section) {
    const bolt = boltSvg(3.4, pal.head, 'me-bolt');
    parts = [pathOf(parts[0], pal), ...parts.slice(1).map(p => p.replace('«' + L.path.sign + '»', bolt + '«' + L.path.sign + '»'))];
  }
  let val = parts.join('');
  if (s.key === L.ticks.section)
    val = `<div class="me-split"><div class="me-main">${val}</div><div class="me-tk"><div class="me-tkt" ${IN}>${esc(L.ticks.title)}</div><div class="me-tkr">${L.ticks.items.map((t, j) => `<div class="me-tc">${cellSvg(`@P-tick${j}`, pal.look)}<div ${IN}>${esc(t)}</div></div>`).join('')}</div></div></div>`;
  if (s.key === L.ship.section) val = `<div class="me-ship" data-plate="@P-ship">${val.replace(/data-in="@P-panel"/g, 'data-in="@P-ship"')}</div>`;
  // the name: as many words as fit beside the icon, the rest under it in the whole column («ХОД / ПРОТИВНИКА»)
  const words = inline(ctx, s.key).split(' '), size = keyPt(fs);
  let n = 0;
  while (n < words.length && keyWidth(words.slice(0, n + 1).join(' '), size) <= KEY_W1) n++;
  const first = words.slice(0, n).join(' '), rest = words.slice(n).join(' ');
  const key = `<div class="me-kr">${keyIcon(ic, pal, `@P-ic${i}`)}${first ? `<span class="me-kt" ${IN}>${first}</span>` : ''}</div>${rest ? `<div class="me-kt2" ${IN}>${rest}</div>` : ''}`;
  return `<div class="me-sec"><div class="me-key">${key}</div><div class="me-val">${val}</div></div>`;
}
/** the separator between sections: across the strip and the text */
const sepHtml = (pal: Pal) => `<svg class="me-sep" style="width:${IW + STRIP_OUT}mm;height:${SEP}mm" viewBox="0 0 ${IW + STRIP_OUT} ${SEP}"><rect width="${IW + STRIP_OUT}" height="${SEP}" fill="${pal.look.noteLine}"/></svg>`;

// the widths of the section names, measured in the browser on the real font (measureKeys) before the sides are built
const KEY_WIDTH = new Map<string, number>();
function keyWidth(html: string, size: number): number {
  const v = KEY_WIDTH.get(`${size}|${html}`);
  if (v == null) throw new Error(`memo: the width of «${html}» at ${size} pt was not measured`);
  return v;
}
async function measureKeys(ctx: Ctx, keys: string[], sizes: number[]): Promise<void> {
  const items: { k: string; html: string; size: number }[] = [];
  for (const key of keys) {
    const w = inline(ctx, key).split(' ');
    for (const size of sizes) for (let n = 1; n <= w.length; n++) { const html = w.slice(0, n).join(' '); items.push({ k: `${size}|${html}`, html, size }); }
  }
  const page = await ctx.browser.newPage();
  try {
    await page.setContent(`<!doctype html><meta charset="utf-8"><style>${fontCss()}</style><div id="m"></div>`);
    const mm = await page.evaluate(async (list) => {
      await document.fonts.ready;
      const box = document.getElementById('m')!;
      return list.map(it => { const s = document.createElement('span'); s.style.cssText = `font:800 ${it.size}pt 'Alegreya Sans';white-space:nowrap`; s.innerHTML = it.html; box.appendChild(s); const w = s.getBoundingClientRect().width * 25.4 / 96; s.remove(); return w; });
    }, items.map(({ html, size }) => ({ html, size })));
    items.forEach((it, i) => KEY_WIDTH.set(it.k, mm[i]));
  } finally { await page.close(); }
}

/** The four card types with their medals; the words are the ribbons of the cards (colors.ts) — the text file must say the same. */
function typesHtml(ctx: Ctx, rows: string[][], pal: Pal): string {
  const cells = rows.map(([name, when], i) => {
    const t = TYPE[name as CardType];
    if (!t) throw new Error(`memo.md: «::: types» — unknown card type «${name}»`);
    if (t.when !== when) throw new Error(`memo.md: «${name} · ${when}» differs from the ribbon of the cards «${name} · ${t.when}»`);
    check(t.td, pal.field, 4.5, `card type ${name}`);
    return `<div class="me-ty"><span class="me-md" data-plate="@P-md${i}">${iconImg(ctx, `medal-${t.key}`, 0, 0, 8.4)}</span><span ${IN}><b style="color:${t.td}">${name}</b> · ${inline(ctx, when)}</span></div>`;
  });
  return `<div class="me-types">${sepHtml(pal)}<div class="me-grid">${cells.join('')}</div></div>`;
}

/** The flow of one side and its vars (--g: space around a section, --a: between paragraphs). */
const flowDiv = (inner: string, pal: Pal, fs: number, g: number) =>
  `<div class="me-m" style="--fs:${fs}pt;--lh:${lhOf(fs)}mm;--g:${g.toFixed(2)}mm;--a:${Math.min(1.4, g * 0.9).toFixed(2)}mm;--h:${pal.head};--l:${pal.line};--c:${pal.chip};--b:${pal.disc};--lb:${pal.look.noteLine};--t:${pal.strip};--kf:${keyPt(fs)}pt;--kl:${keyLh(fs)}mm">${inner}</div>`;

/** The largest type size at which `inner(fs)` fits `room` mm; the spare room is shared between the n gaps (the space
 *  between paragraphs grows with the gap, so the gap is found by measuring: the largest that still fits). */
async function fit(ctx: Ctx, what: string, room: number, gaps: number, piece: (fs: number, g: number) => string, sizes = SIZES): Promise<{ fs: number; g: number }> {
  for (const fs of sizes) {
    const [h] = await measure(ctx, CSS, IW, [piece(fs, G0)]);
    if (process.env.MEMO_DEBUG) console.log(`  fit ${what}: ${fs} pt — ${h.toFixed(2)} of ${room.toFixed(2)} mm`);
    if (h > room) continue;
    let lo = G0, hi = G0 + Math.min(GMAX - G0, (room - h) / (2 * gaps));
    const hs = await measure(ctx, CSS, IW, [piece(fs, hi)]);
    if (hs[0] <= room) return { fs, g: hi };
    for (let i = 0; i < 6; i++) { const g = (lo + hi) / 2, [hg] = await measure(ctx, CSS, IW, [piece(fs, g)]); if (hg <= room) lo = g; else hi = g; }
    return { fs, g: lo };
  }
  throw new Error(`memo: ${what} does not fit its A5 even at ${SIZES[SIZES.length - 1]} pt — shorten memo.md`);
}

// ---- the cartouche over a side (boards/v2.ts headerSvg): parchment with notched ends, a double rule, a brass medallion ----
const CART_X = 2.2; // the notched ends flare out by 2.2 mm: the cartouche stands in from the side of the A5
function cartouche(h: number, look: Look, medal: { r: number; inner: string; body: string }): { svg: string; mx: number; right: number } {
  const x = CART_X, w = W - 2 * CART_X, y = 0, hh = h - 0.7;
  const shape = `M${x + 5} ${y}H${x + w - 5}C${x + w - 1.5} ${y} ${x + w} ${y + 2.4} ${x + w + 2.2} ${y + 1.6}C${x + w + 0.6} ${y + hh / 2} ${x + w + 0.6} ${y + hh / 2} ${x + w + 2.2} ${y + hh - 1.6}C${x + w} ${y + hh - 2.4} ${x + w - 1.5} ${y + hh} ${x + w - 5} ${y + hh}H${x + 5}C${x + 1.5} ${y + hh} ${x} ${y + hh - 2.4} ${x - 2.2} ${y + hh - 1.6}C${x - 0.6} ${y + hh / 2} ${x - 0.6} ${y + hh / 2} ${x - 2.2} ${y + 1.6}C${x} ${y + 2.4} ${x + 1.5} ${y} ${x + 5} ${y}Z`;
  const mx = x + 1.6 + medal.r + 1.6, my = hh / 2, R = medal.r;
  const svg = `<svg style="width:${W}mm;height:${h}mm" viewBox="0 0 ${W} ${h}">${defsOf(look)}` +
    `<path d="${shape}" fill="#1a0e04" fill-opacity=".22" transform="translate(.4 .6)"/><path d="${shape}" fill="url(#@Ppaper)" stroke="${look.paperLine}" stroke-width=".35"/>` +
    `<rect data-plate="@P-head" x="${x}" y="${y}" width="${w}" height="${hh}" fill="none"/>` +
    `<rect x="${x + 1.4}" y="${y + 1.2}" width="${w - 2.8}" height="${r(hh - 2.4)}" rx="1" fill="none" stroke="${look.paperLine}" stroke-width=".18" stroke-opacity=".75"/>` +
    `<g data-plate="@P-medal"><circle cx="${mx}" cy="${r(my)}" r="${R}" fill="url(#@Pbrh)" stroke="${look.brass[2]}" stroke-width=".3"/><circle cx="${mx}" cy="${r(my)}" r="${r(R * 0.83)}" fill="${medal.inner}"/><circle cx="${mx}" cy="${r(my)}" r="${r(R * 0.74)}" fill="none" stroke="${CREAM}" stroke-width=".2" stroke-opacity=".7"/></g>` +
    medal.body.replace(/@MX/g, String(mx)).replace(/@MY/g, String(r(my))) + '</svg>';
  return { svg, mx, right: x + w };
}

/** One side of a memo, positioned at x mm on the sheet: the cartouche, then the slip with the flow. «@P» → the side. */
function sideHtml(x: number, p: string, band: string, bandH: number, pal: Pal, flow: string): string {
  const ph = H - bandH - PANEL_GAP, look = pal.look;
  const bg = `<svg class="me-bg" style="width:${W}mm;height:${ph}mm" viewBox="0 0 ${W} ${ph}"><rect x=".4" y=".6" width="${W - 0.4}" height="${r(ph - 0.6)}" rx="1.4" fill="#1a0e04" fill-opacity=".16"/>` +
    `<rect x="0" y="0" width="${W - 0.4}" height="${r(ph - 0.6)}" rx="1.4" fill="${pal.field}" stroke="${look.paperLine}" stroke-opacity=".55" stroke-width=".25"/>` +
    `<rect x="1" y="1" width="${W - 2.4}" height="${r(ph - 2.6)}" rx=".8" fill="none" stroke="${look.paperLine}" stroke-opacity=".5" stroke-width=".18"/></svg>`;
  const html = `<div class="me" style="left:${x + A5.pad}mm"><div class="me-band" style="height:${bandH}mm">${band}</div>
<div class="me-panel" data-plate="@P-panel" style="top:${bandH + PANEL_GAP}mm;height:${ph}mm">${bg}${flow}</div></div>`;
  // the side's own names: plates, gradients and the clip paths of the icons
  return html.replace(/\b(id="|url\(#)ic(\d+-\d+)/g, `$1${p}ic$2`).replace(/@P/g, p);
}

const cutLine = () => {
  const dash = (y1: number, y2: number) => `<line x1="${A5.w}" y1="${y1}" x2="${A5.w}" y2="${y2}" stroke="#8a8a8a" stroke-width=".2" stroke-dasharray="2.4 1.6"/>`;
  return `<svg style="position:absolute;left:0;top:0;width:${SHEET_W}mm;height:210mm" viewBox="0 0 ${SHEET_W} 210">${dash(0, 90)}${dash(120, 210)}<rect data-plate="cut" x="${A5.w - 4}" y="88" width="8" height="34" fill="none"/>
<text data-in="cut" transform="translate(${A5.w + 0.85} 105) rotate(-90)" text-anchor="middle" font-family="'Alegreya Sans',sans-serif" font-weight="500" font-size="2.6" letter-spacing=".15" fill="#6a6a6a">${esc(L.cut)}</text></svg>`;
};

const PANEL_ROOM = (bandH: number) => H - bandH - PANEL_GAP - 2 * PY - 0.6;

/** the header of the back and of the setup sheet: the compass star in the medallion, the title, the line on the right */
function plainBand(title: string, sub: string, h: number, pal: Pal): string {
  const look = pal.look, R = (h - 0.7) / 2 - 1.3;
  const c = cartouche(h, look, { r: R, inner: pal.disc, body: starSvg(0, 0, R * 0.62, look.brass[0], look.brass[1]).replace(/^/, '<g transform="translate(@MX @MY)">') + '</g>' });
  const tx = c.mx + R + 3.2, top = (h - 0.7 - 7) / 2;
  return `${c.svg}<div class="me-bt" data-in="@P-head" style="left:${r(tx)}mm;top:${r(top)}mm;color:${pal.head}">${esc(title)}</div>` +
    `<div class="me-ts" data-in="@P-head" style="right:${r(W - c.right + 3.2)}mm;top:${r(top + 2)}mm;color:${look.soft}">${esc(sub)}</div>`;
}

export async function build(ctx: Ctx): Promise<Part[]> {
  const md = loadText('memo.md');
  const halves = md.split(/^---\s*$/m);
  if (halves.length !== 2) throw new Error('memo.md: one line «---» must divide the face from the back');
  const [faceBlocks, backBlocks] = halves.map(parse);
  const title = faceBlocks.find(b => b.kind === 'h1'), sub = faceBlocks.find(b => b.kind === 'sub');
  if (!title || title.kind !== 'h1' || !sub || sub.kind !== 'sub') throw new Error('memo.md: «# title» and «> line under it» are needed above the face');
  const face = sideOf(ctx, faceBlocks.filter(b => b !== title && b !== sub)), back = sideOf(ctx, backBlocks);
  if (!back.types || back.types.length !== 4) throw new Error('memo.md: the back needs «::: types» with 4 rows');
  if (face.types) throw new Error('memo.md: «::: types» belongs to the back');
  for (const k of [L.path.section, L.ticks.section]) if (!face.sections.some(s => s.key === k)) throw new Error(`memo.md: the face has no section «${k}»`);

  // «Мой корабль»: the ship's line of rules.md «Особенности кораблей», word for word, and «подробно — на планшете»
  const rules = parse(loadText('rules.md'));
  const from = rules.findIndex(b => b.kind === 'h2' && b.text === L.ship.rulesHeading);
  const until = rules.findIndex((b, i) => i > from && b.kind === 'h2');
  const shipLines = rules.slice(from, until).filter((b): b is Extract<Block, { kind: 'li' }> => b.kind === 'li');
  const lineOf = (name: string) => {
    const hit = shipLines.filter(l => l.text.includes(name));
    if (hit.length !== 1) throw new Error(`rules.md «${L.ship.rulesHeading}»: ${hit.length} lines name ${name}, expected 1`);
    return hit[0].text;
  };

  // the back: the same for all four memos, in brass and sepia
  const backPal = palette(BRASS, LOOKS.back, 'back', darken(BRASS, 0.55));
  backPal.disc = BRASS_DARK; check(CREAM, backPal.disc, 7, 'back: the medallion');
  await measureKeys(ctx, [...face.sections, ...back.sections].map(s => s.key).concat(L.ship.section), [...new Set(SIZES.map(keyPt))]);
  const backIn = (fs: number) => back.sections.map((s, i) => sectionHtml(ctx, s, backPal, i, fs)).join(sepHtml(backPal)) + typesHtml(ctx, back.types!, backPal);
  const backFit = await fit(ctx, 'the back of the memo', PANEL_ROOM(BAND.back), back.sections.length + 1, (fs, g) => flowDiv(backIn(fs), backPal, fs, g));
  const backBand = plainBand(L.back.title, L.back.sub, BAND.back, backPal);
  const backSide = (x: number, p: string) => sideHtml(x, p, backBand, BAND.back, backPal, flowDiv(backIn(backFit.fs), backPal, backFit.fs, backFit.g));

  // the faces: one per ship
  const faces: ((x: number, p: string) => string)[] = [];
  for (const ship of data.ships as Ship[]) {
    const look = LOOKS[DECK_KEY[ship.code]], pal = palette(ship.color, look, ship.name);
    const sections = [...face.sections, { key: L.ship.section, parts: [`<p class="me-p" ${IN}>${inline(ctx, lineOf(ship.name))}</p><p class="me-p me-more" ${IN}>${inline(ctx, L.ship.more)}</p>`], afterLi: false }];
    const inner = (fs: number) => sections.map((s, i) => sectionHtml(ctx, s, pal, i, fs)).join(sepHtml(pal));
    const f = await fit(ctx, `the face of the memo ${ship.name}`, PANEL_ROOM(BAND.face), sections.length, (fs, g) => flowDiv(inner(fs), pal, fs, g));
    // the cartouche: the letter in the brass medallion (on its optical centre), the name and «side · captain», the title
    const R = 6.1, size = 16, hh = BAND.face - 0.7, my = hh / 2;
    const letter = `<text data-in="@P-medal" x="@MX" y="${r(my + 0.34 * pt(size))}" text-anchor="middle" font-family="'Alegreya SC',serif" font-weight="800" font-size="${r(pt(size))}" fill="${CREAM}">${esc(ship.code)}</text>`;
    const c = cartouche(BAND.face, look, { r: R, inner: pal.disc, body: letter }), svg = c.svg, tx = c.mx + R + 3.4, rx = W - c.right + 3.4;
    const band = `${svg}<div class="me-nm" data-in="@P-head" style="left:${r(tx)}mm;top:1.9mm;color:${pal.head}">${esc(ship.name)}</div>` +
      `<div class="me-cap" data-in="@P-head" style="left:${r(tx)}mm;top:${r(hh - 2 - 4.4)}mm;color:${look.soft}"><b style="color:${pal.head}">${esc(ship.side)}</b> · ${esc(ship.captain)}</div>` +
      `<div class="me-tt" data-in="@P-head" style="right:${r(rx)}mm;top:2.2mm">${inline(ctx, title.text)}</div>` +
      `<div class="me-ts" data-in="@P-head" style="right:${r(rx)}mm;top:${r(hh - 2 - 4.4)}mm;color:${look.soft}">${inline(ctx, sub.text)}</div>`;
    faces.push((x, p) => sideHtml(x, p, band, BAND.face, pal, flowDiv(inner(f.fs), pal, f.fs, f.g)));
    console.log(`02-pamyatki: ${ship.name} — лицо ${f.fs} pt`);
  }
  console.log(`02-pamyatki: оборот «${L.back.title}» — ${backFit.fs} pt`);

  // the setup sheet: rules.md «Подготовка» word for word, the secret placement (Q32) after its item, the scheme, the first game
  const sFrom = rules.findIndex(b => b.kind === 'h2' && b.text === L.setup.rulesHeading);
  const sUntil = rules.findIndex((b, i) => i > sFrom && b.kind === 'h2');
  const setup = rules.slice(sFrom + 1, sUntil);
  const clar = rules.flatMap(b => (b.kind === 'add' ? b.body : [])).find((b): b is Extract<Block, { kind: 'li' }> => b.kind === 'li' && b.text.startsWith(L.setup.secretFrom));
  if (!clar) throw new Error(`rules.md: no clarification starting «${L.setup.secretFrom}»`);
  const secret = clar.text.replace(/\s*\(Q\d+\)/g, '');
  const sPal = backPal;
  const sItems: string[] = [];
  for (const b of setup) {
    if (b.kind === 'li') {
      const n = b.mark.replace('.', '');
      sItems.push(`<div class="su-li">${discSvg(n, sPal, `@P-n${n}`, 'su-num')}<div ${IN}>${inline(ctx, b.text)}</div>${b.mark === `${L.setup.secretAfter}.` ? `<div class="su-sub" ${IN}>${inline(ctx, secret)}</div>` : ''}</div>`);
    } else if (b.kind === 'diagram') {
      // the scheme of rules.ts: each ship's name inside its own box, the other words on the panel
      let k = 0;
      const dg = diagram(b.rows).replace(/<rect /g, () => `<rect data-plate="@P-dg${++k}" `)
        .replace(/(<rect data-plate="(@P-dg\d+)"[^>]*\/>)<text /g, '$1<text data-in="$2" ').replace(/<text (?!data-in)/g, `<text ${IN} `)
        .replace(/<span>/g, `<span ${IN}>`);
      sItems.push(`<div class="su-dg">${dg}</div>`);
    } else if (b.kind === 'note') sItems.push(`<div class="su-note" data-plate="@P-note">${b.body.map(x => x.kind === 'p' ? `<p class="me-p" data-in="@P-note">${inline(ctx, x.text)}</p>` : '').join('')}</div>`);
    else throw new Error(`rules.md «${L.setup.rulesHeading}»: «${b.kind}» is not expected on the setup sheet`);
  }
  if (!setup.some(b => b.kind === 'li' && b.mark === `${L.setup.secretAfter}.`)) throw new Error(`rules.md «${L.setup.rulesHeading}»: no item ${L.setup.secretAfter}`);
  const sInner = sItems.join('');
  const sFit = await fit(ctx, 'the setup sheet', PANEL_ROOM(BAND.setup), 3, (fs, g) => flowDiv(sInner, sPal, fs, g), SETUP_SIZES);
  const sBand = plainBand(L.setup.title, L.setup.sub, BAND.setup, sPal);
  const sSide = (x: number, p: string) => sideHtml(x, p, sBand, BAND.setup, sPal, flowDiv(sInner, sPal, sFit.fs, sFit.g));
  console.log(`02-pamyatki: «${L.setup.title}» — ${sFit.fs} pt`);

  // sheets: faces of two ships, then their backs (duplex on the short edge: the back of the left memo is the right half)
  const pages = [];
  for (let i = 0; i < faces.length; i += 2) {
    pages.push({ html: cutLine() + faces[i](0, 'L') + faces[i + 1](A5.w, 'R'), land: true });
    pages.push({ html: cutLine() + backSide(0, 'L') + backSide(A5.w, 'R'), land: true });
  }
  pages.push({ html: cutLine() + sSide(0, 'L') + sSide(A5.w, 'R'), land: true });
  return [{ file: '02-pamyatki', title: L.partTitle, css: CSS, pages, duplex: 'short' }];
}
