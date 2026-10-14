// Cards in the log and the sea cards of «Тиа Дальма» open in full (P3): the sea sheet shows any sea card by its code.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { seaCardByCode } from '../src/engine/state';
import { SeaSheet } from '../src/ui/game/Overlays';
import { data, newGame } from './helpers';

describe('SeaSheet', () => {
  it('shows the sea card asked for, with a link to the current one', () => {
    const s = newGame({ sea: true });
    const current = s.sea!.current!;
    const other = s.sea!.deck[0];
    const html = renderToStaticMarkup(createElement(SeaSheet, { s, data, code: other, onClose: () => {} }));
    expect(html).toContain(`Море: ${seaCardByCode(data, other).name}`);
    expect(html).toContain(`data-sea="${current}"`);
    const now = renderToStaticMarkup(createElement(SeaSheet, { s, data, onClose: () => {} }));
    expect(now).toContain(`Море: ${seaCardByCode(data, current).name}`);
    expect(now).not.toContain('sea-current');
  });
});
