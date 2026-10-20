// Banners of the sea and the turn. phone-2: turn summaries live in the clickable journal line, never in this queue.
import { useEffect, useRef, useState } from 'react';
import { seaCardByCode, type GameEvent } from '../../engine/state';
import type { GameData, Side } from '../../engine/types';
import type { Recent } from '../../net/local';
import { SIDE_LABEL } from './text';

// The side is kept, not the words: in a game for two the team at the device changes behind the curtain, so «Ваш ход»
// is decided when the banner is shown.
type Banner = { id: number; ms: number } & ({ k: 'sea'; card: string } | { k: 'turn'; side: Side });

/** The banners of the events of one action: the sea card of a new round, the turn (each only when it is on). */
export function bannersOf(
  events: readonly GameEvent[],
  on: { enabled: boolean; turnBanners: boolean; seaBanners: boolean },
): ({ k: 'sea'; card: string } | { k: 'turn'; side: Side })[] {
  if (!on.enabled) return [];
  const out: ({ k: 'sea'; card: string } | { k: 'turn'; side: Side })[] = [];
  for (const e of events) {
    if (e.type === 'seaRevealed' && on.seaBanners) out.push({ k: 'sea', card: e.card });
    if (e.type === 'turnStarted' && on.turnBanners) out.push({ k: 'turn', side: e.side });
  }
  return out;
}

export function useBanners({
  recent,
  version,
  bottom,
  mine,
  enabled,
  turnBanners = true,
  seaBanners = true,
  start,
  paused,
}: {
  recent: Recent[];
  version: number;
  bottom: Side;
  /** The team at the bottom is played from this device: «Ваш ход». */
  mine: boolean;
  /** Off at the instant speed and at «?speed=instant»: no banners are queued. */
  enabled: boolean;
  /**
   * «Ваш ход» / «Ход Компании» of its own (decided when the action comes): off while the animation layer plays the
   * clip «turn», which draws the banner itself. Behind the curtain the layer is off: the banner waits for the curtain.
   */
  turnBanners?: boolean;
  /**
   * The new sea card of a round (S1): off while the animation layer plays the clip «sea», which shows the card itself.
   * The first sea card of a new game has no action — its banner is shown anyway.
   */
  seaBanners?: boolean;
  /** A game without actions yet: its first sea card and first turn (read once, when the table opens). */
  start: { sea: string | null; active: Side } | null;
  /** The curtain «Передайте устройство» is up: the banners wait until it is closed. */
  paused: boolean;
}) {
  const seen = useRef((recent.at(-1)?.n ?? -1) + 1);
  const ids = useRef(0);
  const turnBanner = (side: Side): Banner => ({ id: ++ids.current, ms: 1000, k: 'turn', side });
  const [queue, setQueue] = useState<Banner[]>(() =>
    start && enabled ? [...(start.sea ? [{ id: ++ids.current, ms: 2000, k: 'sea' as const, card: start.sea }] : []), turnBanner(start.active)] : [],
  );

  useEffect(() => {
    const fresh = recent.filter((r) => r.n >= seen.current);
    if (fresh.length === 0) return;
    seen.current = fresh.at(-1)!.n + 1;
    const add: Banner[] = [];
    for (const r of fresh) {
      for (const b of bannersOf(r.events, { enabled, turnBanners, seaBanners })) {
        add.push(b.k === 'sea' ? { id: ++ids.current, ms: 2000, k: 'sea', card: b.card } : turnBanner(b.side));
      }
    }
    if (add.length > 0) setQueue((q) => [...q, ...add]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const head = queue[0] ?? null;
  useEffect(() => {
    if (!head || paused) return;
    const t = setTimeout(() => setQueue((q) => (q[0]?.id === head.id ? q.slice(1) : q)), head.ms);
    return () => clearTimeout(t);
  }, [head, paused]);
  if (paused || !head) return null;
  return head.k === 'turn' ? { ...head, text: mine && head.side === bottom ? 'Ваш ход' : `Ход ${SIDE_LABEL[head.side].gen}`, mine: mine && head.side === bottom } : head;
}

type Shown = Exclude<Banner, { k: 'turn' }> | (Extract<Banner, { k: 'turn' }> & { text: string; mine: boolean });

export function BannerView({ data, banner }: { data: GameData; banner: Shown | null }) {
  if (!banner) return null;
  if (banner.k === 'sea') {
    const sea = seaCardByCode(data, banner.card);
    return (
      <div className="table-banner sea" data-testid="sea-banner" key={banner.id} role="status">
        <span className="table-banner-kicker">Море</span>
        <b className="table-banner-title">{sea.name}</b>
        <span className="table-banner-text">{sea.big}</span>
        {sea.when && <span className="table-banner-when">{sea.when}</span>}
      </div>
    );
  }
  return (
    <div className={`table-banner turn ${banner.mine ? 'mine' : ''}`} data-testid="turn-banner" key={banner.id} role="status">
      <b className="table-banner-title">{banner.text}</b>
    </div>
  );
}
