const { DEFS } = require('./art.cjs'); const S = require('./specs3.cjs');
let n = 0;
// Straight one-segment strokes with a bounding-box gradient have a zero-size box and vanish: draw them as rects.
function fixLines(svg) {
  return svg.replace(/<path d="M(-?[\d.]+) (-?[\d.]+)([hHvV])(-?[\d.]+)" stroke="(url\(#[^)]+\))" stroke-width="([\d.]+)"([^>]*?)\/>/g, (m, x, y, c, l, st, w, rest) => {
    x = +x; y = +y; l = +l; w = +w; const lc = /stroke-linecap="round"/.test(rest); const op = (rest.match(/opacity="([\d.]+)"/) || [])[1];
    let x1, y1, W, H;
    if (c === 'h' || c === 'H') { const x2 = c === 'h' ? x + l : l; x1 = Math.min(x, x2); W = Math.abs(x2 - x); y1 = y - w / 2; H = w; }
    else { const y2 = c === 'v' ? y + l : l; y1 = Math.min(y, y2); H = Math.abs(y2 - y); x1 = x - w / 2; W = w; }
    return `<rect x="${x1}" y="${y1}" width="${W}" height="${H}" ${lc ? `rx="${w / 2}"` : ''} fill="${st}"${op ? ` opacity="${op}"` : ''}/>`; });
}
function picture3(name, frame) { const u = 'p' + (n++); const f = S[name]; if (!f) throw new Error('no scene ' + name);
  return `<svg viewBox="0 0 200 120" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"><defs>${DEFS(u)}<clipPath id="cl${u}"><rect width="200" height="120" rx="4"/></clipPath>
  <radialGradient id="vig${u}" cx=".5" cy=".5" r=".72"><stop offset=".62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#1a0f06" stop-opacity=".4"/></radialGradient></defs>
  <g clip-path="url(#cl${u})">${fixLines(f(u))}<rect width="200" height="120" fill="url(#vig${u})"/></g>
  <rect x="1" y="1" width="198" height="118" rx="4" fill="none" stroke="${frame}" stroke-width="2"/><rect x="4" y="4" width="192" height="112" rx="2.5" fill="none" stroke="#2e1d10" stroke-width=".6" opacity=".7"/>
  ${[[6, 6, 0], [194, 6, 90], [194, 114, 180], [6, 114, 270]].map(([x, y, a]) => `<path transform="translate(${x} ${y}) rotate(${a})" d="M0 9V0h9M2.5 6V2.5H6" stroke="${frame}" stroke-width="1.2" fill="none"/>`).join('')}</svg>`; }
module.exports = { picture3 };
