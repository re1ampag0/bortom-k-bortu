// Cards in the log and the sea cards of «Тиа Дальма» open in full (P3): the sea sheet shows any sea card by its code.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { applyAction } from '../src/engine/engine';
import { describe as describeLog, type LogLine } from '../src/engine/log';
import { cardByCode, seaCardByCode, type Action } from '../src/engine/state';
import { LogList, logIcon, logParts, SeaSheet } from '../src/ui/game/Overlays';
import { ChoicePanel } from '../src/ui/game/Panels';
import { deckCards } from '../src/engine/data';
import { cardIn, codesOf, data, newGame, turnOf } from './helpers';

const line = (text: string, cards: string[], sea?: string): LogLine => ({ text, kind: 'action', round: 1, turn: 'ПИРАТЫ', action: 0, cards, ...(sea ? { sea } : {}) });
const list = (log: LogLine[]) => renderToStaticMarkup(createElement(LogList, { data, log, fresh: 99, onCard: () => {}, onSea: () => {} }));
/** The text of the markup without tags and with the quotes React escapes back. */
const plain = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&');

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

describe('the log: card names are links', () => {
  it('the name of a played card is a button that opens it; the text stays the same', () => {
    const s = turnOf('ПИРАТЫ', { Ж: ['Ядра'] });
    const card = cardIn(s, 'Ж', 'Ядра');
    const l = line('«Жемчужина»: «Ядра».', [card]);
    const html = list([l]);
    expect(html).toContain(`<button class="cref" data-card="${card}">«Ядра»</button>`);
    expect(plain(html)).toBe(l.text);
  });

  it('«Колокол «Голландца»» with the quotes inside is found whole', () => {
    const s = turnOf('КОМПАНИЯ', { Г: ['Колокол «Голландца»'], Ж: ['Ядра', 'Книппели'], М: ['Брандер'] });
    const bell = cardIn(s, 'Г', 'Колокол «Голландца»');
    const action: Action = { type: 'playCard', seat: 'Г', card: bell };
    const r = applyAction(s, action, data);
    const log = describeLog(data, s, action, r.events, 0);
    const l = log.find((x) => x.cards.includes(bell))!;
    const html = list([l]);
    expect(html).toContain(`<button class="cref" data-card="${bell}">«Колокол «Голландца»»</button>`);
    expect(plain(html)).toBe(l.text);
    expect(plain(list(log))).toBe([...log].reverse().map((x) => x.text).join(''));
  });

  it('two copies of a card in one line are found in their places', () => {
    const [a, b] = codesOf('И', 'Ядра');
    const l = line('Кости лжеца: «Индевор» «Ядра», «Индевор» «Ядра» — ничья.', [a, b]);
    expect(logParts(data, l)).toEqual(['Кости лжеца: «Индевор» ', { card: a, text: '«Ядра»' }, ', «Индевор» ', { card: b, text: '«Ядра»' }, ' — ничья.']);
  });

  it('a card not named in the text stays plain text', () => {
    const [a] = codesOf('Ж', 'Ядра');
    expect(logParts(data, line('«Жемчужина» добирает 2 карты.', [a]))).toEqual(['«Жемчужина» добирает 2 карты.']);
  });

  it('the sea card of the line is a button that opens the sea sheet', () => {
    const s = newGame({ sea: true });
    const sea = s.sea!.current!;
    const card = seaCardByCode(data, sea);
    const l = line(`Море: ${card.name} (${card.when.toLowerCase()}) — ${card.big}`, [], sea);
    const html = list([l]);
    expect(html).toContain(`<button class="cref" data-sea="${sea}">${card.name}</button>`);
    expect(plain(html)).toBe(l.text);
  });

  it('a legend is a link too', () => {
    const l = line(`«Жемчужина»: Легенда «${cardByCode(data, 'Ж-Л').name}».`, ['Ж-Л']);
    expect(list([l])).toContain('data-card="Ж-Л"');
  });
});

describe('«Тиа Дальма»: sea mini cards with «i»', () => {
  it('each of the three sea cards shows its name and effect, is pressed to order and has «i»', () => {
    const s0 = turnOf('ПИРАТЫ', { Ж: ['Тиа Дальма'] }, { sea: true });
    const s = applyAction(s0, { type: 'playCard', seat: 'Ж', card: cardIn(s0, 'Ж', 'Тиа Дальма') }, data).state;
    const top = s.sea!.deck.slice(0, 3);
    const html = renderToStaticMarkup(createElement(ChoicePanel, { s, data, seat: 'Ж', onAct: () => {}, onSea: () => {} }));
    expect(html.match(/class="sopt /g)).toHaveLength(3);
    for (const code of top) {
      const sea = seaCardByCode(data, code);
      expect(html).toContain(`data-opt="${code}"`);
      expect(html).toContain(`<div class="n">${sea.name}</div>`);
      expect(html).toContain(`<div class="e">${sea.big}</div>`);
      expect(html).toContain(`<button class="info" data-sea="${code}" aria-label="Карта «${sea.name}» целиком">i</button>`);
    }
    expect(html).toContain('<svg');
  });

  it('the sea sheet links the next sea cards known after «Тиа Дальма»', () => {
    const s = newGame({ sea: true });
    const top = s.sea!.deck.slice(0, 2);
    s.sea!.peek = { seat: 'Ж', n: 2 };
    const html = renderToStaticMarkup(createElement(SeaSheet, { s, data, onClose: () => {} }));
    for (const code of top) expect(html).toContain(`<button class="cref" data-sea="${code}">«${seaCardByCode(data, code).name}»</button>`);
  });
});

describe('«Судовой журнал» (A5): the icon of a line, «— Раунд II —»', () => {
  it('the icon goes by what the line is: a Volley, a Reaction, a Legend, another card, the sea, Powder, the rest', () => {
    const s = turnOf('ПИРАТЫ', { Ж: ['Ядра'] });
    const card = cardIn(s, 'Ж', 'Ядра');
    expect(logIcon(data, line('«Жемчужина»: Залп по «Голландцу» — 2 по Корпусу.', []))).toBe('volley');
    expect(logIcon(data, line('Попадание по «Голландцу»: 2 = 2 по Корпусу.', []))).toBe('volley');
    expect(logIcon(data, line('«Жемчужина»: «Ядра».', [card]))).toBe('card');
    expect(logIcon(data, line('«Жемчужина»: Легенда «Джек ускользает».', ['Ж-Л']))).toBe('legend');
    const s2 = newGame({ sea: true });
    expect(logIcon(data, line('Море: x', [], s2.sea!.current!))).toBe('sea');
    expect(logIcon(data, line('Пираты: +2 Пороха (Трюм) → 2.', []))).toBe('powder');
    expect(logIcon(data, line('«Месть» добирает 5 карт.', []))).toBe('other');
  });
  it('a Reaction card gets the shield', () => {
    const code = deckCards(data, 'М').find((c) => c.type === 'РЕАКЦИЯ')!.code;
    expect(logIcon(data, line(`«Месть»: Реакция «${cardByCode(data, code).name}».`, [code]))).toBe('reaction');
  });
  it('the line of a new round is a separator with the roman number; the text of other lines stays', () => {
    const html = list([{ text: 'Раунд 2.', kind: 'round', round: 2, turn: 'ПИРАТЫ', action: 0, cards: [] }]);
    expect(html).toContain('log-sep');
    expect(plain(html)).toBe('— Раунд II —');
  });
});
