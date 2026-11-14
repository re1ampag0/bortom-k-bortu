// Check sheets of the rooms (kit/interior.cjs): the four rooms, each on a card-size panel (200 x 280) with its own
// light scheme (interior.scheme), the glass line at 58 % of the height marked (the main things stand above it).
// Sheet 1 — the default moods; sheet 2 — the other moods and options (detail 'mid', parts left out, props off).
// Render: node tools/card-art/kit-sheet.mjs tools/card-art/scenes/kit/stands/interior.cjs --out report/print-kit/step2/interior --width 1000
'use strict';
const K = require('../index.cjs');

const GLASS = 280 * .58;
const panel = (x, y, body, cap) => `<svg x="${x}" y="${y}" width="200" height="280" viewBox="0 0 200 280">${body}`
  + `<path d="M0 ${GLASS}H200" stroke="#ffffff" stroke-width=".7" stroke-dasharray="4 3" opacity=".8"/><text x="196" y="${GLASS - 2}" text-anchor="end" font-family="sans-serif" font-size="5.5" fill="#fff" opacity=".85">стекло 58 %</text></svg>`
  + `<rect x="${x}" y="${y}" width="200" height="280" fill="none" stroke="#fff" stroke-width=".8"/>`
  + `<text x="${x + 4}" y="${y + 9}" font-family="sans-serif" font-size="6.5" fill="#fff" stroke="#000" stroke-width=".25" paint-order="stroke">${cap}</text>`;
const sheet = (cells, caps) => ({ w: 400, h: 560, bg: '#222', svg: () => cells.map((c, i) => panel((i % 2) * 200, Math.floor(i / 2) * 280, c(), caps[i])).join('') });

/** One room: its scheme -> L -> the room. */
const room = (u, kind, o = {}) => { const s = K.interior.scheme(kind, o), L = K.makeLight(s.light, s.cam); return K.interior(u, L, Object.assign({ kind, mood: s.mood }, o)); };

const kinds = [
  () => room('IA', 'cabin'),
  () => room('IB', 'gundeck'),
  () => room('IC', 'hold'),
  () => room('ID', 'tavern'),
];
const moods = [
  () => room('JA', 'cabin', { mood: 'window' }),
  () => room('JB', 'gundeck', { mood: 'window', detail: 'mid', off: ['ropes'] }),
  () => room('JC', 'hold', { mood: 'lamp', off: ['crates'] }),
  () => room('JD', 'tavern', { mood: 'candles', items: { hearth: true, barrels: false }, vp: [110, 100] }),
];

module.exports = { sheets: {
  'interior-kinds': sheet(kinds, ['каюта — фонарь, луна в окнах', 'орудийная палуба — фонари', 'трюм — свет из люка', 'таверна — очаг, свечи']),
  'interior-moods': sheet(moods, ['каюта — день из кормовых окон', 'палуба — день в порты, detail mid', 'трюм — ночь, фонарь у трапа', 'таверна — свечи, очаг погас, vp вправо']),
} };
