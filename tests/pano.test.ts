// V7: the panorama of the victory sheet (src/ui/game/art/pano.ts) and the medal (art/medal.ts).
import { describe, expect, it } from 'vitest';
import { medalSvg } from '../src/ui/game/art/medal';
import { panoCast, panoSvg, PHONE, WIDE } from '../src/ui/game/art/pano';

const SIDE: Record<string, string> = { Ж: 'ПИРАТЫ', М: 'ПИРАТЫ', И: 'КОМПАНИЯ', Г: 'КОМПАНИЯ' };
const ORDER = ['Ж', 'М', 'И', 'Г'];
const cast = (sunk: string[], winner: string) => panoCast(ORDER, (c) => SIDE[c], (c) => sunk.includes(c), winner);
const ids = (svg: string) => [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
const refs = (svg: string) => [...svg.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]);
const afloat = (svg: string) => [...svg.matchAll(/data-pano-afloat="([^"]+)"/g)].map((m) => m[1]);
const sunkIn = (svg: string) => [...svg.matchAll(/data-pano-sunk="([^"]+)"/g)].map((m) => m[1]);

describe('panoCast: who stands where', () => {
  it('the winners afloat at the places of the winners, every sunk ship at the places of the sinking', () => {
    expect(cast(['И', 'Г'], 'ПИРАТЫ')).toEqual({ afloat: ['Ж', 'М'], sunk: ['И', 'Г'] });
    // a winner that sank goes down with the others
    expect(cast(['Ж', 'И', 'Г'], 'ПИРАТЫ')).toEqual({ afloat: ['М'], sunk: ['Ж', 'И', 'Г'] });
    expect(cast(['Ж', 'М'], 'КОМПАНИЯ')).toEqual({ afloat: ['И', 'Г'], sunk: ['Ж', 'М'] });
  });
  it('a draw without sunk ships: all the ships afloat at the places of the winners', () => {
    expect(cast([], 'НИЧЬЯ')).toEqual({ afloat: ORDER, sunk: [] });
    expect(cast(['М'], 'НИЧЬЯ')).toEqual({ afloat: ['Ж', 'И', 'Г'], sunk: ['М'] });
  });
});

describe('panoSvg', () => {
  it('the victory of the Pirates and of the Company give other ships (the picture changes)', () => {
    const p = panoSvg(WIDE, cast(['И', 'Г'], 'ПИРАТЫ'));
    const c = panoSvg(WIDE, cast(['Ж', 'М'], 'КОМПАНИЯ'));
    expect(afloat(p)).toEqual(['Ж', 'М']);
    expect(sunkIn(p)).toEqual(['И', 'Г']);
    expect(afloat(c)).toEqual(['И', 'Г']);
    expect(sunkIn(c)).toEqual(['Ж', 'М']);
  });

  it('every count of ships (1–4 afloat, 0–3 sunk) on both layouts: a viewBox, places for all, no NaN', () => {
    for (const L of [WIDE, PHONE]) {
      for (const [sunk, winner] of [[[], 'НИЧЬЯ'], [['И'], 'ПИРАТЫ'], [['И', 'Г'], 'ПИРАТЫ'], [['Ж', 'И', 'Г'], 'ПИРАТЫ'], [['М', 'И', 'Г'], 'ПИРАТЫ']] as [string[], string][]) {
        const k = cast(sunk, winner);
        const svg = panoSvg(L, k);
        expect(svg.startsWith(`<svg class="pano-svg" viewBox="0 0 ${L.W} ${L.H}"`)).toBe(true);
        expect(afloat(svg)).toEqual(k.afloat);
        expect(sunkIn(svg)).toEqual(k.sunk);
        expect(svg).not.toMatch(/NaN|undefined/);
      }
    }
  });

  it('the ids are unique in a picture and between two pictures; every url(#…) has its id', () => {
    const a = panoSvg(WIDE, cast(['И', 'Г'], 'ПИРАТЫ'));
    const b = panoSvg(PHONE, cast(['И', 'Г'], 'ПИРАТЫ'));
    const all = [...ids(a), ...ids(b)];
    expect(new Set(all).size).toBe(all.length);
    for (const svg of [a, b]) {
      const own = new Set(ids(svg));
      for (const r of refs(svg)) expect(own.has(r)).toBe(true);
    }
  });

  it('the medal: unique ids for each one', () => {
    const all = [...ids(medalSvg()), ...ids(medalSvg(48))];
    expect(new Set(all).size).toBe(all.length);
    expect(medalSvg(48)).toContain('width="48"');
  });
});
