// A5 art v3: the compass of «Вещи на столе» (A9) — the pocket compass of the prototype, fully opaque.
import { describe, expect, it } from 'vitest';
import { tableThings } from '../src/ui/game/art/table';

describe('«Вещи на столе»: the compass', () => {
  const svg = tableThings();
  const compass = svg.slice(svg.indexOf('<g transform="translate(905 600)'));
  it('is the new pocket compass: bow ring, knurled bezel, degrees every 2.5°, 16-point rose, needle on a jewel', () => {
    expect(compass).toContain('url(#cpBez)');
    expect(compass).toContain('url(#cpJewel)');
    expect(compass).toContain('class="pg-needle"');
    expect((compass.match(/<text /g) || []).length).toBe(8 + 4); // 30°…330° without the cardinal ones, and С В Ю З
    expect((compass.match(/stroke="#5e400e" stroke-width=".75"/g) || []).length).toBe(160); // the knurling
    const n = (c: string) => (compass.match(new RegExp(`fill="${c}"`, 'g')) || []).length;
    expect([n('#8a7040'), n('#6e5226'), n('#8a6a2c')]).toEqual([16, 8, 4]); // the rose: 16 + 8 + 4 + the four cardinal rays
  });
  it('is fully opaque (no 82 % any more) and its ids are unique', () => {
    expect(compass).not.toMatch(/opacity[=:]"?\.82/);
    const ids = [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
