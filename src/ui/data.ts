// The game data loaded once for the whole interface.
import raw from '../../data/game-data.json';
import { DataError, loadGameData } from '../engine/data';
import type { MatchSetup } from '../engine/match';
import type { GameData } from '../engine/types';

function load(): { data: GameData; error: null } | { data: null; error: string } {
  try {
    return { data: loadGameData(raw), error: null };
  } catch (e) {
    return { data: null, error: e instanceof DataError ? e.message : String(e) };
  }
}

export const loaded = load();

/** The main data as written in data/game-data.json: the base of the presets of the admin page. */
export const mainRaw = raw as Record<string, any>;

const presetData = new WeakMap<object, GameData>();

/** The data a game is played on: its preset's (checked by the loader; throws DataError in Russian) or the main data. */
export function dataFor(setup: MatchSetup, main: GameData): GameData {
  const raw = setup.preset?.data;
  if (!raw) return main;
  let data = presetData.get(raw);
  if (!data) {
    data = loadGameData(raw);
    presetData.set(raw, data);
  }
  return data;
}
