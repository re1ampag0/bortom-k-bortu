// 00 — «Как печатать»: p. 1 the instruction, pp. 2–3 the two-sided calibration sheet (face and back of one sheet),
// p. 4 the deck checklist. Texts — tools/print/text/howto.json; geometry — layout.ts; shift letters — parts/cards.ts.
import fs from 'node:fs';
import path from 'node:path';
import { HERE, data, esc, mm, type Ctx, type Part } from '../kit';
import { A4, CARD, DECKS, slot } from '../layout';
import { BRASS, BRASS_DARK, DECK_BAND, DECK_NAME, INK, PARCHMENT, SEA, TYPE, lighten, type CardType, type DeckCode } from '../colors';
import { ROSE_URI, typeIconUri } from '../icons';
import { SHIFT_FILE, SHIFT_LETTERS, SHIFT_STEP } from './cards';

interface FileRow { file: string[]; what: string; sheets: string; sides: string; duplex?: boolean; skip?: boolean }
const T = JSON.parse(fs.readFileSync(path.join(HERE, 'text/howto.json'), 'utf8'));

/** Text of howto.json → HTML: `name` is a file name, **x** is bold. */
/** Russian typography: no line break after a number, around × and before a dash. */
const typo = (s: string) => s.replace(/(\d) (?=\S)/g, '$1\u00a0').replace(/ × /g, '\u00a0×\u00a0').replace(/ — /g, '\u00a0— ');
const fmt = (s: string) => esc(typo(s)).replace(/\d[\d,]*–\d[\d,]*(?:\u00a0[^\s<,.;:)]+)?/g, m => `<span class="hw-nb">${m}</span>`).replace(/`([^`]+)`/g, '<span class="hw-f">$1</span>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
const n3 = (v: number) => String(Math.round(v * 1000) / 1000);
const plural = (n: number) => `${n} ${T.plural[n % 10 === 1 && n % 100 !== 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 1 : 2]}`;

const MUTED = '#6b5a44', RED = DECK_BAND['М'], BRASS_TEXT = '#7a5a1e', TINT = lighten(PARCHMENT, .45);
/** Centres of the four corner cards of the 3 × 3 grid: the needle marks of the face. */
const MARKS = [0, 2, 6, 8].map(i => { const s = slot(i); return { x: s.x + CARD.w / 2, y: s.y + CARD.h / 2 }; });
/** The cell of the back's square: a hole within ±SHIFT_STEP of the centre needs no correction. */
const CELL = 2 * SHIFT_STEP, SQ = 3 * CELL;

// ---- small SVG pieces (no arrows, ticks or check marks from fonts) -------------------------------------------------
const sheetSvg = (inner: string) => `<svg class="hw-svg" viewBox="0 0 ${A4.w} ${A4.h}">${inner}</svg>`;
const arrowUp = (x: number, y: number) => `<path d="M${x} ${y + 3.4}V${y}M${x - 1.1} ${y + 1.2}L${x} ${y}L${x + 1.1} ${y + 1.2}" stroke="#555" stroke-width=".35" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
const CHECK = `<svg class="hw-ck" viewBox="0 0 10 10"><path d="M1.6 5.5L4.1 8L8.6 2.2" stroke="${BRASS_TEXT}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const lab = (x: number, y: number, w: number, html: string, cls = '') => `<div class="hw-l ${cls}" style="left:${mm(x)};top:${mm(y)};width:${mm(w)}">${html}</div>`;
const topLabel = (text: string) => sheetSvg(arrowUp(14.2, 5.6)) + `<div class="hw-top">${esc(text)}</div>`;
const head = (title: string, lead: string, kicker = true) => `<div class="hw-hd">${kicker ? `<div class="hw-k">${esc(T.kicker)}</div>` : ''}<h1 class="hw-h1">${esc(title)}</h1>${lead ? `<p class="hw-lead">${fmt(lead)}</p>` : ''}</div>`;

const CUT = { w: 34, h: 31.7 };
/** A small picture of a card sheet: step 1 — four long cuts, step 2 — a strip cut across. */
function cutPicture(): string {
  const k = .085, bx = 10.5 * k, by = 16.5 * k, cw = CARD.w * k, ch = CARD.h * k, card = lighten(BRASS, .72);
  const cards = (x: number, cols: number) => Array.from({ length: cols * 3 }, (_, i) => `<rect x="${n3(x + (i % cols) * cw + .25)}" y="${n3(by + Math.floor(i / cols) * ch + .25)}" width="${n3(cw - .5)}" height="${n3(ch - .5)}" rx=".5" fill="${card}"/>`).join('');
  const num = (x: number, n: number) => `<circle cx="${x}" cy="2.6" r="2.3" fill="${BRASS_DARK}"/><text x="${x}" y="3.75" text-anchor="middle" font-family="Alegreya Sans" font-weight="800" font-size="3.4" fill="#fff">${n}</text>`;
  const sx = 27, oy = 6;
  return `<svg class="hw-cut" viewBox="0 0 ${CUT.w} ${CUT.h}">${num(A4.w * k / 2 + .2, 1)}${num(sx + cw / 2, 2)}<g transform="translate(.2 ${oy})">`
    + `<rect x="0" y="0" width="${A4.w * k}" height="${A4.h * k}" fill="#fff" stroke="${MUTED}" stroke-width=".2"/>${cards(bx, 3)}`
    + [0, 1, 2, 3].map(c => `<path d="M${n3(bx + c * cw)} 0V${A4.h * k}" stroke="${RED}" stroke-width=".4"/>`).join('')
    + `${cards(sx, 1)}` + [0, 1, 2, 3].map(r => `<path d="M${sx - 1.6} ${n3(by + r * ch)}H${n3(sx + cw + 1.6)}" stroke="${RED}" stroke-width=".4"/>`).join('')
    + `</g></svg>`;
}

// ---- p. 1: how to print and cut -------------------------------------------------------------------------------------
function page1(): string {
  const t = T.p1;
  const rows = (t.files as FileRow[]).map(f => `<tr class="${f.duplex ? 'hw-dx' : f.skip ? 'hw-no' : ''}"><td>${f.file.map(n => `<span class="hw-f">${esc(n)}</span>`).join('<br>')}</td><td>${fmt(f.what)}</td><td>${fmt(f.sheets)}</td><td>${f.duplex ? `<span class="hw-pill">${esc(f.sides)}</span>` : fmt(f.sides)}</td></tr>`).join('');
  const checks = (items: string[]) => `<ul class="hw-ul">${items.map(s => `<li>${CHECK}${fmt(s)}</li>`).join('')}</ul>`;
  const steps = (items: string[]) => `<ol class="hw-ol">${items.map((s, i) => `<li><span class="hw-num">${i + 1}</span>${fmt(s)}</li>`).join('')}</ol>`;
  const ruler50 = `<svg class="hw-r50" viewBox="-1 0 52 4"><path d="M0 2.2H50M0 .8V3.6M50 .8V3.6${[10, 20, 30, 40].map(d => `M${d} 1.5V2.9`).join('')}" stroke="#555" stroke-width=".25" fill="none"/></svg>`;
  return `<div class="hw-p">${head(t.title, '')}`
    + `<div class="hw-first"><b class="hw-fh">${esc(t.firstH)}</b>${fmt(t.first)}</div>`
    + `<h2 class="hw-h2">${esc(t.setH)}</h2><table class="hw-t"><thead><tr>${(t.cols as string[]).map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`
    + `<p class="hw-dl">${fmt(t.duplexLine)}</p>`
    + `<div class="hw-2"><div>`
    + `<h2 class="hw-h2">${esc(t.settingsH)}</h2>${checks(t.settings)}`
    + `<h2 class="hw-h2">${esc(t.manualH)}</h2><p>${fmt(t.manual)}</p>`
    + `<h2 class="hw-h2">${esc(t.needH)}</h2><p>${fmt(t.need)}</p>`
    + `</div><div>`
    + `<h2 class="hw-h2">${esc(t.paperH)}</h2>${steps(t.paper)}<p>${fmt(t.paperNote)}</p>`
    + `<h2 class="hw-h2">${esc(t.cutH)}</h2><div class="hw-cutrow"><div>${steps(t.cut)}<p>${fmt(t.cutNote)}</p></div>${cutPicture()}</div>`
    + `<h2 class="hw-h2">${esc(t.rulerH)}</h2><p>${fmt(t.ruler)}</p>${ruler50}`
    + `</div></div></div>`;
}

// ---- p. 2: calibration, the face -------------------------------------------------------------------------------------
function page2(): string {
  const t = T.p2, R = { x: (A4.w - 100) / 2, y: 36, len: 100 }, C = { x: (A4.w - CARD.w) / 2, y: 57, ...CARD };
  let svg = '', html = '';
  // the 100 mm ruler: ticks every millimetre, the end ticks' centres are exactly 100 mm apart
  svg += `<path d="M${R.x} ${R.y}H${R.x + R.len}${Array.from({ length: R.len + 1 }, (_, i) => `M${R.x + i} ${R.y}v${i % 10 === 0 ? 4.6 : i % 5 === 0 ? 3.2 : 2}`).join('')}" stroke="#000" stroke-width=".2" fill="none"/>`;
  for (let i = 0; i <= 10; i++) html += lab(R.x + i * 10 - 5, R.y + 5.1, 10, String(i * 10), 'hw-c hw-s');
  html += lab(R.x - 12, R.y + 9.2, R.len + 24, fmt(t.ruler), 'hw-c');
  // the card outline, exactly 63 × 88, with its dimension lines
  const dx = C.x + 7, dy = C.y + 7, a = 1.3;
  svg += `<rect x="${C.x}" y="${C.y}" width="${C.w}" height="${C.h}" fill="${TINT}" stroke="#000" stroke-width=".2"/>`
    + `<path d="M${C.x} ${dy}H${C.x + C.w}M${C.x + a} ${dy - a * .6}L${C.x} ${dy}L${C.x + a} ${dy + a * .6}M${C.x + C.w - a} ${dy - a * .6}L${C.x + C.w} ${dy}L${C.x + C.w - a} ${dy + a * .6}`
    + `M${dx} ${C.y}V${C.y + C.h}M${dx - a * .6} ${C.y + a}L${dx} ${C.y}L${dx + a * .6} ${C.y + a}M${dx - a * .6} ${C.y + C.h - a}L${dx} ${C.y + C.h}L${dx + a * .6} ${C.y + C.h - a}" stroke="${BRASS_TEXT}" stroke-width=".2" fill="none" stroke-linejoin="round"/>`;
  html += `<div class="hw-l hw-dim" style="left:${mm(C.x + C.w / 2)};top:${mm(dy)}">${esc(t.cardW)}</div><div class="hw-l hw-dim hw-rot" style="left:${mm(dx)};top:${mm(C.y + C.h / 2)}">${esc(t.cardH)}</div>`
    + lab(C.x + 12, C.y + 33, C.w - 16, `<div class="hw-card">${esc(t.card)}</div>${fmt(t.cardHint)}`, 'hw-c');
  // the grey scale 0–100 % by 10 %
  const PW = 15, PH = 12, px0 = (A4.w - 11 * PW) / 2, gy = 155, ky = 181, cy = 206;
  html += lab(px0, gy - 5.6, 165, fmt(t.gray));
  for (let i = 0; i <= 10; i++) { const v = Math.round(255 * (1 - i / 10)); svg += `<rect x="${px0 + i * PW}" y="${gy}" width="${PW}" height="${PH}" fill="rgb(${v},${v},${v})"/>`; html += lab(px0 + i * PW, gy + PH + 1, PW, `${i * 10} %`, 'hw-c hw-s'); }
  svg += `<rect x="${px0}" y="${gy}" width="${11 * PW}" height="${PH}" fill="none" stroke="#000" stroke-width=".2"/>`;
  // dark patches: where does the printer merge dark tones into black
  const darks = [0, 10, 20, 30, 40, 50, 60];
  html += lab(px0, ky - 5.6, 165, fmt(t.dark));
  darks.forEach((v, i) => { svg += `<rect x="${px0 + i * PW}" y="${ky}" width="${PW}" height="${PH}" fill="rgb(${v},${v},${v})"/>`; html += lab(px0 + i * PW, ky + PH + 1, PW, String(v), 'hw-c hw-s'); });
  html += lab(px0 + darks.length * PW + 4, ky + .2, 165 - darks.length * PW - 4, fmt(t.darkHint));
  // the four deck colours
  const DW = 38.25, DG = 4;
  html += lab(px0, cy - 5.6, 165, fmt(t.decks));
  DECKS.forEach((d, i) => { const x = px0 + i * (DW + DG); svg += `<rect x="${x}" y="${cy}" width="${DW}" height="10" fill="${DECK_BAND[d]}"/>`; html += lab(x - 2, cy + 11, DW + 4, `<b>${d}</b> · ${esc(DECK_NAME[d])}`, 'hw-c hw-s'); });
  // the needle marks: hairlines and a Ø 1 mm ring
  for (const m of MARKS) {
    svg += `<path d="M${m.x - 6} ${m.y}H${m.x + 6}M${m.x} ${m.y - 6}V${m.y + 6}" stroke="#000" stroke-width=".2" fill="none"/><circle cx="${m.x}" cy="${m.y}" r=".5" fill="none" stroke="#000" stroke-width=".2"/>`;
    html += lab(m.x - 19, m.y + 7.4, 38, esc(t.cross), 'hw-c hw-s hw-cr');
  }
  html += `<div class="hw-next" style="left:${mm(MARKS[2].x + 24)};width:${mm(MARKS[3].x - MARKS[2].x - 48)};top:${mm(MARKS[2].y - 5.5)}">${fmt(t.next)}</div>`;
  return topLabel(t.top) + `<div class="hw-cal">${head(t.title, t.lead, false)}</div>` + sheetSvg(svg) + html;
}

// ---- p. 3: calibration, the back --------------------------------------------------------------------------------------
function page3(): string {
  const t = T.p3;
  let svg = '', html = '';
  for (const f of MARKS) {
    // flip on the long edge of a portrait sheet: x → 210 − x, y stays
    const cx = A4.w - f.x, cy = f.y, x0 = cx - SQ / 2, y0 = cy - SQ / 2;
    let d = '', ticks = '';
    for (let i = 0; i <= 3; i++) d += `M${n3(x0 + i * CELL)} ${n3(y0)}V${n3(y0 + SQ)}M${n3(x0)} ${n3(y0 + i * CELL)}H${n3(x0 + SQ)}`;
    for (let i = 0; i <= SQ * 2; i++) { const p = i * .5, len = i % (CELL * 2) === 0 ? 1.7 : i % 2 === 0 ? 1.15 : .65; ticks += `M${n3(x0 + p)} ${n3(y0)}v${-len}M${n3(x0 + p)} ${n3(y0 + SQ)}v${len}M${n3(x0)} ${n3(y0 + p)}h${-len}M${n3(x0 + SQ)} ${n3(y0 + p)}h${len}`; }
    svg += `<rect x="${n3(x0)}" y="${n3(y0)}" width="${SQ}" height="${SQ}" fill="#fff"/><path d="${ticks}" stroke="#000" stroke-width=".12" fill="none"/><path d="${d}" stroke="#000" stroke-width=".2" fill="none"/>`;
    SHIFT_LETTERS.forEach((l, i) => { html += `<div class="hw-l hw-sq" style="left:${mm(x0 + (i % 3) * CELL)};top:${mm(y0 + Math.floor(i / 3) * CELL)};width:${mm(CELL)};height:${mm(CELL)}">${l}</div>`; });
    html += lab(cx - 28, cy + SQ / 2 + 2.6, 56, esc(t.scale), 'hw-c hw-s hw-cr');
  }
  const cells = SHIFT_LETTERS.map((l, i) => `<div class="hw-gc${i === 4 ? ' hw-gm' : ''}"><b>${l}</b>${i === 4 ? `<span>${esc(t.center)}</span>` : `<span class="hw-f">05b-rubashki-${SHIFT_FILE[i]}.pdf</span>`}</div>`).join('');
  html += `<div class="hw-back">`
    + `<ol class="hw-ol hw-big">${(t.steps as string[]).map((s, i) => `<li><span class="hw-num">${i + 1}</span>${fmt(s)}</li>`).join('')}</ol>`
    + `<h2 class="hw-h2">${esc(t.tableH)}</h2><div class="hw-grid">${cells}</div><p class="hw-tol">${fmt(t.tolerance)}</p>`
    + `<ul class="hw-ul">${(t.notes as string[]).map(s => `<li>${CHECK}${fmt(s)}</li>`).join('')}</ul></div>`;
  return topLabel(t.top) + `<div class="hw-cal">${head(t.title, t.lead, false)}</div>` + sheetSvg(svg) + html;
}

// ---- p. 4: the deck checklist -----------------------------------------------------------------------------------------
function page4(): string {
  const t = T.p4, icons = new Map<string, string>();
  const icon = (type: string) => {
    if (!(type in TYPE)) return `<span class="hw-ti" style="background:${SEA.t}"><img src="${ROSE_URI}" alt=""></span>`;
    if (!icons.has(type)) icons.set(type, typeIconUri(type as CardType));
    return `<span class="hw-ti" style="background:${TYPE[type as CardType].t}"><img src="${icons.get(type)}" alt=""></span>`;
  };
  const row = (name: string, type: string, copies = 1) => `<div class="hw-r">${icon(type)}<span class="hw-n">${esc(name)}</span>${copies > 1 ? `<b class="hw-x">×${copies}</b>` : ''}</div>`;
  const byName = <N extends { name: string }>(list: N[]) => [...list].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  const deckCol = (d: DeckCode) => {
    const cards = byName(data.decks[d]), total = cards.reduce((n, c) => n + (c.copies ?? 1), 0), lg = data.legends[d];
    return `<div class="hw-col"><div class="hw-band" style="background:${DECK_BAND[d]}"><span class="hw-bl" style="color:${DECK_BAND[d]}">${d}</span><span class="hw-bn">${esc(DECK_NAME[d])}</span></div>`
      + cards.map(c => row(c.name, c.type, c.copies ?? 1)).join('')
      + `<div class="hw-lg"><div class="hw-lgl">${esc(t.legend)}</div>${row(lg.name, lg.type)}</div><div class="hw-sum">${plural(total)} ${esc(t.total)}</div></div>`;
  };
  const sea = byName(data.sea);
  const seaCol = `<div class="hw-col"><div class="hw-band" style="background:${SEA.band}"><span class="hw-bl hw-rose"><img src="${ROSE_URI}" alt=""></span><span class="hw-bn">${esc(t.sea)}</span></div>`
    + sea.map(c => row(c.name, 'sea')).join('') + `<div class="hw-sum hw-sums">${plural(sea.length)}</div></div>`;
  const types = (Object.keys(TYPE) as CardType[]).map(k => `<span class="hw-ty">${icon(k)}${esc(k)}</span>`).join('');
  return `<div class="hw-p">${head(t.title, t.lead)}<div class="hw-types"><span>${esc(t.types)}</span>${types}</div>`
    + `<div class="hw-cols">${DECKS.map(deckCol).join('')}${seaCol}</div><p class="hw-extra">${fmt(t.extra)}</p></div>`;
}

const CSS = `
.hw-svg{position:absolute;left:0;top:0;width:${mm(A4.w)};height:${mm(A4.h)}}
.hw-p{position:absolute;left:13mm;right:13mm;top:10mm;bottom:13mm;font:400 10.5pt/1.16 Alegreya,serif;color:${INK}}
.hw-p p,.hw-back p{margin:0 0 1.3mm}
.hw-nb{white-space:nowrap}
.hw-f{font:700 .93em/1 'Alegreya Sans',sans-serif;white-space:nowrap;color:#1c2a44}
.hw-k{font:700 8pt/1 'Alegreya Sans',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:${BRASS_TEXT}}
.hw-h1{font:800 25pt/1 'Alegreya SC',serif;margin:1.2mm 0 0;padding-bottom:1.7mm;border-bottom:.5mm solid ${BRASS};color:${INK}}
.hw-lead{font:400 10.5pt/1.2 Alegreya,serif;margin:1.8mm 0 0}
.hw-h2{font:700 12.5pt/1.05 'Alegreya SC',serif;margin:2.3mm 0 1.3mm;padding-bottom:.8mm;border-bottom:.3mm solid ${BRASS};color:${INK}}
.hw-first{margin:2.6mm 0 0;padding:2mm 3mm 2.1mm;background:${lighten(BRASS, .84)};border:.4mm solid ${BRASS};border-radius:1.5mm;font-size:11pt}
.hw-fh{display:inline-block;margin-right:2.4mm;font:800 11.5pt/1 'Alegreya SC',serif;color:${RED}}
.hw-t{width:100%;border-collapse:collapse;font:400 10.5pt/1.1 Alegreya,serif}
.hw-t th{text-align:left;font:700 8pt/1 'Alegreya Sans',sans-serif;letter-spacing:.08em;text-transform:uppercase;color:${BRASS_TEXT};padding:0 2mm 1mm 0}
.hw-t td{padding:.65mm 2mm .65mm 0;border-top:.3mm solid ${lighten(BRASS, .45)};vertical-align:top}
.hw-t td:nth-child(1){width:37mm}.hw-t td:nth-child(3){width:22.5mm}.hw-t td:nth-child(4){width:42mm;padding-right:0}
.hw-t tr.hw-dx td{background:${lighten(BRASS, .84)}}
.hw-t tr.hw-no td{color:${MUTED}}
.hw-pill{display:inline-block;padding:.5mm 1.8mm .6mm;border-radius:.8mm;background:${RED};color:#fff;font:800 8.5pt/1 'Alegreya Sans',sans-serif;letter-spacing:.06em;white-space:nowrap}
.hw-dl{margin:1.6mm 0 0 !important;padding:1.6mm 3mm 1.8mm;border:.4mm solid ${RED};border-radius:1.5mm;font-size:11pt;text-align:center}
.hw-2{display:flex;gap:7mm;margin-top:.4mm}.hw-2>div{flex:1 1 0;min-width:0}
.hw-ul,.hw-ol{list-style:none;margin:0;padding:0}
.hw-ul li,.hw-ol li{position:relative;padding-left:5.4mm;margin:0 0 1.2mm}
.hw-ck{position:absolute;left:0;top:.75mm;width:3.5mm;height:3.5mm}
.hw-num{position:absolute;left:0;top:.35mm;width:3.9mm;height:3.9mm;border-radius:50%;background:${BRASS_DARK};color:#fff;font:800 8pt/3.9mm 'Alegreya Sans',sans-serif;text-align:center}
.hw-cutrow{display:flex;gap:3mm;align-items:flex-start}.hw-cutrow>div{flex:1 1 0}
.hw-cut{flex:none;width:${mm(CUT.w)};height:${mm(CUT.h)}}
.hw-r50{display:block;width:52mm;height:4mm;margin:.6mm 0 0}
.hw-top{position:absolute;left:17mm;top:6.2mm;font:700 8pt/1 'Alegreya Sans',sans-serif;color:#555;letter-spacing:.03em;white-space:nowrap}
.hw-cal{position:absolute;left:13mm;right:13mm;top:12mm;color:${INK}}
.hw-cal .hw-h1{font-size:20pt}
.hw-l{position:absolute;font:400 9.5pt/1.2 Alegreya,serif;color:${INK}}
.hw-c{text-align:center}
.hw-s{font:500 8pt/1.1 'Alegreya Sans',sans-serif}
.hw-cr{font-weight:700}
.hw-card{font:700 13pt/1.1 'Alegreya SC',serif;margin-bottom:1.5mm}
.hw-dim{transform:translate(-50%,-50%);padding:0 1.2mm;background:${TINT};font:700 8.5pt/1.2 'Alegreya Sans',sans-serif;color:${BRASS_TEXT};white-space:nowrap}
.hw-dim.hw-rot{transform:translate(-50%,-50%) rotate(-90deg)}
.hw-next{position:absolute;box-sizing:border-box;padding:2mm 3mm 2.2mm;border:.4mm solid ${BRASS};border-radius:1.5mm;background:${lighten(BRASS, .84)};font:700 10.5pt/1.2 Alegreya,serif;text-align:center;color:${INK}}
.hw-sq{display:flex;align-items:center;justify-content:center;font:700 6.5pt/1 'Alegreya Sans',sans-serif;color:#444}
.hw-back{position:absolute;left:24mm;right:24mm;top:90mm;font:400 11pt/1.2 Alegreya,serif;color:${INK}}
.hw-big li{margin-bottom:2mm}
.hw-big .hw-num{top:.5mm}
.hw-grid{display:grid;grid-template-columns:repeat(3,1fr);border:.3mm solid ${BRASS};margin:2.4mm 0 2.2mm}
.hw-gc{display:flex;align-items:center;gap:2.4mm;height:12.5mm;padding:0 2.6mm;box-sizing:border-box;border:.3mm solid ${BRASS}}
.hw-gc b{flex:none;width:7mm;font:800 17pt/1 'Alegreya SC',serif;text-align:center}
.hw-gc span{font-size:9.5pt}
.hw-gm{background:${lighten(BRASS, .78)}}.hw-gm span{font:700 10pt/1.1 Alegreya,serif}
.hw-tol{margin:0 0 3mm !important}
.hw-types{display:flex;align-items:center;gap:5mm;margin:2.2mm 0 3mm;font:500 9pt/1 'Alegreya Sans',sans-serif}
.hw-ty{display:flex;align-items:center;gap:1.3mm;font-weight:700;letter-spacing:.06em}
.hw-cols{display:flex;gap:3mm;align-items:flex-start}
.hw-col{flex:1 1 0;min-width:0}
.hw-band{display:flex;align-items:center;gap:1.8mm;height:13mm;padding:0 1.8mm;box-sizing:border-box;margin-bottom:1.8mm}
.hw-bl{flex:none;width:7.4mm;height:7.4mm;border-radius:50%;background:#f6e7c1;font:800 12pt/7.4mm 'Alegreya SC',serif;text-align:center}
.hw-rose{background:${SEA.t}}.hw-rose img{width:7.4mm;height:7.4mm}
.hw-bn{font:700 10pt/1.02 'Alegreya SC',serif;color:#fff;letter-spacing:.02em}
.hw-r{display:flex;align-items:flex-start;gap:1.4mm;margin-bottom:1.9mm;font:500 10pt/1.08 Alegreya,serif}
.hw-ti{flex:none;display:flex;align-items:center;justify-content:center;width:3.9mm;height:3.9mm;border-radius:50%}
.hw-ti img{width:3.2mm;height:3.2mm}
.hw-n{flex:1 1 auto;min-width:0;padding-top:.35mm}
.hw-x{flex:none;padding-top:.2mm;font:800 10.5pt/1.08 'Alegreya Sans',sans-serif;color:${RED}}
.hw-lg{margin-top:1.2mm;padding-top:1.4mm;border-top:.3mm solid ${BRASS}}
.hw-lgl{margin-bottom:1.1mm;font:700 8pt/1 'Alegreya Sans',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:${BRASS_TEXT}}
.hw-sum{margin-top:.6mm;padding-top:1.5mm;border-top:.3mm solid ${BRASS};font:700 10.5pt/1.1 'Alegreya SC',serif}
.hw-sums{margin-top:1.2mm}
.hw-extra{margin:5mm 0 0 !important;padding-top:2mm;border-top:.3mm solid ${BRASS};font-size:10pt;color:${INK}}
`;

export async function build(_ctx: Ctx): Promise<Part[]> {
  return [{ file: '00-kak-pechatat', title: 'Бортом к борту — 00. Как печатать', css: CSS, pages: [page1(), page2(), page3(), page4()].map(html => ({ html })) }];
}
