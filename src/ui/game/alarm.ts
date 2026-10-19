// «Тревога!» (U2): the words of the bar, the loss of the target, the outcome strip of a Reaction in the hand. Only what
// the engine answers (hints.ts) is read here: the numbers come from the same dry runs as «Подсказки».
import { damageResult, previewReaction, threatLine, tryAction, TRACK_DATIVE } from '../../engine/hints';
import { cardByCode, shipData, type GameState } from '../../engine/state';
import type { GameData, Track } from '../../engine/types';

export interface AlarmInfo {
  /** The Reaction window: to a Volley before it hits, after it, or to a card. */
  kind: 'volley' | 'after' | 'card';
  /** «Индевор» даёт Залп по «Жемчужине» — ответите Реакцией? */
  line: string;
  shooter: string | null;
  target: string | null;
  /** The damage and the track of the Volley to come: the arrow's pill and the loss of the target. */
  hit: { n: number; track: Track; pill: string } | null;
}

export function alarmInfo(s: GameState, data: GameData): AlarmInfo | null {
  const p = s.pending;
  if (p?.kind !== 'reactions') return null;
  const name = (code: string) => `«${shipData(data, code).nick}»`;
  const to = (code: string) => `«${shipData(data, code).nickDative}»`;
  if (p.subject === 'volley' && s.volley) {
    const v = s.volley;
    if (p.window === 'after') {
      return {
        kind: 'after',
        line: `${name(v.shooter)} выстрелил по ${to(v.target)} — ответите Реакцией?`,
        shooter: v.shooter,
        target: v.target,
        hit: null,
      };
    }
    const n = Number(/: (\d+) по /.exec(threatLine(s, data) ?? '')?.[1] ?? 0);
    return {
      kind: 'volley',
      line: `${name(v.shooter)} даёт Залп по ${to(v.target)} — ответите Реакцией?`,
      shooter: v.shooter,
      target: v.target,
      hit: { n, track: v.track, pill: `${n} по ${TRACK_DATIVE[v.track]}` },
    };
  }
  if (s.card) {
    const c = cardByCode(data, s.card.card);
    const target = s.card.target && s.ships[s.card.target] ? ` по ${to(s.card.target)}` : '';
    return {
      kind: 'card',
      line: `${name(s.card.ship)}: «${c.name}»${target} — ответите Реакцией?`,
      shooter: s.card.ship,
      target: s.card.target ?? null,
      hit: null,
    };
  }
  return { kind: 'card', line: 'Ответите Реакцией?', shooter: null, target: null, hit: null };
}

/** The cells the target is going to lose: [from, to) of each track (the Hull gets the rest of a hit on another track). */
export interface Loss {
  track: Track;
  /** The number of lost cells (the «−4»). */
  n: number;
  /** The cells that go: indexes `to` … `from − 1`. */
  to: number;
  from: number;
}

export function lossOf(s: GameState, target: string, hit: { n: number; track: Track }): Loss[] {
  const r = damageResult(s.ships[target], hit.track, hit.n);
  const out: Loss[] = [];
  if (r.from > r.to) out.push({ track: r.track, n: r.from - r.to, to: r.to, from: r.from });
  if (r.track !== 'hull' && r.hullFrom > r.hullTo) out.push({ track: 'hull', n: r.hullFrom - r.hullTo, to: r.hullTo, from: r.hullFrom });
  return out;
}

export interface Strip {
  top: string;
  bottom: string;
}

/** «4 → 1 | по Корпусу», «4 → 2 | Заряд отменён»: from the label of previewReaction and the dry run of the same action. */
export function reactionStrip(s: GameState, data: GameData, seat: string, card: string): Strip | null {
  const p = previewReaction(s, data, seat, card);
  if (!p.ok) return null;
  const l = p.label;
  let m: RegExpExecArray | null;
  if ((m = /^(\d+ → \d+) по (.+)$/.exec(l))) return { top: m[1], bottom: `по ${m[2]}` };
  if ((m = /^(\d+ → 0) · отмена$/.exec(l))) return { top: m[1], bottom: s.volley ? 'Залп отменён' : 'отмена' };
  if ((m = /^(\d+) → («.+»)$/.exec(l))) return { top: `${m[1]} → ↪`, bottom: `удар примет ${m[2]}` };
  if ((m = /^(\d+ → \d+)$/.exec(l))) {
    const r = tryAction(s, { type: 'react', seat, card }, data);
    return { top: m[1], bottom: r.ok && r.state.volley?.chargeCancelled ? 'Заряд отменён' : 'урон' };
  }
  return { top: l, bottom: '' };
}

/** The fuse: how much of the window's time is left, 0…1. */
export const fuseLeft = (total: number, spent: number): number => (total > 0 ? Math.max(0, Math.min(1, 1 - spent / total)) : 0);
