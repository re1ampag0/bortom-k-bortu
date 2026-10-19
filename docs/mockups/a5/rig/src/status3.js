/* the status badges, A5 manner: a round enamel badge with a thin brass rim, the sign engraved in cream on it */
const ST3 = {
  fire: {bg: ['#b8432a', '#6e1a0e'], lbl: n => `Пожар ×${n}`, s: `
    <path d="M12 2.6 C13.8 6 17.8 7.8 17.6 12.8 C17.4 17 14.8 20 12 20 C8.4 20 6.2 17.2 6.4 13.8 C6.6 10.8 9 9.8 9.2 7 C10.5 8.7 11.4 9.1 11.8 7.8 C12.3 6.3 11.8 4.6 12 2.6 Z" fill="#ffb347" stroke="#4a1006" stroke-width=".7"/>
    <path d="M15.6 9.4 C17.6 10.8 18.8 12.6 18.4 15 C18.2 16.4 17.4 17.6 16.4 18.2 C17 16.6 17 14.6 16.2 13 Z" fill="#ff8a2a" stroke="#4a1006" stroke-width=".5"/>
    <path d="M12 10.2 C13.5 12.2 15.2 13.6 14.6 16.2 C14.2 17.8 13.1 18.6 12 18.6 C10.5 18.6 9.4 17.4 9.6 15.8 C9.8 14.4 11.3 13.4 12 10.2 Z" fill="#ffe7a0"/>
    <path d="M12 14 C12.7 15 13.4 15.8 13.1 17 C12.9 17.6 12.4 17.9 12 17.9 C11.4 17.9 11 17.4 11.1 16.8 C11.2 16 11.8 15.4 12 14 Z" fill="#fffbe6"/>
    <circle cx="17.2" cy="5.6" r=".7" fill="#ffd27a"/><circle cx="6.8" cy="6.6" r=".55" fill="#ffd27a"/><circle cx="19" cy="8.6" r=".45" fill="#ffe7a0"/>`},
  mark: {bg: ['#3a3430', '#141210'], lbl: n => `Чёрная метка +${n}`, s: `
    <path d="M12 3.6 L14 4.4 L15.6 3.8 L16.8 5.4 L18.8 6 L18.6 8 L20 9.6 L19 11.4 L19.8 13.4 L18.2 14.6 L18.2 16.8 L16.2 17.4 L15.2 19.2 L13.2 18.8 L11.6 20.2 L10 19 L8 19.4 L7.2 17.6 L5.2 16.8 L5.6 14.8 L4.2 13.2 L5.2 11.6 L4.4 9.6 L6 8.4 L6 6.4 L8 5.8 L9.2 4 L11 4.6 Z" fill="#efe3c8" stroke="#6b5a40" stroke-width=".5"/>
    <path d="M6.4 9.2 L17.8 15.4" stroke="#c9b48c" stroke-width=".5"/>
    <path d="M12 7.4 C13.6 7.8 13.4 9.4 15 9.2 C16.8 9 17 11.2 15.8 12.2 C14.8 13.2 16.6 14.2 15.4 15.6 C14.2 16.8 12.8 15.6 12.1 16.8 C11.3 17.8 9.4 16.8 9.4 15.4 C9.4 14.3 7.4 14.4 7.2 12.8 C7.1 11.2 8.8 11 8.6 9.6 C8.4 8 10.2 7.2 11.2 8 Z" fill="#14100d"/>
    <circle cx="16.6" cy="8" r=".6" fill="#14100d"/><circle cx="8" cy="16.2" r=".45" fill="#14100d"/>`},
  blockade: {bg: ['#6e6862', '#3a3632'], lbl: () => 'Блокада', s: `
    <g fill="none" stroke-linecap="round"><g transform="rotate(-35 12 12)"><rect x="2.6" y="9.6" width="7.4" height="4.8" rx="2.4" stroke="#1e1c1a" stroke-width="2.6"/><rect x="2.6" y="9.6" width="7.4" height="4.8" rx="2.4" stroke="#e6e0d6" stroke-width="1.4"/>
      <rect x="14" y="9.6" width="7.4" height="4.8" rx="2.4" stroke="#1e1c1a" stroke-width="2.6"/><rect x="14" y="9.6" width="7.4" height="4.8" rx="2.4" stroke="#e6e0d6" stroke-width="1.4"/>
      <ellipse cx="12" cy="12" rx="3.8" ry="1.3" stroke="#1e1c1a" stroke-width="2.6"/><ellipse cx="12" cy="12" rx="3.8" ry="1.3" stroke="#c9c2b6" stroke-width="1.3"/></g></g>
    <path d="M14.6 15.4 V14 Q14.6 11.8 16.6 11.8 Q18.6 11.8 18.6 14 V15.4" fill="none" stroke="#1e1c1a" stroke-width="2.2"/><path d="M14.6 15.4 V14 Q14.6 11.8 16.6 11.8 Q18.6 11.8 18.6 14 V15.4" fill="none" stroke="#d9d2c6" stroke-width="1"/>
    <rect x="13.4" y="15" width="6.4" height="5" rx="1" fill="#e2bf62" stroke="#3a2a0c" stroke-width=".6"/><circle cx="16.6" cy="17.2" r=".8" fill="#3a2a0c"/><path d="M16.6 17.4 V18.8" stroke="#3a2a0c" stroke-width=".7"/>`},
  parley: {bg: ['#3c6a88', '#1d3a50'], lbl: () => 'Переговоры', s: `
    <path d="M6.6 21 V3.6" stroke="#2a1a0c" stroke-width="2.2" stroke-linecap="round"/><path d="M6.6 21 V3.6" stroke="#c9a463" stroke-width="1.2" stroke-linecap="round"/><circle cx="6.6" cy="3.2" r="1.3" fill="#e2bf62" stroke="#3a2a0c" stroke-width=".5"/>
    <path d="M7.4 4.6 Q10.4 3.2 13 4.8 Q15.6 6.4 18.8 4.8 Q18.2 8 19.2 10.8 Q16 12.4 13.2 10.8 Q10.4 9.2 7.4 10.8 Z" fill="#fbf6ea" stroke="#3a3430" stroke-width=".6"/>
    <path d="M9.2 6.6 Q11.6 5.8 13.4 7 M10 8.8 Q12.4 8 14.6 9" stroke="#c9bfa8" stroke-width=".55" fill="none"/>
    <path d="M18.8 4.8 L19.6 4.4 M19 6.6 L19.8 6.4 M19 8.4 L19.8 8.4 M19.2 10.2 L20 10.4" stroke="#fbf6ea" stroke-width=".6"/>`},
  voodoo: {bg: ['#5e4f86', '#2e2448'], lbl: () => 'Кукла вуду', s: `
    <path d="M12 2.8 C14.8 2.8 16.2 4.8 16 7.2 C15.8 9.2 14.4 10.4 12 10.4 C9.6 10.4 8.2 9.2 8 7.2 C7.8 4.8 9.2 2.8 12 2.8 Z" fill="#d9c49a" stroke="#3a2a14" stroke-width=".6"/>
    <path d="M9.6 5.8 L11 7.2 M11 5.8 L9.6 7.2" stroke="#3a2a14" stroke-width=".8" stroke-linecap="round"/><circle cx="14" cy="6.5" r=".95" fill="#3a2a14"/><circle cx="14" cy="6.5" r=".35" fill="#d9c49a"/>
    <path d="M10.2 8.8 Q12 9.6 13.8 8.8" fill="none" stroke="#3a2a14" stroke-width=".5" stroke-dasharray=".6 .5"/>
    <path d="M9.2 10.6 H14.8 Q15.6 10.6 15.8 11.4 L16.4 15.6 Q16.6 16.6 15.6 16.8 L14.8 16.8 L15.4 20.4 Q15.4 21.2 14.6 21.2 H13.4 L12 17.8 L10.6 21.2 H9.4 Q8.6 21.2 8.6 20.4 L9.2 16.8 L8.4 16.8 Q7.4 16.6 7.6 15.6 L8.2 11.4 Q8.4 10.6 9.2 10.6 Z" fill="#c9b07e" stroke="#3a2a14" stroke-width=".6"/>
    <path d="M5.6 11.6 L8.4 12.8 M18.4 11.6 L15.6 12.8" stroke="#c9b07e" stroke-width="2" stroke-linecap="round"/><path d="M5.6 11.6 L8.4 12.8 M18.4 11.6 L15.6 12.8" stroke="#3a2a14" stroke-width=".5" stroke-linecap="round" opacity=".6"/>
    <path d="M12 11 V16.4" stroke="#3a2a14" stroke-width=".5" stroke-dasharray=".8 .6"/><path d="M9.8 13.6 Q12 14.4 14.2 13.6" stroke="#8a2e1c" stroke-width=".7" fill="none"/>
    <path d="M19.6 4.2 L13.8 12.2 M20.6 9.2 L14.4 14" stroke="#e6ecf0" stroke-width=".7"/><circle cx="19.8" cy="4" r="1.2" fill="#c8281c" stroke="#5a0c06" stroke-width=".4"/><circle cx="20.8" cy="9" r="1.1" fill="#c8281c" stroke="#5a0c06" stroke-width=".4"/>`},
  noReact: {bg: ['#7a7068', '#423a34'], lbl: () => 'Без Реакций', s: `
    <path d="M12 2.6 L19 5 V10.8 Q19 16.8 12 20.6 Q5 16.8 5 10.8 V5 Z" fill="#efe3c8" stroke="#2a2420" stroke-width=".8"/>
    <path d="M12 4.4 L17.4 6.2 V10.8 Q17.4 15.6 12 18.8 Q6.6 15.6 6.6 10.8 V6.2 Z" fill="none" stroke="#8a7a5e" stroke-width=".5"/>
    <circle cx="12" cy="11" r="2.4" fill="#c9b48c" stroke="#5a4a30" stroke-width=".5"/>${[[7.2, 6.4], [16.8, 6.4], [12, 4]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".55" fill="#5a4a30"/>`).join('')}
    <path d="M4 3.4 L20 19.4" stroke="#efe3c8" stroke-width="3.6" stroke-linecap="round"/><path d="M4 3.4 L20 19.4" stroke="#c8281c" stroke-width="2.2" stroke-linecap="round"/>`},
  surfaced: {bg: ['#3e8a78', '#16443a'], lbl: () => 'Всплыл', s: `
    <path d="M1 17.6 Q4 16.4 7 17.4 Q10 18.4 13 17.2 Q16 16 19 17.2 Q21.4 18.2 23 17.6 V24 H1 Z" fill="#0f3a32" opacity=".55"/>
    <g transform="rotate(-28 12 15)"><path d="M3 15.4 H21.4 Q20.6 18.4 18.4 19.8 Q12 21.2 5.6 19.8 Q3.6 18.2 3 15.4 Z" fill="#1e1a17" stroke="#050404" stroke-width=".6"/>
      <path d="M4.2 17 H20.6" stroke="#6e6250" stroke-width=".55"/><path d="M5.6 18.4 L7 18.4 M9 18.6 L10.4 18.6 M12.4 18.6 L13.8 18.6 M15.8 18.4 L17.2 18.4" stroke="#c8b98e" stroke-width=".8"/>
      <path d="M8.6 15.4 V6 M14.6 15.4 V4.6" stroke="#1e1a17" stroke-width="1.2"/><path d="M14.6 4.6 L17.6 5.6 L14.6 6.6 Z" fill="#c8b98e"/>
      <path d="M9.1 7 H12.6 L12 9.4 L12.8 10.4 L12.1 12.8 H9.1 Z M15.1 5.8 H19.4 L18.6 8.4 L19.6 9.6 L18.6 12.6 H15.1 Z" fill="#d9d0bc" stroke="#1e1a17" stroke-width=".45"/>
      <path d="M10.4 9.6 L11.4 11.2 M16.6 8 L17.6 9.8 M16.4 11 L17.4 11.6" stroke="#1e1a17" stroke-width=".45"/></g>
    <path d="M5.4 15.6 L4.6 18.6 M8.4 13.8 L8 17.6 M11.4 12.2 L11.6 16.4 M15 10.8 L15.6 15.6" stroke="#eafaf6" stroke-width=".85" stroke-linecap="round"/>
    <path d="M2.2 17.4 Q3.4 13.6 5 16 Q6 12.6 7.6 15.6 Q9.2 13.2 10.4 16.4 Q12.4 14.8 13.6 17 Q15.8 15.6 17 17.6 Q19.4 16.4 21.6 17.8" fill="#eafaf6" stroke="#bfe6da" stroke-width=".4"/>
    <circle cx="3.6" cy="12.6" r=".6" fill="#eafaf6"/><circle cx="6.6" cy="10.4" r=".5" fill="#eafaf6"/><circle cx="18.6" cy="14" r=".55" fill="#eafaf6"/><circle cx="20.4" cy="12.2" r=".45" fill="#eafaf6"/>
    <path d="M2.6 20.6 Q5.4 19 8.2 20.6 T13.8 20.6 T19.4 20.6" fill="none" stroke="#bfe6da" stroke-width=".9" stroke-linecap="round" opacity=".85"/>
    <path d="M18.6 6.4 L20.6 4.2 L22.6 6.4 M18.6 9.2 L20.6 7 L22.6 9.2" fill="none" stroke="#f6efe0" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>`},
  under: {bg: ['#2e6880', '#0b2430'], lbl: () => 'Под водой', s: `
    <path d="M1 1 H23 V6 Q20 7.4 17 6 Q14 4.6 11 6 Q8 7.4 5 6 Q3 5 1 6 Z" fill="#9fd0de" opacity=".35"/>
    <path d="M1.6 6 Q4 4.2 6.4 6 T11.2 6 T16 6 T20.8 6 T23 5.4" fill="none" stroke="#eaf8fc" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M6 6.6 L3.6 22 M10.6 6.8 L9.6 22 M15.4 6.8 L16.4 22 M19.6 6.6 L21.6 20" stroke="#bfe6f0" stroke-width="1.4" opacity=".14"/>
    <g opacity=".92"><path d="M4.6 17.8 H19.4 Q18.8 20.4 17 21.4 Q12 22.6 7 21.4 Q5.2 20.4 4.6 17.8 Z" fill="#0f2c38" stroke="#6fa4b6" stroke-width=".5"/>
      <path d="M9.4 17.8 V10.4 M14.6 17.8 V9.2" stroke="#6fa4b6" stroke-width=".9"/>
      <path d="M9.8 11.2 H12.8 L12.2 13.4 L13 14.4 L12.2 16.4 H9.8 Z M15 10 H18.6 L17.8 12.4 L18.8 13.6 L17.8 16.2 H15 Z" fill="#1a4656" stroke="#6fa4b6" stroke-width=".45"/>
      <path d="M6.2 19.4 H17.8" stroke="#6fa4b6" stroke-width=".4" opacity=".7"/></g>
    <path d="M3.6 23 Q6 21.6 8 22.6 M15.6 22.8 Q18 21.4 20.4 22.6" stroke="#2e6a54" stroke-width=".8" fill="none"/>
    <circle cx="12" cy="8.8" r="1.1" fill="none" stroke="#eaf8fc" stroke-width=".6"/><circle cx="13.2" cy="11.4" r=".7" fill="none" stroke="#eaf8fc" stroke-width=".5"/><circle cx="11.2" cy="13" r=".5" fill="none" stroke="#eaf8fc" stroke-width=".45"/>
    <circle cx="7" cy="9.8" r=".75" fill="none" stroke="#eaf8fc" stroke-width=".5"/><circle cx="17.4" cy="8.2" r=".6" fill="none" stroke="#eaf8fc" stroke-width=".45"/>
    <path d="M19.4 12.6 L21.4 14.8 L23.4 12.6 M19.4 15.4 L21.4 17.6 L23.4 15.4" fill="none" stroke="#f6efe0" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>`},
};
let st3n = 0;
function stBadge(k, size = 22){ const t = ST3[k], g = 'sb' + (st3n++);
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><defs><radialGradient id="${g}" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="${t.bg[0]}"/><stop offset="1" stop-color="${t.bg[1]}"/></radialGradient></defs>
    <circle cx="12" cy="12" r="11.6" fill="#e2bf62" stroke="#4a3208" stroke-width=".7"/><circle cx="12" cy="12" r="10.4" fill="url(#${g})" stroke="#4a3208" stroke-width=".5"/>
    <defs><clipPath id="${g}c"><circle cx="12" cy="12" r="10.4"/></clipPath></defs><g clip-path="url(#${g}c)"><g transform="translate(12 12) scale(.78) translate(-12 -12)">${t.s}</g></g><path d="M4.6 8 A8.6 8.6 0 0 1 10 3.6" fill="none" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".28"/></svg>`; }
