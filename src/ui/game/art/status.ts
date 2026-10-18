// The icons of the statuses (24×24) and the Black Spot pinned with a dagger (docs/mockups/a5/fx/src/template.html, ST2
// and MARK_PIN), the skull of the Souls and the tick of «готов» (docs/mockups/a5/A5Table.html).

const INK = '#22190f';

export const STATUS_ICON = {
  /* Пожар: three tongues of flame, red over orange over a yellow heart, embers above */
  fire: `<path d="M12 2 C14 6 18.6 8.4 18 13.6 C17.6 18.4 15 21 12 21 C8.4 21 5.8 18.6 5.8 15 C5.8 11.8 8 10.6 8.6 7.8 C9.8 10.2 11 10.4 11.6 9 C12.4 7 12 4.6 12 2 Z" fill="#c8402f" stroke="${INK}" stroke-width=".9" stroke-linejoin="round"/>
    <path d="M12 7.6 C13.6 10.6 16.2 12 15.8 15.4 C15.4 18.4 13.8 19.8 12 19.8 C9.8 19.8 8.2 18.2 8.2 16 C8.2 14 9.6 13.2 10.2 11.4 C11 12.6 11.8 12.6 12.2 11.6 C12.6 10.4 12.2 9 12 7.6 Z" fill="#f08a2c"/>
    <path d="M12 12.6 C13 14.4 14.2 15.4 13.8 17 C13.6 18.2 12.8 18.8 12 18.8 C10.8 18.8 10 18 10 16.8 C10 15.6 11.2 14.8 12 12.6 Z" fill="#ffd77a"/>
    <circle cx="17.6" cy="5" r=".9" fill="#f08a2c"/><circle cx="6.6" cy="6.4" r=".7" fill="#f08a2c"/><circle cx="16" cy="2.6" r=".5" fill="#ffd77a"/>`,
  /* Чёрная метка: the old pirate custom — a round scrap torn from a page, one side blackened with soot; curled at the edge */
  mark: `<g transform="rotate(-8 12 12)">
    <path d="M3.4 4 L6 3.2 L7.6 4.2 L10 3 L12.4 3.8 L14.6 2.8 L17 3.8 L19.6 3.2 L20.6 5.4 L20 7.6 L21 10 L20.2 12.4 L21.2 14.8 L20.4 17.2 L20.8 19.6 L18.4 20.6 L16 19.8 L13.6 21 L11.2 20 L8.8 21 L6.6 20 L4 20.6 L3.2 18.2 L4 15.8 L3 13.4 L3.8 11 L2.8 8.6 L3.8 6.4 Z" fill="#f1e6cc" stroke="${INK}" stroke-width=".75" stroke-linejoin="round"/>
    <path d="M5.4 6.4 H18.6 M5.4 8.4 H11 M5.4 16.4 H18.4 M5.4 18.2 H13" stroke="#9a8a6a" stroke-width=".5" stroke-linecap="round"/>
    <path d="M12 6.8 C14 6.4 16.6 7.4 17.2 9.4 C18 10.6 17.6 12.4 17.8 13.4 C17.2 15 15.4 15.6 14 15.8 C12.6 16.4 10.4 16.2 9 15.4 C7.4 14.8 6.6 13.2 7 11.6 C6.8 10 7.4 8.6 8.8 7.8 C9.8 7.2 10.8 6.9 12 6.8 Z" fill="#12100e"/>
    <path d="M11.8 5.8 C14.6 5.4 17.6 6.8 18.2 9.4 C19 11 18.6 13.4 17.4 14.8 C16 16.6 13.6 17.2 11.4 17 C9 16.8 6.8 15.6 6.2 13.4 C5.6 11.2 6.4 8.6 8.4 7.2 C9.4 6.4 10.6 5.9 11.8 5.8 Z" fill="#12100e" opacity=".22"/>
    <path d="M9.4 9.6 C10.2 8.6 11.6 8.2 12.8 8.4" fill="none" stroke="#45403a" stroke-width="1" stroke-linecap="round"/>
    <circle cx="19" cy="14.6" r=".5" fill="#12100e"/><circle cx="5.4" cy="12.2" r=".4" fill="#12100e"/></g>`,
  /* Блокада: two links of iron chain locked by a padlock */
  blockade: `<rect x="1.6" y="7" width="9.6" height="5.6" rx="2.8" fill="none" stroke="#3a3632" stroke-width="2.6"/><rect x="1.6" y="7" width="9.6" height="5.6" rx="2.8" fill="none" stroke="#a7a19a" stroke-width="1.1"/>
    <rect x="8.8" y="7" width="9.6" height="5.6" rx="2.8" fill="none" stroke="#3a3632" stroke-width="2.6"/><rect x="8.8" y="7" width="9.6" height="5.6" rx="2.8" fill="none" stroke="#c9c3ba" stroke-width="1.1"/>
    <path d="M15.4 14.6 V12.8 A3 3 0 0 1 21.4 12.8 V14.6" fill="none" stroke="${INK}" stroke-width="1.6"/>
    <rect x="13.6" y="14.2" width="9.6" height="7.6" rx="1.4" fill="#c9a048" stroke="${INK}" stroke-width=".9"/><path d="M14.6 15.4 H22.2" stroke="#f2d98a" stroke-width=".7"/>
    <circle cx="18.4" cy="17.6" r="1.1" fill="${INK}"/><path d="M18.4 18 V20" stroke="${INK}" stroke-width="1"/>`,
  /* Переговоры: a white flag of truce on a staff, with a fold and a tassel */
  parley: `<path d="M5 22 V2.6" stroke="#5a3a1c" stroke-width="1.6" stroke-linecap="round"/><circle cx="5" cy="2.4" r="1.2" fill="#c9a048" stroke="${INK}" stroke-width=".5"/>
    <path d="M5.8 3.6 C9 2.4 11.6 4 14 4.6 C16.4 5.2 18.6 4.4 20.6 3.4 V12.6 C18.6 13.6 16.4 14.4 14 13.8 C11.6 13.2 9 11.6 5.8 12.8 Z" fill="#fbf7ee" stroke="${INK}" stroke-width=".85" stroke-linejoin="round"/>
    <path d="M10 4 C11 7 11 10 10 12.4 M15.6 4.8 C16.6 7.8 16.6 10.6 15.6 13.6" fill="none" stroke="#d6cdb8" stroke-width=".8"/>
    <path d="M5.8 13 C6.6 15 6.4 16.6 5.6 18" fill="none" stroke="#c9a048" stroke-width="1"/>`,
  /* Кукла вуду: a burlap doll with cross-stitched eyes and a mouth of stitches, a pin with a red head */
  voodoo: `<circle cx="11" cy="6.6" r="4.4" fill="#cdb489" stroke="${INK}" stroke-width=".85"/>
    <path d="M7.4 10.4 C6 11.4 3.4 11.6 2.4 13 C3.4 14 5.8 13.8 7.4 13.4 L7.8 20.2 C7.8 21.4 9.6 21.8 10 20.6 L11 17 L12 20.6 C12.4 21.8 14.2 21.4 14.2 20.2 L14.6 13.4 C16.2 13.8 18.6 14 19.6 13 C18.6 11.6 16 11.4 14.6 10.4 Z" fill="#cdb489" stroke="${INK}" stroke-width=".85" stroke-linejoin="round"/>
    <path d="M8.6 5.2 L10 6.6 M10 5.2 L8.6 6.6 M12 5.2 L13.4 6.6 M13.4 5.2 L12 6.6" stroke="${INK}" stroke-width=".8"/><path d="M9 8.6 H13 M9.6 8.2 V9 M11 8.2 V9 M12.4 8.2 V9" stroke="${INK}" stroke-width=".55"/>
    <path d="M11 11 V16" stroke="#8a6a3c" stroke-width=".6" stroke-dasharray="1 .8"/>
    <path d="M21.6 3.2 L12.8 13" stroke="#b8bfc6" stroke-width="1"/><circle cx="21.8" cy="3" r="1.7" fill="#b8281c" stroke="${INK}" stroke-width=".5"/><circle cx="21.3" cy="2.5" r=".5" fill="#ff9d8a"/>`,
  /* Без Реакций: a parrying shield struck through */
  noReact: `<path d="M12 2.4 L20 5 V11 C20 16.4 16.6 19.8 12 21.6 C7.4 19.8 4 16.4 4 11 V5 Z" fill="#efe3c8" stroke="${INK}" stroke-width=".95" stroke-linejoin="round"/>
    <path d="M12 4.4 L18 6.4 V11 C18 15 15.6 17.8 12 19.4 Z" fill="#d6c59c"/><path d="M12 4.4 V19.4 M6 10.6 H18" stroke="#8a7550" stroke-width=".7"/>
    <path d="M4.6 3.6 L19.6 20.4" stroke="#fbf5e7" stroke-width="3.6" stroke-linecap="round"/><path d="M4.6 3.6 L19.6 20.4" stroke="#b8281c" stroke-width="2" stroke-linecap="round"/>`,
  /* Под водой: the tip of a mast and its pennant just under the line of the sea, bubbles rising */
  under: `<path d="M1.6 9.6 q2 -1.8 4 0 t4 0 t4 0 t4 0 t4 0" fill="none" stroke="#9cc4d4" stroke-width="1.4" stroke-linecap="round"/>
    <rect x="1" y="10" width="22" height="13" rx="2" fill="#2f5f74" opacity=".85"/>
    <path d="M11 22 V12.6 M11 13 L15.4 14.4 L11 15.8" fill="#9cc4d4" stroke="#bfe0ea" stroke-width="1" stroke-linejoin="round"/>
    <path d="M6.6 22.4 H15.4 L14.4 20.6 H7.6 Z" fill="#1f3f4e"/>
    <circle cx="16.6" cy="6.6" r="1.3" fill="none" stroke="#9cc4d4" stroke-width=".8"/><circle cx="18.6" cy="3.4" r=".9" fill="none" stroke="#9cc4d4" stroke-width=".7"/><circle cx="14.6" cy="2.6" r=".6" fill="none" stroke="#9cc4d4" stroke-width=".6"/>`,
  /* Всплыл: the bow breaks the surface, water streaming off it, a chevron up */
  surfaced: `<path d="M2.6 17.4 L6 11.4 C8.4 10.6 12 10.2 16 10.2 L21.4 8.6 L19.6 13.8 C18.6 16.4 16 17.6 12.6 17.6 Z" fill="#8a5a32" stroke="${INK}" stroke-width=".9" stroke-linejoin="round"/>
    <path d="M6 11.4 C9 11 13 10.8 17 10.8 L21.4 8.6" fill="none" stroke="#5a3a1c" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M5 14.4 H18.4" stroke="#b07a48" stroke-width=".7"/><path d="M8.6 15.6 h1.4 M12 15.6 h1.4 M15.4 15.4 h1.2" stroke="#2a1a0c" stroke-width=".9"/>
    <path d="M1.2 18 q2.1 -1.8 4.2 0 t4.2 0 t4.2 0 t4.2 0 t4.2 0" fill="none" stroke="#3d6f88" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M7 12 L6.4 14.6 M11 11.2 L10.6 13.8 M16 11 L15.8 13.4" stroke="#bfe0ea" stroke-width=".8" stroke-linecap="round"/>
    <path d="M9.6 6.6 L13 3.2 L16.4 6.6" fill="none" stroke="#2f7d4a" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M2 21.6 H22" stroke="#3d6f88" stroke-width="1" stroke-linecap="round" opacity=".55"/>`,
  /* Утонул: an anchor lying in deep water, bubbles going up */
  sunk: `<rect x="1" y="1" width="22" height="22" rx="3" fill="#2a4a5c"/>
    <path d="M12 6.4 V19 M8.6 9 H15.4 M5.6 15 C6 18.6 8.6 20 12 20 C15.4 20 18 18.6 18.4 15" fill="none" stroke="#c9c3ba" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="12" cy="5.4" r="1.6" fill="none" stroke="#c9c3ba" stroke-width="1.2"/>
    <path d="M5.6 15 L4.4 16.6 M18.4 15 L19.6 16.6" stroke="#c9c3ba" stroke-width="1.4" stroke-linecap="round"/>
    <circle cx="17.6" cy="5" r="1" fill="none" stroke="#9cc4d4" stroke-width=".7"/><circle cx="19.2" cy="2.8" r=".6" fill="none" stroke="#9cc4d4" stroke-width=".6"/><circle cx="6" cy="4" r=".7" fill="none" stroke="#9cc4d4" stroke-width=".6"/>`,
} as const;
export type StatusIcon = keyof typeof STATUS_ICON;

/** A status icon as an <svg> of the given size. */
export const statusSvg = (k: StatusIcon, size = 16) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${STATUS_ICON[k]}</svg>`;

/* the Black Spot pinned to the plank with a dagger (the head of the plank, 30×30) */
const MARK_PIN = `<g transform="translate(3 4) rotate(-10 12 12)">${STATUS_ICON.mark}</g>
  <path d="M19.4 1 L21.6 3.2 L13.6 14.6 L12.4 13.4 Z" fill="#d7dbe0" stroke="${INK}" stroke-width=".6" stroke-linejoin="round"/><path d="M20.2 1.8 L13 14" stroke="#fff" stroke-width=".5" opacity=".7"/>
  <path d="M18 .4 L23.4 5.8" stroke="#8a6420" stroke-width="2" stroke-linecap="round"/><path d="M21.2 3.2 L25.6 -.4" stroke="#5a3a1c" stroke-width="2.4" stroke-linecap="round"/><circle cx="26.2" cy="-.9" r="1.3" fill="#c9a048" stroke="${INK}" stroke-width=".5"/>`;
export const MARK_PIN_SVG = `<svg width="30" height="30" viewBox="-1 -2.5 29 29" aria-hidden="true">${MARK_PIN}</svg>`;

/** The Souls of «Голландец»: a greenish skull with glowing eye sockets (A5Table.html). */
export const SOULS_SVG = '<svg width="15" height="17" viewBox="0 0 15 17" aria-hidden="true" style="filter:drop-shadow(0 0 2px rgba(70,190,140,.55))"><path d="M7.5 1 C11.2 1 13.4 3.6 13.4 6.8 C13.4 8.8 12.4 10 11.4 10.6 V12.4 H3.6 V10.6 C2.6 10 1.6 8.8 1.6 6.8 C1.6 3.6 3.8 1 7.5 1 Z" fill="#b9c9ad" stroke="#3a4a3c" stroke-width=".6"/><path d="M9.6 1.6 C12 2.6 13.4 4.6 13.4 6.8 C13.4 8.8 12.4 10 11.4 10.6 V12.4 H8.6 C10.8 10 11.6 5.2 9.6 1.6 Z" fill="#6f8a70" opacity=".6"/><path d="M3.2 4.6 C3.8 2.8 5.4 1.8 7 1.7" stroke="#eef5e6" stroke-width=".7" fill="none" stroke-linecap="round"/><path d="M3.4 6.8 C3.6 5.4 5.6 5.2 6.4 6.4 C6.8 7.6 5.8 8.8 4.6 8.6 C3.8 8.4 3.3 7.8 3.4 6.8 Z M11.6 6.8 C11.4 5.4 9.4 5.2 8.6 6.4 C8.2 7.6 9.2 8.8 10.4 8.6 C11.2 8.4 11.7 7.8 11.6 6.8 Z" fill="#17221b"/><circle cx="4.9" cy="7.1" r=".75" fill="#8dffc4"/><circle cx="10.1" cy="7.1" r=".75" fill="#8dffc4"/><path d="M7.5 8.6 L8.3 10 H6.7 Z" fill="#17221b"/><path d="M3.6 12.4 H11.4 L10.8 15 Q7.5 16.2 4.2 15 Z" fill="#a3b597" stroke="#3a4a3c" stroke-width=".55"/><path d="M5.4 12.4 V14.8 M6.8 12.4 V15.2 M8.2 12.4 V15.2 M9.6 12.4 V14.8" stroke="#3a4a3c" stroke-width=".45"/></svg>';
/** «готов»: the tick in a white disc (A5Table.html). */
export const READY_SVG = '<svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="#f2fbf4"/><path d="M4.4 8.4 L7 11 L11.8 5.4" fill="none" stroke="#2a5f45" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
/** The trident of «Меч Тритона» (A5Table.html). */
export const TRIDENT_SVG = '<svg width="16" height="18" viewBox="0 0 16 18" aria-hidden="true"><path d="M8 17 V3 M3 3 V8 Q3 10 8 10 Q13 10 13 8 V3 M8 1 V3" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
