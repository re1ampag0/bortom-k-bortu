// P8 «понятно с первого раза»: the attacker's plate while the enemy decides on a Reaction, the Reaction window with
// the full card text and «what happens now» without «Подсказки».
import { describe, expect, it } from 'vitest';
import { threatLine } from '../src/engine/hints';
import { reactionWait } from '../src/ui/game/clarity';
import { act, data, turnOf } from './helpers';

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
