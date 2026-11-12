// 08 — the playtest report form (page 27 of PnP 0.3: the same fields and questions), one portrait A4 page.
// Frames and writing lines are SVG (0.3–0.45 mm), not font glyphs; the wording lives in text/report.json.
import fs from 'node:fs';
import path from 'node:path';
import { HERE, data, esc, mm, type Ctx, type Part } from '../kit';
import { A4, DECKS } from '../layout';
import { BRASS, BRASS_DARK, DECK_NAME, INK } from '../colors';

const TXT = JSON.parse(fs.readFileSync(path.join(HERE, 'text/report.json'), 'utf8')) as {
  partTitle: string; title: string; game: string; lead: string; fields: string[][]; players: string;
  questions: { title: string; hint: string }[]; footer: string;
};

const M = 12;                       // side margin
const W = A4.w - 2 * M;             // 186
const GAP = 6, COL = (W - GAP) / 2; // two columns of 90
const FRAME = '#a8946a', RULE = '#cfc3a6', ACCENT = '#8e2420';
const FIELDS = { y: 31, h: 14, gap: 3 };
const PLAYERS = { y: 84.5, row: 11, plate: { w: 40, h: 8 } };
const QUEST = { y: 115, bottom: 281, gap: 4, first: 12.6, pitch: 7.2 };

const colX = (c: number) => M + c * (COL + GAP);

function page(): string {
  let svg = '', html = '';
  const frame = (x: number, y: number, w: number, h: number) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.8" fill="#fffefa" stroke="${FRAME}" stroke-width=".4"/>`;
  const rule = (x1: number, x2: number, y: number, c = RULE, sw = 0.3) => `<path d="M${x1} ${y}H${x2}" stroke="${c}" stroke-width="${sw}"/>`;

  // head: title, «партия № ____», the lead line
  html += `<div class="rp-title">${esc(TXT.title)}</div><div class="rp-game">${esc(TXT.game)}</div><div class="rp-lead">${esc(TXT.lead)}</div>`;
  svg += rule(A4.w - M - 17, A4.w - M, 16.6, INK, 0.35);
  svg += `<path d="M${M} 26H${A4.w - M}" stroke="${BRASS}" stroke-width=".45"/><path d="M${M} 26H${M + 38}" stroke="${BRASS_DARK}" stroke-width=".9"/>`;

  // six short fields, two per row
  TXT.fields.forEach((row, r) => row.forEach((label, c) => {
    const x = colX(c), y = FIELDS.y + r * (FIELDS.h + FIELDS.gap);
    svg += frame(x, y, COL, FIELDS.h);
    html += `<div class="rp-label" style="left:${mm(x + 2.6)};top:${mm(y + 2.3)}">${esc(label)}</div>`;
  }));

  // players: a plate of the ship's colour and a line for the name
  const py = PLAYERS.y;
  html += `<div class="rp-label" style="left:${mm(M)};top:${mm(py)}">${esc(TXT.players)}</div>`;
  DECKS.forEach((code, i) => {
    const ship = data.ships.find(s => s.code === code)!, x = colX(i % 2), y = py + 4.6 + Math.floor(i / 2) * PLAYERS.row, p = PLAYERS.plate;
    svg += `<rect x="${x}" y="${y}" width="${p.w}" height="${p.h}" rx="1.6" fill="${ship.color}"/>` + rule(x + p.w + 3, x + COL, y + p.h - 0.4, '#8a7a5c', 0.35);
    html += `<div class="rp-ship" style="left:${mm(x)};top:${mm(y)};width:${mm(p.w)};height:${mm(p.h)}">${esc(DECK_NAME[code])}</div>`;
  });

  // five questions: a framed box with ruled lines to write on
  const n = TXT.questions.length, h = (QUEST.bottom - QUEST.y - (n - 1) * QUEST.gap) / n;
  TXT.questions.forEach((q, i) => {
    const y = QUEST.y + i * (h + QUEST.gap);
    svg += frame(M, y, W, h);
    for (let ly = QUEST.first; ly < h - 2; ly += QUEST.pitch) svg += rule(M + 3.5, M + W - 3.5, Math.round((y + ly) * 100) / 100);
    html += `<div class="rp-q" style="left:${mm(M + 3.5)};top:${mm(y + 2.6)}"><b>${esc(q.title)}</b><i>${esc(q.hint)}</i></div>`;
  });

  html += `<div class="rp-foot">${esc(TXT.footer)}</div>`;
  return `<svg viewBox="0 0 ${A4.w} ${A4.h}" style="position:absolute;left:0;top:0;width:${A4.w}mm;height:${A4.h}mm">${svg}</svg>${html}`;
}

const CSS = `
.rp-title{position:absolute;left:${M}mm;top:9mm;font:800 22pt/1 'Alegreya SC',serif;color:${INK};letter-spacing:.01em}
.rp-game{position:absolute;right:${M + 18.5}mm;top:12.2mm;font:500 12pt/1 Alegreya,serif;color:${INK}}
.rp-lead{position:absolute;left:${M}mm;top:19.3mm;font:italic 400 10pt/1.2 Alegreya,serif;color:#4a3a26}
.rp-label{position:absolute;font:700 7.5pt/1 'Alegreya Sans',sans-serif;color:#6a5a40;letter-spacing:.08em;white-space:nowrap}
.rp-ship{position:absolute;display:flex;align-items:center;justify-content:center;font:700 9pt/1 Alegreya,serif;color:#fff;white-space:nowrap}
.rp-q{position:absolute;white-space:nowrap;line-height:1}
.rp-q b{font:800 10pt/1 'Alegreya Sans',sans-serif;color:${ACCENT};letter-spacing:.03em;margin-right:3mm}
.rp-q i{font:italic 400 9.5pt/1 Alegreya,serif;color:#5a4a34}
.rp-foot{position:absolute;left:${M}mm;top:286mm;font:500 7pt/1 'Alegreya Sans',sans-serif;color:#8a7a62;letter-spacing:.09em;text-transform:uppercase}
`;

export async function build(_ctx: Ctx): Promise<Part[]> {
  return [{ file: '08-otchet', title: TXT.partTitle, css: CSS, pages: [{ html: page() }] }];
}
