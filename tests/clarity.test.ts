// P8 «понятно с первого раза»: the attacker's plate while the enemy decides on a Reaction, the Reaction window with
// the full card text and «what happens now» without «Подсказки».
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { reactionNow, threatLine } from '../src/engine/hints';
import { reactionWait } from '../src/ui/game/clarity';
import { alarmInfo } from '../src/ui/game/alarm';
import { ReactionSheet } from '../src/ui/game/Alarm';
import { loadSettings, storeSettings } from '../src/ui/storage';
import { act, cardIn, data, turnOf } from './helpers';

describe('the attacker waits for a Reaction', () => {
  const fired = () => act(turnOf('ПИРАТЫ', { И: ['Двойная обшивка'] }), { type: 'volley', ship: 'Ж', target: 'И' }).state;

  it('against bots: the Volley in words, the team decides, «бот думает»', () => {
    const s = fired();
    const guns = s.ships['Ж'].tracks.guns;
    expect(reactionWait(s, data, 'КОМПАНИЯ', [{ bot: true, name: null }])).toEqual({
      line: `Залп «Жемчужина» → «Индевор»: ${guns} по Корпусу. Компания решает, ответить ли Реакцией…`,
      who: 'Бот думает…',
    });
  });

  it('by network: the people by name, a bot of the team as «бот»', () => {
    const s = fired();
    expect(reactionWait(s, data, 'КОМПАНИЯ', [{ bot: false, name: 'Боря' }, { bot: false, name: 'Боря' }]).who).toBe('Решает: Боря');
    expect(reactionWait(s, data, 'КОМПАНИЯ', [{ bot: false, name: 'Боря' }, { bot: true, name: null }]).who).toBe('Решают: Боря и бот');
    expect(reactionWait(s, data, 'КОМПАНИЯ', [{ bot: false, name: 'Боря' }, { bot: false, name: 'Вера' }]).who).toBe('Решают: Боря, Вера');
  });

  it('the Pirates «решают»', () => {
    const s = act(turnOf('КОМПАНИЯ', { Ж: ['Уйти по ветру'] }), { type: 'volley', ship: 'И', target: 'Ж' }).state;
    expect(s.pending).toMatchObject({ kind: 'reactions' });
    expect(reactionWait(s, data, 'ПИРАТЫ', [{ bot: true, name: null }]).line).toBe(`${threatLine(s, data)}. Пираты решают, ответить ли Реакцией…`);
  });

  it('nothing about which ship holds a Reaction: the same words whichever ship decides', () => {
    const a = fired();
    const b = act(turnOf('ПИРАТЫ', { Г: ['Прикрыть бортом'] }), { type: 'volley', ship: 'Ж', target: 'И' }).state;
    expect(a.pending).toMatchObject({ waiting: ['И'] });
    expect(b.pending).toMatchObject({ waiting: ['Г'] });
    const bot = [{ bot: true, name: null }];
    expect(reactionWait(a, data, 'КОМПАНИЯ', bot)).toEqual(reactionWait(b, data, 'КОМПАНИЯ', bot));
  });
});

describe('the Reaction window without «Подсказки»', () => {
  // The sheet of a phone: the Reactions as cards. «What happens now» comes from the engine under the card, «i» opens the card.
  const window = (memo: boolean, hints = false) => {
    const s = act(turnOf('ПИРАТЫ', { И: ['Двойная обшивка'] }), { type: 'volley', ship: 'Ж', target: 'И' }).state;
    const card = cardIn(s, 'И', 'Двойная обшивка');
    const info = alarmInfo(s, data)!;
    const html = renderToStaticMarkup(
      createElement(ReactionSheet, {
        s,
        data,
        seats: ['И'],
        hints,
        memo,
        pick: null,
        folded: false,
        fuse: null,
        alarmOf: (seat: string, code: string) => (code === card ? { kind: 'ok' as const } : seat ? { kind: 'dim' as const } : null),
        onPick: () => {},
        onAct: () => {},
        onInfo: () => {},
        onFold: () => {},
      }),
    );
    return { s, card, html, info };
  };
  const text = (html: string) => html.replace(/<[^>]+>/g, '');

  it('each Reaction: «what happens now» from the engine, «i»', () => {
    const { s, card, html } = window(false);
    const now = reactionNow(s, data, 'И', card);
    if (!now.ok) throw new Error(now.reason);
    expect(now.text).toMatch(/^Залп \d+ → \d+$/);
    expect(html).toContain(`<b class="ro-effect as-now">${now.text}</b>`);
    expect(html).toContain('data-testid="reaction-info"');
    expect(html).not.toContain('reaction-memo');
  });

  it('under «Подсказки» the strip of the card says it, the line under the card does not repeat it', () => {
    expect(window(false, true).html).not.toContain('as-now');
  });

  it('the note on what a Reaction is, in the first window', () => {
    expect(text(window(true).html)).toContain('Реакция — карта, которую играют в ход противника в ответ на его Залп. Можно пропустить.');
  });
});

describe('«Быстрый конец хода» in the settings', () => {
  afterEach(() => vi.unstubAllGlobals());
  const storageWith = (text: string | null) => {
    const box = { text };
    vi.stubGlobal('localStorage', {
      getItem: () => box.text,
      setItem: (_: string, v: string) => (box.text = v),
      removeItem: () => (box.text = null),
    });
    return box;
  };

  it('off by default; an old record without it is read with it off', () => {
    storageWith(null);
    expect(loadSettings().fastEnd).toBe(false);
    storageWith(JSON.stringify({ speed: 'slow', effects: 'simple', hints: true, sound: true }));
    expect(loadSettings()).toEqual({ speed: 'slow', effects: 'simple', hints: true, sound: true, fastEnd: false, tapSkip: false, view: { guns: 'icons', hand: 'deck', frame: 'bulwark' } });
  });

  it('«Вид стола»: the first variant of each switch by default; the old «brass|wood» frame is read as the default', () => {
    storageWith(JSON.stringify({ seaFrame: 'wood' }));
    expect(loadSettings().view).toEqual({ guns: 'icons', hand: 'deck', frame: 'bulwark' });
    storageWith(JSON.stringify({ seaFrame: 'brass', view: { guns: 'ports', hand: 'table', frame: 'brass' } }));
    expect(loadSettings().view).toEqual({ guns: 'ports', hand: 'table', frame: 'brass' });
    expect(loadSettings()).not.toHaveProperty('seaFrame');
    storageWith(JSON.stringify({ view: { guns: 'x', frame: 5 } }));
    expect(loadSettings().view).toEqual({ guns: 'icons', hand: 'deck', frame: 'bulwark' });
  });

  it('is kept like the other settings', () => {
    const box = storageWith(JSON.stringify({ speed: 'fast' }));
    storeSettings({ ...loadSettings(), fastEnd: true });
    expect(JSON.parse(box.text!)).toMatchObject({ speed: 'fast', fastEnd: true });
    expect(loadSettings().fastEnd).toBe(true);
  });
});
