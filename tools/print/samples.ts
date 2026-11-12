// Sample pictures for the user to choose from (docs/tasks/print-kit.md 3.7, 10; review-player 2.1, 4.1; review-print 18):
// out/print/obrazcy/*.png at 150 dpi and probnyj-list.pdf — one sheet to print on both sides and judge on paper.
import fs from 'node:fs';
import path from 'node:path';
import { SAMPLES, data, esc, mm, type Ctx, type Part, type PageSpec } from './kit';
import { BLEED, CARD, DECKS, deckList, type Item, type Sheet, type Ship } from './layout';
import { DECK_BAND, DECK_NAME, SEA, type DeckCode } from './colors';
import { BACK_VARIANTS, CARD_CSS, backHtml, backSheetPage, faceSheet, itemFace, type CardKit, type Mode } from './cards';
import { defaultMode, kitFor } from './parts/cards';
import { shotSheet, writePdf } from './pdf';
import { profiled } from './art';

const card = (deck: DeckCode, name: string): Item => { const c = deckList(data, deck).find(x => x.card.name === name); if (!c) throw new Error(`sample card ${deck} ${name} not found`); return { kind: 'card', deck, card: c.card, copy: 0 }; };
/** Nine cards: 2–3 of every type, all four decks, «Ядра» from two decks. */
function sampleItems(): Item[] {
  const want: [DeckCode, string][] = [['Ж', 'ЗАРЯД'], ['И', 'ЗАРЯД'], ['И', 'РЕМОНТ'], ['М', 'ПРИКАЗ'], ['Г', 'ПРИКАЗ'], ['Ж', 'РЕАКЦИЯ'], ['Г', 'РЕАКЦИЯ'], ['М', 'РЕМОНТ'], ['И', 'ПРИКАЗ']];
  const fixed: Record<number, string> = { 0: 'Ядра', 1: 'Ядра', 2: 'Верфь Компании', 3: 'Анжелика', 4: 'Сто лет службы', 5: 'Уйти по ветру' };
  const used = new Set<string>();
  return want.map(([deck, type], i) => {
    const pick = fixed[i] && data.decks[deck].some(c => c.name === fixed[i]) ? fixed[i] : data.decks[deck].find(c => c.type === type && !used.has(c.name) && (c.cost > 0 || i % 2 === 0))?.name ?? data.decks[deck].find(c => c.type === type)!.name;
    used.add(pick); return card(deck, pick);
  });
}
const sheetOf = (items: Item[], deck: DeckCode | 'sea' = 'Ж'): Sheet => ({ deck, n: 1, of: 1, items: [...items, ...Array.from({ length: Math.max(0, 9 - items.length) }, () => ({ kind: 'empty' as const }))] });
const part = (file: string, pages: PageSpec[], css = CARD_CSS): Part => ({ file: 'obrazcy-' + file, title: file, css, pages });
const CAP = `.cap{position:absolute;font:700 11pt/1.15 'Alegreya Sans',sans-serif;color:#f1e6c8;white-space:nowrap}.cap small{display:block;font:500 9pt/1.2 'Alegreya Sans',sans-serif;color:#c9c0a8}.tbl{background:#2f3d3a}`;

/** A hand fan of five cards, as the player holds it: every next card covers the one before, the left strip stays seen. */
function fanPage(ctx: Ctx, kit: CardKit, items: Item[], title: string): PageSpec {
  const fan = (x0: number, y0: number, shift: number, deg: number) => items.map((it, i) => itemFace(ctx, kit, it, `left:${mm(x0 + i * shift)};top:${mm(y0 + Math.abs(i - 2) ** 2 * 1.6)};transform:rotate(${(i - 2) * deg}deg);transform-origin:50% 120%;`)).join('');
  return { land: true, html: `<div class="tbl" style="position:absolute;inset:0"></div><div class="cap" style="left:14mm;top:10mm">${esc(title)}<small>слева — обычный веер (сдвиг 18 мм), справа — тесный (сдвиг 12 мм); 100 % размера карты</small></div>${fan(14, 66, 18, 5)}${fan(178, 66, 12, 4)}` };
}

const CVD = `<svg width="0" height="0" style="position:absolute"><defs>
<filter id="deu"><feColorMatrix type="matrix" values="0.367322 0.860646 -0.227968 0 0  0.280085 0.672501 0.047413 0 0  -0.011820 0.042940 0.968881 0 0  0 0 0 1 0"/></filter>
<filter id="pro"><feColorMatrix type="matrix" values="0.152286 1.052583 -0.204868 0 0  0.114503 0.786281 0.099216 0 0  -0.003882 -0.048116 1.051998 0 0  0 0 0 1 0"/></filter>
<filter id="dim" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="gamma" amplitude=".35" exponent="1.2"/><feFuncG type="gamma" amplitude=".35" exponent="1.2"/><feFuncB type="gamma" amplitude=".35" exponent="1.2"/></feComponentTransfer></filter></defs></svg>`;

export async function buildSamples(ctx: Ctx): Promise<void> {
  fs.mkdirSync(SAMPLES, { recursive: true });
  const out = (f: string) => path.join(SAMPLES, f), base = defaultMode(ctx), made: string[] = [];
  const shot = async (p: Part, file: string, filter = '', index = 0) => { await shotSheet(ctx, p, index, out(file), 150, filter, CVD); made.push(file); };
  const items = sampleItems();
  const hand = ['Ядра', 'Уйти по ветру', 'Бочки с порохом', 'Чёрные паруса в ночи', 'Залп с обоих бортов'].filter(n => data.decks['Ж'].some(c => c.name === n)).map(n => card('Ж', n));
  while (hand.length < 5) hand.push(card('Ж', data.decks['Ж'].find(c => !hand.some(h => h.kind === 'card' && h.card.name === c.name))!.name));
  const keys = [...items, ...hand].map(it => it.kind === 'card' ? `${it.deck}|${it.card.name}` : '');
  // the default mode's kit has every card; the other modes rasterise only the sample cards
  const kitOf = (m: Mode) => JSON.stringify(m) === JSON.stringify(base) ? kitFor(ctx, m) : kitFor(ctx, m, keys);
  const kType = await kitOf({ ...base, glass: 'type', index: true }), kShip = await kitOf({ ...base, glass: 'ship', index: true }), kPlain = await kitOf({ ...base, glass: 'type', index: false });
  const kAll = await kitFor(ctx, base);
  // 1-3: the glass in the type's colour / the ship's colour; the same sheet without the fan index
  const pType = part('steklo-tip', [faceSheet(ctx, kType, sheetOf(items), 'Образец · стекло в цвет типа · с индексом для веера')]);
  await shot(pType, '01-steklo-v-tsvet-tipa.png');
  await shot(part('steklo-korabl', [faceSheet(ctx, kShip, sheetOf(items), 'Образец · стекло в цвет корабля · с индексом для веера')]), '02-steklo-v-tsvet-korablya.png');
  await shot(part('bez-indeksa', [faceSheet(ctx, kPlain, sheetOf(items), 'Образец · как в эталоне: без индекса для веера')]), '03-list-bez-indeksa.png');
  // 4-5: the hand fan with and without the index — five cards of one deck
  await shot(part('veer-indeks', [fanPage(ctx, kType, hand, 'Веер в руке — с индексом (под медалью цена и короткий итог)')], CARD_CSS + CAP), '04-veer-s-indeksom.png');
  await shot(part('veer-etalon', [fanPage(ctx, kPlain, hand, 'Веер в руке — как в эталоне (только медаль слева, цена справа)')], CARD_CSS + CAP), '05-veer-bez-indeksa.png');
  // 6-7: the ship board, two layouts, by the tightest board — the Dutchman
  try {
    const B = await import('./parts/boards') as unknown as { boardPage?: (ctx: Ctx, ship: Ship, v: 'top' | 'side') => PageSpec | Promise<PageSpec>; BOARD_CSS?: string };
    const dutch = data.ships.find(s => s.code === 'Г')!;
    if (B.boardPage && B.BOARD_CSS) {
      await shot(part('planshet-sverhu', [await B.boardPage(ctx, dutch, 'top')], B.BOARD_CSS), '06-planshet-kartinka-sverhu.png');
      await shot(part('planshet-sprava', [await B.boardPage(ctx, dutch, 'side')], B.BOARD_CSS), '07-planshet-kartinka-sprava.png');
    }
  } catch (e) { console.warn('samples: boards skipped — ' + (e as Error).message); }
  // 8: the token sheet
  try {
    const T = await import('./parts/tokens') as unknown as { tokenPages?: (ctx: Ctx) => PageSpec[] | Promise<PageSpec[]>; TOKENS_CSS?: string };
    if (T.tokenPages && T.TOKENS_CSS) { const pages = await T.tokenPages(ctx); await shot(part('zhetony', pages, T.TOKENS_CSS), '08-zhetony.png', '', Math.min(1, pages.length - 1)); }
  } catch (e) { console.warn('samples: tokens skipped — ' + (e as Error).message); }
  // 9: every back in every design that exists; 10: one row of backs as cut when the back side is shifted by 0 / 1.5 / 3 mm
  const kitsV = new Map<number, CardKit>(); for (const v of BACK_VARIANTS) kitsV.set(v, await kitFor(ctx, { ...base, backs: v } as Mode));
  const VNAME: Record<number, string> = { 1: 'Вариант 1 «Корабль в море»', 2: 'Вариант 2 «Гравюра»', 3: 'Вариант 3 «Медальон»' };
  const row = (kit: CardKit, y: number, label: string) => `<div class="cap" style="left:10mm;top:${mm(y - 6.5)};color:#333">${esc(label)}</div>` + [...DECKS.map(d => ({ back: 'deck' as const, deck: d })), { back: 'sea' as const }, { back: 'deck' as const, deck: 'Ж' as DeckCode, legend: true }, { back: 'neutral' as const }].map((b, i) => backHtml(kit, b, `left:${mm(10 + i * 39.8)};top:${mm(y)};transform:scale(.6);transform-origin:0 0;`)).join('');
  await shot(part('rubashki', [{ land: true, html: BACK_VARIANTS.map((v, i) => row(kitsV.get(v)!, 16 + i * 62, `${VNAME[v]}: четыре колоды, Колода моря, Легенда, «Как читать карту»`)).join('') }], CARD_CSS + CAP), '09-rubashki.png');
  const k1 = kitsV.get(base.backs) ?? kitsV.get(1)!;
  const cut = (deck: DeckCode, x: number, y: number, s: number) => [0, 1, 2].map(c => `<div style="position:absolute;left:${mm(x + c * (CARD.w + 4))};top:${mm(y)};width:${mm(CARD.w)};height:${mm(CARD.h)};overflow:hidden;outline:.2mm solid #999"><div style="position:absolute;left:${mm(-(BLEED + CARD.w * c) + s)};top:${mm(-BLEED + s)};width:${mm(3 * CARD.w + 2 * BLEED)};height:${mm(CARD.h + 2 * BLEED)};background:${profiled(DECK_BAND[deck])}">${[0, 1, 2].map(k => backHtml(k1, { back: 'deck', deck }, `left:${mm(BLEED + k * CARD.w)};top:${mm(BLEED)};`)).join('')}</div></div>`).join('');
  await shot(part('rubashki-sdvig', [{ html: [0, 1.5, 3].map((s, i) => `<div class="cap" style="left:6mm;top:${mm(5 + i * 97)};color:#333">Рубашки одного ряда листа, оборот сдвинут на ${String(s).replace('.', ',')} мм вправо и вниз — левая, средняя и правая карта</div>${cut(DECKS[i % 4], 6, 11 + i * 97, s)}`).join('') }], CARD_CSS + CAP), '10-rubashki-sdvig.png');
  // 11-14: perception — greyscale, deuteranopia, protanopia, half-dark (review-player 2.1)
  for (const [file, filter] of [['11-vospriyatie-seroe.png', 'grayscale(1)'], ['12-vospriyatie-deyteranopiya.png', 'url(#deu)'], ['13-vospriyatie-protanopiya.png', 'url(#pro)'], ['14-vospriyatie-polutma.png', 'url(#dim)']]) await shot(pType, file, filter);
  // the trial sheet, both sides: row 1 — glass in the type's colour, row 2 — the same cards, glass in the ship's colour,
  // row 3 — the three darkest pictures; on the back one row per back design
  const darkest = [...kAll.art.entries()].filter(([k]) => !k.startsWith('sea|') && kAll.specs.get(k)!.sceneName).sort((a, b) => b[1].dark - a[1].dark).slice(0, 3).map(([k]) => card(k[0] as DeckCode, k.slice(2)));
  const trio = [items[0], items[2], items[4]], trial = sheetOf([...trio, ...trio, ...darkest]);
  const backKit = (i: number) => kitsV.get(BACK_VARIANTS[Math.floor(i / 3)] ?? 1) ?? k1;
  const pTrial: Part = { file: 'probnyj-list', title: 'Бортом к борту — пробный лист (печатать с двух сторон)', css: CARD_CSS, duplex: true, pages: [
    faceSheet(ctx, kType, trial, 'Пробный лист · лицо · ряд 1 — стекло в цвет типа, ряд 2 — в цвет корабля, ряд 3 — самые тёмные · верх', i => i >= 6 ? kAll : i >= 3 ? kShip : kType),
    backSheetPage(k1, trial, 0, 0, `Пробный лист · оборот · ${BACK_VARIANTS.length > 1 ? 'по ряду на вариант рубашки' : 'рубашки (варианты 2 и 3 — позже)'} · верх`, backKit)] };
  await writePdf(ctx, pTrial, SAMPLES); made.push('probnyj-list.pdf');
  console.log(`obrazcy/: ${made.join(', ')}`);
  void SEA; void DECK_NAME;
}
