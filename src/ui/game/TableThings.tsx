// The table around the sea (A5, V1b): the things in the shade by its edges and the measure of the water for the weather.
import { useLayoutEffect, useRef } from 'react';
import { tableThings } from './art/table';

const THINGS = tableThings();

/** «Вещи на столе»: one picture of 1366×660 behind the table, scaled to the window (cut at the edges, never squeezed). */
export function TableThings() {
  return (
    <svg className="table-things" aria-hidden="true" viewBox="0 0 1366 660" preserveAspectRatio="xMidYMid slice" dangerouslySetInnerHTML={{ __html: THINGS }} />
  );
}

/**
 * «Фон под рукой: Палуба» (rig, г): a strip of the deck under the hand — the cards and their tabs on a laptop, the whole bottom
 * panel on a phone. It lies under «Вещи на столе» (they and the compass stay over it) and under the board; its place is
 * measured from the hand, so it follows the layout at any width. `look` is false for «Стол капитана»: nothing is drawn.
 */
export function HandDeck({ look }: { look: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const watched = useRef<{ game: HTMLElement; hand: HTMLElement; ro: ResizeObserver } | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const game = el?.parentElement ?? null;
    const hand = game?.querySelector<HTMLElement>('.hand-row > .hand') ?? null;
    const w = watched.current;
    if (w && w.game === game && w.hand === hand) return;
    w?.ro.disconnect();
    watched.current = null;
    if (!el || !game || !hand || typeof ResizeObserver === 'undefined') {
      if (el) el.style.display = 'none';
      return;
    }
    const measure = () => {
      const g = game.getBoundingClientRect(),
        h = hand.getBoundingClientRect();
      const phone = getComputedStyle(game).getPropertyValue('--phone').trim() === '1' || g.width < 701;
      el.style.display = '';
      el.classList.toggle('phone', phone);
      // a phone: the whole bottom panel, edge to edge; a laptop: the hand (the tabs and the cards) with a margin, down to the edge
      el.style.left = `${phone ? 0 : Math.max(0, h.left - g.left - 8)}px`;
      el.style.width = `${phone ? g.width : h.width + 16}px`;
      el.style.top = `${Math.max(0, h.top - g.top - 6)}px`;
      el.style.height = `${Math.max(0, g.bottom - h.top + 6)}px`;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(game);
    ro.observe(hand);
    watched.current = { game, hand, ro };
  });
  useLayoutEffect(() => () => watched.current?.ro.disconnect(), []);
  return look ? <div className="hand-deck" ref={ref} aria-hidden="true" data-testid="hand-deck" /> : null;
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
