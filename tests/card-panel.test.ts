// The card panel shows the tracks of the ship the engine repairs (P1): the ally's for «Норрингтон на борту», the
// Dutchman's for «Сердце бьётся» played by the Endeavour. The ship comes from cardNeeds → repairTarget, not the panel.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { cardNeeds } from '../src/engine/hints';
import { startValue, type GameState } from '../src/engine/state';
import type { Track } from '../src/engine/types';
import { CardParamsPanel, type CardMode } from '../src/ui/game/Panels';
import { act, cardIn, data, give, turnOf } from './helpers';

const TRACKS: Track[] = ['hull', 'sails', 'guns', 'crew'];

function panel(s: GameState, seat: string, card: string, ship: string | null = null): string {
  const mode: CardMode = { k: 'card', seat, card, target: null, ship, repair: null, souls: null, regroup: false };
  return renderToStaticMarkup(createElement(CardParamsPanel, { s, data, mode, setMode: () => {}, onAct: () => {}, onCancel: () => {} }));
}

/** The tracks the panel offers to repair, as «Корпус 10/12». */
function rows(html: string): string[] {
  return [...html.matchAll(/data-track="(\w+)"><span>([^<]+)<\/span>/g)].map((m) => `${m[1]} ${m[2]}`);
}

/** The rows the panel must show: the missing tracks of the ship the engine repairs. */
function expectedRows(s: GameState, code: string): string[] {
  const names: Record<Track, string> = { hull: 'Корпус', sails: 'Паруса', guns: 'Пушки', crew: 'Команда' };
  return TRACKS.filter((t) => s.ships[code].tracks[t] < startValue(data, code, t)).map(
    (t) => `${t} ${names[t]} ${s.ships[code].tracks[t]}/${startValue(data, code, t)}`,
  );
}

describe('Card panel: the repaired ship', () => {
  it('«Норрингтон на борту»: the tracks and the title of the ally’s ship, the own ship whole', () => {
    const s = turnOf('КОМПАНИЯ', { Г: ['Норрингтон на борту'] });
    s.ships['И'].tracks = { hull: 10, sails: 0, guns: 3, crew: 2 };
    const card = cardIn(s, 'Г', 'Норрингтон на борту');
    expect(cardNeeds(s, data, 'Г', card).repairShip).toBe('И');
    const html = panel(s, 'Г', card);
    expect(html).toContain('Норрингтон на борту → «Индевор»: восстановить 2 клетки');
    expect(rows(html)).toEqual(expectedRows(s, 'И'));
    expect(rows(html)).toEqual(['hull Корпус 10/12', 'sails Паруса 0/1']);
  });

  it('«Норрингтон на борту»: the own damaged tracks are not offered', () => {
    const s = turnOf('КОМПАНИЯ', { Г: ['Норрингтон на борту'] });
    s.ships['Г'].tracks.sails = 1;
    s.ships['И'].tracks.hull = 10;
    expect(rows(panel(s, 'Г', cardIn(s, 'Г', 'Норрингтон на борту')))).toEqual(['hull Корпус 10/12']);
  });

  it('«Сердце бьётся» played by the Endeavour: the tracks of the Dutchman (Q43)', () => {
    const s = turnOf('КОМПАНИЯ', {});
    const card = give(s, 'И', 'Сердце бьётся', 'Г');
    s.ships['Г'].souls = 1;
    s.ships['Г'].tracks.crew = 1;
    s.ships['И'].tracks.hull = 5;
    expect(cardNeeds(s, data, 'И', card).repairShip).toBe('Г');
    const html = panel(s, 'И', card);
    expect(html).toContain('Сердце бьётся → «Голландец»: восстановить 2 клетки');
    expect(rows(html)).toEqual(['crew Команда 1/3']);
  });

  it('«Живые снасти»: without a choice the panel marks the ship the engine repairs — the ally when own Sails are whole', () => {
    const s = turnOf('ПИРАТЫ', { М: ['Живые снасти'] });
    s.ships['Ж'].tracks.sails = 1;
    const card = cardIn(s, 'М', 'Живые снасти');
    expect(cardNeeds(s, data, 'М', card).repairShip).toBe('Ж');
    const chosen = [...panel(s, 'М', card).matchAll(/class="choice on"><span>([^<]+)<\/span><b>([^<]+)<\/b>/g)].map((m) => `${m[1]} ${m[2]}`);
    expect(chosen).toEqual(['Союзник «Жемчужина»']);
    expect(act(s, { type: 'playCard', seat: 'М', card }).state.ships['Ж'].tracks.sails).toBe(3);
    // The player's choice wins: the own ship.
    expect(cardNeeds(s, data, 'М', card, { ship: 'М' }).repairShip).toBe('М');
  });
});
