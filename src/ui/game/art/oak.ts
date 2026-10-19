// The medallion of the oak board «Ход окончен» / «Огонь!» / «Реванш» (docs/mockups/a5/A5Rig.html «Ход окончен — итог», endPlate;
// the muzzle — MUZZLE_S of phone/src/phone_tpl.html): a brass rim, a dark disc with a dotted ring, a glint, and the sign —
// the anchor (without a rope) or the muzzle of a gun. The ids are unique for each drawing (Chrome loses the fill of a picture
// whose first copy with the same id lies in a hidden block).
let n = 0;

export type OakSign = 'anchor' | 'muzzle';

/** The anchor of the medallion: box 0..20 × 0..30, as in the prototype (ANCHOR of rig3_tpl.html). */
const anchorBody = (b: string, r: string) => `<g transform="translate(-3 0)"><circle cx="13" cy="3.2" r="2.7" fill="none" stroke="#4a3208" stroke-width="2.6"/><circle cx="13" cy="3.2" r="2.7" fill="none" stroke="url(#${b})" stroke-width="1.6"/>
  <path d="M2.6 7.2 Q13 6.4 23.4 7.2 L23.4 9.4 Q13 8.6 2.6 9.4 Z" fill="url(#${b})" stroke="#4a3208" stroke-width=".55"/><circle cx="2.4" cy="8.3" r="1.6" fill="url(#${r})" stroke="#4a3208" stroke-width=".45"/><circle cx="23.6" cy="8.3" r="1.6" fill="url(#${r})" stroke="#4a3208" stroke-width=".45"/>
  <path d="M11.5 5.6 H14.5 L15.1 24.6 H10.9 Z" fill="url(#${b})" stroke="#4a3208" stroke-width=".6"/><path d="M12.2 6.2 L11.8 24" stroke="#fff3c4" stroke-width=".6" opacity=".8"/>
  <path d="M1.4 16.8 Q1.6 26.4 13 28.8 Q24.4 26.4 24.6 16.8 L21.8 19 Q21 24.8 13 26 Q5 24.8 4.2 19 Z" fill="url(#${b})" stroke="#4a3208" stroke-width=".6"/>
  <path d="M1.4 16.8 L-1.8 18.6 Q-1.4 21.8 0.8 23.8 L4.6 20.4 Z M24.6 16.8 L27.8 18.6 Q27.4 21.8 25.2 23.8 L21.4 20.4 Z" fill="url(#${b})" stroke="#4a3208" stroke-width=".55"/>
  <path d="M-.6 19.2 Q0 21.4 1.2 22.6 M26.6 19.2 Q26 21.4 24.8 22.6" stroke="#fff3c4" stroke-width=".5" fill="none" opacity=".7"/></g>`;

/** The muzzle of a gun in its port (MUZZLE_S): the red inside of the port, the iron mouth with a glint. */
const muzzleBody = (id: string) => `<defs><radialGradient id="${id}i" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#a7b0b4"/><stop offset=".35" stop-color="#4a5256"/><stop offset=".8" stop-color="#1a1d1f"/><stop offset="1" stop-color="#0a0b0c"/></radialGradient><linearGradient id="${id}p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3e0b07"/><stop offset=".4" stop-color="#7e1d14"/><stop offset="1" stop-color="#9a2a1e"/></linearGradient></defs>
  <rect x="-13" y="-13" width="26" height="26" rx="2" fill="#140d07"/><rect x="-11" y="-11" width="22" height="22" fill="url(#${id}p)"/><rect x="-11" y="-11" width="22" height="5" fill="#000" opacity=".45"/><rect x="-13" y="10.6" width="26" height="2.4" fill="#8a6a46"/>
  <circle cx=".6" cy="1.2" r="9" fill="#000" opacity=".4"/><circle r="8.6" fill="url(#${id}i)" stroke="#050505" stroke-width=".6"/><circle r="7.2" fill="none" stroke="#c4cccf" stroke-width=".7" opacity=".55"/><circle r="6" fill="none" stroke="#0a0b0c" stroke-width=".6"/><circle r="4.4" fill="#050505"/><circle r="4.4" fill="none" stroke="#3a4044" stroke-width=".5"/>
  <path d="M-6.4 -3.6 A7.4 7.4 0 0 1 -1.4 -7.2" stroke="#eef2f3" stroke-width="1.1" fill="none" opacity=".85" stroke-linecap="round"/><circle cx="2.2" cy="2.2" r=".9" fill="#ff8a3a" opacity=".5"/>`;

/** The round brass medallion, 54 × 54 units (CSS sizes it: .oak-med svg). */
export function oakMedal(sign: OakSign = 'anchor'): string {
  const id = `oak${++n}`;
  const b = `${id}b`, r = `${id}r`;
  const inner =
    sign === 'anchor'
      ? `<g transform="translate(14.6 10.4) scale(1.12)">${anchorBody(b, r)}</g>`
      : `<g transform="translate(27 27) scale(1.12)">${muzzleBody(id)}</g>`;
  return `<svg viewBox="0 0 54 54" aria-hidden="true" focusable="false"><defs>
    <linearGradient id="${b}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0b8"/><stop offset=".35" stop-color="#e2bf62"/><stop offset=".7" stop-color="#9a7020"/><stop offset="1" stop-color="#d8b05a"/></linearGradient>
    <radialGradient id="${r}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff3c4"/><stop offset=".35" stop-color="#e2bf62"/><stop offset=".8" stop-color="#8f6b20"/><stop offset="1" stop-color="#5e4210"/></radialGradient></defs>
    <circle cx="28" cy="29" r="27" fill="#000" opacity=".35"/><circle cx="27" cy="27" r="27" fill="url(#${r})" stroke="#4a3208" stroke-width="1"/><circle cx="27" cy="27" r="23" fill="#2a1a0e" stroke="#4a3208" stroke-width=".8"/><circle cx="27" cy="27" r="21.4" fill="none" stroke="url(#${b})" stroke-width=".8" stroke-dasharray="1.2 1.4"/><path d="M8 18 A20 20 0 0 1 21 6" stroke="#fff6d8" stroke-width="1.6" fill="none" opacity=".35" stroke-linecap="round"/>${inner}</svg>`;
}
