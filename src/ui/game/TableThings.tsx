// The table around the sea (A5, V1b): the things in the shade by its edges and the measure of the water for the weather.
import { useLayoutEffect, useRef, useState } from 'react';
import { DECK_TILE_URL } from './art/deckTile';
import grate from './art/rig/prop-grate.svg';
import cannon from './art/rig/prop-cannon.svg';
import balls from './art/rig/prop-balls.svg';
import keg from './art/rig/prop-keg.svg';
import coil from './art/rig/prop-coil.svg';
import lantern from './art/rig/prop-lantern.svg';
import ink from './art/rig/prop-ink.svg';
import candle from './art/rig/prop-candle.svg';
import { tableThings } from './art/table';

const THINGS = tableThings();

/** «Вещи на столе»: one picture of 1366×660 behind the table, scaled to the window (cut at the edges, never squeezed). */
export function TableThings() {
  return (
    <svg className="table-things" aria-hidden="true" viewBox="0 0 1366 660" preserveAspectRatio="xMidYMid slice" dangerouslySetInnerHTML={{ __html: THINGS }} />
  );
}

/** The props of A5Rig, «Фон под рукой» (art/rig/prop-*.svg): the size of the picture in px, so a prop keeps its shape when it is fitted. */
const PROPS = {
  grate: { src: grate, w: 234, h: 74 },
  cannon: { src: cannon, w: 128, h: 56 },
  balls: { src: balls, w: 82, h: 62 },
  keg: { src: keg, w: 31, h: 41 },
  coil: { src: coil, w: 113, h: 73 },
  lantern: { src: lantern, w: 30, h: 54 },
  ink: { src: ink, w: 44, h: 66 },
  candle: { src: candle, w: 38, h: 61 },
} as const;
type PropKey = keyof typeof PROPS;
interface Box {
  l: number;
  t: number;
  w: number;
  h: number;
}
interface Placed extends Box {
  key: PropKey;
}

/** A prop fitted (centred, not larger than 1.4× its own size) into a fraction [x, y, w, h] of a free region of the table. */
function fit(key: PropKey, reg: Box, f: [number, number, number, number]): Placed | null {
  const bw = reg.w * f[2],
    bh = reg.h * f[3];
  const p = PROPS[key];
  const k = Math.min(bw / p.w, bh / p.h, 1.4);
  if (k < 0.4) return null;
  const w = p.w * k,
    h = p.h * k;
  return { key, l: reg.l + reg.w * f[0] + (bw - w) / 2, t: reg.t + reg.h * f[1] + (bh - h) / 2, w, h };
}

const rect = (e: Element | null, g: DOMRect): Box | null => {
  if (!e) return null;
  const b = e.getBoundingClientRect();
  return b.width > 0 && b.height > 0 ? { l: b.left - g.left, t: b.top - g.top, w: b.width, h: b.height } : null;
};

/**
 * The free places by the edges of a laptop table where nothing stands: R — right of the cards of the hand up to the log column,
 * L — under the Hold and «Перестроение», T — in the top row between the hint plaque and the tools. Measured from the real
 * elements, so a prop never lies under the hand, the Hold, a button or the log (e2e «the props keep clear»).
 */
function freeRegions(game: HTMLElement): { R: Box | null; L: Box | null; T: Box | null } {
  const g = game.getBoundingClientRect();
  if (g.width < 701) return { R: null, L: null, T: null };
  const hand = rect(game.querySelector('.hand-row > .hand'), g);
  const log = rect(game.querySelector('.log-col'), g);
  let cardsRight = 0;
  game.querySelectorAll('.hand-cards .hcard').forEach((c) => (cardsRight = Math.max(cardsRight, c.getBoundingClientRect().right - g.left)));
  const R = hand && log && cardsRight ? { l: cardsRight + 10, t: hand.t + 36, w: log.l - 10 - (cardsRight + 10), h: g.height - 6 - (hand.t + 36) } : null;
  const holdEl = game.querySelector('.board-bottom > .team-row:not(.table-edge)');
  const hold = rect(holdEl, g);
  let holdBottom = hold ? hold.t + hold.h : 0;
  holdEl?.querySelectorAll('*').forEach((e) => (holdBottom = Math.max(holdBottom, e.getBoundingClientRect().bottom - g.top)));
  const L = hold && hand ? { l: hold.l, t: holdBottom + 4, w: hand.l - 10 - hold.l, h: g.height - 4 - (holdBottom + 4) } : null;
  const plaque = rect(game.querySelector('[data-fx-instruction]'), g);
  const tools = rect(game.querySelector('.log-tools'), g);
  const T = plaque && tools ? { l: plaque.l + plaque.w + 12, t: 5, w: tools.l - 12 - (plaque.l + plaque.w + 12), h: Math.max(0, plaque.t + plaque.h - 5) } : null;
  return { R: R && R.w > 60 && R.h > 80 ? R : null, L: L && L.w > 80 && L.h > 20 ? L : null, T: T && T.w > 70 && T.h > 24 ? T : null };
}

/**
 * The background of the table (rig, г, «Фон под рукой»). «Палуба»: the planks of A5Rig on the whole window as a seamless tile, a
 * vignette and the warm light of the lantern (it breathes; still with «простые спецэффекты»), the props of the deck (grating, gun with
 * a pile of balls, lantern, keg, coil) in the free places by the edges; no «Вещи на столе». «Стол капитана»: the table with its things
 * (the compass among them) and, from the captain's variant of the reference, the inkwell with a quill and the candle.
 */
export function TableBackdrop({ look }: { look: 'deck' | 'table' }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const watched = useRef<{ game: HTMLElement; ro: ResizeObserver; mo: MutationObserver } | null>(null);
  useLayoutEffect(() => {
    const game = wrap.current?.parentElement ?? null;
    const w = watched.current;
    if (w && w.game === game) return;
    w?.ro.disconnect();
    w?.mo.disconnect();
    watched.current = null;
    if (!game || typeof ResizeObserver === 'undefined') return;
    const measure = () => {
      const { R, L, T } = freeRegions(game);
      const list: (Placed | null)[] = [];
      if (look === 'deck') {
        list.push(T ? fit('grate', T, [0.1, 0, 0.8, 1]) : R && fit('grate', R, [0, 0, 1, 0.22]));
        if (R) list.push(fit('lantern', R, [0.04, T ? 0.02 : 0.26, 0.4, T ? 0.5 : 0.42]), fit('keg', R, [0.55, T ? 0.1 : 0.3, 0.4, 0.38]), fit('coil', R, [0.1, 0.7, 0.8, 0.3]));
        if (L) list.push(fit('cannon', L, [0, 0, 0.62, 1]), fit('balls', L, [0.64, 0, 0.36, 1]));
      } else if (R) list.push(fit('candle', R, [0.55, 0.02, 0.45, 0.5]), fit('ink', R, [0.55, 0.55, 0.45, 0.42]));
      setPlaced((old) => {
        const next = list.filter((x): x is Placed => !!x);
        const same = old.length === next.length && old.every((o, i) => o.key === next[i].key && Math.abs(o.l - next[i].l) < 1 && Math.abs(o.t - next[i].t) < 1 && Math.abs(o.w - next[i].w) < 1);
        return same ? old : next;
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(game);
    game.querySelectorAll('.hand-cards, .log-col, .team-row, .status-text').forEach((e) => ro.observe(e));
    // the hand grows and shrinks card by card: look again when the cards change
    const mo = new MutationObserver(measure);
    mo.observe(game, { childList: true, subtree: true });
    watched.current = { game, ro, mo };
  });
  useLayoutEffect(() => () => {
    watched.current?.ro.disconnect();
    watched.current?.mo.disconnect();
  }, []);
  const lantern = placed.find((x) => x.key === 'lantern') ?? placed.find((x) => x.key === 'candle');
  return (
    <div ref={wrap} className={`backdrop look-${look}`} aria-hidden="true" data-testid="backdrop">
      {look === 'deck' ? <div className="deck-bg" style={{ backgroundImage: DECK_TILE_URL }} /> : <TableThings />}
      {placed.map((p) => (
        <img key={p.key} className="prop" data-prop={p.key} src={PROPS[p.key].src} alt="" draggable={false} style={{ left: p.l, top: p.t, width: p.w, height: p.h }} />
      ))}
      {lantern && <i className="prop-glow" style={{ left: lantern.l + lantern.w / 2, top: lantern.t + lantern.h * 0.6 }} />}
    </div>
  );
}

/**
 * The weather of the round lies on the water only: the board gets the insets of the sea (--sea-t/r/b/l), .fx-weather
 * is cut by them (game.css). Measured again whenever the board or the sea changes size.
 */
export function useSeaClip() {
  const boardRef = useRef<HTMLElement>(null);
  const seaRef = useRef<HTMLDivElement>(null);
  const watched = useRef<{ board: HTMLElement; sea: HTMLElement; ro: ResizeObserver } | null>(null);
  // after every render: the board can be away (the curtain of a game on one screen) and come back as new elements
  useLayoutEffect(() => {
    const board = boardRef.current,
      sea = seaRef.current;
    const w = watched.current;
    if (w && w.board === board && w.sea === sea) return;
    w?.ro.disconnect();
    watched.current = null;
    if (!board || !sea || typeof ResizeObserver === 'undefined') return;
    const measure = () => {
      const b = board.getBoundingClientRect(),
        r = sea.getBoundingClientRect();
      board.style.setProperty('--sea-t', `${Math.round(r.top - b.top)}px`);
      board.style.setProperty('--sea-l', `${Math.round(r.left - b.left)}px`);
      board.style.setProperty('--sea-r', `${Math.round(b.right - r.right)}px`);
      board.style.setProperty('--sea-b', `${Math.round(b.bottom - r.bottom)}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(board);
    ro.observe(sea);
    watched.current = { board, sea, ro };
  });
  useLayoutEffect(() => () => watched.current?.ro.disconnect(), []);
  return [boardRef, seaRef] as const;
}
