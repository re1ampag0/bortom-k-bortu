// 02 — the memos: four A5 memos, one per ship (data.ships order), two-sided, two A5s per landscape A4 sharing one cut
// line; the PDF is printed duplex on the short edge (the back of the left memo is the right half of the back page). Then
// «Подготовка к игре», A5, two copies on one landscape A4 (page 5, printed on one side).
// The face is in the style of its ship; the back («Справка») is the same on all four, so a wrong flip shows no other
// ship. The text is tools/print/text/memo.md (the mark-up of rules.ts; «---» — the line between the face and the back),
// the labels are text/memo-ships.json; «Мой корабль» and the setup sheet are taken from rules.md word for word.
// Each side gets the largest of SIZES at which it fits its A5; never below 9 pt.
import fs from 'node:fs';
import path from 'node:path';
import { HERE, data, esc, type Ctx, type Part } from '../kit';
import { BRASS, BRASS_DARK, INK, TYPE, contrast, darken, lighten, type CardType } from '../colors';
import { BOARD } from '../layout';
import { iconImg } from '../icons';
import { DIAGRAM_CSS, TEXT_CSS, diagram, hair, inline, loadText, measure, parse, type Block } from './rules';

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
const BAND = { face: 17, back: 12.5, setup: 12.5 }, PANEL_GAP = 1.8, PX = 2.6, PY = 1.6; // header bands; the panel under them
const IW = W - 2 * PX, KEYW = 28.5, CELL = BOARD.cell; // the inner width; the column of section names; the tick cell (13 mm: an 11 mm marker fits)
const SIZES = [10.5, 10, 9.5, 9], SETUP_SIZES = [12, 11.5, 11, ...SIZES]; // pt; never below 9
const CREAM = '#fbf4e2', G0 = 0.6, GMAX = 2.4; // the space above and below a section: at least G0, the spare room shared up to GMAX

// ---- colours: the ship colour is the accent (header band, keys, lines), the text stands on a light field ----
interface Pal { band: string; head: string; field: string; line: string; chip: string }
function check(fg: string, bg: string, min: number, what: string) {
  const c = contrast(fg, bg);
  if (c < min) throw new Error(`memo: ${what} — contrast ${c.toFixed(2)} : 1, need ≥ ${min}`);
}
function palette(color: string, what: string): Pal {
  const field = lighten(color, 0.91);
  let head = color, band = color;
  for (let k = 0.05; contrast(head, field) < 7 && k < 0.9; k += 0.05) head = darken(color, k); // keys are small bold type: 7 : 1, not only 4.5
  for (let k = 0.05; contrast(CREAM, band) < 7 && k < 0.9; k += 0.05) band = darken(color, k);
  const pal = { band, head, field, line: lighten(color, 0.5), chip: lighten(color, 0.97) };
  check(INK, field, 7, `${what}: text on the field`); check(INK, pal.chip, 7, `${what}: text on a chip`);
  check(head, field, 4.5, `${what}: headings`); check(CREAM, band, 7, `${what}: the header band`);
  return pal;
}

// ---- the icons of the sections: own SVG, line drawings in the key colour (never a font symbol) ----
const ICON: Record<string, string> = {
  round: '<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M18.6 2.6v4.2h-4.2"/>',
  hourglass: '<path d="M6 3h12M6 21h12"/><path d="M7.5 3v2.5c0 2.6 4.5 4 4.5 6.5s-4.5 3.9-4.5 6.5V21M16.5 3v2.5c0 2.6-4.5 4-4.5 6.5s4.5 3.9 4.5 6.5V21"/>',
  cards: '<rect x="3.5" y="5" width="10" height="14" rx="1.5" transform="rotate(-10 8.5 12)"/><rect x="10.5" y="5" width="10" height="14" rx="1.5" transform="rotate(8 15.5 12)"/>',
  cannon: '<path d="M11.2 13.2l8.6-5.4 1.6 2.6-8.6 5.4"/><circle cx="9" cy="15.5" r="4.2"/><circle cx="9" cy="15.5" r="1.1" fill="currentColor"/><path d="M2.5 21h13"/>',
  ship: '<path d="M3 15h18l-3.2 5H6.2z"/><path d="M12 3v12"/><path d="M12 4.5l6 8.5h-6M12 6l-4.8 7H12"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M12 7v10M8 11h8"/>',
  coin: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/>',
  flame: '<path d="M12 2.5c1 4 6 6 6 11.5a6 6 0 0 1-12 0c0-3 2-4.5 3-6.5.5 2 1.5 3 3 3-1-2.5-1-5.5 0-8z"/>',
  nocannon: '<path d="M11.2 13.2l8.6-5.4 1.6 2.6-8.6 5.4"/><circle cx="9" cy="15.5" r="4.2"/><path d="M3 3l18 18"/>',
  burst: '<path d="M12 2.5l1.9 5.6 5.3-2.6-2.6 5.3 5.6 1.9-5.6 1.9 2.6 5.3-5.3-2.6-1.9 5.6-1.9-5.6-5.3 2.6 2.6-5.3-5.6-1.9 5.6-1.9-2.6-5.3 5.3 2.6z"/>',
  sunk: '<path d="M4 10.5l14 4-1.8 3.8-11-3.1z"/><path d="M10.6 12.4l3-8.4"/><path d="M2 21c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0"/>',
  hook: '<rect x="3" y="7" width="9" height="13" rx="1.5"/><path d="M18 2.5v10a3 3 0 0 1-6 0v-1.5"/>',
  deck: '<rect x="7" y="3" width="12" height="16" rx="1.5"/><path d="M4.5 6v13.5A1.5 1.5 0 0 0 6 21h10.5"/>',
  check: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 12.5l3.5 3.5L17 8.5"/>',
  flag: '<path d="M5.5 21.5V2.5"/><path d="M5.5 4h12.5l-3 4 3 4H5.5"/>'
};
const BOLT = '<path d="M13.5 2L5 13.5h6.2L10 22l8.8-12H12.5z" fill="currentColor" stroke="none"/>';
const svgIcon = (name: string, size: number, color: string, cls = 'me-ic') => {
  const body = ICON[name] ?? (name === 'bolt' ? BOLT : null);
  if (!body) throw new Error(`memo: no icon «${name}»`);
  return `<svg class="${cls}" style="width:${size}mm;height:${size}mm;color:${color}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
};

const lhOf = (fs: number) => +(fs * 1.2 * 0.3528).toFixed(2);
// One CSS for every side: the type size and line height of a side are the vars --fs (pt) and --lh (mm) of its flow.
const CSS = `${TEXT_CSS}
.me{position:absolute;top:${A5.pad}mm;width:${W}mm;height:${H}mm}
.me-band{position:absolute;left:0;top:0;width:${W}mm;box-sizing:border-box;border-radius:2mm;color:${CREAM}}
.me-panel{position:absolute;left:0;width:${W}mm;box-sizing:border-box;border:.3mm solid;border-radius:2mm;padding:${PY}mm ${PX}mm}
.me-medal{position:absolute;left:2.6mm;top:2mm;width:12.4mm;height:12.4mm;border-radius:50%;box-sizing:border-box;border:.5mm solid ${CREAM};text-align:center;font:800 19pt/11.6mm 'Alegreya SC',serif}
.me-nm{position:absolute;left:18mm;top:2.2mm;font:800 16pt/7mm 'Alegreya SC',serif;letter-spacing:.01em;white-space:nowrap}
.me-cap{position:absolute;left:18mm;top:9.6mm;font:700 8.5pt/4.4mm 'Alegreya Sans',sans-serif;letter-spacing:.05em;white-space:nowrap}
.me-tt{position:absolute;right:3mm;top:2.2mm;font:italic 500 13pt/6.6mm Alegreya,serif;text-align:right}
.me-ts{position:absolute;right:3mm;top:9.6mm;font:500 8.5pt/4.4mm 'Alegreya Sans',sans-serif;text-align:right;white-space:nowrap}
.me-bt{position:absolute;left:3.2mm;top:2.2mm;font:800 16pt/8mm 'Alegreya SC',serif;letter-spacing:.02em}
.me-bs{position:absolute;right:3.2mm;top:3.9mm;font:500 8.5pt/4.4mm 'Alegreya Sans',sans-serif;white-space:nowrap}
.me-m{font:400 var(--fs)/var(--lh) Alegreya,serif;color:${INK}}
.me-m b{font-weight:700}
.me-sec{display:flex;align-items:flex-start;padding:var(--g) 0}
.me-key{flex:none;display:flex;align-items:flex-start;gap:1.3mm;width:${KEYW}mm;box-sizing:border-box;padding:.1mm 1.8mm 0 0;font:800 max(9pt, calc(var(--fs) - 1pt))/var(--lh) 'Alegreya Sans',sans-serif;letter-spacing:.03em;color:var(--h)}
.me-ic{flex:none;display:block}
.me-key .me-ic{margin-top:-.2mm}
.me-val{flex:1;min-width:0}
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
.me-split{display:flex;align-items:flex-start;gap:2.6mm}
.me-split>.me-main{flex:1;min-width:0}
.me-tk{flex:none;width:${2 * CELL + 3}mm;text-align:center}
.me-tkt{font:800 8pt/3.6mm 'Alegreya Sans',sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--h)}
.me-tkr{display:flex;justify-content:space-between;margin-top:.6mm}
.me-tc{width:${CELL + 1}mm;display:flex;flex-direction:column;align-items:center}
.me-tc svg{display:block;width:${CELL}mm;height:${CELL}mm}
.me-tc span{display:block;margin-top:.5mm;font:700 8pt/3.3mm 'Alegreya Sans',sans-serif;color:${INK}}
.me-path{display:flex;align-items:center;gap:.8mm}
.me-chip{flex:1 1 auto;display:flex;align-items:center;gap:1.4mm;min-height:calc(var(--lh) * 2 + 1.6mm);box-sizing:border-box;padding:.8mm 1.6mm .8mm 1.1mm;border:.35mm solid var(--l);border-radius:1.6mm;background:var(--c);line-height:calc(var(--lh) * .92)}
.me-chip b{display:block;font-weight:700}
.me-chip small{display:block;font-size:max(8pt, calc(var(--fs) - 2pt));line-height:calc(var(--lh) * .85)}
.me-num{flex:none;width:4.6mm;height:4.6mm;border-radius:50%;background:var(--b);color:${CREAM};text-align:center;font:800 8.5pt/4.6mm 'Alegreya Sans',sans-serif}
.me-arr{flex:none;display:block;width:3.6mm;height:3mm}
.me-sign{flex:none;display:flex;flex-direction:column;align-items:center;font:800 8pt/3.4mm 'Alegreya Sans',sans-serif;letter-spacing:.04em;color:var(--h)}
.me-bolt{display:inline-block;vertical-align:-.7mm;margin-right:.6mm}
.me-ship{background:var(--c);border:.35mm solid var(--l);border-radius:1.6mm;padding:1.2mm 2.2mm 1.4mm}
.me-more{margin-top:calc(var(--a) * .5);font-style:italic}
.me-grid{display:flex;flex-wrap:wrap}
.me-ty{position:relative;width:50%;height:10mm;box-sizing:border-box;padding:2.5mm 0 0 11.4mm;font:500 10pt/4.8mm Alegreya,serif;white-space:nowrap}
.me-ty b{font:800 10pt/4.8mm 'Alegreya Sans',sans-serif;letter-spacing:.05em}
.me-types{padding-top:var(--g)}
.su-num{position:absolute;left:0;top:0;width:calc(var(--lh) * 1.05);height:calc(var(--lh) * 1.05);border-radius:50%;background:var(--b);color:${CREAM};text-align:center;font:800 max(8pt, calc(var(--fs) - 1.5pt))/calc(var(--lh) * 1.05) 'Alegreya Sans',sans-serif}
.su-li{position:relative;padding-left:calc(var(--lh) * 1.05 + 2mm)}
.su-li+.su-li{margin-top:var(--a)}
.su-sub{margin:calc(var(--a) * .5) 0 0;padding-left:2.2mm;border-left:.5mm solid var(--l)}
.su-dg{display:flex;justify-content:center;margin-top:var(--g)}
.su-note{margin-top:var(--g);background:var(--c);border:.35mm solid var(--l);border-radius:1.6mm;padding:1.4mm 2.6mm 1.6mm}
.su-note i{font-style:italic}
${DIAGRAM_CSS}
`;

// ---- memo.md → sections ----
interface Section { key: string; parts: string[]; afterLi: boolean }
type Side = { sections: Section[]; types: string[][] | null };

function sideOf(ctx: Ctx, blocks: Block[]): Side {
  const sections: Section[] = [];
  let types: string[][] | null = null;
  const cur = () => { const s = sections[sections.length - 1]; if (!s) throw new Error('memo.md: text before the first «## SECTION»'); return s; };
  const one = (b: Block): string => {
    if (b.kind === 'p') return `<p class="me-p">${inline(ctx, b.text)}</p>`;
    if (b.kind === 'li') return `<div class="me-li">${b.mark === '-' ? '<span class="me-bu"></span>' : `<span class="me-mk">${b.mark}</span>`}${inline(ctx, b.text)}</div>`;
    throw new Error(`memo.md: «${b.kind}» is not expected inside a section`);
  };
  for (const b of blocks) {
    if (b.kind === 'h2') sections.push({ key: b.text, parts: [], afterLi: false });
    else if (b.kind === 'add' && b.title) sections.push({ key: b.title, parts: b.body.map(one), afterLi: false });
    else if (b.kind === 'add') {
      // an untitled «::: add» continues its section; after a numbered item it is the item's own sub-list
      const s = cur(), html = b.body.map(one).join('');
      s.parts.push(s.afterLi ? `<div class="me-sub">${html}</div>` : html);
    } else if (b.kind === 'p' || b.kind === 'li') { const s = cur(); s.parts.push(one(b)); s.afterLi = b.kind === 'li' && b.mark !== '-'; }
    else if (b.kind === 'types') types = b.rows;
    else throw new Error(`memo.md: «${b.kind}» is not expected in the memo`);
  }
  return { sections, types };
}

const ARROW = (color: string) => `<svg class="me-arr" viewBox="0 0 3.6 3"><path d="M.2 1.5H2.6M1.8.5L3.1 1.5 1.8 2.5" fill="none" stroke="${color}" stroke-width=".42" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
/** «1. Море (открыть карту) · 2. Ход Пиратов · 3. Ход Компании» → a path of three chips; the «Сразу» sign between the sea and the Pirates. */
function pathOf(ctx: Ctx, html: string, pal: Pal): string {
  const m = html.match(/^<p class="me-p">(.*)<\/p>$/s);
  if (!m) throw new Error(`memo.md: «${L.path.section}» must start with the line of the round`);
  const steps = m[1].split(' · ').map(s => {
    const x = s.replace(/ /g, ' ').match(/^(\d+)\.\s*(.*?)(?:\s*(\(.*\)))?$/);
    if (!x) throw new Error(`memo.md: a step of the round «${s}» is not «N. name (note)»`);
    return `<div class="me-chip"><span class="me-num">${x[1]}</span><span><b>${x[2]}</b>${x[3] ? `<small>${x[3]}</small>` : ''}</span></div>`;
  });
  if (steps.length !== 3) throw new Error(`memo.md: the round has ${steps.length} steps, expected 3`);
  const sign = `<div class="me-sign">${svgIcon('bolt', 4.2, pal.head)}<span>${esc(L.path.sign)}</span></div>`;
  return `<div class="me-path">${steps[0]}${ARROW(pal.head)}${sign}${ARROW(pal.head)}${steps[1]}${ARROW(pal.head)}${steps[2]}</div>`;
}

const tickCell = (pal: Pal) => `<svg viewBox="0 0 ${CELL} ${CELL}"><rect x=".25" y=".25" width="${CELL - 0.5}" height="${CELL - 0.5}" rx="1.8" fill="#ffffff" stroke="${pal.head}" stroke-width=".45"/><rect x="1" y="1" width="${CELL - 2}" height="${CELL - 2}" rx="1.3" fill="none" stroke="${pal.line}" stroke-width=".25" stroke-dasharray="1 .8"/></svg>`;

function sectionHtml(ctx: Ctx, s: Section, pal: Pal): string {
  const icon = L.icons[s.key];
  if (!icon) throw new Error(`memo-ships.json: no icon for the section «${s.key}» (icon + word)`);
  let parts = s.parts.slice();
  if (s.key === L.path.section) {
    const bolt = svgIcon('bolt', 3.4, pal.head, 'me-bolt');
    parts = [pathOf(ctx, parts[0], pal), ...parts.slice(1).map(p => p.replace('«' + L.path.sign + '»', bolt + '«' + L.path.sign + '»'))];
  }
  let val = parts.join('');
  if (s.key === L.ticks.section)
    val = `<div class="me-split"><div class="me-main">${val}</div><div class="me-tk"><div class="me-tkt">${esc(L.ticks.title)}</div><div class="me-tkr">${L.ticks.items.map(t => `<div class="me-tc">${tickCell(pal)}<span>${esc(t)}</span></div>`).join('')}</div></div></div>`;
  if (s.key === L.ship.section) val = `<div class="me-ship">${val}</div>`;
  return `<div class="me-sec"><div class="me-key">${svgIcon(icon, 4.6, pal.head)}<span>${inline(ctx, s.key)}</span></div><div class="me-val">${val}</div></div>`;
}

/** The four card types with their medals; the words are the ribbons of the cards (colors.ts) — the text file must say the same. */
function typesHtml(ctx: Ctx, rows: string[][], pal: Pal): string {
  const cells = rows.map(([name, when]) => {
    const t = TYPE[name as CardType];
    if (!t) throw new Error(`memo.md: «::: types» — unknown card type «${name}»`);
    if (t.when !== when) throw new Error(`memo.md: «${name} · ${when}» differs from the ribbon of the cards «${name} · ${t.when}»`);
    check(t.td, pal.field, 4.5, `card type ${name}`);
    return `<div class="me-ty">${iconImg(ctx, `medal-${t.key}`, 0.6, 0.8, 8.4)}<b style="color:${t.td}">${name}</b> · ${inline(ctx, when)}</div>`;
  });
  return `<div class="me-types">${hair(IW, pal.line, 0.3)}<div class="me-grid">${cells.join('')}</div></div>`;
}

/** The flow of one side and its vars (--g: space around a section, --a: between paragraphs). */
const flowDiv = (inner: string, pal: Pal, fs: number, g: number) =>
  `<div class="me-m" style="--fs:${fs}pt;--lh:${lhOf(fs)}mm;--g:${g.toFixed(2)}mm;--a:${Math.min(1.4, g * 0.9).toFixed(2)}mm;--h:${pal.head};--l:${pal.line};--c:${pal.chip};--b:${pal.band}">${inner}</div>`;

/** The largest type size at which `inner(fs)` fits `room` mm; the spare room is shared between the n gaps. */
async function fit(ctx: Ctx, what: string, room: number, gaps: number, piece: (fs: number, g: number) => string, sizes = SIZES): Promise<{ fs: number; g: number }> {
  for (const fs of sizes) {
    const [h] = await measure(ctx, CSS, IW, [piece(fs, G0)]);
    if (h <= room) return { fs, g: G0 + Math.min(GMAX - G0, (room - h) / (2 * gaps)) };
  }
  throw new Error(`memo: ${what} does not fit its A5 even at ${SIZES[SIZES.length - 1]} pt — shorten memo.md`);
}

/** One side of a memo, positioned at x mm on the sheet: header band + panel with the flow. */
const sideHtml = (x: number, band: string, bandH: number, pal: Pal, flow: string) =>
  `<div class="me" style="left:${x + A5.pad}mm"><div class="me-band" style="height:${bandH}mm;background:${pal.band}">${band}</div>
<div class="me-panel" style="top:${bandH + PANEL_GAP}mm;height:${H - bandH - PANEL_GAP}mm;background:${pal.field};border-color:${pal.line}">${flow}</div></div>`;

/** A strip of the ship's material along the bottom of the face's header band (under the text): rope, fire, ledger, sea. */
function motif(code: string, band: string): string {
  const x0 = 17.5, x1 = W - 2.6, y = 15.1, h = 1.5, out: string[] = [], c = lighten(band, 0.42);
  if (code === 'Ж') { // a rope: two strands and the twist
    out.push(`<path d="M${x0} ${y}H${x1}M${x0} ${y + h}H${x1}" stroke="${c}" stroke-width=".25"/>`);
    for (let x = x0; x < x1 - 1; x += 1.1) out.push(`<path d="M${x.toFixed(2)} ${y + h}l1 ${-h}" stroke="${c}" stroke-width=".45" stroke-linecap="round"/>`);
  } else if (code === 'М') { // tongues of fire
    let d = `M${x0} ${y + h}`;
    for (let x = x0; x < x1 - 2.2; x += 2.2) d += `q.6 -.5 .7 -${(h * (x % 4.4 < 2.2 ? 1 : 0.7)).toFixed(2)}q.9 .9 1.5 ${(h * (x % 4.4 < 2.2 ? 1 : 0.7)).toFixed(2)}`;
    out.push(`<path d="${d}V${y + h}Z" fill="#e0773a" opacity=".85"/><path d="M${x0} ${y + h}H${x1}" stroke="#f2b35a" stroke-width=".3"/>`);
  } else if (code === 'И') { // the ruling of a ledger
    out.push(`<path d="M${x0} ${y}H${x1}M${x0} ${y + 0.5}H${x1}M${x0} ${y + h}H${x1}" stroke="${c}" stroke-width=".22"/>`);
    for (let x = x0 + 9; x < x1; x += 18) out.push(`<path d="M${x.toFixed(2)} ${y}V${y + h}" stroke="${c}" stroke-width=".22"/>`);
  } else { // the sea floor: a wave and barnacles
    let d = `M${x0} ${y + 0.8}`;
    for (let x = x0; x < x1 - 2; x += 2) d += 'q.5 -.8 1 0t1 0';
    out.push(`<path d="${d}" fill="none" stroke="${c}" stroke-width=".35"/>`);
    for (let x = x0 + 3; x < x1; x += 7.3) out.push(`<circle cx="${x.toFixed(2)}" cy="${y + 1.25}" r=".45" fill="none" stroke="${c}" stroke-width=".25"/>`);
  }
  return `<svg style="position:absolute;left:0;top:0;width:${W}mm;height:${BAND.face}mm" viewBox="0 0 ${W} ${BAND.face}">${out.join('')}</svg>`;
}

const cutLine = () => {
  const dash = (y1: number, y2: number) => `<line x1="${A5.w}" y1="${y1}" x2="${A5.w}" y2="${y2}" stroke="#8a8a8a" stroke-width=".2" stroke-dasharray="2.4 1.6"/>`;
  return `<svg style="position:absolute;left:0;top:0;width:${SHEET_W}mm;height:210mm" viewBox="0 0 ${SHEET_W} 210">${dash(0, 90)}${dash(120, 210)}
<text transform="translate(${A5.w + 0.85} 105) rotate(-90)" text-anchor="middle" font-family="'Alegreya Sans',sans-serif" font-weight="500" font-size="2.6" letter-spacing=".15" fill="#6a6a6a">${esc(L.cut)}</text></svg>`;
};

const PANEL_ROOM = (bandH: number) => H - bandH - PANEL_GAP - 2 * PY - 0.6;

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

  const backPal: Pal = { band: BRASS_DARK, head: darken(BRASS, 0.55), field: lighten(BRASS, 0.88), line: lighten(BRASS, 0.3), chip: lighten(BRASS, 0.96) };
  check(INK, backPal.field, 7, 'back: text on the field'); check(backPal.head, backPal.field, 4.5, 'back: headings'); check(CREAM, backPal.band, 7, 'back: the header band');

  // the back: the same for all four memos
  const backInner = (pal: Pal) => back.sections.map(s => sectionHtml(ctx, s, pal)).join(hair(IW, pal.line, 0.2)) + typesHtml(ctx, back.types!, pal);
  const backIn = backInner(backPal);
  const backFit = await fit(ctx, 'the back of the memo', PANEL_ROOM(BAND.back), back.sections.length + 1, (fs, g) => flowDiv(backIn, backPal, fs, g));
  const backBand = `<div class="me-bt">${esc(L.back.title)}</div><div class="me-bs">${esc(L.back.sub)}</div>`;
  const backSide = (x: number) => sideHtml(x, backBand, BAND.back, backPal, flowDiv(backIn, backPal, backFit.fs, backFit.g));

  // the faces: one per ship
  const faces: ((x: number) => string)[] = [];
  for (const ship of data.ships) {
    const pal = palette(ship.color, ship.name);
    const sections = [...face.sections, { key: L.ship.section, parts: [`<p class="me-p">${inline(ctx, lineOf(ship.name))}</p><p class="me-p me-more">${inline(ctx, L.ship.more)}</p>`], afterLi: false }];
    const inner = sections.map(s => sectionHtml(ctx, s, pal)).join(hair(IW, pal.line, 0.2));
    const f = await fit(ctx, `the face of the memo ${ship.name}`, PANEL_ROOM(BAND.face), sections.length, (fs, g) => flowDiv(inner, pal, fs, g));
    const band = `${motif(ship.code, pal.band)}<div class="me-medal" style="background:${darken(pal.band, 0.25)}">${esc(ship.code)}</div><div class="me-nm">${esc(ship.name)}</div><div class="me-cap">${esc(ship.side)} · ${esc(ship.captain)}</div>
<div class="me-tt">${inline(ctx, title.text)}</div><div class="me-ts">${inline(ctx, sub.text)}</div>`;
    faces.push(x => sideHtml(x, band, BAND.face, pal, flowDiv(inner, pal, f.fs, f.g)));
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
      sItems.push(`<div class="su-li"><span class="su-num">${esc(b.mark.replace('.', ''))}</span>${inline(ctx, b.text)}${b.mark === `${L.setup.secretAfter}.` ? `<div class="su-sub">${inline(ctx, secret)}</div>` : ''}</div>`);
    } else if (b.kind === 'diagram') sItems.push(`<div class="su-dg">${diagram(b.rows)}</div>`);
    else if (b.kind === 'note') sItems.push(`<div class="su-note">${b.body.map(x => x.kind === 'p' ? `<p class="me-p">${inline(ctx, x.text)}</p>` : '').join('')}</div>`);
    else throw new Error(`rules.md «${L.setup.rulesHeading}»: «${b.kind}» is not expected on the setup sheet`);
  }
  if (!setup.some(b => b.kind === 'li' && b.mark === `${L.setup.secretAfter}.`)) throw new Error(`rules.md «${L.setup.rulesHeading}»: no item ${L.setup.secretAfter}`);
  const sInner = sItems.join('');
  const sFit = await fit(ctx, 'the setup sheet', PANEL_ROOM(BAND.setup), 3, (fs, g) => flowDiv(sInner, sPal, fs, g), SETUP_SIZES);
  const sBand = `<div class="me-bt">${esc(L.setup.title)}</div><div class="me-bs">${esc(L.setup.sub)}</div>`;
  const sSide = (x: number) => sideHtml(x, sBand, BAND.setup, sPal, flowDiv(sInner, sPal, sFit.fs, sFit.g));
  console.log(`02-pamyatki: «${L.setup.title}» — ${sFit.fs} pt`);

  // sheets: faces of two ships, then their backs (duplex on the short edge: the back of the left memo is the right half)
  const pages = [];
  for (let i = 0; i < faces.length; i += 2) {
    pages.push({ html: cutLine() + faces[i](0) + faces[i + 1](A5.w), land: true });
    pages.push({ html: cutLine() + backSide(0) + backSide(A5.w), land: true });
  }
  pages.push({ html: cutLine() + sSide(0) + sSide(A5.w), land: true });
  return [{ file: '02-pamyatki', title: L.partTitle, css: CSS, pages, duplex: 'short' }];
}
