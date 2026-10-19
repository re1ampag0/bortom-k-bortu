// A5 art v3: every drawing of a detailed ship gets ids of its own (a gradient of a hidden copy would take the fill of the others).
import { describe, expect, it } from 'vitest';
import { bigShip, type BigShipKind } from '../src/ui/game/art/bigShips';
import { shipSvg } from '../src/ui/game/art/ships';
import { CELLS, cellUrl } from '../src/ui/game/art/cells';

const ids = (svg: string) => [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
const refs = (svg: string) => [...svg.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]);
const KINDS: BigShipKind[] = ['pearl', 'revenge', 'endeavour', 'dutch', 'company', 'merchant'];

describe('bigShip: six kinds, ids unique for each call', () => {
  it('has the six ships of v3', () => {
    for (const k of KINDS) expect(bigShip(k, 0, 0)).toContain('<g transform="translate(-60 -71)">');
  });
  it('two calls of one kind share no id, and every url(#…) finds its id', () => {
    for (const k of KINDS) {
      const a = bigShip(k, 0, 0), b = bigShip(k, 10, 10, 0.5, true);
      const ia = ids(a), ib = ids(b);
      expect(ia.length, k).toBeGreaterThan(0);
      expect(ia.filter((x) => ib.includes(x)), k).toEqual([]);
      expect(new Set(ia).size).toBe(ia.length);
      for (const r of refs(a)) expect(ia, `${k} ${r}`).toContain(r);
    }
  });
});

describe('shipSvg: the badges of the plank heads', () => {
  it('draws each ship of the four with its own ids; the same tag gives the same markup', () => {
    const all = ['Ж', 'М', 'И', 'Г'].map((c) => shipSvg(c, 58, 28, `t-${c}`));
    for (const s of all) expect(s).toContain('viewBox="-2 -1 124 80"');
    const flat = all.flatMap(ids);
    expect(new Set(flat).size).toBe(flat.length);
    expect(shipSvg('Ж', 58, 28, 't-Ж')).toBe(all[0]);
    expect(shipSvg('Ж', 58, 28, 'other')).not.toBe(all[0]);
  });
});

describe('the Hull icons of v3', () => {
  it('HULL is a board without a gradient, HULL_X has the iron bands and the torn hole', () => {
    expect(CELLS.HULL).not.toContain('Gradient');
    expect(CELLS.HULL_X).not.toBe(CELLS.HULL);
    expect(cellUrl('HULL')).toMatch(/^url\("data:image\/svg\+xml,/);
  });
});
