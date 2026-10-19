// The detailed ships of A5 (docs/mockups/a5/fx/data/bigships.json → bigships.json here; six kinds: the four of the ships, the
// Company's flagship and the merchant): viewBox 120×78, the bow to the left, the waterline ≈ 71. A port of bigShip of fx3.js:
// the origin of the group is the middle of the waterline.
import BIG from './bigships.json';

export type BigShipKind = keyof typeof BIG;
const R1 = (n: number) => Math.round(n * 10) / 10;

let UID = 0;
/**
 * Unique ids (and the url(#…) to them) for each piece of SVG: uidSvg of fx3.js. Chrome loses the fill of a picture whose
 * gradient has the id of one lying in a hidden block, so every drawing gets its own ids.
 */
export function uidSvg(svg: string, tag = 'u'): string {
  const sfx = `${tag}${++UID}`;
  return svg.replace(/id="([^"]+)"/g, (_, a) => `id="${a}_${sfx}"`).replace(/url\(#([^)]+)\)/g, (_, a) => `url(#${a}_${sfx})`);
}

export const bigShip = (kind: BigShipKind, x: number, y: number, k = 1, flip = false, extra = ''): string => `<g transform="translate(${R1(x)} ${R1(y)}) scale(${flip ? -k : k} ${k})" ${extra}><g transform="translate(-60 -71)">${uidSvg(BIG[kind])}</g></g>`;
