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
  /** A tap of a finger on the table skips the show to its result (off by default: a finger touches the screen often). */
  tapSkip: boolean;
}

export const DEFAULT_SETTINGS: Settings = { speed: 'normal', effects: 'rich', hints: null, sound: false, fastEnd: false, tapSkip: false };

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

/** An error of a clip of the animation layer, kept so a player can show it (⚙ → «Ошибки анимаций»). */
export interface FxError {
  at: string;
  clip: string;
  text: string;
  width: number;
}
const FX_ERRORS = 'bortom-fx-errors';

/** The last errors of the animation layer on this device, the newest first (at most 5). */
export function loadFxErrors(): FxError[] {
  try {
    const list = JSON.parse(read(FX_ERRORS) ?? '[]') as FxError[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveFxError(e: FxError): void {
  write(FX_ERRORS, JSON.stringify([e, ...loadFxErrors()].slice(0, 5)));
}

export function clearFxErrors(): void {
  write(FX_ERRORS, null);
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
