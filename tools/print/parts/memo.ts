// 02 — the team memos: page 5 of the PnP 0.3 plus the short blocks of print-kit-review-player.md 3.6. Two A5 memos
// side by side on one landscape A4 (one per team), a cut line between them. The text is tools/print/text/memo.md
// (the mark-up of rules.ts); the type size is the largest of SIZES at which a memo fits its A5.
import { type Ctx, type Part } from '../kit';
import { BRASS, BRASS_DARK, INK, TYPE, darken, lighten, type CardType } from '../colors';
import { iconImg } from '../icons';
import { TEXT_CSS, hair, inline, loadText, measure, parse, type Block } from './rules';

const A5 = { w: 148.5, h: 210, pad: 10 };
const W = A5.w - 2 * A5.pad, H = A5.h - 2 * A5.pad;
const KEYW = 29; // the column of section names, mm
const SIZES = [10.5, 10, 9.5, 9]; // pt; never below 9
const HEAD = darken(BRASS, 0.5), TINT = lighten(BRASS, 0.9);
const TYPES_H = 25, TOP = 14.2; // the strip of card types at the bottom, the title at the top

const css = (fs: number) => {
  const lh = (fs * 1.2 * 0.3528).toFixed(2);
  return `${TEXT_CSS}
.me{position:absolute;top:${A5.pad}mm;width:${W}mm;height:${H}mm}
.me,.me-m{font:400 ${fs}pt/${lh}mm Alegreya,serif;color:${INK}}
.me-h1{position:absolute;left:0;top:0;margin:0;font:800 25pt/10mm 'Alegreya SC',serif;letter-spacing:.01em;color:${BRASS_DARK}}
.me-sub{position:absolute;right:0;top:4.6mm;font:italic 400 9.5pt/4.4mm Alegreya,serif;color:${darken(BRASS, 0.3)}}
.me-rule{position:absolute;left:0;top:11.4mm}
.me-body{position:absolute;left:0;top:${TOP}mm;width:${W}mm}
.me-sec{display:flex;align-items:flex-start;padding:var(--g) 0}
.me-key{flex:none;width:${KEYW}mm;box-sizing:border-box;padding:.25mm 2mm 0 0;font:800 ${Math.max(9, fs - 1)}pt/${lh}mm 'Alegreya Sans',sans-serif;letter-spacing:.06em;color:${HEAD}}
.me-val{flex:1}
.me-p{margin:0}
.me-li{position:relative;padding-left:4.6mm}
.me-mk{position:absolute;left:0;top:0;font-weight:700;color:${HEAD}}
.me-bu{position:absolute;left:1.2mm;top:${(Number(lh) / 2 - 0.5).toFixed(2)}mm;width:1.1mm;height:1.1mm;border-radius:50%;background:${BRASS}}
.me-add{margin-top:calc(var(--g) * .6);background:${TINT};border:.3mm solid ${BRASS};border-radius:1.2mm;padding:1.9mm 3mm 2.1mm}
.me-add .me-p+.me-p{margin-top:var(--a)}
.me-types{position:absolute;left:0;top:${H - TYPES_H}mm;width:${W}mm}
.me-grid{display:flex;flex-wrap:wrap;margin-top:1.6mm}
.me-ty{position:relative;width:50%;height:10.6mm;box-sizing:border-box;padding:2.6mm 0 0 11.8mm;font:500 10pt/4.8mm Alegreya,serif;white-space:nowrap}
.me-ty b{font:800 10pt/4.8mm 'Alegreya Sans',sans-serif;letter-spacing:.05em}
`;
};

function body(ctx: Ctx, blocks: Block[]): string {
  const line = hair(W, BRASS, 0.2);
  const out: string[] = [];
  let key: string | null = null, val: string[] = [];
  const flush = () => { if (key !== null) out.push(`${out.length ? line : ''}<div class="me-sec"><div class="me-key">${key}</div><div class="me-val">${val.join('')}</div></div>`); key = null; val = []; };
  for (const b of blocks) {
    if (b.kind === 'h2') { flush(); key = inline(ctx, b.text); }
    else if (b.kind === 'p') val.push(`<p class="me-p">${inline(ctx, b.text)}</p>`);
    else if (b.kind === 'li') val.push(`<div class="me-li">${b.mark === '-' ? '<span class="me-bu"></span>' : `<span class="me-mk">${b.mark}</span>`}${inline(ctx, b.text)}</div>`);
    else if (b.kind === 'add') { flush(); out.push(`<div class="me-add">${b.body.map(x => x.kind === 'p' ? `<p class="me-p">${inline(ctx, x.text)}</p>` : '').join('')}</div>`); }
  }
  flush();
  return out.join('');
}

/** The four card types with their medals; the words are the ribbons of the cards (colors.ts) — the text file must say the same. */
function types(ctx: Ctx, rows: string[][]): string {
  const cells = rows.map(([name, when]) => {
    const t = TYPE[name as CardType];
    if (!t) throw new Error(`memo.md: «::: types» — unknown card type «${name}»`);
    if (t.when !== when) throw new Error(`memo.md: «${name} · ${when}» differs from the ribbon of the cards «${name} · ${t.when}»`);
    return `<div class="me-ty">${iconImg(ctx, `medal-${t.key}`, 0.6, 0.8, 8.4)}<b style="color:${t.td}">${name}</b> · ${inline(ctx, when)}</div>`;
  });
  return `${hair(W, BRASS, 0.5)}<div style="height:.5mm"></div>${hair(W, BRASS, 0.18)}<div class="me-grid">${cells.join('')}</div>`;
}

export async function build(ctx: Ctx): Promise<Part[]> {
  const blocks = parse(loadText('memo.md'));
  const title = blocks.find(b => b.kind === 'h1'), sub = blocks.find(b => b.kind === 'sub'), ty = blocks.find(b => b.kind === 'types');
  if (!title || title.kind !== 'h1' || !sub || sub.kind !== 'sub' || !ty || ty.kind !== 'types' || ty.rows.length !== 4) throw new Error('memo.md: «# title», «> line under it» and «::: types» with 4 rows are needed');
  const flow = body(ctx, blocks.filter(b => b !== title && b !== sub && b !== ty));
  const room = H - TOP - TYPES_H - 2.5;
  // the largest type size at which the memo fits; the spare room is spread between the sections (not more than 2 mm each)
  const sections = flow.split('class="me-sec"').length - 1;
  let found: { fs: number; g: number } | null = null;
  for (const fs of SIZES) {
    const vars = (g: number) => `<div class="me-m" style="--g:${g}mm;--a:${(g * 0.9).toFixed(2)}mm">${flow}</div>`;
    const [h] = await measure(ctx, css(fs), W, [vars(1.1)]);
    if (h <= room) { found = { fs, g: 1.1 + Math.min(2, (room - h) / (2 * sections + 2)) }; break; }
  }
  const fit = found;
  if (!fit) throw new Error(`memo: the text does not fit an A5 memo at ${SIZES[SIZES.length - 1]} pt — shorten memo.md or make two pages`);
  const memo = (x: number) => `<div class="me" style="left:${x + A5.pad}mm;--g:${fit.g.toFixed(2)}mm;--a:${(fit.g * 0.9).toFixed(2)}mm">
<h1 class="me-h1">${inline(ctx, title.text)}</h1><div class="me-sub">${inline(ctx, sub.text)}</div>
<div class="me-rule">${hair(W, BRASS, 0.5)}<div style="height:.5mm"></div>${hair(W, BRASS, 0.18)}</div>
<div class="me-body">${flow}</div><div class="me-types">${types(ctx, ty.rows)}</div></div>`;
  // the cut line between the two memos (SVG, README rule 2)
  const dash = (y1: number, y2: number) => `<line x1="${A5.w}" y1="${y1}" x2="${A5.w}" y2="${y2}" stroke="#8a8a8a" stroke-width=".2" stroke-dasharray="2.4 1.6"/>`;
  const cut = `<svg style="position:absolute;left:0;top:0;width:297mm;height:210mm" viewBox="0 0 297 210">${dash(0, 90)}${dash(120, 210)}
<text transform="translate(${A5.w + 0.85} 105) rotate(-90)" text-anchor="middle" font-family="'Alegreya Sans',sans-serif" font-weight="500" font-size="2.6" letter-spacing=".15" fill="#6a6a6a">разрежьте пополам</text></svg>`;
  console.log(`02-pamyatki: кегль ${fit.fs} pt`);
  return [{ file: '02-pamyatki', title: 'Бортом к борту — 02. Памятки (2 шт., разрезать пополам)', css: css(fit.fs), pages: [{ html: cut + memo(0) + memo(A5.w), land: true }] }];
}
