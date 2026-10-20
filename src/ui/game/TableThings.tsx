// The table around the sea (A5, V1b): the things in the shade by its edges and the measure of the water for the weather.
import { useLayoutEffect, useRef, useState } from 'react';
import { DECK_TILE_H, DECK_TILE_URL, DECK_TILE_W } from './art/deckTile';
import grate from './art/rig/deck-grate.svg';
import cannon from './art/rig/deck-cannon.svg';
import ballsArt from './art/rig/deck-balls.svg';
import lanternArt from './art/rig/deck-lantern.svg';
import coilArt from './art/rig/deck-coil.svg';
import ink from './art/rig/prop-ink.svg';
import candle from './art/rig/prop-candle.svg';
import { tableThings, wheelSvg } from './art/table';
import { stageK } from '../stage';

const THINGS = tableThings();
const WHEEL = wheelSvg();

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
 * «Палуба»: deckScene3(W, H, L) of A5Rig over the whole table, as pieces of the scene (art/rig/deck-*.svg, made by the reference's
 * own grating / cannon2 / balls / LANTERN; vb — the box of each in its own units) on the planks of deck() (a tile). The deck is a
 * background. A laptop: the gun (1.6; 1.2 times larger on a window taller than 900 px, as the cards) stands with its right at
 * R — 16 px before «Ход окончен» + «Отменить», its balls at the wheel, the lantern (1.3) over the breech; the hand stands in the
 * middle of the strip from L (24 px right of the Hold, the hourglass and «Перестроение») to the gun − 16 (Hand.tsx useFanFit
 * reads the paddings of .hand-cards and closes the step of the fan when the cards do not fit), whole in the window; its tabs
 * begin over its first card, the grating lies over its middle. A phone (a5-phone): a big gun (70 % of the width) is the background behind
 * the row of the Hold, its muzzle in the gap between «2/8» and «Перестроение»; the lantern hangs on the bottom right corner of the
 * frame of the sea, over the table, its light falls down on the gun and «Перестроение».
 */
const PIECES = {
  grate: { src: grate, vb: [-7, -7, 354, 38] },
  cannon: { src: cannon, vb: [-3, 11, 128, 56] },
  balls: { src: ballsArt, vb: [-25, -35, 69, 55] },
  lantern: { src: lanternArt, vb: [-10, -3, 50, 59] },
  coil: { src: coilArt, vb: [-41, -18, 70, 46] },
} as const;
type PieceKey = keyof typeof PIECES;
/** A phone: the iron hook in a beam the lantern hangs on, and its short chain (stretched to the height of its box). */
const HOOK_SVG =
  '<svg width="100%" height="100%" viewBox="0 0 12 30" preserveAspectRatio="none" aria-hidden="true"><circle cx="6" cy="2.4" r="2" fill="#2a2420" stroke="#0e0b09" stroke-width=".6"/><path d="M6 4 V24" stroke="#3a322c" stroke-width="1.6" stroke-dasharray="2.4 1.2"/><path d="M6 23 Q9.4 25 8.4 28 Q7 30.4 4.4 29" fill="none" stroke="#2a2420" stroke-width="1.6" stroke-linecap="round"/></svg>';

/** The light of the lantern reaches R (the values of the user for the whole table). */
const LIGHT_R = { laptop: 380, phone: 220 } as const;
/** The scales of the gun and the lantern on a laptop (1366×660). */
const GUN_S = 1.6,
  LANTERN_S = 1.3;

interface PieceBox extends Box {
  key: PieceKey;
  flip?: boolean;
}
interface DeckPlace {
  phone: boolean;
  W: number;
  H: number;
  pieces: PieceBox[];
  lx: number;
  ly: number;
  ls: number;
  /** A laptop: the paddings that put the hand in the middle of its strip (in the px of the zoomed row), the room under the
   *  cards, the indent of the tabs (the left of the first card) and the larger hand of a tall window. */
  hand?: { pl: number; pr: number; lift: number; tabs: number };
  /** A phone: the hook the lantern hangs on. */
  hook?: Box;
  /** A phone: the warm glint of the lantern on the barrel of the gun. */
  glint?: Box;
}

const visible = (game: HTMLElement, q: string) => Array.from(game.querySelectorAll(q)).find((e) => e.getBoundingClientRect().width > 0) ?? null;

/** A piece of the scene drawn with its origin at (x, y) and the scale s: its box on the window. */
const pieceAt = (key: PieceKey, x: number, y: number, s: number): PieceBox => {
  const vb = PIECES[key].vb;
  return { key, l: x + vb[0] * s, t: y + vb[1] * s, w: vb[2] * s, h: vb[3] * s };
};
/** The lantern with its centre (the flame) at (lx, ly): deckScene3 puts LANTERN at (lx − 15·ls, ly − 18·ls). */
const lanternAt = (lx: number, ly: number, ls: number) => pieceAt('lantern', lx - 15 * ls, ly - 18 * ls, ls);

/** Where the pieces of the deck stand on this window. */
function deckPlace(game: HTMLElement): DeckPlace | null {
  const g = game.getBoundingClientRect();
  const H = g.height / stageK(),
    W = g.width / stageK();
  const hand = rect(game.querySelector('.hand-row > .hand'), g);
  const cardsBox = rect(game.querySelector('.hand-cards'), g);
  const cards = Array.from(game.querySelectorAll('.hand-cards .hcard')).map((c) => rect(c, g)).filter((c): c is Box => !!c);
  if (!hand) return null;
  if (W < 701) {
    // a big gun, 70 % of the width, behind the row of the Hold — the lowest layer: the frame of the sea, the tray, «2/8»,
    // «Перестроение», the caption of the hand and the cards lie over it. Its muzzle (x 119 of the drawing, the barrel y 15–33) looks
    // out of the gap between «2/8» and «Перестроение», the barrel on the middle of the row; the box is (x − 3·gs, y + 11·gs, 128·gs, 56·gs).
    const gs = (0.7 * W) / 128;
    const row = rect(game.querySelector('.board-bottom > .team-row:not(.table-edge)'), g);
    const count = rect(visible(game, '.board-bottom > .team-row .hold-n'), g);
    const regroup = rect(visible(game, '.board-bottom > .team-row .regroup'), g);
    const gapX = count && regroup ? (count.l + count.w + regroup.l) / 2 + 4 : W * 0.65;
    const rowY = row ? row.t + row.h / 2 : hand.t;
    const gun = pieceAt('cannon', gapX - 119 * gs, rowY - 24 * gs, gs);
    // the balls at the bottom left of the gun, by its rear wheel, inside the window (phone.css dims them: the caption lies over them)
    const bs = gs * 0.45;
    const balls = pieceAt('balls', Math.max(4, gun.l + 6 * gs) + 25 * bs, gun.t + gun.h - 2 - 20 * bs, bs);
    // the lantern hangs on the bottom right corner of the frame of the sea, a little over the frame, over all of the table: right of the
    // plank «Месть» and above «Перестроение», as large as that corner allows (its box 50·ls × 59·ls round the flame at (lx, ly − 3·ls))
    const sea = rect(game.querySelector('.sea-table'), g);
    const plank = rect(game.querySelector('.planks.bottom > .plank:last-child'), g);
    const right = Math.min(W - 1, sea ? sea.l + sea.w + 6 : W - 1);
    const left = plank ? plank.l + plank.w + 1 : right - 20;
    const top = plank ? plank.t + plank.h - 4 : (sea ? sea.t + sea.h - 22 : hand.t - 40);
    const bottom = regroup ? regroup.t - 1 : top + 26;
    const ls = Math.max(0.24, Math.min((right - left) / 50, (bottom - top) / 59, gun.w / 2.6 / 50));
    const lx = (left + right) / 2,
      ly = bottom - 38 * ls;
    const lantern = lanternAt(lx, ly, ls);
    const hook = { l: lx - 4, t: lantern.t - 9, w: 8, h: 11 };
    // the warm glint on the top of the barrel, towards the muzzle (the lantern is to the right)
    const glint = { l: gun.l + 66 * gs, t: gun.t + 3 * gs, w: 54 * gs, h: 7 * gs };
    return { phone: true, W, H, pieces: [gun, balls, lantern], lx, ly, ls, hook, glint };
  }
  const end = rect(visible(game, '[data-testid="end-turn"]'), g);
  const undo = rect(visible(game, '.log-col .undo'), g);
  if (!end || !cardsBox) return null;
  // L — right of «Трюм + часы + Перестроение» + 24; R — left of «Ход окончен» + «Отменить» − 16
  const L = rightOf(game.querySelector('.board-bottom > .team-row:not(.table-edge)'), g) + 24;
  const R = Math.min(end.l, undo ? undo.l : end.l) - 16;
  // (a large window is the whole screen scaled, stage.ts: here the table is always of the laptop's size)
  const f = 1;
  const gs = GUN_S * f;
  // the gun at R, on the bottom of the table
  const gun = pieceAt('cannon', R - 125 * gs, H - 4 - 67 * gs, gs);
  // the balls before the front wheel, on the floor
  const balls = pieceAt('balls', gun.l + 25 * f, H - 4 - 20 * f, f);
  // the lantern stands over the breech (the right end of the barrel), its flame well above the gun
  const lsc = LANTERN_S * f;
  const lx = gun.l + gun.w - 34 * lsc,
    ly = gun.t + 6 * gs - 38 * lsc;
  const lantern = lanternAt(lx, ly, lsc);
  // the strip of the hand: from L to the gun − 16; the hand stands in its middle (.hand-cards: padding + justify-content: center)
  const stripL = L,
    stripR = gun.l - 16;
  const mid = (stripL + stripR) / 2;
  // the grating — thin, 340×24 — over the middle of the hand
  const grateP = pieceAt('grate', mid - 170, hand.t - 6, 1);
  // the coil (coil(…, 2.6, 1.2, 4.2) of the reference) in the bottom left corner — the same place and size in any turn: under
  // «Перестроение», 186 px right of its left edge (right of the longest «Колода · Сброс · сыграно»), 1.8 of the reference's 2.6,
  // one scale for x and y; the first card may lie over its right edge a little, its bottom may go past the edge of the window
  const regroupEl = rect(visible(game, '.board-bottom .regroup'), g);
  const coilL = (regroupEl ? regroupEl.l : 12) + 186;
  const coilTop = (regroupEl ? regroupEl.t + regroupEl.h : H - 40) + 4;
  const cs = 1.8 / 2.6;
  const coilP = pieceAt('coil', coilL + 41 * cs, coilTop + 18 * cs, cs);
  // every card whole in the window: the lowest point of the fan ≥ 4 px above the edge (the padding under the cards)
  const lowest = cards.length ? Math.max(...cards.map((c) => c.t + c.h)) : 0;
  const curLift = (parseFloat(game.style.getPropertyValue('--deck-lift')) || 0) * f;
  const lift = Math.max(0, curLift + (lowest ? lowest - (H - 4) : 0));
  const first = cards.length ? Math.min(...cards.map((c) => c.l)) : stripL;
  return {
    phone: false,
    W,
    H,
    pieces: [grateP, coilP, gun, balls, lantern],
    lx,
    ly,
    ls: lsc,
    // (26 px in from each end: a tilted card of the fan reaches past its own box, and the last card keeps ≥ 24 px from the gun)
    hand: { pl: (stripL + 26 - cardsBox.l) / f, pr: (cardsBox.l + cardsBox.w - stripR + 26) / f, lift: lift / f, tabs: first - hand.l },
  };
}

/**
 * The light of the lantern. Its gradients are objectBoundingBox ones on the W×H rect of the scene, so their circles are ellipses
 * squeezed by H/W, as in the reference; the values the user gave for the whole table: the darkness #000 0 → .16 at .55 → .42,
 * radius 1.6R; the light #ffc062 .85 → #ff9a30 .3 at .45 → 0, radius R, screen; a warm wash #ffd9a0 .05 over the table, screen;
 * a circle r 150 of gFlash at .2 round the lantern, screen; the flare at the glass r 46·ls flickers within .44–.62.
 */
function DeckLight({ x, y, r, ls, sq }: { x: number; y: number; r: number; ls: number; sq: number }) {
  const at = (rr: number) => `${rr}px ${rr * sq}px at ${x}px ${y}px`;
  const fr = 46 * ls;
  return (
    <>
      <i className="deck-dark" style={{ background: `radial-gradient(${at(1.6 * r)}, rgba(0,0,0,0), rgba(0,0,0,.16) 55%, rgba(0,0,0,.42))` }} />
      <i className="deck-light" style={{ background: `radial-gradient(${at(r)}, rgba(255,192,98,.85), rgba(255,154,48,.3) 45%, rgba(255,154,48,0))` }} />
      <i className="deck-light deck-wash" />
      <i className="deck-glow" style={{ left: x - 150, top: y - 150, width: 300, height: 300 }} />
      <i className="deck-flare table" data-testid="lantern-light" style={{ left: x - fr, top: y - fr, width: 2 * fr, height: 2 * fr }} />
    </>
  );
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

/** The box of an element in the px of the stage (stage.ts), from the corner of the game. */
const rect = (e: Element | null, g: DOMRect): Box | null => {
  if (!e) return null;
  const b = e.getBoundingClientRect(),
    k = stageK();
  return b.width > 0 && b.height > 0 ? { l: (b.left - g.left) / k, t: (b.top - g.top) / k, w: b.width / k, h: b.height / k } : null;
};

/** The right edge of an element and of everything in it (the Hold has the hourglass and «Перестроение»). */
function rightOf(e: Element | null, g: DOMRect): number {
  let r = 0;
  if (!e) return r;
  for (const x of [e, ...Array.from(e.querySelectorAll('*'))]) {
    const b = x.getBoundingClientRect();
    if (b.width > 0 && b.height > 0) r = Math.max(r, b.right - g.left);
  }
  return r / stageK();
}

/** R — right of the cards of the hand up to the log column (a laptop): the inkwell and the candle of the captain's table. */
function freeRight(game: HTMLElement): Box | null {
  const g = game.getBoundingClientRect();
  if (g.width / stageK() < 701) return null;
  const hand = rect(game.querySelector('.hand-row > .hand'), g);
  const log = rect(game.querySelector('.log-col'), g);
  let cardsRight = 0;
  game.querySelectorAll('.hand-cards .hcard').forEach((c) => (cardsRight = Math.max(cardsRight, (c.getBoundingClientRect().right - g.left) / stageK())));
  const R = hand && log && cardsRight ? { l: cardsRight + 10, t: hand.t + 36, w: log.l - 10 - (cardsRight + 10), h: g.height / stageK() - 6 - (hand.t + 36) } : null;
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
  const [wheel, setWheel] = useState<{ x: number; y: number } | null>(null);
  const watched = useRef<{ game: HTMLElement; ro: ResizeObserver; mo: MutationObserver; off: () => void } | null>(null);
  useLayoutEffect(() => {
    const game = wrap.current?.parentElement ?? null;
    const w = watched.current;
    if (w && w.game === game) return;
    w?.ro.disconnect();
    w?.mo.disconnect();
    w?.off();
    watched.current = null;
    if (!game || typeof ResizeObserver === 'undefined') return;
    const measure = () => {
      if (look === 'deck') {
        const d = deckPlace(game);
        setDeck((old) => (old && d && JSON.stringify(old) === JSON.stringify(d) ? old : d));
        // the hand in the middle of its strip (paddings of .hand-cards, read by useFanFit), whole in the window, its tabs over it
        const hd = d?.hand;
        // set only what changed: the observer below watches the style attributes too
        const put = (k: string, v: number) => {
          if (game.style.getPropertyValue(k) !== `${v}px`) game.style.setProperty(k, `${v}px`);
        };
        put('--deck-pl', hd ? Math.max(0, Math.round(hd.pl)) : 0);
        put('--deck-pr', hd ? Math.max(0, Math.round(hd.pr)) : 0);
        put('--deck-lift', hd ? Math.round(hd.lift) : 0);
        put('--deck-tabs', hd ? Math.round(hd.tabs) : 0);
        // a phone: the warm light of the lantern over the fan (phone.css)
        put('--lamp-x', d ? Math.round(d.lx) : 0);
        put('--lamp-y', d ? Math.round(d.ly) : 0);
        setPlaced([]);
        return;
      }
      // the wheel (rig, е): under «Перестроение», its lower half past the edge of the window
      const g = game.getBoundingClientRect();
      const rg = rect(visible(game, '.board-bottom .regroup'), g);
      setWheel(rg && g.width / stageK() > 700 ? { x: rg.l + rg.w / 2, y: rg.t + rg.h + 6 } : null);
      const R = freeRight(game);
      const next = R ? [fit('candle', R, [0.55, 0.02, 0.45, 0.5]), fit('ink', R, [0.55, 0.55, 0.45, 0.42])].filter((x): x is Placed => !!x) : [];
      setPlaced((old) => (old.length === next.length && old.every((o, i) => o.key === next[i].key && Math.abs(o.l - next[i].l) < 1 && Math.abs(o.t - next[i].t) < 1) ? old : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(game);
    game.querySelectorAll('.hand-cards, .log-col, .team-row, .sea-table').forEach((e) => ro.observe(e));
    // the hand grows and shrinks card by card, the fan tilts its cards (their inline --r/--dy): look again when they change
    // (and once more when the cards have moved: they glide to their places in .18 s, game.css .hcard transition)
    let again = 0;
    const mo = new MutationObserver(() => {
      measure();
      clearTimeout(again);
      again = window.setTimeout(measure, 260);
    });
    mo.observe(game, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
    // a card that glided to its place in the fan (the transitions of .hcard) — measure the fan where it came to rest
    const settled = (e: TransitionEvent) => {
      if ((e.target as Element).classList?.contains('hcard')) measure();
    };
    game.addEventListener('transitionend', settled);
    watched.current = { game, ro, mo, off: () => game.removeEventListener('transitionend', settled) };
  });
  useLayoutEffect(
    () => () => {
      watched.current?.ro.disconnect();
      watched.current?.mo.disconnect();
      watched.current?.off();
    },
    [],
  );
  const candlePlace = placed.find((x) => x.key === 'candle');
  return (
    <div ref={wrap} className={`backdrop look-${look}`} aria-hidden="true" data-testid="backdrop">
      {look === 'deck' ? (
        <>
          {/* the planks of deck() on the whole window, with its vignette (gVig) */}
          <div className="deck-bg" style={{ backgroundImage: DECK_TILE_URL, backgroundSize: `${DECK_TILE_W}px ${DECK_TILE_H}px` }} />
          {deck?.pieces
            .filter((p) => p.key !== 'lantern')
            .map((p) => (
              <img key={p.key} className={`deck-piece ${p.flip ? 'flip' : ''}`} data-piece={p.key} src={PIECES[p.key].src} alt="" draggable={false} style={{ left: p.l, top: p.t, width: p.w, height: p.h }} />
            ))}
          {deck && <DeckLight x={deck.lx} y={deck.ly} r={LIGHT_R[deck.phone ? 'phone' : 'laptop']} ls={deck.ls} sq={deck.H / deck.W} />}
          {deck?.glint && <i className="deck-glint" style={{ left: deck.glint.l, top: deck.glint.t, width: deck.glint.w, height: deck.glint.h }} />}
          {deck?.hook && <i className="deck-hook" style={{ left: deck.hook.l, top: deck.hook.t, width: deck.hook.w, height: deck.hook.h }} dangerouslySetInnerHTML={{ __html: HOOK_SVG }} />}
          {deck?.pieces
            .filter((p) => p.key === 'lantern')
            .map((p) => (
              <img key="lantern" className="deck-piece" data-piece="lantern" src={PIECES.lantern.src} alt="" draggable={false} style={{ left: p.l, top: p.t, width: p.w, height: p.h }} />
            ))}
        </>
      ) : (
        <>
          <TableThings />
          {wheel && <i className="table-wheel" data-testid="table-wheel" style={{ left: wheel.x - 60, top: wheel.y }} dangerouslySetInnerHTML={{ __html: WHEEL }} />}
        </>
      )}
      {placed.map((p) => (
        <img key={p.key} className="prop" data-prop={p.key} src={PROPS[p.key].src} alt="" draggable={false} style={{ left: p.l, top: p.t, width: p.w, height: p.h }} />
      ))}
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
      const k = stageK();
      board.style.setProperty('--sea-t', `${Math.round((r.top - b.top) / k)}px`);
      board.style.setProperty('--sea-l', `${Math.round((r.left - b.left) / k)}px`);
      board.style.setProperty('--sea-r', `${Math.round((b.right - r.right) / k)}px`);
      board.style.setProperty('--sea-b', `${Math.round((b.bottom - r.bottom) / k)}px`);
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
