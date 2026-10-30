import { describe, expect, it } from 'vitest';
import raw from './fixtures/game-data.v0.3.json';
import { DataError, deckCards, legendCards, loadGameData, seaCards } from '../src/engine/data';

const clone = (): any => structuredClone(raw);

function problemsOf(data: unknown): string[] {
  try {
    loadGameData(data);
  } catch (e) {
    expect(e).toBeInstanceOf(DataError);
    return (e as DataError).problems;
  }
  throw new Error('loadGameData accepted invalid data');
}

describe('game-data.json v0.3', () => {
  const data = loadGameData(raw);

  it('loads without errors', () => {
    expect(data.version).toBe('0.3');
  });

  it('has 117 cards: 4 decks of 24, 4 Legends, 17 sea cards', () => {
    const deck = deckCards(data);
    expect(deck).toHaveLength(96);
    for (const ship of data.ships) expect(deckCards(data, ship.code)).toHaveLength(24);
    expect(legendCards(data)).toHaveLength(4);
    expect(seaCards(data)).toHaveLength(17);
    expect(deck.length + legendCards(data).length + seaCards(data).length).toBe(117);
  });

  it('has the four ships with stats from the boards', () => {
    const stats = Object.fromEntries(
      data.ships.map((s) => [s.code, [s.side, s.hull, s.sails, s.guns, s.crew]]),
    );
    expect(stats).toEqual({
      Ж: ['ПИРАТЫ', 9, 3, 2, 3],
      М: ['ПИРАТЫ', 11, 2, 3, 3],
      И: ['КОМПАНИЯ', 12, 1, 3, 2],
      Г: ['КОМПАНИЯ', 11, 3, 2, 3],
    });
    const dutchman = data.ships.find((s) => s.code === 'Г')!;
    expect([dutchman.souls, dutchman.start_souls]).toEqual([5, 1]);
  });

  it('names every ship in the dative and the genitive', () => {
    expect(Object.fromEntries(data.ships.map((s) => [s.code, [s.nick, s.nickDative, s.nickGenitive]]))).toEqual({
      Ж: ['Жемчужина', 'Жемчужине', 'Жемчужины'],
      М: ['Месть', 'Мести', 'Мести'],
      И: ['Индевор', 'Индевору', 'Индевора'],
      Г: ['Голландец', 'Голландцу', 'Голландца'],
    });
  });

  it('has the economy of v0.3', () => {
    expect(data.econ).toEqual({ income: 3, first_income: 2, cap: 8, second_start: 4 });
  });

  it('gives every ship the default Volley parameters of v0.3', () => {
    for (const ship of data.ships) {
      expect(ship.volleyCost).toBe(1);
      expect(ship.diagDamage).toEqual({ offset: -1 });
      expect(ship.defaultTrack).toBe('hull');
      expect(ship.volleysPerTurn).toBe(1);
      expect(ship.volleyModes).toEqual([]);
    }
  });

  it('fills missing Volley parameters with the defaults', () => {
    const d = clone();
    for (const s of d.ships) {
      delete s.volleyCost;
      delete s.diagDamage;
      delete s.defaultTrack;
      delete s.volleysPerTurn;
      delete s.volleyModes;
    }
    const loaded = loadGameData(d);
    expect(loaded.ships.map((s) => s.volleyCost)).toEqual([1, 1, 1, 1]);
    expect(loaded.ships[0].diagDamage).toEqual({ offset: -1 });
  });

  it('has the rule numbers of v0.3', () => {
    expect(data.rules).toEqual({
      hand: 5,
      maxRounds: 30,
      maxFires: 3,
      sellGain: 1,
      regroupCost: 1,
      jointBonus: 1,
      firstGameSecondStart: 3,
      paidChargeMax: 3,
      jackHull: 2,
      plansMax: 2,
      treasuryCost: 2,
      treasuryPlays: 1,
      swordCost: 1,
      heartCrewLoss: 1,
      surfaceBonus: 1,
      soulsGain: 1,
      seaStorm: 1,
      seaClear: 1,
      seaWave: 1,
      seaMoon: 1,
      seaFleet: 1,
      seaReefs: 1,
      seaCaravan: 2,
      seaThunder: 2,
      seaTortuga: 2,
      seaMermaidsMin: 3,
      seaMermaids: 1,
      seaRum: 1,
      seaWetDivisor: 2,
    });
  });

  it('fills missing rule numbers with the defaults', () => {
    const d = clone();
    delete d.rules;
    expect(loadGameData(d).rules).toEqual(data.rules);
    const partial = clone();
    partial.rules = { hand: 6 };
    expect(loadGameData(partial).rules).toEqual({ ...data.rules, hand: 6 });
  });

  it('numbers cards like data3.py', () => {
    const deck = deckCards(data, 'Ж');
    expect(deck[0].code).toBe('Ж-01');
    expect(deck[23].code).toBe('Ж-24');
    expect(legendCards(data).map((c) => c.code)).toEqual(['Ж-Л', 'М-Л', 'И-Л', 'Г-Л']);
    expect(seaCards(data)[16].code).toBe('С-17');
  });

  it('keeps fx operations with data3.py names', () => {
    const legends = Object.fromEntries(legendCards(data).map((c) => [c.name, c]));
    expect(legends['Кракен'].fx.ops).toEqual([
      ['dmg', 'any', 'hull', 4],
      ['dmg', 'same', 'crew', 2],
    ]);
    expect(legends['Кракен'].soul).toBe(3);
    const yadra = deckCards(data, 'Ж').find((c) => c.name === 'Ядра')!;
    expect(yadra.fx).toEqual({ dmg: 1, plan: { dmg: 2 } });
  });

  it('keeps every sea card with its key', () => {
    expect(seaCards(data).map((c) => c.key)).toContain('maelstrom');
    expect(new Set(seaCards(data).map((c) => c.key)).size).toBe(17);
  });
});

describe('loadGameData validation', () => {
  it('rejects an unknown operation in fx.ops and names the card', () => {
    const d = clone();
    d.decks['Ж'][0].fx = { ops: [['teleport', 1]] };
    const [problem] = problemsOf(d);
    expect(problem).toContain('«Ядра»');
    expect(problem).toContain('teleport');
  });

  it('rejects an unknown fx key and names the card', () => {
    const d = clone();
    d.legends['М'].fx.explode = 3;
    const [problem] = problemsOf(d);
    expect(problem).toContain('«Корабль в бутылке»');
    expect(problem).toContain('explode');
  });

  it('rejects an unknown operation inside a Plan bonus', () => {
    const d = clone();
    d.decks['Ж'][0].fx.plan.boom = 1;
    expect(problemsOf(d)[0]).toContain('boom');
  });

  it('rejects an unknown Reaction kind', () => {
    const d = clone();
    const card = d.decks['Ж'].find((c: any) => c.fx.r === 'reduce');
    card.fx.r = 'dodge';
    const [problem] = problemsOf(d);
    expect(problem).toContain(`«${card.name}»`);
    expect(problem).toContain('dodge');
  });

  it('rejects an operation with a wrong number of arguments', () => {
    const d = clone();
    d.legends['Г'].fx.ops[0] = ['dmg', 'any', 4];
    expect(problemsOf(d)[0]).toContain('«Кракен»');
  });

  it('rejects a negative cost and names the card', () => {
    const d = clone();
    d.decks['М'][0].cost = -1;
    const [problem] = problemsOf(d);
    expect(problem).toContain(`«${d.decks['М'][0].name}»`);
    expect(problem).toContain('cost');
  });

  it('rejects a fractional cost', () => {
    const d = clone();
    d.decks['М'][0].cost = 0.5;
    expect(problemsOf(d)[0]).toContain('cost');
  });

  it('rejects an empty card name', () => {
    const d = clone();
    d.decks['И'][2].name = '  ';
    const [problem] = problemsOf(d);
    expect(problem).toContain('Колода И, карта №3');
    expect(problem).toContain('name');
  });

  it('rejects an empty sea card name', () => {
    const d = clone();
    d.sea[0].name = '';
    expect(problemsOf(d)[0]).toContain('Море, карта №1');
  });

  it('rejects an unknown sea effect key', () => {
    const d = clone();
    d.sea[0].key = 'tsunami';
    expect(problemsOf(d)[0]).toContain('«Штиль»');
  });

  it('rejects zero copies and an unknown card type', () => {
    const d = clone();
    d.decks['Г'][0].copies = 0;
    d.decks['Г'][1].type = 'ЛОВУШКА';
    expect(problemsOf(d)).toHaveLength(2);
  });

  it('rejects a deck without a ship and a ship without a deck', () => {
    const d = clone();
    d.decks['X'] = d.decks['Ж'];
    delete d.decks['Ж'];
    const problems = problemsOf(d);
    expect(problems.some((p) => p.includes('«X»'))).toBe(true);
    expect(problems.some((p) => p.includes('Колода Ж'))).toBe(true);
  });

  it('rejects a Legend that does not match the ship', () => {
    const d = clone();
    d.legends['Ж'].name = 'Другая Легенда';
    expect(problemsOf(d)[0]).toContain('Джек ускользает');
  });

  it('rejects bad Volley parameters of a ship', () => {
    const d = clone();
    d.ships[0].volleysPerTurn = 0;
    d.ships[0].defaultTrack = 'deck';
    d.ships[0].diagDamage = -1;
    const problems = problemsOf(d);
    expect(problems).toHaveLength(3);
    expect(problems.every((p) => p.includes('Чёрная жемчужина'))).toBe(true);
  });

  it('rejects bad rule numbers', () => {
    const d = clone();
    d.rules.hand = -1;
    d.rules.maxRounds = 0;
    d.rules.handSize = 5;
    const problems = problemsOf(d);
    expect(problems).toHaveLength(3);
    expect(problems.every((p) => p.startsWith('Правила'))).toBe(true);
  });

  it('collects all problems at once', () => {
    const d = clone();
    d.decks['Ж'][0].cost = -2;
    d.decks['М'][0].name = '';
    d.decks['И'][0].fx = { ops: [['nope']] };
    expect(problemsOf(d)).toHaveLength(3);
  });

  it('rejects data that is not an object', () => {
    expect(problemsOf(null)).toHaveLength(1);
    expect(problemsOf([])).toHaveLength(1);
  });
});
