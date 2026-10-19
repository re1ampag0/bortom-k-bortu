// The table around the sea (A5, V1b): the things in the shade by its edges and the measure of the water for the weather.
import { useLayoutEffect, useRef, useState } from 'react';
import { DECK_TILE_H, DECK_TILE_URL, DECK_TILE_W } from './art/deckTile';
import sceneLaptop from './art/rig/deck-scene-laptop.svg';
import scenePhone from './art/rig/deck-scene-phone.svg';
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

/** The props of the captain's table of A5Rig (art/rig/prop-*.svg, captainTable): the size of the picture in px. */
const PROPS = {
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

/**
 * The deck scene of A5Rig, «Фон под рукой» (deckScene3 with the parameters of the reference, the very SVG — art/rig/deck-scene-*.svg):
 * A — a laptop, 720×230, Б — a phone, 430×260; where its lantern burns and how far its light reaches (viewBox px).
 */
const SCENE = {
  laptop: { src: sceneLaptop, w: 720, h: 230, lx: 640, ly: 92, r: 260 },
  phone: { src: scenePhone, w: 430, h: 260, lx: 382, ly: 64, r: 220 },
} as const;
/** The card of the hand in the reference is 150 px high: the scene is scaled as the cards of the game are. */
const REF_CARD_H = 150;

interface DeckPlace {
  kind: 'laptop' | 'phone';
  k: number;
  l: number;
  t: number;
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

/** The right edge of an element and of everything in it (the Hold has «Перестроение» and the hourglass beside it). */
function rightOf(e: Element | null, g: DOMRect): number {
  let r = 0;
  if (!e) return r;
  for (const x of [e, ...Array.from(e.querySelectorAll('*'))]) {
    const b = x.getBoundingClientRect();
    if (b.width > 0 && b.height > 0) r = Math.max(r, b.right - g.left);
  }
  return r;
}

/**
 * Where the deck scene lies. A laptop: under the hand, scaled as the cards are (the card of the reference is 150 px), not taller
 * than the room under the sea; pressed to the right, so its lantern, keg and coil stand right of the cards, never under the Hold
 * or the log column; its bottom on the edge of the window. A phone: scene Б the width of the screen, at the bottom (the panel).
 */
function deckPlace(game: HTMLElement): DeckPlace | null {
  const g = game.getBoundingClientRect();
  if (g.width < 701) {
    const k = g.width / SCENE.phone.w;
    return { kind: 'phone', k, l: 0, t: g.height - SCENE.phone.h * k };
  }
  const card = game.querySelector('.hand-cards .hcard');
  const sea = rect(game.querySelector('.sea-table'), g);
  const log = rect(game.querySelector('.log-col'), g);
  if (!card || !sea || !log) return null;
  const holdRight = rightOf(game.querySelector('.board-bottom > .team-row:not(.table-edge)'), g);
  const room = log.l - 8 - (holdRight + 8);
  const k = Math.min(card.getBoundingClientRect().height / REF_CARD_H, (g.height - (sea.t + sea.h)) / SCENE.laptop.h, room / SCENE.laptop.w);
  if (k <= 0.3) return null;
  return { kind: 'laptop', k, l: Math.max(holdRight + 8, log.l - 8 - SCENE.laptop.w * k), t: g.height - SCENE.laptop.h * k };
}

/** R — right of the cards of the hand up to the log column (a laptop): the inkwell and the candle of the captain's table. */
function freeRight(game: HTMLElement): Box | null {
  const g = game.getBoundingClientRect();
  if (g.width < 701) return null;
  const hand = rect(game.querySelector('.hand-row > .hand'), g);
  const log = rect(game.querySelector('.log-col'), g);
  let cardsRight = 0;
  game.querySelectorAll('.hand-cards .hcard').forEach((c) => (cardsRight = Math.max(cardsRight, c.getBoundingClientRect().right - g.left)));
  const R = hand && log && cardsRight ? { l: cardsRight + 10, t: hand.t + 36, w: log.l - 10 - (cardsRight + 10), h: g.height - 6 - (hand.t + 36) } : null;
  return R && R.w > 60 && R.h > 80 ? R : null;
}

/**
 * The background of the table (rig, г, «Фон под рукой»). «Палуба»: the deck scene of A5Rig as it is (planks with nails, the hatch
 * grating, the gun with its pile of balls, the lantern and its light, the keg, the coil) under the hand — the cards lie on it — and
 * the planks of the same scene as a seamless tile on all the rest of the window; the warm light of the lantern falls on the planks
 * and the edges of the cards and breathes (still with «простые спецэффекты»); no «Вещи на столе». A phone: scene Б at the bottom
 * panel, the planks on the whole screen. «Стол капитана»: the table with its things (the compass among them) and, from the
 * captain's variant of the reference, the inkwell with a quill and the candle.
 */
export function TableBackdrop({ look }: { look: 'deck' | 'table' }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [deck, setDeck] = useState<DeckPlace | null>(null);
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
      if (look === 'deck') {
        const d = deckPlace(game);
        setDeck((old) => (old && d && old.kind === d.kind && Math.abs(old.k - d.k) < 0.002 && Math.abs(old.l - d.l) < 0.5 && Math.abs(old.t - d.t) < 0.5 ? old : d));
        setPlaced([]);
        return;
      }
      const R = freeRight(game);
      const next = R ? [fit('candle', R, [0.55, 0.02, 0.45, 0.5]), fit('ink', R, [0.55, 0.55, 0.45, 0.42])].filter((x): x is Placed => !!x) : [];
      setPlaced((old) => (old.length === next.length && old.every((o, i) => o.key === next[i].key && Math.abs(o.l - next[i].l) < 1 && Math.abs(o.t - next[i].t) < 1) ? old : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(game);
    game.querySelectorAll('.hand-cards, .log-col, .team-row, .sea-table').forEach((e) => ro.observe(e));
    // the hand grows and shrinks card by card: look again when the cards change
    const mo = new MutationObserver(measure);
    mo.observe(game, { childList: true, subtree: true });
    watched.current = { game, ro, mo };
  });
  useLayoutEffect(
    () => () => {
      watched.current?.ro.disconnect();
      watched.current?.mo.disconnect();
    },
    [],
  );
  const candlePlace = placed.find((x) => x.key === 'candle');
  const sc = deck && SCENE[deck.kind];
  return (
    <div ref={wrap} className={`backdrop look-${look}`} aria-hidden="true" data-testid="backdrop">
      {look === 'deck' ? (
        <>
          {/* the planks of the scene, at its scale and in its rows, on the whole window */}
          <div
            className="deck-bg"
            style={{
              backgroundImage: DECK_TILE_URL,
              backgroundSize: `${DECK_TILE_W * (deck?.k ?? 1)}px ${DECK_TILE_H * (deck?.k ?? 1)}px`,
              backgroundPosition: deck ? `${deck.l}px ${deck.t}px` : '0 0',
            }}
          />
          {deck && sc && (
            <img
              className={`deck-scene ${deck.kind}`}
              data-testid="deck-scene"
              src={sc.src}
              alt=""
              draggable={false}
              style={{ left: deck.l, top: deck.t, width: sc.w * deck.k, height: sc.h * deck.k }}
            />
          )}
        </>
      ) : (
        <TableThings />
      )}
      {placed.map((p) => (
        <img key={p.key} className="prop" data-prop={p.key} src={PROPS[p.key].src} alt="" draggable={false} style={{ left: p.l, top: p.t, width: p.w, height: p.h }} />
      ))}
      {deck && sc && look === 'deck' && (
        <i className="lantern-light" data-testid="lantern-light" style={{ left: deck.l + sc.lx * deck.k, top: deck.t + sc.ly * deck.k, width: 2 * sc.r * deck.k, height: 2 * sc.r * deck.k }} />
      )}
      {candlePlace && look === 'table' && <i className="lantern-light candle" style={{ left: candlePlace.l + candlePlace.w / 2, top: candlePlace.t + candlePlace.h * 0.25, width: 260, height: 260 }} />}
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
