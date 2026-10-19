// «Вещи на столе» (docs/mockups/a5/fx/src/template.html, tableThings, THINGS, compassHero): the things in the shade by
// the edges of the table — a wheel, an hourglass, an anchor, a spyglass, dividers, coins — and the brass compass in the
// free corner (≈ 82 %). Drawn for a table of 1366×660; the game scales the picture to its window (slice).

const R = (n: number) => Math.round(n * 10) / 10;

const LAMP = {x: 615, y: 264};
function shadowFilter(id: string, x: number, y: number, far: number): string {
  const dx = x - LAMP.x, dy = y - LAMP.y, d = Math.hypot(dx, dy) || 1, k = far / d;
  return `<filter id="${id}" x="-40%" y="-40%" width="180%" height="180%">
    <feDropShadow dx="${R(dx*k*.25)}" dy="${R(dy*k*.25+1)}" stdDeviation="1.2" flood-color="#0a0502" flood-opacity=".75" result="a"/>
    <feDropShadow in="a" dx="${R(dx*k)}" dy="${R(dy*k+2)}" stdDeviation="${R(far*.55)}" flood-color="#0a0502" flood-opacity=".55"/></filter>`;
}
function compassHero(Rr: number): string {
  const f = Rr - 9; let g = '';
  g += `<path d="M-7 ${-Rr-2} h14 v-8 a7 7 0 0 0 -14 0 Z" fill="url(#pgBrass)" stroke="#5a3e10" stroke-width=".8"/><circle cx="0" cy="${-Rr-12}" r="6.5" fill="none" stroke="url(#pgBrass)" stroke-width="3"/>`;
  g += `<circle r="${Rr}" fill="url(#pgBrass)" stroke="#4a3208" stroke-width="1"/>`;
  for(let k = 0; k < 144; k++){ const a = k * Math.PI / 72; g += `<path d="M${R(Math.cos(a)*(Rr-.6))} ${R(Math.sin(a)*(Rr-.6))} L${R(Math.cos(a)*(Rr-3.4))} ${R(Math.sin(a)*(Rr-3.4))}" stroke="#6b4a14" stroke-width=".8" opacity=".7"/>`; }
  g += `<circle r="${Rr-5}" fill="url(#pgBrassIn)" stroke="#5a3e10" stroke-width=".8"/>`;
  g += `<circle r="${f}" fill="url(#pgPaper)" stroke="#3a2a10" stroke-width="1"/><circle r="${f-13}" fill="none" stroke="#6b5430" stroke-width=".6"/>`;
  for(let d = 0; d < 360; d += 5){ const a = (d - 90) * Math.PI / 180, L = d % 30 === 0 ? 7 : d % 10 === 0 ? 4.5 : 2.6;
    g += `<path d="M${R(Math.cos(a)*(f-1))} ${R(Math.sin(a)*(f-1))} L${R(Math.cos(a)*(f-1-L))} ${R(Math.sin(a)*(f-1-L))}" stroke="#2e2210" stroke-width="${d % 30 === 0 ? 1.1 : .6}"/>`; }
  [['С',0,'#9a2318'],['В',90,'#2a1e10'],['Ю',180,'#2a1e10'],['З',270,'#2a1e10']].forEach(([t, d, c]: (string | number)[]) => { const a = ((d as number) - 90) * Math.PI / 180, r = f - 17.5;
    g += `<text x="${R(Math.cos(a)*r)}" y="${R(Math.sin(a)*r+4)}" text-anchor="middle" font-family="'Old Standard TT',Georgia,serif" font-weight="700" font-size="12" fill="${c}">${t}</text>`; });
  const ray = (deg: number, len: number, w: number, dark: string, light: string) => { const a = (deg - 90) * Math.PI / 180, n = a + Math.PI / 2, tx = Math.cos(a)*len, ty = Math.sin(a)*len, bx = Math.cos(n)*w, by = Math.sin(n)*w;
    return `<path d="M0 0 L${R(tx)} ${R(ty)} L${R(bx)} ${R(by)} Z" fill="${dark}"/><path d="M0 0 L${R(tx)} ${R(ty)} L${R(-bx)} ${R(-by)} Z" fill="${light}" stroke="#3a2a10" stroke-width=".4"/>`; };
  const rr = f - 26;
  for(let d = 22.5; d < 360; d += 45) g += ray(d, rr * .42, 3, '#7a5a26', '#e9d6a2');
  for(let d = 45; d < 360; d += 90) g += ray(d, rr * .7, 5, '#8a6a2c', '#f2e4bc');
  for(let d = 0; d < 360; d += 90) g += ray(d, rr, 7, d === 0 ? '#9a2318' : '#2a2018', d === 0 ? '#d4523e' : '#efe2c4');
  g += `<circle r="5.5" fill="none" stroke="#3a2a10" stroke-width=".7"/>`;
  g += `<g class="pg-needle"><path d="M0 ${-rr+4} L3.2 0 L0 ${rr*.55} L-3.2 0 Z" fill="#1c1a18" opacity=".9"/><path d="M0 ${-rr+4} L3.2 0 L-3.2 0 Z" fill="#b8281c"/></g>`;
  g += `<circle r="3.4" fill="url(#pgBrass)" stroke="#4a3208" stroke-width=".6"/>`;
  g += `<circle r="${f}" fill="url(#pgGlass)"/><path d="M${R(-f*.72)} ${R(-f*.38)} A${f*.86} ${f*.86} 0 0 1 ${R(f*.3)} ${R(-f*.8)}" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".35"/>`;
  return g;
}
const THINGS: Record<string, () => string> = {
  wheel: () => { let g = '<circle r="40" fill="none" stroke="url(#pgWood)" stroke-width="8"/><circle r="29" fill="none" stroke="#5a3a1c" stroke-width="3"/>';
    for(let k = 0; k < 8; k++){ const a = k * Math.PI / 4, c = Math.cos(a), sn = Math.sin(a);
      g += `<path d="M${R(c*9)} ${R(sn*9)} L${R(c*50)} ${R(sn*50)}" stroke="#6e4626" stroke-width="5.5" stroke-linecap="round"/><path d="M${R(c*50)} ${R(sn*50)} L${R(c*64)} ${R(sn*64)}" stroke="url(#pgWood)" stroke-width="7.5" stroke-linecap="round"/>`; }
    return g + '<circle r="11" fill="url(#pgBrass)" stroke="#4a3208"/><circle r="4" fill="#5a3e10"/>'; },
  spyglass: () => '<rect x="0" y="-8" width="58" height="16" rx="3" fill="#4a2e1a"/><path d="M6 -8 V8 M12 -8 V8 M18 -8 V8 M24 -8 V8 M30 -8 V8 M36 -8 V8 M42 -8 V8" stroke="#2e1c10" stroke-width="1"/><rect x="56" y="-6.5" width="44" height="13" rx="2" fill="url(#pgBrassH)"/><rect x="98" y="-5" width="34" height="10" rx="2" fill="url(#pgBrassH)"/><rect x="-6" y="-10" width="8" height="20" rx="2" fill="url(#pgBrassH)"/><rect x="52" y="-9.5" width="6" height="19" rx="1.5" fill="url(#pgBrassH)"/><rect x="95" y="-8" width="5" height="16" rx="1.5" fill="url(#pgBrassH)"/><ellipse cx="133" cy="0" rx="2" ry="4.6" fill="#9ec4d0"/>',
  dividers: () => '<path d="M0 -4 L62 -16 M0 4 L62 16" stroke="url(#pgBrassH)" stroke-width="4.5" stroke-linecap="round"/><path d="M58 -15 L74 -18 M58 15 L74 18" stroke="#9aa2a8" stroke-width="2.4" stroke-linecap="round"/><circle cx="0" cy="0" r="7" fill="url(#pgBrass)" stroke="#4a3208"/><circle cx="0" cy="0" r="2.4" fill="#5a3e10"/><path d="M-6 0 H-16" stroke="url(#pgBrassH)" stroke-width="3" stroke-linecap="round"/>',
  coins: () => [[-18,10,-10],[8,12,6],[22,2,-4],[0,0,0],[-6,-8,8]].map(([x, y, r]: number[]) => `<g transform="translate(${x} ${y}) rotate(${r})"><ellipse rx="13" ry="5.4" cy="1.6" fill="#7a5a18"/><ellipse rx="13" ry="5.4" fill="url(#pgGold)" stroke="#6b4a12" stroke-width=".7"/><ellipse rx="8.5" ry="3.3" fill="none" stroke="#8a6a20" stroke-width=".6"/></g>`).join(''),
  anchor: () => '<g fill="none" stroke="url(#pgIron)" stroke-linecap="round"><circle cx="0" cy="-48" r="8" stroke-width="5"/><path d="M0 -40 V42" stroke-width="8"/><path d="M-40 12 Q-34 42 0 46 Q34 42 40 12" stroke-width="7"/></g><path d="M-22 -30 H22" stroke="#5a3a1c" stroke-width="7" stroke-linecap="round"/><path d="M-40 12 l-11 13 l15 -2 Z M40 12 l11 13 l-15 -2 Z" fill="#3a3a3a"/>',
  hourglass: () => '<rect x="-17" y="-34" width="34" height="6" rx="2" fill="url(#pgWood)"/><rect x="-17" y="28" width="34" height="6" rx="2" fill="url(#pgWood)"/><path d="M-13 -28 V28 M13 -28 V28" stroke="#5a3a1c" stroke-width="3"/><path d="M-10 -28 Q-10 -6 -1.6 0 Q-10 6 -10 28 H10 Q10 6 1.6 0 Q10 -6 10 -28 Z" fill="rgba(220,236,240,.38)" stroke="#d8e6ea" stroke-width=".8"/><path d="M-7 -18 Q-4 -6 0 -1 Q4 -6 7 -18 Z" fill="#d9b46a"/><path d="M0 0 V22" stroke="#d9b46a" stroke-width=".8"/><path d="M-9 28 Q0 15 9 28 Z" fill="#d9b46a"/><path d="M-7 -24 V20" stroke="#fff" stroke-width="1.4" opacity=".4" stroke-linecap="round"/>',
  bottle: () => '<path d="M-6 -40 H6 V-26 Q18 -18 18 -2 V34 Q18 40 12 40 H-12 Q-18 40 -18 34 V-2 Q-18 -18 -6 -26 Z" fill="url(#pgGlassG)" stroke="#1e3226" stroke-width=".8"/><rect x="-7" y="-48" width="14" height="9" rx="2" fill="#a07a4a"/><path d="M-11 -6 V30" stroke="#d8f0e0" stroke-width="2.4" stroke-linecap="round" opacity=".45"/><rect x="-12" y="4" width="24" height="18" rx="1" fill="#e8dcbc" opacity=".8"/>',
};
// [thing, x, y, scale, rotation, opacity, shadow length]
const TABLE: [string, number, number, number, number, number, number][] = [
  // lowered so only its upper rim peeks over the bottom edge: clear of the Hold and of «Перестроение» under it (e2e table, Б6)
  ['wheel', 128, 712, 1.1, 14, .5, 9],
  ['anchor', 560, 612, 1.15, -14, .45, 8],
  ['spyglass', 242, 29, .98, -5, .62, 5],
  ['dividers', 925, 27, .95, 4, .62, 5],
  ['coins', 1110, 522, .95, 0, .7, 4],
];
export function tableThings(): string {
  let defs = `<defs>
    <linearGradient id="pgBrass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbe6a2"/><stop offset=".35" stop-color="#d6a845"/><stop offset=".7" stop-color="#a5772a"/><stop offset="1" stop-color="#6e4c14"/></linearGradient>
    <linearGradient id="pgBrassH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6dc90"/><stop offset=".45" stop-color="#c8963a"/><stop offset="1" stop-color="#6e4c14"/></linearGradient>
    <radialGradient id="pgBrassIn" cx=".5" cy=".5" r=".5"><stop offset=".86" stop-color="#7a561a"/><stop offset="1" stop-color="#c9a048"/></radialGradient>
    <radialGradient id="pgPaper" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#f7ecd2"/><stop offset=".75" stop-color="#e6d3a8"/><stop offset="1" stop-color="#c9b07c"/></radialGradient>
    <radialGradient id="pgGlass" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".45" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#3a2a10" stop-opacity=".18"/></radialGradient>
    <linearGradient id="pgWood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9a6a3a"/><stop offset="1" stop-color="#5a3a1c"/></linearGradient>
    <linearGradient id="pgIron" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6a6a68"/><stop offset="1" stop-color="#2a2a2a"/></linearGradient>
    <linearGradient id="pgGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe9a0"/><stop offset=".5" stop-color="#d8a83e"/><stop offset="1" stop-color="#9a7020"/></linearGradient>
    <linearGradient id="pgGlassG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3f6a50"/><stop offset=".5" stop-color="#2a4a38"/><stop offset="1" stop-color="#1a3024"/></linearGradient>`;
  let body = '';
  TABLE.forEach(([k, x, y, sc, rot, op, far], i) => {
    defs += shadowFilter('pgsh' + i, x, y, far);
    body += `<g data-thing="${k}" transform="translate(${x} ${y}) rotate(${rot}) scale(${sc})" opacity="${op}" filter="url(#pgsh${i})">${THINGS[k]()}</g>`;
  });
  // the compass: the jewel of the table, in the free corner between the hand and «Ход окончен»
  // the game: a little left and lower than in the prototype (950, 566) — the round «Отменить» stays off its rim; ≈ 82 %
  defs += shadowFilter('pgshC', 905, 600, 10);
  body += `<g transform="translate(905 600) rotate(-8)" filter="url(#pgshC)" opacity=".82" style="opacity:.82">${compassHero(70)}</g>`;
  return defs + '</defs>' + body;
}

/**
 * The hourglass «за Трюмом пиратов» (the tail of package 1): not a part of the picture of the table any more — that picture
 * is scaled to the window and put the glass under the caption of the Hold at 1280 and 1920 px — but a small picture of its
 * own beside the tray of kegs (TeamRow, game.css .hold-glass), so it keeps clear of the caption at any width.
 */
export function hourglassSvg(): string {
  return `<svg width="38" height="70" viewBox="-19 -35 38 70" aria-hidden="true"><defs><linearGradient id="hgWood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9a6a3a"/><stop offset="1" stop-color="#5a3a1c"/></linearGradient></defs><g transform="rotate(-4)">${THINGS.hourglass().replace(/pgWood/g, 'hgWood')}</g></svg>`;
}
