// What the interface shows comes from the engine: the Volley preview must equal the real damage (docs/TZ.md,
// «Залп: предпросмотр урона с разбором»), the reasons are the engine's refusals, the log describes every event.
import { describe, expect, it } from 'vitest';
import {
  cardNeeds,
  decider,
  formatTerms,
  hasUsefulMoves,
  playOptions,
  previewReaction,
  previewVolley,
  reactionNow,
  threat,
  threatLine,
  volleyTargets,
} from '../src/engine/hints';
import { describe as describeLog, turnSummary } from '../src/engine/log';
import { revealsInfo } from '../src/engine/match';
import { playGame } from '../src/engine/sim/sim';
import { aliveShips, cardByCode, otherSide, seatShip, type GameState } from '../src/engine/state';
import { act, actDeclining, cardIn, data, turnOf } from './helpers';

/** States of bot games where the active team is free to act. */
function sampleStates(seeds: number, every: number): GameState[] {
  const out: GameState[] = [];
  for (let seed = 1; seed <= seeds; seed++) {
    let i = 0;
    playGame(data, seed, 'standard', (s) => {
      if (!s.pending && !s.winner && i++ % every === 0) out.push(s);
    });
  }
  return out;
}

describe('Volley preview', () => {
  it('a plain Volley: Guns, diagonal, damage, the track after', () => {
    const s = turnOf('ПИРАТЫ');
    const p = previewVolley(s, data, { ship: 'Ж', target: 'Г' });
    if (!p.ok) throw new Error(p.reason);
    const guns = s.ships['Ж'].tracks.guns;
    expect(p.terms).toEqual([{ what: 'Пушки', n: guns, src: { kind: 'guns' } }, { what: 'диагональ', n: -1, src: { kind: 'diag' } }]);
    expect(p.damage).toBe(guns - 1);
    expect(p.diagonal).toBe(true);
    expect(p.change).toMatchObject({ track: 'hull', from: 11, to: 11 - (guns - 1) });
    expect(formatTerms(p.terms)).toBe(`${guns} Пушки − 1 диагональ`);
  });

  it('a refused Volley gives the engine’s reason', () => {
    const s = turnOf('ПИРАТЫ');
    s.teams['ПИРАТЫ'].powder = 0;
    expect(previewVolley(s, data, { ship: 'Ж', target: 'И' })).toMatchObject({ ok: false, reason: expect.stringContaining('Пороха') });
    expect(volleyTargets(s, data, { ship: 'Ж' })).toMatchObject({ targets: [], reason: expect.stringContaining('Пороха') });
  });

  it('in bot games the preview equals the damage the Volley deals when nobody reacts', () => {
    let checked = 0;
    for (const s of sampleStates(15, 5)) {
      for (const ship of aliveShips(s, s.active)) {
        const charges = [undefined, ...ship.hand.filter((c) => cardByCode(data, c).type === 'ЗАРЯД')];
        for (const charge of charges) {
          for (const target of aliveShips(s, otherSide(s.active))) {
            const order = { ship: ship.code, target: target.code, ...(charge ? { charge } : {}) };
            const p = previewVolley(s, data, order);
            if (!p.ok) continue;
            const r = actDeclining(s, { type: 'volley', ...order });
            const hit = r.events.find((e) => e.type === 'hit');
            if (hit?.type !== 'hit') continue;
            expect(hit.damage).toBe(p.damage);
            expect(hit.terms).toEqual(p.terms);
            checked++;
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(200);
  });
});

describe('Reactions in the window', () => {
  it('a reducing Reaction shows the damage before and after', () => {
    let s = turnOf('ПИРАТЫ', { И: ['Двойная обшивка'] });
    s = act(s, { type: 'volley', ship: 'Ж', target: 'И' }).state;
    expect(s.pending).toMatchObject({ kind: 'reactions', waiting: ['И'] });
    const t = threat(s, data)!;
    const guns = s.ships['Ж'].tracks.guns;
    expect(t.title).toBe(`«Жемчужина» стреляет по «Индевору» · ${guns} по Корпусу`);
    const card = cardIn(s, 'И', 'Двойная обшивка');
    expect(previewReaction(s, data, 'И', card)).toEqual({ ok: true, label: `${guns} → ${Math.max(0, guns - 2)}` });
    expect(playOptions(s, data, 'И', card).actions).toEqual([{ type: 'react', seat: 'И', card }]);
  });
});

describe('«What happens now» in the Reaction window (P8)', () => {
  it('the attacker\'s line and the reducing Reaction use the numbers of threat and previewReaction', () => {
    let s = turnOf('ПИРАТЫ', { И: ['Двойная обшивка'] });
    s = act(s, { type: 'volley', ship: 'Ж', target: 'И' }).state;
    const guns = s.ships['Ж'].tracks.guns;
    expect(threatLine(s, data)).toBe(`Залп «Жемчужина» → «Индевор»: ${guns} по Корпусу`);
    const card = cardIn(s, 'И', 'Двойная обшивка');
    expect(reactionNow(s, data, 'И', card)).toEqual({ ok: true, text: `Залп ${guns} → ${Math.max(0, guns - 2)}` });
  });

  it('a cancelling Reaction: «Залп отменён»', () => {
    let s = turnOf('ПИРАТЫ', { Г: ['Уйти на глубину'] });
    s = act(s, { type: 'volley', ship: 'М', target: 'Г' }).state;
    expect(reactionNow(s, data, 'Г', cardIn(s, 'Г', 'Уйти на глубину'))).toEqual({ ok: true, text: 'Залп отменён' });
  });

  it('a covering Reaction: the Volley goes to the ally, with its damage', () => {
    let s = turnOf('ПИРАТЫ', { Г: ['Прикрыть бортом'] });
    s = act(s, { type: 'volley', ship: 'Ж', target: 'И' }).state;
    const card = cardIn(s, 'Г', 'Прикрыть бортом');
    const label = previewReaction(s, data, 'Г', card);
    if (!label.ok) throw new Error(label.reason);
    const damage = label.label.split(' ')[0];
    expect(reactionNow(s, data, 'Г', card)).toEqual({ ok: true, text: `Залп уйдёт в «Голландец»: ${damage} по Корпусу` });
  });

  it('a Reaction that cannot be played: the same reason as previewReaction', () => {
    // «Уйти на глубину» cancels only a Volley at the Dutchman.
    let s = turnOf('ПИРАТЫ', { И: ['Двойная обшивка'], Г: ['Уйти на глубину'] });
    s = act(s, { type: 'volley', ship: 'Ж', target: 'И' }).state;
    const card = cardIn(s, 'Г', 'Уйти на глубину');
    const p = previewReaction(s, data, 'Г', card);
    expect(p.ok).toBe(false);
    expect(reactionNow(s, data, 'Г', card)).toEqual(p);
  });

  it('no window — no line', () => {
    expect(threatLine(turnOf('ПИРАТЫ'), data)).toBeNull();
  });
});

describe('Cards', () => {
  it('a Reaction in your own turn is grey with the reason', () => {
    const s = turnOf('ПИРАТЫ', { Ж: ['Уйти по ветру'] });
    const o = playOptions(s, data, 'Ж', cardIn(s, 'Ж', 'Уйти по ветру'));
    expect(o.actions).toEqual([]);
    expect(o.reason).toContain('в ход противника');
  });

  it('a card with a target gets one action per enemy ship', () => {
    const s = turnOf('ПИРАТЫ', { Ж: ['Бочки с порохом'] });
    const card = cardIn(s, 'Ж', 'Бочки с порохом');
    expect(cardNeeds(s, data, 'Ж', card)).toMatchObject({ target: 'ship', ship: false, cells: 0, regroup: false });
    expect(playOptions(s, data, 'Ж', card).actions.map((a) => (a.type === 'playCard' ? a.target : null)).sort()).toEqual(['Г', 'И']);
  });

  it('a Repair of an undamaged ship cannot be played: the engine says why', () => {
    const s = turnOf('ПИРАТЫ', { Ж: ['Плотник'] });
    const card = cardIn(s, 'Ж', 'Плотник');
    expect(cardNeeds(s, data, 'Ж', card).cells).toBe(2);
    expect(playOptions(s, data, 'Ж', card)).toMatchObject({ actions: [], reason: expect.stringContaining('ничего не сделает') });
  });

  it('«Норрингтон на борту»: the engine names the ally’s ship as the one repaired', () => {
    const s = turnOf('КОМПАНИЯ', { Г: ['Норрингтон на борту'] });
    s.ships['И'].tracks.hull = 10;
    const card = cardIn(s, 'Г', 'Норрингтон на борту');
    expect(cardNeeds(s, data, 'Г', card)).toMatchObject({ cells: 2, repairShip: 'И' });
  });

  it('a Charge is played with a Volley of its ship', () => {
    const s = turnOf('ПИРАТЫ', { Ж: ['Ядра'] });
    const card = cardIn(s, 'Ж', 'Ядра');
    expect(playOptions(s, data, 'Ж', card).actions).toContainEqual({ type: 'volley', ship: 'Ж', target: 'И', charge: card });
  });

  it('useful moves: a fresh turn has a Volley; without Powder and cards there is nothing', () => {
    const s = turnOf('ПИРАТЫ');
    expect(hasUsefulMoves(s, data, 'ПИРАТЫ')).toBe(true);
    s.teams['ПИРАТЫ'].powder = 0;
    for (const x of aliveShips(s, 'ПИРАТЫ')) {
      x.legend = false;
      x.hand = [];
    }
    expect(hasUsefulMoves(s, data, 'ПИРАТЫ')).toBe(false);
  });

  it('decider: the active team, or the seats a decision waits for', () => {
    let s = turnOf('ПИРАТЫ', { И: ['Двойная обшивка'] });
    expect(decider(s)).toEqual({ kind: 'turn', side: 'ПИРАТЫ', seats: ['Ж', 'М'] });
    s = act(s, { type: 'volley', ship: 'Ж', target: 'И' }).state;
    expect(decider(s)).toEqual({ kind: 'reactions', side: 'КОМПАНИЯ', seats: ['И'] });
  });
});

describe('Log', () => {
  it('a hit is one line with its addends and the track before and after', () => {
    const s = turnOf('ПИРАТЫ');
    const r = actDeclining(s, { type: 'volley', ship: 'Ж', target: 'И' });
    const lines = describeLog(data, s, { type: 'volley', ship: 'Ж', target: 'И' }, r.events, 0).map((l) => l.text);
    const guns = s.ships['Ж'].tracks.guns;
    expect(lines).toContain(`«Жемчужина»: Залп по «Индевору» — ${guns} по Корпусу.`);
    expect(lines).toContain(`Попадание по «Индевору»: ${guns} Пушки = ${guns} по Корпусу. Корпус 12 → ${12 - guns}.`);
  });

  it('turn summary: Hold, Fires and the draw in one line', () => {
    let s = turnOf('ПИРАТЫ');
    s.ships['И'].fires = 1;
    s.teams['КОМПАНИЯ'].powder = 2;
    const r = act(s, { type: 'endTurn', side: 'ПИРАТЫ' });
    s = r.state;
    const sum = turnSummary(data, r.events)!;
    expect(sum.side).toBe('КОМПАНИЯ');
    expect(sum.text).toMatch(/^\+3 Пороха, Пожар: −1 Корпус «Индевор»/);
  });
});

describe('Undo: new information', () => {
  it('selling reveals nothing; a draw, the end of the turn and an enemy decision do', () => {
    const s = turnOf('ПИРАТЫ', { Ж: ['Ядра', 'Гиббс за штурвалом'], И: ['Двойная обшивка'] });
    const sell = act(s, { type: 'sell', seat: 'Ж', card: cardIn(s, 'Ж', 'Ядра') });
    expect(revealsInfo(s, sell.state, sell.events, 'ПИРАТЫ')).toBeNull();
    const end = act(s, { type: 'endTurn', side: 'ПИРАТЫ' });
    expect(revealsInfo(s, end.state, end.events, 'ПИРАТЫ')).toBe('ход окончен');
    const v = act(s, { type: 'volley', ship: 'Ж', target: 'И' });
    expect(revealsInfo(s, v.state, v.events, 'ПИРАТЫ')).toBe('противник решает, ответить ли Реакцией');
    expect(seatShip(s, 'Ж')?.code).toBe('Ж');
  });
});
