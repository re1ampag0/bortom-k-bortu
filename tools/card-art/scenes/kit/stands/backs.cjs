// Check sheets of the card backs (tools/card-art/scenes/backs.cjs): one sheet per deck — the back large; the same
// with stand-in lettering at the returned places (medallion with the letter, the name, the game's title); in grey
// ~120 px wide; shifted by 3 mm (9.5 units) next to the unshifted one (the edge must look the same); plus all five
// side by side. Render: node tools/card-art/kit-sheet.mjs tools/card-art/scenes/kit/stands/backs.cjs --out <dir>.
'use strict';
const B = require('../../backs.cjs');
const LETTER = { pearl: 'Ж', revenge: 'М', endeavour: 'И', dutch: 'Г', sea: '✦' };
const NAME = { pearl: 'Чёрная жемчужина', revenge: 'Месть королевы Анны', endeavour: 'Индевор', dutch: 'Летучий голландец', sea: 'Колода моря' };
const TITLE = 'БОРТОМ К БОРТУ', SERIF = "'Alegreya SC','DejaVu Serif',serif";
const f = v => String(+(+v).toFixed(2));
let n = 0;

/** A back (fresh ids each call) placed at (x, y) with width w; dx, dy — the print shift in card units. */
const card = (kind, x, y, w, o = {}) => {
  const b = B.back(kind, 1), k = w / 200, c = 'sc' + n++, dx = o.dx || 0, dy = o.dy || 0;
  const svg = b.svg.replace('<svg ', `<svg x="${f(dx)}" y="${f(dy)}" width="200" height="280" `);
  let lab = '';
  if (o.lettering) {
    const ink = b.tone === 'dark' ? ['#f3dc9d', '#fff2d4'] : ['#5a3c14', '#3a2410'];
    if (b.title) lab += `<text x="${100 + dx}" y="${f(b.title.y + dy)}" dominant-baseline="central" text-anchor="middle" font-family="${SERIF}" font-weight="700" font-size="13.5" letter-spacing="1.9" fill="${ink[0]}">${TITLE}</text>`;
    if (b.crest) { const r = b.crest.d / 2, cx = 100 + dx, cy = b.crest.y + dy;
      lab += `<circle cx="${cx}" cy="${f(cy)}" r="${f(r * 42.5 / 35)}" fill="none" stroke="#d9ab52" stroke-width="${f(r * 1.5 / 35)}" opacity=".7"/><circle cx="${cx}" cy="${f(cy)}" r="${f(r * 38 / 35)}" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="${f(r * 6 / 35)}"/><circle cx="${cx}" cy="${f(cy)}" r="${f(r * 36.5 / 35)}" fill="none" stroke="#d9ab52" stroke-width="${f(r * 3 / 35)}"/><circle cx="${cx}" cy="${f(cy)}" r="${f(r)}" fill="${b.ground}"/>`
        + `<text x="${cx}" y="${f(cy + 1)}" dominant-baseline="central" text-anchor="middle" font-family="${SERIF}" font-weight="700" font-size="${f(r * 1.14)}" fill="#fbe7b0">${LETTER[kind]}</text>`; }
    if (b.letter) lab += `<text x="${100 + dx}" y="${f(b.letter.y + dy)}" dominant-baseline="central" text-anchor="middle" font-family="${SERIF}" font-weight="700" font-size="${f(b.letter.size)}" fill="${ink[1]}">${LETTER[kind]}</text>`;
    lab += `<text x="${100 + dx}" y="${f(b.name.y + dy)}" dominant-baseline="central" text-anchor="middle" font-family="${SERIF}" font-weight="700" font-size="10.8" fill="${ink[1]}">${NAME[kind]}</text>`;
  }
  const grey = o.grey ? ` filter="url(#gr${c})"` : '';
  return `<svg x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(w * 1.4)}" viewBox="0 0 200 280"><defs><clipPath id="${c}"><rect width="200" height="280" rx="9"/></clipPath><filter id="gr${c}"><feColorMatrix type="saturate" values="0"/></filter></defs>`
    + `<g clip-path="url(#${c})"${grey}><rect width="200" height="280" fill="${b.ground}"/>${svg}${lab}</g>`
    + (o.safe ? `<rect x="28.6" y="28.6" width="142.8" height="222.8" fill="none" stroke="#ff3b3b" stroke-width=".6" stroke-dasharray="3 3"/>` : '')
    + `<rect width="200" height="280" rx="9" fill="none" stroke="#888" stroke-width="${f(.8 / k)}"/></svg>`;
};
const label = (x, y, t) => `<text x="${x}" y="${y}" font-family="DejaVu Sans,sans-serif" font-size="7" fill="#ccc">${t}</text>`;

const sheet = kind => ({ w: 640, h: 420, bg: '#3a3a3a', svg: () => {
  let s = card(kind, 10, 16, 280) + label(10, 11, 'рубашка, 200 × 280');
  s += card(kind, 300, 16, 150, { lettering: true }) + label(300, 11, 'с надписями на местах');
  s += card(kind, 460, 16, 75, { safe: true }) + label(460, 11, '9 мм (пунктир)');
  s += card(kind, 545, 16, 75, { grey: true }) + label(545, 11, 'серый');
  s += card(kind, 300, 236, 120, { lettering: true }) + label(300, 231, 'без сдвига');
  s += card(kind, 430, 236, 120, { lettering: true, dx: 9.5, dy: 9.5 }) + label(430, 231, 'сдвиг 3 мм вправо-вниз');
  s += card(kind, 460, 130, 75, { lettering: true, dx: -9.5, dy: -9.5 }) + label(460, 125, 'сдвиг влево-вверх');
  s += card(kind, 545, 130, 75, { lettering: true, grey: true });
  return s;
} });
const sheets = {};
for (const k of B.KINDS) sheets['back1-' + k] = sheet(k);
sheets['backs1-all'] = { w: 660, h: 300, bg: '#3a3a3a', svg: () => {
  let s = '';
  B.KINDS.forEach((k, i) => { s += card(k, 10 + i * 130, 10, 120, { lettering: true }); });
  B.KINDS.forEach((k, i) => { s += card(k, 10 + i * 130, 190, 60, { lettering: true, grey: true }) + card(k, 75 + i * 130, 190, 55); });
  return s;
} };
module.exports = { sheets };
