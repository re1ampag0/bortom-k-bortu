// The game data loaded once for the whole interface.
import raw from '../../data/game-data.json';
import { DataError, loadGameData } from '../engine/data';
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
