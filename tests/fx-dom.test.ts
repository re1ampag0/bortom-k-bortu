// A2: the DOM contract the animation layer finds the table by (docs/mockups/anim/level1/PORTING.md, section 3).
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { startValue } from '../src/engine/state';
import type { Track } from '../src/engine/types';
import { HIDDEN } from '../src/engine/view';
import { Hand } from '../src/ui/game/Hand';
import { Plank, StatusBar, TeamRow, type Plate } from '../src/ui/game/Table';
import { data, turnOf } from './helpers';

const TRACKS: Track[] = ['hull', 'sails', 'guns', 'crew'];
const noop = () => {};
const s = turnOf('ПИРАТЫ');

function plank(code: string, plate: Plate | null = null): string {
  return renderToStaticMarkup(
    createElement(Plank, {
      s,
      data,
      ship: s.ships[code],
      own: s.ships[code].side === 'ПИРАТЫ',
      selected: false,
      awaiting: false,
      targeted: false,
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

const count = (html: string, re: RegExp) => html.match(re)?.length ?? 0;

describe('data-fx-* DOM contract', () => {
  for (const code of Object.keys(s.ships)) {
    for (const target of [false, true]) {
      it(`plank ${code}${target ? ' as a target' : ''}: data-fx-ship and 4 tracks with their numbers`, () => {
        const html = plank(code, target ? { tip: null, chosen: false, onClick: noop } : null);
        expect(html).toMatch(new RegExp(`<section[^>]*data-fx-ship="${code}"`));
        expect(count(html, /data-fx-track="/g)).toBe(4);
        for (const t of TRACKS) {
          const v = s.ships[code].tracks[t];
          const max = startValue(data, code, t);
          // One text node «v/max»: the effects read and write it whole.
          expect(html).toMatch(new RegExp(`data-fx-track="${t}".*?<b class="track-num[^"]*" data-fx-value="[^"]*">${v}/${max}</b>`));
        }
        expect(html).toContain('data-fx-legend');
      });
    }
  }

  it('the Hold: data-fx-hold with a keg per cell of the cap', () => {
    const html = renderToStaticMarkup(createElement(TeamRow, { side: 'КОМПАНИЯ', s, data, hands: null, regroup: null, hint: null }));
    expect(html).toContain('data-fx-hold="КОМПАНИЯ"');
    expect(count(html, /data-fx-keg/g)).toBe(data.econ.cap);
  });

  it('the hand: data-fx-card on every card (a hidden one too) and data-fx-deck', () => {
    const seat = 'Ж';
    const ship = s.ships[seat];
    const hidden = { ...s, ships: { ...s.ships, [seat]: { ...ship, hand: [...ship.hand, HIDDEN] } } };
    const html = renderToStaticMarkup(
      createElement(Hand, {
        s: hidden,
        data,
        seat,
        tabs: [],
        onTab: noop,
        offOf: () => null,
        chosen: null,
        noteOf: () => undefined,
        onCard: noop,
        onDiscard: noop,
        label: '',
      }),
    );
    for (const code of ship.hand) expect(html).toContain(`data-fx-card="${code}"`);
    expect(html).toContain(`data-fx-card="${HIDDEN}"`);
    expect(html).toContain('data-fx-deck');
  });

  it('the status bar: data-fx-instruction and data-fx-sea-chip', () => {
    const html = renderToStaticMarkup(createElement(StatusBar, { s, data, instruction: 'x', waiting: false, onSea: noop, extra: null }));
    expect(html).toContain('data-fx-instruction');
    if (s.sea?.current) expect(html).toContain('data-fx-sea-chip');
  });
});
