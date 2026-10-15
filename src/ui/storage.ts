// Browser storage for per-device conveniences: the autosave and the settings. Storage may be unavailable
// (private window, blocked site data), so every access is guarded and the game works without it.
import { parseRecord, type MatchRecord } from '../engine/match';

const SAVE = 'bortom-k-bortu.save';
const SETTINGS = 'bortom-k-bortu.settings';

export type Speed = 'slow' | 'normal' | 'fast' | 'instant';

export type Effects = 'rich' | 'simple';

export interface Settings {
  speed: Speed;
  effects: Effects;
  /** The last choice of «Подсказки»; null — not chosen yet (off, on for «Первая партия»). */
  hints: boolean | null;
  /** The short sound «ваш ход» (off by default). */
  sound: boolean;
  /** «Быстрый конец хода»: «Ход окончен · Отменить» lasts 1 s instead of 3 s (off by default). */
  fastEnd: boolean;
}

export const DEFAULT_SETTINGS: Settings = { speed: 'normal', effects: 'rich', hints: null, sound: false, fastEnd: false };

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Storage is a convenience: the game goes on without it.
  }
}

export function loadSave(): MatchRecord | null {
  const text = read(SAVE);
  if (!text) return null;
  try {
    return parseRecord(JSON.parse(text));
  } catch {
    return null;
  }
}

export function storeSave(record: MatchRecord | null): void {
  write(SAVE, record ? JSON.stringify(record) : null);
}

export function loadSettings(): Settings {
  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(read(SETTINGS) ?? '{}') as Partial<Settings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function storeSettings(s: Settings): void {
  write(SETTINGS, JSON.stringify(s));
}

/** Gives the viewer a file to save. */
export function download(name: string, text: string, type = 'text/plain'): void {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
