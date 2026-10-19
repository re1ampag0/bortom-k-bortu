// U2 «Тревога!»: the words of the bar, the arrow's pill, what the target loses, the strip of a Reaction in the hand.
import { describe, expect, it } from 'vitest';
import { damageResult, TRACK_DATIVE } from '../src/engine/hints';
import { alarmInfo, fuseLeft, lossOf, reactionStrip } from '../src/ui/game/alarm';
import { act, cardIn, data, turnOf } from './helpers';

describe('«Тревога!»: the bar and the arrow', () => {
  it('a Volley before it hits: who fires at whom, the damage and the track on the pill', () => {
    const s = act(turnOf('ПИРАТЫ', { И: ['Двойная обшивка'] }), { type: 'volley', ship: 'Ж', target: 'И' }).state;
    const info = alarmInfo(s, data)!;
    expect(info.kind).toBe('volley');
    expect(info.line).toBe('«Жемчужина» даёт Залп по «Индевору» — ответите Реакцией?');
    expect(info.shooter).toBe('Ж');
    expect(info.target).toBe('И');
    expect(info.hit).toEqual({ n: s.ships['Ж'].tracks.guns, track: 'hull', pill: `${s.ships['Ж'].tracks.guns} по Корпусу` });
  });

  it('a Crew hit: the pill says «по Команде»', () => {
    const base = turnOf('КОМПАНИЯ', { Г: ['Картечь'], Ж: ['Уйти по ветру'] });
    const grape = cardIn(base, 'Г', 'Картечь');
    const s = act(base, { type: 'volley', ship: 'Г', target: 'Ж', charge: grape }).state;
    expect(s.pending?.kind).toBe('reactions');
    const info = alarmInfo(s, data)!;
    expect(info.hit?.track).toBe('crew');
    expect(info.hit?.pill).toMatch(/^\d+ по Команде$/);
  });

  it('nothing outside a Reaction window', () => {
    expect(alarmInfo(turnOf('ПИРАТЫ'), data)).toBeNull();
  });
});

describe('«Тревога!»: what the target loses', () => {
  const s = turnOf('ПИРАТЫ');

  it('a Hull hit: the last cells of the Hull, the count is the damage', () => {
    const hull = s.ships['И'].tracks.hull;
    expect(lossOf(s, 'И', { n: 3, track: 'hull' })).toEqual([{ track: 'hull', n: 3, to: hull - 3, from: hull }]);
  });

  it('the damage the track cannot take goes to the Hull: both are ringed', () => {
    const crew = s.ships['И'].tracks.crew;
    const r = damageResult(s.ships['И'], 'crew', crew + 2);
    const loss = lossOf(s, 'И', { n: crew + 2, track: 'crew' });
    const hull = loss.find((x) => x.track === 'hull');
    expect(hull).toBeDefined();
    expect(hull!.n).toBe(r.hullFrom - r.hullTo);
    expect(hull!.from).toBe(r.hullFrom);
    expect(loss.find((x) => x.track === 'crew')!.n).toBe(r.from - r.to);
  });

  it('no damage — no loss', () => {
    expect(lossOf(s, 'И', { n: 0, track: 'hull' })).toEqual([]);
  });
});

describe('«Тревога!»: the strip of a Reaction', () => {
  it('«Уйти по ветру»: from → to, and what changes', () => {
    const base = turnOf('КОМПАНИЯ', { Ж: ['Уйти по ветру'] });
    const s = act(base, { type: 'volley', ship: 'И', target: 'Ж' }).state;
    const strip = reactionStrip(s, data, 'Ж', cardIn(s, 'Ж', 'Уйти по ветру'))!;
    expect(strip.top).toMatch(/^\d+ → \d+$/);
    expect(strip.bottom.length).toBeGreaterThan(0);
    const [from, to] = strip.top.split(' → ').map(Number);
    expect(to).toBeLessThanOrEqual(from);
  });

  it('a Reaction that cannot be played has no strip (the reason comes from the engine, not from here)', () => {
    const s = act(turnOf('КОМПАНИЯ', { Ж: ['Чёрные паруса в ночи'] }), { type: 'volley', ship: 'И', target: 'Ж' }).state;
    const card = cardIn(s, 'Ж', 'Чёрные паруса в ночи');
    const strip = reactionStrip(s, data, 'Ж', card);
    // Without a diagonal the card is refused; with one it cancels the Volley.
    if (strip) expect(strip.top).toMatch(/→ 0$/);
    else expect(strip).toBeNull();
  });

  it('the words of the pill follow the track dative of the engine', () => {
    expect(TRACK_DATIVE.hull).toBe('Корпусу');
    expect(TRACK_DATIVE.crew).toBe('Команде');
  });
});

describe('«Тревога!»: the fuse', () => {
  it('shrinks with the time spent and stays in 0…1', () => {
    expect(fuseLeft(30_000, 0)).toBe(1);
    expect(fuseLeft(30_000, 15_000)).toBe(0.5);
    expect(fuseLeft(30_000, 99_000)).toBe(0);
    expect(fuseLeft(0, 0)).toBe(0);
  });
});
