// S1: the windows of the badges and the status chips — their texts come from the rules and the cards, not made up.
import { describe, expect, it } from 'vitest';
import { deckCards } from '../src/engine/data';
import { statuses } from '../src/ui/game/Table';
import { tookPress } from '../src/ui/game/InfoTip';
import { data, newGame } from './helpers';

describe('the windows of the status chips', () => {
  it('«Чёрная метка» explains itself with the text of its card', () => {
    const s = newGame();
    s.turn.marks['М'] = 2;
    const mark = statuses(s, data, s.ships['М']).find((x) => x.label.startsWith('Чёрная метка'))!;
    const card = deckCards(data).find((c) => c.name === 'Чёрная метка')!;
    expect(mark.info).toBe(`Карта «Чёрная метка»: ${card.text.replace(/<[^>]+>/g, '')}`);
    expect(mark.info).toContain('+2 урона');
  });
  it('a chip without a text of its own explains itself with its hint', () => {
    const s = newGame();
    s.ships['Г'].submerged = true;
    const under = statuses(s, data, s.ships['Г']).find((x) => x.label === 'Под водой')!;
    expect(under.info).toBeUndefined();
    expect(under.hint).toContain('нельзя выбрать целью');
  });
});

describe('a press on a badge is not a press on the table', () => {
  it('a badge, a window', () => {
    // an element by the selectors it is inside of (no DOM in the unit tests)
    const at = (...inside: string[]) => ({ target: { closest: (sel: string) => (sel.split(', ').some((x) => inside.includes(x)) ? {} : null) } }) as unknown as Event;
    expect(tookPress(at('[data-info]'))).toBe(true);
    expect(tookPress(at('.info-pop'))).toBe(true);
    expect(tookPress(at('.plank'))).toBe(false);
  });
});
