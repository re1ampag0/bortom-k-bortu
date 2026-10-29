// Refined figures, fourth pass: proper anatomy, gradients, small details. Origin-centred, about -35..40.
const fin = (d, u) => `<path d="${d}" fill="url(#fin${u})" stroke="#0e2a24" stroke-width=".5"/>`;
const defs = u => `<linearGradient id="fsk${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9cc4b0"/><stop offset=".45" stop-color="#4a7c6c"/><stop offset="1" stop-color="#1a3a32"/></linearGradient>
  <linearGradient id="fin${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7ab8a4" stop-opacity=".95"/><stop offset="1" stop-color="#2a5a4e" stop-opacity=".8"/></linearGradient>
  <pattern id="scl${u}" width="3.2" height="2.4" patternUnits="userSpaceOnUse"><path d="M0 2.4a1.6 1.6 0 0 1 3.2 0" fill="none" stroke="#0e2e26" stroke-width=".35" opacity=".7"/><path d="M.5 2.2a1.2 1.2 0 0 1 1.2 -1.1" fill="none" stroke="#d8fff0" stroke-width=".2" opacity=".5"/></pattern>
  <linearGradient id="coatG${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#14140f"/><stop offset=".4" stop-color="#3e3e32"/><stop offset="1" stop-color="#16160f"/></linearGradient>
  <linearGradient id="navy${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#10162a"/><stop offset=".45" stop-color="#2e3c62"/><stop offset="1" stop-color="#0e1222"/></linearGradient>
  <radialGradient id="zf${u}" cx=".45" cy=".35" r=".7"><stop offset="0" stop-color="#c4d8b4"/><stop offset=".6" stop-color="#7a9a7c"/><stop offset="1" stop-color="#3e5a46"/></radialGradient>
  <linearGradient id="barn${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f4ecdc"/><stop offset=".45" stop-color="#cdbfa6"/><stop offset="1" stop-color="#6e604c"/></linearGradient>
  <linearGradient id="redc${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a1a12"/><stop offset=".4" stop-color="#c8402e"/><stop offset="1" stop-color="#6a140e"/></linearGradient>
  <linearGradient id="tail${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7ad0c0"/><stop offset=".35" stop-color="#2a8a8a"/><stop offset=".7" stop-color="#1e5a6a"/><stop offset="1" stop-color="#3a3a6a"/></linearGradient>
  <radialGradient id="skin${u}" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#fbe6d2"/><stop offset=".7" stop-color="#e2bea0"/><stop offset="1" stop-color="#a87a5a"/></radialGradient>`;

const barnacle = (u, x, y, r, rot = 0) => { const s = r / 8; return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
  <ellipse cy="5" rx="9.5" ry="3" fill="#120c08" opacity=".35"/>
  <path d="M-8 4Q-7.4 -3.4 -3.6 -6H3.6Q7.4 -3.4 8 4Q0 7 -8 4z" fill="url(#barn${u})" stroke="#4a3e30" stroke-width=".55"/>
  <path d="M-5.2 4.6Q-4.8 -1.6 -2.2 -5.8M0 5.3V-6M5.2 4.6Q4.8 -1.6 2.2 -5.8" stroke="#8a7a62" stroke-width=".45" fill="none"/>
  <path d="M-7.2 1q7.2 2.4 14.4 0M-6.2 -2q6.2 2 12.4 0" stroke="#fffaf0" stroke-width=".35" fill="none" opacity=".55"/>
  <ellipse cy="-6" rx="3.6" ry="1.35" fill="#241a12"/><path d="M-2.4 -6.1q1.2 -.7 2.4 0q1.2 -.7 2.4 0q-1.2 .8 -2.4 .2q-1.2 .6 -2.4 -.2z" fill="#bcae96"/><path d="M0 -6.8v1.4" stroke="#3a2e22" stroke-width=".35"/>
  <ellipse cy="-6.15" rx="3.7" ry="1.4" fill="none" stroke="#fff8ea" stroke-width=".45" opacity=".8"/></g>`; };

module.exports = {
  barnacles: u => `<defs>${defs(u)}</defs>
    <path d="M-30 14q10 -6 22 -2t26 -4t18 6" stroke="#3a6a4a" stroke-width="2.4" fill="none" opacity=".55" stroke-linecap="round"/>
    ${[[-22, -14, 1.4, -20], [6, -18, 1.3, 30], [-8, -24, 1.2, 0], [-28, 4, 1.4, 10], [24, -8, 1.3, -10], [32, 8, 1.2, 20], [-14, 18, 1.4, -5]].map(([x, y, r, a]) => `<path d="M${x} ${y}q${2 * r} ${4 * r} ${-1 * r} ${8 * r}" stroke="#4a8a5a" stroke-width=".8" fill="none" opacity=".7"/><ellipse cx="${x + 3}" cy="${y + 3}" rx="${r * 1.6}" ry="${r}" fill="#5a7a52" opacity=".55" transform="rotate(${a} ${x} ${y})"/>`).join('')}
    ${[[-16, -12, 6.5], [6, -16, 5.5], [20, -4, 7], [-26, 0, 6], [26, 12, 6], [-4, -2, 9], [12, 14, 10], [-16, 14, 8.5], [-2, 22, 6.5], [30, -16, 4.5], [-30, -14, 4], [-8, -22, 4]].sort((a, b) => a[1] - b[1]).map(([x, y, r], k) => barnacle(u, x, y, r, (k % 3 - 1) * 8)).join('')}
    ${[[34, 0], [-34, 10], [2, 30], [-20, 28]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#e4d8c2" stroke="#6a5a44" stroke-width=".4"/><circle cx="${x}" cy="${y}" r=".5" fill="#3a2e22"/>`).join('')}`,

  hand: u => `<defs>${defs(u)}</defs>
    <path d="M-15 46l3 -22h22l5 22z" fill="url(#navy${u})" stroke="#070a14" stroke-width=".7"/><path d="M-12 30h22" stroke="url(#brass${u})" stroke-width="1.6"/><circle cx="-6" cy="36" r="1.3" fill="url(#brass${u})"/><circle cx="4" cy="36" r="1.3" fill="url(#brass${u})"/>
    <path d="M-14 25q2 -4 5 0q2 -4 5 0q2 -4 5 0q2 -4 5 0q2 -4 5 0l-1 4h-24z" fill="#f4efe4" stroke="#b8ae98" stroke-width=".5"/><path d="M-12 27h22" stroke="#d8d0be" stroke-width=".4"/>
    ${[[-8.2, -1, -14, 17], [-2.6, -3, -4, 20.5], [3, -2, 6, 19], [8, 1, 17, 14.5]].map(([x, y, a, l]) => `<g transform="translate(${x} ${y}) rotate(${a})"><rect x="-2.7" y="${-l}" width="5.4" height="${l + 4}" rx="2.7" fill="url(#skin${u})" stroke="#8a5a3a" stroke-width=".55"/>
      <path d="M-1.6 ${-l * .62}q1.6 .7 3.2 0M-1.8 ${-l * .3}q1.8 .8 3.6 0" stroke="#a87050" stroke-width=".4" fill="none"/><path d="M-1.4 ${-l + 1}q1.4 -1 2.8 0v2.4q-1.4 .8 -2.8 0z" fill="#f8e2d2" stroke="#c09a80" stroke-width=".3"/><path d="M-1.6 ${-l + 4}v${l - 6}" stroke="#fff" stroke-width=".7" opacity=".35"/></g>`).join('')}
    <path d="M-11 22q-3 -10 -1 -20q6 -4 13 -3.4q7 .6 10.4 5q1.6 9 -2 16q-10 4 -20.4 2.4z" fill="url(#skin${u})" stroke="#8a5a3a" stroke-width=".6"/>
    <path d="M-6 6q6 4 12 -1M-4 13q5 2 9 -2" stroke="#b07a58" stroke-width=".45" fill="none" opacity=".8"/>
    <g transform="translate(-10 10) rotate(-48)"><rect x="-2.9" y="-15" width="5.8" height="17" rx="2.9" fill="url(#skin${u})" stroke="#8a5a3a" stroke-width=".55"/><path d="M-1.5 -14q1.5 -1 3 0v2.4q-1.5 .8 -3 0z" fill="#f8e2d2" stroke="#c09a80" stroke-width=".3"/><path d="M-1.6 -8q1.6 .7 3.2 0" stroke="#a87050" stroke-width=".4" fill="none"/></g>
    <path d="M-8 18q-2 -8 0 -14" stroke="#fff" stroke-width="1.4" opacity=".3" fill="none"/>`,

  fishman: u => `<defs>${defs(u)}<clipPath id="fhc${u}"><path d="M-12 -6q-4 -14 4 -24q10 -8 20 -2q8 6 8 16q-2 4 -6 6l-6 -1q-4 6 -12 6q-8 -1 -8 -1z"/></clipPath></defs>
    <path d="M-9 41l2 -15h5l1 15zM2 41l1 -15h5l3 15z" fill="#2a2620" stroke="#0e0c08" stroke-width=".5"/>
    <path d="M-17 38q-2 -18 3 -27q6 -6 14 -6q8 0 14 6q5 9 3 27l-3 -2.4 -3 3.4 -3 -3 -3 3.4 -3 -3.4 -3 3.4 -3 -3.4 -3 3.4 -3 -3 -3 2.6z" fill="url(#coatG${u})" stroke="#0a0a06" stroke-width=".7"/>
    <path d="M-4 6l4 13l4 -13z" fill="#6e6a52"/><path d="M-5 6l5 14l5 -14" fill="none" stroke="#7a6a44" stroke-width="1.1"/>
    <path d="M-12 14q0 10 -2 20M11 14q1 10 3 20" stroke="#55553f" stroke-width=".6" fill="none"/>
    <rect x="-15" y="22" width="30" height="3" fill="#2a1a0e"/><rect x="-2.2" y="21.4" width="4.4" height="4.2" fill="none" stroke="url(#brass${u})" stroke-width="1.1"/>
    <path d="M-17 13q-6 8 -7 18" stroke="url(#coatG${u})" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M-24 31q-2 4 1 6q3 0 3 -4z" fill="url(#fsk${u})" stroke="#0e2a24" stroke-width=".5"/>
    <path d="M27 -44L19 44" stroke="url(#oakH${u})" stroke-width="2.2"/><path d="M27 -44l1.4 -9 1.4 9zM28 -48q7 -1 6 6q-1 3 -4 3" stroke="url(#iron${u})" stroke-width="1.6" fill="url(#iron${u})"/>
    <path d="M13 10q7 5 9 14" stroke="url(#coatG${u})" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M19 22q2 -3 5 -1l1 4q-3 3 -6 1z" fill="url(#fsk${u})" stroke="#0e2a24" stroke-width=".5"/><path d="M19 23l-2 2M20 25l-2 2" stroke="#0e2a24" stroke-width=".5"/>
    ${barnacle(u, -12, 8, 3.4, -20)}${barnacle(u, -7, 10, 2.4, 10)}${barnacle(u, 12, 7, 2.6, 15)}
    <path d="M-8 9q-2 -9 1 -14h12q4 5 2 14z" fill="url(#fsk${u})" stroke="#0e2a24" stroke-width=".5"/><path d="M-5 0q5 2 10 0M-6 4q6 2 12 0" stroke="#0e2a24" stroke-width=".5" fill="none" opacity=".7"/>
    <path d="M-12 -6q-4 -14 4 -24q10 -8 20 -2q8 6 8 16q-2 4 -6 6l-6 -1q-4 6 -12 6q-8 -1 -8 -1z" fill="url(#fsk${u})"/>
    <g clip-path="url(#fhc${u})"><rect x="-20" y="-40" width="50" height="50" fill="url(#scl${u})"/><ellipse cx="2" cy="-2" rx="14" ry="5" fill="#d8f0e0" opacity=".25"/></g>
    <path d="M-12 -6q-4 -14 4 -24q10 -8 20 -2q8 6 8 16q-2 4 -6 6l-6 -1q-4 6 -12 6q-8 -1 -8 -1z" fill="none" stroke="#0e2a24" stroke-width=".8"/>
    ${fin('M-9 -24q-2 -12 8 -17q-1 5 2 4q3 -7 9 -6q-2 5 1 6q5 -3 9 0q-7 5 -10 11q-10 -4 -19 2z', u)}<path d="M-6 -26l1 -10M-1 -27l3 -10M4 -27l5 -8M9 -25l6 -5" stroke="#0e2a24" stroke-width=".35" opacity=".7"/>
    ${fin('M-10 -10q-10 -2 -14 6q6 -1 8 2q2 -4 6 -3z', u)}
    <path d="M-5 -14q-2 4 0 8M-2 -15q-2 4 0 9M1 -15q-2 4 0 9" stroke="#0e2a24" stroke-width=".7" fill="none"/>
    <path d="M7 -4q7 -1 13 -7" stroke="#0a1612" stroke-width="1.2" fill="none"/>${[9, 12, 15, 18].map((x, k) => `<path d="M${x} ${-4.6 - k * 1.5}l.9 1.8.8 -2.3z" fill="#f0ead6"/>`).join('')}
    <circle cx="10" cy="-16" r="6" fill="#e8f080" opacity=".15"/><circle cx="10" cy="-16" r="3.4" fill="#d8c860" stroke="#2a2a10" stroke-width=".5"/><ellipse cx="10.6" cy="-16" rx="1" ry="2.2" fill="#0a0a06"/><circle cx="9.4" cy="-17.2" r=".7" fill="#fff"/>
    <path d="M5 -20q5 -3 10 0" stroke="#0e2a24" stroke-width=".8" fill="none"/>`,

  zombie: u => `<defs>${defs(u)}</defs>
    <path d="M-18 40q0 -22 6 -28q6 -4 12 -4t12 4q6 6 6 28z" fill="url(#navy${u})" stroke="#05070e" stroke-width=".7"/>
    <path d="M-3 8l-7 20h5zM3 8l7 20h-5z" fill="#6a1610" stroke="#3a0a06" stroke-width=".4"/><path d="M-3 8l-7 20M3 8l7 20" stroke="url(#brass${u})" stroke-width=".8" fill="none"/>
    ${[13, 18, 23, 28, 33].map(y => `<circle cx="-4.4" cy="${y}" r=".9" fill="url(#brass${u})"/><circle cx="4.4" cy="${y}" r=".9" fill="url(#brass${u})"/>`).join('')}
    ${[-14, 14].map(x => `<g transform="translate(${x} 11)"><ellipse rx="5.4" ry="2.2" fill="url(#brass${u})" stroke="#5a4010" stroke-width=".4"/>${Array.from({ length: 7 }, (_, k) => `<path d="M${-4.5 + k * 1.5} 1.6v3.4" stroke="#c9a048" stroke-width=".6"/>`).join('')}</g>`).join('')}
    <path d="M-12 22q-1 8 -2 18M12 22q1 8 2 18" stroke="#3e4c72" stroke-width=".6" fill="none"/><path d="M-6 30q3 2 2 6M7 28l-2 5" stroke="#05070e" stroke-width=".8" fill="none"/>
    <rect x="-3.2" y="1" width="6.4" height="7" fill="#6e8e74"/><path d="M-3.4 7q3.4 7 6.8 0q-1 7 -3.4 10q-2.4 -3 -3.4 -10z" fill="#c8c0a6" stroke="#8a826a" stroke-width=".4"/>
    <path d="M-8 -12q0 -10 8 -11q8 1 8 11q0 8 -3 12q-2 3 -5 3t-5 -3q-3 -4 -3 -12z" fill="url(#zf${u})" stroke="#2a3a2e" stroke-width=".6"/>
    <path d="M-6 -2q2 3 1.6 6M6 -2q-2 3 -1.6 6" stroke="#3a5240" stroke-width="1.3" opacity=".6" fill="none"/>
    <ellipse cx="-3.4" cy="-8" rx="2.6" ry="2.1" fill="#16201a"/><ellipse cx="3.4" cy="-8" rx="2.6" ry="2.1" fill="#16201a"/>
    <circle cx="-3.2" cy="-7.8" r="2.4" fill="#c8ff8a" opacity=".22"/><circle cx="3.6" cy="-7.8" r="2.4" fill="#c8ff8a" opacity=".22"/><circle cx="-3.2" cy="-7.8" r=".9" fill="#e4ffb0"/><circle cx="3.6" cy="-7.8" r=".9" fill="#e4ffb0"/>
    <path d="M0 -6.5l-1.2 4h2.2" stroke="#3a5240" stroke-width=".6" fill="none"/><path d="M-3.2 1.4q3.2 1.2 6.4 0" stroke="#16201a" stroke-width="1"/>${[-2, 0, 2].map(x => `<path d="M${x} .6v1.8" stroke="#c8d0b8" stroke-width=".4"/>`).join('')}
    <path d="M4 -4l3 3" stroke="#3a1a14" stroke-width=".6"/><path d="M4.6 -3.4l.8 -.8M5.6 -2.4l.8 -.8" stroke="#3a1a14" stroke-width=".4"/>
    <path d="M-8 -12q-2.4 8 -1.4 15M8 -12q2.4 8 1.4 15M-7 -11q-1 6 0 10" stroke="#3a3a30" stroke-width="1.3" fill="none"/>
    <path d="M-9 -14q0 -10 9 -10t9 10z" fill="#1a1612"/><path d="M-18 -12q8 -6 18 -5q10 -1 18 5q-8 3.4 -18 1.4q-10 2 -18 -1.4z" fill="#241e18" stroke="url(#brass${u})" stroke-width=".8"/><path d="M-8 -17q8 -2 16 0" stroke="#3a3228" stroke-width=".6" fill="none"/>`,

  musketeers: u => `<defs>${defs(u)}</defs>` + [[-30, 2, .92], [30, 2, .92], [0, -2, 1]].map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cy="37" rx="11" ry="2" fill="#120a04" opacity=".35"/>
    <path d="M-5.5 19h11l-1 9h-9z" fill="#ece6d6" stroke="#9a9280" stroke-width=".4"/><path d="M-5.4 27h4.6v9.4h-4.6zM.8 27h4.6v9.4h-4.6z" fill="#1a1612"/>${[29, 31, 33].map(yy => `<circle cx="-1.4" cy="${yy}" r=".35" fill="#8a8270"/><circle cx="4.8" cy="${yy}" r=".35" fill="#8a8270"/>`).join('')}<path d="M-6.4 36.4h6.2v1.6h-6.2zM.4 36.4h6.2v1.6h-6.2z" fill="#0a0806"/>
    <path d="M-9 3q9 -4 18 0l2.4 20q-11 3 -22.8 0z" fill="url(#redc${u})" stroke="#3a0a06" stroke-width=".5"/>
    <path d="M-11.4 23l2.4 -9 2 9.4zM11.4 23l-2.4 -9 -2 9.4z" fill="#f4efe6" stroke="#b8ae98" stroke-width=".3"/>
    <path d="M-2.2 3v18M2.2 3v18" stroke="#24305a" stroke-width="1.4"/>${[7, 11, 15, 19].map(yy => `<circle cx="-3.4" cy="${yy}" r=".55" fill="url(#brass${u})"/><circle cx="3.4" cy="${yy}" r=".55" fill="url(#brass${u})"/>`).join('')}
    <path d="M-8 4L7 19M8 4L-7 19" stroke="#f6f2e8" stroke-width="1.7"/><circle cx="0" cy="11.5" r="1.6" fill="url(#brass${u})" stroke="#5a4010" stroke-width=".3"/>
    <path d="M-9 5q-3 8 -1.6 15" stroke="url(#redc${u})" stroke-width="4" stroke-linecap="round" fill="none"/><circle cx="-10.4" cy="20.6" r="1.8" fill="url(#flesh${u})"/>
    <path d="M9 5q3 4 2 8" stroke="url(#redc${u})" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M9 33L12.6 -20" stroke="url(#oakH${u})" stroke-width="2.2"/><path d="M11.4 -2L12.8 -21" stroke="url(#iron${u})" stroke-width="1.3"/><path d="M12.8 -21l.5 -9" stroke="#e8eef2" stroke-width=".8"/><circle cx="11" cy="12.4" r="1.8" fill="url(#flesh${u})"/>
    <path d="M-2.6 0h5.2v3h-5.2z" fill="#f4efe6"/>
    <ellipse cx="0" cy="-4.4" rx="4.4" ry="5" fill="url(#flesh${u})" stroke="#7a4a2a" stroke-width=".4"/><circle cx="-1.6" cy="-4.6" r=".55" fill="#1a0f06"/><circle cx="1.6" cy="-4.6" r=".55" fill="#1a0f06"/><path d="M-1.2 -1.4q1.2 .6 2.4 0" stroke="#7a3a2a" stroke-width=".4" fill="none"/>
    <path d="M-4.4 -6q-1.6 4 0 7M4.4 -6q1.6 4 0 7" stroke="#f0ece2" stroke-width="1.6" fill="none"/><path d="M0 0q-.4 4 1 7" stroke="#2a2420" stroke-width=".9" fill="none"/>
    <path d="M-9.6 -7.6q4 -6 9.6 -6t9.6 6q-4 -1 -6 2q-3.6 -2.6 -7.2 0q-2 -3 -6 -2z" fill="#16120e" stroke="#f0ece2" stroke-width=".7"/><circle cx="-4" cy="-10" r=".9" fill="#1e1e1e" stroke="#c9a048" stroke-width=".3"/></g>`).join(''),

  mermaid: u => `<defs>${defs(u)}<clipPath id="tlc${u}"><path d="M-10 6q-8 10 -4 22q4 8 -2 16q-8 4 -20 4q12 4 20 2q4 -1 8 -6q6 -8 4 -18q-1 -10 6 -18z"/></clipPath></defs>
    <path d="M-26 46q2 -16 14 -22q16 -6 28 2q12 8 12 20z" fill="#1a262e" stroke="#0a1014" stroke-width=".6"/><path d="M-20 34q10 -8 26 -6" stroke="#3a5060" stroke-width=".8" fill="none"/><path d="M8 30q6 4 10 12" stroke="#2a3a44" stroke-width=".7" fill="none"/>
    <path d="M-10 6q-8 10 -4 22q4 8 -2 16q-8 4 -20 4q12 4 20 2q4 -1 8 -6q6 -8 4 -18q-1 -10 6 -18z" fill="url(#tail${u})" stroke="#0e2e30" stroke-width=".6"/>
    <g clip-path="url(#tlc${u})"><rect x="-40" y="0" width="60" height="60" fill="url(#scl${u})"/><path d="M-8 8q-6 10 -3 20" stroke="#c8fff4" stroke-width="1.6" opacity=".35" fill="none"/></g>
    <path d="M-36 48q-8 -4 -12 -12q8 2 14 8q-2 -8 2 -16q4 10 6 18z" fill="url(#fin${u})" stroke="#0e2e30" stroke-width=".5"/><path d="M-44 38l8 8M-40 34l5 11M-34 32l1 12" stroke="#d8fff4" stroke-width=".35" opacity=".7"/>
    <path d="M-12 6q2 -6 10 -6q8 0 10 6q-1 4 -6 5l-8 0q-5 -1 -6 -5z" fill="url(#fin${u})" opacity=".9"/>
    <path d="M-8 4q-2 -14 2 -24q6 -4 10 0q4 10 2 24z" fill="url(#skin${u})" stroke="#8a5a3a" stroke-width=".5"/>
    <path d="M-6 -12q4 3 8 0" stroke="#b08060" stroke-width=".5" fill="none"/><circle cx="-4.6" cy="-9" r="2.4" fill="#2a8a8a" stroke="#0e2e30" stroke-width=".4"/><circle cx="1.6" cy="-9" r="2.4" fill="#2a8a8a" stroke="#0e2e30" stroke-width=".4"/>
    <path d="M-8 -16q-6 6 -4 16q2 4 6 2M5 -16q6 8 2 18" stroke="url(#skin${u})" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M-6 -22q-1 -2 0 -4q2 -6 6 -6q5 0 6 6q0 4 -2 6q-2 3 -5 3q-3 -1 -5 -5z" fill="url(#skin${u})" stroke="#8a5a3a" stroke-width=".5"/>
    
    <path d="M-7 -26q0 -10 7 -10q8 0 8 10q2 10 -2 24q4 6 2 12q-4 -10 -4 -18q2 -8 0 -14q-4 -4 -8 0q-4 4 -2 16q-2 10 -6 16q0 -10 2 -18q-2 -10 3 -18z" fill="#1a1210"/>
    <path d="M-4 -33q4 -2 8 0M6 -24q2 8 0 16" stroke="#4a3a30" stroke-width=".5" fill="none"/><ellipse cx="-2.2" cy="-25" rx=".9" ry=".7" fill="#1e4a4a"/><ellipse cx="2.6" cy="-25" rx=".9" ry=".7" fill="#1e4a4a"/><circle cx="-2" cy="-25.2" r=".25" fill="#fff"/><circle cx="2.8" cy="-25.2" r=".25" fill="#fff"/><path d="M-3.4 -26.4q1.2 -.8 2.4 0M1.4 -26.4q1.2 -.8 2.4 0" stroke="#2a1a14" stroke-width=".4" fill="none"/><path d="M.2 -24.4l-.4 1.6h.8" stroke="#b08060" stroke-width=".3" fill="none"/><path d="M-.8 -21.6q1 .7 2 0" stroke="#b03a3a" stroke-width=".7" fill="none"/>
    <path d="M-14 -10q16 6 28 -2M-14 -4q16 6 28 -2" stroke="#c9a878" stroke-width=".8" fill="none" opacity=".85"/><path d="M14 -12q10 -2 18 6" stroke="#c9a878" stroke-width=".8" fill="none" opacity=".85"/>`,

  fireWall: u => { const f = 'fw' + u; return `<defs><filter id="${f}" x="-10%" y="-30%" width="120%" height="160%"><feTurbulence type="fractalNoise" baseFrequency=".05 .09" numOctaves="3" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="12" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation=".5"/></filter>
    <linearGradient id="${f}o" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#8a1a06"/><stop offset=".3" stop-color="#e2501a"/><stop offset=".7" stop-color="#ff9a2a" stop-opacity=".9"/><stop offset="1" stop-color="#ffcc5a" stop-opacity="0"/></linearGradient>
    <linearGradient id="${f}i" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff9a3a" stop-opacity="0"/><stop offset=".25" stop-color="#ffcf6a"/><stop offset=".6" stop-color="#fff2b0"/><stop offset="1" stop-color="#fff8d8" stop-opacity="0"/></linearGradient>
    <radialGradient id="${f}h" cx=".5" cy="1" r=".8"><stop offset="0" stop-color="#ffb040" stop-opacity=".7"/><stop offset="1" stop-color="#ff6a1a" stop-opacity="0"/></radialGradient></defs>
    <rect x="-10" y="40" width="220" height="70" fill="url(#${f}h)"/>
    <g filter="url(#${f})"><path d="M-6 112${Array.from({ length: 12 }, (_, k) => { const x = k * 18, h = 40 + ((k * 37) % 23); return `L${x + 4} ${100 - h * .5}Q${x + 9} ${100 - h} ${x + 12} ${100 - h * .55}L${x + 18} ${96 - (k % 3) * 6}`; }).join('')}L206 112z" fill="url(#${f}o)"/>
    <path d="M-6 112${Array.from({ length: 12 }, (_, k) => { const x = k * 18 + 6, h = 22 + ((k * 29) % 15); return `L${x + 3} ${104 - h * .4}Q${x + 7} ${104 - h} ${x + 10} ${104 - h * .4}L${x + 14} ${104}`; }).join('')}L206 112z" fill="url(#${f}i)" opacity=".85"/></g>
    <linearGradient id="${f}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a1606" stop-opacity=".2"/><stop offset="1" stop-color="#1a0604" stop-opacity=".85"/></linearGradient><rect x="0" y="104" width="200" height="16" fill="url(#${f}w)"/>${Array.from({ length: 10 }, (_, k) => `<path d="M${k * 22} ${108 + (k % 3)}h${10 + (k % 4) * 3}" stroke="#ffb050" stroke-width=".6" opacity=".7"/>`).join('')}`; },
};
module.exports.blackbeard = u => `<defs><radialGradient id="bbs${u}" cx=".45" cy=".35" r=".7"><stop offset="0" stop-color="#e8b890"/><stop offset=".7" stop-color="#a8704c"/><stop offset="1" stop-color="#5a3420"/></radialGradient>
  <linearGradient id="bbc${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0e0a08"/><stop offset=".45" stop-color="#3a2a22"/><stop offset="1" stop-color="#0e0a08"/></linearGradient>
  <linearGradient id="bbb${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2420"/><stop offset="1" stop-color="#0a0806"/></linearGradient>
  <radialGradient id="bbg${u}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe0a0"/><stop offset=".4" stop-color="#ff8a2a" stop-opacity=".6"/><stop offset="1" stop-color="#ff6a1a" stop-opacity="0"/></radialGradient></defs>
  <path d="M-34 42q2 -22 16 -28q10 -4 18 -4t18 4q14 6 16 28z" fill="url(#bbc${u})" stroke="#050403" stroke-width=".7"/>
  <path d="M-10 12l-8 30M10 12l8 30" stroke="#5a1a12" stroke-width="3"/><path d="M-26 20L20 42" stroke="#3a2414" stroke-width="4"/><path d="M-26 20L20 42" stroke="#6a4424" stroke-width=".8"/>
  ${[[-12, 30], [14, 34]].map(([x, y]) => `<path d="M${x - 2} ${y}h4v7h-4z" fill="url(#oakH${u})"/><path d="M${x} ${y}l-1 -6" stroke="url(#iron${u})" stroke-width="1.6"/>`).join('')}
  <path d="M-7 4v8h14v-8z" fill="url(#bbs${u})"/>
  <path d="M-12 -14q0 -14 12 -14t12 14q0 10 -4 16h-16q-4 -6 -4 -16z" fill="url(#bbs${u})" stroke="#4a2a18" stroke-width=".5"/>
  <path d="M-9 -12q3 -2 6 0M3 -12q3 -2 6 0" stroke="#1a0f08" stroke-width="1.6" fill="none"/>
  <ellipse cx="-5" cy="-9" rx="1.8" ry="1.2" fill="#f4e8d0"/><ellipse cx="5" cy="-9" rx="1.8" ry="1.2" fill="#f4e8d0"/><circle cx="-4.6" cy="-9" r=".9" fill="#1a0806"/><circle cx="5.4" cy="-9" r=".9" fill="#1a0806"/><circle cx="-4.2" cy="-9.4" r=".3" fill="#fff"/><circle cx="5.8" cy="-9.4" r=".3" fill="#fff"/>
  <path d="M0 -8l-1.6 6h3" stroke="#6a3a22" stroke-width=".7" fill="none"/>
  <path d="M-12 -6q-2 10 2 22q4 14 10 20q6 -6 10 -20q4 -12 2 -22q-3 6 -7 6q-3 -2 -5 -2t-5 2q-4 0 -7 -6z" fill="url(#bbb${u})"/>
  ${[-8, -4, 0, 4, 8].map((x, k) => `<path d="M${x} -2q${(k - 2)} 12 ${(k - 2) * 1.4} ${20 + (k % 2) * 6}" stroke="#4a3e34" stroke-width=".5" fill="none" opacity=".8"/>`).join('')}
  <path d="M-5 -1q5 2 10 0" stroke="#5a2a1a" stroke-width="1" fill="none"/>
  ${[[-6, 14], [6, 16], [0, 26]].map(([x, y]) => `<rect x="${x - 1.4}" y="${y}" width="2.8" height="3" fill="#7a1a12"/>`).join('')}
  ${[[-13, -2, -24, -4], [13, -2, 24, -6], [-9, 8, -20, 12], [9, 8, 22, 10]].map(([x1, y1, x2, y2]) => `<path d="M${x1} ${y1}Q${(x1 + x2) / 2} ${y1 - 4} ${x2} ${y2}" stroke="#8a7a5a" stroke-width="1" fill="none"/><circle cx="${x2}" cy="${y2}" r="5" fill="url(#bbg${u})"/><circle cx="${x2}" cy="${y2}" r="1" fill="#fff0c0"/>
    <path d="M${x2} ${y2 - 1}q-3 -6 1 -12q3 -6 -1 -12" stroke="#c8c0b4" stroke-width="2" fill="none" opacity=".35" stroke-linecap="round"/>`).join('')}
  <path d="M-11 -18q0 -14 11 -14t11 14z" fill="#16100c"/>
  <path d="M-26 -16q12 -9 26 -8q14 -1 26 8q-6 3 -12 0q-6 -6 -14 -6t-14 6q-6 3 -12 0z" fill="#1e1612" stroke="#050403" stroke-width=".6"/><path d="M-22 -15q11 -7 22 -6q11 -1 22 6" stroke="#4a3a2e" stroke-width=".5" fill="none"/>
  <g transform="translate(0 -24) scale(.6)"><path d="M-6 -2q6 -6 12 0q-2 6 -6 7q-4 -1 -6 -7z" fill="#e8e0cc"/><circle cx="-2" cy="-1" r="1" fill="#16100c"/><circle cx="2" cy="-1" r="1" fill="#16100c"/><path d="M-7 5l14 -4M-7 1l14 4" stroke="#e8e0cc" stroke-width="1.2"/></g>`;

// ---- water, light and props, fourth pass
const rnd4 = s => () => (s = (s * 9301 + 49297) % 233280) / 233280;
module.exports.splash = u => { const r = rnd4(11); return `<defs><linearGradient id="spg${u}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#bfe6ea" stop-opacity=".9"/><stop offset=".5" stop-color="#f2fcfc" stop-opacity=".95"/><stop offset="1" stop-color="#ffffff" stop-opacity=".2"/></linearGradient>
  <filter id="spb${u}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.6"/></filter></defs>
  <ellipse cx="0" cy="8" rx="30" ry="5" fill="#e6f6f8" opacity=".35" filter="url(#spb${u})"/>
  <ellipse cx="0" cy="8" rx="22" ry="3.4" fill="none" stroke="#ffffff" stroke-width=".9" opacity=".65"/><ellipse cx="0" cy="8.4" rx="28" ry="4.4" fill="none" stroke="#ffffff" stroke-width=".5" opacity=".4"/>
  <ellipse cx="0" cy="-6" rx="16" ry="14" fill="#ffffff" opacity=".25" filter="url(#spb${u})"/>
  <path d="M-12 8q-3 -10 -10 -18q6 3 9 2q-2 -12 1 -22q3 9 6 11q1 -10 6 -17q1 11 -1 18q4 -5 9 -6q-2 7 -5 12q5 -3 11 -2q-6 5 -9 13q4 0 8 2q-6 3 -10 7z" fill="url(#spg${u})" stroke="#ffffff" stroke-width=".4" stroke-opacity=".6"/>
  <path d="M-6 6q-1 -10 0 -24M2 6q1 -12 4 -24M-1 6q-1 -8 1 -16" stroke="#ffffff" stroke-width=".6" opacity=".7" fill="none"/>
  ${Array.from({ length: 26 }, () => { const a = -Math.PI * (.12 + r() * .76), d = 14 + r() * 18; return `<circle cx="${(Math.cos(a) * d).toFixed(1)}" cy="${(Math.sin(a) * d * 1.1 - 4).toFixed(1)}" r="${(.4 + r() * 1).toFixed(2)}" fill="#f6ffff" opacity="${(.5 + r() * .5).toFixed(2)}"/>`; }).join('')}`; };

module.exports.tentacle = u => { // tapered, curling, suckers on the inner side
  const C = [[0, 46], [-4, 32], [-7, 18], [-5, 4], [0, -8], [8, -18], [17, -22], [25, -19], [28, -11], [25, -4], [19, -3], [16, -7], [17, -12], [21, -13]];
  const cr = (p0, p1, p2, p3, t) => [0, 1].map(j => .5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t * t + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t * t * t));
  const pts = []; for (let k = 0; k < C.length - 1; k++) for (let t = 0; t < 1; t += .2) pts.push(cr(C[Math.max(k - 1, 0)], C[k], C[k + 1], C[Math.min(k + 2, C.length - 1)], t)); pts.push(C[C.length - 1]);
  const N = pts.length, L = [], Rr = [], suck = [];
  pts.forEach((p, k) => { const q = pts[Math.min(k + 1, N - 1)], o = pts[Math.max(k - 1, 0)]; let dx = q[0] - o[0], dy = q[1] - o[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const w = 7.5 * Math.pow(1 - k / N, .85) + .6; L.push([p[0] - dy * w, p[1] + dx * w]); Rr.push([p[0] + dy * w, p[1] - dx * w]);
    if (k % 2 === 0 && k > 2 && k < N - 3) suck.push([p[0] + dy * w * .55, p[1] - dx * w * .55, w * .32]); });
  const path = 'M' + L.map(p => p.map(v => v.toFixed(1)).join(' ')).join('L') + 'L' + Rr.reverse().map(p => p.map(v => v.toFixed(1)).join(' ')).join('L') + 'z';
  const hl = 'M' + L.slice(2, N - 4).map(p => p.map(v => (v + .8).toFixed(1)).join(' ')).join('L');
  return `<defs><linearGradient id="tng${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1e4a40"/><stop offset=".45" stop-color="#4f8a74"/><stop offset="1" stop-color="#7aa88a"/></linearGradient>
    <linearGradient id="tnw${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#0e3a40" stop-opacity=".55"/></linearGradient></defs>
    <path d="${path}" fill="url(#tng${u})" stroke="#0c2620" stroke-width=".8"/>
    <path d="${hl}" stroke="#c8f0d8" stroke-width=".9" fill="none" opacity=".45"/>
    ${suck.map(([x, y, r]) => `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${r.toFixed(2)}" ry="${(r * .8).toFixed(2)}" fill="#e8c4b4" stroke="#8a5a4a" stroke-width=".35"/><ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(r * .45).toFixed(2)}" ry="${(r * .35).toFixed(2)}" fill="#9a6a5a"/>`).join('')}
    <clipPath id="tnc${u}"><path d="${path}"/></clipPath><rect x="-30" y="28" width="60" height="22" fill="url(#tnw${u})" clip-path="url(#tnc${u})"/>
    <path d="M-18 44q8 -3 18 -1t18 1" stroke="#ffffff" stroke-width="1.2" fill="none" opacity=".8"/><ellipse cx="-2" cy="45" rx="20" ry="3" fill="#f0fbfb" opacity=".35"/>
    ${Array.from({ length: 10 }, (_, k) => `<circle cx="${-14 + k * 3}" cy="${40 - (k % 3) * 3 - (k % 2) * 2}" r="${.5 + (k % 3) * .3}" fill="#f6ffff" opacity=".8"/>`).join('')}`; };

module.exports.candleTall = u => `<defs><linearGradient id="cdw${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d8c8a6"/><stop offset=".35" stop-color="#fbf2dc"/><stop offset="1" stop-color="#bfae8a"/></linearGradient></defs>
  <ellipse cx="0" cy="21" rx="12" ry="2.6" fill="#120a04" opacity=".35"/>
  <circle cx="0" cy="-14" r="16" fill="url(#glow${u})"/>
  <path d="M-9 19q0 -2.6 9 -2.6t9 2.6q0 2 -9 2t-9 -2z" fill="url(#brass${u})" stroke="#5a4010" stroke-width=".4"/><path d="M-2 17v-4h4v4z" fill="url(#brass${u})"/><path d="M-6 13q0 -2 6 -2t6 2q0 1.4 -6 1.4t-6 -1.4z" fill="url(#brass${u})" stroke="#5a4010" stroke-width=".4"/>
  <path d="M-4 12v-18h8v18z" fill="url(#cdw${u})"/><path d="M-4 -6q1 5 -.4 9q-.6 3 .4 5" stroke="#efe2c4" stroke-width="1.4" fill="none"/><path d="M-4 -6q4 -1.4 8 0" stroke="#fff6e0" stroke-width=".6"/>
  <path d="M0 -6v-3" stroke="#2a1a0a" stroke-width=".7"/><path d="M0 -19q4.2 5 0 10.4q-4.2 -5.4 0 -10.4z" fill="#ffb02a"/><path d="M0 -16.4q2 2.6 0 5.6q-2 -3 0 -5.6z" fill="#fff4c4"/><ellipse cx="0" cy="-9.6" rx=".9" ry="1.2" fill="#4a7ad0" opacity=".6"/>`;

module.exports.maelstrom = u => { const arms = []; for (let a = 0; a < 6; a++) { let d = ''; for (let k = 0; k <= 60; k++) { const t = k / 60, ang = a * Math.PI / 3 + t * 5.2, rr = 96 * Math.pow(1 - t, 1.25) + 4; d += (k ? 'L' : 'M') + (Math.cos(ang) * rr).toFixed(1) + ' ' + (Math.sin(ang) * rr * .3).toFixed(1); } arms.push(d); }
  return `<defs><radialGradient id="mlg${u}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#020608"/><stop offset=".12" stop-color="#06161c"/><stop offset=".45" stop-color="#1a3a44"/><stop offset=".85" stop-color="#3a5a62" stop-opacity=".7"/><stop offset="1" stop-color="#4a6068" stop-opacity="0"/></radialGradient></defs>
    <ellipse rx="104" ry="32" fill="url(#mlg${u})"/>
    ${arms.map((d, k) => `<path d="${d}" stroke="#e8f6f6" stroke-width="${k % 2 ? 1.6 : 1}" fill="none" opacity="${k % 2 ? .75 : .45}" stroke-linecap="round"/>`).join('')}
    ${arms.map((d, k) => `<path d="${d}" stroke="#0a1a20" stroke-width="2.4" fill="none" opacity=".3" transform="rotate(14) scale(.96)"/>`).join('')}
    <ellipse rx="10" ry="3" fill="#000" opacity=".9"/><ellipse rx="14" ry="4.2" fill="none" stroke="#9ab8c0" stroke-width=".6" opacity=".6"/>
    ${Array.from({ length: 24 }, (_, k) => { const ang = k * .7, rr = 30 + (k * 13) % 60; return `<circle cx="${(Math.cos(ang) * rr).toFixed(1)}" cy="${(Math.sin(ang) * rr * .3 - 2).toFixed(1)}" r="${(.4 + (k % 3) * .3).toFixed(1)}" fill="#f4ffff" opacity=".7"/>`; }).join('')}`; };

module.exports.fireship = u => { const f = 'fs' + u; const R = rnd4(5);
  const tongues = (n, x0, x1, base, hMin, hMax) => Array.from({ length: n }, (_, k) => { const x = x0 + (x1 - x0) * (k + .5) / n + (R() - .5) * 4, h = hMin + R() * (hMax - hMin), w = 3 + R() * 4, lean = (R() - .3) * 6;
    return `M${(x - w).toFixed(1)} ${base}C${(x - w).toFixed(1)} ${(base - h * .5).toFixed(1)} ${(x + lean - 1).toFixed(1)} ${(base - h * .7).toFixed(1)} ${(x + lean).toFixed(1)} ${(base - h).toFixed(1)}C${(x + lean + 1).toFixed(1)} ${(base - h * .6).toFixed(1)} ${(x + w).toFixed(1)} ${(base - h * .4).toFixed(1)} ${(x + w).toFixed(1)} ${base}z`; }).join('');
  return `<defs><filter id="${f}" x="-40%" y="-60%" width="180%" height="200%"><feTurbulence type="fractalNoise" baseFrequency=".06 .1" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G"/></filter>
  <filter id="${f}s" x="-60%" y="-60%" width="220%" height="220%"><feTurbulence type="fractalNoise" baseFrequency=".04" numOctaves="3" seed="9" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="16" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation="2.6"/></filter>
  <linearGradient id="${f}o" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#d0400e"/><stop offset=".45" stop-color="#ff8a2a"/><stop offset=".85" stop-color="#ffc85a" stop-opacity=".85"/><stop offset="1" stop-color="#fff0a0" stop-opacity="0"/></linearGradient>
  <linearGradient id="${f}i" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffd070"/><stop offset=".7" stop-color="#fff4c0"/><stop offset="1" stop-color="#fff8e0" stop-opacity="0"/></linearGradient>
  <linearGradient id="${f}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a2c18"/><stop offset=".5" stop-color="#2a180c"/><stop offset="1" stop-color="#0e0804"/></linearGradient></defs>
  <g filter="url(#${f}s)" opacity=".8"><path d="M-12 -30q-24 -8 -30 -30q-4 -18 10 -26q16 -4 18 10q10 -18 26 -8q12 12 0 26q-6 18 -24 28z" fill="#2a2420"/><path d="M-8 -42q-14 -16 -6 -32q12 -8 20 6q6 16 -14 26z" fill="#4a3e36"/><path d="M-30 -60q-10 -12 -2 -22q10 -2 12 8z" fill="#5a4e46"/></g>
  <circle cx="0" cy="-10" r="40" fill="url(#glow${u})"/>
  <path d="M-14 -4l-1 -40M10 -4l1 -36" stroke="#140a06" stroke-width="2.2"/><path d="M-26 -30h24M-4 -26h26" stroke="#140a06" stroke-width="1.3"/><path d="M-14 -44L-34 -4M-14 -44L14 -4M10 -40L30 -4" stroke="#1a0e08" stroke-width=".5"/>
  <path d="M-24 -29q4 6 2 14l18 -2q-2 -6 0 -13z" fill="#5a3c26" opacity=".85"/><path d="M-2 -25q3 7 1 14l18 -1q-2 -7 0 -14z" fill="#5a3c26" opacity=".7"/>
  <g filter="url(#${f})"><path d="${tongues(9, -32, 30, -2, 14, 34)}" fill="url(#${f}o)"/><path d="${tongues(7, -26, 24, -2, 8, 20)}" fill="url(#${f}i)" opacity=".9"/></g>
  <path d="M-38 -7q2 6 8 12h56q8 -6 10 -14q-10 3 -38 3t-36 -1z" fill="url(#${f}h)" stroke="#060302" stroke-width=".6"/><path d="M-37 -6q10 1.4 37 1.4t36 -2.4" stroke="#ff9a3a" stroke-width=".8" fill="none" opacity=".7"/>${[-22, -10, 2, 14].map(x => `<rect x="${x}" y="-1" width="4" height="3" rx=".6" fill="#ffb24a" opacity=".9"/>`).join('')}
  <ellipse cx="0" cy="6" rx="44" ry="2.6" fill="#ff9a3a" opacity=".4"/>${[-30, -14, 4, 20].map((x, k) => `<path d="M${x} ${8 + (k % 2) * 3}h${8 + k}" stroke="#ffb050" stroke-width=".8" opacity=".65"/>`).join('')}`; };

// Jack's hinged pocket compass: dark wooden case, open lid, rose on aged paper, needle that ignores north
module.exports.compassJack = u => { const g = 'cj' + u;
  const pt = (r, a) => [(Math.sin(a) * r).toFixed(2), (-Math.cos(a) * r).toFixed(2)];
  const star = (n, r, w, off, c1, c2) => Array.from({ length: n }, (_, k) => { const a = off + k * 2 * Math.PI / n, [tx, ty] = pt(r, a), [lx, ly] = pt(w, a - Math.PI / n), [rx, ry] = pt(w, a + Math.PI / n);
    return `<path d="M0 0L${lx} ${ly}L${tx} ${ty}z" fill="${c1}"/><path d="M0 0L${rx} ${ry}L${tx} ${ty}z" fill="${c2}"/>`; }).join('');
  return `<defs><radialGradient id="${g}w" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#6a4426"/><stop offset=".7" stop-color="#3a2212"/><stop offset="1" stop-color="#1a0e06"/></radialGradient>
    <radialGradient id="${g}d" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#f6ead0"/><stop offset=".75" stop-color="#e2cc9a"/><stop offset="1" stop-color="#a8844e"/></radialGradient>
    <radialGradient id="${g}l" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#4a2e18"/><stop offset="1" stop-color="#1e1008"/></radialGradient></defs>
  <ellipse cx="2" cy="14" rx="32" ry="6" fill="#120806" opacity=".5" filter="url(#soft${u})"/>
  <path d="M30 2q12 4 14 12q2 8 -8 10" stroke="#3a2010" stroke-width="1.6" fill="none"/><path d="M30 2q12 4 14 12q2 8 -8 10" stroke="#7a5030" stroke-width=".5" fill="none" stroke-dasharray="1.2 1"/><circle cx="39" cy="7" r="1.5" fill="#c9a048" stroke="#1a0e06" stroke-width=".3"/><circle cx="42.6" cy="12" r="1.5" fill="#a8302a" stroke="#1a0e06" stroke-width=".3"/><circle cx="43.6" cy="17" r="1.5" fill="#2f6e64" stroke="#1a0e06" stroke-width=".3"/><circle cx="41" cy="21.4" r="1.5" fill="#e8e0c8" stroke="#1a0e06" stroke-width=".3"/><path d="M36 24l-2 4 3 1z" fill="url(#brass${u})"/>
  <ellipse cx="0" cy="-31" rx="25" ry="17" fill="url(#${g}w)" stroke="#120806" stroke-width=".6"/><ellipse cx="0" cy="-31" rx="22.6" ry="15" fill="url(#${g}l)" stroke="url(#brass${u})" stroke-width="1.4"/>
  ${[17, 12, 7].map(r => `<ellipse cx="0" cy="-31" rx="${r}" ry="${r * .66}" fill="none" stroke="#8a6a3a" stroke-width=".5" opacity=".7"/>`).join('')}
  <g transform="translate(0 -31) scale(1 .66)">${star(8, 7, 2.2, 0, '#9a7a44', '#6a4a24')}</g><path d="M-14 -40q10 -6 22 -2" stroke="#e8c88a" stroke-width=".6" fill="none" opacity=".45"/><path d="M-18 -26l6 -2M10 -22l5 -3M-6 -20l3 1" stroke="#c8a870" stroke-width=".3" opacity=".6"/>
  <rect x="-6" y="-16.6" width="12" height="3.4" rx="1.6" fill="url(#brass${u})" stroke="#5a4010" stroke-width=".4"/><path d="M-6 -15h12" stroke="#5a4010" stroke-width=".4"/>
  <path d="M-26 0v6q0 13 26 13t26 -13v-6" fill="url(#${g}w)" stroke="#120806" stroke-width=".6"/><path d="M-25 6q0 11 25 11" stroke="#8a5a34" stroke-width=".6" fill="none" opacity=".7"/>
  <ellipse cx="0" cy="0" rx="26" ry="14" fill="url(#${g}w)" stroke="#120806" stroke-width=".6"/><ellipse cx="0" cy="0" rx="23.4" ry="12.4" fill="url(#brassR${u})" stroke="#5a4010" stroke-width=".5"/>
  <g transform="scale(1 .53)"><circle r="21.6" fill="url(#${g}d)" stroke="#6a4a24" stroke-width=".6"/>
    ${Array.from({ length: 64 }, (_, k) => { const [a1, b1] = pt(21.4, k * Math.PI / 32), [a2, b2] = pt(k % 4 ? 20.2 : 19, k * Math.PI / 32); return `<path d="M${a1} ${b1}L${a2} ${b2}" stroke="#5a3a1a" stroke-width="${k % 4 ? .3 : .6}"/>`; }).join('')}
    <circle r="18.4" fill="none" stroke="#5a3a1a" stroke-width=".4"/>
    ${star(8, 9, 2, Math.PI / 8, '#a8302a', '#6a1a12')}${star(4, 16, 3, 0, '#2a1a0e', '#c8a870')}<circle r="2.6" fill="none" stroke="#5a3a1a" stroke-width=".4"/>
    <path d="M0 -18.6q-1.6 -1.4 -1 -3q.6 1 1 1q.4 0 1 -1q.6 1.6 -1 3z" fill="#a8302a"/>
    <circle r="17" fill="#ffd870" opacity=".14"/><g transform="rotate(-98)"><path d="M0 -19L2.4 0L0 3.4L-2.4 0z" fill="#1e2a3a" stroke="#05080e" stroke-width=".3"/><path d="M0 -19L2.4 0L0 0z" fill="#7a8aa0"/><path d="M0 -17.4L.6 -6" stroke="#dfe8f0" stroke-width=".5"/><path d="M0 3.4L1.6 9L0 13.4L-1.6 9z" fill="#c8402e" stroke="#5a1410" stroke-width=".3"/><circle cx="0" cy="-19.6" r="1.2" fill="#ffd870"/></g>
    <circle r="1.4" fill="url(#brass${u})" stroke="#5a4010" stroke-width=".3"/></g>
  <path d="M-16 -6q6 -5 16 -5.4" stroke="#ffffff" stroke-width="1.2" fill="none" opacity=".45"/><path d="M6 6q7 -1 12 -5" stroke="#ffffff" stroke-width=".6" fill="none" opacity=".35"/>
  <path d="M-3 13.4h6l-1 3h-4z" fill="url(#brass${u})" stroke="#5a4010" stroke-width=".4"/>`; };

module.exports.capuchin = u => { const g = 'cp' + u; return `<defs><radialGradient id="${g}f" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#9a6a40"/><stop offset=".7" stop-color="#5a3a1e"/><stop offset="1" stop-color="#3a2410"/></radialGradient>
    <radialGradient id="${g}m" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#f6e2c4"/><stop offset="1" stop-color="#c8a07a"/></radialGradient>
    <linearGradient id="${g}r" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6a140e"/><stop offset=".45" stop-color="#c0362a"/><stop offset="1" stop-color="#5a100a"/></linearGradient></defs>
  <ellipse cx="2" cy="32" rx="22" ry="3.6" fill="#120806" opacity=".45"/>
  <path d="M9 22q22 6 22 -14q0 -12 8 -16q4 -2 5 2" stroke="#3a2410" stroke-width="4.2" fill="none" stroke-linecap="round"/><path d="M9 22q22 6 22 -14q0 -12 8 -16q4 -2 5 2" stroke="url(#${g}f)" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M-10 14q-6 9 -4 17h8l-1 -3q3 -6 1 -13z" fill="url(#${g}f)" stroke="#2a1608" stroke-width=".5"/><path d="M10 14q6 9 4 17h-8l1 -3q-3 -6 -1 -13z" fill="url(#${g}f)" stroke="#2a1608" stroke-width=".5"/>
  <ellipse cx="-11" cy="31" rx="4.6" ry="1.8" fill="#2a1608"/><ellipse cx="11" cy="31" rx="4.6" ry="1.8" fill="#2a1608"/>
  <path d="M10 -4q7 6 6 16" stroke="url(#${g}f)" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M10 -4q5 3 6 7" stroke="url(#${g}r)" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M14 3l3 1" stroke="#efe6d2" stroke-width="1.6"/><ellipse cx="16.4" cy="13" rx="2.4" ry="2" fill="#4a2c16"/>
  <path d="M-12 -6q11 -5 24 0l2.6 22q-14.6 4.4 -29.2 0z" fill="url(#${g}r)" stroke="#3a0a06" stroke-width=".6"/><path d="M-13 15l-2 6 5 -2zM13 15l2 6 -5 -2z" fill="#8a1e14"/>
  <path d="M-4 -6l4 9 4 -9z" fill="#efe6d2"/><path d="M-5 -6l5 11 5 -11" fill="none" stroke="#c9a048" stroke-width=".8"/>${[2, 7, 12].map(y => `<circle cx="-4.6" cy="${y}" r=".9" fill="url(#brass${u})"/><circle cx="4.6" cy="${y}" r=".9" fill="url(#brass${u})"/>`).join('')}
  <path d="M-12 -4q-6 0 -8 -3q-3 -4 -6 -9" stroke="url(#${g}f)" stroke-width="3.6" fill="none" stroke-linecap="round"/><path d="M-11 -4q-5 0 -8 -3" stroke="url(#${g}r)" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M-18.6 -7.6l1.6 -2.4" stroke="#efe6d2" stroke-width="1.6"/>
  <path d="M-24 -14q-3 -1 -3 -4q1 -2 3 -1q2 0 2 3z" fill="#4a2c16"/>
  <circle cx="-9.6" cy="-17" r="3.8" fill="url(#${g}f)"/><circle cx="9.6" cy="-17" r="3.8" fill="url(#${g}f)"/><circle cx="-9.6" cy="-17" r="2" fill="#c89a7a"/><circle cx="9.6" cy="-17" r="2" fill="#c89a7a"/>
  <circle cx="0" cy="-17" r="9.4" fill="url(#${g}f)" stroke="#2a1608" stroke-width=".5"/>
  <path d="M-6.6 -19q0 -5 6.6 -5t6.6 5q0 7 -3 10q-1.6 1.6 -3.6 1.6t-3.6 -1.6q-3 -3 -3 -10z" fill="url(#${g}m)"/>
  <path d="M-8 -21q2 -6 8 -6.4t8 6.4q-4 -3 -8 -3t-8 3z" fill="#2a1608"/>
  <ellipse cx="-2.8" cy="-17.6" rx="1.7" ry="1.9" fill="#1a0e06"/><ellipse cx="2.8" cy="-17.6" rx="1.7" ry="1.9" fill="#1a0e06"/><circle cx="-2.3" cy="-18.3" r=".6" fill="#fff"/><circle cx="3.3" cy="-18.3" r=".6" fill="#fff"/>
  <path d="M-4.6 -20.4q1.8 -1 3.2 0M1.4 -20.4q1.8 -1 3.2 0" stroke="#5a3a1e" stroke-width=".5" fill="none"/>
  <ellipse cx="0" cy="-12.6" rx="3.4" ry="2.4" fill="#e8c8a4"/><path d="M-.9 -13.6h1.8" stroke="#3a2010" stroke-width=".8" stroke-linecap="round"/><path d="M-1.8 -11.2q1.8 1 3.6 0" stroke="#5a2a1a" stroke-width=".5" fill="none"/>`; };

const clawOne = (u, g) => `<path d="M-16 3q-3 -7 4 -9.4q9 -3 15 .4l2.4 4.4q-8.4 2 -15 6.6q-4 0 -6.4 -2z" fill="url(#${g})" stroke="#3a0e06" stroke-width=".5"/>
  <path d="M3 -6q10 -7 17.6 -2.4q-1.4 1 -3.4 .6q-6 -.6 -13 5.4z" fill="url(#${g})" stroke="#3a0e06" stroke-width=".5"/><path d="M4.6 -1.2q10 4 14.4 -.4q-2 -.4 -4 0q-5 -.4 -10.4 -3z" fill="url(#${g})" stroke="#3a0e06" stroke-width=".5"/>
  <path d="M6 -4.4l2 1M10 -5.4l1.6 1.6M14 -5.6l1 1.6M8 -.6l1.4 -1.2M12 0l1 -1.4" stroke="#f0d0a0" stroke-width=".5"/>
  ${[[-10, -3], [-6, -4.4], [-12, 0], [-2, -4]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".7" fill="#f6b08a" opacity=".8"/>`).join('')}<path d="M-14 -3q6 -4 14 -3" stroke="#ffd0b0" stroke-width=".6" fill="none" opacity=".6"/>`;
module.exports.crabclaws = u => { const g = 'ck' + u; return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8683a"/><stop offset=".55" stop-color="#a82a14"/><stop offset="1" stop-color="#5a1206"/></linearGradient></defs>
  ${[[-26, 4, -12, 1], [-4, 8, 160, .9], [18, 2, 24, 1.05], [36, 9, 190, .8]].map(([x, y, r, s]) => `<ellipse cx="${x}" cy="${y + 4}" rx="${14 * s}" ry="${2 * s}" fill="#120806" opacity=".45"/><g transform="translate(${x} ${y}) rotate(${r}) scale(${s})" filter="url(#drop${u})">${clawOne(u, g)}</g>`).join('')}
  <g transform="translate(56 6) scale(.55)" filter="url(#drop${u})"><ellipse cx="0" cy="8" rx="16" ry="2.6" fill="#120806" opacity=".5"/>${[-1, 1].map(sd => [0, 1, 2].map(k => `<path d="M${sd * 8} ${-1 + k * 2.4}q${sd * 7} ${-3 + k * 2} ${sd * 11} ${4 + k * 1.6}" stroke="#8a2a14" stroke-width="1.6" fill="none" stroke-linecap="round"/>`).join('')).join('')}
    <ellipse cx="0" cy="0" rx="10" ry="7" fill="url(#${g})" stroke="#3a0e06" stroke-width=".6"/><path d="M-6 -3q6 -3 12 0" stroke="#ffb08a" stroke-width=".8" fill="none" opacity=".7"/>
    <path d="M-3 -6v-4M3 -6v-4" stroke="#8a2a14" stroke-width="1"/><circle cx="-3" cy="-10.4" r="1.3" fill="#1a0806"/><circle cx="3" cy="-10.4" r="1.3" fill="#1a0806"/>
    <g transform="translate(-12 -6) rotate(-30) scale(.5)">${clawOne(u, g)}</g><g transform="translate(12 -6) scale(-.5 .5) rotate(-30)">${clawOne(u, g)}</g></g>`; };

// flintlock pistol lying on its side, muzzle to the right
module.exports.pistol = u => `<defs><linearGradient id="pb${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a9298"/><stop offset=".35" stop-color="#dfe6ea"/><stop offset=".6" stop-color="#5a6268"/><stop offset="1" stop-color="#2a3034"/></linearGradient>
  <linearGradient id="pw${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a5e30"/><stop offset=".5" stop-color="#6a3a1a"/><stop offset="1" stop-color="#3a1e0a"/></linearGradient></defs>
  <ellipse cx="0" cy="22" rx="40" ry="3.6" fill="#120806" opacity=".45" filter="url(#soft${u})"/>
  <path d="M-2 1L26 1L26 6.4L-2 6.6Q-9 6 -15 9Q-21 14 -24 23Q-27 27 -32 26Q-38 24 -37 17Q-35 8 -28 2Q-22 -3 -14 -3.4L-2 -3.4z" fill="url(#pw${u})" stroke="#2a1406" stroke-width=".6"/>
  <path d="M-30 4Q-24 -1 -14 -1.6" stroke="#c88a54" stroke-width=".8" fill="none" opacity=".7"/><path d="M-25 18q2 -6 6 -9" stroke="#2a1406" stroke-width=".5" fill="none"/>
  <path d="M-37.4 17Q-38 24 -32 26.2Q-27 27.4 -24 23l-2 -1.4q-2.6 3 -6 2.2q-4 -1 -4 -6.4z" fill="url(#brass${u})" stroke="#5a4010" stroke-width=".4"/>
  <rect x="-4" y="-4.4" width="40" height="5.8" rx="1" fill="url(#pb${u})" stroke="#1e2226" stroke-width=".5"/><path d="M-3 -2.4h38" stroke="#ffffff" stroke-width=".5" opacity=".6"/>
  <rect x="34.4" y="-5.2" width="3.2" height="7.4" rx=".8" fill="url(#pb${u})" stroke="#1e2226" stroke-width=".4"/><path d="M31 -4.4l1 -1.8h1.4l.4 1.8z" fill="#5a6268"/>
  ${[6, 16].map(x => `<rect x="${x}" y="4.8" width="2.6" height="2.6" fill="url(#brass${u})"/>`).join('')}<path d="M0 5.4h30" stroke="#c89a62" stroke-width="1" opacity=".9"/><rect x="29.6" y="4.6" width="2" height="1.8" fill="url(#brass${u})"/>
  <path d="M-18 -2.4h15v6.6h-15q-2.4 -3.3 0 -6.6z" fill="url(#pb${u})" stroke="#1e2226" stroke-width=".4"/><circle cx="-12" cy="1" r=".6" fill="#2a3034"/><circle cx="-7" cy="1" r=".6" fill="#2a3034"/>
  <path d="M-5 -2.6v-6.4q2 -1.2 3 .6v5.8z" fill="url(#pb${u})" stroke="#1e2226" stroke-width=".4"/>
  <path d="M-15 -1.6q-3 -4 -1 -8.6l1.6 -.6q1.6 2 3.6 1.2l1 1.4q-2.6 1.8 -3.2 4.6q.2 1.4 1.2 2z" fill="url(#pb${u})" stroke="#1e2226" stroke-width=".4"/><path d="M-13.6 -9.6h3.4v1.6h-3.4z" fill="#3a3a30"/>
  <path d="M-15 6.4q1 7 7.4 7q5 0 6 -6.6" stroke="url(#brass${u})" stroke-width="1.4" fill="none"/><path d="M-8.6 6.4q1.2 2.4 -.4 4.6" stroke="#2a3034" stroke-width="1.1" fill="none" stroke-linecap="round"/>
  <ellipse cx="-22" cy="7" rx="2.6" ry="1.6" fill="url(#brass${u})" transform="rotate(-30 -22 7)"/>`;

// canvas bag of grapeshot, tied at the neck, sitting on the deck
module.exports.grapebag = u => `<defs><radialGradient id="gb${u}" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#f2e8d0"/><stop offset=".6" stop-color="#cdbb94"/><stop offset="1" stop-color="#8a7650"/></radialGradient></defs>
  <ellipse cx="2" cy="17" rx="26" ry="3.6" fill="#120806" opacity=".5" filter="url(#soft${u})"/>
  <path d="M-16 16q-6 -12 2 -22q4 -4 9 -5l-2 -6q5 -2 9 0l-1 6q6 1 10 5q8 10 2 22q-14 3 -29 0z" fill="url(#gb${u})" stroke="#5a4a30" stroke-width=".6"/>
  ${[[-8, -2], [0, -4], [8, -1], [-11, 7], [-2, 6], [7, 8], [12, 3], [-5, 12], [4, 13]].map(([x, y]) => `<path d="M${x - 3.4} ${y + 1.4}a3.6 3.2 0 0 1 6.8 0" stroke="#8a7650" stroke-width=".5" fill="none"/><path d="M${x - 2} ${y - .6}q1.6 -1.2 3 -.2" stroke="#ffffff" stroke-width=".4" fill="none" opacity=".6"/>`).join('')}
  <path d="M-6 -11q6 2.4 12 0" stroke="#6a4a24" stroke-width="1.6" fill="none"/><path d="M-6 -11q6 2.4 12 0" stroke="#c8a46a" stroke-width=".6" fill="none" stroke-dasharray="1.2 1"/><path d="M5 -10q4 3 2 7M5 -10q6 0 7 4" stroke="#8a6a3a" stroke-width=".8" fill="none"/>
  <path d="M-3 -17q3 -2 6 0" stroke="#8a7650" stroke-width=".6" fill="none"/>
  ${[[22, 14, 3.4], [29, 15.6, 3], [18, 16.4, 2.6], [-24, 15.4, 3]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#ball${u})"/><circle cx="${x - r * .35}" cy="${y - r * .4}" r="${r * .3}" fill="#c8ccd0" opacity=".6"/>`).join('')}`;

// sealed order of the Company: parchment, heading, lines, signature, wax seal on ribbons
module.exports.orderScroll = u => `<ellipse cx="0" cy="26" rx="32" ry="3.6" fill="#120806" opacity=".45" filter="url(#soft${u})"/>
  <path d="M-28 -22h52q4 0 4 4v40h-52q-4 0 -4 -4z" fill="#f4e8cc" stroke="#8a6a3a" stroke-width=".7"/><path d="M-28 -22q-4 0 -4 4v40" fill="none" stroke="#c8ac78" stroke-width="1.2"/>
  <path d="M-24 -20h46v38h-46z" fill="none" stroke="#a8884e" stroke-width=".5"/>
  <text x="-1" y="-11" font-family="Alegreya SC,Georgia,serif" font-size="7.2" font-weight="700" text-anchor="middle" fill="#2a1a0a" letter-spacing=".8">ПРИКАЗ</text>
  <path d="M-14 -8h26" stroke="#8a2a1a" stroke-width=".6"/>
  ${[-3, 1, 5, 9].map((y, k) => `<path d="M-19 ${y}h${k === 3 ? 22 : 36}" stroke="#7a6a52" stroke-width=".55"/>`).join('')}
  <path d="M-18 15q4 -5 7 0t6 -2q3 -3 5 1" stroke="#1a2a5a" stroke-width=".8" fill="none"/>
  <path d="M10 14l-3 14 4 -3 2 4 1 -14zM16 14l2 13 2 -3 3 3 -3 -13z" fill="#a8302a" stroke="#5a1410" stroke-width=".4"/>
  <circle cx="14" cy="14" r="7" fill="url(#red${u})" stroke="#5a1410" stroke-width=".5"/><circle cx="14" cy="14" r="4.6" fill="none" stroke="#e08070" stroke-width=".6"/><path d="M14 10.4v7.2M10.4 14h7.2" stroke="#e08070" stroke-width=".9"/><path d="M11 11.6q2 -2 5 -1" stroke="#ffd0c0" stroke-width=".6" fill="none" opacity=".7"/>`;

// a weathered skull lying on deck planks
module.exports.skull = u => `<defs><radialGradient id="skl${u}" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#f4ecd4"/><stop offset=".6" stop-color="#cfc2a0"/><stop offset="1" stop-color="#7a6c50"/></radialGradient></defs>
  <ellipse cx="0" cy="22" rx="24" ry="4" fill="#120806" opacity=".5" filter="url(#soft${u})"/>
  <path d="M-18 4q-4 -24 18 -26q22 2 18 26q-1 6 -6 8v6h-24v-6q-5 -2 -6 -8z" fill="url(#skl${u})" stroke="#4a3e2a" stroke-width=".7"/>
  <path d="M-12 -12q8 -8 20 -4" stroke="#ffffff" stroke-width="1.2" fill="none" opacity=".5"/><path d="M4 -20l-2 5 3 3 -1 4" stroke="#6a5a40" stroke-width=".5" fill="none"/>
  <path d="M-12 2q0 -7 6 -7t6 6q-1 5 -6 5t-6 -4z" fill="#1a140c"/><path d="M12 2q0 -7 -6 -7t-6 6q1 5 6 5t6 -4z" fill="#1a140c"/>
  <circle cx="-6" cy="1" r="1.6" fill="#c8ff9a" opacity=".55"/><circle cx="6" cy="1" r="1.6" fill="#c8ff9a" opacity=".55"/>
  <path d="M0 6l-2.6 5h5.2z" fill="#1a140c"/>
  <path d="M-12 14h24v6q-12 3 -24 0z" fill="url(#skl${u})" stroke="#4a3e2a" stroke-width=".6"/>${[-9, -5.4, -1.8, 1.8, 5.4, 9].map(x => `<path d="M${x} 13.6v5.4" stroke="#4a3e2a" stroke-width=".6"/>`).join('')}
  <path d="M-18 6q-3 1 -4 4M18 6q3 1 4 4" stroke="#4a3e2a" stroke-width=".6" fill="none"/>
  <path d="M-30 18q8 -4 14 -1M20 14q8 -2 12 3" stroke="#2e6a4a" stroke-width="1.2" fill="none" opacity=".7"/>`;

// branching sea-fan coral with tapered limbs, polyps and a rock base
module.exports.coral = u => { const R = rnd4(9); const lim = [];
  const grow = (x, y, a, len, w, d) => { const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len, cx = (x + x2) / 2 + (R() - .5) * 5, cy = (y + y2) / 2 + (R() - .5) * 3;
    lim.push([x, y, cx, cy, x2, y2, w]); if (d > 0) { grow(x2, y2, a - .45 - R() * .25, len * .72, w * .7, d - 1); grow(x2, y2, a + .4 + R() * .25, len * .7, w * .7, d - 1); } };
  grow(0, 26, -Math.PI / 2, 15, 5, 3);
  const pol = lim.filter(l => l[6] < 2).map(l => `<circle cx="${l[4].toFixed(1)}" cy="${l[5].toFixed(1)}" r="${(l[6] * .9).toFixed(2)}" fill="#ffc8b0"/>`).join('');
  return `<defs><linearGradient id="crl${u}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#8a2a24"/><stop offset=".5" stop-color="#d8604a"/><stop offset="1" stop-color="#ff9a7a"/></linearGradient></defs>
    <ellipse cx="0" cy="29" rx="18" ry="3" fill="#0a1a1a" opacity=".5"/><path d="M-14 30q2 -7 9 -8q6 -3 11 1q7 1 8 7z" fill="#4a4a40" stroke="#1e1e18" stroke-width=".5"/><path d="M-9 25q5 -2 10 0" stroke="#7a7a6a" stroke-width=".6" fill="none"/>
    ${lim.map(([x, y, cx, cy, x2, y2, w]) => `<path d="M${x.toFixed(1)} ${y.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="#5a1a14" stroke-width="${(w + .9).toFixed(2)}" fill="none" stroke-linecap="round"/>`).join('')}
    ${lim.map(([x, y, cx, cy, x2, y2, w]) => `<path d="M${x.toFixed(1)} ${y.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="url(#crl${u})" stroke-width="${w.toFixed(2)}" fill="none" stroke-linecap="round"/>`).join('')}
    ${lim.map(([x, y, cx, cy, x2, y2, w]) => `<path d="M${(x - w * .25).toFixed(1)} ${y.toFixed(1)}Q${(cx - w * .25).toFixed(1)} ${cy.toFixed(1)} ${(x2 - w * .25).toFixed(1)} ${y2.toFixed(1)}" stroke="#ffd0bc" stroke-width="${(w * .25).toFixed(2)}" fill="none" stroke-linecap="round" opacity=".6"/>`).join('')}${pol}
    ${Array.from({ length: 14 }, () => { const l = lim[Math.floor(R() * lim.length)], t = R(); return `<circle cx="${(l[0] + (l[4] - l[0]) * t).toFixed(1)}" cy="${(l[1] + (l[5] - l[1]) * t).toFixed(1)}" r=".55" fill="#ffe0d0" opacity=".85"/>`; }).join('')}`; };

// living ropes: twisted three-strand hemp rising like snakes
module.exports.ropeAlive = u => { const ropes = [[-40, 40, 10, -30, 44, -40], [-32, 40, 22, -6, 36, -54], [-24, 40, 32, 8, 56, -30], [-16, 40, 46, 18, 64, -10]];
  return `<defs><linearGradient id="rpa${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2c48c"/><stop offset=".5" stop-color="#b08a52"/><stop offset="1" stop-color="#6a4a24"/></linearGradient></defs>
  <ellipse cx="-26" cy="41" rx="20" ry="3.4" fill="#120806" opacity=".45"/>
  ${ropes.map(([x0, y0, cx, cy, x1, y1]) => { const d = `M${x0} ${y0}Q${cx} ${cy + 30} ${(x0 + x1) / 2 + 8} ${(y0 + y1) / 2}T${x1} ${y1}`;
    return `<path d="${d}" stroke="#3a2410" stroke-width="4.4" fill="none" stroke-linecap="round"/><path d="${d}" stroke="url(#rpa${u})" stroke-width="3.4" fill="none" stroke-linecap="round"/>
      <path d="${d}" stroke="#5a3a18" stroke-width="3.4" fill="none" stroke-dasharray=".7 2.1" opacity=".75"/><path d="${d}" stroke="#fff0c8" stroke-width=".6" fill="none" stroke-dasharray="1.4 1.4" opacity=".7" transform="translate(-.6 -.6)"/>
      <circle cx="${x1}" cy="${y1}" r="2" fill="#c8a46a" stroke="#3a2410" stroke-width=".5"/>${[-1, 0, 1].map(k => `<path d="M${x1} ${y1}l${k * 2.4} -3.4" stroke="#c8a46a" stroke-width=".7"/>`).join('')}`; }).join('')}
  ${[0, 1, 2].map(k => `<ellipse cx="-26" cy="${40 - k * 2.2}" rx="${16 - k * 2.6}" ry="3.6" fill="none" stroke="#3a2410" stroke-width="3.6"/><ellipse cx="-26" cy="${40 - k * 2.2}" rx="${16 - k * 2.6}" ry="3.6" fill="none" stroke="url(#rpa${u})" stroke-width="2.6"/>`).join('')}`; };

// glass jar of earth: cork with twine, soil layers, a sprout, glass highlights, paper tag
module.exports.jar = u => `<defs><linearGradient id="jg${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9ac8c0" stop-opacity=".55"/><stop offset=".2" stop-color="#e8fff8" stop-opacity=".25"/><stop offset=".7" stop-color="#7aa8a0" stop-opacity=".2"/><stop offset="1" stop-color="#4a7a72" stop-opacity=".6"/></linearGradient>
  <linearGradient id="js${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a4a2a"/><stop offset=".4" stop-color="#4a3018"/><stop offset="1" stop-color="#2a1a0a"/></linearGradient>
  <linearGradient id="jc${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a6a40"/><stop offset=".4" stop-color="#d8b680"/><stop offset="1" stop-color="#7a5a30"/></linearGradient></defs>
  <ellipse cx="0" cy="31" rx="22" ry="4" fill="#120806" opacity=".5" filter="url(#soft${u})"/>
  <path d="M-15 -8q-4 3 -4 10v20q0 7 8 7h22q8 0 8 -7v-20q0 -7 -4 -10z" fill="#5a8a82" opacity=".18"/>
  <path d="M-17 4q17 -3 34 0v18q0 7 -8 7h-18q-8 0 -8 -7z" fill="url(#js${u})"/>
  <path d="M-17 4q17 -3 34 0" stroke="#7a5a34" stroke-width=".8" fill="none"/><path d="M-17 12q17 2 34 -1M-17 20q17 2 34 0" stroke="#2a1a0a" stroke-width=".6" fill="none" opacity=".7"/>
  ${[[-10, 9], [-3, 15], [6, 8], [10, 18], [-8, 23], [2, 24]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.4" ry=".9" fill="#8a7a6a"/>`).join('')}
  <path d="M1 3q-1 -6 0 -11" stroke="#4a8a3a" stroke-width="1" fill="none"/><path d="M1 -4q-6 -4 -9 -1q4 3 9 1zM1 -7q5 -5 9 -2q-4 3 -9 2z" fill="#6ab04a" stroke="#2a5a1a" stroke-width=".4"/>
  <path d="M-15 -8q-4 3 -4 10v20q0 7 8 7h22q8 0 8 -7v-20q0 -7 -4 -10z" fill="url(#jg${u})" stroke="#4a6a64" stroke-width=".8"/>
  <path d="M-12 -12h24v4h-24z" fill="#9ac0b8" opacity=".5" stroke="#4a6a64" stroke-width=".6"/><path d="M-13 -13.6q13 -1.4 26 0v2q-13 1.4 -26 0z" fill="#c8e8e0" opacity=".6" stroke="#4a6a64" stroke-width=".5"/>
  <path d="M-10 -13l1 -8h18l1 8z" fill="url(#jc${u})" stroke="#4a3418" stroke-width=".6"/>${[[-6, -18], [0, -16], [5, -19], [-3, -20]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".5" fill="#5a3a18"/>`).join('')}<ellipse cx="0" cy="-21" rx="9" ry="1.6" fill="#c8a670" stroke="#4a3418" stroke-width=".4"/>
  <path d="M-12.4 -10q12.4 2.4 24.8 0" stroke="#8a6a3a" stroke-width="1.4" fill="none"/><path d="M8 -9q6 4 4 12" stroke="#8a6a3a" stroke-width=".9" fill="none"/>
  <g transform="translate(13 5) rotate(10)"><path d="M-3 0h10v7h-10l-2 -3.5z" fill="#efe2c4" stroke="#8a7a5a" stroke-width=".4"/><circle cx="-2.4" cy="3.5" r=".6" fill="#8a6a3a"/><path d="M0 2.4h5M0 4.6h4" stroke="#6a5a40" stroke-width=".4"/></g>
  <path d="M-15 -3q-2 12 0 26" stroke="#ffffff" stroke-width="2" fill="none" opacity=".55" stroke-linecap="round"/><path d="M-11 -3q-1 6 0 12" stroke="#ffffff" stroke-width=".8" fill="none" opacity=".5"/><path d="M14 0q1 10 -1 22" stroke="#e8fff8" stroke-width=".6" fill="none" opacity=".4"/>`;

// mermaid sitting on the rock, bound with rope: proper head, neck, shoulders, arms, flowing hair
module.exports.mermaid = u => `<defs>${defs(u)}<clipPath id="tlm${u}"><path d="M-6 4q-8 10 -4 22q4 8 -2 16q-8 4 -20 4q12 4 20 2q4 -1 8 -6q6 -8 4 -18q-1 -10 6 -20z"/></clipPath>
  <linearGradient id="mh${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a2a22"/><stop offset=".5" stop-color="#1a1210"/><stop offset="1" stop-color="#0a0806"/></linearGradient></defs>
  <path d="M-6 -33q-2 -6 6 -6q9 0 8 8q2 10 8 20q4 8 2 18q-4 -8 -8 -12q-4 -6 -6 -12q-2 4 -2 8q-4 -6 -4 -12z" fill="url(#mh${u})"/>
  <path d="M-6 4q-8 10 -4 22q4 8 -2 16q-8 4 -20 4q12 4 20 2q4 -1 8 -6q6 -8 4 -18q-1 -10 6 -20z" fill="url(#tail${u})" stroke="#0e2e30" stroke-width=".6"/>
  <g clip-path="url(#tlm${u})"><rect x="-40" y="0" width="60" height="60" fill="url(#scl${u})"/><path d="M-4 6q-6 10 -3 20" stroke="#c8fff4" stroke-width="1.6" opacity=".35" fill="none"/></g>
  <path d="M-32 48q-8 -4 -12 -12q8 2 14 8q-2 -8 2 -16q4 10 6 18z" fill="url(#fin${u})" stroke="#0e2e30" stroke-width=".5"/><path d="M-40 38l8 8M-36 34l5 11M-30 32l1 12" stroke="#d8fff4" stroke-width=".35" opacity=".7"/>
  <path d="M-8 6q2 -5 8 -5t8 5q-4 3 -8 3t-8 -3z" fill="url(#fin${u})" opacity=".9"/>
  <path d="M-8 -17q-6 8 -9 18" stroke="#8a5a3a" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M-8 -17q-6 8 -9 18" stroke="url(#skin${u})" stroke-width="3.2" stroke-linecap="round" fill="none"/><ellipse cx="-17.4" cy="2.4" rx="2" ry="1.5" fill="url(#skin${u})" stroke="#8a5a3a" stroke-width=".4"/>
  <path d="M-6 5Q-8 -6 -9 -14Q-10 -19 -4.4 -20L4.4 -20Q10 -19 9 -14Q8 -6 6 5z" fill="url(#skin${u})" stroke="#8a5a3a" stroke-width=".5"/>
  <path d="M-3 -2q3 1.4 6 0" stroke="#b08060" stroke-width=".4" fill="none"/><path d="M0 0v1.4" stroke="#b08060" stroke-width=".5"/>
  <path d="M8 -17q6 5 4 13q-1 3 -4 3" stroke="#8a5a3a" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M8 -17q6 5 4 13q-1 3 -4 3" stroke="url(#skin${u})" stroke-width="3.2" stroke-linecap="round" fill="none"/>
  ${[-3.6, 3.6].map(x => `<ellipse cx="${x}" cy="-13.6" rx="3.4" ry="2.8" fill="#2a9a8a" stroke="#0e3e38" stroke-width=".4"/>${[-1.4, 0, 1.4].map(d => `<path d="M${x} -11.2l${d} -4.4" stroke="#7ad8c8" stroke-width=".35"/>`).join('')}`).join('')}<path d="M-7 -14.6q-1.4 -4 2 -6M7 -14.6q1.4 -4 -2 -6M-.4 -13.6h.8" stroke="#0e3e38" stroke-width=".5" fill="none"/>
  <path d="M-2.2 -24v4.6h4.4v-4.6z" fill="url(#skin${u})"/><path d="M-2.2 -21q2.2 1 4.4 0" stroke="#a87a5a" stroke-width=".4" fill="none"/>
  <ellipse cx="0" cy="-29" rx="5" ry="6" fill="url(#skin${u})" stroke="#8a5a3a" stroke-width=".5"/>
  <path d="M-5.6 -30q-.4 -7 5.6 -7.4q6.2 .2 5.8 7.6q-2 -3.6 -5.6 -4.4q-1 2 -5.8 4.2z" fill="url(#mh${u})"/><path d="M-5.4 -30q-2.6 8 -1.4 20q1.4 -8 2.2 -15z" fill="url(#mh${u})"/><path d="M-2 -36q3 -1 6 1" stroke="#5a4a40" stroke-width=".4" fill="none"/>
  <ellipse cx="-2" cy="-29" rx=".95" ry=".75" fill="#1e4a4a"/><ellipse cx="2.2" cy="-29" rx=".95" ry=".75" fill="#1e4a4a"/><circle cx="-1.8" cy="-29.2" r=".28" fill="#fff"/><circle cx="2.4" cy="-29.2" r=".28" fill="#fff"/>
  <path d="M-3.2 -30.6q1.2 -.8 2.4 0M1 -30.6q1.2 -.8 2.4 0" stroke="#2a1a14" stroke-width=".45" fill="none"/><path d="M.2 -28.2l-.5 1.8h.9" stroke="#b08060" stroke-width=".3" fill="none"/><path d="M-1 -25.4q1.1 .7 2.2 0" stroke="#b03a3a" stroke-width=".7" fill="none"/><ellipse cx="-3" cy="-26.6" rx="1" ry=".6" fill="#e89080" opacity=".35"/><ellipse cx="3.2" cy="-26.6" rx="1" ry=".6" fill="#e89080" opacity=".35"/>
  <path d="M-11 -8q11 4 22 -1M-10 -3q11 4 21 -1" stroke="#7a5a30" stroke-width="1.4" fill="none"/><path d="M-11 -8q11 4 22 -1M-10 -3q11 4 21 -1" stroke="#d8b888" stroke-width=".6" fill="none" stroke-dasharray="1.2 .9"/>
  <path d="M11 -9q10 -2 18 6q6 6 14 4" stroke="#7a5a30" stroke-width="1.2" fill="none"/><path d="M11 -9q10 -2 18 6q6 6 14 4" stroke="#d8b888" stroke-width=".5" fill="none" stroke-dasharray="1.2 .9"/>`;

// the Code of the Brethren: a heavy old tome, brass corners, clasp, title plate
module.exports.codex = u => `<defs><linearGradient id="cxl${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a2e1e"/><stop offset=".5" stop-color="#5a1a10"/><stop offset="1" stop-color="#2e0c06"/></linearGradient>
  <linearGradient id="cxp${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e8d8b0"/><stop offset="1" stop-color="#b8a478"/></linearGradient></defs>
  <ellipse cx="4" cy="33" rx="32" ry="4.4" fill="#120806" opacity=".5" filter="url(#soft${u})"/>
  <path d="M-20 -26h44v56h-44z" fill="url(#cxp${u})" stroke="#6a5a3a" stroke-width=".5"/>${Array.from({ length: 9 }, (_, k) => `<path d="M${22.6 - k * .1} ${-24 + k * 6}v4M-18 ${28.4 + (k % 2) * .4}h${38 - k}" stroke="#8a7a5a" stroke-width=".3" opacity=".7"/>`).join('')}
  <rect x="-24" y="-30" width="44" height="56" rx="2" fill="url(#cxl${u})" stroke="#1a0604" stroke-width=".7"/>
  <rect x="-27" y="-30" width="6" height="56" rx="2" fill="#3a0e08" stroke="#1a0604" stroke-width=".5"/>${[-22, -10, 2, 14].map(y => `<rect x="-27.6" y="${y}" width="7.2" height="2.2" rx="1" fill="#6a1e12" stroke="#1a0604" stroke-width=".3"/>`).join('')}
  <rect x="-18.6" y="-25" width="33.2" height="46" rx="1" fill="none" stroke="#c9a048" stroke-width=".6" stroke-dasharray="1.4 .8"/>
  ${[[-21, -27, 0], [17, -27, 90], [17, 23, 180], [-21, 23, 270]].map(([x, y, a]) => `<path transform="translate(${x} ${y}) rotate(${a})" d="M0 0h7l-7 7z" fill="url(#brass${u})" stroke="#5a4010" stroke-width=".4"/>`).join('')}
  <rect x="-15" y="-22" width="26" height="9" rx="1.2" fill="url(#brass${u})" stroke="#5a4010" stroke-width=".5"/><rect x="-14" y="-21" width="24" height="7" rx=".8" fill="#e8d4a0" stroke="#8a6a2a" stroke-width=".3"/>
  <text x="-2" y="-15.6" font-family="Alegreya SC,Georgia,serif" font-size="5" font-weight="700" text-anchor="middle" fill="#3a1a08" letter-spacing=".4">КОДЕКС</text>
  <circle cx="-2" cy="1" r="9" fill="url(#brassR${u})" stroke="#5a4010" stroke-width=".6"/><circle cx="-2" cy="1" r="7" fill="none" stroke="#8a6418" stroke-width=".4"/>
  <path d="M-6.4 -1.4q0 -4.4 4.4 -4.4t4.4 4.4q0 2.2 -1.4 3v1.8h-6v-1.8q-1.4 -.8 -1.4 -3z" fill="#4a3010"/><circle cx="-3.8" cy="-1.4" r="1.1" fill="#e8c060"/><circle cx="-.2" cy="-1.4" r="1.1" fill="#e8c060"/><path d="M-8 5l12 4M-8 9l12 -4" stroke="#4a3010" stroke-width="1.2" stroke-linecap="round"/>
  <text x="-2" y="17.4" font-family="Alegreya SC,Georgia,serif" font-size="3.4" text-anchor="middle" fill="#e2c070" letter-spacing=".5">БРАТСТВА</text>
  <path d="M20 -6h6v10h-6" fill="#3a0e08" stroke="#1a0604" stroke-width=".5"/><rect x="23" y="-4" width="4.6" height="6" rx=".8" fill="url(#brass${u})" stroke="#5a4010" stroke-width=".4"/>
  <path d="M6 26l-1.6 9 2.4 -2 1.6 2.4 .6 -9.4M10 26l1 8 2 -1.6 2 2 -1 -8.4" fill="#a8302a" stroke="#5a1410" stroke-width=".3"/>
  <path d="M-18 -26l14 -2" stroke="#ffffff" stroke-width=".8" opacity=".25"/>`;

// a white flag of parley on a pole: waving cloth with folds, ties, finial
module.exports.parleyFlag = u => `<defs><linearGradient id="pfc${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e8e2d2"/><stop offset=".25" stop-color="#fbf8f0"/><stop offset=".45" stop-color="#d8d0bc"/><stop offset=".7" stop-color="#fbf8f0"/><stop offset="1" stop-color="#d4ccb6"/></linearGradient></defs>
  <ellipse cx="1" cy="41" rx="9" ry="1.8" fill="#120806" opacity=".45"/><path d="M-3 41q4 -3 8 0" fill="#c8ac7a"/>
  <rect x="-1.3" y="-40" width="2.6" height="81" fill="url(#oakH${u})"/><circle cx="0" cy="-41.6" r="2.4" fill="url(#brassR${u})" stroke="#5a4010" stroke-width=".4"/>
  <path d="M1.3 -37C14 -42 24 -31 36 -35C46 -38 52 -33 60 -36L60 -9C51 -6 45 -12 36 -9C24 -5 14 -15 1.3 -11Z" fill="url(#pfc${u})" stroke="#a8a090" stroke-width=".5"/>
  <path d="M14 -38q-2 13 0 26M36 -35q2 12 0 26M50 -35q-1 13 0 25" stroke="#b8b0a0" stroke-width="1.6" fill="none" opacity=".35"/><path d="M60 -36l-2 3 2 3 -2 3 2 3" stroke="#c8c0ac" stroke-width=".5" fill="none"/>
  ${[-35, -13].map(y => `<path d="M-1.6 ${y}q-1 2 1.6 2.6q3 0 3 -2.4" stroke="#8a6a3a" stroke-width=".8" fill="none"/>`).join('')}
  <path d="M1.4 -40v74" stroke="#c8a46a" stroke-width=".4"/>`;

// beached longboat with oars and a mooring line
module.exports.longboat = u => `<ellipse cx="0" cy="6" rx="30" ry="3" fill="#120806" opacity=".4" filter="url(#soft${u})"/>
  <path d="M-28 -4q28 5 56 -2l-5 9q-23 4 -46 0z" fill="url(#oak${u})" stroke="#2a1608" stroke-width=".6"/><path d="M-27 -3.4q27 5 54 -2" stroke="#e8b880" stroke-width=".6" fill="none"/><path d="M-24 1q24 4 48 -1" stroke="#2a1608" stroke-width=".4" fill="none"/>
  <path d="M-12 -2L18 -10M-6 -1L22 -6" stroke="#8a6a3a" stroke-width="1.2"/><ellipse cx="19" cy="-10" rx="3" ry="1" fill="#8a6a3a" transform="rotate(-18 19 -10)"/>
  <path d="M-28 -2q-10 4 -14 10" stroke="#8a6a3a" stroke-width=".7" fill="none"/><path d="M-43 6v-5" stroke="#5a3a1a" stroke-width="1.4"/>`;

// tilted business scales: a keg of powder outweighs the gold
module.exports.scalesBiz = u => { const a = 9 * Math.PI / 180, L = 30, py = -24; const ex = Math.cos(a) * L, ey = Math.sin(a) * L;
  const pan = (x, y, content) => `<path d="M${x} ${y}L${x - 10} ${y + 22}M${x} ${y}L${x} ${y + 22}M${x} ${y}L${x + 10} ${y + 22}" stroke="#a8884e" stroke-width=".5"/><circle cx="${x}" cy="${y}" r="1.4" fill="url(#brass${u})"/>${content}<path d="M${x - 12} ${y + 22}q12 7 24 0z" fill="url(#brass${u})" stroke="#5a4010" stroke-width=".5"/><ellipse cx="${x}" cy="${y + 22}" rx="12" ry="1.8" fill="#e8c878" stroke="#5a4010" stroke-width=".4"/>`;
  return `<ellipse cx="0" cy="33" rx="26" ry="3.4" fill="#120806" opacity=".5" filter="url(#soft${u})"/>
  <path d="M-14 31q0 -5 14 -5t14 5z" fill="url(#brass${u})" stroke="#5a4010" stroke-width=".5"/><rect x="-1.8" y="${py}" width="3.6" height="${30 - py - 4}" fill="url(#brassH${u})"/><path d="M-4 25h8l-1 -3h-6z" fill="url(#brass${u})"/>
  ${pan(-ex, py - ey, `<g transform="translate(${-ex} ${py - ey + 18})">${[0, 1, 2, 3].map(k => `<ellipse cx="${(k % 2) * .8}" cy="${2 - k * 1.6}" rx="5" ry="1.4" fill="url(#brassR${u})" stroke="#6a4a10" stroke-width=".3"/>`).join('')}</g>`)}
  ${pan(ex, py + ey, `<g transform="translate(${ex} ${py + ey + 13.4}) scale(.42)" filter="url(#drop${u})"><path d="M-12 -16q-5 16 0 32h24q5 -16 0 -32z" fill="url(#oak${u})" stroke="#2a1608"/><path d="M-15 -8h30M-15 8h30" stroke="url(#iron${u})" stroke-width="2.4"/><text x="0" y="3" font-family="Alegreya SC,serif" font-size="9" text-anchor="middle" fill="#2a1608" font-weight="700">П</text></g>`)}
  <path d="M${-ex} ${py - ey}L${ex} ${py + ey}" stroke="#5a4010" stroke-width="3" stroke-linecap="round"/><path d="M${-ex} ${py - ey}L${ex} ${py + ey}" stroke="url(#brass${u})" stroke-width="2.2" stroke-linecap="round"/>
  <circle cx="0" cy="${py}" r="3" fill="url(#brassR${u})" stroke="#5a4010" stroke-width=".5"/><path d="M0 ${py - 3}v-6" stroke="url(#brass${u})" stroke-width="1.4"/><path d="M-1.6 ${py - 9}l1.6 -3 1.6 3z" fill="url(#brass${u})"/>`; };

// porcelain cup of tea on a saucer, steam
module.exports.teacup = u => `<ellipse cx="0" cy="7" rx="14" ry="2.4" fill="#120806" opacity=".45"/><ellipse cx="0" cy="5" rx="13" ry="3" fill="#f4f0e8" stroke="#8a8478" stroke-width=".5"/><ellipse cx="0" cy="4.6" rx="9" ry="1.8" fill="none" stroke="#2a4a8a" stroke-width=".5"/>
  <path d="M-8 -6q0 11 8 11t8 -11z" fill="#fbf8f2" stroke="#8a8478" stroke-width=".5"/><path d="M8 -4q5 -1 5 3t-6 3" stroke="#fbf8f2" stroke-width="1.6" fill="none"/><path d="M8 -4q5 -1 5 3t-6 3" stroke="#8a8478" stroke-width=".4" fill="none"/>
  <ellipse cx="0" cy="-6" rx="8" ry="1.8" fill="#8a4a1a" stroke="#8a8478" stroke-width=".5"/><path d="M-6 -2q6 2 12 0" stroke="#2a4a8a" stroke-width=".7" fill="none"/>${[-4, 0, 4].map(x => `<circle cx="${x}" cy="0" r=".6" fill="#2a4a8a"/>`).join('')}
  <path d="M-2 -9q-3 -4 0 -8t0 -8M3 -9q-3 -4 0 -7" stroke="#ffffff" stroke-width=".8" fill="none" opacity=".55"/>`;

// stone tower with a chain windlass
module.exports.chainTower = u => `<ellipse cx="0" cy="22" rx="16" ry="2.4" fill="#0a1a1a" opacity=".4"/><path d="M-10 22l2 -36h16l2 36z" fill="#9a9284" stroke="#4a463e" stroke-width=".5"/>${[-8, -2, 4, 10, 16].map(y => `<path d="M-9 ${y}h18" stroke="#6a6458" stroke-width=".4"/>`).join('')}
  <path d="M-11 -14h22v-5h-22z" fill="#8a8274" stroke="#4a463e" stroke-width=".5"/>${[-10, -4, 2, 8].map(x => `<rect x="${x}" y="-23" width="3.4" height="4.4" fill="#8a8274" stroke="#4a463e" stroke-width=".4"/>`).join('')}
  <rect x="-3" y="-8" width="6" height="8" rx="3" fill="#2a2620"/><circle cx="-12" cy="14" r="3" fill="url(#iron${u})" stroke="#1a1c1e" stroke-width=".5"/><path d="M-15 14h6M-12 11v6" stroke="#5a6064" stroke-width=".6"/>
  <path d="M10 -24v-10l8 3 -8 3" fill="#b3352a" stroke="#5a1410" stroke-width=".3"/><path d="M10 -14v-20" stroke="#5a3a1a" stroke-width=".8"/>`;
