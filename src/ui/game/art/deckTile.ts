// «Палуба» (rig, г): the planks of A5Rig's deck() as a seamless tile for a CSS background. Rows are 21 px high, planks of
// 150–290 px with seams, nails and grain as in the reference; every row is a cycle, so the tile joins itself on all sides
// (a plank that crosses the right edge is drawn again from the left edge) and a repeat shows no seam or grid.
export const DECK_TILE_W = 720;
export const DECK_TILE_H = 21 * 10;

const R1 = (n: number) => Math.round(n * 10) / 10;

export function deckTileSvg(seed = 7): string {
  const W = DECK_TILE_W,
    ph = 21;
  let r = seed;
  const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  let s = '';
  for (let row = 0, y = 0; y < DECK_TILE_H; y += ph, row++) {
    // a cycle of planks that adds up to the width exactly: the last one is stretched to close the ring
    const lens: number[] = [];
    let sum = 0;
    while (sum < W - 150) {
      const len = 150 + rnd() * 140;
      lens.push(len);
      sum += len;
    }
    const k = W / sum;
    for (let i = 0; i < lens.length; i++) lens[i] *= k;
    let x = -rnd() * lens[0];
    for (const len of lens) {
      const tone = 36 + rnd() * 14,
        hue = 26 + rnd() * 6;
      const g1 = rnd() * 2 - 1,
        g2 = rnd() * 2 - 1,
        g3 = rnd() * 2 - 1;
      // a plank that crosses the right edge comes again from the left (x − W)
      for (const ox of x + len > W ? [0, -W] : [0]) {
        const px = x + ox;
        s += `<rect x="${R1(px)}" y="${y}" width="${R1(len)}" height="${ph}" fill="hsl(${R1(hue)} 38% ${R1(tone * 0.62)}%)"/>`;
        s += `<path d="M${R1(px)} ${y + 3} q${R1(len / 2)} ${R1(g1)} ${R1(len)} 0 M${R1(px)} ${y + 9} q${R1(len / 2)} ${R1(g2)} ${R1(len)} 0 M${R1(px)} ${y + 15} q${R1(len / 2)} ${R1(g3)} ${R1(len)} 0" stroke="#000" stroke-opacity=".12" stroke-width=".6" fill="none"/>`;
        s += `<rect x="${R1(px)}" y="${y}" width="${R1(len)}" height="1.2" fill="#fff" opacity=".05"/><rect x="${R1(px + len - 1.4)}" y="${y}" width="1.4" height="${ph}" fill="#0d0703"/>`;
        s += [[4, 6], [4, 15], [len - 6, 6], [len - 6, 15]]
          .map(([dx, dy]) => `<circle cx="${R1(px + dx)}" cy="${y + dy}" r="1.25" fill="#1a0f06"/><circle cx="${R1(px + dx - 0.3)}" cy="${y + dy - 0.3}" r=".5" fill="#8a6a46" opacity=".5"/>`)
          .join('');
      }
      x += len;
    }
    s += `<rect x="0" y="${y + ph - 1.6}" width="${W}" height="1.6" fill="#0a0603"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${DECK_TILE_H}" viewBox="0 0 ${W} ${DECK_TILE_H}">${s}</svg>`;
}

/** The tile as a CSS url(). */
export const DECK_TILE_URL = `url("data:image/svg+xml,${encodeURIComponent(deckTileSvg())}")`;
