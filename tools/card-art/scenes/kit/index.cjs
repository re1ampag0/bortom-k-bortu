// kit/index.cjs — the library of the print scenes: light and materials (light.cjs), sky, water and effects (env.cjs),
// the ships of the game (ship.cjs).
// API on one page: kit/README.md. Style rules: docs/mockups/print/STYLE.md.
'use strict';
module.exports = Object.assign({}, require('./light.cjs'), require('./env.cjs'), require('./ship.cjs'));
