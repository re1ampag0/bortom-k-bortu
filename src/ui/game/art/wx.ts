// The weather icons of A5 (docs/mockups/a5/fx/src/template.html: WX2, SHIP; viewBox 0 0 40 34): 17 sea cards with the small
// ships v3 (art/ship3wx.json: flat fills, no ids — they can be repeated as often as wanted). One light (top left), one ink,
// the parts that move carry data-a (the animations: game.css .wx-live, only on the face of a sea card and with the rich effects).
import SHIP3 from './ship3wx.json';

interface ShipOpts { x?: number; y?: number; scale?: number; heel?: number; flip?: boolean; sails?: string; kind?: string; flag?: string; ports?: boolean; [extra: string]: unknown }
/** A small ship: the origin is the middle of the waterline, the scale is 0.27 × scale, the bow to the right (flip — to the left). */
function SHIP(o: ShipOpts = {}): string {
  const k = (o.scale || 1) * 0.27, kind = (o.sails === 'ghost' ? 'dutch' : o.kind || 'merchant') as keyof typeof SHIP3;
  const t = `translate(${o.x || 0} ${o.y || 0}) rotate(${o.heel || 0}) scale(${o.flip ? k : -k} ${k}) translate(-60 -71)`;
  return `<g data-a="ship"><g transform="${t}" style="--hole:#efe3c8"${o.sails === 'ghost' ? ' opacity=".85"' : ''}>${SHIP3[kind]}</g></g>`;
}

const INK = '#22190f';
const wl = (y: number, c = '#3d6f88', w = 1.3, o = 1, amp = 1.8, x0 = 2, x1 = 38): string => { let d = `M${x0} ${y}`; for(let x = x0; x < x1; x += 6) d += ` q1.5 ${-amp} 3 0 t3 0`; return `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" opacity="${o}"/>`; };
const WX2: Record<string, string> = {
  /* Штиль: glassy water, a slack sail hanging in folds, a limp pennant, the sun and its still reflection */
  calm: `
    <g data-a="sun"><circle cx="31" cy="8.6" r="4.4" fill="#f2c94c" stroke="#b8862a" stroke-width=".8"/><path d="M29.4 7 a2.4 2.4 0 0 1 2.6 -1" fill="none" stroke="#fbe7a2" stroke-width="1" stroke-linecap="round"/></g>
    <path d="M2.5 25.6 H37.5" stroke="#3d6f88" stroke-width="1.2" stroke-linecap="round"/>
    <g data-a="glint"><path d="M28 27.8 H34 M29.2 30 H32.8 M30.2 32 H31.8" stroke="#e2b23e" stroke-width="1" stroke-linecap="round" opacity=".85"/></g>
    <g opacity=".28" transform="translate(0 51.2) scale(1 -1)">${SHIP({x: 14, y: 25.6, scale: .78, sails: 'slack', ports: false})}</g>
    ${SHIP({x: 14, y: 25.6, scale: .78, sails: 'slack'})}`,
  /* Попутный ветер: a full sail bellied by three curling gusts, the ship heeling and running */
  wind: `
    <g data-a="wave">${wl(29.6, '#3d6f88', 1.3)}${wl(32.6, '#3d6f88', 1, .5, 1.4, 8, 32)}</g>
    <path d="M14 29 Q22 30.6 31 28.6" fill="none" stroke="#eef6f8" stroke-width=".9" stroke-linecap="round"/>
    ${SHIP({x: 22, y: 28.4, scale: .86, sails: 'full', heel: 5})}
    <g data-a="gust"><path d="M1.5 9 Q7 7.4 11 9.4 Q13.8 11 12.2 13 Q10.8 14.2 9.6 12.8" fill="none" stroke="#6f93a8" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M2.6 15.4 Q8 14.2 11.6 16 Q14.4 17.4 13 19.6" fill="none" stroke="#6f93a8" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M3.6 21 Q7 20.2 9.6 21.2" fill="none" stroke="#6f93a8" stroke-width="1.2" stroke-linecap="round"/></g>`,
  /* Туман: two ghost ships behind soft bands of fog; only the near mast is sure */
  fog: `
    <g data-a="ghost" opacity=".42">${SHIP({x: 28, y: 22.6, scale: .52, sails: 'ghost'})}</g>
    <g opacity=".8" style="filter:saturate(.25)">${SHIP({x: 13, y: 27, scale: .7, sails: 'square', ports: true})}</g>
    <g data-a="fogL">
    <path d="M1.5 12.5 H20 a2.2 2.2 0 0 1 0 4.4 H4 a2.2 2.2 0 0 1 -2.5 -4.4 Z" fill="#cfd3d7" opacity=".9"/>
    </g><g data-a="fogR"><path d="M15 17.6 H36 a2.4 2.4 0 0 1 0 4.8 H17 a2.4 2.4 0 0 1 -2 -4.8 Z" fill="#dcdfe2" opacity=".92"/>
    <path d="M3 24 H24 a2.2 2.2 0 0 1 0 4.4 H5 a2.2 2.2 0 0 1 -2 -4.4 Z" fill="#c6cace" opacity=".92"/>
    <path d="M18 28.8 H37 a2 2 0 0 1 0 4 H20 a2 2 0 0 1 -2 -4 Z" fill="#d6d9dc" opacity=".9"/>
    <path d="M4 14.6 H19 M17 20 H34 M5 26.2 H23 M20 30.8 H35" stroke="#a7acb2" stroke-width=".6" stroke-linecap="round"/></g>`,
  /* Буря — the A5 drawing, unchanged */
  storm: `<g data-a="cloud"><path d="M8 17 C4.6 17 3 15 3.4 12.6 C3.8 10.2 6 9 8.4 9.4 C9.4 5.4 13 3.4 17 4 C20 4.4 22.4 6.4 23.2 9 C24.6 7.8 27 7.6 28.8 8.6 C30.6 9.6 31.4 11.4 31.2 13 C34 13 36 14.6 36 16.8 C36 19 34 20.6 31.6 20.6 H9 C6 20.6 4.6 19 5 17.4 Z" fill="#4a4d52" stroke="#1f2226" stroke-width="1"/><path d="M9.4 9.6 C10.4 6.2 13.4 4.6 16.8 5 C19.2 5.4 21 6.8 21.8 8.8 C19.4 7.6 16 7.6 13.6 9.4 C12.2 10.4 11 10.4 9.4 9.6 Z" fill="#8a8f96"/><path d="M24 10.2 C25.6 9.2 27.6 9.4 29 10.6 C27.6 10.4 26 10.8 24 10.2 Z" fill="#8a8f96"/><path d="M6.4 18.4 C14 19.6 26 19.6 34.4 17.6 C34 19.6 32.6 20.6 31.6 20.6 H9 C7.6 20.6 6.6 19.8 6.4 18.4 Z" fill="#26292d" opacity=".7"/></g><g data-a="bolt"><path d="M19.6 19.4 L16.4 25.4 H19.6 L17.4 31.6 L23.8 23.4 H20.4 L22.6 19.4 Z" fill="#f2c94c" stroke="#7a5a10" stroke-width=".7" stroke-linejoin="round"/></g><g data-a="rain"><path d="M10 22.6 L8.4 26.4 M13.4 22.6 L11.4 27.6 M27.6 22.6 L25.8 27 M31 22.6 L29.4 26.2 M11 28.6 L10.2 30.6 M28 28.4 L27.2 30.4" stroke="#3d5f78" stroke-width="1.3" stroke-linecap="round"/></g>`,
  /* Девятый вал: one great wave rearing up with a curl of foam claws over a tiny ship */
  wave: `
    <g data-a="crest">
    <path d="M1.5 31.5 C6 31 9 27.6 11 22 C13.6 14.4 19 7.6 27 6 C32.6 5 37 7.6 38 11.6 C35.4 9.8 31.6 10.2 29.6 12.8 C27.6 15.6 28.8 19.4 32.4 20 C30.8 24.6 26 27.4 21 28.6 C16 29.8 11 30.6 7.6 32.6 Z" fill="#2f5f74" stroke="${INK}" stroke-width=".9" stroke-linejoin="round"/>
    <path d="M9 28.6 C12 22 15.6 15 22 11 C26 8.6 31 8 34.6 9.4" fill="none" stroke="#4f86a0" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M12.6 25 C15 19.6 18.6 15.2 23 13" fill="none" stroke="#9cc4d4" stroke-width="1" stroke-linecap="round"/>
    <path d="M27 6 C32.6 5 37 7.6 38 11.6 C36.6 10.6 35.4 10.6 34.8 11.4 C34.6 10 33.4 9.6 32.4 10.6 C32 9.4 30.6 9.4 29.6 10.6 C29.2 9 28 8.6 26.6 9.2 Z" fill="#eef6f8" stroke="${INK}" stroke-width=".7" stroke-linejoin="round"/>
    <path d="M32.4 20 C33.6 21 35.2 20.8 36 19.6 M30 22.6 C31 23.8 32.6 23.6 33.4 22.4" fill="none" stroke="#eef6f8" stroke-width="1.1" stroke-linecap="round"/>
    <g data-a="spray"><circle cx="35.6" cy="5" r=".9" fill="#eef6f8"/><circle cx="38" cy="7.4" r=".7" fill="#eef6f8"/><circle cx="31.4" cy="3.6" r=".7" fill="#eef6f8"/></g></g>
    ${SHIP({x: 33.6, y: 31.4, scale: .32, sails: "full", heel: -14})}
    ${wl(32.6, '#3d6f88', 1, .6, 1.2, 22, 38)}`,
  /* Мальстрём: a funnel of the sea seen at a slant, foam spiralling into the dark eye, a plank caught in it */
  maelstrom: `
    <ellipse cx="20" cy="19" rx="18" ry="12" fill="#2a566a" stroke="${INK}" stroke-width=".9"/><g data-a="pull">
    <ellipse cx="20" cy="20" rx="12.6" ry="8.2" fill="#22495b"/>
    <ellipse cx="20.6" cy="21" rx="7.4" ry="4.8" fill="#1a3a49"/>
    <ellipse data-a="eye" cx="21" cy="21.8" rx="3" ry="1.9" fill="#0d1f28"/>
    <path data-a="suck" d="M21 21.8 C24 21.6 26 20 25.4 18.4 C24.6 16.4 20.4 15.6 16.8 16.6 C12.4 17.8 10.6 21 12 23.6 C13.8 26.8 20 27.8 25.6 26.4 C31.6 24.8 35 21 33.6 17.2 C32 13 25.6 10.6 18.6 11.2 C11 11.8 4.6 15.4 4 20" fill="none" stroke="#bfe0ea" stroke-width="1.15" stroke-linecap="round"/>
    <path data-a="suck2" d="M24 19.4 C21.6 18.4 17.4 18.8 15.6 20.4 M28.6 20.8 C26.6 24.2 19.6 25.4 15.2 24" fill="none" stroke="#7fb2c4" stroke-width=".7" stroke-linecap="round"/>
    </g><g data-a="plank" transform="rotate(-24 29 13.4)"><rect x="25.4" y="12.4" width="7.6" height="2.2" rx=".6" fill="#a8703a" stroke="${INK}" stroke-width=".5"/></g>
    <path d="M3 27 C8 31 16 32.4 23 31.6" fill="none" stroke="#eef6f8" stroke-width=".9" stroke-linecap="round" opacity=".7"/>`,
  /* Ясное небо: a warm sun with a halo and sixteen rays, glints on smooth water */
  clear: `
    <circle data-a="halo" cx="20" cy="14" r="10.4" fill="#f7e3a0" opacity=".35"/>
    <g data-a="rays" stroke="#d9a83a" stroke-linecap="round">${Array.from({length: 16}, (_, i) => { const a = i * Math.PI / 8, r1 = 8.6, r2 = i % 2 ? 11 : 12.6; return `<path d="M${(20 + Math.cos(a) * r1).toFixed(1)} ${(14 + Math.sin(a) * r1).toFixed(1)} L${(20 + Math.cos(a) * r2).toFixed(1)} ${(14 + Math.sin(a) * r2).toFixed(1)}" stroke-width="${i % 2 ? .9 : 1.4}"/>`; }).join('')}</g>
    <circle cx="20" cy="14" r="6.6" fill="#f2c94c" stroke="#b8862a" stroke-width=".9"/>
    <path d="M16.6 11.6 a4 4 0 0 1 3.6 -2" fill="none" stroke="#fbeab0" stroke-width="1.3" stroke-linecap="round"/>
    ${wl(29, '#3d6f88', 1.3)}
    <path d="M9 31.6 H12 M27 31.8 H31 M18.6 32.4 H21.4" stroke="#e2b23e" stroke-width="1" stroke-linecap="round"/>`,
  /* Русалки: a scaled tail lifted out of the sea in a ring of splash, a comb of pearls on the water */
  mermaids: `<g data-a="tail">
    <path d="M17.6 30.4 C15.6 25 16.4 19.6 19 15.6 C20.6 13 21 10.4 20 8.2 L22.6 7.6 C24.6 10.8 24.4 14.6 22.8 18 C21.2 21.6 21 25.8 22.6 30.4 Z" fill="#3f8a7a" stroke="${INK}" stroke-width=".9" stroke-linejoin="round"/>
    <path d="M21.2 8 C17.4 7.4 13.4 5.2 11.4 2 C15.4 2.8 18.4 3.6 21 5.4 C23.4 3.4 26.8 2.4 31 2.8 C29 5.8 25.6 7.6 22 8 Z" fill="#4f9e8c" stroke="${INK}" stroke-width=".85" stroke-linejoin="round"/>
    <path d="M13.6 3 C16 4 18.6 5.2 20.6 7 M28.6 3.4 C26.2 4.2 24 5.6 22.6 7.2" fill="none" stroke="#9fd6c4" stroke-width=".6"/>
    <path d="M21 5.4 L21.4 8" stroke="${INK}" stroke-width=".6"/>
    ${[11.6, 14.6, 17.6, 20.6, 23.6, 26.6].map((y, i) => `<path d="M${(19.2 - (i > 2 ? i - 2 : 0) * .5).toFixed(1)} ${y} q1.7 1.3 3.4 0" fill="none" stroke="#9fd6c4" stroke-width=".7"/>`).join('')}
    <path d="M22.6 12 C23 16 21.6 19.6 21.2 24" fill="none" stroke="#2a6a5c" stroke-width="1.2" opacity=".55"/>
    </g><g data-a="drops"><path d="M12 30 C14 27.4 16.2 27 17.8 28.8 M22.6 28.8 C24.4 27 26.8 27.4 28.8 30" fill="none" stroke="#eef6f8" stroke-width="1.2" stroke-linecap="round"/>
    <circle cx="13.6" cy="25.6" r=".9" fill="#eef6f8"/><circle cx="27.6" cy="25" r="1" fill="#eef6f8"/><circle cx="26" cy="22.4" r=".6" fill="#eef6f8"/></g>
    ${wl(31, '#3d6f88', 1.3)}
    <path d="M4 26 C5.4 24.6 7 24.6 8 26 C7 27.2 5.4 27.4 4 26 Z" fill="#c9a048" stroke="${INK}" stroke-width=".5"/><path d="M4.4 26 H7.6 M5 25.2 V26.8 M6 25 V27 M7 25.2 V26.8" stroke="#6b4a12" stroke-width=".35"/>`,
  /* Тортуга: a pirate haven — an island, two palms, a tavern with a lit window, a lantern on the pier */
  tortuga: `
    <path d="M3 28.4 C8 23.4 15 21.6 22 22 C29 22.4 34 24.8 37.6 28.4 Z" fill="#d1b27a" stroke="${INK}" stroke-width=".85" stroke-linejoin="round"/>
    <path d="M8 26.4 C14 24.2 22 23.6 30 25.2" fill="none" stroke="#e8d3a2" stroke-width="1" stroke-linecap="round"/>
    <path d="M12 23 C13 17 12.4 11.6 10.6 7.4" fill="none" stroke="#5a3a1c" stroke-width="1.7" stroke-linecap="round"/>
    <path data-a="frond" d="M10.6 7.4 C6.6 5.4 3 7 2 9.6 C5.4 8.6 7.8 9 9.4 10.4 Z M10.6 7.4 C12.6 3.6 17.2 3 19.6 4.8 C16 5 13.6 6.6 12.6 9 Z M10.6 7.4 C8 9.4 6.6 12.6 7 15.6 C8.4 12.6 10 11 11.6 10.4 Z M10.6 7.4 C14.6 7.4 17.4 10 17.6 13.4 C15.6 11 13.6 10 11.8 10 Z" fill="#3f7a3a" stroke="${INK}" stroke-width=".65" stroke-linejoin="round"/>
    <path d="M17.6 23 C18 19.4 17.6 16.4 16.6 14" fill="none" stroke="#5a3a1c" stroke-width="1.3" stroke-linecap="round"/>
    <path data-a="frond2" d="M16.6 14 C14.2 12.6 12.2 13.6 11.6 15 C13.4 14.6 14.8 15 15.8 15.8 Z M16.6 14 C18 11.8 20.8 11.6 22.2 12.8 C20.2 12.8 18.8 13.6 18 15 Z M16.6 14 C19 14.2 20.6 15.8 20.6 17.8 C19.4 16.4 18.2 15.8 17.2 15.8 Z" fill="#4f8a44" stroke="${INK}" stroke-width=".55" stroke-linejoin="round"/>
    <path d="M23 23.2 V17.4 L27.4 14.2 L31.8 17.4 V23.6" fill="#8a5a32" stroke="${INK}" stroke-width=".8" stroke-linejoin="round"/>
    <path d="M22 17.8 L27.4 13.6 L32.8 17.8" fill="none" stroke="#5a3a1c" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"/>
    <rect data-a="window" x="24.6" y="18.2" width="2.6" height="2.6" fill="#f6c95a" stroke="${INK}" stroke-width=".5"/><rect x="28.2" y="19" width="2" height="4.4" fill="#5a3a1c"/>
    <path d="M33 28.4 V22.4 M33 22.4 H35.4" stroke="${INK}" stroke-width=".8"/><rect x="34.4" y="22.4" width="2" height="2.6" rx=".5" fill="#f2c94c" stroke="${INK}" stroke-width=".5"/><circle data-a="lamp" cx="35.4" cy="23.7" r="2.6" fill="#f2c94c" opacity=".25"/>
    ${wl(31, '#3d6f88', 1.3)}`,
  /* Ром в волнах: a corked bottle bobbing on the waves, its label up, bubbles around */
  rum: `
    <g data-a="bob"><g transform="rotate(-32 20 17)">
      <path d="M17.6 3.8 H22.4 V8.8 C26.4 10.6 27 13.4 27 16.4 V27 C27 28.8 25.8 30 24 30 H16 C14.2 30 13 28.8 13 27 V16.4 C13 13.4 13.6 10.6 17.6 8.8 Z" fill="#5a3a1c" stroke="${INK}" stroke-width=".95" stroke-linejoin="round"/>
      <path d="M17.6 8.8 C13.6 10.6 13 13.4 13 16.4 V27 C13 28.8 14.2 30 16 30 H18 C16.6 29 16.2 27.6 16.2 26 V16 C16.2 13 17 11 18.6 9.8 Z" fill="#7a5230" opacity=".6"/>
      <rect x="17.2" y="1.4" width="5.6" height="3.4" rx=".9" fill="#c9a06a" stroke="${INK}" stroke-width=".7"/>
      <rect x="14.6" y="15.6" width="10.8" height="8.4" rx="1" fill="#efe3c8" stroke="${INK}" stroke-width=".6"/>
      <path d="M15.6 17.2 H24.4 M15.6 22.6 H24.4" stroke="#8e2b22" stroke-width=".5"/>
      <text x="20" y="21.3" text-anchor="middle" font-family="Old Standard TT,Georgia,serif" font-weight="700" font-size="3.6" fill="#8e2b22" letter-spacing=".2">РОМ</text>
      <path d="M15.2 11.6 C14.6 13 14.6 14 14.6 15" stroke="#e8c79a" stroke-width="1.1" stroke-linecap="round" opacity=".6"/>
    </g></g>
    <path d="M2 27.6 q2.5 -2.4 5 0 t5 0 M27 27.6 q2.5 -2.4 5 0 t5 0" fill="none" stroke="#3d6f88" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M10 28.6 C13 25.8 17 25.4 21 27.2 C24 28.6 26 28.2 28 27" fill="none" stroke="#eef6f8" stroke-width="1" stroke-linecap="round"/>
    ${wl(31.6, '#3d6f88', 1.1, .7)}
    <g data-a="bubbles"><circle cx="6" cy="22" r="1.1" fill="none" stroke="#7fb0c8" stroke-width=".6"/><circle cx="33.6" cy="20.6" r=".9" fill="none" stroke="#7fb0c8" stroke-width=".6"/><circle cx="31.6" cy="17.4" r=".6" fill="none" stroke="#7fb0c8" stroke-width=".5"/></g>`,
  /* Торговый караван: a fat merchantman under square sails, a coin pennant, crates on the deck */
  caravan: `
    <g data-a="wave">${wl(30.8, '#3d6f88', 1.3)}</g>
    ${SHIP({x: 19, y: 29.4, scale: .92, sails: 'square', hull: '#7a4a2a', hullLight: '#c08a52', flag: '#2f4f66', ports: false})}
    <g data-a="coins"><circle cx="35.2" cy="9.4" r="2.6" fill="#f2c94c" stroke="#8a6420" stroke-width=".6"/><path d="M35.2 8 V10.8 M34.2 8.8 Q35.2 8.2 36 8.8 Q34.2 9.6 36.2 10.2" fill="none" stroke="#8a6420" stroke-width=".5"/>
    <circle cx="37.2" cy="14.2" r="1.6" fill="#f2c94c" stroke="#8a6420" stroke-width=".5"/><circle cx="33.4" cy="15.6" r="1.1" fill="#f2c94c" stroke="#8a6420" stroke-width=".4"/></g>`,
  /* Сырой порох: a powder keg in the rain, its fuse drooping wet, water running off into a puddle */
  wet: `
    <ellipse data-a="puddle" cx="20" cy="30.4" rx="15" ry="2.4" fill="#7fb0c8" opacity=".55"/><path d="M8 30.4 Q14 29.2 20 30.4 T32 30.4" fill="none" stroke="#9cc4d4" stroke-width=".7"/>
    <path d="M12.6 9 C10.6 14 10.6 23 12.6 28 C17.4 29.4 22.6 29.4 27.4 28 C29.4 23 29.4 14 27.4 9 C22.6 7.6 17.4 7.6 12.6 9 Z" fill="#7a5232" stroke="${INK}" stroke-width=".95"/>
    <path d="M12.6 9 C10.6 14 10.6 23 12.6 28 C13.6 28.3 14.6 28.5 15.6 28.7 C14 23.6 14 14 15.6 8.3 C14.6 8.5 13.6 8.7 12.6 9 Z" fill="#9a6a3c" opacity=".7"/>
    <path d="M16.6 8.3 C15.4 14 15.4 23 16.6 28.8 M20 8 V29 M23.4 8.3 C24.6 14 24.6 23 23.4 28.8" stroke="#4a3018" stroke-width=".6" fill="none"/>
    <path d="M11.4 12.4 C17 13.6 23 13.6 28.6 12.4 M11.4 24.6 C17 25.8 23 25.8 28.6 24.6" stroke="#3a3530" stroke-width="1.7" fill="none"/>
    <ellipse cx="20" cy="8.6" rx="7.4" ry="1.5" fill="#5a3a1c" stroke="${INK}" stroke-width=".7"/>
    <path d="M20 8 C20.4 5.6 22 4 24.4 4.4 C25.8 4.6 26.4 6 26 7.4" fill="none" stroke="#3a3530" stroke-width="1.1" stroke-linecap="round"/>
    <path d="M14.6 18 C14.4 20 14.6 21.4 15 22.4 M25.6 15 C25.8 17 25.6 18.4 25.2 19.4" stroke="#bfe0ea" stroke-width=".9" stroke-linecap="round"/>
    <path data-a="drops" d="M5 3.4 C4 5.4 4 6.6 5 7.2 C6 6.6 6 5.4 5 3.4 Z M33.6 2 C32.6 4 32.6 5.2 33.6 5.8 C34.6 5.2 34.6 4 33.6 2 Z M35.6 13 C34.8 14.6 34.8 15.6 35.6 16.2 C36.4 15.6 36.4 14.6 35.6 13 Z M4 15 C3.2 16.6 3.2 17.6 4 18.2 C4.8 17.6 4.8 16.6 4 15 Z M27.6 1.2 C26.8 2.8 26.8 3.8 27.6 4.4 C28.4 3.8 28.4 2.8 27.6 1.2 Z" fill="#7fb0c8" stroke="#3d5f78" stroke-width=".5"/>`,
  /* Рифы: teeth of rock breaking the sea, foam bursting on them, a broken plank drifting */
  reefs: `
    <path d="M3 29.6 L7.6 18.4 L10.6 21.6 L14 10.6 L17 17 L19 14.4 L24 29.6 Z" fill="#6f665d" stroke="${INK}" stroke-width=".95" stroke-linejoin="round"/>
    <path d="M14 10.6 L14.8 18 L19 14.4 M7.6 18.4 L9 24 M14.8 18 L12.6 25" fill="none" stroke="#9a9086" stroke-width=".7"/>
    <path d="M14 10.6 L17 17 L19 14.4 L24 29.6 H18 C18.6 24 17.4 19.6 14.8 18 Z" fill="#4a433c" opacity=".55"/>
    <path d="M23.6 29.6 L27.4 20.4 L30 23 L33.4 15 L37.2 29.6 Z" fill="#7d736a" stroke="${INK}" stroke-width=".95" stroke-linejoin="round"/>
    <path d="M33.4 15 L34 21.6 M27.4 20.4 L28.6 25" stroke="#a49a90" stroke-width=".7"/>
    <path data-a="foam" d="M1.6 29.4 C3.6 26.6 5.6 26.8 7 28.4 C8.6 25.8 11.6 26 12.6 28.6 C14.4 26.6 17.4 27 18 29 M21 28.8 C22.4 26.4 25 26.4 26 28.4 C27.4 26 30.6 26.2 31.4 28.6 C33 26.8 35.6 27 38.4 29.4" fill="none" stroke="#eef6f8" stroke-width="1.3" stroke-linecap="round"/>
    <circle cx="9.6" cy="24.6" r=".8" fill="#eef6f8"/><circle cx="25" cy="24.4" r=".7" fill="#eef6f8"/><circle cx="31.4" cy="24.6" r=".9" fill="#eef6f8"/>
    ${wl(32.4, '#3d6f88', 1.2)}
    <g data-a="drift"><g transform="rotate(14 34 7)"><path d="M29.8 6 H36.4 L37.4 7 L36.6 8 H29.8 Z" fill="#a8703a" stroke="${INK}" stroke-width=".5"/></g></g>`,
  /* Гроза: a black thunderhead, a forked bolt striking the masthead in a burst of sparks */
  thunder: `
    <g data-a="cloud"><path d="M8.6 14.4 C5 14.4 3.2 12.2 3.6 9.8 C4 7.4 6.4 6.2 8.8 6.6 C9.8 3 13.2 1.2 17 1.8 C19.8 2.2 22 4 22.8 6.4 C24.4 5.4 26.8 5.2 28.6 6.2 C30.4 7.2 31.2 9 31 10.6 C33.8 10.6 35.6 12.2 35.6 14.2 C35.6 16 34 17.2 31.8 17.2 H10 C7.4 17.2 6 15.8 6.6 14.4 Z" fill="#33363b" stroke="#141619" stroke-width="1"/>
    <path d="M9.8 6.8 C10.8 3.8 13.4 2.6 16.6 3 C18.8 3.2 20.4 4.4 21.2 6 C18.8 5.2 15.8 5.4 13.8 6.8 C12.4 7.8 11.2 7.6 9.8 6.8 Z" fill="#6d7279"/>
    <path d="M7 15.6 C15 16.8 26 16.6 34.6 14.8 C34.2 16.4 33 17.2 31.8 17.2 H10 C8.4 17.2 7.4 16.6 7 15.6 Z" fill="#1d1f23" opacity=".8"/></g>
    <g data-a="bolt"><path d="M18.4 16.8 L14.2 20.8 L16.6 21.2 L11.4 25.4 L12.8 22.4 L10.4 22.2 L15.2 16.8 Z" fill="#f2c94c" stroke="#7a5a10" stroke-width=".7" stroke-linejoin="round"/>
    <path d="M15.6 20.9 L20.6 23.2 L19.2 23.8 L23.4 28" fill="none" stroke="#f2c94c" stroke-width=".9" stroke-linejoin="round"/></g>
    ${SHIP({x: 11.4, y: 33, scale: .42, sails: "full", heel: 3})}
    ${wl(33.2, "#3d6f88", 1, .6, 1.2, 2, 22)}
    <g data-a="spark"><path d="M11 25.4 L9.4 23.6 M11 25.4 L12.6 23.6 M11 25.4 L8.6 25.2 M11 25.4 L13.4 25.2" stroke="#f2c94c" stroke-width=".8" stroke-linecap="round"/>
    <circle cx="11" cy="25.6" r="1.3" fill="#fff3c4"/></g>`,
  /* Флот на горизонте: seen through a spyglass — a ring of brass, inside it three sails on the line of the sea */
  fleet: `
    <circle cx="20" cy="17" r="14.6" fill="#c9a048" stroke="${INK}" stroke-width=".9"/>
    <circle cx="20" cy="17" r="12.6" fill="#e9dcbc" stroke="#6b4a12" stroke-width=".8"/>
    <path d="M7.6 18.6 H32.4 A12.6 12.6 0 0 1 7.6 18.6 Z" fill="#7ca4b8"/>
    <path d="M7.4 18.6 H32.6" stroke="#2f5f74" stroke-width=".9"/>
    <g data-a="ships">${SHIP({x: 11.4, y: 18.4, scale: .27, sails: 'full', ports: false})}${SHIP({x: 21, y: 18.7, scale: .4, sails: 'full', flag: '#2f4f66'})}${SHIP({x: 29.8, y: 18.4, scale: .2, sails: 'full', ports: false})}</g>
    <path d="M10 23 q2 -1.2 4 0 t4 0 M22 25 q2 -1.2 4 0 t4 0" fill="none" stroke="#e9f3f6" stroke-width=".8" stroke-linecap="round" opacity=".9"/>
    <path data-a="glint" d="M11 8 A12.6 12.6 0 0 1 22 4.6" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".55"/>
    <circle cx="20" cy="17" r="14.6" fill="none" stroke="#f2d98a" stroke-width=".8" stroke-dasharray="1.4 1.6"/>`,
  /* Лунный свет: a night disc, a crescent with its dark side ghosted, stars, a silver road on the water */
  moon: `
    <circle cx="20" cy="15.4" r="14" fill="#25344a" stroke="${INK}" stroke-width=".9"/>
    <circle cx="20" cy="15.4" r="14" fill="none" stroke="#3d5578" stroke-width="1.6" opacity=".6"/>
    <circle cx="18" cy="12" r="7.2" fill="#3a4a62"/>
    <path d="M21.4 5.4 A7.2 7.2 0 1 0 24.6 17.6 A6 6 0 1 1 21.4 5.4 Z" fill="#f3e6b0" stroke="#a89658" stroke-width=".7"/>
    <circle cx="15" cy="10" r="1" fill="#d9c98a" opacity=".7"/><circle cx="14" cy="14.4" r=".7" fill="#d9c98a" opacity=".7"/>
    <g data-a="stars"><path d="M30 8 l.5 1.3 l1.3 .5 l-1.3 .5 l-.5 1.3 l-.5 -1.3 l-1.3 -.5 l1.3 -.5 Z" fill="#f3e6b0"/><circle cx="27.6" cy="18.4" r=".7" fill="#f3e6b0"/><circle cx="10.2" cy="6.6" r=".6" fill="#f3e6b0"/><circle cx="31.4" cy="14" r=".5" fill="#f3e6b0"/></g>
    <path d="M6.6 22.4 H33.4" stroke="#5a6f8c" stroke-width=".8"/>
    <path data-a="road" d="M17 24.6 H23 M15.6 26.8 H24.4 M17.4 29 H22.6 M18.6 31.2 H21.4" stroke="#f3e6b0" stroke-width="1.1" stroke-linecap="round"/>`,
  /* Течение: the sea in two streams turning against each other, each carrying a small ship */
  current: `
    <path d="M2 12 C8 6.6 14 6.6 19.4 11 C24.4 15 30 15.2 34.6 11" fill="none" stroke="#2f5f74" stroke-width="3.4" stroke-linecap="round"/>
    <path data-a="flowR" d="M2 12 C8 6.6 14 6.6 19.4 11 C24.4 15 30 15.2 34.6 11" fill="none" stroke="#7fb2c4" stroke-width="1" stroke-linecap="round" stroke-dasharray="3 3"/>
    <path d="M32.6 7.6 L37.6 10.2 L33.6 14.2" fill="none" stroke="#2f5f74" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M38 24 C32 29.4 26 29.4 20.6 25 C15.6 21 10 20.8 5.4 25" fill="none" stroke="#4f86a0" stroke-width="3.4" stroke-linecap="round"/>
    <path data-a="flowL" d="M38 24 C32 29.4 26 29.4 20.6 25 C15.6 21 10 20.8 5.4 25" fill="none" stroke="#bfe0ea" stroke-width="1" stroke-linecap="round" stroke-dasharray="3 3"/>
    <path d="M7.4 28.4 L2.4 25.8 L6.4 21.8" fill="none" stroke="#4f86a0" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    <g data-a="rideR">${SHIP({x: 13.4, y: 9.4, scale: .3, sails: 'full', heel: -16})}</g>
    <g data-a="rideL">${SHIP({x: 27.6, y: 26.8, scale: .3, sails: 'full', heel: 14, flip: true, flag: '#2f4f66'})}</g>`,
};

export const WX_KEYS = Object.keys(WX2);
/** The icon of a sea card by its key (data/game-data.json); an unknown key — an empty frame. */
export const wxSvg = (key: string, w = 40, h = 34): string => `<svg width="${w}" height="${h}" viewBox="0 0 40 34" aria-hidden="true">${WX2[key] ?? ''}</svg>`;
