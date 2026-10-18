// P2: while a target is chosen the whole plank is the button (the head too); «i» opens the ship card; the star and
// the Legend badge are a part of the target. Outside the choice the plank is as before.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Plank, type Plate } from '../src/ui/game/Table';
import { data, turnOf } from './helpers';

function plank(plate: Plate | null): string {
  const s = turnOf('ПИРАТЫ');
  const noop = () => {};
  return renderToStaticMarkup(
    createElement(Plank, {
      s,
      data,
      ship: s.ships['Г'],
      own: false,
      selected: false,
      awaiting: false,
      targeted: !!plate?.chosen,
      shooter: false,
      plate,
      buttons: [],
      role: null,
      onSelect: noop,
      onDetails: noop,
      onLegend: noop,
    }),
  );
}

/** The opening tag of the element with this attribute. */
function tag(html: string, attr: string): string {
  return html.match(new RegExp(`<[^>]*${attr}[^>]*>`))?.[0] ?? '';
}

describe('Plank as a target', () => {
  it('outside the choice: plank-<code>, no role, no «i», the star is a button of its own', () => {
    const html = plank(null);
    const section = tag(html, 'data-ship="Г"');
    expect(section).toContain('data-testid="plank-Г"');
    expect(section).not.toContain('role=');
    expect(section).not.toMatch(/aimable|chosen/);
    expect(html).not.toContain('ship-info-Г');
    expect(tag(html, 'data-testid="star-Г"')).not.toContain('tabindex');
    expect(html).toContain('title="Подробнее о корабле"');
  });

  it('a target: plate-<code> on the plank, a button with its name, «i» in the head, the star out of the tab order', () => {
    const html = plank({ tip: null, chosen: false, onClick: () => {} });
    const section = tag(html, 'data-ship="Г"');
    expect(section).toContain('data-testid="plate-Г"');
    expect(section).toContain('role="button"');
    expect(section).toContain('tabindex="0"');
    expect(section).toContain('aria-label="Цель: «Голландец»"');
    expect(section).toMatch(/class="plank [^"]*aimable/);
    expect(html).toMatch(/<header class="plank-head">.*data-testid="ship-info-Г".*<\/header>/s);
    expect(tag(html, 'data-testid="star-Г"')).toContain('tabindex="-1"');
    expect(tag(html, 'class="legend-medal')).toContain('tabindex="-1"');
    // not chosen yet: no seal «Под огнём»
    expect(html).not.toContain('class="target-seal"');
  });

  it('the chosen target: «chosen» instead of «aimable», the seal «Под огнём» in the head (A5, in place of the reticle)', () => {
    const html = plank({ tip: null, chosen: true, onClick: () => {} });
    expect(html).toMatch(/<header class="plank-head">.*<span class="target-seal" data-testid="target-seal-Г" title="Под огнём"><svg.*<\/header>/s);
    expect(html).not.toContain('reticle');
    const section = tag(html, 'data-ship="Г"');
    expect(section).toMatch(/class="plank [^"]*chosen/);
    expect(section).not.toContain('aimable');
    expect(section).toContain('aria-pressed="true"');
  });

  it('«Подсказки»: the damage as a tag in the corner and in the name of the target; without — only the frame', () => {
    const html = plank({ tip: '2 напротив', chosen: false, onClick: () => {} });
    expect(html).toMatch(/<span class="aim-tip" data-testid="aim-tip-Г"[^>]*>2 напротив<\/span>/);
    expect(tag(html, 'data-ship="Г"')).toContain('aria-label="Цель: «Голландец», 2 напротив"');
    expect(plank({ tip: null, chosen: false, onClick: () => {} })).not.toContain('aim-tip');
  });
});
