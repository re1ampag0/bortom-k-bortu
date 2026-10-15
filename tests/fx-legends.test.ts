// L1: the Legends of the reference (docs/mockups/anim/level1/play-legends.js) go through the FX layer: the clip
// «legend» is the entrance of a Legend (not the clip of a card of A4), the seal says «ЛЕГЕНДА • ЛЕГЕНДА •» over the
// circle, the card has the bottom strip of its ship. The pictures and the moments are DOM: e2e/fx-legends.spec.ts.
import { describe, expect, it } from 'vitest';
import { shipData } from '../src/engine/state';
import { PLAY } from '../src/ui/game/fx/FxLayer';
import { lgCardHTML, sealSVG } from '../src/ui/game/fx/legends';
import { inkOn } from '../src/ui/game/fx/primitives';
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
});
