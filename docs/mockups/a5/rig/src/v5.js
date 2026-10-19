/* ===== v5 shared art: ships, hull plank icons, the captain's medal, the captain's table ===== */
let v5n = 0; const V5 = p => p + 'v5' + (v5n++);
const r1 = n => Math.round(n * 10) / 10;

/* ---- ships, 120×78, bow to the left, waterline 72 (generic historical types, own drawing) ---- */
const SHIPKIND = {
  pearl:     {hull: ['#2a2622', '#0c0b0a'], band: '#1a1816', trim: '#b8954a', port: '#3a0c08', decks: 1, sail: ['#3a3633', '#1e1c1a'], sailLine: '#0c0b0a', rag: .9, holes: 2, flag: 'skull', win: '#ffcf6a', masts: 3},
  revenge:   {hull: ['#4a2e1a', '#22140a'], band: '#8e2a1c', trim: '#d9b562', port: '#1a0806', decks: 1, sail: ['#efe4cc', '#c7b48e'], sailLine: '#6b5a40', rag: .35, holes: 0, flag: 'bones', win: '#ffcf6a', masts: 3},
  endeavour: {hull: ['#2a2420', '#110e0c'], band: '#d6a646', trim: '#f2d48c', port: '#121010', decks: 2, chequer: true, sail: ['#fbf8ee', '#d9d2bc'], sailLine: '#8a7c62', rag: 0, holes: 0, flag: 'stripes', win: '#ffd98a', masts: 3},
  dutch:     {hull: ['#3e4a44', '#16201c'], band: '#2a3632', trim: '#7fa79a', port: '#0c1a16', decks: 1, sail: ['#8a9a92', '#56645e'], sailLine: '#2a3632', rag: 1.4, holes: 4, flag: 'none', win: '#8affc8', masts: 3, broken: true, barn: true},
};
const SH_K = [[10, 55], [24, 57.4], [50, 59.6], [76, 57], [92, 52.6], [100, 48.4], [107, 44]];
const sheer = x => { for(let i = 1; i < SH_K.length; i++){ if(x <= SH_K[i][0]){ const [a, b] = [SH_K[i - 1], SH_K[i]], t = (x - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * t; } } return 44; };
function shipArt(kind){ const K = SHIPKIND[kind], id = V5('sh'); let s = '';
  const g = `<defs><linearGradient id="${id}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${K.hull[0]}"/><stop offset="1" stop-color="${K.hull[1]}"/></linearGradient>
    <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${K.sail[0]}"/><stop offset=".7" stop-color="${K.sail[0]}"/><stop offset="1" stop-color="${K.sail[1]}"/></linearGradient>
    <clipPath id="${id}c"><path d="M10 55 Q14 56.4 18 56.8 L${SH_K.slice(2).map(p => p.join(' ')).join(' L')} L110 44 L108.6 56 Q107 66 101 72 L20 72 Q13.6 66 10 55 Z"/></clipPath></defs>`;
  // bowsprit and jibs (behind)
  s += `<path d="M14 54.6 L-1 44.6" stroke="#2a1a0c" stroke-width="1.5" stroke-linecap="round"/><path d="M-1 44.6 L2 44.2" stroke="#2a1a0c" stroke-width=".8"/>`;
  const mx = [32, 56, 82], top = K.broken ? [12, 6, 26] : [10, 3.6, 16];
  // the jibs from the foremast to the bowsprit
  const jib = (yTop, xEnd, yEnd) => `<path d="M${mx[0] - 1} ${yTop} L${xEnd} ${yEnd} Q${(mx[0] + xEnd) / 2 - 2} ${(yTop + yEnd) / 2 + 6} ${mx[0] - 1} ${yTop + 22} Z" fill="url(#${id}s)" stroke="${K.sailLine}" stroke-width=".35" opacity=".96"/>`;
  s += jib(14, 0, 45) + jib(20, 6, 49.4);
  // masts
  const mastSail = (x, i) => { let m = ''; const base = sheer(x), t = top[i], H = base - t;
    m += `<path d="M${x} ${base} L${x} ${t}" stroke="#2a1a0c" stroke-width="${i === 1 ? 1.6 : 1.3}"/>`;
    if(K.broken && i === 0) m += `<path d="M${x} ${t} L${x + 3} ${t - 6}" stroke="#2a1a0c" stroke-width="1.1"/>`;
    // tops (platforms)
    m += `<path d="M${x - 3} ${r1(base - H * .52)} H${x + 3}" stroke="#2a1a0c" stroke-width="1.1"/><path d="M${x - 2} ${r1(base - H * .82)} H${x + 2}" stroke="#2a1a0c" stroke-width=".8"/>`;
    // square sails: course, topsail, topgallant (mizzen: gaff + topsail)
    const tiers = i === 2 ? [[.52, .8, 8]] : [[.12, .48, 13 - i * .4], [.52, .78, 10.4], [.82, .96, 7.2]];
    tiers.forEach(([a, b, w], j) => { const y1 = r1(base - H * b), y2 = r1(base - H * a - 1.4), bel = (y2 - y1) * .16;
      let bottom = `Q${x} ${r1(y2 + bel * 1.4)} ${x - w + .6} ${y2}`;
      if(K.rag){ let d = ''; const n = 6; for(let q = n; q >= 0; q--){ const xx = x - w + .6 + (2 * w - 1.2) * q / n, yy = y2 + Math.sin(q / n * Math.PI) * bel * 1.4 - (q % 2 ? K.rag * (1 + (j + q) % 3) : 0); d += ` L${r1(xx)} ${r1(yy)}`; } bottom = d.slice(1); }
      m += `<path d="M${x - w} ${y1} L${x + w} ${y1} Q${r1(x + w + 1.4)} ${r1((y1 + y2) / 2)} ${r1(x + w - .6)} ${y2} ${K.rag ? bottom.trim() : bottom} Q${r1(x - w - 1.4)} ${r1((y1 + y2) / 2)} ${x - w} ${y1} Z" fill="url(#${id}s)" stroke="${K.sailLine}" stroke-width=".35"/>`;
      m += `<path d="M${x - w + 1} ${r1(y1 + (y2 - y1) * .5)} Q${x} ${r1(y1 + (y2 - y1) * .62)} ${x + w - 1} ${r1(y1 + (y2 - y1) * .5)}" stroke="${K.sailLine}" stroke-width=".3" fill="none" opacity=".45"/>`;
      if(K.holes && (j + i) % 2 === 0) for(let h = 0; h < K.holes / 2; h++) m += `<ellipse cx="${r1(x - w / 2 + h * w * .9)}" cy="${r1(y1 + (y2 - y1) * (.4 + h * .2))}" rx="${r1(1 + h * .4)}" ry="${r1(.8 + h * .3)}" fill="${kind === 'dutch' ? '#cfe3e0' : '#efe3c8'}" opacity="${kind === 'dutch' ? .5 : .85}"/>`;
      m += `<path d="M${x - w - 1} ${y1} H${x + w + 1}" stroke="#2a1a0c" stroke-width=".9" stroke-linecap="round"/>`; });
    if(i === 2){ const y1 = r1(base - H * .5), y2 = r1(base - 2); m += `<path d="M${x} ${y1} L${x + 14} ${r1(y1 + 3)} L${x + 16} ${y2} L${x} ${y2} Z" fill="url(#${id}s)" stroke="${K.sailLine}" stroke-width=".35"/><path d="M${x} ${y1} L${x + 15} ${r1(y1 + 3)}" stroke="#2a1a0c" stroke-width=".8"/>`; }
    // shrouds
    m += `<g stroke="#2a2014" stroke-width=".28" opacity=".75">${[-5, -3, -1, 1, 3].map(d => `<path d="M${x} ${r1(base - H * .52)} L${x + d} ${r1(sheer(x + d) + .4)}"/>`).join('')}</g>`;
    return m; };
  // stays
  s += `<g stroke="#2a2014" stroke-width=".3" fill="none" opacity=".7"><path d="M${mx[1]} ${top[1] + 1} L${mx[0]} ${top[0] + 6} M${mx[2]} ${top[2] + 1} L${mx[1]} ${top[1] + 14} M${mx[0]} ${top[0] + 1} L-1 44.6 M${mx[2]} ${top[2] + 2} L110 44"/></g>`;
  mx.forEach((x, i) => s += mastSail(x, i));
  // hull
  s += `<path d="M10 55 Q14 56.4 18 56.8 L${SH_K.slice(2).map(p => p.join(' ')).join(' L')} L110 44 L108.6 56 Q107 66 101 72 L20 72 Q13.6 66 10 55 Z" fill="url(#${id}h)" stroke="#050403" stroke-width=".6"/>`;
  s += `<g clip-path="url(#${id}c)">`;
  // planking lines
  for(let k = 0; k < 6; k++) s += `<path d="M10 ${r1(59 + k * 2.4)} ${Array.from({length: 13}, (_, q) => { const x = 14 + q * 8; return `L${x} ${r1(sheer(x) + 3 + k * 2.6 + (x > 98 ? (x - 98) * .2 * k : 0))}`; }).join(' ')}" stroke="#000" stroke-width=".25" fill="none" opacity=".45"/>`;
  // wales with gunports
  const band = (o1, o2, col, portY) => { let up = '', dn = ''; for(let x = 12; x <= 108; x += 2){ up += `${up ? 'L' : 'M'}${x} ${r1(sheer(x) + o1)} `; dn = `L${x} ${r1(sheer(x) + o2)} ` + dn; }
    let r = `<path d="${up}${dn}Z" fill="${col}"/><path d="${up}" stroke="${K.trim}" stroke-width=".45" fill="none" opacity=".85"/>`;
    for(let x = 22; x <= 96; x += 7.2){ const y = sheer(x) + portY; r += K.chequer ? `<rect x="${r1(x - 1.6)}" y="${r1(y - 1.5)}" width="3.2" height="3" fill="${K.port}"/>` : `<rect x="${r1(x - 1.5)}" y="${r1(y - 1.4)}" width="3" height="2.8" fill="${K.port}" stroke="#000" stroke-width=".2"/><rect x="${r1(x - 1.5)}" y="${r1(y - 2.8)}" width="3" height="1.2" fill="${K.hull[0]}" opacity=".9"/>`; }
    return r; };
  s += band(2.6, 6.8, K.band, 4.7);
  if(K.decks === 2) s += band(9.2, 13.4, K.band, 11.3);
  s += `<path d="M12 ${r1(sheer(12) + .6)} ${Array.from({length: 49}, (_, q) => `L${12 + q * 2} ${r1(sheer(12 + q * 2) + .6)}`).join(' ')}" stroke="${K.trim}" stroke-width=".6" fill="none"/>`;
  if(K.barn) for(let q = 0; q < 26; q++){ const x = 18 + (q * 37) % 84, y = 64 + (q * 13) % 8; s += `<circle cx="${x}" cy="${y}" r="${.5 + (q % 3) * .25}" fill="#c9d6cf" opacity=".55"/>`; }
  s += `</g>`;
  // stern: gallery windows, lantern, rudder
  s += `<path d="M101 46.6 L108.4 45 L108 53 L101.6 54.4 Z" fill="${K.hull[0]}" stroke="${K.trim}" stroke-width=".4"/>${[0, 1, 2].map(q => `<rect x="${r1(102.2 + q * 2)}" y="${r1(47.6 - q * .3)}" width="1.4" height="2.2" fill="${K.win}"/><rect x="${r1(102.2 + q * 2)}" y="${r1(51 - q * .3)}" width="1.4" height="1.8" fill="${K.win}" opacity=".8"/>`).join('')}
    <path d="M100.6 55 H109" stroke="${K.trim}" stroke-width=".5"/><path d="M108.4 44.6 V41.6" stroke="#2a1a0c" stroke-width=".6"/><path d="M107.4 39.6 h2 l-.3 2 h-1.4 z" fill="${K.win}" stroke="#2a1a0c" stroke-width=".3"/>`;
  // figurehead and headrail
  s += `<path d="M10 55 Q7 53 6.4 50.4 Q8.6 51.2 10.6 53.4" fill="${K.trim}" stroke="#2a1a0c" stroke-width=".3"/>`;
  // flags
  const fl = (x, y, w, h, body) => `<path d="M${x} ${y} V${y - h - 3}" stroke="#2a1a0c" stroke-width=".6"/><g transform="translate(${x} ${y - h - 3})">${body(w, h)}</g>`;
  if(K.flag === 'skull' || K.flag === 'bones') s += fl(110, 40, 9, 6, (w, h) => `<path d="M0 0 Q${w / 2} -1 ${w} .6 Q${w - 1} ${h / 2} ${w} ${h} Q${w / 2} ${h - .8} 0 ${h} Z" fill="#141210"/><circle cx="${w / 2}" cy="${h / 2 - .6}" r="1.3" fill="#efe3c8"/><path d="M${w / 2 - 2} ${h / 2 + 1.6} L${w / 2 + 2} ${h / 2 + .2} M${w / 2 - 2} ${h / 2 + .2} L${w / 2 + 2} ${h / 2 + 1.6}" stroke="#efe3c8" stroke-width=".6"/>`);
  if(K.flag === 'stripes') s += fl(110, 40, 10, 6.4, (w, h) => `${[0, 1, 2, 3, 4].map(q => `<rect y="${r1(q * h / 5)}" width="${w}" height="${r1(h / 5)}" fill="${q % 2 ? '#efe3c8' : '#b3352a'}"/>`).join('')}<rect width="${w * .4}" height="${h * .5}" fill="#efe3c8"/><path d="M${w * .2} 0 V${h * .5} M0 ${h * .25} H${w * .4}" stroke="#b3352a" stroke-width=".7"/>`) + `<path d="M${mx[1]} ${top[1]} L${mx[1] + 12} ${top[1] + 1.2} L${mx[1]} ${top[1] + 2}" fill="#b3352a"/>`;
  if(K.flag !== 'stripes' && K.flag !== 'none') s += `<path d="M${mx[1]} ${top[1]} L${mx[1] + 8} ${top[1] + 1} L${mx[1]} ${top[1] + 2}" fill="#141210"/>`;
  // the sea at the hull
  s += `<path d="M8 72.2 Q30 70.6 60 72.2 T112 72" stroke="#eaf4f6" stroke-width=".9" fill="none" opacity=".75"/><path d="M14 72 q-3 1 -6 .2" stroke="#eaf4f6" stroke-width=".7" fill="none" opacity=".7"/>`;
  return g + s; }

/* ---- hull plank icon, 12×16: a whole oak plank, and a broken one ---- */
const HULL2 = `<svg width="12" height="16" viewBox="0 0 12 16" aria-hidden="true">
  <rect x=".6" y=".6" width="10.8" height="14.8" rx="1.2" fill="#a86c36" stroke="#3a2210" stroke-width=".7"/>
  <rect x="1" y="1" width="2.2" height="14" fill="#c88a4e" opacity=".55"/><rect x="8.8" y="1" width="2.2" height="14" fill="#6a3e1a" opacity=".5"/>
  <path d="M3.4 .9 C2.8 5 4.2 9 3.4 15.2 M7.6 .9 C8.2 4 7 8.6 8 15.2 M5.6 3 C5.2 6 6.2 8 5.6 12" stroke="#5a3418" stroke-width=".45" fill="none" opacity=".75"/>
  <ellipse cx="8.4" cy="9.6" rx=".9" ry="1.4" fill="none" stroke="#5a3418" stroke-width=".4"/>
  <rect x=".6" y="2.2" width="10.8" height="1.2" fill="#2b2f31"/><rect x=".6" y="12.6" width="10.8" height="1.2" fill="#2b2f31"/>
  <circle cx="2.4" cy="2.8" r=".55" fill="#9aa2a6"/><circle cx="9.6" cy="2.8" r=".55" fill="#9aa2a6"/><circle cx="2.4" cy="13.2" r=".55" fill="#9aa2a6"/><circle cx="9.6" cy="13.2" r=".55" fill="#9aa2a6"/>
  <path d="M1.4 1.4 V14.6" stroke="#f0c68c" stroke-width=".6" opacity=".6"/></svg>`;
const HULL2_X = `<svg width="12" height="16" viewBox="0 0 12 16" aria-hidden="true"><rect x=".6" y=".6" width="10.8" height="14.8" rx="1.2" fill="#9c8a72" stroke="#4a3a28" stroke-width=".7"/>
  <path d="M1.4 1.4 V14.6" stroke="#c9b89c" stroke-width=".6" opacity=".7"/><path d="M10.6 1.4 V14.6" stroke="#5e4c38" stroke-width=".6" opacity=".7"/>
  <path d="M3.4 .9 C2.8 4 3.4 6 3.2 7 M8 10.8 C8.4 13 7.8 14 8 15.2" stroke="#6e5c46" stroke-width=".45" fill="none"/>
  <rect x=".6" y="2.2" width="10.8" height="1.2" fill="#3a3e40"/><rect x=".6" y="12.6" width="10.8" height="1.2" fill="#3a3e40"/>
  <circle cx="2.4" cy="2.8" r=".55" fill="#8a9296"/><circle cx="9.6" cy="2.8" r=".55" fill="#8a9296"/><circle cx="2.4" cy="13.2" r=".55" fill="#8a9296"/><circle cx="9.6" cy="13.2" r=".55" fill="#8a9296"/>
  <path d="M2.6 5.6 L4.2 4.6 L5 5.8 L6.6 4.2 L7.4 5.4 L9.2 5 L8.6 6.8 L10 8 L8.8 9 L9.4 10.8 L7.6 10.4 L6.6 11.6 L5.6 10.4 L3.8 11.2 L4 9.6 L2.2 8.8 L3.4 7.6 Z" fill="#c9b89c" stroke="#3a2a18" stroke-width=".35" stroke-linejoin="round"/>
  <path d="M3.6 6.2 L4.6 5.6 L5.2 6.4 L6.6 5.2 L7.2 6.2 L8.2 6 L7.8 7.2 L8.8 8 L7.8 8.6 L8.2 9.8 L7 9.6 L6.4 10.4 L5.6 9.6 L4.4 10 L4.6 9 L3.4 8.4 L4.2 7.6 Z" fill="#140c06"/></svg>`;

/* ---- the medal of the best captain: ribbon, milled rim, laurel, crossed sabres under a star ---- */
function medal2(S = 64){ const id = V5('md');
  const leaf = (a, r, k) => { const x = Math.cos(a) * r, y = Math.sin(a) * r, d = a * 180 / Math.PI + 90 + k * 28; return `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="1.3" ry="3" transform="rotate(${r1(d)} ${r1(x)} ${r1(y)})" fill="url(#${id}g)" stroke="#5e4210" stroke-width=".35"/>`; };
  let laurel = ''; for(let i = 0; i < 9; i++){ const a1 = Math.PI * (.62 + i * .085), a2 = Math.PI * (.38 - i * .085); laurel += leaf(a1, 13.6, 1) + leaf(a1 + .04, 11.6, -1) + leaf(a2, 13.6, -1) + leaf(a2 - .04, 11.6, 1); }
  const teeth = Array.from({length: 80}, (_, i) => { const a = i / 80 * Math.PI * 2, r = i % 2 ? 19 : 18.4; return (i ? 'L' : 'M') + r1(Math.cos(a) * r) + ' ' + r1(Math.sin(a) * r); }).join(' ') + 'Z';
  return `<svg width="${S}" height="${r1(S * 1.3)}" viewBox="-24 -32 48 62" aria-hidden="true"><defs>
    <linearGradient id="${id}r" x1="0" x2="1"><stop offset="0" stop-color="#4a0e09"/><stop offset=".2" stop-color="#8e2219"/><stop offset=".5" stop-color="#b3352a"/><stop offset=".8" stop-color="#8e2219"/><stop offset="1" stop-color="#4a0e09"/></linearGradient>
    <radialGradient id="${id}f" cx=".36" cy=".3" r=".85"><stop offset="0" stop-color="#fff6c8"/><stop offset=".3" stop-color="#e6c46a"/><stop offset=".7" stop-color="#a77a26"/><stop offset="1" stop-color="#5e4210"/></radialGradient>
    <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbe7a6"/><stop offset=".5" stop-color="#c99a3a"/><stop offset="1" stop-color="#7a5414"/></linearGradient>
    <linearGradient id="${id}s" x1="0" x2="1"><stop offset="0" stop-color="#6c7478"/><stop offset=".5" stop-color="#eef2f3"/><stop offset="1" stop-color="#5d6569"/></linearGradient></defs>
    <path d="M-10 -32 H-1 L1 -12 L-6 -8 Z" fill="url(#${id}r)" stroke="#2a0604" stroke-width=".5"/><path d="M10 -32 H1 L-1 -12 L6 -8 Z" fill="url(#${id}r)" stroke="#2a0604" stroke-width=".5"/>
    <path d="M-7.6 -32 L-3.6 -11 M7.6 -32 L3.6 -11" stroke="#e2bf62" stroke-width=".7" opacity=".8"/><path d="M-4 -32 L-1.4 -14 M4 -32 L1.4 -14" stroke="#e2bf62" stroke-width=".4" opacity=".6"/>
    <rect x="-7" y="-14" width="14" height="4" rx="1" fill="url(#${id}g)" stroke="#5e4210" stroke-width=".5"/><path d="M-6 -13 H6" stroke="#fff6d8" stroke-width=".5" opacity=".7"/>
    <ellipse cx="1.4" cy="3" rx="19.6" ry="19.6" fill="#000" opacity=".35"/>
    <path d="${teeth}" fill="url(#${id}g)" stroke="#4a3208" stroke-width=".4"/>
    <circle r="17.4" fill="url(#${id}f)" stroke="#4a3208" stroke-width=".6"/><circle r="15.6" fill="none" stroke="#7a5a1a" stroke-width=".5"/>
    ${laurel}
    <g transform="rotate(-38)"><path d="M0 -11 L.7 9 L0 10.4 L-.7 9 Z" fill="url(#${id}s)" stroke="#2f3539" stroke-width=".3"/><path d="M-2.4 8.6 H2.4" stroke="#5e4210" stroke-width="1.2"/></g>
    <g transform="rotate(38)"><path d="M0 -11 L.7 9 L0 10.4 L-.7 9 Z" fill="url(#${id}s)" stroke="#2f3539" stroke-width=".3"/><path d="M-2.4 8.6 H2.4" stroke="#5e4210" stroke-width="1.2"/></g>
    <circle r="7.6" fill="#7e1d14" stroke="#4a3208" stroke-width=".6"/><circle r="6.6" fill="none" stroke="#e2bf62" stroke-width=".4"/>
    <path d="M0 -5.6 L1.5 -1.8 L5.4 -1.6 L2.4 .9 L3.4 4.8 L0 2.6 L-3.4 4.8 L-2.4 .9 L-5.4 -1.6 L-1.5 -1.8 Z" fill="url(#${id}g)" stroke="#4a3208" stroke-width=".4"/>
    <path d="M-13 -9 A16 16 0 0 1 2 -16.4" stroke="#fffbe6" stroke-width="1.6" fill="none" opacity=".55" stroke-linecap="round"/><circle cx="-8" cy="-12" r="1.2" fill="#fff" opacity=".8"/></svg>`; }

/* ---- the captain's table: chart, dividers, the compass in its box, quill and ink, candle, spyglass, hourglass, coins ---- */
function chartSheet(w, h){ const id = V5('ch'); let s = `<defs><radialGradient id="${id}p" cx=".5" cy=".5" r=".7"><stop offset="0" stop-color="#f2e2b8"/><stop offset=".8" stop-color="#dcc690"/><stop offset="1" stop-color="#b89a5e"/></radialGradient></defs>`;
  s += `<path d="M0 3 Q${w * .3} 0 ${w * .6} 2 T${w} 1 L${w - 2} ${h - 2} Q${w * .5} ${h + 2} 2 ${h - 1} Z" fill="url(#${id}p)" stroke="#8a6a3a" stroke-width=".8"/>`;
  for(let i = 0; i < 16; i++){ const a = i * Math.PI / 8; s += `<path d="M${w * .62} ${h * .48} L${r1(w * .62 + Math.cos(a) * w)} ${r1(h * .48 + Math.sin(a) * w)}" stroke="#8a6a3a" stroke-width=".35" opacity=".45"/>`; }
  s += `<path d="M${w * .05} ${h * .7} Q${w * .15} ${h * .5} ${w * .28} ${h * .62} T${w * .42} ${h * .42} Q${w * .5} ${h * .3} ${w * .46} ${h * .14} L${w * .3} ${h * .08} Q${w * .12} ${h * .2} ${w * .05} ${h * .7} Z" fill="#cdb27a" stroke="#6b4a24" stroke-width=".7" opacity=".85"/>`;
  s += `<path d="M${w * .74} ${h * .8} q${w * .06} -${h * .12} ${w * .14} -${h * .06} q${w * .02} ${h * .1} -${w * .1} ${h * .14} z" fill="#cdb27a" stroke="#6b4a24" stroke-width=".6"/>`;
  s += `<g transform="translate(${w * .62} ${h * .48})" opacity=".7">${Array.from({length: 8}, (_, i) => { const a = i * Math.PI / 4 - Math.PI / 2, r = i % 2 ? 9 : 16; return `<path d="M0 0 L${r1(Math.cos(a - .3) * 3)} ${r1(Math.sin(a - .3) * 3)} L${r1(Math.cos(a) * r)} ${r1(Math.sin(a) * r)} Z" fill="${i ? '#6b4a24' : '#8e2219'}"/>`; }).join('')}</g>`;
  s += `<path d="M${w * .2} ${h * .86} C${w * .34} ${h * .7} ${w * .48} ${h * .78} ${w * .6} ${h * .58}" stroke="#8e2219" stroke-width=".8" stroke-dasharray="2 2" fill="none"/><path d="M${w * .58} ${h * .62} l3 -1 l-1 3" stroke="#8e2219" stroke-width=".8" fill="none"/>`;
  return s; }
const DIVIDERS = `<g><path d="M0 0 L-6 46 L-4.6 46.4 Z" fill="url(#gBrass)" stroke="#4a3208" stroke-width=".5"/><path d="M0 0 L9 45 L10.4 44.6 Z" fill="url(#gBrass)" stroke="#4a3208" stroke-width=".5"/><path d="M-5.4 44 L-5.6 49 M9.6 43 L10.4 48" stroke="#9aa2a6" stroke-width="1.1"/><circle r="3.4" fill="url(#gBrassR)" stroke="#4a3208" stroke-width=".6"/><circle r="1" fill="#4a3208"/></g>`;
function inkwell(){ return `<g><ellipse cx="0" cy="13" rx="12" ry="3" fill="#000" opacity=".45"/><path d="M-9 2 Q-10 12 -8 13 H8 Q10 12 9 2 Z" fill="#1a2430" stroke="#05080c" stroke-width=".6"/><ellipse cx="0" cy="2" rx="9" ry="2.6" fill="#24303c" stroke="#05080c" stroke-width=".5"/><ellipse cx="0" cy="1.6" rx="4.6" ry="1.4" fill="url(#gBrass)" stroke="#4a3208" stroke-width=".4"/><path d="M-6 4 Q-7 9 -5.4 12" stroke="#7fa0b8" stroke-width=".8" fill="none" opacity=".6"/>
  <path d="M1 1 L22 -40" stroke="#3a2a1a" stroke-width=".8"/><path d="M4 -6 Q14 -26 24 -44 Q26 -34 18 -20 Q12 -10 5 -4 Z" fill="#efe8d8" stroke="#8a7c62" stroke-width=".4"/><path d="M5 -5 Q14 -24 23 -42" stroke="#8a7c62" stroke-width=".4" fill="none"/>${Array.from({length: 7}, (_, i) => `<path d="M${r1(7 + i * 2.4)} ${r1(-9 - i * 4.4)} l4 1" stroke="#c9bfa8" stroke-width=".35"/>`).join('')}</g>`; }
function candle(id){ return `<g><ellipse cx="0" cy="18" rx="14" ry="3.4" fill="#000" opacity=".45"/><ellipse cx="0" cy="16" rx="12" ry="3.4" fill="url(#gBrass)" stroke="#4a3208" stroke-width=".6"/><path d="M-12 16 Q-13 18 -10 19 H10 Q13 18 12 16" fill="#8f6b20"/><path d="M12 15 q6 0 6 4 q0 3 -4 3" fill="none" stroke="url(#gBrass)" stroke-width="1.6"/>
  <rect x="-4.6" y="-14" width="9.2" height="30" rx="1.4" fill="#efe6d0" stroke="#a89c80" stroke-width=".5"/><path d="M-4.6 -12 q2 4 1 8 q-.6 3 .4 5" stroke="#d9cfb4" stroke-width="1.2" fill="none"/><path d="M-3 -14 V12" stroke="#fff" stroke-width="1" opacity=".5"/>
  <path d="M0 -14 V-17" stroke="#2a2020" stroke-width=".8"/><g class="flick"><path d="M0 -33 C3 -27 4.4 -22 2.6 -18.6 C1.6 -17 -1.6 -17 -2.6 -18.6 C-4.4 -22 -3 -27 0 -33 Z" fill="#ffc14a"/><path d="M0 -28 C1.4 -25 2 -22 1 -19.6 C.4 -18.8 -.4 -18.8 -1 -19.6 C-2 -22 -1.4 -25 0 -28 Z" fill="#fff6d0"/></g></g>`; }
const SPYGLASS = `<g><ellipse cx="44" cy="7" rx="48" ry="3" fill="#000" opacity=".4"/><rect x="0" y="-3.4" width="30" height="6.8" rx="1" fill="url(#gWoodD)" stroke="#1e1008" stroke-width=".5"/><rect x="28" y="-4.2" width="5" height="8.4" rx="1" fill="url(#gBrass)" stroke="#4a3208" stroke-width=".5"/><rect x="33" y="-3" width="26" height="6" rx="1" fill="url(#gBrass)" stroke="#4a3208" stroke-width=".5"/><rect x="58" y="-3.6" width="3" height="7.2" rx=".6" fill="url(#gBrass)" stroke="#4a3208" stroke-width=".5"/><rect x="61" y="-2.4" width="22" height="4.8" rx="1" fill="url(#gBrass)" stroke="#4a3208" stroke-width=".5"/><rect x="82" y="-3.2" width="5" height="6.4" rx="1" fill="url(#gBrass)" stroke="#4a3208" stroke-width=".5"/><path d="M2 -2 H28 M34 -1.8 H58 M62 -1.4 H82" stroke="#fff6d8" stroke-width=".7" opacity=".6"/><ellipse cx="0" cy="0" rx="1.4" ry="3.4" fill="#1a2a34"/></g>`;
const HOURGLASS = `<g><ellipse cx="0" cy="25" rx="14" ry="3" fill="#000" opacity=".45"/><rect x="-12" y="-24" width="24" height="4" rx="1" fill="url(#gWoodD)" stroke="#1e1008" stroke-width=".5"/><rect x="-12" y="20" width="24" height="4" rx="1" fill="url(#gWoodD)" stroke="#1e1008" stroke-width=".5"/>${[-10, 10].map(x => `<path d="M${x} -20 V20" stroke="url(#gBrass)" stroke-width="1.6"/>`).join('')}<path d="M-7 -20 Q-7 -6 0 0 Q-7 6 -7 20 H7 Q7 6 0 0 Q7 -6 7 -20 Z" fill="rgba(220,236,240,.35)" stroke="#a9cbd2" stroke-width=".5"/><path d="M-4.6 -12 Q0 -10 4.6 -12 Q3 -4 0 -1 Q-3 -4 -4.6 -12 Z M0 0 V12 M-6 20 Q0 11 6 20 Z" fill="#d9b562" stroke="#d9b562" stroke-width=".4"/><path d="M-5 -18 Q-5 -10 -2 -4" stroke="#fff" stroke-width=".8" fill="none" opacity=".6"/></g>`;
const coins = (n = 5) => Array.from({length: n}, (_, i) => { const x = (i * 9) % 28 - 8, y = (i * 5) % 12; return `<ellipse cx="${x + 1}" cy="${y + 1.6}" rx="6" ry="3" fill="#000" opacity=".35"/><ellipse cx="${x}" cy="${y}" rx="6" ry="3" fill="url(#gBrassR)" stroke="#4a3208" stroke-width=".5"/><ellipse cx="${x}" cy="${y}" rx="3.6" ry="1.7" fill="none" stroke="#7a5414" stroke-width=".4"/>`; }).join('');

/* the gimbal compass in its box, for the captain's table */
function gimbalBox(id, x, y, r, rot = 0){ return boxedCompass(id, x, y, r, rot).replace('<g class="cmpg">', `<circle r="${r1(r * 1.08)}" fill="none" stroke="url(#gBrass)" stroke-width="${r1(r * .09)}"/><circle r="${r1(r * 1.08)}" fill="none" stroke="#4a3208" stroke-width=".5"/>${[0, 180].map(d => `<g transform="rotate(${d})"><rect x="${r1(-r * .08)}" y="${r1(-r * 1.2)}" width="${r1(r * .16)}" height="${r1(r * .2)}" rx="1" fill="url(#gBrassR)" stroke="#4a3208" stroke-width=".4"/></g>`).join('')}<g class="cmpg">`); }
function captainTable(W, H, L){ const id = V5('ct');
  let s = `<svg class="abs" style="left:0;top:0" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${gradDefs()}${defs2()}
  <defs><radialGradient id="${id}l" cx="${L.lx / W}" cy="${L.ly / H}" r="${L.r / W}" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#ffbe5a" stop-opacity=".42"/><stop offset=".5" stop-color="#ff9a30" stop-opacity=".12"/><stop offset="1" stop-color="#ff8a20" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}d" cx="${L.lx / W}" cy="${L.ly / H}" r="${(L.r * 1.7) / W}" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".6" stop-color="#000" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></radialGradient></defs>
  <rect width="${W}" height="${H}" fill="#4a2a16"/>${Array.from({length: Math.ceil(H / 46)}, (_, i) => `<rect y="${i * 46}" width="${W}" height="46" fill="hsl(${18 + (i % 3) * 3} 42% ${15 + (i % 2) * 2}%)"/><path d="M0 ${i * 46 + 46} H${W}" stroke="#140a04" stroke-width="1.6"/>${Array.from({length: 5}, (_, k) => `<path d="M0 ${i * 46 + 8 + k * 8} Q${W / 3} ${i * 46 + 6 + k * 8 + (k % 2 ? 3 : -2)} ${W} ${i * 46 + 9 + k * 8}" stroke="#000" stroke-opacity=".1" stroke-width=".8" fill="none"/>`).join('')}`).join('')}
  <g transform="translate(${L.chart[0]} ${L.chart[1]}) rotate(${L.chart[4] || 0})"><rect x="4" y="6" width="${L.chart[2]}" height="${L.chart[3]}" fill="#000" opacity=".35"/>${chartSheet(L.chart[2], L.chart[3])}</g>
  ${L.div ? `<g transform="translate(${L.div[0]} ${L.div[1]}) rotate(${L.div[2]})">${DIVIDERS}</g>` : ''}
  ${L.coins ? `<g transform="translate(${L.coins[0]} ${L.coins[1]})">${coins(L.coins[2])}</g>` : ''}
  ${L.spy ? `<g transform="translate(${L.spy[0]} ${L.spy[1]}) rotate(${L.spy[2]}) scale(${L.spy[3] || 1})">${SPYGLASS}</g>` : ''}
  ${L.hour ? `<g transform="translate(${L.hour[0]} ${L.hour[1]}) scale(${L.hour[2] || 1})">${HOURGLASS}</g>` : ''}
  ${L.ink ? `<g transform="translate(${L.ink[0]} ${L.ink[1]}) scale(${L.ink[2] || 1})">${inkwell()}</g>` : ''}
  ${gimbalBox(id, ...L.compass)}
  <rect width="${W}" height="${H}" fill="url(#${id}d)"/><rect width="${W}" height="${H}" fill="url(#${id}l)" style="mix-blend-mode:screen"/>
  <g transform="translate(${L.lx} ${L.ly + 26}) scale(${L.ls})">${candle(id)}</g><circle cx="${L.lx}" cy="${L.ly}" r="${40 * L.ls}" fill="url(#gFlash)" opacity=".14" class="flick"/></svg>`;
  return s.replace(/<g class="g-compass">/, '<g>'); }
