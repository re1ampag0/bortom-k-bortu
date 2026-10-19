// V7: the numbers of the victory sheet from the record of a game (src/ui/game/victoryStats.ts).
import { describe, expect, it } from 'vitest';
import { botAnswer, botTurn, newBotMemory, type BotFeedback } from '../src/engine/ai/bot';
import { applyAction, createGame } from '../src/engine/engine';
import { matchTotals, replay, type MatchSetup } from '../src/engine/match';
import { RuleError, type Action, type GameState } from '../src/engine/state';
import type { Side } from '../src/engine/types';
import { awardTitles, bestCaptain, matchStats, plural, type MatchStats, type ShipStats } from '../src/ui/game/victoryStats';
import { data } from './helpers';

const SIDES: Side[] = ['ПИРАТЫ', 'КОМПАНИЯ'];
const other = (s: Side): Side => (s === 'ПИРАТЫ' ? 'КОМПАНИЯ' : 'ПИРАТЫ');

/** A whole game of four bots as a record: the setup and the actions. */
function botRecord(seed: number): { setup: MatchSetup; actions: Action[]; end: GameState } {
  const setup: MatchSetup = { game: { seed, variant: 'standard' }, players: { ПИРАТЫ: 'bot', КОМПАНИЯ: 'bot' }, openHands: true };
  const mem = newBotMemory(seed ^ 0x2545f491);
  let state = createGame(data, setup.game).state;
  const actions: Action[] = [];
  const apply = (a: Action) => {
    state = applyAction(state, a, data).state;
    actions.push(a);
  };
  const settle = () => {
    while (state.pending && !state.winner) apply(botAnswer(state, data, mem));
  };
  settle();
  for (let guard = 0; !state.winner && guard < 400; guard++) {
    const turn = botTurn(state, data, mem.rng);
    let next = turn.next();
    while (!next.done && !state.winner) {
      let fb: BotFeedback;
      try {
        apply(next.value);
        fb = { state };
      } catch (e) {
        if (!(e instanceof RuleError)) throw e;
        fb = { state, error: (e as Error).message };
      }
      settle();
      fb.state = state;
      next = turn.next(fb);
    }
  }
  return { setup, actions, end: state };
}

const GAMES = Array.from({ length: 20 }, (_, k) => botRecord(201 + k));

describe('matchStats over 20 bot games', () => {
  it('the damage of each side is its ships’ damage plus the damage no enemy ship dealt (= matchTotals)', () => {
    for (const g of GAMES) {
      const m = matchStats(data, g.setup, g.actions);
      const totals = matchTotals(data, g.setup, g.actions);
      for (const side of SIDES) {
        const mine = m.order.filter((c) => m.ships[c].side === side);
        const theirs = m.order.filter((c) => m.ships[c].side !== side);
        const out = mine.reduce((n, c) => n + m.ships[c].dmgOut, 0);
        expect(out + m.unowned[other(side)]).toBe(totals[side].damage);
        // what the ships of a side took — from the enemy ships and from nobody
        expect(mine.reduce((n, c) => n + m.ships[c].dmgIn, 0)).toBe(theirs.reduce((n, c) => n + m.ships[c].dmgOut, 0) + m.unowned[side]);
      }
    }
  });

  it('the sunk ships, the rounds and the kills agree with the end of the game', () => {
    for (const g of GAMES) {
      const m = matchStats(data, g.setup, g.actions);
      expect(m.sunkOrder.slice().sort()).toEqual(m.order.filter((c) => g.end.ships[c].sunk).sort());
      for (const c of m.order) expect(m.ships[c].sunk).toBe(g.end.ships[c].sunk);
      expect(m.rounds).toBe(g.end.round);
      expect(m.turns).toBeGreaterThan(0);
      const kills = m.order.flatMap((c) => m.ships[c].kills.map((k) => k.ship));
      for (const k of kills) expect(m.sunkOrder).toContain(k);
      expect(new Set(kills).size).toBe(kills.length);
      for (const c of m.order) {
        const s = m.ships[c];
        expect(s.hullDmg + s.crewDmg).toBeLessThanOrEqual(s.dmgOut);
        expect(s.hullLost).toBeLessThanOrEqual(s.dmgIn);
      }
    }
  });

  it('each ship has one title; a title of the list goes to one ship only; the best captain is of the winners', () => {
    for (const g of GAMES) {
      const m = matchStats(data, g.setup, g.actions);
      const t = awardTitles(data, m, g.end.winner);
      expect(Object.keys(t).sort()).toEqual(m.order.slice().sort());
      const keys = Object.values(t).map((x) => x.key).filter((k) => k !== 'flagship' && k !== 'tothend');
      expect(new Set(keys).size).toBe(keys.length);
      for (const c of m.order) {
        expect(t[c].name.length).toBeGreaterThan(0);
        expect(t[c].fact).not.toMatch(/undefined|NaN/);
        if (t[c].key === 'flagship') {
          expect(m.ships[c].side).toBe(g.end.winner);
          expect(m.ships[c].sunk).toBe(false);
        }
      }
      const best = bestCaptain(m, g.end.winner)!;
      if (g.end.winner !== 'НИЧЬЯ') expect(m.ships[best.code].side).toBe(g.end.winner);
      expect(best.share).toBeGreaterThanOrEqual(0);
      expect(best.share).toBeLessThanOrEqual(100);
    }
  });

  it('the same record gives the same numbers (both players of a network game see one sheet)', () => {
    const g = GAMES[3];
    expect(matchStats(data, g.setup, g.actions)).toEqual(matchStats(data, structuredClone(g.setup), structuredClone(g.actions)));
  });

  it('the first Volley that hits: its shooter has the Volley and the damage', () => {
    const g = GAMES[0];
    let at = -1;
    let hit: { ship: string; target: string; damage: number } | null = null;
    replay(data, g.setup, g.actions, ({ events }, i) => {
      if (at >= 0) return;
      const e = events.find((x) => x.type === 'hit');
      if (e && e.type === 'hit' && e.damage > 0) {
        at = i;
        hit = e;
      }
    });
    expect(hit).not.toBeNull();
    const h = hit as unknown as { ship: string; target: string; damage: number };
    const m = matchStats(data, g.setup, g.actions.slice(0, at + 1));
    expect(m.ships[h.ship].volleys).toBeGreaterThanOrEqual(1);
    expect(m.ships[h.ship].dmgOut).toBeGreaterThanOrEqual(h.damage);
    expect(m.ships[h.target].dmgIn).toBeGreaterThanOrEqual(h.damage);
  });
});

function ship(code: string, side: Side, over: Partial<ShipStats> = {}): ShipStats {
  return { code, side, dmgOut: 0, hullDmg: 0, crewDmg: 0, volleys: 0, fires: 0, softened: 0, dmgIn: 1, hullLost: 1, repair: 0, powder: 0, souls: 0, kills: [], legend: null, sunk: false, ...over };
}
function stats(...ships: ShipStats[]): MatchStats {
  return { ships: Object.fromEntries(ships.map((s) => [s.code, s])), order: ships.map((s) => s.code), unowned: { ПИРАТЫ: 0, КОМПАНИЯ: 0 }, rounds: 6, turns: 12, sunkOrder: ships.filter((s) => s.sunk).map((s) => s.code) };
}

describe('awardTitles: the order of the list and the ties', () => {
  it('the Volley that sank the last ship is «Решающий залп», before the most damage', () => {
    const m = stats(
      ship('М', 'ПИРАТЫ', { dmgOut: 9, hullDmg: 9, kills: [{ ship: 'И', round: 4, volley: 6 }] }),
      ship('Ж', 'ПИРАТЫ', { dmgOut: 12, hullDmg: 12, volleys: 5 }),
      ship('И', 'КОМПАНИЯ', { sunk: true }),
      ship('Г', 'КОМПАНИЯ', { souls: 5, dmgOut: 3 }),
    );
    const t = awardTitles(data, m, 'ПИРАТЫ');
    expect(t['М']).toEqual({ key: 'decisive', name: 'Решающий залп', fact: 'Залп на 6 — «Индевор» на дне' });
    expect(t['Ж']).toMatchObject({ name: 'Главный калибр', fact: '12 по Корпусу за партию' });
    expect(t['Г']).toMatchObject({ name: 'Собиратель душ', fact: '5 Душ за партию' });
    expect(t['И']).toMatchObject({ name: 'Бился до конца' });
  });

  it('a tie gives the title to nobody: each ship goes on down the list', () => {
    const m = stats(
      ship('Ж', 'ПИРАТЫ', { hullDmg: 5, volleys: 4 }),
      ship('М', 'ПИРАТЫ', { hullDmg: 5, volleys: 2, crewDmg: 3 }),
      ship('И', 'КОМПАНИЯ', { hullDmg: 1 }),
      ship('Г', 'КОМПАНИЯ'),
    );
    const t = awardTitles(data, m, 'ПИРАТЫ');
    expect(t['Ж']).toMatchObject({ name: 'Канонир', fact: '4 Залпа' });
    expect(t['М']).toMatchObject({ name: 'Картечь', fact: '3 матроса за борт' });
    // nothing of its own: the winners get «Флагман», the others «Бился до конца»
    expect(t['И'].name).toBe('Бился до конца');
  });

  it('«Ни царапины» only for the one ship that lost no Hull; «Дубовый борт» only among the ships afloat', () => {
    const m = stats(
      ship('Ж', 'ПИРАТЫ', { hullLost: 0, dmgIn: 0 }),
      ship('М', 'ПИРАТЫ', { dmgIn: 9 }),
      ship('И', 'КОМПАНИЯ', { dmgIn: 20, sunk: true }),
      ship('Г', 'КОМПАНИЯ', { dmgIn: 4 }),
    );
    const t = awardTitles(data, m, 'ПИРАТЫ');
    expect(t['М']).toMatchObject({ name: 'Дубовый борт', fact: '9 урона — и на плаву' });
    expect(t['Ж']).toMatchObject({ name: 'Ни царапины', fact: 'ни одной доски' });
    expect(t['Г'].name).toBe('Бился до конца');
  });

  it('«Козырь» — a Legend played and not cancelled; «Флагман» for a winner with nothing else', () => {
    const m = stats(
      ship('Ж', 'ПИРАТЫ', { legend: { card: 'Ж-Л', round: 3, worked: true }, dmgOut: 4 }),
      ship('М', 'ПИРАТЫ', { legend: { card: 'М-Л', round: 2, worked: false }, dmgOut: 2 }),
      ship('И', 'КОМПАНИЯ'),
      ship('Г', 'КОМПАНИЯ'),
    );
    const t = awardTitles(data, m, 'ПИРАТЫ');
    expect(t['Ж'].name).toBe('Козырь');
    expect(t['Ж'].fact).toMatch(/^«.+» в раунде III$/);
    expect(t['М']).toEqual({ key: 'flagship', name: 'Флагман', fact: '2 урона по врагу' });
  });

  it('a sunk ship of the winners with nothing of its own: «Бился до конца», not «Флагман»', () => {
    const m = stats(ship('Ж', 'ПИРАТЫ', { dmgOut: 2, sunk: true }), ship('М', 'ПИРАТЫ', { dmgOut: 9, hullDmg: 9 }), ship('И', 'КОМПАНИЯ', { sunk: true }), ship('Г', 'КОМПАНИЯ', { sunk: true }));
    expect(awardTitles(data, m, 'ПИРАТЫ')['Ж']).toEqual({ key: 'tothend', name: 'Бился до конца', fact: '2 урона по врагу' });
  });
});

describe('bestCaptain', () => {
  it('the winner with the most damage, its share of the side and the last ship it sank', () => {
    const m = stats(
      ship('М', 'ПИРАТЫ', { dmgOut: 26, kills: [{ ship: 'И', round: 4, volley: 6 }] }),
      ship('Ж', 'ПИРАТЫ', { dmgOut: 17 }),
      ship('Г', 'КОМПАНИЯ', { dmgOut: 30 }),
      ship('И', 'КОМПАНИЯ', { dmgOut: 14, sunk: true }),
    );
    expect(bestCaptain(m, 'ПИРАТЫ')).toEqual({ code: 'М', dmg: 26, most: false, share: 60, kill: { ship: 'И', round: 4, volley: 6 } });
    // a draw: of all the ships
    expect(bestCaptain(m, 'НИЧЬЯ')).toMatchObject({ code: 'Г', most: true, share: 68 });
  });
});

describe('plural', () => {
  it('Russian forms', () => {
    expect([1, 2, 5, 11, 21, 22, 25].map((n) => plural(n, 'Залп', 'Залпа', 'Залпов'))).toEqual(['Залп', 'Залпа', 'Залпов', 'Залпов', 'Залп', 'Залпа', 'Залпов']);
  });
});
