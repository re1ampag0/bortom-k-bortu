// tools/card-art/scenes/backs4.cjs — the card backs of the user's plan 12.11 (night), п. 14: one design per deck, the picture
// runs to the card's edge and past it (bleed), no dissolving into a flat ground; frames and lines no nearer than 9 mm to the edge.
// One file per back in backs4/<kind>.cjs: draw() -> { svg, ground, tone, bleed, title, crest, letter, name } — the contract of
// backs.cjs (see its head). Until a kind is drawn here, the Pearl comes from the pilot (backs-pilot.cjs), the others from
// the earlier variant 1 of backs.cjs.
'use strict';
const fs = require('fs'), path = require('path');
function draw(kind, fallback) {
  const f = path.join(__dirname, 'backs4', kind + '.cjs');
  if (fs.existsSync(f)) return require(f).draw();
  if (kind === 'pearl') return require('./backs-pilot.cjs').draw('pearl');
  return fallback(kind);
}
module.exports = { draw };
