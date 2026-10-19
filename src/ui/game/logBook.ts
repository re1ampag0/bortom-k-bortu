// «Судовой журнал» as a ship's book (PH, part 5; docs/mockups/a5/phone/src/phone_tpl.html, logBook): the margin of a line —
// «раунд·ход» — counted from the log the client already has, no new field in the engine.
import type { LogLine } from '../../engine/log';
import { roman } from './text';

/**
 * The mark on the margin of each line: «II·3» — the round in roman numbers and the turn of the round (the lines «Ход …»
 * counted from the round's start); a line before the first turn of its round (the round, the sea) — the round alone, «II»;
 * the deal before the first round — nothing.
 */
export function logMarks(log: LogLine[]): string[] {
  let round = -1;
  let turn = 0;
  return log.map((l) => {
    if (l.round !== round) {
      round = l.round;
      turn = 0;
    }
    if (l.kind === 'turn') turn++;
    if (l.round < 1) return '';
    const r = roman(l.round);
    return turn > 0 ? `${r}·${turn}` : r;
  });
}

const R1 = (v: number) => Math.round(v * 10) / 10;

/** The cover of the book of each ship (LB of the mockup; frames 5, 5б–5г). The words are the dress of the book, not rules. */
export interface BookCover {
  k: 'P' | 'D' | 'E' | 'R';
  title: string;
  /** After the full name of the ship. */
  sub: string;
  who: string;
  sig: string;
  /** The wax of the seal: the edge, the disc, the anchor. */
  seal: [string, string, string];
  page: string;
}
export const BOOK_COVER: Record<string, BookCover> = {
  Ж: { k: 'P', title: 'Судовой журнал', sub: 'партия против Компании', who: 'Записал штурман', sig: 'Гиббс', seal: ['#8e2219', '#7a1810', '#3a0805'], page: 'лист 3' },
  Г: { k: 'D', title: 'Журнал глубин', sub: 'сто лет без берега', who: 'Скрепил капитан', sig: 'Д. Джонс', seal: ['#2c6a5a', '#1e5446', '#0c2a22'], page: 'лист ∞' },
  И: { k: 'E', title: 'Вахтенный журнал', sub: 'флот Торговой Компании', who: 'Утвердил', sig: 'лорд Беккет', seal: ['#2e4a78', '#243c64', '#0e1a30'], page: '№ 0417 · лист 3' },
  М: { k: 'R', title: 'Капитанский журнал', sub: 'что сгорело — то записано', who: 'Записал капитан', sig: 'Ч. Борода', seal: ['#2a2420', '#1a1614', '#000'], page: 'лист 3 (уцелевший)' },
};

/** The faint compass rose of the page (the watermark .lwm). */
export const BOOK_ROSE = `<svg viewBox="-50 -50 100 100" aria-hidden="true">${Array.from({ length: 16 }, (_, i) => {
  const a = (i * Math.PI) / 8, r = i % 2 ? 26 : 46, w = i % 2 ? 3 : 6;
  return `<path d="M0 0 L${R1(Math.cos(a - Math.PI / 2 - 0.5) * w)} ${R1(Math.sin(a - Math.PI / 2 - 0.5) * w)} L${R1(Math.cos(a - Math.PI / 2) * r)} ${R1(Math.sin(a - Math.PI / 2) * r)} Z" fill="#3a2a1a"/>`;
}).join('')}<circle r="48" fill="none" stroke="#3a2a1a" stroke-width="1"/><circle r="40" fill="none" stroke="#3a2a1a" stroke-width=".6"/></svg>`;

/** The wax seal with an anchor under the signature (no ids: plain fills). */
export function bookSeal([edge, disc, mark]: BookCover['seal']): string {
  const blob = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2, r = 17 + Math.sin(i * 2.3) * 1.2;
    return (i ? 'L' : 'M') + R1(Math.cos(a) * r) + ' ' + R1(Math.sin(a) * r);
  }).join(' ');
  return `<svg width="42" height="42" viewBox="-21 -21 42 42" aria-hidden="true"><path d="${blob} Z" fill="${edge}" stroke="${mark}" stroke-width=".6"/><circle r="12" fill="${disc}"/><g transform="translate(-10 -12) scale(.8)" fill="${mark}" stroke="${mark}" stroke-width=".7"><circle cx="13" cy="3.2" r="2.6" fill="none" stroke-width="1.8"/><path d="M2.6 7.2 Q13 6.4 23.4 7.2 L23.4 9.4 Q13 8.6 2.6 9.4 Z"/><path d="M11.5 5.6 H14.5 L15.1 24.6 H10.9 Z"/><path d="M1.4 16.8 Q1.6 26.4 13 28.8 Q24.4 26.4 24.6 16.8 L21.8 19 Q21 24.8 13 26 Q5 24.8 4.2 19 Z"/><path d="M1.4 16.8 L-1.8 18.6 Q-1.4 21.8 0.8 23.8 L4.6 20.4 Z M24.6 16.8 L27.8 18.6 Q27.4 21.8 25.2 23.8 L21.4 20.4 Z"/></g></svg>`;
}
