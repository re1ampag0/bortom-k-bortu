// 01 — the rules: pages 2–4 of the PnP 0.3 as a two-column A4 booklet (docs/tasks/print-kit.md 3.6).
// The text is tools/print/text/rules.md, written in a small mark-up (see parse()); nothing of it lives in the code.
// The blocks are measured in the browser and poured into the columns: a heading never stays alone at the bottom,
// a frame or a table is never cut. tools/print/check-text.ts compares the words of rules.md with the PnP.
import fs from 'node:fs';
import path from 'node:path';
import { BASE_CSS, HERE, data, esc, fontCss, type Ctx, type Part } from '../kit';
import { BRASS, BRASS_DARK, INK, TYPE, darken, lighten, type CardType } from '../colors';
import { iconImg } from '../icons';

// ---------------------------------------------------------------------------------------------------------------
// The mark-up of text/*.md:
//   # Title              ## Heading              > line under the title
//   paragraph (blank line between paragraphs)    - bullet        1. numbered item (1\. — not a list)
//   **bold**   *italic*   {coin} {flask} — the Powder coin and the Soul flask in the line
//   ::: box TITLE … :::       a framed block           ::: note … :::   a side note
//   ::: table … :::           rows «KEY | text»        ::: types … :::  the same with the medals of the card types
//   ::: diagram … :::         the scheme of the ships  ::: add TITLE … :::  a block that is not from the PnP
// ---------------------------------------------------------------------------------------------------------------
export type Block =
  | { kind: 'h1' | 'h2' | 'sub' | 'p'; text: string }
  | { kind: 'li'; text: string; mark: string }
  | { kind: 'box' | 'note' | 'add'; title: string; body: Block[] }
  | { kind: 'table' | 'types' | 'diagram'; rows: string[][] };

export const loadText = (name: string) => fs.readFileSync(path.join(HERE, 'text', name), 'utf8');

export function parse(md: string): Block[] {
  const root: Block[] = [];
  let into = root, rows: string[][] | null = null, lines: string[] = [], mark: string | null = null;
  const flush = () => {
    if (lines.length) into.push(mark === null ? { kind: 'p', text: lines.join(' ') } : { kind: 'li', text: lines.join(' '), mark });
    lines = []; mark = null;
  };
  for (const raw of md.split(/\r?\n/)) {
    const dir = raw.match(/^:::\s*(\w+)?\s*(.*)$/);
    if (dir) {
      flush();
      const [, kind, title] = dir;
      if (!kind) { into = root; rows = null; }
      else if (kind === 'table' || kind === 'types' || kind === 'diagram') { rows = []; root.push({ kind, rows }); }
      else if (kind === 'box' || kind === 'note' || kind === 'add') { const b: Block = { kind, title: title.trim(), body: [] }; root.push(b); into = b.body; }
      else throw new Error(`text mark-up: unknown block «::: ${kind}»`);
      continue;
    }
    if (rows) { if (raw.trim()) rows.push((raw.includes('|') ? raw.split('|') : raw.split(/ · (.*)/, 2)).map(s => s.trim())); continue; }
    if (!raw.trim()) { flush(); continue; }
    const h = raw.match(/^(#{1,2})\s+(.*)$/), q = raw.match(/^>\s+(.*)$/), li = raw.match(/^(-|\d+\.)\s+(.*)$/);
    if (h) { flush(); into.push({ kind: h[1].length === 1 ? 'h1' : 'h2', text: h[2].trim() }); }
    else if (q) { flush(); into.push({ kind: 'sub', text: q[1].trim() }); }
    else if (li) { flush(); mark = li[1]; lines = [li[2].trim()]; }
    else lines.push(raw.trim());
  }
  flush();
  return root;
}

/** The Powder coin or the Soul flask standing in a line of text (d — the width of the icon in mm). */
export function inlineIcon(ctx: Ctx, name: 'coin' | 'flask', d = name === 'coin' ? 3.7 : 3.1): string {
  const h = name === 'coin' ? d : d * 54 / 44;
  return `<span class="tx-ic" style="width:${d}mm;height:${h.toFixed(2)}mm">${iconImg(ctx, name, 0, 0, d)}</span>`;
}
/** One line of the mark-up → HTML. Typography only: no word is changed; a dash and a short word do not hang at a line end. */
export function inline(ctx: Ctx, text: string): string {
  return esc(text.replace(/\\\./g, '.'))
    .replace(/ — /g, NBSP + '— ')
    .replace(/ \((Q\d+)/g, NBSP + '($1')
    .replace(/(?<=^|[\s(«*])([А-Яа-яЁё]{1,2}|\d+) (?=[^\s—·+−=])/g, '$1' + NBSP)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.+?)\*/g, '<i>$1</i>')
    .replace(/\{(coin|flask)\}/g, (_, n: 'coin' | 'flask') => inlineIcon(ctx, n));
}
const NBSP = '\u00a0';
export const TEXT_CSS = `*{font-variant-numeric:lining-nums}
.tx-ic{display:inline-block;position:relative;vertical-align:-0.75mm;margin:0 .25mm}`;

/** A hair line drawn as SVG (README, rule 2): w × stroke mm. */
export const hair = (w: number, color = BRASS, sw = 0.2, cls = '') =>
  `<svg class="${cls}" style="display:block;width:${w}mm;height:${sw}mm" viewBox="0 0 ${w} ${sw}"><line x1="0" y1="${sw / 2}" x2="${w}" y2="${sw / 2}" stroke="${color}" stroke-width="${sw}"/></svg>`;

/** Heights (mm) of pieces of HTML laid out at the given width, in the print layout of Chromium. */
export async function measure(ctx: Ctx, css: string, width: number, pieces: string[]): Promise<number[]> {
  const page = await ctx.browser.newPage();
  await page.emulateMedia({ media: 'print' });
  await page.setContent(`<!doctype html><html lang="ru"><head><meta charset="utf-8"><style>${fontCss()}${BASE_CSS}${css}</style></head><body><div id="m" style="width:${width}mm">${pieces.map(p => `<div style="display:flow-root">${p}</div>`).join('')}</div></body></html>`);
  const px = await page.evaluate(async () => {
    const loads: Promise<unknown>[] = [];
    document.fonts.forEach(f => loads.push(f.load().catch(() => undefined)));
    await Promise.all(loads);
    await document.fonts.ready;
    return Array.from(document.querySelectorAll('#m > div')).map(e => e.getBoundingClientRect().height);
  });
  await page.close();
  return px.map(v => v * 25.4 / 96);
}

// ---------------------------------------------------------------------------------------------------------------
// The page: A4 portrait, two columns of 86 mm.
const PAGE = { w: 210, h: 297, mx: 15, gap: 8, top: 18.5, top1: 31, bottom: 16.5 };
const CW = (PAGE.w - 2 * PAGE.mx - PAGE.gap) / 2;
const HEAD = darken(BRASS, 0.5), TINT = lighten(BRASS, 0.9), KEY = lighten(BRASS, 0.78);
const FS = 10, LH = 4.3; // body text: pt and line height in mm

const CSS = `${TEXT_CSS}
.ru-u{display:flow-root;font:400 ${FS}pt/${LH}mm Alegreya,serif;color:${INK}}
.ru-u i{font-style:italic}
.ru-col{position:absolute;width:${CW}mm}
.ru-h2{margin:0 0 .9mm;font:700 15.5pt/5.8mm 'Alegreya SC',serif;letter-spacing:.02em;color:${HEAD}}
.ru-p{margin:0}
.ru-li{position:relative;padding-left:5.2mm}
.ru-mk{position:absolute;left:0;top:0;width:3.9mm;text-align:right;font-weight:700;color:${HEAD}}
.ru-bu{position:absolute;left:1.9mm;top:${(LH / 2 - 0.45).toFixed(2)}mm;width:1.1mm;height:1.1mm;border-radius:50%;background:${BRASS}}
.ru-box{background:${TINT};border:.3mm solid ${BRASS};border-radius:1.2mm;padding:2.1mm 3mm 2.5mm}
.ru-box>.ru-u+.ru-u{margin-top:1.1mm}
.ru-bt{margin-bottom:.9mm;font:800 8.5pt/4mm 'Alegreya Sans',sans-serif;letter-spacing:.07em;text-transform:uppercase;color:${darken(BRASS, 0.35)}}
.ru-add{background:#fff;border:.5mm solid ${BRASS};border-radius:1.2mm;padding:2.4mm 3mm 2.8mm}
.ru-add>.ru-u+.ru-u{margin-top:1.1mm}
.ru-at{margin-bottom:1.2mm;font:700 12.5pt/5mm 'Alegreya SC',serif;letter-spacing:.02em;color:${HEAD}}
.ru-note{border-left:.7mm solid ${BRASS};padding:.2mm 0 .2mm 2.8mm}
.ru-tr{display:flex;align-items:stretch}
.ru-tk{flex:none;width:23mm;display:flex;align-items:center;box-sizing:border-box;padding:1.3mm 2.2mm;background:${KEY};font:800 8.5pt/4mm 'Alegreya Sans',sans-serif;letter-spacing:.07em;color:${BRASS_DARK}}
.ru-tv{flex:1;padding:1.3mm 0 1.3mm 2.6mm}
.ru-ty .ru-tk{position:relative;width:32mm;min-height:9.6mm;padding-left:11.4mm;font-size:9pt}
.ru-md{position:absolute;left:2mm;top:50%;width:7.4mm;height:7.4mm;margin-top:-3.7mm}
.ru-dg svg{display:block}
.ru-lg{display:flex;flex-direction:column;align-items:center;gap:.5mm;margin-top:1.6mm;font:italic 400 9.5pt/4.2mm Alegreya,serif}
.ru-lg span{display:flex;align-items:center;gap:2mm;width:52mm;white-space:nowrap}
.ru-h1{position:absolute;left:${PAGE.mx}mm;top:11.5mm;margin:0;font:800 31pt/12mm 'Alegreya SC',serif;letter-spacing:.01em;color:${BRASS_DARK}}
.ru-run{position:absolute;top:9.6mm;font:700 8.5pt/4mm 'Alegreya SC',serif;letter-spacing:.08em;color:${darken(BRASS, 0.3)}}
.ru-foot{position:absolute;top:${PAGE.h - 12.2}mm;font:500 8pt/4mm 'Alegreya Sans',sans-serif;letter-spacing:.04em;color:${darken(BRASS, 0.3)}}
.ru-ln{position:absolute;left:0;top:0}
`;

/** The scheme of page 2 of the PnP: two rows of two boards; a solid arrow — the ship opposite, a dashed one — the diagonal. */
function diagram(rows: string[][]): string {
  const [top, upper, lower, bottom, legend] = rows;
  if (!legend || upper.length !== 2 || lower.length !== 2 || legend.length !== 2) throw new Error('rules.md: «::: diagram» needs 5 lines: side, two ships, two ships, side, two legend texts');
  const W = CW, bw = 30, bh = 10.5, xs = [8, W - 8 - bw], y1 = 5.6, y2 = 30.4, H = y2 + bh + 5.4;
  const colorOf = (nick: string) => data.ships.find(s => s.nick === nick)?.color ?? BRASS_DARK;
  const ship = (name: string, x: number, y: number) =>
    `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="1.4" fill="${colorOf(name)}"/><text x="${x + bw / 2}" y="${y + bh / 2 + 1.25}" text-anchor="middle" font-family="'Alegreya Sans',sans-serif" font-weight="700" font-size="3.6" fill="#fff">${esc(name)}</text>`;
  const side = (t: string, y: number) => `<text x="${W / 2}" y="${y}" text-anchor="middle" font-family="'Alegreya Sans',sans-serif" font-weight="800" font-size="2.7" letter-spacing=".55" fill="${darken(BRASS, 0.35)}">${esc(t)}</text>`;
  const cx = xs.map(x => x + bw / 2), a = y1 + bh + 1.1, b = y2 - 1.1, in1 = xs[0] + bw - 5, in2 = xs[1] + 5;
  const arrow = (xa: number, ya: number, xb: number, yb: number, dash = false) =>
    `<line x1="${xa}" y1="${ya}" x2="${xb}" y2="${yb}" stroke="${INK}" stroke-width="${dash ? 0.38 : 0.55}"${dash ? ' stroke-dasharray="1.5 1.1"' : ''} marker-start="url(#ru-ah)" marker-end="url(#ru-ah)"/>`;
  const sample = (dash: boolean) => `<svg style="width:11mm;height:2.6mm" viewBox="0 0 11 2.6"><line x1="1.2" y1="1.3" x2="9.8" y2="1.3" stroke="${INK}" stroke-width="${dash ? 0.38 : 0.55}"${dash ? ' stroke-dasharray="1.5 1.1"' : ''} marker-start="url(#ru-ah)" marker-end="url(#ru-ah)"/></svg>`;
  return `<div class="ru-dg"><svg style="width:${W}mm;height:${H}mm" viewBox="0 0 ${W} ${H}">
<defs><marker id="ru-ah" markerUnits="userSpaceOnUse" markerWidth="2.6" markerHeight="2.2" viewBox="0 0 2.6 2.2" refX="1.5" refY="1.1" orient="auto-start-reverse"><path d="M0 0L2.6 1.1L0 2.2z" fill="${INK}"/></marker></defs>
${side(top[0], 3.1)}${side(bottom[0], H - 0.9)}
${arrow(in1, a, in2, b, true)}${arrow(in2, a, in1, b, true)}${arrow(cx[0], a, cx[0], b)}${arrow(cx[1], a, cx[1], b)}
${ship(upper[0], xs[0], y1)}${ship(upper[1], xs[1], y1)}${ship(lower[0], xs[0], y2)}${ship(lower[1], xs[1], y2)}
</svg><div class="ru-lg"><span>${sample(false)}${esc(legend[0]).replace(/ — /g, NBSP + '— ')}</span><span>${sample(true)}${esc(legend[1]).replace(/ — /g, NBSP + '— ')}</span></div></div>`;
}

function table(ctx: Ctx, b: Extract<Block, { rows: string[][] }>): string {
  const line = hair(CW, BRASS, 0.2);
  const key = (k: string) => {
    if (b.kind !== 'types') return `<div class="ru-tk">${esc(k)}</div>`;
    const t = TYPE[k as CardType];
    if (!t) throw new Error(`rules.md: «::: types» — unknown card type «${k}»`);
    return `<div class="ru-tk" style="background:${lighten(t.t, 0.84)};color:${t.td}"><span class="ru-md">${iconImg(ctx, `medal-${t.key}`, 0, 0, 7.4)}</span>${esc(k)}</div>`;
  };
  return `<div class="${b.kind === 'types' ? 'ru-ty' : 'ru-tb'}">${line}${b.rows.map(([k, v]) => `<div class="ru-tr">${key(k)}<div class="ru-tv">${inline(ctx, v ?? '')}</div></div>${line}`).join('')}</div>`;
}

function html(ctx: Ctx, b: Block): string {
  switch (b.kind) {
    case 'h2': return `<h2 class="ru-h2">${inline(ctx, b.text)}</h2>${hair(CW, BRASS, 0.25)}`;
    case 'p': case 'sub': return `<p class="ru-p">${inline(ctx, b.text)}</p>`;
    case 'li': return `<div class="ru-li">${b.mark === '-' ? '<span class="ru-bu"></span>' : `<span class="ru-mk">${b.mark}</span>`}${inline(ctx, b.text)}</div>`;
    case 'note': return `<div class="ru-note">${b.body.map(x => `<div class="ru-u">${html(ctx, x)}</div>`).join('')}</div>`;
    case 'box': return `<div class="ru-box">${b.title ? `<div class="ru-bt">${esc(b.title)}</div>` : ''}${b.body.map(x => `<div class="ru-u">${html(ctx, x)}</div>`).join('')}</div>`;
    case 'add': return `<div class="ru-add">${b.title ? `<div class="ru-at">${esc(b.title)}</div>` : ''}${b.body.map(x => `<div class="ru-u">${html(ctx, x)}</div>`).join('')}</div>`;
    case 'table': case 'types': return table(ctx, b);
    case 'diagram': return diagram(b.rows);
    default: throw new Error(`rules.md: «${b.kind}» is not expected here`);
  }
}

interface Unit { kind: Block['kind']; html: string; h: number; keep: boolean; top: number }
const FRAMED = new Set<Block['kind']>(['box', 'add', 'note', 'table', 'types', 'diagram']);
/** White space above a block, by what stands before it (mm). */
function gapOf(prev: Block['kind'], kind: Block['kind']): number {
  if (kind === 'h2') return 5.4;
  if (prev === 'h2') return 1.8;
  if (FRAMED.has(kind) || FRAMED.has(prev)) return 2.7;
  if (kind === 'li') return prev === 'li' ? 1.05 : 1.5;
  return 1.9;
}
/** Pours the blocks into columns of the heights colH(i). A heading stays with the block after it, a lead-in with its list. */
function pour(units: Unit[], colH: (col: number) => number): Unit[][] {
  const cols: Unit[][] = [[]];
  let y = 0;
  for (let i = 0; i < units.length; i++) {
    const col = cols[cols.length - 1], prev = col[col.length - 1], gap = prev ? gapOf(prev.kind, units[i].kind) : 0;
    let need = units[i].h;
    for (let j = i; units[j].keep && j + 1 < units.length; j++) need += gapOf(units[j].kind, units[j + 1].kind) + units[j + 1].h;
    if (col.length && y + gap + need > colH(cols.length - 1)) { cols.push([]); y = 0; i--; continue; }
    col.push({ ...units[i], top: gap });
    y += gap + units[i].h;
  }
  return cols;
}

export async function build(ctx: Ctx): Promise<Part[]> {
  const blocks = parse(loadText('rules.md'));
  const title = blocks.find((b): b is Extract<Block, { text: string }> => b.kind === 'h1');
  if (!title) throw new Error('rules.md: no «# title»');
  const flow = blocks.filter(b => b !== title);
  const pieces = flow.map(b => html(ctx, b));
  const heights = await measure(ctx, CSS, CW, pieces.map(p => `<div class="ru-u">${p}</div>`));
  const units: Unit[] = flow.map((b, i) => {
    const next = flow[i + 1]?.kind;
    // a heading keeps the next block; a short lead-in keeps its list or table; a short first or last item of a list does not stand alone
    const short = (k: number) => heights[k] <= 2 * LH + 0.5;
    const keep = b.kind === 'h2' || (b.kind === 'p' && short(i) && (next === 'li' || next === 'table' || next === 'types'))
      || (b.kind === 'li' && next === 'li' && ((flow[i - 1]?.kind !== 'li' && short(i)) || (flow[i + 2]?.kind !== 'li' && short(i + 1))));
    return { kind: b.kind, html: pieces[i], h: heights[i], keep, top: 0 };
  });

  const full = PAGE.h - PAGE.top - PAGE.bottom, first = PAGE.h - PAGE.top1 - PAGE.bottom, slack = 0.6;
  let cols = pour(units, c => (c < 2 ? first : full) - slack);
  // the last page: both columns of about one height (the smallest column height that still takes its blocks)
  const lastStart = Math.floor((cols.length - 1) / 2) * 2;
  if (lastStart >= 2) {
    const tail = cols.slice(lastStart).flat();
    let lo = Math.max(...tail.map(u => u.h)), hi = full - slack;
    for (let k = 0; k < 24; k++) { const mid = (lo + hi) / 2; if (pour(tail, () => mid).length <= 2) hi = mid; else lo = mid; }
    cols = [...cols.slice(0, lastStart), ...pour(tail, () => hi)];
  }

  const pageCount = Math.ceil(cols.length / 2);
  const pages = Array.from({ length: pageCount }, (_, p) => {
    const top = p === 0 ? PAGE.top1 : PAGE.top, x2 = PAGE.mx + CW + PAGE.gap, mid = PAGE.mx + CW + PAGE.gap / 2, foot = PAGE.h - PAGE.bottom + 2.6;
    const col = (units: Unit[] | undefined, x: number) => !units ? '' :
      `<div class="ru-col" style="left:${x}mm;top:${top}mm">${units.map(u => `<div class="ru-u" style="margin-top:${u.top.toFixed(2)}mm">${u.html}</div>`).join('')}</div>`;
    const used = (units: Unit[] | undefined) => (units ?? []).reduce((s, u) => s + u.top + u.h, 0);
    const sepEnd = top + Math.max(used(cols[p * 2]), used(cols[p * 2 + 1]));
    const lines = `<svg class="ru-ln" style="width:${PAGE.w}mm;height:${PAGE.h}mm" viewBox="0 0 ${PAGE.w} ${PAGE.h}" fill="none" stroke="${BRASS}">
<line x1="${PAGE.mx}" y1="${top - 4.3}" x2="${PAGE.w - PAGE.mx}" y2="${top - 4.3}" stroke-width=".5"/><line x1="${PAGE.mx}" y1="${top - 3.4}" x2="${PAGE.w - PAGE.mx}" y2="${top - 3.4}" stroke-width=".18"/>
${cols[p * 2 + 1] ? `<line x1="${mid}" y1="${top + 0.6}" x2="${mid}" y2="${sepEnd.toFixed(2)}" stroke-width=".18"/>` : ''}
<line x1="${PAGE.mx}" y1="${foot}" x2="${PAGE.w - PAGE.mx}" y2="${foot}" stroke-width=".18"/></svg>`;
    const head = p === 0
      ? `<h1 class="ru-h1">${esc(title.text)}</h1><div class="ru-run" style="right:${PAGE.mx}mm;top:20.5mm">Бортом к борту</div>`
      : `<div class="ru-run" style="left:${PAGE.mx}mm">Бортом к борту</div><div class="ru-run" style="right:${PAGE.mx}mm">${esc(title.text)}</div>`;
    return { html: `${lines}${head}${col(cols[p * 2], PAGE.mx)}${col(cols[p * 2 + 1], x2)}<div class="ru-foot" style="left:${PAGE.mx}mm">Бортом к борту · демо-версия ${esc(data.version)} · правила</div><div class="ru-foot" style="right:${PAGE.mx}mm">${p + 1} / ${pageCount}</div>` };
  });
  return [{ file: '01-pravila', title: 'Бортом к борту — 01. Правила игры', css: CSS, pages }];
}
