// Banners one after another (docs/TZ.md, «Очередь хода и ожидание», п. 2): at the start of a round the new sea card with
// its effect (~2 s), then «Ваш ход» / «Ход Компании» (~1 s), then the summary of the start of the turn (2 s, «Детали»,
// п. 3). They never take input.
import { useEffect, useRef, useState } from 'react';
import { sideGenitive, turnSummary } from '../../engine/log';
import { seaCardByCode } from '../../engine/state';
import type { GameData, Side } from '../../engine/types';
import type { Recent } from './show';
import { SIDE_LABEL } from './text';

type Banner = { id: number; ms: number } & ({ k: 'sea'; card: string } | { k: 'turn'; text: string; mine: boolean } | { k: 'summary'; text: string });

export function useBanners({
  recent,
  version,
  data,
  bottom,
  mine,
  enabled,
  start,
}: {
  recent: Recent[];
  version: number;
  data: GameData;
  bottom: Side;
  /** The team at the bottom is played from this device: «Ваш ход». */
  mine: boolean;
  /** Off at the instant speed and at «?speed=instant»: only the summary is left. */
  enabled: boolean;
  /** A game without actions yet: its first sea card and first turn (read once, when the table opens). */
  start: { sea: string | null; active: Side } | null;
}) {
  const seen = useRef((recent.at(-1)?.n ?? -1) + 1);
  const ids = useRef(0);
  const turnBanner = (side: Side): Banner => {
    const own = mine && side === bottom;
    return { id: ++ids.current, ms: 1000, k: 'turn', text: own ? 'Ваш ход' : `Ход ${SIDE_LABEL[side].gen}`, mine: own };
  };
  const [queue, setQueue] = useState<Banner[]>(() =>
    start && enabled ? [...(start.sea ? [{ id: ++ids.current, ms: 2000, k: 'sea' as const, card: start.sea }] : []), turnBanner(start.active)] : [],
  );

  useEffect(() => {
    const fresh = recent.filter((r) => r.n >= seen.current);
    if (fresh.length === 0) return;
    seen.current = fresh.at(-1)!.n + 1;
    const add: Banner[] = [];
    for (const r of fresh) {
      for (const e of r.events) {
        if (!enabled) continue;
        if (e.type === 'seaRevealed') add.push({ id: ++ids.current, ms: 2000, k: 'sea', card: e.card });
        if (e.type === 'turnStarted') add.push(turnBanner(e.side));
      }
      const sum = turnSummary(data, r.events);
      if (sum && sum.side === bottom && sum.text) add.push({ id: ++ids.current, ms: 2000, k: 'summary', text: `Ход ${sideGenitive(sum.side)}: ${sum.text}` });
    }
    if (add.length > 0) setQueue((q) => [...q, ...add]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const head = queue[0] ?? null;
  useEffect(() => {
    if (!head) return;
    const t = setTimeout(() => setQueue((q) => (q[0]?.id === head.id ? q.slice(1) : q)), head.ms);
    return () => clearTimeout(t);
  }, [head]);
  return head;
}

export function BannerView({ data, banner }: { data: GameData; banner: Banner | null }) {
  if (!banner || banner.k === 'summary') return null;
  if (banner.k === 'sea') {
    const sea = seaCardByCode(data, banner.card);
    return (
      <div className="banner sea" data-testid="sea-banner" key={banner.id} role="status">
        <span className="banner-kicker">Море</span>
        <b className="banner-title">{sea.name}</b>
        <span className="banner-text">{sea.big}</span>
        {sea.when && <span className="banner-when">{sea.when}</span>}
      </div>
    );
  }
  return (
    <div className={`banner turn ${banner.mine ? 'mine' : ''}`} data-testid="turn-banner" key={banner.id} role="status">
      <b className="banner-title">{banner.text}</b>
    </div>
  );
}
