// Browser storage for per-device conveniences: the autosave and the settings. Storage may be unavailable
// (private window, blocked site data), so every access is guarded and the game works without it.
import { parseRecord, type MatchRecord } from '../engine/match';

const SAVE = 'bortom-k-bortu.save';
const SETTINGS = 'bortom-k-bortu.settings';
/** V7: the minutes of the game in progress (playClock.ts), next to the autosave. */
const CLOCK = 'bortom-k-bortu.clock';

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
  /** ⚙ «Вид стола» (rig, г): the first variant of each switch is the default. */
  view: TableView;
}

/** «Залп на планшете»: the Guns track as icons (default) or as the gun ports of a ship's side. */
export type GunsView = 'icons' | 'ports';
/** «Фон под рукой»: the deck under the cards of the hand (default) or the captain's table around it. */
export type HandBg = 'deck' | 'table';
/** «Рамка моря»: the bulwark of planks (default) or the brass frame of before. */
export type SeaFrame = 'bulwark' | 'brass';

export interface TableView {
  guns: GunsView;
  hand: HandBg;
  frame: SeaFrame;
  /** Damage breakdown during a Volley, and its short trace. Old settings show it. */
  damage: 'show' | 'hide';
  play: 'sheet' | 'scroll';
}

export const DEFAULT_VIEW: TableView = { guns: 'icons', hand: 'deck', frame: 'bulwark', damage: 'show', play: 'sheet' };

export const DEFAULT_SETTINGS: Settings = { speed: 'normal', effects: 'rich', hints: null, sound: false, fastEnd: false, tapSkip: false, view: DEFAULT_VIEW };

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

export function loadClock(): { id: string; ms: number } | null {
  try {
    const c = JSON.parse(read(CLOCK) ?? 'null') as { id?: unknown; ms?: unknown } | null;
    return c && typeof c.id === 'string' && typeof c.ms === 'number' && c.ms >= 0 ? { id: c.id, ms: c.ms } : null;
  } catch {
    return null;
  }
}

export function storeClock(c: { id: string; ms: number }): void {
  write(CLOCK, JSON.stringify(c));
}

/** A stored view: what is not one of the known variants (the old «brass|wood» frame included) is read as the default. */
function readView(v: unknown): TableView {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  const pick = <T extends string>(x: unknown, ok: readonly T[], d: T): T => (ok.includes(x as T) ? (x as T) : d);
  return {
    guns: pick(o.guns, ['icons', 'ports'], DEFAULT_VIEW.guns),
    hand: pick(o.hand, ['deck', 'table'], DEFAULT_VIEW.hand),
    damage: pick(o.damage, ['show', 'hide'], DEFAULT_VIEW.damage),
    play: pick(o.play, ['sheet', 'scroll'], DEFAULT_VIEW.play),
    frame: pick(o.frame, ['bulwark', 'brass'], DEFAULT_VIEW.frame),
  };
}

export function loadSettings(): Settings {
  try {
    const { seaFrame: _old, ...stored } = JSON.parse(read(SETTINGS) ?? '{}') as Partial<Settings> & { seaFrame?: unknown };
    void _old;
    return { ...DEFAULT_SETTINGS, ...stored, view: readView(stored.view) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

const settingsListeners = new Set<(settings: Settings) => void>();
/** Same-tab view changes reach imperative clips without rendering Game on every clip frame. */
export function subscribeSettings(fn: (settings: Settings) => void): () => void {
  settingsListeners.add(fn);
  return () => { settingsListeners.delete(fn); };
}
export function storeSettings(s: Settings): void {
  write(SETTINGS, JSON.stringify(s));
  settingsListeners.forEach(fn => fn(s));
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
