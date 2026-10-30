// Personal presets of the game data (docs/tasks/E9a-data-editor.md): copies of data/game-data.json changed on the admin
// page, kept in this browser (localStorage), without a password. «Основной» is the data built into the site.
// Storage may be blocked (a private window): then the presets live until the page is closed.
import { loadGameData } from '../engine/data';
import type { GameData } from '../engine/types';

export type RawData = Record<string, any>;

export interface Preset {
  id: string;
  name: string;
  data: RawData;
  updated: number;
}

/** The id of the main data in pickers. */
export const MAIN = 'main';
export const MAIN_NAME = 'Основной';

const KEY = 'bortom-k-bortu.presets';
let memory: Preset[] | null = null;

export function loadPresets(): Preset[] {
  if (memory) return memory;
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? '[]') as Preset[];
    memory = Array.isArray(list) ? list.filter((p) => p && typeof p.id === 'string' && typeof p.name === 'string' && p.data) : [];
  } catch {
    memory = [];
  }
  return memory;
}

/** Saves the list; returns the problem in words when the browser refused (no room, storage blocked), or null. */
export function storePresets(list: Preset[]): string | null {
  memory = list;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return null;
  } catch {
    return 'Браузер не сохранил пресеты (нет места или хранилище выключено): они пропадут, когда страница закроется. Сделайте экспорт.';
  }
}

export const newPresetId = () => `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** A name not taken yet: «Пресет», «Пресет (2)», … */
export function freeName(list: Preset[], wanted: string): string {
  const name = wanted.trim() || 'Пресет';
  const taken = new Set(list.map((p) => p.name.toLowerCase()));
  if (!taken.has(name.toLowerCase())) return name;
  for (let i = 2; ; i++) if (!taken.has(`${name} (${i})`.toLowerCase())) return `${name} (${i})`;
}

/** The file of «Экспорт». */
export interface PresetFile {
  format: 'bortom-k-bortu/preset';
  version: 1;
  name: string;
  data: RawData;
}

export const presetFile = (p: { name: string; data: RawData }): PresetFile => ({ format: 'bortom-k-bortu/preset', version: 1, name: p.name, data: p.data });

/** A file of «Импорт»: an exported preset or plain game data (data/game-data.json); throws in Russian. */
export function parsePresetFile(json: unknown, fileName: string): { name: string; data: RawData } {
  const x = json as Partial<PresetFile> & RawData;
  if (x && x.format === 'bortom-k-bortu/preset' && x.data && typeof x.data === 'object') return { name: String(x.name ?? 'Пресет'), data: x.data };
  if (x && typeof x === 'object' && Array.isArray(x.ships) && x.decks) return { name: fileName.replace(/\.json$/i, '') || 'Пресет', data: x };
  throw new Error('Это не файл пресета и не данные игры «Бортом к борту»');
}

/** Saves a JSON file on the device. */
export function downloadJson(fileName: string, value: unknown): void {
  const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Game data of a preset by id, checked by the loader; null — main, unknown or broken (the game uses the main data). */
export function presetGameData(id: string | null | undefined): { name: string; raw: RawData; data: GameData } | null {
  if (!id || id === MAIN) return null;
  const p = loadPresets().find((x) => x.id === id);
  if (!p) return null;
  try {
    return { name: p.name, raw: p.data, data: loadGameData(p.data) };
  } catch {
    return null;
  }
}
