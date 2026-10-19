// The detailed ships of A5 (docs/mockups/a5/fx/data/bigships.json → bigships.json here): viewBox 120×78, the bow to the
// left, the waterline ≈ 71. A port of bigShip of fx3.js: the origin of the group is the middle of the waterline.
import BIG from './bigships.json';

export type BigShipKind = keyof typeof BIG;
const R1 = (n: number) => Math.round(n * 10) / 10;

export const bigShip = (kind: BigShipKind, x: number, y: number, k = 1, flip = false, extra = ''): string => `<g transform="translate(${R1(x)} ${R1(y)}) scale(${flip ? -k : k} ${k})" ${extra}><g transform="translate(-60 -71)">${BIG[kind]}</g></g>`;
