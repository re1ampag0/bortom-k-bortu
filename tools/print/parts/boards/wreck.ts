// 03 — the back «Затонул» of a ship board, v3 (composition B «дно под толщей воды»): the ship lies wrecked on the sea floor
// in the lower part of the sheet, heeled and bow down, the keel and the bow buried in the sand that heaps along her side;
// the masts are snapped and the main top lies across the stern with its tip in the sand. One floor runs from the foot of
// the sheet to a hazy far edge; one light comes from above, a little from the left: the rays slant down to the right,
// caustics dance on the sand and on the hull, every thing on the floor lies on it and casts its shadow, far things fade
// into the water. The scene is one raster (soft light, blurs, the caustic noise); the plates are vector and hang over the
// water: the cartouche on ropes from the surface, the rules as a scroll on two rollers tied under the cartouche, the brass
// column «Капитан — на борту союзника» with the ship token and the two lines for the ally.
//
// The frame is shared by the four ships; per ship only SEA[key] changes (see Sea). The words are those of the old back
// (boards.json → frame.wreck and rules.md «Корабль тонет»), word for word. Every word is data-in="<its plate>"
// (tools/print/check-layout.ts). WRECK_CHECK (filled when a back is built, printed by check.ts) checks the physics: every
// thing lies on the sand, nothing overlaps the hull or another thing, the hull sits in the sand, the plates leave the
// hull free.
import { createRequire } from 'node:module';
import path from 'node:path';
import { ROOT, esc, fontCss, type Ctx } from '../../kit';
import { type Ship } from '../../layout';
import { DECK_KEY } from '../../colors';
import { rasterJpeg } from '../../map/raster';
import { iconSvg, type IconName, type IconTone } from '../icons';
import { TXT as FTXT, basePalette, jonesLine, md, measureMissing, noRef, rulesLine, rulesSection, widthOf, type Pal, type ShipKey, type ShipMaterial, type TO } from './frame';
import { LOOKS, defsOf, ico, text, type Look } from './v2';
import { emblemSvg } from './emblem';
import { PROP_DEFS, ageDefs, anemone, barnacle, charSvg, coralCrust, coralSprig, holeSvg, smallFan, tubeSponge, hullAgeDefs, jagLine, measureProps, placeProp, propIssues, propSvg, weed, type Kit, type Placed, type PropSpec, type WeedKind } from './wreck-props';

type P = [number, number];
interface Rect { x: number; y: number; w: number; h: number }
interface Box { x0: number; y0: number; x1: number; y1: number }
type KitFn = (u: string, L: unknown, o: Record<string, unknown>) => string;
const require = createRequire(import.meta.url);
const K = require(path.join(ROOT, 'tools/card-art/scenes/kit/index.cjs')) as Kit & {
  ship: KitFn;
  castShadow(u: string, L: unknown, o: { x: number; y: number; w: number; h: number; horizon: number; d?: number; opacity?: number }): string;
  makeLight(l: unknown, cam: { horizon: number }): unknown; LIGHTS: Record<string, { key: Record<string, unknown> } & Record<string, unknown>>;
  shipBox(kind: string, o: { x: number; y: number; scale: number }): { x0: number; x1: number; top: number; y: number; w: number; h: number };
  shipGeom(kind: string, o: Record<string, unknown>): { masts: { x: number; H: number; top: P }[]; nearRail(X: number): number[]; farRail(X: number): number[] };
  SHIP_SPECS: Record<string, { len: number; free: number; draft: number; over: number; bow: number[]; tw: number[]; masts: unknown[] }>;
};

// ---- the look of each ship's sea floor ----
/** a hole in the side: X — along the hull in kit units (minus — to the bow), t — its height (0 at the waterline, 1 at the
 *  near rail), r — its size in kit units; shot — an iron ball's hole with a splintered rim, breach — planks stove in over
 *  the frames, burn — burnt through, the edges charred */
interface Hole { X: number; t: number; r: number; kind: 'shot' | 'breach' | 'burn' }
/** how the ship died — each wreck its own picture: the mast kept up to its top (keep: its break is level, not jagged),
 *  the bowsprit snapped `sprit` kit units ahead of the stem, the stern castle fallen in aft of X = aft (kit units), the
 *  holes in the side, the hull charred (burnt 0..1; from charFrom — kit X — aft, the paint kept in patches before it),
 *  the paint washed out and peeling (fade), barnacles and weed on it (growth), the rags of the sails (rags: the length of
 *  their fringe; 0 — no cloth left, the stubs bare); slant — the masts broken off at a slant (snapped or burnt through),
 *  not jagged; yards — the masts that stand whole with their yards (cut only above `brk`); tear — the mast whose sail
 *  is half torn off and hangs from one yardarm; slack — how far the shrouds sag (1), torn — how many hang broken;
 *  rot — rotten gaps in the bulwark; split — the hull broken in two at X (kit units): the after part moved dx mm aft,
 *  dropped `drop` mm and turned `rot` degrees (+ — its stern down) about the keel at the break; drifts — banks of sand
 *  heaped against the side ([x mm, half-width, height]); reef — the hull grown into the floor: shells, corals and weed
 *  all over it, weed hanging from the yards (the Dutchman) */
interface Ruin {
  keep?: number; sprit?: number; aft?: number; holes?: Hole[]; burnt?: number; charFrom?: number; fade?: number; growth?: number; rags?: number;
  slant?: boolean; tent?: number; yards?: number[]; tear?: number; slack?: number; torn?: number; rot?: number;
  split?: { X: number; dx: number; drop: number; rot: number }; drifts?: [number, number, number][]; reef?: boolean;
  /** grime: a film of silt and growth dulling the whole hull, the paint's bands no more clean (0..1) */
  grime?: number;
}
interface Sea {
  /** the kit's light of the deck (LIGHTS key), turned to come from above, a little from the left */
  light: 'pearl' | 'revenge' | 'endeavour' | 'dutchman';
  /** the water: under the surface, mid-depth, at the floor */
  water: [string, string, string];
  /** the light from the surface (rays, caustics, bubbles, specks) and the strength of the rays */
  glow: string; rays: number;
  /** the water between the eye and the wreck: colour and strength; the lighter water behind the wreck (its silhouette reads) */
  haze: [string, number]; back: [string, number];
  /** a dark hull on dark water (the Revenge): a soft glow of lighter water right behind the hull, the hull darkened towards
   *  a silhouette and a rim of light along its upper edges (each colour, strength), so that it reads from afar */
  halo?: [string, number]; dark?: [string, number]; rim?: [string, number];
  /** the sand: lit crest, body, shade */
  sand: [string, string, string];
  /** fish colour and opacity; corals (muted: they are old and under water); weed; the rags of the sails */
  fish: [string, number]; coral: string[]; weed: string[]; rag: string;
  /** the far edge of the floor (mm): there the sand dissolves into the water */
  hz: number;
  /** the ship: the middle of its waterline (mm), scale, roll (kit, −20…20: minus — from the viewer, the bottom shows; plus —
   *  towards him, the deck shows), tilt (degrees, the bow down), the break of each mast (a share of its height), the fallen
   *  top of one mast (it lies from the deck to the floor on the side `side`, its tip on the sand at y = ty), the sand over
   *  the waterline at the bow and at the stern (mm; minus — under it); and how she died (Ruin) */
  ship: { x: number; y: number; scale: number; roll: number; tilt: number; brk: number[]; fall?: { mast: number; side: 1 | -1; ty: number; front?: boolean }; bow: number; stern: number } & Ruin;
  /** what lies on the floor (wreck-props.ts: each thing in the sand, its own set per ship) */
  props: PropSpec[]; seed: number;
}
const SHIP0 = { roll: -18, brk: [0.5, 0.56, 0.42], bow: 14, stern: -8, fade: 0.3, growth: 0.5, rags: 0.3 };
export const SEA: Record<ShipKey, Sea> = {
  // the Pearl went down by the head and lies on her side, the fouled bottom to us, her bow dug deep into the sand and the
  // stern up on a bank; the mainmast snapped above its top, the fore and the mizzen short thick stumps, the fore topmast
  // lying over the bow into the sand; the black paint washed grey and peeling to the wood, round-shot holes of every size
  // along her side, some with the planks stove out; the mainsail half torn off, hanging from one yardarm
  pearl: {
    light: 'pearl', water: ['#43769c', '#24486a', '#1d3852'], glow: '#c4e2ff', rays: 0.5, haze: ['#1c3c5a', 0.24], back: ['#4f86ac', 0.55],
    sand: ['#cbc3aa', '#968f7b', '#58574c'], fish: ['#a9c6dc', 0.62], coral: ['#7a6e86', '#6a7a8a', '#86707a'], weed: ['#3a5e52', '#4e6e5e', '#2e4a42'],
    rag: '#5a5a62', hz: 150,
    ship: {
      ...SHIP0, x: 196, y: 178, scale: 1.5, roll: -20, tilt: 15, brk: [0.2, 0.3, 0.24], bow: 26, stern: -5, sprit: 4, fall: { mast: 0, side: -1, ty: 175 },
      holes: [{ X: -25, t: 0.5, r: 1.9, kind: 'shot' }, { X: -14, t: 0.64, r: 2.8, kind: 'shot' }, { X: -4, t: 0.36, r: 1.4, kind: 'shot' }, { X: 6, t: 0.58, r: 2.4, kind: 'shot' },
        { X: 16, t: 0.4, r: 1.8, kind: 'shot' }, { X: 31, t: 0.45, r: 4.2, kind: 'breach' }],
      fade: 1, growth: 1, rags: 1, slant: false, tent: 6, tear: 1, slack: 2.2, torn: 3, rot: 6, drifts: [[150, 9, 5], [236, 12, 4]]
    },
    props: [
      // the far things by the hull: smaller, paler
      { kind: 'bottle', x: 50, y: 184, s: 0.8, rot: -16, sink: 0.4, name: 'rum bottle (upright)' },
      { kind: 'grapnel', x: 104, y: 186.5, s: 0.78, rot: 6, sink: 0.12, rests: true, name: 'grappling hook (resting on its prongs)' },
      { kind: 'canvas', x: 136, y: 189, s: 1.0, sink: 0.25, opt: { color: '#3a3a40' }, name: 'scrap of sail' },
      { kind: 'mastYard', x: 272, y: 190, s: 0.6, rot: 3, sink: 0.42, opt: { sail: '#3a3a40' }, name: 'mizzen top with its yard' },
      // the middle
      { kind: 'anchor', x: 28, y: 197, s: 0.95, rot: -2, sink: 0.15, rests: true, name: 'anchor (on its ring, stock and fluke)' },
      { kind: 'gun', x: 158, y: 198.5, s: 1.1, rot: -2, sink: 0.3, drift: -0.18, name: 'cannon' },
      { kind: 'carriage', x: 198, y: 196, s: 1.0, rot: 4, sink: 0.3, name: 'broken gun carriage' },
      { kind: 'keg', x: 246, y: 197.5, s: 0.62, rot: -3, sink: 0.3, opt: { kind: 'whole' }, drift: -0.2, name: 'rum cask' },
      // the near things: larger, clearer
      { kind: 'compass', x: 70, y: 205.5, s: 2.0, rot: -8, sink: 0.26, name: 'compass' },
      { kind: 'shotHeap', x: 99, y: 207.5, s: 1.2, sink: 0.22, opt: { n: 5 }, name: 'round shot' },
      { kind: 'pistol', x: 130, y: 207.5, s: 1.35, rot: 7, sink: 0.3, name: 'pistol' },
      { kind: 'mapCase', x: 178, y: 207, s: 1.45, rot: -5, sink: 0.25, name: 'map case' },
      { kind: 'grapnel', x: 222, y: 206, s: 1.15, rot: -6, sink: 0.12, rests: true, name: 'grappling hook (resting on its prongs)' },
      { kind: 'plank', x: 266, y: 206.5, s: 1.2, rot: 2, sink: 0.3, opt: { len: 30, th: 5 }, drift: 0.3, name: 'plank' }
    ], seed: 11
  },
  // (her water warm red-brown, the colour of her flag, darker with the depth)
  // the Revenge burnt and went down by the head: charred black from the waist aft (the red paint left in dull patches at
  // the bow), the stern castle fallen in with the sternpost standing up out of it, three burnt stumps of different heights
  // with slanting breaks, the mainmast's head with its yard fallen on the sand by the bow (a prop, not drawn off the
  // hull), long burn holes along her side; the bow and her head out of the sand, low banks along her side; one of each
  // thing on the floor (no two the same drawing), a piece of her red side among them
  revenge: {
    light: 'revenge', water: ['#a4583a', '#6a3022', '#461a12'], glow: '#ffcc96', rays: 0.42, haze: ['#501e14', 0.18], back: ['#c46a48', 0.58],
    halo: ['#e8a47c', 0.62], dark: ['#1a0c08', 0.42], rim: ['#ffd4a4', 0.9],
    sand: ['#dab08a', '#ac7c5c', '#66402e'], fish: ['#2a120c', 0.58], coral: ['#a8645a', '#b07a5e', '#8a5048'], weed: ['#5e5a2e', '#6e6a36', '#464222'],
    rag: '#3a1612', hz: 150,
    ship: {
      ...SHIP0, x: 178, y: 180, scale: 1.85, roll: 5, tilt: 5, brk: [0.27, 0.17, 0.13], bow: 7, stern: 1.5, sprit: 3, aft: 16,
      holes: [{ X: -10, t: 0.5, r: 2.6, kind: 'burn' }, { X: 4, t: 0.62, r: 2.0, kind: 'burn' }, { X: 13, t: 0.4, r: 1.6, kind: 'burn' }],
      burnt: 0.8, charFrom: -6, fade: 0.45, growth: 0.7, rags: 0, slant: true, rot: 7, drifts: [[112, 8, 4], [150, 7, 2.5], [190, 12, 4], [236, 8, 3]]
    },
    props: [
      // the far things: smaller, paler
      { kind: 'spar', x: 222, y: 193, s: 1.0, rot: -1, sink: 0.32, opt: { len: 38, th: 4.2, charred: true, rig: true }, name: 'bowsprit (snapped, charred)' },
      { kind: 'shotHeap', x: 186, y: 196.5, s: 0.9, sink: 0.3, opt: { n: 4 }, name: 'round shot' },
      { kind: 'firePot', x: 132, y: 195.5, s: 1.15, rot: -4, sink: 0.35, opt: { state: 'broken' }, name: 'broken fire pot' },
      { kind: 'sidePiece', x: 268, y: 197, s: 0.95, rot: 3, sink: 0.32, opt: { paint: '#7e2a1e', band: '#b08a44' }, drift: -0.25, name: 'piece of her side (red paint, a gun port)' },
      // the mainmast fell across the sand: its head with the yard, the sail burnt to a rag
      { kind: 'mastYard', x: 72, y: 195, s: 0.95, rot: -3, sink: 0.36, opt: { sail: '#2a1410' }, name: 'mainmast head with its yard (fallen)' },
      // the near things
      { kind: 'sabre', x: 30, y: 206, s: 1.15, rot: 116, sink: 0.34, stuck: true, name: 'sabre (stuck in the sand)' },
      { kind: 'chain', x: 66, y: 207, s: 1.45, sink: 0.4, opt: { pts: [[-13, 1.6], [-7, 0], [0, 0.8], [7, -0.4], [13, 1.4]] }, name: 'chain', drift: 0.25, driftH: 0.6 },
      { kind: 'skull', x: 92, y: 207, s: 1.45, rot: -8, sink: 0.32, name: 'skull' },
      { kind: 'firePot', x: 113, y: 205, s: 1.6, rot: 10, sink: 0.26, opt: { state: 'sealed' }, name: 'fire pot (sealed, its wick)' },
      { kind: 'firePot', x: 138, y: 208, s: 1.6, opt: { state: 'shards' }, sink: 0.32, name: 'fire pot shards' },
      { kind: 'keg', x: 166, y: 206.5, s: 1.3, rot: -2, sink: 0.22, opt: { kind: 'broken' }, name: 'powder keg (stove in)' },
      { kind: 'staves', x: 205, y: 207, s: 1.3, rot: 2, sink: 0.35, name: 'burst powder keg' },
      { kind: 'sabre', x: 236, y: 207.5, s: 1.0, rot: 9, sink: 0.24, name: 'sabre' },
      { kind: 'pistol', x: 272, y: 207.5, s: 1.3, rot: 6, sink: 0.3, name: 'pistol' }
    ], seed: 23
  },
  // the Endeavour blew up and broke her back: the after part torn off and settled stern down a span away, the decks
  // open at the break; the mainmast still stands whole with its yards and the rags of its sails, the foremast fell
  // by the bow (its topmast on the sand there), the mizzen snapped short; her cargo — the Company's crates, the gold —
  // spilled; one of each thing (no two the same drawing)
  endeavour: {
    light: 'endeavour', water: ['#86d0d2', '#3c94a4', '#1f6474'], glow: '#fffbe8', rays: 0.5, haze: ['#4a9cac', 0.15], back: ['#b4e6e6', 0.5],
    sand: ['#f8ecca', '#e3cea4', '#98846a'], fish: ['#f4c64c', 0.9], coral: ['#c8907a', '#c8a47a', '#a8808e'], weed: ['#5a8a4a', '#6a9a56', '#466e3c'],
    rag: '#a29a82', hz: 150,
    ship: {
      ...SHIP0, x: 194, y: 182, scale: 1.25, roll: -12, tilt: 6, brk: [0.3, 0.6, 0.22], bow: 14, stern: 3, sprit: 6,
      holes: [{ X: -24, t: 0.62, r: 1.5, kind: 'shot' }, { X: -12, t: 0.35, r: 2.6, kind: 'breach' }],
      fade: 1, growth: 1.3, rags: 1.2, yards: [1], slack: 1.6, torn: 2, rot: 8, grime: 0.14,
      split: { X: 18, dx: 13, drop: 2.5, rot: 13 }, drifts: [[176, 9, 4]]
    },
    props: [
      // the far things
      { kind: 'keg', x: 34, y: 186.5, s: 0.7, rot: -8, sink: 0.3, opt: { kind: 'whole' }, name: 'cask', drift: -0.25 },
      // the foremast fell across the bow: its topmast lies on the sand by the stem, a few ends of its rigging still on it
      { kind: 'spar', x: 100, y: 188.5, s: 1.0, rot: -3, sink: 0.3, opt: { len: 50, th: 3.6, rig: true }, name: 'fore topmast (fallen by the bow)' },
      { kind: 'carriage', x: 140, y: 189, s: 0.85, rot: 3, sink: 0.3, name: 'gun carriage with its truck' },
      // the middle
      { kind: 'coinSpill', x: 120, y: 199, s: 1.0, sink: 0.2, opt: { n: 6, w: 14 }, name: 'coins' },
      { kind: 'epaulette', x: 178, y: 200, s: 1.8, rot: 4, sink: 0.1, opt: { growth: 'none' }, name: 'epaulette' },
      { kind: 'button', x: 149, y: 200, s: 2.4, sink: 0.25, opt: { growth: 'none' }, name: 'uniform button' },
      { kind: 'shotHeap', x: 238, y: 197.5, s: 1.0, sink: 0.3, opt: { n: 4 }, name: 'round shot' },
      // the near things
      { kind: 'anchor', x: 30, y: 206, s: 0.95, rot: -2, sink: 0.15, rests: true, name: 'anchor (on its ring, stock and fluke)' },
      { kind: 'coCrate', x: 72, y: 207, s: 1.1, rot: 6, sink: 0.22, opt: { state: 'burst', n: 7 }, name: 'Company crate (burst)' },
      { kind: 'coinSpill', x: 101, y: 208.5, s: 1.25, sink: 0.22, opt: { n: 11, w: 22 }, name: 'coins (spilled from the crate)' },
      { kind: 'ingots', x: 131, y: 208, s: 1.3, sink: 0.42, opt: { n: 3 }, name: 'gold ingots' },
      { kind: 'spyglass', x: 159, y: 209, s: 1.2, rot: -4, sink: 0.22, name: 'spyglass' },
      { kind: 'gun', x: 214, y: 206.5, s: 1.1, rot: 2, sink: 0.26, opt: { len: 46 }, name: 'cannon' },
      { kind: 'ingots', x: 254, y: 208, s: 1.2, sink: 0.5, opt: { n: 2 }, drift: 0.3, name: 'gold ingots (half buried)' },
      { kind: 'coCrate', x: 278, y: 206, s: 0.95, rot: -5, sink: 0.26, opt: { state: 'whole', n: 7 }, name: 'Company crate', drift: 0.2 }
    ], seed: 37
  },
  // the Dutchman did not break: she sank whole and the sea took her in — her hull grown over with shells, corals and
  // weed until she is a part of the floor, the masts standing whole in the rags of their sails, weed hanging from the
  // yards; round her the wreckage of other ships she took down
  dutch: {
    light: 'dutchman', water: ['#7eb098', '#3a6a58', '#22423a'], glow: '#dcf6e6', rays: 0.58, haze: ['#2c5446', 0.16], back: ['#b2e0c6', 0.66],
    sand: ['#cec7a2', '#9b967a', '#5a5c46'], fish: ['#c4dccc', 0.62], coral: ['#8a9a72', '#a49c74', '#94786e'], weed: ['#3e7a3c', '#5a8c4a', '#2c5230'],
    rag: '#8a8670', hz: 150,
    ship: {
      ...SHIP0, x: 234, y: 183, scale: 1.08, roll: -10, tilt: 5, brk: [0.93, 0.93, 0.93], bow: 10, stern: 9, sprit: undefined,
      holes: [], fade: 0.4, growth: 1.6, rags: 1.3, yards: [0, 1, 2], slack: 1.3, torn: 1, reef: true, drifts: [[169, 6, 4], [188, 5, 2], [217, 7, 3.2], [245, 9, 4.8], [276, 5.4, 2.4], [291, 7, 4.8]]
    },
    props: [
      // the far things: other ships' wreckage
      { kind: 'mastYard', x: 52, y: 188, s: 0.85, rot: -1, sink: 0.35, opt: { sail: '#7a7a68' }, drift: 0.2, name: 'a mast with its yard (another ship\'s)' },
      { kind: 'sidePiece', x: 136, y: 192, s: 0.95, rot: -4, sink: 0.3, opt: { paint: '#8a3a2a', band: '#c8a050' }, name: 'piece of another ship\'s side (a gun port)' },
      { kind: 'keg', x: 262, y: 193, s: 0.8, rot: -6, sink: 0.42, opt: { kind: 'foreign' }, name: 'another ship\'s barrel' },
      // the middle
      { kind: 'wheel', x: 98, y: 199, s: 1.2, rot: -12, sink: 0.36, stuck: true, name: 'ship\'s wheel' },
      { kind: 'bell', x: 178, y: 200, s: 1.2, rot: -24, sink: 0.28, name: 'ship\'s bell (on its side)' },
      { kind: 'board', x: 226, y: 199, s: 1.1, rot: 3, sink: 0.3, opt: { len: 32, th: 4.6, paint: '#3e5a7a' }, drift: 0.22, name: 'board of another ship (blue paint)' },
      // the near things
      { kind: 'anchor', x: 28, y: 205, s: 0.95, rot: -2, sink: 0.15, rests: true, name: 'anchor (on its ring, stock and fluke)' },
      { kind: 'chain', x: 64, y: 208, s: 1.55, sink: 0.38, opt: { pts: [[-16, 0.4], [-9, 1.6], [-2, 0.2], [5, 1.4], [12, 0.2], [17, 1.6]] }, drift: 0.25, driftH: 0.7, name: 'chain' },
      { kind: 'chest', x: 112, y: 207, s: 0.78, rot: -5, sink: 0.26, opt: { open: 0, gold: false }, drift: 0.2, name: 'chest' },
      { kind: 'shellBed', x: 150, y: 207.5, s: 1.3, rot: 3, sink: 0.3, name: 'shells on a timber' },
      { kind: 'conch', x: 191, y: 208, s: 1.3, rot: -6, sink: 0.3, name: 'conch' },
      { kind: 'gun', x: 234, y: 207, s: 1.1, rot: -3, sink: 0.4, opt: { len: 44 }, name: 'cannon (another ship\'s)' },
      { kind: 'bottle', x: 272, y: 206.5, s: 1.0, rot: 76, sink: 0.46, name: 'bottle' }
    ], seed: 41
  }
};

// ---- helpers ----
const PAGE = { w: 297, h: 210 };
const f = (n: number) => String(Math.round(n * 100) / 100);
const pt = (n: number) => n * 25.4 / 72;
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const hex = (c: string) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const mix = (a: string, b: string, k: number) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * k).toString(16).padStart(2, '0')).join('');
const smooth = (t: number) => { const u = Math.max(0, Math.min(1, t)); return u * u * (3 - 2 * u); };
/** a smooth open curve through points (Catmull-Rom as cubic Béziers) */
function spline(p: P[]): string {
  let d = `M${f(p[0][0])} ${f(p[0][1])}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(p.length - 1, i + 2)];
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

// ---- the living things and the small pieces of the scene (own drawings) ----
/** a fish swimming left: a lens body, a forked tail, a dorsal fin, a light belly, the eye */
function fish(x: number, y: number, l: number, rot: number, color: string, op: number): string {
  const body = `M0 0C${f(.18 * l)} ${f(-.25 * l)} ${f(.58 * l)} ${f(-.23 * l)} ${f(.8 * l)} ${f(-.03 * l)}L${f(l)} ${f(-.19 * l)}L${f(.94 * l)} 0L${f(l)} ${f(.19 * l)}L${f(.8 * l)} ${f(.03 * l)}C${f(.58 * l)} ${f(.2 * l)} ${f(.18 * l)} ${f(.21 * l)} 0 0Z`;
  const fin = `M${f(.3 * l)} ${f(-.2 * l)}L${f(.44 * l)} ${f(-.34 * l)}L${f(.58 * l)} ${f(-.19 * l)}Z`;
  const dark = mix(color, '#000000', .45), light = mix(color, '#ffffff', .45);
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})" opacity="${f(op)}"><path d="${fin}" fill="${dark}"/><path d="${body}" fill="${color}"/>` +
    `<path d="M${f(.06 * l)} ${f(.05 * l)}C${f(.3 * l)} ${f(.15 * l)} ${f(.56 * l)} ${f(.13 * l)} ${f(.76 * l)} ${f(.03 * l)}" fill="none" stroke="${light}" stroke-width="${f(.05 * l)}" stroke-opacity=".7"/>` +
    `<path d="M${f(.1 * l)} ${f(-.1 * l)}C${f(.3 * l)} ${f(-.19 * l)} ${f(.56 * l)} ${f(-.17 * l)} ${f(.76 * l)} ${f(-.05 * l)}" fill="none" stroke="${dark}" stroke-width="${f(.05 * l)}" stroke-opacity=".6"/>` +
    (l > 7 ? `<path d="M${f(.22 * l)} ${f(-.13 * l)}Q${f(.27 * l)} 0 ${f(.22 * l)} ${f(.12 * l)}" fill="none" stroke="${dark}" stroke-width="${f(.03 * l)}" stroke-opacity=".7"/><path d="M${f(.27 * l)} ${f(.04 * l)}L${f(.42 * l)} ${f(.13 * l)}L${f(.36 * l)} ${f(.02 * l)}Z" fill="${dark}" fill-opacity=".7"/><path d="M${f(.3 * l)} ${f(-.12 * l)}L${f(.34 * l)} ${f(.1 * l)}M${f(.42 * l)} ${f(-.14 * l)}L${f(.46 * l)} ${f(.11 * l)}M${f(.54 * l)} ${f(-.13 * l)}L${f(.57 * l)} ${f(.1 * l)}" stroke="${light}" stroke-width="${f(.015 * l)}" stroke-opacity=".5"/>` : '') +
    `<circle cx="${f(.11 * l)}" cy="${f(-.035 * l)}" r="${f(.028 * l)}" fill="${dark}"/></g>`;
}
/** a school of fish in a box, all swimming left in a loose stream along a gentle arc */
function school(b: Rect, n: number, size: number, sea: Sea, R: () => number, far = 0): string {
  const out: string[] = [], ph = R() * 3;
  for (let i = 0; i < n; i++) {
    const t = (i + R() * 0.8) / n, x = b.x + t * b.w, y = b.y + b.h / 2 + Math.sin(t * Math.PI * 1.4 + ph) * b.h * 0.28 + (R() - 0.5) * b.h * 0.55;
    const l = size * (0.75 + R() * 0.5), op = sea.fish[1] * (0.55 + R() * 0.45) * (1 - far * 0.55);
    out.push(fish(x, y, l, -6 + (R() - 0.5) * 16, far ? mix(sea.fish[0], sea.water[1], far * 0.6) : sea.fish[0], op));
  }
  return out.join('');
}
/** a column of bubbles rising from (x, y) to y = top, wobbling, larger as they rise */
function bubbles(x: number, y: number, top: number, glow: string, R: () => number): string {
  const out: string[] = [], ph = R() * 6;
  for (let yy = y - 2 - R() * 3; yy > top; yy -= 2.2 + R() * 4.5) {
    const k = (y - yy) / Math.max(1, y - top), r = 0.3 + k * 1.1 * (0.5 + R()), xx = x + Math.sin(yy * 0.14 + ph) * (1 + k * 2.4) + (R() - 0.5) * 1.6;
    out.push(`<circle cx="${f(xx)}" cy="${f(yy)}" r="${f(r)}" fill="${glow}" fill-opacity=".1" stroke="${glow}" stroke-opacity=".62" stroke-width="${f(Math.max(0.12, r * 0.16))}"/><circle cx="${f(xx - r * 0.35)}" cy="${f(yy - r * 0.38)}" r="${f(r * 0.24)}" fill="#ffffff" fill-opacity=".75"/>`);
  }
  return out.join('');
}
/** a strand of kelp: a tapering ribbon swaying up from (x, y), a lighter midrib */
function kelp(x: number, y: number, h: number, color: string, R: () => number, lean = 0, wmax = 2.2): string {
  const n = 14, ph = R() * 6, amp = 1.4 + R() * 1.8, c: P[] = [];
  for (let i = 0; i <= n; i++) { const t = i / n; c.push([x + Math.sin(t * 5.2 + ph) * amp * t + lean * h * t * t, y - h * t]); }
  const L: P[] = [], Rt: P[] = [];
  c.forEach((p, i) => {
    const q = c[Math.min(n, i + 1)], o = c[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], d = Math.hypot(dx, dy) || 1, t = i / n;
    const w = wmax * (0.35 + 0.65 * Math.sin(Math.PI * Math.pow(t, 0.6))) * (1 - 0.75 * t) + 0.15;
    L.push([p[0] - dy / d * w / 2, p[1] + dx / d * w / 2]); Rt.push([p[0] + dy / d * w / 2, p[1] - dx / d * w / 2]);
  });
  const d = spline(L) + spline(Rt.reverse()).replace(/^M/, 'L') + 'Z';
  return `<path d="${d}" fill="${color}"/><path d="${spline(c)}" fill="none" stroke="${mix(color, '#ffffff', .3)}" stroke-width=".22" stroke-opacity=".55"/>`;
}
/** a tuft of kelp strands */
function tuft(x: number, y: number, h: number, colors: string[], R: () => number, n = 4): string {
  let out = '';
  for (let i = 0; i < n; i++) out += kelp(x + (R() - 0.5) * 5, y, h * (0.55 + R() * 0.5), colors[i % colors.length], R, (R() - 0.4) * 0.25, 1.6 + R() * 1.2);
  return out;
}
/** a branching coral: forks with rounded tips, lit from above */
function branchCoral(x: number, y: number, h: number, color: string, R: () => number): string {
  const segs: string[] = [], tips: string[] = [], dark = mix(color, '#000000', .4), light = mix(color, '#ffffff', .35);
  const grow = (p: P, a: number, len: number, w: number, depth: number) => {
    const bend = (R() - 0.5) * 0.5, e: P = [p[0] + Math.sin(a) * len, p[1] - Math.cos(a) * len], m: P = [p[0] + Math.sin(a + bend) * len * 0.55, p[1] - Math.cos(a + bend) * len * 0.55];
    const d = `M${f(p[0])} ${f(p[1])}Q${f(m[0])} ${f(m[1])} ${f(e[0])} ${f(e[1])}`;
    segs.push(`<path d="${d}" fill="none" stroke="${dark}" stroke-width="${f(w + 0.5)}" stroke-linecap="round"/>`, `<path d="${d}" fill="none" stroke="${color}" stroke-width="${f(w)}" stroke-linecap="round"/>`,
      `<path d="${d}" fill="none" stroke="${light}" stroke-width="${f(w * 0.3)}" stroke-linecap="round" stroke-opacity=".7" transform="translate(${f(-w * 0.22)} 0)"/>`);
    if (depth <= 0) { tips.push(`<circle cx="${f(e[0])}" cy="${f(e[1])}" r="${f(w * 0.62)}" fill="${light}"/>`); return; }
    const k = 2 + (R() < 0.35 ? 1 : 0);
    for (let i = 0; i < k; i++) grow(e, a + (i - (k - 1) / 2) * (0.5 + R() * 0.35) + (R() - 0.5) * 0.2, len * (0.62 + R() * 0.16), w * 0.72, depth - 1);
  };
  grow([x, y], (R() - 0.5) * 0.3, h * 0.36, Math.max(0.9, h * 0.09), 3);
  return segs.join('') + tips.join('');
}
/** a sea fan: thin branching rays and a fine mesh between them */
function fanCoral(x: number, y: number, h: number, color: string, R: () => number): string {
  const out: string[] = [], n = 11, tilt = (R() - 0.5) * 0.3;
  for (let i = 0; i < n; i++) {
    const a = tilt - 1.05 + (i / (n - 1)) * 2.1, len = h * (0.75 + R() * 0.25), e: P = [x + Math.sin(a) * len, y - Math.cos(a) * len * 0.95];
    out.push(`<path d="M${f(x)} ${f(y)}Q${f(x + Math.sin(a) * len * 0.4 + (R() - 0.5) * 2)} ${f(y - Math.cos(a) * len * 0.5)} ${f(e[0])} ${f(e[1])}" fill="none" stroke="${color}" stroke-width=".42" stroke-linecap="round"/>`);
  }
  for (let k = 1; k <= 5; k++) {
    const rr = h * k / 5.6, pts: P[] = [];
    for (let i = 0; i <= 12; i++) { const a = tilt - 1.05 + (i / 12) * 2.1; pts.push([x + Math.sin(a) * rr + (R() - 0.5) * 0.6, y - Math.cos(a) * rr * 0.95 + (R() - 0.5) * 0.6]); }
    out.push(`<path d="${spline(pts)}" fill="none" stroke="${color}" stroke-width=".2" stroke-opacity=".8"/>`);
  }
  return `<path d="M${f(x - 1)} ${f(y + 0.3)}L${f(x)} ${f(y - 3)}L${f(x + 1)} ${f(y + 0.3)}Z" fill="${mix(color, '#000000', .3)}"/>` + out.join('');
}
/** a dome of brain coral with meandering grooves */
function domeCoral(x: number, y: number, rx: number, ry: number, color: string, R: () => number, id: string): string {
  const out = [`<defs><radialGradient id="${id}" cx=".38" cy=".25" r=".85"><stop offset="0" stop-color="${mix(color, '#ffffff', .3)}"/><stop offset=".6" stop-color="${color}"/><stop offset="1" stop-color="${mix(color, '#000000', .45)}"/></radialGradient></defs>`,
    `<path d="M${f(x - rx)} ${f(y)}C${f(x - rx)} ${f(y - ry * 1.3)} ${f(x + rx)} ${f(y - ry * 1.3)} ${f(x + rx)} ${f(y)}Z" fill="url(#${id})"/>`];
  for (let k = 0; k < 6; k++) {
    const yy = y - ry * (0.1 + k * 0.15), half = rx * Math.sqrt(Math.max(0, 1 - Math.pow((y - yy) / ry, 2))) * 0.9, pts: P[] = [];
    for (let i = 0; i <= 8; i++) pts.push([x - half + (2 * half * i) / 8, yy + Math.sin(i * 1.7 + k) * 0.5 + (R() - 0.5) * 0.3]);
    if (half > 1) out.push(`<path d="${spline(pts)}" fill="none" stroke="${mix(color, '#000000', .5)}" stroke-width=".22" stroke-opacity=".6"/>`);
  }
  return out.join('');
}
/** a scallop shell and a little spiral shell (the Dutchman's floor) */
function shell(x: number, y: number, s: number, rot: number, kind: number): string {
  if (kind) return `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${f(s)})"><path d="M0 0C-2.4 0 -3.2 -2.6 -1.6 -3.8C0 -5 2.6 -3.6 2.2 -1.4C1.9 .4 -.2 .8 -.6 -.6C-.9 -1.6 .4 -2.2 .9 -1.4" fill="#cfc6ae" stroke="#5a5444" stroke-width=".25"/><path d="M-.6 -.6C-.9 -1.6 .4 -2.2 .9 -1.4" fill="none" stroke="#5a5444" stroke-width=".2"/></g>`;
  let ribs = '';
  for (let i = 0; i < 7; i++) { const a = -1.15 + i * 0.383; ribs += `M0 0L${f(Math.sin(a) * 3.4)} ${f(-Math.cos(a) * 3.4)}`; }
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${f(s)})"><path d="M0 0L-3.2 -1.6C-3 -3.6 -1.4 -4 0 -4C1.4 -4 3 -3.6 3.2 -1.6Z" fill="#ddd2b8" stroke="#6a604c" stroke-width=".25"/><path d="${ribs}" stroke="#8a7c62" stroke-width=".2"/><path d="M-.9 .2H.9L.5 -.6H-.5Z" fill="#b8ab90"/></g>`;
}

const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
/** a torn rag of sail hanging from a spar at (x, y) (its top edge rises `slope` per mm): the cloth drifts with the current
 *  (flow), soft folds sway along it, the foot is torn into a fringe of uneven threads and strips, holes of every size;
 *  the spar is drawn with it (spar: false — the kit's own yard carries it) */
function rag(x: number, y: number, w: number, h: number, color: string, R: () => number, flow: number, fringe = 0, slope = 0.06, spar = true): string {
  const ph = R() * 6, NU = 10, len = Array.from({ length: NU + 1 }, () => 0.35 + R() * 0.65);
  const lenAt = (u: number) => { const i = Math.min(NU - 1, Math.floor(u * NU)), t = u * NU - i; return len[i] + (len[i + 1] - len[i]) * t; };
  const at = (u: number, v: number): P => [x + u * w * (1 - 0.14 * v) + flow * h * 0.3 * v * v + Math.sin(v * 3.4 + u * 2.6 + ph) * 1.1 * v, y + u * w * slope + v * h + Math.sin(u * 7 + ph) * 0.4 * v];
  const top: P[] = [], right: P[] = [], foot: P[] = [], left: P[] = [];
  for (let i = 0; i <= NU; i++) top.push(at(i / NU, 0));
  for (let j = 1; j <= 6; j++) right.push(at(1, lenAt(1) * j / 6));
  for (let i = NU; i >= 0; i--) { const u = i / NU; foot.push(at(u, lenAt(u))); if (i) foot.push(at(u - 0.5 / NU, lenAt(u - 0.5 / NU) - 0.06 - R() * 0.22)); }
  for (let j = 5; j >= 1; j--) left.push(at(0, lenAt(0) * j / 6));
  const outline = [...top, ...right, ...foot, ...left].map(q => `${f(q[0])},${f(q[1])}`).join(' ');
  const dark = mix(color, '#000000', 0.45), light = mix(color, '#ffffff', 0.3);
  let folds = '';
  for (const u of [0.16, 0.37, 0.58, 0.81]) {
    const pts: P[] = []; for (let v = 0; v <= lenAt(u) - 0.05; v += 0.1) pts.push(at(u, v));
    if (pts.length > 2) folds += `<path d="${spline(pts)}" fill="none" stroke="${dark}" stroke-width=".7" stroke-opacity=".38"/><path d="${spline(pts.map(q => [q[0] - 0.7, q[1]] as P))}" fill="none" stroke="${light}" stroke-width=".4" stroke-opacity=".35"/>`;
  }
  const y1 = y + w * slope;
  // the fringe: threads and strips of every length hanging from the torn foot, drifting with the current; holes
  let fr = '', holes = '';
  if (fringe > 0) {
    for (let i = 0; i <= NU * 3; i++) {
      if (R() < 0.3) continue;
      const u = i / (NU * 3), p0 = at(u, lenAt(u) - 0.04), long = R() < 0.18, l = h * fringe * (long ? 0.5 + R() * 0.6 : 0.06 + R() * 0.3), sw = flow * l * 0.5 + (R() - 0.3) * 1.5;
      const wd = long ? 0.5 + R() * 0.7 : 0.16 + R() * 0.2;
      fr += `<path d="M${f(p0[0])} ${f(p0[1])}C${f(p0[0] + sw * 0.2)} ${f(p0[1] + l * 0.4)} ${f(p0[0] + sw * 0.7 + Math.sin(i) * 0.6)} ${f(p0[1] + l * 0.7)} ${f(p0[0] + sw)} ${f(p0[1] + l)}" fill="none" stroke="${R() < 0.5 ? color : dark}" stroke-width="${f(wd)}" stroke-linecap="round" stroke-opacity="${f(0.6 + R() * 0.35)}"/>`;
    }
    for (let i = 0; i < 2 + fringe * 4; i++) { const c = at(0.1 + R() * 0.8, 0.15 + R() * 0.55), r = 0.25 + R() * R() * 2.2, a = R() * 6;
      const ps: P[] = []; for (let k = 0; k < 7; k++) { const t = a + (k / 7) * Math.PI * 2, q = r * (0.5 + R() * 0.7); ps.push([c[0] + Math.cos(t) * q, c[1] + Math.sin(t) * q * 1.3]); }
      holes += `<path d="M${pts2(ps)}Z" fill="${dark}" fill-opacity=".75"/>`; }
  }
  return `<g opacity=".92">${fr}<polygon points="${outline}" fill="${color}"/>${folds}${holes}<polygon points="${outline}" fill="none" stroke="${dark}" stroke-width=".25" stroke-opacity=".6"/></g>` +
    (spar ? `<path d="M${f(x - 2.4)} ${f(y - 0.25)}L${f(x + w + 2)} ${f(y1 + 0.2)}" stroke="#241c12" stroke-width="1.15" stroke-linecap="round"/><path d="M${f(x - 2)} ${f(y - 0.55)}L${f(x + w + 1.6)} ${f(y1 - 0.1)}" stroke="#6a5a40" stroke-width=".3" stroke-opacity=".7" stroke-linecap="round"/>` : '');
}
const pts2 = (p: P[]) => p.map(q => `${f(q[0])} ${f(q[1])}`).join('L');
/** a sail half torn off: it hangs from the inner part of the yard by one corner, a long torn diagonal edge with ragged
 *  threads and strips, holes, the free corner drifting with the current; the yard stub with it */
function tornRag(x: number, y: number, w: number, h: number, color: string, R: () => number, flow: number): string {
  const dark = mix(color, '#000000', 0.45), light = mix(color, '#ffffff', 0.3);
  const a: P = [x, y], b: P = [x + w * 0.62, y + w * 0.025], tip: P = [x + w * 0.3 + flow * h * 0.45, y + h];
  const edge: P[] = [b]; for (let i = 1; i < 14; i++) { const t = i / 14; edge.push([b[0] + (tip[0] - b[0]) * t + Math.sin(t * 9) * 0.8 + (R() - 0.5) * 1.6, b[1] + (tip[1] - b[1]) * t + (R() - 0.5) * 0.8]); }
  edge.push(tip);
  const leech: P[] = []; for (let i = 1; i < 8; i++) { const t = i / 8; leech.push([tip[0] + (a[0] - tip[0]) * t - Math.sin(t * Math.PI) * 2.4 + flow * Math.sin(t * Math.PI) * 1.2, tip[1] + (a[1] - tip[1]) * t]); }
  const shape: P[] = [a, ...edge, ...leech];
  let out = `<path d="M${pts2(shape)}Z" fill="${color}" opacity=".93"/>`;
  for (let i = 0; i < 4; i++) { const t = 0.2 + i * 0.2, p0: P = [a[0] + (b[0] - a[0]) * t * 0.8, a[1]], p1: P = [tip[0] + (R() - 0.5) * 3, a[1] + h * (0.55 + t * 0.4)]; out += `<path d="M${f(p0[0])} ${f(p0[1] + 0.5)}Q${f((p0[0] + p1[0]) / 2 + 1.5)} ${f((p0[1] + p1[1]) / 2)} ${f(p1[0])} ${f(p1[1])}" fill="none" stroke="${i % 2 ? dark : light}" stroke-width="${i % 2 ? 0.7 : 0.4}" stroke-opacity=".35"/>`; }
  for (let i = 0; i < 6; i++) { const t = R(), c: P = [a[0] + (tip[0] - a[0]) * t + (b[0] - a[0]) * (1 - t) * R() * 0.6 + 1, a[1] + (tip[1] - a[1]) * t * 0.9 + 1], r = 0.3 + R() * R() * 2;
    const ps: P[] = []; for (let k = 0; k < 7; k++) { const q = (k / 7) * Math.PI * 2, rr = r * (0.5 + R() * 0.7); ps.push([c[0] + Math.cos(q) * rr, c[1] + Math.sin(q) * rr * 1.3]); }
    out += `<path d="M${pts2(ps)}Z" fill="${dark}" fill-opacity=".8"/>`; }
  for (const [i, q] of edge.entries()) { if (R() < 0.35) continue; const l = (R() < 0.2 ? 4 + R() * 6 : 0.6 + R() * 2.4), sw = flow * l * 0.6 + 0.5; out += `<path d="M${f(q[0])} ${f(q[1])}q${f(sw * 0.4)} ${f(l * 0.5)} ${f(sw)} ${f(l)}" fill="none" stroke="${i % 2 ? color : dark}" stroke-width="${f(l > 4 ? 0.6 : 0.2)}" stroke-linecap="round" stroke-opacity=".85"/>`; }
  out += `<path d="M${pts2(shape)}Z" fill="none" stroke="${dark}" stroke-width=".25" stroke-opacity=".6"/>`;
  return out + `<path d="M${f(x - 2.4)} ${f(y - 0.25)}L${f(x + w + 2)} ${f(y + w * 0.04 + 0.2)}" stroke="#241c12" stroke-width="1.15" stroke-linecap="round"/><path d="M${f(x - 2)} ${f(y - 0.55)}L${f(x + w + 1.6)} ${f(y + w * 0.04 - 0.1)}" stroke="#6a5a40" stroke-width=".3" stroke-opacity=".7" stroke-linecap="round"/>`;
}
/** weed hanging from a yard or a rail: a slack ribbon falling from (x, y), streaming to the right with the current */
function hangWeed(x: number, y: number, l: number, color: string, R: () => number): string {
  const w = 0.35 + R() * 0.4, sw = (0.25 + R() * 0.45) * l * 0.6, p1: P = [x + sw * 0.15, y + l * 0.45], p2: P = [x + sw * 0.6, y + l * 0.8], e: P = [x + sw, y + l];
  return `<path d="M${f(x - w)} ${f(y)}C${f(p1[0] - w)} ${f(p1[1])} ${f(p2[0] - w * 0.6)} ${f(p2[1])} ${f(e[0])} ${f(e[1])}C${f(p2[0] + w * 0.6)} ${f(p2[1] - w)} ${f(p1[0] + w)} ${f(p1[1])} ${f(x + w)} ${f(y)}Z" fill="${color}" fill-opacity=".85"/>` +
    `<path d="M${f(x)} ${f(y)}C${f(p1[0])} ${f(p1[1])} ${f(p2[0])} ${f(p2[1])} ${f(e[0])} ${f(e[1])}" fill="none" stroke="${mix(color, '#ffffff', 0.3)}" stroke-width=".12" stroke-opacity=".55"/>`;
}
/** a stone whose foot is at (x, y), its shadow on the sand to the right. kind 0 — an uneven dome, 1 — a flat slab, 2 — an
 *  angular broken piece; sunk — the share of it under the sand (a lip of sand over its foot) */
function stone(x: number, y: number, w: number, h: number, R: () => number, shade = true, kind = 0, sunk = 0): string {
  const n = kind === 2 ? 6 : 9, pts: P[] = [];
  for (let i = 0; i <= n; i++) { const a = Math.PI * (1 - i / n), e = i === 0 || i === n, k = kind === 1 ? Math.pow(Math.sin(a), 0.3) : kind === 2 ? 0.6 + R() * 0.5 : Math.pow(Math.sin(a), 0.7);
    pts.push([x + Math.cos(a) * w / 2 * (e ? 1 : 0.86 + R() * 0.18), y - (e ? 0 : k * h * (0.82 + R() * 0.25))]); }
  const d = (kind === 2 ? `M${pts2(pts)}` : spline(pts)) + `Q${f(x)} ${f(y + h * 0.12)} ${f(pts[0][0])} ${f(pts[0][1])}Z`;
  let o = (shade ? `<ellipse cx="${f(x + w * 0.2)}" cy="${f(y + 0.15)}" rx="${f(w * 0.6)}" ry="${f(Math.max(0.35, h * 0.2))}" fill="#000" fill-opacity=".26"/>` : '') + `<path d="${d}" fill="url(#wPeb)"/>`;
  if (kind === 2) o += `<path d="M${f(pts[2][0])} ${f(pts[2][1])}L${f(x + w * 0.1)} ${f(y - h * 0.2)}" stroke="#000" stroke-width=".2" stroke-opacity=".35"/>`;
  if (sunk > 0) { const yy = y - h * sunk; o += `<path d="M${f(x - w * 0.62)} ${f(y + 0.3)}C${f(x - w * 0.5)} ${f(yy)} ${f(x + w * 0.5)} ${f(yy - h * 0.05)} ${f(x + w * 0.66)} ${f(y + 0.3)}Z" fill="url(#wFloor)"/>`; }
  return o;
}

// ---- the scene ----
interface Plates { title: Rect; rules: Rect; col: Rect }
/** the scene's geometry for the physics check */
interface Geo { H: number; crest(x: number): number; floorTop(x: number): number; hull: P[]; keel: P[]; span: [number, number]; props: Placed[]; fall?: { tip: P; ty: number } }

const lightOf = (sea: Sea) => { const base = K.LIGHTS[sea.light]; return K.makeLight({ ...base, key: { ...base.key, az: 215, el: 66 } }, { horizon: sea.hz }); };
/** a thing drawn at its spec point (before it is moved into the sand) */
const drawProp = (sea: Sea, key: ShipKey, p: PropSpec, i: number) => PROP_DEFS[p.kind].draw({ u: `wr${key}p${i}`, L: lightOf(sea), K }, { x: p.x, y: p.y, s: p.s ?? 1, rot: p.rot ?? 0, flip: !!p.flip, seed: sea.seed * 31 + i + 1, opt: p.opt ?? {} });
/** puts every thing into the sand: the browser measures which cells each drawing covers, then it is moved so `sink` of
 *  it is under the sand line (wreck-props.ts) */
const PLACED = new Map<string, { placed: Placed[]; bodies: string[] }>();
async function placeProps(ctx: Ctx, key: ShipKey, sea: Sea): Promise<{ placed: Placed[]; bodies: string[] }> {
  const got = PLACED.get(key); if (got) return got;
  const bodies = sea.props.map((p, i) => drawProp(sea, key, p, i)), page = await ctx.browser.newPage();
  try {
    const occ = await measureProps(page, bodies);
    const v = { placed: sea.props.map((p, i) => placeProp(p, i, occ[i], sea.seed * 31 + i + 1)), bodies };
    PLACED.set(key, v); return v;
  } finally { await page.close(); }
}
/** how far to lower the ship so that its rail clears the rules scroll */
function clearOfRules(key: ShipKey, S: Sea['ship'], rules: Rect, len: number): number {
  const g = K.shipGeom(key, { kind: key, x: S.x, y: S.y, scale: S.scale, roll: S.roll }), a = -S.tilt * Math.PI / 180, need = rules.y + rules.h + 4;
  let dy = 0;
  for (let X = -len / 2; X <= len / 2; X += 3) {
    const [x, y] = g.nearRail(X), px = S.x + (x - S.x) * Math.cos(a) - (y - S.y) * Math.sin(a), py = S.y + (x - S.x) * Math.sin(a) + (y - S.y) * Math.cos(a);
    if (px < rules.x + rules.w + 6) dy = Math.max(dy, need - py);
  }
  return dy;
}
/** the whole sea-floor picture (mm), to be rasterised, and its geometry; props — the things placed in the sand, bodies —
 *  their drawings (placeProps) */
export function seaFloorSvg(key: ShipKey, sea: Sea, pl: Plates, props: Placed[], bodies: string[]): { svg: string; geo: Geo } {
  const R = rng(sea.seed), sp = K.SHIP_SPECS[key], u = `wr${key}`, H = sea.hz, W = PAGE.w;
  const S = { ...sea.ship, y: sea.ship.y + clearOfRules(key, sea.ship, pl.rules, sp.len) }, s = S.scale, L = lightOf(sea);
  const [w0, w1, w2] = sea.water, [sd0, sd1, sd2] = sea.sand;
  const fog = mix(mix(w1, w2, 0.3), sea.back[0], 0.22), out: string[] = [];
  const dep = (y: number) => clamp01((y - H) / (PAGE.h - H));
  const poly = (p: P[]) => p.map(q => `${f(q[0])},${f(q[1])}`).join(' ');
  const coral = sea.coral.map(c => mix(c, sea.haze[0], 0.22));

  // ---- the geometry: the ship (local coordinates, the group is tilted about the middle of the waterline; a broken
  // hull's after part moved and turned again about the keel at the break), the sand ----
  const o = { kind: key, x: S.x, y: S.y, scale: s, roll: S.roll, sails: 'furled', seed: sea.seed };
  const body = K.ship(u, L, o), geom = K.shipGeom(key, o), masts = [...geom.masts].sort((a, b) => a.x - b.x), mSpec = [...sp.masts as unknown as { x: number; H: number; n: number; k: number; Q?: number[]; rake?: number }[]].sort((a, b) => a.x - b.x);
  const hl = (sp.len / 2) * s, stem = S.x - hl, stern = S.x + hl, draft = sp.draft * s, deck = S.y - sp.free * s;
  const ra = -S.tilt * Math.PI / 180, rot0 = (p: P): P => [S.x + (p[0] - S.x) * Math.cos(ra) - (p[1] - S.y) * Math.sin(ra), S.y + (p[0] - S.x) * Math.sin(ra) + (p[1] - S.y) * Math.cos(ra)];
  const SP = S.split, xs = SP ? S.x + SP.X * s : Infinity, piv = SP ? rot0([xs, S.y + draft * 0.95]) : [0, 0] as P, sa = SP ? SP.rot * Math.PI / 180 : 0;
  /** a point of the ship's own frame put into the scene */
  const rot = (p: P): P => { const q = rot0(p); if (!SP || p[0] <= xs) return q; const dx = q[0] - piv[0], dy = q[1] - piv[1]; return [piv[0] + dx * Math.cos(sa) - dy * Math.sin(sa) + SP.dx, piv[1] + dx * Math.sin(sa) + dy * Math.cos(sa) + SP.drop]; };
  const tf = `rotate(${f(-S.tilt)} ${f(S.x)} ${f(S.y)})`, tf2 = SP ? `translate(${f(SP.dx)} ${f(SP.drop)}) rotate(${f(SP.rot)} ${f(piv[0])} ${f(piv[1])}) ${tf}` : '';
  /** what is drawn in the ship's own frame, put into the scene: whole, or the two parts of a broken hull */
  const inShip = (c: string) => SP ? `<g transform="${tf}"><g clip-path="url(#wPartA)">${c}</g></g><g transform="${tf2}"><g clip-path="url(#wPartB)">${c}</g></g>` : `<g transform="${tf}">${c}</g>`;
  const mx = masts.map(m => S.x + m.x * s), yb = masts.map((m, i) => S.y - (S.brk[i] ?? 0.45) * (S.y - m.top[1]));
  const rail: P[] = []; for (let X = -sp.len / 2; X <= sp.len / 2 + 0.01; X += 4) { const q = geom.nearRail(X); rail.push([q[0], q[1] - 1.2 * s]); }
  const keelL: P[] = [[stern + sp.over * s * 0.8, S.y + 0.1 * draft], [stern, S.y + draft * 0.85], [S.x, S.y + draft], [stem + 6 * s, S.y + draft * 0.75], [stem - sp.bow[0] * s * 0.5, S.y - 1 * s]];
  const hull = [...rail, [stern + sp.over * s * 0.85, rail[rail.length - 1][1] - 1 * s] as P, ...keelL].map(rot);
  const keel: P[] = []; for (let X = stem + 8 * s; X <= stern - 3 * s; X += 4) { const t = (X - S.x) / hl; keel.push(rot([X, S.y + draft * (1 - 0.3 * Math.pow(Math.abs(t), 3))])); }
  const stemP = rot([stem, S.y]), sternP = rot([stern, S.y]);
  const baseL = rot([stem + 6 * s, S.y + draft * 0.75])[1] + 4, baseR = rot([stern, S.y + draft * 0.85])[1] + 4;
  // the crest of the sand along the hull: uneven — swells and hollows of several sizes
  const lump = (x: number) => Math.sin(x / 6.5 + sea.seed) * 0.9 + Math.sin(x / 2.7 + sea.seed * 3) * 0.35 - 1.8 * Math.pow(Math.max(0, Math.sin(x / 9.3 + sea.seed * 2)), 4);
  const along = (x: number) => { const t = clamp01((x - stemP[0]) / (sternP[0] - stemP[0])); return stemP[1] + t * (sternP[1] - stemP[1]) - (S.bow + (S.stern - S.bow) * smooth(t)); };
  const bank = (x: number) => (S.drifts ?? []).reduce((y, [c, w, h]) => y - h * Math.pow(Math.max(0, 1 - Math.pow((x - c) / w, 2)), 1.5), 0);
  /** the top of the sand heaped along the hull; beyond the ends it runs down to the floor */
  const crest = (x: number) => {
    if (x < stemP[0]) { const k = smooth((stemP[0] - x) / 30); return along(stemP[0]) + (baseL - along(stemP[0])) * k + lump(x) * (1 - k) + bank(x); }
    if (x > sternP[0]) { const k = smooth((x - sternP[0]) / 26); return along(sternP[0]) + (baseR - along(sternP[0])) * k + lump(x) * (1 - k) + bank(x); }
    return along(x) + lump(x) + bank(x);
  };
  const span: [number, number] = [stemP[0] - 4, sternP[0] + 4];
  const farTop = (x: number) => H + Math.sin(x / 41 + sea.seed) * 1.1 + Math.sin(x / 13 + sea.seed * 2) * 0.45;
  /** where the visible sand starts at x: the crest in front of the hull, the far edge elsewhere */
  const floorTop = (x: number) => (x >= span[0] && x <= span[1] ? crest(x) : farTop(x) + 1);
  const fp: P[] = []; for (let x = -4; x <= W + 4; x += 6) fp.push([x, farTop(x)]);
  const floorD = `${spline(fp)}L${W + 4} ${PAGE.h + 3}L-4 ${PAGE.h + 3}Z`;
  const B0 = stemP[0] - 30, B1 = sternP[0] + 26, cp: P[] = []; for (let x = B0; x <= B1 + 0.01; x += 2) cp.push([x, crest(x)]);
  const bermD = `${spline(cp)}L${f(B1)} ${PAGE.h + 3}L${f(B0)} ${PAGE.h + 3}Z`;
  const hullTop = Math.min(...hull.map(q => q[1])), crestMax = Math.max(...cp.map(q => q[1]));

  // the fallen top: from the deck by its stump down to the sand, its yards lying flat (foreshortened), cut where they meet the sand
  let fall: Geo['fall'], fallG = '';
  if (S.fall) {
    const i = S.fall.mast, F = rot([mx[i], deck + 0.5 * s]), Lp = yb[i] - masts[i].top[1], a = Math.asin(Math.max(-0.95, Math.min(0.95, (S.fall.ty - F[1]) / Lp)));
    const d: P = [S.fall.side * Math.cos(a), Math.sin(a)], tip: P = [F[0] + d[0] * Lp, F[1] + d[1] * Lp], th = Math.atan2(d[0], -d[1]) * 180 / Math.PI;
    fall = { tip, ty: S.fall.ty };
    fallG = `<clipPath id="wFallC"><rect x="-10" y="-10" width="${W + 20}" height="${f(S.fall.ty + 10.6)}"/></clipPath>` +
      `<g id="wFallG" clip-path="url(#wFallC)"><g transform="translate(${f(F[0])} ${f(F[1])}) rotate(${f(th)}) translate(${f(-mx[i])} ${f(-yb[i])})"><g clip-path="url(#wHigh)"><use href="#${u}Body"/></g></g></g>`;
  }
  const RD = rng(sea.seed * 5 + 1);
  /** the yards of a mast (kit units → the ship's frame): the middle and the half-length of each, from the top down */
  const yardsOf = (i: number) => {
    const m = mSpec[i], hD = sp.free - 1.5, Hm = m.H - hD, Q = m.Q ?? ({ 4: [0.36, 0.62, 0.8, 0.94], 3: [0.4, 0.7, 0.93], 2: [0.46, 0.86] } as Record<number, number[]>)[m.n], WY = [0.14, 0.108, 0.078, 0.054], rk = Math.tan(((m.rake ?? 0) * Math.PI) / 180);
    const cr = Math.cos((S.roll * Math.PI) / 180);
    return Q.map((q0, j) => { const q = j ? q0 + (Q[j - 1] - q0) * (j === 1 ? 0.5 : 0.38) : q0; return { c: [S.x + (m.x + rk * q * Hm) * s, S.y - (hD + q * Hm) * cr * s] as P, hw: WY[j] * sp.len * m.k * s }; });
  };
  const keepsYards = (i: number) => !!S.yards?.includes(i);
  const yardHW = (i: number) => Math.max(...yardsOf(i).filter(y => y.c[1] > yb[i]).map(y => y.hw), 3 * s);
  /** the break of a mast: a level cut (kept to its top, or standing with its yards), a slant snapped or burnt through,
   *  or a ragged break with long splinters */
  const jag = (i: number): P[] => {
    if (keepsYards(i)) { const hw = yardHW(i) + 1.2 * s; return [[mx[i] - hw, yb[i]], [mx[i] + hw, yb[i]]]; }
    if (i === S.keep) return [[mx[i] - 4.2 * s, yb[i] + 0.4 * s], [mx[i] + 4.2 * s, yb[i] + 0.4 * s]];
    const e = i % 2 ? 1 : -1;
    if (S.slant) return [[mx[i] - 2.4 * s, yb[i] + e * 2.2 * s], [mx[i] - 0.9 * s, yb[i] + e * 1.1 * s], [mx[i] - 0.3 * s, yb[i] + e * 1.5 * s - 0.8 * s], [mx[i] + 0.6 * s, yb[i] - e * 0.6 * s], [mx[i] + 2.4 * s, yb[i] - e * 2.2 * s]];
    return [[mx[i] - 2.4 * s, yb[i] + 0.8 * s], [mx[i] - 1.7 * s, yb[i] - 1.9 * s], [mx[i] - 1.1 * s, yb[i] - 0.2 * s], [mx[i] - 0.4 * s, yb[i] - 3.6 * s], [mx[i] + 0.3 * s, yb[i] - 0.5 * s],
      [mx[i] + 0.9 * s, yb[i] - 2.4 * s], [mx[i] + 1.5 * s, yb[i] - 0.9 * s], [mx[i] + 2.4 * s, yb[i] + 0.6 * s]];
  };
  // what is kept of the kit ship: the bow and the bowsprit (or its stub, snapped at S.sprit), each stump to its break with
  // the shrouds under it (a tent from the break down to the rail), a mast standing with its yards in a box as wide as its
  // yards, between the masts and aft only the hull to a little over its rail; with S.aft the stern castle is gone from
  // there aft: a jagged break falls from the rail to the lower deck
  const railAt = (x: number) => { const X = Math.max(-sp.len / 2, Math.min(sp.len / 2, (x - S.x) / s)); return Math.min(geom.nearRail(X)[1], geom.farRail(X)[1]) - 3.5 * s; };
  const xL = stem - 80, xEnd = stern + (sp.over + Math.max(...sp.tw) + (S.aft == null ? 5 : 0)) * s + 0.3, low: P[] = [[xL, S.y + 80]];
  const xAft = S.aft != null ? S.x + S.aft * s : Infinity, kept = masts.map((_, i) => i).filter(i => mx[i] < xAft - 4 * s);
  const tent = (S.burnt ?? 0) > 0.5 ? 3.5 : S.tent ?? 13, side = (i: number) => (keepsYards(i) ? yardHW(i) + 1.4 * s : tent * s);
  if (S.sprit != null) {
    const xc = stem - S.sprit * s, yH = S.y - sp.free * 0.5 * s;
    low.push([xL, yH], [xc - 0.6 * s, yH], ...jagLine([xc - 0.6 * s, yH], [xc, yb[0] - 3 * s], 7, 1.1 * s, RD), [xc, yb[0] - 3 * s]);
  } else low.push([xL, Math.min(yb[0], railAt(stem) - 20 * s)]);
  const along2 = (xa: number, xb: number) => { for (let x = xa; x < xb; x += 3) low.push([x, railAt(x)]); low.push([xb, railAt(xb)]); };
  if (keepsYards(kept[0])) low.push([mx[kept[0]] - side(kept[0]), Math.min(railAt(mx[kept[0]] - side(kept[0])), low[low.length - 1][1])]);
  low.push(...jag(kept[0]));
  for (let k = 0; k < kept.length - 1; k++) {
    const i = kept[k], j = kept[k + 1], xa = mx[i] + side(i), xb = mx[j] - side(j);
    if (keepsYards(i)) low.push([xa, railAt(xa)]);
    if (xa < xb) along2(xa, xb); else low.push([(mx[i] + mx[j]) / 2, Math.max(railAt((mx[i] + mx[j]) / 2), (yb[i] + yb[j]) / 2)]);
    if (keepsYards(j)) low.push([xb, railAt(xb)]);
    low.push(...jag(j));
  }
  const last = kept[kept.length - 1];
  if (keepsYards(last)) low.push([mx[last] + side(last), railAt(mx[last] + side(last))]);
  /** the line of the fallen-in stern: from the rail at xAft down to the lower deck at the transom */
  const xT = stern + sp.over * s * 0.45, brkY = (x: number) => { const t = clamp01((x - xAft) / (xT - xAft)); return railAt(xAft) + 3.5 * s + (S.y + 0.5 * s - railAt(xAft) - 3.5 * s) * Math.pow(t, 0.8); };
  const brkL: P[] = [];
  if (xAft < xEnd) {
    along2(Math.min(mx[last] + side(last), xAft - 1), xAft);
    for (let x = xAft, n = 0; x < xT; x += (1.2 + RD() * 1.6) * s, n++) brkL.push([x, brkY(x) + (n % 2 ? -1 : 0.4) * (0.6 + RD() * 1.4) * s]);
    brkL.push([xT + 0.6 * s, S.y + 1.2 * s], [xEnd, S.y + 1.5 * s]);   // the counter and the transom gone with it
    low.push(...brkL);
  } else along2(Math.min(mx[last] + side(last), xEnd - 1), xEnd);
  low.push([xEnd, S.y + 80]);
  let high = '';
  if (S.fall) { const i = S.fall.mast, hw = 2.6 * s, topY = masts[i].top[1] - 12 * s, j = jag(i); high = `<clipPath id="wHigh"><polygon points="${poly([[mx[i] - hw, topY], [mx[i] + hw, topY], [mx[i] + hw, j[j.length - 1][1]], ...[...j].reverse(), [mx[i] - hw, j[0][1]]])}"/></clipPath>`; }
  // the break of a hull broken in two: the jagged line of the break and the two parts' clips; the open inside at the break
  let parts = '', brkFace = '';
  if (SP) {
    const top = Math.min(...yb) - 60, bot = S.y + draft + 20, J: P[] = [[xs, top]];
    for (let y = railAt(xs) - 2 * s, n = 0; y < S.y + draft + 2; y += (1.4 + RD() * 1.6) * s, n++) J.push([xs + (n % 2 ? 1 : -1) * (0.6 + RD() * 1.6) * s, y]);
    J.push([xs, bot]);
    parts = `<clipPath id="wPartA"><polygon points="${poly([[xL - 50, top], ...J, [xL - 50, bot]])}"/></clipPath><clipPath id="wPartB"><polygon points="${poly([[xEnd + 80, top], ...J, [xEnd + 80, bot]])}"/></clipPath>`;
    const y0 = railAt(xs) - 1.5 * s, y1 = S.y + draft * 0.95, bw = 3.2 * s;
    brkFace = `<path d="M${f(xs - bw)} ${f(y0)}H${f(xs + bw)}V${f(y1)}H${f(xs - bw)}Z" fill="#0c0a08"/>`;
    // the decks seen end-on in the break, frames standing in it, splintered plank ends
    for (const t of [0.22, 0.45, 0.68]) { const y = y0 + (S.y - y0) * t; brkFace += `<path d="M${f(xs - bw)} ${f(y)}H${f(xs + bw)}" stroke="#6a5a44" stroke-width="${f(0.45 * s)}"/><path d="M${f(xs - bw)} ${f(y + 0.35 * s)}H${f(xs + bw)}" stroke="#241a10" stroke-width="${f(0.3 * s)}"/>`; }
    for (let x = xs - bw + 0.6 * s; x < xs + bw; x += 1.6 * s) brkFace += `<path d="M${f(x)} ${f(y0 + 1.5 * s)}V${f(y1 - 1.5 * s)}" stroke="#3a2c1e" stroke-width="${f(0.55 * s)}"/><path d="M${f(x - 0.15 * s)} ${f(y0 + 1.5 * s)}V${f(y1 - 1.5 * s)}" stroke="#8a7458" stroke-width="${f(0.14 * s)}" stroke-opacity=".7"/>`;
  }
  // the hull: the fouled bottom under the old waterline with the rudder, then the kit's ship cut at the breaks
  let foul = '';
  for (let i = 0; i < 26; i++) { const x = stem + 8 * s + R() * (stern - stem - 14 * s), y = S.y + R() * draft * 0.8; foul += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(0.6 + R() * 1.6)}" ry="${f(0.4 + R() * 0.9)}" fill="${sea.weed[i % 3]}" fill-opacity=".55"/>`; }
  // how she died, drawn on the kit's hull (in its own frame, before the tilt): the holes in the side; the fallen-in stern —
  // the dark inside under the break, the frames standing up out of it, the sternpost standing up out of it all
  let dmg = '';
  for (const h of S.holes ?? []) { const q = geom.nearRail(h.X); dmg += holeSvg(q[0], S.y + h.t * (q[1] - S.y), h.r * s, h.kind, RD, S.burnt ?? 0); }
  let frames = '';
  if (brkL.length) {
    const c = (S.burnt ?? 0) > 0.4 ? ['#16100c', '#4a3c30'] : ['#3a2c1e', '#8a7458'];
    dmg += `<path d="M${poly(brkL).replace(/ /g, 'L')}L${f(xEnd)} ${f(brkY(xEnd) + 3 * s)}L${f(xAft)} ${f(brkY(xAft) + 3 * s)}Z" fill="#0a0806" opacity=".8"/>`;
    for (let x = xAft + 1.2 * s; x < xT - 0.8 * s; x += (2.4 + RD() * 1.2) * s) {
      const y0 = brkY(x) + 1.2 * s, hgt = (1.2 + RD() * 2.8) * s, w = 0.8 * s, lean = (RD() - 0.3) * 1.4 * s, top: P = [x + lean, y0 - hgt];
      frames += `<path d="M${f(x - w / 2)} ${f(y0)}L${f(top[0] - w / 2)} ${f(top[1] + 0.6 * s)}L${f(top[0] - w * 0.1)} ${f(top[1])}L${f(top[0] + w * 0.15)} ${f(top[1] + 0.9 * s)}L${f(top[0] + w / 2)} ${f(top[1] + 0.4 * s)}L${f(x + w / 2)} ${f(y0)}Z" fill="${c[0]}"/>` +
        `<path d="M${f(x - w / 2 + 0.15)} ${f(y0)}L${f(top[0] - w / 2 + 0.15)} ${f(top[1] + 0.7 * s)}" stroke="${c[1]}" stroke-width="${f(0.22 * s)}" stroke-opacity=".8"/>`;
    }
    for (const [x, y] of brkL.filter((_, i) => i % 2)) frames += `<path d="M${f(x)} ${f(y)}l${f((RD() - 0.2) * 2.2 * s)} ${f(-(0.8 + RD()) * s)}l${f(0.5 * s)} ${f(0.6 * s)}Z" fill="${c[0]}"/>`;
    // the sternpost: the stern's backbone, standing up bare out of the fallen-in stern, leaning aft, its head burnt to a point
    const sx = stern + 0.5 * s, sy0 = S.y + draft * 0.6, sy1 = S.y - 3.5 * s;
    frames += `<path d="M${f(sx - 0.9 * s)} ${f(sy0)}L${f(sx + 1.6 * s)} ${f(sy1 + 0.8 * s)}L${f(sx + 2.1 * s)} ${f(sy1 - 0.6 * s)}L${f(sx + 2.5 * s)} ${f(sy1 + 1.4 * s)}L${f(sx + 1 * s)} ${f(sy0)}Z" fill="${c[0]}"/><path d="M${f(sx - 0.6 * s)} ${f(sy0)}L${f(sx + 1.7 * s)} ${f(sy1 + 1 * s)}" stroke="${c[1]}" stroke-width="${f(0.25 * s)}"/>`;
  }
  // rotten gaps in the bulwark: dark ragged notches along the rail, the planks gone between the stanchions
  let rotG = '';
  for (let i = 0; i < (S.rot ?? 0); i++) {
    const X = -sp.len / 2 + 10 + RD() * (sp.len - 18), q = geom.nearRail(X), w = (1.2 + RD() * 2.4) * s, d = (1 + RD() * 1.4) * s;
    if (S.x + X * s > xAft - 2 * s) continue;
    const ps: P[] = [[q[0] - w / 2, q[1] - 0.2 * s], ...jagLine([q[0] - w / 2, q[1] - 0.2 * s], [q[0] + w / 2, q[1] - 0.2 * s], 5, -d, RD), [q[0] + w / 2, q[1] - 0.2 * s], [q[0] + w * 0.3, q[1] + d * 0.4], [q[0] - w * 0.3, q[1] + d * 0.4]];
    rotG += `<path d="M${poly(ps).replace(/ /g, 'L')}Z" fill="#0a0806" fill-opacity=".85"/><path d="M${f(q[0] - w * 0.1)} ${f(q[1] - d * 0.6)}V${f(q[1] + 0.6 * s)}" stroke="#4a3c2c" stroke-width="${f(0.35 * s)}"/>`;
  }
  const hullG = `<g id="wHullG">` + inShip(`<path d="M${f(stem - 1)} ${f(S.y - 0.5)}C${f(stem + 6 * s)} ${f(S.y + draft * 0.75)} ${f(stem + hl * 0.4)} ${f(S.y + draft)} ${f(S.x)} ${f(S.y + draft)}C${f(S.x + hl * 0.6)} ${f(S.y + draft)} ${f(stern - 3 * s)} ${f(S.y + draft * 0.8)} ${f(stern + 1.5 * s)} ${f(S.y - 0.5)}Z" fill="url(#wKeel)"/>` +
    `<path d="M${f(stern - 0.5 * s)} ${f(S.y - 2 * s)}L${f(stern + 3.8 * s)} ${f(S.y - 1 * s)}L${f(stern + 3 * s)} ${f(S.y + draft * 0.82)}L${f(stern - 1.5 * s)} ${f(S.y + draft * 0.86)}Z" fill="#1c1b16"/>${foul}` +
    `${frames}<g clip-path="url(#wLow)"><use href="#${u}Body"/>${brkFace}</g>`) + `</g>`;
  const sil = (flt: string) => (fallG ? `<use href="#wFallG" filter="url(#${flt})"/>` : '') + `<use href="#wHullG" filter="url(#${flt})"/>`;

  // ---- defs ----
  const cau = (id: string, fx: number, fy: number, seed: number, table: string, y0: number, h: number) =>
    `<filter id="${id}" filterUnits="userSpaceOnUse" x="0" y="${f(y0)}" width="${W}" height="${f(h)}" color-interpolation-filters="sRGB"><feTurbulence type="turbulence" baseFrequency="${fx} ${fy}" numOctaves="1" seed="${seed}" result="t"/>` +
    `<feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="a0"/><feComponentTransfer in="a0" result="a"><feFuncA type="table" tableValues="${table}"/></feComponentTransfer>` +
    `<feFlood flood-color="${sea.glow}" result="c"/><feComposite in="c" in2="a" operator="in"/></filter>`;
  /** the grain of the sand: fine specks of one colour */
  const grain = (id: string, fr: number, seed: number, table: string, color: string) =>
    `<filter id="${id}" filterUnits="userSpaceOnUse" x="0" y="${f(H)}" width="${W}" height="${f(PAGE.h - H)}" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="${fr}" numOctaves="2" seed="${seed}" result="t"/>` +
    `<feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.5 0 0 0 -.25" result="a0"/><feComponentTransfer in="a0" result="a"><feFuncA type="table" tableValues="${table}"/></feComponentTransfer>` +
    `<feFlood flood-color="${color}"/><feComposite in2="a" operator="in"/></filter>`;
  const stoneC = mix(sd2, '#5c5a56', 0.35);
  // the char runs from charFrom aft: soot only before it
  const cx0 = S.x + (S.charFrom ?? -sp.len) * s;
  out.push(`<defs>
<linearGradient id="wW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${w0}"/><stop offset=".45" stop-color="${w1}"/><stop offset=".72" stop-color="${mix(w1, w2, 0.6)}"/><stop offset="1" stop-color="${w2}"/></linearGradient>
<radialGradient id="wSun" cx=".3" cy="-.08" r=".7"><stop offset="0" stop-color="${sea.glow}" stop-opacity=".42"/><stop offset=".5" stop-color="${sea.glow}" stop-opacity=".1"/><stop offset="1" stop-color="${sea.glow}" stop-opacity="0"/></radialGradient>
<linearGradient id="wRay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sea.glow}" stop-opacity="1"/><stop offset=".55" stop-color="${sea.glow}" stop-opacity=".35"/><stop offset="1" stop-color="${sea.glow}" stop-opacity="0"/></linearGradient>
<linearGradient id="wTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
<mask id="wTopM" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="30"><rect width="${W}" height="30" fill="url(#wTop)"/></mask>
<linearGradient id="wFloor" gradientUnits="userSpaceOnUse" x1="0" y1="${H - 1}" x2="0" y2="${PAGE.h}"><stop offset="0" stop-color="${fog}"/><stop offset=".12" stop-color="${mix(fog, sd2, 0.45)}"/><stop offset=".34" stop-color="${mix(sd1, fog, 0.25)}"/><stop offset=".6" stop-color="${sd1}"/><stop offset=".82" stop-color="${mix(sd1, sd0, 0.3)}"/><stop offset="1" stop-color="${mix(sd1, sd0, 0.42)}"/></linearGradient>
<linearGradient id="wFade" gradientUnits="userSpaceOnUse" x1="0" y1="${H}" x2="0" y2="${H + 22}"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient>
<linearGradient id="wNearG" gradientUnits="userSpaceOnUse" x1="0" y1="${H + 18}" x2="0" y2="${PAGE.h}"><stop offset="0" stop-color="#000"/><stop offset="${f(16 / (PAGE.h - H - 18))}" stop-color="#fff"/><stop offset="1" stop-color="#5a5a5a"/></linearGradient>
<linearGradient id="wFarG" gradientUnits="userSpaceOnUse" x1="0" y1="${H + 18}" x2="0" y2="${H + 34}"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
<linearGradient id="wKeel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix('#4a4632', sea.weed[2], .35)}"/><stop offset=".45" stop-color="${mix('#262618', sea.weed[2], .3)}"/><stop offset="1" stop-color="#0e100c"/></linearGradient>
<linearGradient id="wAO" gradientUnits="userSpaceOnUse" x1="0" y1="${f(hullTop)}" x2="0" y2="${f(crestMax)}"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".5" stop-color="#000" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".34"/></linearGradient>
<linearGradient id="wCrestHi" gradientUnits="userSpaceOnUse" x1="${f(B0)}" y1="0" x2="${f(B1)}" y2="0"><stop offset="0" stop-color="${mix(sd0, sd1, .3)}" stop-opacity="0"/><stop offset=".16" stop-color="${mix(sd0, sd1, .3)}" stop-opacity="1"/><stop offset=".86" stop-color="${mix(sd0, sd1, .3)}" stop-opacity="1"/><stop offset="1" stop-color="${mix(sd0, sd1, .3)}" stop-opacity="0"/></linearGradient>
<linearGradient id="wCrestSh" gradientUnits="userSpaceOnUse" x1="${f(B0)}" y1="0" x2="${f(B1)}" y2="0"><stop offset="0" stop-color="${sd2}" stop-opacity="0"/><stop offset=".16" stop-color="${sd2}" stop-opacity="1"/><stop offset=".86" stop-color="${sd2}" stop-opacity="1"/><stop offset="1" stop-color="${sd2}" stop-opacity="0"/></linearGradient>
<linearGradient id="wCharG" gradientUnits="userSpaceOnUse" x1="${f(cx0 - 14)}" y1="0" x2="${f(cx0 + 22)}" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></linearGradient>
<mask id="wCharM" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${PAGE.h}"><rect width="${W}" height="${PAGE.h}" fill="url(#wCharG)"/></mask>
<radialGradient id="wPeb" cx=".34" cy=".28" r=".85"><stop offset="0" stop-color="${mix(stoneC, '#ffffff', .4)}"/><stop offset=".5" stop-color="${stoneC}"/><stop offset="1" stop-color="${mix(stoneC, '#000000', .5)}"/></radialGradient>
<radialGradient id="wBack" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${sea.back[0]}" stop-opacity="${sea.back[1]}"/><stop offset=".6" stop-color="${sea.back[0]}" stop-opacity="${sea.back[1] * 0.45}"/><stop offset="1" stop-color="${sea.back[0]}" stop-opacity="0"/></radialGradient>
<radialGradient id="wVig" cx=".5" cy=".42" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></radialGradient>
<filter id="wDesat" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="${f(1 - (S.fade ?? 0) * 0.55)}"/></filter>
<filter id="wB3" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
<filter id="wB2" x="-30%" y="-10%" width="160%" height="120%"><feGaussianBlur stdDeviation="2.2"/></filter>
<filter id="wB1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".9"/></filter>
<filter id="wB05" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".45"/></filter>
<filter id="wB02" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".22"/></filter>${ageDefs()}
${hullAgeDefs()}
<filter id="wSolid" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB"><feComponentTransfer in="SourceAlpha" result="a"><feFuncA type="table" tableValues="0 1 1 1 1"/></feComponentTransfer><feFlood flood-color="${mix('#1e1c16', sea.weed[2], 0.3)}"/><feComposite in2="a" operator="in"/></filter>
<filter id="wWhite" x="-5%" y="-5%" width="110%" height="110%"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0"/></filter>
<filter id="wBlack" x="-5%" y="-5%" width="110%" height="110%"><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/></filter>
${cau('wCauF', 0.12, 0.36, sea.seed, '1 .4 .08 0 0 0 0 0 0 0 0 0', H, PAGE.h - H)}
${cau('wCauN', 0.042, 0.105, sea.seed + 7, '1 .55 .18 0 0 0 0 0 0 0 0 0', H, PAGE.h - H)}
${grain('wGrainD', 1.7, sea.seed + 3, '0 0 0 0 0 .5 1', sd2)}
<filter id="wAlg" filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${PAGE.h}" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".11 .26" numOctaves="4" seed="${sea.seed + 11}" result="t"/><feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.5 0 0 0 -.25" result="a0"/><feComponentTransfer in="a0" result="a"><feFuncA type="table" tableValues="0 0 0 .35 .9 1"/></feComponentTransfer><feFlood flood-color="${mix(sea.weed[2], '#4a3e22', 0.35)}"/><feComposite in2="a" operator="in"/></filter>
${grain('wGrainL', 2.3, sea.seed + 5, '0 0 0 0 0 0 .6 1', mix(sd0, '#ffffff', 0.2))}
<g id="${u}Body">${body}</g>
<clipPath id="wLow"><polygon points="${poly(low)}"/></clipPath>${high}${parts}
${hullG}${fallG}
<mask id="wSilM" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${PAGE.h}">${sil('wWhite')}</mask>
<mask id="wFloorM" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${PAGE.h}"><path d="${floorD}" fill="url(#wFade)"/>${sil('wBlack')}<path d="${bermD}" fill="url(#wFade)"/></mask>
<mask id="wNearM" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${PAGE.h}"><rect width="${W}" height="${PAGE.h}" fill="url(#wNearG)"/></mask>
<mask id="wFarM" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${PAGE.h}"><rect width="${W}" height="${PAGE.h}" fill="url(#wFarG)"/></mask>
<clipPath id="wFloorC"><path d="${floorD}"/></clipPath>
</defs>`);

  // ---- the water ----
  out.push(`<rect width="${W}" height="${PAGE.h}" fill="url(#wW)"/><rect width="${W}" height="${PAGE.h}" fill="url(#wSun)"/>`);
  let net = '';
  for (let k = 0; k < 18; k++) {
    const y0 = 1 + R() * 22, a = 0.8 + R() * 1.6, p = 6 + R() * 10, ph = R() * 6, pts: P[] = [];
    for (let x = -4; x <= W + 4; x += 4) pts.push([x, y0 + Math.sin(x / p + ph) * a + Math.sin(x / (p * 0.37) + ph * 2) * a * 0.4]);
    net += `<path d="${spline(pts)}" fill="none" stroke="${sea.glow}" stroke-width="${f(0.25 + R() * 0.35)}" stroke-opacity="${f(0.25 + R() * 0.3)}"/>`;
  }
  out.push(`<g mask="url(#wTopM)" filter="url(#wB05)">${net}</g>`);
  out.push(`<ellipse cx="${f(S.x + 10)}" cy="${f(S.y - 50)}" rx="150" ry="80" fill="url(#wBack)"/>`);
  // far rays, behind everything: the light reaching the far floor
  const SRC: P = [30, -320];
  const ray = (xb: number, w: number, len: number, op: number) => {
    const d0 = Math.hypot(xb - SRC[0], -4 - SRC[1]), ux = (xb - SRC[0]) / d0, uy = (-4 - SRC[1]) / d0, k = (d0 + len) / d0, nx = -uy, ny = ux;
    const a: P = [xb, -4], b: P = [xb + nx * w, -4 + ny * w], c: P = [xb + ux * len + nx * w * k, -4 + uy * len + ny * w * k], e: P = [xb + ux * len, -4 + uy * len];
    return `<polygon points="${poly([a, b, c, e])}" fill="url(#wRay)" opacity="${f(op)}"/>`;
  };
  let farRays = '';
  for (let i = 0; i < 7; i++) farRays += ray(-20 + i * 48 + R() * 30, 10 + R() * 20, H + 10, sea.rays * 0.3);
  out.push(`<g filter="url(#wB3)">${farRays}</g>`);

  // ---- the floor: one plane from the foot of the sheet to the far edge, where it dissolves in the water ----
  out.push(`<path d="${floorD}" fill="url(#wFloor)"/><path d="${spline(fp)}" fill="none" stroke="${fog}" stroke-width="3" filter="url(#wB1)"/>`);
  // far things on the floor: reefs on the far edge, rocks and weed nearer, all paler with distance
  let far = '';
  for (let i = 0; i < 9; i++) { const x = 6 + i * 36 + R() * 20, w = 18 + R() * 26, y = farTop(x) + 0.8; far += `<path d="M${f(x - w / 2)} ${f(y)}C${f(x - w / 3)} ${f(y - 3 - R() * 4)} ${f(x + w / 4)} ${f(y - 4 - R() * 5)} ${f(x + w / 2)} ${f(y)}Z" fill="${mix(fog, w2, 0.3)}" fill-opacity=".8"/>`; }
  out.push(`<g filter="url(#wB1)">${far}</g>`);
  const WK: WeedKind[] = ['grass', 'bush', 'ribbon', 'lettuce'];
  let mid = '';
  for (let i = 0; i < 16; i++) {
    const x = R() * W, y = farTop(x) + 2 + R() * 16, k = dep(y), op = clamp01(0.25 + k * 1.8);
    if (R() < 0.55) mid += `<g opacity="${f(op)}">${stone(x, y, (5 + R() * 12) * (0.4 + k * 1.6), (2.4 + R() * 4) * (0.4 + k * 1.6), R, false, i % 3)}</g>`;
    else mid += `<g opacity="${f(op * 0.9)}">${weed(WK[i % 4], x, y + 0.5, (6 + R() * 8) * (0.4 + k * 1.4), mix(sea.weed[i % 3], fog, 0.45), R)}</g>`;
  }
  out.push(`<g filter="url(#wB05)">${mid}</g>`);
  out.push(`<g filter="url(#wB05)">${school({ x: W - 96, y: H - 34, w: 80, h: 12 }, 16, 2.4, sea, R, 1)}</g>`);
  // the shadow of the hull on the floor behind it, to the right (the light is above, a little to the left and behind us)
  out.push(`<g clip-path="url(#wFloorC)"><polygon points="${poly(hull.map(q => [q[0] + 12, q[1] + (q[1] - crestMax) * -0.15 - 3] as P))}" fill="#000" fill-opacity=".34" filter="url(#wB3)"/></g>`);
  // the lighter water right behind a dark hull: a soft glow round its body, its stumps and its stern post
  if (sea.halo) {
    const up = hull.map(q => [q[0], q[1] - 7] as P);
    out.push(`<filter id="wHalo" filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${PAGE.h}"><feGaussianBlur stdDeviation="5"/></filter>` +
      `<g filter="url(#wHalo)" opacity="${f(sea.halo[1])}" fill="${sea.halo[0]}" stroke="${sea.halo[0]}" stroke-width="12" stroke-linejoin="round"><polygon points="${poly(hull)}"/><polygon points="${poly(up)}"/></g>`);
  }
  // the fallen top lies behind the hull; its shadow on the sand under its tip
  const fallMounds = () => {
    if (!fall || !S.fall) return '';
    const F = rot([mx[S.fall.mast], deck]); let o2 = '';
    for (const t of [0.5, 0.66, 0.8, 0.93]) {
      const x = F[0] + (fall.tip[0] - F[0]) * t, y = F[1] + (fall.tip[1] - F[1]) * t;
      if (y < floorTop(x) + 1) continue;
      const w = 6 + R() * 4, h = 3 + R() * 1.4, d = `M${f(x - w)} ${f(y + 1.6)}C${f(x - w * 0.5)} ${f(y - h)} ${f(x + w * 0.4)} ${f(y - h * 0.9)} ${f(x + w)} ${f(y + 1.6)}Z`;
      o2 += `<clipPath id="wFm${Math.round(t * 100)}"><path d="${d}"/></clipPath><path d="${d}" fill="url(#wFloor)"/><g clip-path="url(#wFm${Math.round(t * 100)})"><use href="#wNearFloor"/></g><path d="M${f(x - w * 0.8)} ${f(y - h * 0.2)}Q${f(x - w * 0.3)} ${f(y - h)} ${f(x + w * 0.3)} ${f(y - h * 0.85)}" fill="none" stroke="${sd0}" stroke-width=".35" stroke-opacity=".55"/>`;
    }
    const t = 0.42, x = F[0] + (fall.tip[0] - F[0]) * t, y = F[1] + (fall.tip[1] - F[1]) * t;
    return o2 + rag(x - 4, y + 0.6, 9, 5.5, mix(sea.rag, sea.haze[0], sea.haze[1]), R, 0.7, 0.8, (fall.tip[1] - F[1]) / (fall.tip[0] - F[0]), false);
  };
  const fallSvg = () => fall ? `<ellipse cx="${f(fall.tip[0] - S.fall!.side * 10)}" cy="${f(fall.ty + 0.8)}" rx="16" ry="1.6" fill="#000" fill-opacity=".35" filter="url(#wB1)"/><use href="#wFallG" filter="url(#wDesat)"/>` +
    `<path d="M${f(fall.tip[0] - 5)} ${f(fall.ty + 0.9)}C${f(fall.tip[0] - 3)} ${f(fall.ty - 1.2)} ${f(fall.tip[0] + 3)} ${f(fall.ty - 1.4)} ${f(fall.tip[0] + 5)} ${f(fall.ty + 0.9)}Z" fill="url(#wFloor)"/>` : '';
  if (fall && !S.fall!.front) out.push(fallSvg());
  // ---- the wreck ----
  out.push(`<g filter="url(#wSolid)"><use href="#wHullG"/></g><use href="#wHullG" filter="url(#wDesat)"/>`);
  // the age of the hull, on its own pixels: charred (black blotches, grey ash in the cracks) from the waist aft, the paint
  // dulled, washed out and peeling to the grey wood in patches (the planks show in them), silt along the rail, barnacles
  // and coralline crust low on the side, rust run from the bolts along the waterline
  const burnt = S.burnt ?? 0, fade = S.fade ?? 0, growth = S.growth ?? 0;
  let age = '';
  if (burnt) age += `<rect width="${W}" height="${PAGE.h}" fill="#2a1e1a" opacity="${f(burnt * 0.45)}"/><g mask="url(#wCharM)"><rect width="${W}" height="${PAGE.h}" fill="#1a1210" opacity="${f(burnt * 0.2)}"/><rect width="${W}" height="${PAGE.h}" filter="url(#wChar0)" opacity="${f(burnt * 0.8)}"/>${inShip(charSvg(stem - 6 * s, hullTop - 30, xEnd + 2, S.y + 2, RD, burnt))}<rect width="${W}" height="${PAGE.h}" filter="url(#wChar1)" opacity="${f(burnt * 0.5)}"/></g>`;
  if (fade) {
    let planks = '';
    for (let y = deck - 6 * s; y < S.y + draft; y += 1.25 * s) { planks += `M${f(stem - 10)} ${f(y)}H${f(xEnd + 4)}`; }
    let butts = ''; for (let i = 0; i < 70; i++) { const x = stem + RD() * (xEnd - stem), y = deck - 6 * s + Math.floor(RD() * 20) * 1.25 * s; butts += `M${f(x)} ${f(y)}v${f(1.25 * s)}`; }
    age += `<rect width="${W}" height="${PAGE.h}" fill="${mix('#8e9a98', sea.haze[0], 0.3)}" opacity="${f(fade * 0.24)}"/><rect width="${W}" height="${PAGE.h}" filter="url(#wPeel)" opacity="${f(fade * 0.35)}"/>`;
    age += `<mask id="wPeelM" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${PAGE.h}"><rect width="${W}" height="${PAGE.h}" filter="url(#wPeel)"/></mask>` +
      `<g mask="url(#wPeelM)" opacity="${f(Math.min(1, fade * 1.05))}"><rect width="${W}" height="${PAGE.h}" fill="${burnt ? '#3a302b' : '#8a8274'}"/>${inShip(`<path d="${planks}" stroke="#2e2820" stroke-width="${f(0.22 * s)}" stroke-opacity=".75"/><path d="${butts}" stroke="#2e2820" stroke-width="${f(0.2 * s)}" stroke-opacity=".6"/>`)}</g>`;
  }
  const railPts: P[] = []; for (let X = -sp.len / 2 + 2; X <= (xAft < xEnd ? (xAft - S.x) / s : sp.len / 2); X += 2) railPts.push(rot(geom.nearRail(X) as P));
  age += `<path d="${spline(railPts.map(q => [q[0], q[1] + 0.6] as P))}" fill="none" stroke="${mix(mix(sd1, sd0, 0.4), '#8c887a', 0.3)}" stroke-width="${f(0.6 * s)}" stroke-opacity=".55" filter="url(#wB02)"/>`;
  if (!burnt) {
    // rust from the bolts and the chains of the shrouds, run down the side to the waterline
    let rust = '';
    for (let i = 0; i < 26; i++) { const X = -sp.len / 2 + 8 + RD() * (sp.len - 14), q = geom.nearRail(X) as P, t = 0.25 + RD() * 0.6, y0 = S.y + t * (q[1] - S.y), l = (2 + RD() * 5) * s * 0.5; if (S.x + X * s > xAft) continue; rust += `<path d="M${f(q[0])} ${f(y0)}q${f((RD() - 0.5) * 0.4)} ${f(l * 0.5)} ${f((RD() - 0.5) * 0.3)} ${f(l)}" stroke="#8a4a22" stroke-width="${f(0.3 + RD() * 0.4)}" stroke-opacity=".5" fill="none" stroke-linecap="round"/><circle cx="${f(q[0])}" cy="${f(y0)}" r=".3" fill="#2a1408"/>`; }
    age += inShip(rust);
  }
  let bar = '';
  for (let i = 0; i < 70 * growth; i++) {
    const X = -sp.len / 2 + 6 + RD() * (sp.len - 10), q = geom.nearRail(X) as P, t = Math.pow(RD(), 1.6) * (S.reef ? 0.95 : 0.7), c = rot([q[0], S.y + t * (q[1] - S.y)]);
    if (c[1] > crest(c[0]) - 1 || (xAft < xEnd && q[0] > xAft)) continue;
    const n = 2 + Math.floor(RD() * 5), r0 = (0.25 + RD() * 0.3) * s * 0.55;
    if (RD() < 0.3) bar += `<ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="${f(r0 * 5)}" ry="${f(r0 * 2.2)}" fill="${mix(coral[2], '#c8b8b0', 0.4)}" fill-opacity=".35"/>`;
    for (let k = 0; k < n; k++) bar += barnacle(c[0] + (RD() - 0.5) * r0 * 6, c[1] + (RD() - 0.5) * r0 * 3, r0 * (0.6 + RD() * 0.6));
  }
  out.push(`<g mask="url(#wSilM)">${age}</g>${inShip(`<g clip-path="url(#wLow)">${dmg}${rotG}</g>`)}<g mask="url(#wSilM)">${bar}</g>`);
  // the hull in the water: darker down to the sand, the water between us and it (no caustics on it: the net of light lies
  // on the sand); the reef: the floor's own colour taken into it
  out.push(`<g mask="url(#wSilM)"><rect width="${W}" height="${PAGE.h}" fill="url(#wAO)"/><rect width="${W}" height="${PAGE.h}" fill="${sea.haze[0]}" fill-opacity="${f(sea.haze[1] * (S.reef ? 0.4 : 1))}"/>${S.reef ? `<rect width="${W}" height="${PAGE.h}" fill="${mix('#1a2a20', sea.weed[2], 0.3)}" fill-opacity=".32"/>` : ''}</g>`);
  // a dark hull darkened towards a silhouette; then the rim of light along its upper edges (the light from above, a little
  // from the left): the silhouette less itself moved down and right
  if (sea.dark) out.push(`<g mask="url(#wSilM)"><rect width="${W}" height="${PAGE.h}" fill="${sea.dark[0]}" fill-opacity="${f(sea.dark[1])}"/></g>`);
  if (sea.rim) out.push(`<filter id="wRim" filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${PAGE.h}" color-interpolation-filters="sRGB"><feOffset in="SourceAlpha" dx=".3" dy=".85" result="o"/><feComposite in="SourceAlpha" in2="o" operator="out" result="e"/><feGaussianBlur in="e" stdDeviation=".16" result="b"/><feComposite in="b" in2="SourceAlpha" operator="in" result="r"/><feFlood flood-color="${sea.rim[0]}"/><feComposite in2="r" operator="in"/></filter>` +
    `<g opacity="${f(sea.rim[1])}">${sil('wRim')}</g>`);
  // the floor taking the hull in: sand drifted up its side from the bank (soft, uneven), lumps of silt along the rail,
  // the seams opened between the planks here and there
  const upS = cp.filter(q => q[0] > stemP[0] - 4 && q[0] < sternP[0] + 4);
  let creep = `<rect width="${W}" height="${PAGE.h}" fill="${mix(mix(sd2, '#3a3a2c', 0.4), sea.weed[2], 0.25)}" opacity="${f(S.grime ?? 0.15)}"/><path d="${spline(upS.map(q => [q[0], q[1] - 3.2] as P))}" fill="none" stroke="${mix(sd1, sd2, 0.25)}" stroke-width="6.5" stroke-opacity="${S.reef ? 0.5 : 0.36}" filter="url(#wB2)"/>`;
  creep += `<rect width="${W}" height="${PAGE.h}" filter="url(#wPeel)" opacity="${f(0.12 + growth * 0.06)}"/><rect width="${W}" height="${PAGE.h}" filter="url(#wAlg)" opacity="${f(Math.min(0.5, 0.18 + growth * 0.2) * (burnt > 0.5 ? 0.5 : 1))}"/>`;
  let gaps = '';
  for (let i = 0; i < 22; i++) { const X = -sp.len / 2 + 8 + RD() * (sp.len - 16), q = geom.nearRail(X) as P, t = 0.15 + RD() * 0.65, y = S.y + t * (q[1] - S.y); if (q[0] > xAft - 3 * s) continue; gaps += `<path d="M${f(q[0])} ${f(y)}h${f((1.5 + RD() * 5) * s * 0.6)}" stroke="#050403" stroke-width="${f(0.32 * s)}" stroke-opacity=".8"/>`; }
  let lumps = '';
  for (let i = 1; i < railPts.length - 1; i++) { if (RD() < 0.4) continue; const [x, y] = railPts[i], w = 1.2 + RD() * 3.5; lumps += `<path d="M${f(x - w)} ${f(y + 0.7)}Q${f(x - w * 0.2)} ${f(y - 0.5 - RD() * 0.9)} ${f(x + w)} ${f(y + 0.7)}Z" fill="${mix(mix(sd1, sd0, 0.35), sea.haze[0], 0.25)}" fill-opacity=".85"/>`; }
  out.push(`<g mask="url(#wSilM)">${creep}</g>`, inShip(`<g clip-path="url(#wLow)">${gaps}</g>`), lumps);
  const hz = (c: string) => mix(c, sea.haze[0], sea.haze[1]);
  // rigging from the stumps down to the rail, slack, some ropes parted and hanging loose (burnt away on a burnt ship: a
  // stub or two); rags of sail on the spar stubs, their torn feet fringed; the sail of `tear` half torn off; on masts
  // standing with their yards — a rag under each yard, weed hanging from them on the reef
  const rope = (a: P, b: P, sag: number, w = 0.42) => `<path d="M${f(a[0])} ${f(a[1])}Q${f((a[0] + b[0]) / 2)} ${f((a[1] + b[1]) / 2 + sag)} ${f(b[0])} ${f(b[1])}" fill="none" stroke="${hz('#1e1a14')}" stroke-width="${w}" stroke-linecap="round"/>`;
  const loose = (a: P, l: number, dir: number, w = 0.36) => { const e: P = [a[0] + dir * l * 0.35 + l * 0.15, a[1] + l]; return `<path d="M${f(a[0])} ${f(a[1])}Q${f(a[0] + dir * l * 0.5)} ${f(a[1] + l * 0.3)} ${f(e[0])} ${f(e[1])}" fill="none" stroke="${hz('#1e1a14')}" stroke-width="${w}" stroke-linecap="round"/><path d="M${f(e[0])} ${f(e[1])}l${f(0.5)} ${f(1.2)}M${f(e[0])} ${f(e[1])}l${f(-0.3)} ${f(1.1)}" stroke="${hz('#3a3228')}" stroke-width=".18"/>`; };
  const rig: string[] = [], rags = S.rags ?? 0.3, slack = S.slack ?? 1;
  let torn = S.torn ?? 0;
  kept.forEach(i => {
    const t = rot([mx[i], yb[i] + 1.5 * s]);
    if (burnt > 0.5) { rig.push(rope(t, rot([mx[i] - 5 * s, yb[i] + 7 * s]), 1.5, 0.36)); return; }
    if (keepsYards(i)) {
      const ys2 = yardsOf(i).filter(y => y.c[1] > yb[i] + 1);
      ys2.forEach((y, j) => {
        const a = rot([y.c[0] - y.hw * 0.92, y.c[1] + 0.5 * s]), b = rot([y.c[0] + y.hw * 0.92, y.c[1] + 0.5 * s]), w = b[0] - a[0];
        const hgt = (j === ys2.length - 1 ? 0.8 : 0.55) * (ys2[j + 1] ? ys2[j + 1].c[1] - y.c[1] : 12 * s) + (S.reef ? 4 * s : 2 * s);
        if (rags > 0) rig.push(rag(a[0], a[1], w, Math.max(5 * s, hgt), hz(sea.rag), R, 0.7, rags, (b[1] - a[1]) / w, false));
        if (S.reef) for (let k = 0; k < 3 + Math.floor(w / 9); k++) { const p: P = [a[0] + R() * w, a[1] + (b[1] - a[1]) * R() + 0.3]; rig.push(hangWeed(p[0], p[1], 5 + R() * 14, hz(sea.weed[k % 3]), R)); }
      });
      // the shrouds: slack lines from the lower top to the rail, one parted
      const top = rot([mx[i], (yardsOf(i).find(y => y.c[1] > yb[i])?.c[1] ?? yb[i]) - 1.5 * s]);
      rig.push(rope(top, rot([mx[i] - 12 * s, deck + 1.5 * s]), 5 * slack), rope(top, rot([mx[i] + 10 * s, deck + 1 * s]), 4 * slack));
      if (torn-- > 0) rig.push(loose(rot([mx[i] + 0.4 * s, yb[i] + 8 * s]), 9 * s, -1));
      return;
    }
    rig.push(rope(t, rot([mx[i] - 16 * s, deck + 1.5 * s]), 7 * slack));
    if (torn-- > 0) rig.push(loose(rot([mx[i] + 0.4 * s, yb[i] + 2 * s]), (6 + R() * 5) * s, 1)); else rig.push(rope(t, rot([mx[i] + 13 * s, deck + 1 * s]), 6 * slack));
    if (torn-- > 0) rig.push(loose(rot([mx[i] - 0.3 * s, yb[i] + 4 * s]), (4 + R() * 4) * s, -1)); else rig.push(rope(rot([mx[i] + 0.4 * s, yb[i] + 5 * s]), rot([mx[i] - 8 * s, deck + 2 * s]), 4 * slack, 0.32));
    const big = i === S.keep || i === S.tear, a = rot([mx[i] - (big ? 6 : 3.5) * s, yb[i] + (big ? 4.5 : 6.5) * s]), rw = (big ? 12 : 7 + R() * 3) * s;
    if (rags > 0 && yb[i] < railAt(mx[i]) - 4 * s) rig.push(i === S.tear ? tornRag(a[0], a[1], rw * 1.2, 15 * s, hz(sea.rag), R, 0.8) : rag(a[0], a[1], rw, (big ? 13 : 6 + R() * 4) * s, hz(sea.rag), R, i % 2 ? -0.6 : 0.8, rags));
  });
  if (fall) { const tp = fall.tip, side2 = S.fall!.side, F = rot([mx[S.fall!.mast], deck]); for (const k of [0.45, 0.7]) rig.push(rope([F[0] + (tp[0] - F[0]) * k, F[1] + (tp[1] - F[1]) * k - 1], rot([mx[S.fall!.mast] + side2 * (6 + k * 10) * s, deck + 1.5 * s]), 5 * slack, 0.36)); }
  out.push(rig.join(''));
  // what grows on the hull: weed from the cracks along the rail and the waterline, leaning with the current; on the reef
  // corals, sponges and shells all over the side, weed hanging from the rail
  const hullW: string[] = [];
  const nW = S.reef ? 26 : 9;
  for (let i = 0; i < nW; i++) {
    const X = -sp.len / 2 + 8 + (i / (nW - 1)) * (sp.len - 16) + (R() - 0.5) * 6, q = geom.nearRail(X) as P, onRail = R() < 0.5;
    if (xAft < xEnd && q[0] > xAft) continue;
    const y = onRail ? q[1] + 0.5 : S.y + (0.15 + R() * 0.5) * (q[1] - S.y);
    hullW.push(onRail && (S.reef || R() < 0.55) ? hangWeed(q[0], y, (S.reef ? 4 : 2.5) + R() * (S.reef ? 9 : 6), hz(sea.weed[i % 3]), R) : weed(WK[(i + (onRail ? 0 : 2)) % 4], q[0], y, (2.5 + R() * 4) * (S.reef ? 1.5 : 1), hz(sea.weed[i % 3]), R));
  }
  if (S.reef) {
    // in clumps: a coral head with shells and a sponge round it, here and there along the side, more of them low
    for (let i = 0; i < 22; i++) {
      const X = -sp.len / 2 + 6 + R() * (sp.len - 10), q = geom.nearRail(X) as P, y0 = S.y + (0.05 + Math.pow(R(), 0.8) * 0.8) * (q[1] - S.y), sz = 0.5 + R() * 1.1, n = 2 + Math.floor(R() * 5 * sz);
      for (let j = 0; j < n; j++) { const x = q[0] + (R() - 0.5) * 9 * s * 0.6 * sz, y = y0 + (R() - 0.5) * 4 * s * 0.6 * sz, c = hz(coral[(i + j) % 3]), k2 = Math.floor(R() * 7), z = sz * (0.6 + R() * 0.6);
        hullW.push(k2 === 0 ? coralSprig(x, y, (4 + R() * 3) * s * 0.6 * z, c, R) : k2 === 1 ? coralCrust(x, y, (1.2 + R() * 1.2) * s * 0.6 * z, c, R) : k2 === 2 ? shell(x, y, (0.35 + R() * 0.25) * s * 0.7 * z, (R() - 0.5) * 80, j % 2) :
          k2 === 3 ? tubeSponge(x, y, (3 + R() * 3) * s * 0.6 * z, c, R) : k2 === 4 ? anemone(x, y, (2.6 + R() * 2) * s * 0.6 * z, c, R) : k2 === 5 ? smallFan(x, y, (3.5 + R() * 3) * s * 0.6 * z, c, R) : domeCoral(x, y + 0.4, (1.6 + R() * 1.5) * s * 0.6 * z, (1.2 + R() * 1) * s * 0.6 * z, c, R, `wHd${i}${j}`)); }
    }
  }
  out.push(inShip(`<g clip-path="url(#wLow)">${hullW.join('')}</g>`));
  // the hull sits in the sand: a dark seam where they meet, then the sand heaped along the side over it
  const cl = cp.filter(q => q[0] > stemP[0] - 6 && q[0] < sternP[0] + 6);
  out.push(`<path d="${spline(cl.map(q => [q[0], q[1] - 0.8] as P))}" fill="none" stroke="#000" stroke-opacity=".42" stroke-width="2.4" filter="url(#wB1)"/>`);
  out.push(`<path d="${bermD}" fill="url(#wFloor)"/>`);
  // little drifts of sand climbing the side
  let drift = '';
  for (let x = stemP[0] + 10 + R() * 8; x < sternP[0] - 8; x += 14 + R() * 16) {
    const w = 4 + R() * 6, h = 1.2 + R() * 2.2, y0 = crest(x - w), y1 = crest(x + w);
    drift += `<path d="M${f(x - w)} ${f(y0 + 0.6)}C${f(x - w * 0.4)} ${f(crest(x) - h)} ${f(x + w * 0.3)} ${f(crest(x) - h * 0.9)} ${f(x + w)} ${f(y1 + 0.6)}Z" fill="url(#wFloor)"/><path d="M${f(x - w * 0.8)} ${f(y0 - 0.1)}C${f(x - w * 0.4)} ${f(crest(x) - h)} ${f(x + w * 0.1)} ${f(crest(x) - h * 0.95)} ${f(x + w * 0.5)} ${f(crest(x) - h * 0.5)}" fill="none" stroke="${mix(sd0, sd1, .3)}" stroke-width=".4" stroke-opacity=".5"/>`;
  }
  out.push(drift);
  out.push(`<path d="${spline(cp.map(q => [q[0], q[1] + 6.5] as P))}" fill="none" stroke="url(#wCrestSh)" stroke-width="8" stroke-opacity=".28" filter="url(#wB2)"/>`);
  out.push(`<path d="${spline(cp.map(q => [q[0], q[1] + 0.6] as P))}" fill="none" stroke="url(#wCrestHi)" stroke-width=".9" stroke-opacity=".45" filter="url(#wB05)"/>`);
  let slip = '';
  for (let i = 0; i < 26; i++) { const x = B0 + 14 + R() * (B1 - B0 - 28), y = crest(x) + 1.5 + R() * 2; slip += `<path d="M${f(x)} ${f(y)}q${f(0.6 + R())} ${f(2 + R() * 2.5)} ${f(0.2 + R() * 1.2)} ${f(4 + R() * 3)}" fill="none" stroke="${sd2}" stroke-width=".3" stroke-opacity=".3"/>`; }
  out.push(slip);
  // weed and shells grown along the foot of the hull, where the sand meets it
  let foot = '';
  for (let c = 0; c < 3; c++) { const cx = stemP[0] + (sternP[0] - stemP[0]) * (0.12 + c * 0.33 + R() * 0.15), n = 2 + Math.floor(R() * 3); for (let j = 0; j < n; j++) { const x = cx + (R() - 0.5) * 9; foot += weed(WK[(c + j) % 4], x, crest(x) + 0.6, (2 + R() * 5) * (j === 0 ? 1.3 : 0.8), sea.weed[(c + j) % 3], R); } }
  out.push(foot);
  if (fall && S.fall!.front) {
    out.push(fallSvg());
    const ch = burnt ? `<rect width="${W}" height="${PAGE.h}" fill="#1a1210" opacity="${f(burnt * 0.45)}"/><rect width="${W}" height="${PAGE.h}" filter="url(#wChar0)" opacity="${f(burnt * 0.8)}"/><rect width="${W}" height="${PAGE.h}" filter="url(#wChar1)" opacity="${f(burnt * 0.5)}"/>` : '';
    out.push(`<mask id="wFallM" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${PAGE.h}"><use href="#wFallG" filter="url(#wWhite)"/></mask><g mask="url(#wFallM)">${ch}<rect width="${W}" height="${PAGE.h}" fill="${sea.haze[0]}" fill-opacity="${f(sea.haze[1] * 0.6)}"/></g>`);
  }
  // a broken hull: splintered plank ends and frames sticking out of both ends of the break into the gap
  if (SP) {
    let sp2 = '';
    const rA = rot0, rB = (p: P) => rot([p[0] + 1e-6 + Math.max(0, xs - p[0]) * 0, p[1]]);
    for (let y = railAt(xs) + 0.5 * s, n = 0; y < S.y + draft * 0.7; y += (1.5 + RD() * 2.2) * s, n++) {
      for (const sd of [-1, 1]) {
        if (RD() < 0.35) continue;
        const l = (1.2 + RD() * 3) * s, th = (0.35 + RD() * 0.3) * s, x0 = xs + sd * 2.4 * s, bend = (RD() - 0.5) * 1.6 * s;
        const pts3: P[] = [[x0, y - th / 2], [x0 - sd * l, y - th / 2 + bend], [x0 - sd * (l + 0.5 * s), y + bend], [x0 - sd * l, y + th / 2 + bend], [x0, y + th / 2]];
        const q = pts3.map(p => (sd < 0 ? rA([p[0], p[1]]) : (() => { const a = rot0(p), dx = a[0] - piv[0], dy = a[1] - piv[1]; return [piv[0] + dx * Math.cos(sa) - dy * Math.sin(sa) + SP.dx, piv[1] + dx * Math.sin(sa) + dy * Math.cos(sa) + SP.drop] as P; })()));
        // a plank end under the sand is not seen (drawn over the sand it would hang in the water over it)
        if (q.some(p => p[1] > crest(p[0]) - 0.4)) continue;
        sp2 += `<path d="M${poly(q).replace(/ /g, 'L')}Z" fill="${hz(n % 2 ? '#4a3c2c' : '#6a5a44')}" stroke="${hz('#120c08')}" stroke-width=".15"/>`;
      }
    }
    void rB;
    out.push(sp2);
  }

  // ---- the near floor: low swells of sand, fields of ripple marks with smooth sand between, the grain, the caustics
  // (finer and brighter far off, larger and fainter near; all over the sand, none on the hull or on the things) ----
  let dunes = '';
  for (let y = H + 5; y < PAGE.h + 6;) {
    const k = dep(y), pts: P[] = [], a = 0.8 + k * 3.2, per = 30 + R() * 50, ph = R() * 6, wd = 1.2 + k * 5.5;
    for (let x = -10; x <= W + 10; x += 5) pts.push([x, y + Math.sin(x / per + ph) * a + Math.sin(x / (per * 0.41) + ph * 1.7) * a * 0.4]);
    dunes += `<path d="${spline(pts)}" fill="none" stroke="${sd0}" stroke-width="${f(wd)}" stroke-opacity="${f(0.08 + 0.2 * k)}"/><path d="${spline(pts.map(q => [q[0], q[1] + wd * 0.95] as P))}" fill="none" stroke="${sd2}" stroke-width="${f(wd * 0.75)}" stroke-opacity="${f(0.05 + 0.13 * k)}"/>`;
    y += 3 + k * 13 + R() * 4;
  }
  let rip = '';
  for (let i = 0; i < 30; i++) {
    const cx = R() * W, cy = H + 3 + Math.pow(R(), 0.85) * (PAGE.h - H), k = dep(cy), rw = (12 + R() * 30) * (0.45 + k), rh = (2.5 + R() * 6) * (0.35 + k * 1.4);
    const gap = 0.6 + 2.6 * k, tilt = (R() - 0.5) * 0.14, ph = R() * 6, wl = 2.5 + 5 * k;
    for (let yy = cy - rh; yy <= cy + rh; yy += gap * (0.8 + R() * 0.4)) {
      const v = (yy - cy) / rh, half = rw * Math.sqrt(Math.max(0, 1 - v * v)) * (0.65 + R() * 0.35);
      if (half < 1.5) continue;
      const pts: P[] = [], x0 = cx - half + (R() - 0.5) * 3, x1 = cx + half + (R() - 0.5) * 3;
      for (let x = x0; x <= x1; x += 0.8 + k) pts.push([x, yy + (x - cx) * tilt + Math.sin(x / wl + ph + yy * 0.7) * 0.3 * (0.4 + k)]);
      if (pts.length < 3) continue;
      const op = 0.25 + 0.75 * (1 - v * v);
      rip += `<path d="${spline(pts)}" fill="none" stroke="${sd2}" stroke-width="${f(0.1 + 0.3 * k)}" stroke-opacity="${f((0.1 + 0.24 * k) * op)}" stroke-linecap="round"/><path d="${spline(pts.map(q => [q[0], q[1] - 0.18 - 0.42 * k] as P))}" fill="none" stroke="${sd0}" stroke-width="${f(0.08 + 0.26 * k)}" stroke-opacity="${f((0.12 + 0.3 * k) * op)}" stroke-linecap="round"/>`;
    }
  }
  out.push(`<defs><g id="wNearFloor"><g filter="url(#wB2)">${dunes}</g><g filter="url(#wB02)">${rip}</g><rect y="${H}" width="${W}" height="${PAGE.h - H}" filter="url(#wGrainD)" opacity=".5"/><rect y="${H}" width="${W}" height="${PAGE.h - H}" filter="url(#wGrainL)" opacity=".55"/>` +
    `<g mask="url(#wFarM)"><rect y="${H}" width="${W}" height="${PAGE.h - H}" filter="url(#wCauF)" opacity=".22"/></g><g mask="url(#wNearM)"><rect y="${H}" width="${W}" height="${PAGE.h - H}" filter="url(#wCauN)" opacity=".26"/></g></g></defs><g mask="url(#wFloorM)"><use href="#wNearFloor"/></g>`);

  // the drifts over the fallen top lie on the near floor's texture (else its outline shows through them)
  out.push(fallMounds());

  // ---- what lies on the near floor ----
  const taken: Box[] = props.map(p => p.box);
  const free = (b: Box) => !taken.some(q => b.x0 < q.x1 + 1 && b.x1 > q.x0 - 1 && b.y0 < q.y1 + 1 && b.y1 > q.y0 - 1);
  // stones of every shape (domes, flat slabs, broken angular pieces), some half sunk; a shell now and then
  let peb = '';
  for (let i = 0; i < 64; i++) {
    const x = R() * W, y = floorTop(x) + 2 + R() * (PAGE.h - floorTop(x)), k = dep(y), w = (0.8 + R() * 2.8) * (0.35 + k), kind = Math.floor(R() * 3), h = w * (kind === 1 ? 0.28 + R() * 0.12 : 0.4 + R() * 0.3);
    if (y > PAGE.h - 0.5 || !free({ x0: x - w, y0: y - h, x1: x + w, y1: y })) continue;
    peb += i % 13 === 12 ? shell(x, y, (0.25 + R() * 0.3) * (0.5 + k), (R() - 0.5) * 70, i % 2) : stone(x, y, w, h, R, true, kind, R() < 0.4 ? 0.3 + R() * 0.3 : 0);
  }
  out.push(peb);
  // weed on the sand in groups: a clump of each kind, of different sizes, all leaning with the current
  for (let i = 0; i < 12; i++) {
    const x = 6 + R() * (W - 12), y = Math.min(PAGE.h - 1, floorTop(x) + 1.5 + R() * 10), k = dep(y), h = (i % 4 === 0 ? 11 : 5) * (0.6 + R() * 0.8) * (0.5 + k);
    if (!free({ x0: x - 4, y0: y - 2, x1: x + 4, y1: y })) continue;
    const kind = WK[i % 4], n = 1 + Math.floor(R() * 3);
    for (let j = 0; j < n; j++) out.push(weed(kind, x + (j - (n - 1) / 2) * (2 + R() * 2), y + (R() - 0.5), h * (0.6 + R() * 0.5), sea.weed[(i + j) % 3], R));
  }
  // the things, each in the sand (wreck-props.ts): the farther first
  const paint = { floor: 'url(#wFloor)', ripples: 'wNearFloor', sand: sea.sand, haze: sea.haze[0], weed: sea.weed, glow: sea.glow, coral, depth: dep };
  [...props].sort((a, b) => a.ys - b.ys).forEach(p => out.push(propSvg(p, bodies[p.i], paint)));
  // corals in the corners, by the buried bow and past the stern: old and muted, their feet in the sand; tall weed close
  // to the eye at the edges
  const spot = (x0: number, x1: number, w: number, h: number): P | null => {
    for (let t = 0; t < 14; t++) { const x = x0 + R() * (x1 - x0), y = Math.max(floorTop(x) + 2, PAGE.h - 1.5 - R() * 12); if (free({ x0: x - w / 2, y0: y - h, x1: x + w / 2, y1: y })) { taken.push({ x0: x - w / 2, y0: y - h, x1: x + w / 2, y1: y }); return [x, y]; } }
    return null;
  };
  const foot2 = (x: number, y: number, w: number) => `<path d="M${f(x - w)} ${f(y + 0.6)}C${f(x - w * 0.5)} ${f(y - 1.6)} ${f(x + w * 0.5)} ${f(y - 1.8)} ${f(x + w)} ${f(y + 0.6)}Z" fill="url(#wFloor)"/><ellipse cx="${f(x + w * 0.5)}" cy="${f(y + 0.5)}" rx="${f(w * 0.9)}" ry=".7" fill="#000" fill-opacity=".18" filter="url(#wB05)"/>`;
  const c: string[] = [];
  let q = spot(2, 18, 22, 24); if (q) c.push(fanCoral(q[0], q[1], 20, coral[1], R) + foot2(q[0], q[1], 3));
  q = spot(6, 30, 16, 18); if (q) c.push(branchCoral(q[0], q[1], 14, coral[0], R) + foot2(q[0], q[1], 2.6));
  q = spot(0, 14, 16, 7); if (q) c.push(domeCoral(q[0], q[1], 8, 5.4, coral[2], R, 'wDome1') + foot2(q[0], q[1], 8.5));
  q = spot(W - 18, W - 4, 20, 22); if (q) c.push(fanCoral(q[0], q[1], 18, coral[1], R) + foot2(q[0], q[1], 3));
  q = spot(W - 40, W - 18, 14, 16); if (q) c.push(branchCoral(q[0], q[1], 12, coral[0], R) + foot2(q[0], q[1], 2.4));
  q = spot(W - 50, W - 26, 14, 5); if (q) c.push(domeCoral(q[0], q[1], 6.5, 4.4, coral[2], R, 'wDome2') + foot2(q[0], q[1], 7));
  q = spot(stemP[0] - 26, stemP[0] - 6, 12, 12); if (q) c.push(branchCoral(q[0], q[1], 10, coral[2], R) + foot2(q[0], q[1], 2.2));
  q = spot(sternP[0] + 8, sternP[0] + 24, 10, 5); if (q) c.push(domeCoral(q[0], q[1], 5.5, 3.8, coral[0], R, 'wDome3') + foot2(q[0], q[1], 6));
  out.push(`<g opacity=".9">${c.join('')}</g>`);
  out.push(tuft(-1, PAGE.h + 2, 46, sea.weed.map(cc => mix(cc, '#000000', .35)), R, 5), tuft(W + 1, PAGE.h + 2, 40, sea.weed.map(cc => mix(cc, '#000000', .35)), R, 4));

  // ---- the light coming down, bubbles, the fish, specks; the vignette ----
  let rays = '';
  for (let i = 0; i < 11; i++) rays += ray(-30 + i * 32 + R() * 22, 4 + R() * 14, 150 + R() * 60, sea.rays * (0.4 + R() * 0.7));
  out.push(`<g filter="url(#wB2)">${rays}</g>`);
  for (const i of kept) if (!S.fall || i !== S.fall.mast) out.push(bubbles(...rot([mx[i], yb[i]]), 0, sea.glow, R));
  out.push(bubbles(...rot([stern - 6 * s, deck - 10 * s]), 0, sea.glow, R));
  const gx = pl.title.x + pl.title.w + 8, gw = pl.col.x - 6 - gx;
  if (gw > 24) out.push(school({ x: gx, y: 8, w: gw, h: 18 }, Math.round(gw / 4.6), 4.6, sea, R));
  const cy = pl.col.y + pl.col.h;
  out.push(school({ x: pl.col.x + 6, y: cy + 8, w: pl.col.w - 10, h: 12 }, 9, 6.2, sea, R));
  out.push(fish(pl.rules.x + pl.rules.w + 14, cy + 30, 13, -4, sea.fish[0], Math.min(1, sea.fish[1] + 0.15)), fish(W - 30, H - 14, 9.5, 6, sea.fish[0], sea.fish[1] * 0.85));
  let snow = '';
  for (let i = 0; i < 260; i++) snow += `<circle cx="${f(R() * W)}" cy="${f(R() * PAGE.h * 0.92)}" r="${f(0.08 + R() * 0.28)}" fill="${sea.glow}" fill-opacity="${f(0.15 + R() * 0.35)}"/>`;
  out.push(snow, `<rect width="${W}" height="${PAGE.h}" fill="url(#wVig)"/>`);
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${PAGE.h}">${out.join('\n')}</svg>`, geo: { H, crest, floorTop, hull, keel, span, props, fall } };
}

// ---- the physics of the scene (WRECK_CHECK, printed by check.ts) ----
export const WRECK_CHECK: { board: string; issues: string[] }[] = [];
const inPoly = (p: P, poly: P[]) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) c = !c; } return c; };
function physics(g: Geo, plates: Rect[]): string[] {
  const seen = (p: P) => inPoly(p, g.hull) && p[1] < g.crest(p[0]);
  // every thing lies in the sand: part of it under the sand line, most above, its shadow at its base (wreck-props.ts)
  const issues = propIssues(g.props, g.floorTop, seen, PAGE.w);
  // the hull rests in the sand: the sand covers the keel along its whole length
  const float = g.keel.filter(k => g.crest(k[0]) > k[1] - 0.5);
  if (float.length) issues.push(`the keel shows above the sand at x ${float.map(k => Math.round(k[0])).join(', ')} (the hull floats)`);
  if (g.fall && (g.fall.tip[1] < g.fall.ty - 1 || g.fall.ty < g.H + 1)) issues.push(`the fallen mast's tip (y ${g.fall.tip[1].toFixed(1)}) does not reach the sand`);
  if (g.fall && (g.fall.tip[0] < 4 || g.fall.tip[0] > PAGE.w - 4)) issues.push(`the fallen mast's tip lies off the sheet (x ${g.fall.tip[0].toFixed(1)}): its support is not seen`);
  // the plates leave the hull free
  let all = 0, under = 0;
  const xs = g.hull.map(q => q[0]), ys = g.hull.map(q => q[1]);
  for (let x = Math.min(...xs); x <= Math.max(...xs); x += 1) for (let y = Math.min(...ys); y <= Math.max(...ys); y += 1) if (seen([x, y])) { all++; if (plates.some(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h)) under++; }
  if (under / Math.max(1, all) > 0.03) issues.push(`the plates cover ${(100 * under / all).toFixed(1)} % of the hull (more than 3 %)`);
  return issues;
}

// ---- the ship token (the same picture as the new token on sheet 04: the kit ship on paper) ----
const TPIC = { w: 30, h: 21.4 }, TPAPER = '#fbf6ea';
async function tokenPic(ctx: Ctx, ship: Ship): Promise<string> {
  const kind = DECK_KEY[ship.code], b = K.shipBox(kind, { x: 0, y: 0, scale: 1 }), m = 1.2, wl = TPIC.h - 1.4, k = Math.min((TPIC.w - 2 * m) / b.w, (wl - m) / b.h);
  const body = K.ship('tk' + kind, K.makeLight(K.LIGHTS.endeavour, { horizon: wl - 2 }), { kind, x: TPIC.w / 2 - k * (b.x0 + b.x1) / 2, y: wl, scale: k });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TPIC.w} ${TPIC.h}"><rect width="${TPIC.w}" height="${TPIC.h}" fill="${TPAPER}"/>${body}<path d="M1 ${wl + 0.5}q1.2 -.6 2.4 0${'t2.4 0'.repeat(11)}" fill="none" stroke="#6f8a96" stroke-width=".25"/></svg>`;
  return (await rasterJpeg(ctx.browser, 'token-ship-' + kind, svg, TPIC.w, TPIC.h, ctx.opts.draft ? 300 : 600, 0.92)).url;
}

// ---- the plates ----
const TITLE_O: TO = { font: 'Alegreya SC', w: 800, ls: '.06em' }, SUB_O: TO = { font: 'Alegreya', italic: true, w: 500 };
const HEAD_O: TO = { font: 'Alegreya SC', w: 800, ls: '.04em' }, LAB_O: TO = { font: 'Alegreya', w: 800 };
const COL = { w: 90, pad: 4.5, token: 24, row: 10.5, icon: 8.6 };
/** the scroll: the paper hangs from the top roller (at y) down to the bottom roll; the text's margins inside the paper */
const RULES = { y: 41, padX: 10, padTop: 7.5, padBottom: 9.5, maxBottom: 140 };
const r2 = (n: number) => Math.round(n * 100) / 100;
/** the icons by the list of «Корабль тонет»: the hand of cards, a card played with the Charge to the ally's Volley, the reaction, the move */
const LI_ICONS: IconName[] = ['cards', 'volley', 'reaction', 'sails'];
/** the note under the ally lines: what to take off this ship's board, and the Endeavour's Heart of Davy Jones */
function noteParts(ship: Ship): { icon: IconName; html: string } | null {
  const clear = FTXT.wreck.clear[ship.code] ?? FTXT.wreck.clear._, jones = jonesLine(ship), ps: string[] = [];
  if (clear) ps.push(`<p>${esc(clear)}</p>`);
  if (jones) ps.push(`<p><b>${esc(FTXT.wreck.jones)}</b> ${esc(noRef(jones))}</p>`);
  if (!ps.length) return null;
  return { icon: jones ? 'heartChest' : /«Под водой»/.test(clear) ? 'underwater' : 'plan', html: ps.join('') };
}
/** the measured HTML blocks: the rules on the scroll and the note in the column */
const FIT = new Map<string, { rs: number; rh: number; ns: number; nh: number }>();
async function fitBlocks(ctx: Ctx, ship: Ship, tone: IconTone, rulesW: number, noteW: number): Promise<{ rs: number; rh: number; ns: number; nh: number }> {
  const got = FIT.get(ship.code); if (got) return got;
  const page = await ctx.browser.newPage();
  const h = async (html: string, w: number) => { await page.setContent(`<!doctype html><meta charset="utf-8"><style>${fontCss()}${WRECK_CSS}</style><div id="b" style="position:absolute;left:0;top:0;width:${w}mm">${html}</div>`); await page.evaluate(async () => { await document.fonts.ready; }); return (await page.evaluate(() => (document.getElementById('b') as HTMLElement).scrollHeight)) * 25.4 / 96; };
  try {
    let rs = 12.5, rh = 0;
    for (; rs >= 10; rs = Math.round((rs - 0.25) * 100) / 100) { rh = await h(rulesHtml(rs, tone), rulesW); if (RULES.y + RULES.padTop + rh + RULES.padBottom <= RULES.maxBottom) break; }
    let ns = 11.5, nh = 0;
    const note = noteParts(ship);
    if (note) for (; ns >= 9.5; ns = Math.round((ns - 0.25) * 100) / 100) { nh = await h(noteHtml(note.html, ns), noteW); if (nh <= 30) break; }
    const v = { rs, rh: Math.ceil(rh * 10) / 10 + 0.4, ns, nh: note ? Math.ceil(nh * 10) / 10 + 0.4 : 0 };
    FIT.set(ship.code, v); return v;
  } finally { await page.close(); }
}
/** a small engraved flourish for the heading: a rule that ends in a lozenge and a curl (pointing to the words) */
const flourish = (flip: boolean) => `<svg class="wr-fl" viewBox="0 0 34 6" width="17mm" height="3mm"${flip ? ' style="transform:scaleX(-1)"' : ''}><path d="M1 3H22.5" stroke="currentColor" stroke-width=".55"/><path d="M4 3H20" stroke="currentColor" stroke-width="1.3" stroke-opacity=".35"/><path d="M22.5 3L25.5 .9L28.5 3L25.5 5.1Z" fill="currentColor"/><path d="M28.5 3C30.5 3 31.6 1.8 31.2 .9C30.8 .1 29.6 .4 29.8 1.4" fill="none" stroke="currentColor" stroke-width=".5"/><circle cx="1.2" cy="3" r=".8" fill="currentColor"/></svg>`;
/** the drop cap: the letter in the ship's colour on a little engraved plate with a double rule and scrolls in the corners */
const dropCap = (ch: string) => `<span class="wr-dc"><svg viewBox="0 0 40 40" preserveAspectRatio="none"><rect x=".5" y=".5" width="39" height="39" rx="1.5" fill="var(--c)"/><rect x="2.6" y="2.6" width="34.8" height="34.8" rx=".8" fill="none" stroke="#f6e7c2" stroke-width=".7" stroke-opacity=".85"/><rect x="4" y="4" width="32" height="32" fill="none" stroke="#f6e7c2" stroke-width=".3" stroke-opacity=".6"/>` +
  [[4, 4, 1, 1], [36, 4, -1, 1], [4, 36, 1, -1], [36, 36, -1, -1]].map(([x, y, a, b]) => `<path d="M${x} ${y + b * 6}C${x} ${y + b * 2} ${x + a * 2} ${y} ${x + a * 6} ${y}M${x + a * 1.6} ${y + b * 4.2}C${x + a * 2.4} ${y + b * 2.4} ${x + a * 3} ${y + b * 3} ${x + a * 2.6} ${y + b * 3.8}" fill="none" stroke="#f6e7c2" stroke-width=".55" stroke-opacity=".8"/>`).join('') +
  `</svg><span>${esc(ch)}</span></span>`;
function rulesHtml(size: number, tone: IconTone): string {
  const sec = rulesSection(FTXT.wreck.section);
  const para = sec.p.map((p, i) => {
    const t = noRef(p);
    if (i === 0 && /^\p{Lu}/u.test(t)) return `<p class="wr-first">${dropCap(t[0])}${md(t.slice(1))}</p>`;
    return `<p>${md(t)}</p>`;
  }).join('');
  return `<div class="wr-rules" style="--fs:${size}pt"><div class="wr-h">${flourish(false)}<span>${esc(FTXT.wreck.section)}</span>${flourish(true)}</div>${para}` +
    `<ul>${sec.li.map((l, i) => `<li>${iconSvg(LI_ICONS[i % LI_ICONS.length], 6.2, tone)}${md(noRef(l))}</li>`).join('')}</ul><p class="wr-q">${md(noRef(rulesLine(FTXT.wreck.captainLine)))}</p></div>`;
}
const noteHtml = (html: string, size: number) => `<div class="wr-note" style="--ns:${size}pt">${html}</div>`;
/** the heading of the column in two lines, cut at the dash: «Капитан —» / «на борту союзника» */
const headLines = () => { const t = FTXT.wreck.free, i = t.indexOf(' — '); return i > 0 ? [t.slice(0, i + 2), t.slice(i + 3)] : [t]; };

interface Plan { title: Rect; rules: Rect; col: Rect; head: Rect; rows: Rect[]; rules2: number[]; note: Rect | null; token: Rect; titleSize: number; headSize: number }
function plan(ship: Ship, fit: { rh: number; nh: number }): Plan {
  const tw = Math.max(24 + widthOf(FTXT.wreck.title, 26, TITLE_O) + 6, 24 + widthOf(`${ship.name} · ${ship.captain}`, 12, SUB_O) + 5, 112);
  const title = { x: 16, y: 11, w: tw, h: 23 };
  const col = { x: PAGE.w - 12 - COL.w, y: 11, w: COL.w, h: 0 }, p = COL.pad;
  const rules = { x: 18, y: RULES.y, w: col.x - 12 - 18, h: RULES.padTop + fit.rh + RULES.padBottom };
  const token = { x: col.x + p, y: col.y + p, w: COL.token, h: COL.token };
  const head = { x: token.x + token.w + 3, y: token.y + 1, w: col.x + col.w - p - (token.x + token.w + 3), h: COL.token - 2 };
  const lines = headLines(), widest = Math.max(...lines.map(l => widthOf(l, 12.5, HEAD_O)));
  const headSize = Math.min(12.5, Math.floor(((head.w - 4) / widest) * 12.5 * 4) / 4);
  let y = token.y + token.h + 6;
  const rows: Rect[] = [], rules2: number[] = [y - 3];
  for (let i = 0; i < 2; i++) { rows.push({ x: col.x + p, y, w: col.w - 2 * p, h: COL.row }); y += COL.row + (i ? 0 : 3); if (!i) rules2.push(y - 1.5); }
  let note: Rect | null = null;
  if (fit.nh) { y += 3; rules2.push(y); y += 3; note = { x: col.x + p, y, w: col.w - 2 * p, h: Math.max(fit.nh + 6, 13) }; y += note.h; }
  col.h = y + p - col.y;
  return { title, rules, col, head, rows, rules2, note, token, titleSize: 26, headSize };
}

/** a rope the plates hang by: a dark lay with a lighter twist; a ring at the foot when it ends on a plate */
function rope(a: P, b: P, brass?: string): string {
  const d = `M${r2(a[0])} ${r2(a[1])}L${r2(b[0])} ${r2(b[1] - (brass ? 0.9 : 0))}`;
  return `<path d="${d}" stroke="#2a1e10" stroke-width=".8"/><path d="${d}" stroke="#b89a64" stroke-width=".4" stroke-dasharray=".7 .7"/>` + (brass ? `<circle cx="${r2(b[0])}" cy="${r2(b[1] - 0.4)}" r="1.15" fill="none" stroke="${brass}" stroke-width=".45"/>` : '');
}
/** the cartouche of the title: scrolled ends like the face's header, the ship's emblem with its letter */
function titleSvg(b: Rect, ship: Ship, pal: Pal, L: Look, id: string): string {
  const { x, y, w, h } = b, out: string[] = [];
  const shape = `M${x + 5} ${y}H${x + w - 5}C${x + w - 1.5} ${y} ${x + w} ${y + 2.4} ${x + w + 2.2} ${y + 1.6}C${x + w + 0.6} ${y + h / 2} ${x + w + 0.6} ${y + h / 2} ${x + w + 2.2} ${y + h - 1.6}C${x + w} ${y + h - 2.4} ${x + w - 1.5} ${y + h} ${x + w - 5} ${y + h}H${x + 5}C${x + 1.5} ${y + h} ${x} ${y + h - 2.4} ${x - 2.2} ${y + h - 1.6}C${x - 0.6} ${y + h / 2} ${x - 0.6} ${y + h / 2} ${x - 2.2} ${y + 1.6}C${x} ${y + 2.4} ${x + 1.5} ${y} ${x + 5} ${y}Z`;
  out.push(`<path d="${shape}" fill="#05080c" fill-opacity=".38" transform="translate(.7 1)"/><path d="${shape}" fill="url(#${id}paper)" stroke="${L.paperLine}" stroke-width=".4"/>`);
  out.push(`<rect data-plate="wtitle" x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" fill="none"/><rect x="${r2(x + 1.6)}" y="${r2(y + 1.4)}" width="${r2(w - 3.2)}" height="${r2(h - 2.8)}" rx="1" fill="none" stroke="${L.paperLine}" stroke-width=".2" stroke-opacity=".8"/>`);
  const mx = x + 11.5, my = y + h / 2;
  // the ship's emblem, as on the face's header (parts/boards/emblem.ts)
  out.push(emblemSvg(DECK_KEY[ship.code] as ShipKey, mx, my, 6.5, { id: `${id}t`, letter: ship.code, size: 20, solid: pal.solid, deep: pal.deep, brass: L.brass, plate: 'wtitle-medal' }));
  out.push(text(x + 23.5, y + 11.2, FTXT.wreck.title, 26, { ...TITLE_O, color: pal.deep, in: 'wtitle' }));
  out.push(text(x + 23.5, y + 19.4, `${ship.name} · ${ship.captain}`, 12, { ...SUB_O, color: L.ink, in: 'wtitle' }));
  return out.join('');
}
/** the scroll's extent with its rollers (for the physics check): the knobs stick out at the sides */
const scrollBox = (b: Rect): Rect => ({ x: b.x - 8.5, y: b.y - 2, w: b.w + 17, h: b.h + 2.5 });
/** the rules: a scroll of a ship's log hanging under the cartouche — a turned wooden roller at the top, the paper hanging
 *  from it, waterlogged (stains, darker edges, the sides a little wavy), the foot rolled up round a weighted roller */
function rulesSvg(b: Rect, L: Look, pal: Pal, id: string): string {
  const { x, y, w, h } = b, out: string[] = [], ink = L.paperLine;
  const top = y + 1.2, foot = y + h - 3.4, rr = 3.1;
  // the paper: the sides sway in a little, the top edge tucked under the roller
  const paper = `M${r2(x)} ${r2(top)}H${r2(x + w)}C${r2(x + w + 0.9)} ${r2(top + (foot - top) * 0.35)} ${r2(x + w - 0.9)} ${r2(top + (foot - top) * 0.7)} ${r2(x + w)} ${r2(foot)}H${r2(x)}C${r2(x + 0.9)} ${r2(top + (foot - top) * 0.7)} ${r2(x - 0.9)} ${r2(top + (foot - top) * 0.35)} ${r2(x)} ${r2(top)}Z`;
  const stain = mix(L.paper, '#7a5a2a', 0.35);
  out.push(`<defs><radialGradient id="${id}soak" cx=".5" cy=".45" r=".72"><stop offset=".55" stop-color="${L.paper}"/><stop offset="1" stop-color="${mix(L.paper, '#6a4a24', 0.2)}"/></radialGradient>` +
    `<radialGradient id="${id}stain"><stop offset="0" stop-color="${stain}" stop-opacity="0"/><stop offset=".72" stop-color="${stain}" stop-opacity=".1"/><stop offset=".9" stop-color="${stain}" stop-opacity=".22"/><stop offset="1" stop-color="${stain}" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="${id}wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a6a38"/><stop offset=".35" stop-color="#6e4520"/><stop offset="1" stop-color="#2e1a0a"/></linearGradient>` +
    `<linearGradient id="${id}roll" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(L.paper, '#ffffff', 0.35)}"/><stop offset=".4" stop-color="${L.paper}"/><stop offset=".8" stop-color="${mix(L.paper, '#5a3c1c', 0.32)}"/><stop offset="1" stop-color="${mix(L.paper, '#3a2410', 0.5)}"/></linearGradient>` +
    `<radialGradient id="${id}knob" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#c89a5e"/><stop offset=".5" stop-color="#7a4c22"/><stop offset="1" stop-color="#2a1608"/></radialGradient></defs>`);
  // the shadow on the water behind
  out.push(`<path d="${paper}" fill="#05080c" fill-opacity=".34" transform="translate(1.1 1.6)"/><rect x="${r2(x - 6)}" y="${r2(foot - rr + 1.4)}" width="${r2(w + 12)}" height="${r2(2 * rr)}" rx="${rr}" fill="#05080c" fill-opacity=".3"/>`);
  out.push(`<path data-plate="wtext" d="${paper}" fill="url(#${id}soak)" stroke="${ink}" stroke-opacity=".45" stroke-width=".22"/>`);
  // water stains, rings of tide-marks
  for (const [cx, cy, rx, ry] of [[0.82, 0.18, 26, 15], [0.12, 0.72, 20, 13], [0.58, 0.86, 30, 9], [0.3, 0.1, 14, 8]]) out.push(`<ellipse cx="${r2(x + w * cx)}" cy="${r2(top + (foot - top) * cy)}" rx="${rx}" ry="${ry}" fill="url(#${id}stain)"/>`);
  // the double rule of the page, the fleurons in its corners
  const fx0 = x + 3.4, fy0 = top + 3.6, fx1 = x + w - 3.4, fy1 = foot - 3;
  out.push(`<rect x="${r2(fx0)}" y="${r2(fy0)}" width="${r2(fx1 - fx0)}" height="${r2(fy1 - fy0)}" fill="none" stroke="${pal.deep}" stroke-opacity=".55" stroke-width=".4"/><rect x="${r2(fx0 + 1)}" y="${r2(fy0 + 1)}" width="${r2(fx1 - fx0 - 2)}" height="${r2(fy1 - fy0 - 2)}" fill="none" stroke="${pal.deep}" stroke-opacity=".4" stroke-width=".18"/>`);
  for (const [cx, cy, a, bb] of [[fx0, fy0, 1, 1], [fx1, fy0, -1, 1], [fx0, fy1, 1, -1], [fx1, fy1, -1, -1]]) out.push(`<path d="M${r2(cx + a * 1)} ${r2(cy + bb * 1)}l${a * 2.2} ${bb * 2.2}" stroke="${pal.deep}" stroke-opacity=".5" stroke-width=".3"/><path d="M${r2(cx + a * 3.6)} ${r2(cy + bb * 2.4)}c${a * -0.2} ${bb * -1.5} ${a * 1.8} ${bb * -1.8} ${a * 2.2} ${bb * -0.6}M${r2(cx + a * 2.4)} ${r2(cy + bb * 3.6)}c${a * -1.5} ${bb * -0.2} ${a * -1.8} ${bb * 1.8} ${a * -0.6} ${bb * 2.2}" fill="none" stroke="${pal.deep}" stroke-opacity=".55" stroke-width=".3"/><circle cx="${r2(cx + a * 2)}" cy="${r2(cy + bb * 2)}" r=".55" fill="${pal.deep}" fill-opacity=".6"/>`);
  // the top roller: a turned rod with knobs, the paper wrapped once round it
  const knob = (cx: number, cy: number, r: number) => `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r}" fill="url(#${id}knob)" stroke="#1e1006" stroke-width=".25"/><circle cx="${r2(cx - r * 0.3)}" cy="${r2(cy - r * 0.35)}" r="${r2(r * 0.28)}" fill="#f0d6a6" fill-opacity=".55"/>`;
  out.push(`<rect x="${r2(x - 5.5)}" y="${r2(top - 1.9)}" width="${r2(w + 11)}" height="3.8" rx="1.9" fill="url(#${id}wood)" stroke="#1e1006" stroke-width=".25"/><rect x="${r2(x - 0.6)}" y="${r2(top - 2.1)}" width="${r2(w + 1.2)}" height="4.2" rx="2" fill="url(#${id}roll)" stroke="${ink}" stroke-opacity=".5" stroke-width=".2"/>`);
  out.push(`<path d="M${r2(x - 3.8)} ${r2(top - 1.6)}V${r2(top + 1.6)}M${r2(x + w + 3.8)} ${r2(top - 1.6)}V${r2(top + 1.6)}" stroke="#2a1608" stroke-width=".3"/>`, knob(x - 7, top, 2.4), knob(x + w + 7, top, 2.4));
  // the bottom roll: the paper rolled up (its spiral shows at the ends), the weighted rod through it
  out.push(`<rect x="${r2(x - 5.5)}" y="${r2(foot - 1.7)}" width="${r2(w + 11)}" height="3.4" rx="1.7" fill="url(#${id}wood)" stroke="#1e1006" stroke-width=".25"/>`);
  out.push(`<rect x="${r2(x - 0.8)}" y="${r2(foot - rr)}" width="${r2(w + 1.6)}" height="${r2(2 * rr)}" rx="${rr}" fill="url(#${id}roll)" stroke="${ink}" stroke-opacity=".55" stroke-width=".22"/><path d="M${r2(x + 1)} ${r2(foot - rr + 0.9)}H${r2(x + w - 1)}" stroke="#fffaf0" stroke-opacity=".6" stroke-width=".35"/><path d="M${r2(x + 2)} ${r2(foot + rr - 1.1)}H${r2(x + w - 2)}" stroke="${ink}" stroke-opacity=".25" stroke-width=".25"/>`);
  for (const ex of [x - 0.8 + rr * 0.55, x + w + 0.8 - rr * 0.55]) out.push(`<ellipse cx="${r2(ex)}" cy="${r2(foot)}" rx="${r2(rr * 0.55)}" ry="${rr}" fill="${mix(L.paper, '#8a6a3a', 0.25)}" stroke="${ink}" stroke-opacity=".55" stroke-width=".2"/><path d="M${r2(ex)} ${r2(foot - rr * 0.75)}c${r2(rr * 0.4)} 0 ${r2(rr * 0.4)} ${r2(rr * 1.5)} 0 ${r2(rr * 1.5)}c${r2(-rr * 0.28)} 0 ${r2(-rr * 0.28)} ${r2(-rr * 1.05)} 0 ${r2(-rr * 1.05)}c${r2(rr * 0.18)} 0 ${r2(rr * 0.18)} ${r2(rr * 0.6)} 0 ${r2(rr * 0.6)}" fill="none" stroke="${ink}" stroke-opacity=".6" stroke-width=".2"/>`);
  out.push(knob(x - 7, foot, 2.2), knob(x + w + 7, foot, 2.2));
  return out.join('');
}
/** the brass column: a plate on two ropes, rivets in the corners; the token and the heading, then the two lines for the
 *  ally set on the brass with their engraved icons in little roundels, brass rules with a lozenge between them */
function columnSvg(p: Plan, L: Look, pal: Pal, id: string, tokenUrl: string, ship: Ship, noteIcon: IconName | null): string {
  const { col } = p, [bl, bm, bd] = L.brass, ink = '#2a1a08', out: string[] = [];
  out.push(`<defs><linearGradient id="${id}col" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bl}"/><stop offset=".55" stop-color="${mix(bl, bm, 0.7)}"/><stop offset="1" stop-color="${bm}"/></linearGradient>` +
    `<radialGradient id="${id}boss" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#fff6d8"/><stop offset=".5" stop-color="${bl}"/><stop offset="1" stop-color="${bm}"/></radialGradient></defs>`);
  out.push(`<rect x="${r2(col.x + 0.8)}" y="${r2(col.y + 1.1)}" width="${col.w}" height="${r2(col.h)}" rx="2" fill="#05080c" fill-opacity=".42"/>`);
  out.push(`<rect data-plate="wcol" x="${col.x}" y="${col.y}" width="${col.w}" height="${r2(col.h)}" rx="2" fill="url(#${id}col)" stroke="${bd}" stroke-width=".35"/>`);
  out.push(`<rect x="${r2(col.x + 1.1)}" y="${r2(col.y + 1.1)}" width="${r2(col.w - 2.2)}" height="${r2(col.h - 2.2)}" rx="1.2" fill="none" stroke="${bd}" stroke-width=".2" stroke-opacity=".8"/><path d="M${r2(col.x + 2)} ${r2(col.y + 0.6)}H${r2(col.x + col.w - 2)}" stroke="#fff6d8" stroke-opacity=".6" stroke-width=".3"/>`);
  for (const [rx, ry] of [[col.x + 2.6, col.y + 2.6], [col.x + col.w - 2.6, col.y + 2.6], [col.x + 2.6, col.y + col.h - 2.6], [col.x + col.w - 2.6, col.y + col.h - 2.6]]) out.push(`<circle cx="${r2(rx)}" cy="${r2(ry)}" r=".9" fill="${bm}" stroke="${bd}" stroke-width=".22"/><circle cx="${r2(rx - 0.25)}" cy="${r2(ry - 0.25)}" r=".3" fill="#fff6d8" fill-opacity=".7"/>`);
  // the token: the kit ship on paper, the band in the ship's colour with its letter
  const t = p.token, k = t.w / 30, band = { x: t.x, y: t.y + 21.4 * k, w: t.w, h: t.h - 21.4 * k };
  out.push(`<rect x="${r2(t.x + 0.6)}" y="${r2(t.y + 0.8)}" width="${t.w}" height="${t.h}" fill="#1a0e04" fill-opacity=".35"/><g data-plate="wtoken"><rect x="${t.x}" y="${t.y}" width="${t.w}" height="${t.h}" fill="${TPAPER}"/><image href="${tokenUrl}" x="${t.x}" y="${t.y}" width="${r2(TPIC.w * k)}" height="${r2(TPIC.h * k)}" preserveAspectRatio="none"/></g>`);
  out.push(`<rect data-plate="wtoken-band" x="${r2(band.x)}" y="${r2(band.y)}" width="${r2(band.w)}" height="${r2(band.h)}" fill="${ship.color}"/><path d="M${r2(band.x)} ${r2(band.y)}H${r2(band.x + band.w)}" stroke="${bl}" stroke-width=".35"/>`);
  out.push(`<circle cx="${r2(band.x + band.w / 2)}" cy="${r2(band.y + band.h / 2)}" r="${r2(band.h / 2 - 0.5)}" fill="${mix(ship.color, '#000000', 0.25)}" stroke="${bl}" stroke-width=".3"/>`);
  out.push(text(band.x + band.w / 2, band.y + band.h / 2 + pt(7.5) * 0.33, ship.code, 7.5, { font: 'Alegreya SC', w: 800, color: '#fff4d8', anchor: 'middle', in: 'wtoken-band' }));
  out.push(`<rect x="${t.x}" y="${t.y}" width="${t.w}" height="${t.h}" fill="none" stroke="${bd}" stroke-width=".3"/>`);
  // the heading, engraved into the brass: two lines with a short rule under them
  const hd = p.head, lines = headLines(), em = pt(p.headSize), gap = em * 1.42, top = hd.y + hd.h / 2 - (gap * (lines.length - 1)) / 2 + 0.33 * em;
  out.push(`<rect data-plate="whead" x="${r2(hd.x)}" y="${r2(hd.y)}" width="${r2(hd.w)}" height="${r2(hd.h)}" fill="none"/>`);
  lines.forEach((l, i) => out.push(text(hd.x + 1.6, top + i * gap + 0.25, l, p.headSize, { ...HEAD_O, color: '#fff6d8', op: 0.55 }), text(hd.x + 1.6, top + i * gap, l, p.headSize, { ...HEAD_O, color: pal.deep, in: 'whead' })));
  // the brass rules between the parts: an engraved line with a highlight, a lozenge with dots in the middle
  const rule = (y: number, x0 = col.x + 6, x1 = col.x + col.w - 6) => { const m = (x0 + x1) / 2; return `<path d="M${r2(x0)} ${r2(y)}H${r2(m - 4)}M${r2(m + 4)} ${r2(y)}H${r2(x1)}" stroke="${bd}" stroke-width=".35"/><path d="M${r2(x0)} ${r2(y + 0.4)}H${r2(m - 4)}M${r2(m + 4)} ${r2(y + 0.4)}H${r2(x1)}" stroke="#fff6d8" stroke-opacity=".55" stroke-width=".25"/><path d="M${r2(m - 2.4)} ${r2(y)}L${r2(m)} ${r2(y - 1.3)}L${r2(m + 2.4)} ${r2(y)}L${r2(m)} ${r2(y + 1.3)}Z" fill="${bd}"/><circle cx="${r2(m - 3.4)}" cy="${r2(y)}" r=".45" fill="${bd}"/><circle cx="${r2(m + 3.4)}" cy="${r2(y)}" r=".45" fill="${bd}"/>`; };
  p.rules2.forEach(y => out.push(rule(y)));
  // the two lines for the ally: an engraved icon in a sunk roundel, the words set on the brass
  const icons: IconName[] = ['cards', 'reaction'];
  p.rows.forEach((rw, i) => {
    const cx = rw.x + COL.icon / 2 + 0.6, cy = rw.y + rw.h / 2, rr = COL.icon / 2 + 0.6;
    out.push(`<circle cx="${r2(cx + 0.25)}" cy="${r2(cy + 0.35)}" r="${r2(rr)}" fill="#1a0e04" fill-opacity=".3"/><circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(rr)}" fill="url(#${id}boss)" stroke="${bd}" stroke-width=".35"/><circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(rr - 0.7)}" fill="none" stroke="${bd}" stroke-width=".15" stroke-opacity=".8"/>`);
    out.push(ico(icons[i], cx, cy, COL.icon - 1.4, { ...L.tone, ink, paper: bl }, `wcell${i}-icon`));
    const lx = cx + rr + 2.6, lb = { x: lx, y: rw.y, w: rw.x + rw.w - lx, h: rw.h };
    out.push(`<rect data-plate="wlab${i}" x="${r2(lb.x)}" y="${r2(lb.y)}" width="${r2(lb.w)}" height="${r2(lb.h)}" fill="none"/>`);
    const by = lb.y + lb.h / 2 + 0.33 * pt(13);
    out.push(text(lb.x + 1.5, by + 0.25, FTXT.wreck.ally[i], 13, { ...LAB_O, color: '#fff6d8', op: 0.55 }), text(lb.x + 1.5, by, FTXT.wreck.ally[i], 13, { ...LAB_O, color: ink, in: `wlab${i}` }));
  });
  // the note: a slip of parchment riveted into the brass, its icon at the left
  const n = p.note;
  if (n && noteIcon) {
    out.push(`<rect x="${r2(n.x + 0.4)}" y="${r2(n.y + 0.6)}" width="${r2(n.w)}" height="${r2(n.h)}" rx="1" fill="#1a0e04" fill-opacity=".3"/><rect data-plate="wnote" x="${r2(n.x)}" y="${r2(n.y)}" width="${r2(n.w)}" height="${r2(n.h)}" rx="1" fill="url(#${id}paper)" stroke="${bd}" stroke-width=".3"/><rect x="${r2(n.x + 0.9)}" y="${r2(n.y + 0.9)}" width="${r2(n.w - 1.8)}" height="${r2(n.h - 1.8)}" rx=".6" fill="none" stroke="${L.paperLine}" stroke-opacity=".5" stroke-width=".18"/>`);
    for (const rx of [n.x + 1.9, n.x + n.w - 1.9]) out.push(`<circle cx="${r2(rx)}" cy="${r2(n.y + n.h / 2)}" r=".6" fill="${bm}" stroke="${bd}" stroke-width=".2"/>`);
    out.push(ico(noteIcon, n.x + 7.4, n.y + n.h / 2, 8, L.tone, 'wnote-icon'));
  }
  return out.join('');
}

/** One back «Затонул», v3. */
export async function wreckV3(ctx: Ctx, ship: Ship, mat?: ShipMaterial): Promise<{ html: string; css: string }> {
  const key = DECK_KEY[ship.code] as ShipKey, Lk = LOOKS[key], base = basePalette(ship.color), pal = mat?.palette ? mat.palette(base) : base, sea = SEA[key], id = `wr${key}`;
  const note = noteParts(ship);
  // the words' widths come from the browser: a dry run collects them
  plan(ship, { rh: 80, nh: note ? 20 : 0 });
  await measureMissing(ctx);
  const d2 = plan(ship, { rh: 80, nh: note ? 20 : 0 });
  const fit = await fitBlocks(ctx, ship, Lk.tone, d2.rules.w - 2 * RULES.padX, d2.note ? d2.note.w - 16 : 40);
  const p = plan(ship, fit);
  const { placed: props, bodies } = await placeProps(ctx, key, sea);
  const scene = seaFloorSvg(key, sea, p, props, bodies);
  const plates = [{ x: p.title.x - 2.2, y: p.title.y, w: p.title.w + 4.4, h: p.title.h }, scrollBox(p.rules), p.col];
  const issues = physics(scene.geo, plates), at = WRECK_CHECK.findIndex(c => c.board === ship.name);
  if (at >= 0) WRECK_CHECK.splice(at, 1);
  WRECK_CHECK.push({ board: ship.name, issues });
  const jpg = await rasterJpeg(ctx.browser, `wreck3-${key}`, scene.svg, PAGE.w, PAGE.h, ctx.opts.draft ? 150 : 240);
  const tokenUrl = await tokenPic(ctx, ship);
  const brass = Lk.brass[1], svg: string[] = [defsOf(id, Lk)];
  // the cartouche and the column hang on ropes from the surface; the scroll's top roller is tied under the cartouche
  const T = p.title, Rr = p.rules, ty = Rr.y + 1.2;
  svg.push(rope([T.x + 14, 0], [T.x + 14, T.y], brass), rope([T.x + T.w - 14, 0], [T.x + T.w - 14, T.y], brass));
  svg.push(rope([p.col.x + 14, 0], [p.col.x + 14, p.col.y], brass), rope([p.col.x + p.col.w - 14, 0], [p.col.x + p.col.w - 14, p.col.y], brass));
  svg.push(titleSvg(T, ship, pal, Lk, id));
  const tie = (a: P, x: number) => rope(a, [x, ty - 1.9]) + `<path d="M${r2(x - 1)} ${r2(ty - 2)}l2 3.8M${r2(x)} ${r2(ty - 2)}l2 3.8M${r2(x - 2)} ${r2(ty - 2)}l2 3.8" stroke="#2a1e10" stroke-width=".55"/><path d="M${r2(x - 1)} ${r2(ty - 2)}l2 3.8M${r2(x)} ${r2(ty - 2)}l2 3.8M${r2(x - 2)} ${r2(ty - 2)}l2 3.8" stroke="#b89a64" stroke-width=".22"/>`;
  svg.push(rulesSvg(Rr, Lk, pal, id), tie([T.x + 26, T.y + T.h - 0.6], T.x + 25), tie([T.x + T.w - 26, T.y + T.h - 0.6], T.x + T.w - 25));
  svg.push(columnSvg(p, Lk, pal, id, tokenUrl, ship, note?.icon ?? null));
  const rx = Rr.x + RULES.padX, ry = Rr.y + RULES.padTop, rw = Rr.w - 2 * RULES.padX;
  let html = `<div class="wr-abs" data-in="wtext" data-name="правила «Корабль тонет»" style="left:${r2(rx)}mm;top:${r2(ry)}mm;width:${r2(rw)}mm;height:${r2(fit.rh)}mm;--ink:${Lk.ink};--soft:${Lk.soft};--c:${pal.deep};--rule:${Lk.noteLine}">${rulesHtml(fit.rs, Lk.tone)}</div>`;
  if (note && p.note) html += `\n<div class="wr-abs" data-in="wnote" data-name="что снять" style="left:${r2(p.note.x + 13)}mm;top:${r2(p.note.y + 3)}mm;width:${r2(p.note.w - 16)}mm;height:${r2(fit.nh)}mm;--ink:${Lk.ink};--c:${pal.deep}">${noteHtml(note.html, fit.ns)}</div>`;
  return { html: `<div class="wr wr-${key}"><svg class="wr-svg" viewBox="0 0 ${PAGE.w} ${PAGE.h}"><image href="${jpg.url}" x="0" y="0" width="${PAGE.w}" height="${PAGE.h}" preserveAspectRatio="none"/>${svg.join('\n')}</svg>\n${html}</div>`, css: WRECK_CSS };
}

export const WRECK_CSS = `
.wr{position:absolute;inset:0}
.wr-svg{position:absolute;left:0;top:0;width:297mm;height:210mm}
.wr-abs{position:absolute;overflow:hidden}
.wr-rules{font:500 var(--fs) 'Alegreya Sans',sans-serif;line-height:1.27;color:var(--ink)}
.wr-rules .wr-h{display:flex;align-items:center;justify-content:center;gap:2.4mm;font:800 calc(var(--fs) + 3pt)/1.1 'Alegreya SC',serif;letter-spacing:.06em;color:var(--c);margin-bottom:2.2mm}
.wr-rules .wr-fl{flex:none;display:block}
.wr-rules p{margin:0}
.wr-rules b{font-weight:800}
.wr-rules .wr-dc{float:left;position:relative;width:calc(3 * 1.27 * var(--fs) - .5mm);height:calc(3 * 1.27 * var(--fs) - .5mm);margin:.55mm 2.2mm 0 0;font:800 calc(2.75 * var(--fs))/1 'Alegreya SC',serif;color:#fff8e6;text-align:center}
.wr-rules .wr-dc svg{position:absolute;inset:0;width:100%;height:100%}
.wr-rules .wr-dc span{position:relative;display:block;padding-top:calc(.36 * var(--fs))}
.wr-rules ul{margin:1.6mm 0 0;padding:0;list-style:none;clear:both}
.wr-rules li{position:relative;padding-left:8.4mm;margin-top:1.3mm;min-height:6.2mm}
.wr-rules li>svg{position:absolute;left:0;top:calc(.635em - 3.1mm)}
.wr-rules .wr-q{margin-top:2.4mm;padding-top:1.8mm;border-top:.3mm solid var(--rule);font:italic 500 calc(var(--fs) - .5pt)/1.27 Alegreya,serif;color:var(--soft)}
.wr-note{font:500 var(--ns) 'Alegreya Sans',sans-serif;line-height:1.25;color:var(--ink)}
.wr-note p{margin:0}
.wr-note p+p{margin-top:1.4mm}
.wr-note b{font-weight:800;color:var(--c)}
`;
