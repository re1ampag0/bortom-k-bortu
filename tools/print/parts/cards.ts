// 05 — the 96 deck cards with the 4 Legends, 07 — the 17 sea cards.
//   05-karty.pdf      faces and backs in turn (face 1, back 1, face 2 …) — for a duplex printer
//   05a-lica.pdf      faces only            05b-rubashki.pdf  backs only (for gluing two sheets together)
//   05b-rubashki-A…I  backs shifted by ±1.5 mm (the letter is the cell the needle of the calibration sheet hit)
//   07-more.pdf       sea deck, faces and backs in turn
import { data, type Ctx, type Part } from '../kit';
import { deckSheets, seaSheets } from '../layout';
import { BACK_VARIANTS, CARD_CSS, backSheetPage, faceSheet, prepareCards, type CardKit, type Mode } from '../cards';

const kits = new Map<string, CardKit>();
/** only — the card keys («Ж|Ядра») a sample needs: a sample in another mode does not rasterise the whole set again. */
export async function kitFor(ctx: Ctx, mode: Mode, only?: string[]): Promise<CardKit> {
  const full = JSON.stringify(mode), k = only ? full + only.join() : full; let kit = kits.get(full) ?? kits.get(k);
  if (!kit) kits.set(k, kit = await prepareCards(ctx, mode, only && new Set(only)));
  return kit;
}
export const defaultMode = (ctx: Ctx): Mode => ({ glass: ctx.opts.glass, index: ctx.opts.index, backs: ctx.opts.backs });
/** Shift letters А–И: a 3 × 3 grid of cells seen from the back; Д is the centre (no shift). */
export const SHIFT_LETTERS = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И'];
export const SHIFT_FILE = ['A', 'B', 'V', 'G', 'D', 'E', 'Zh', 'Z', 'I'];
export const SHIFT_STEP = 1.5;

export async function cardParts(ctx: Ctx, which: 'decks' | 'sea'): Promise<Part[]> {
  const kit = await kitFor(ctx, defaultMode(ctx)), { backShiftX: sx, backShiftY: sy } = ctx.opts;
  if (which === 'sea') {
    const sheets = seaSheets(data);
    return [{ file: '07-more', title: 'Бортом к борту — 07. Колода моря (печатать с двух сторон)', css: CARD_CSS, duplex: true, pages: sheets.flatMap(sh => [faceSheet(ctx, kit, sh), backSheetPage(kit, sh, sx, sy)]) }];
  }
  const sheets = deckSheets(data), faces = sheets.map(sh => faceSheet(ctx, kit, sh)), backs = sheets.map(sh => backSheetPage(kit, sh, sx, sy));
  const parts: Part[] = [
    { file: '05-karty', title: 'Бортом к борту — 05. Карты (печатать с двух сторон)', css: CARD_CSS, duplex: true, pages: faces.flatMap((f, i) => [f, backs[i]]) },
    { file: '05a-lica', title: 'Бортом к борту — 05а. Карты: лица', css: CARD_CSS, pages: faces },
    { file: '05b-rubashki', title: 'Бортом к борту — 05б. Карты: рубашки', css: CARD_CSS, pages: backs }
  ];
  // the needle fell into cell i of the square on the back (row-major, seen from the back): the back's print sits
  // off to the other side, so the corrected file moves it towards the needle hole
  if (!ctx.opts.draft) for (let i = 0; i < 9; i++) {
    if (i === 4) continue;
    const dx = (i % 3 - 1) * SHIFT_STEP, dy = (Math.floor(i / 3) - 1) * SHIFT_STEP;
    parts.push({ file: `05b-rubashki-${SHIFT_FILE[i]}`, title: `Бортом к борту — 05б. Рубашки, поправка «${SHIFT_LETTERS[i]}»`, css: CARD_CSS, pages: sheets.map(sh => backSheetPage(kit, sh, dx, dy, `Рубашка · поправка «${SHIFT_LETTERS[i]}» · лист ${sh.n} из ${sh.of} · верх листа`)) });
  }
  // the other back designs, one file each (no shift variants for them, review-print 18)
  for (const v of BACK_VARIANTS) if (v !== kit.mode.backs && !ctx.opts.draft) {
    const kv = await kitFor(ctx, { ...kit.mode, backs: v });
    parts.push({ file: `05b-rubashki-v${v}`, title: `Бортом к борту — 05б. Рубашки, вариант ${v}`, css: CARD_CSS, pages: sheets.map(sh => backSheetPage(kv, sh, 0, 0, `Рубашка · вариант ${v} · лист ${sh.n} из ${sh.of} · верх листа`)) });
  }
  return parts;
}
