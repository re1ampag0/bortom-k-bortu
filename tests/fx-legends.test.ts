// L1: the Legends of the reference (docs/mockups/anim/level1/play-legends.js) go through the FX layer: the clip
// «legend» is the entrance of a Legend (not the clip of a card of A4), the seal says «ЛЕГЕНДА • ЛЕГЕНДА •» over the
// circle, the card has the bottom strip of its ship. The pictures and the moments are DOM: e2e/fx-legends.spec.ts.
import { describe, expect, it } from 'vitest';
import { legendCards } from '../src/engine/data';
import { shipData } from '../src/engine/state';
import { PLAY } from '../src/ui/game/fx/FxLayer';
import { LG, legendGeneric, lgCardHTML, sealSVG } from '../src/ui/game/fx/legends';
import { inkOn } from '../src/ui/game/fx/primitives';
import { clipsOf, play } from './fx-scenes';
import { data } from './helpers';

describe('the Legends', () => {
  it('the clip «legend» is the entrance of a Legend, not the clip of a card', () => {
    expect(PLAY.legend).toBeTypeOf('function');
    expect(PLAY.legend!.toString()).toMatch(/legendIntro/);
    expect(PLAY.legend!.toString()).not.toMatch(/playCard/);
  });

  it('the seal: two words with dots around the circle, stretched to 162', () => {
    const svg = sealSVG(1);
    expect(svg).toMatch(/<textPath href="#arc1" textLength="162" lengthAdjust="spacing">ЛЕГЕНДА • ЛЕГЕНДА •<\/textPath>/);
  });

  it('the card of a Legend: its name, its kind and the strip of the ship that played it', () => {
    const html = lgCardHTML(data, 'М-Л', 'М');
    const m = shipData(data, 'М');
    expect(html).toContain('Корабль в бутылке');
    expect(html).toContain('ЛЕГЕНДА · ПРИКАЗ');
    expect(html).toContain(`background:${m.color};color:${inkOn(m.color)}`);
    expect(html).toMatch(/class="fcard-foot"[^>]*>ЛЕГЕНДА · МЕСТЬ</);
  });

  it('the strip is never under 10 px on screen: its font grows when the card is small (a phone)', () => {
    const font = (s: number) => Number(lgCardHTML(data, 'Г-Л', 'Г', s).match(/font-size:([\d.]+)px/)![1]);
    for (const s of [0.82, 1, 1.1, 1.3]) expect(font(s) * s).toBeGreaterThanOrEqual(10);
  });

  it('«Джек ускользает» has its own clip, not the label of A4', () => {
    expect(PLAY.jack).toBeTypeOf('function');
    expect(PLAY.jack!.toString()).toMatch(/legendIntro/);
  });

  it('the effects by the code of the Legend: «Армада», «Кракен», «Корабль в бутылке»; the others — the common one', () => {
    expect(Object.keys(LG).sort()).toEqual(['Г-Л', 'И-Л', 'М-Л']);
    // «Джек ускользает» is a Reaction: its clip comes by the event jackEscaped (kind «jack»), not by its code
    const rest = legendCards(data).map((c) => c.code).filter((c) => !LG[c]);
    expect(rest).toEqual(['Ж-Л']);
    expect(legendGeneric).toBeTypeOf('function');
  });

  const SCENES: [string, string, string | null][] = [['armada', 'И-Л', null], ['kraken', 'Г-Л', 'М'], ['bottle', 'М-Л', 'И']];
  for (const [id, card, target] of SCENES) {
    it(`${id}: every action goes through the layer, one clip «legend» of ${card}`, () => {
      expect(play(id).map((x) => x.route)).toEqual(play(id).map(() => 'fx'));
      const lg = clipsOf(id).filter((c) => c.kind === 'legend');
      expect(lg).toHaveLength(1);
      expect(lg[0]).toMatchObject({ card, target });
    });
  }
  it('kraken: the clip knows the Souls paid and the Souls gained', () => {
    const lg = clipsOf('kraken').find((c) => c.kind === 'legend')!;
    expect(lg).toMatchObject({ soulCost: 3 });
    expect((lg as { souls: number }).souls).toBeGreaterThan(0);
  });
  it('jack: every action goes through the layer, the clip «jack» of «Жемчужина» with its change of places', () => {
    expect(play('jack').map((x) => x.route)).toEqual(play('jack').map(() => 'fx'));
    const jk = clipsOf('jack').filter((c) => c.kind === 'jack');
    expect(jk).toHaveLength(1);
    expect(jk[0]).toMatchObject({ ship: 'Ж' });
    expect(jk[0].events.map((e) => e.type)).toContain('swapped');
  });
});
