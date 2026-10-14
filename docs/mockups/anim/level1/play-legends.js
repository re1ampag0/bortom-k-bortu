/* =====================================================================================================
   play-legends.js — ЛЕГЕНДЫ: общий торжественный выход + свой эффект у каждой из четырёх.
   Переносится в игру как src/ui/game/fx/legends.ts (задача L1).

   Откуда приёмы (см. ПЛАН, «Источники»):
   · Hearthstone — у легендарных карт свой выход (уникальная музыка и золотая «драконья» рамка):
     у нас без звука, поэтому «музыку» заменяет своя постановка у каждой Легенды и золотая рамка;
   · Marvel Snap — «сплит-эффекты»: золотой фон, бегущий по рамке блик, всплывающие искры,
     персонаж выходит за рамку карты (frame break);
   · «ощущение удара»: стоп-кадр 50–100 мс, вспышка 50–100 мс, тряска 2–3 px (слабо) / 8–10 px
     (сильно), 20–30 частиц на удар, всплывающий текст 1–2 с; предвосхищение перед ударом.

   Тайминг на скорости «обычно» (×1): выход 0–2,2 с → эффект 1,6–2,4 с → уход 0,35 с.
   Всё — transform и opacity в слое эффектов (pointer-events: none): игра не блокируется,
   нажатие по столу показывает итог (page.js → skip).
   ===================================================================================================== */
'use strict';
let LG_UID = 0;
const LG_T = { bars: 120, card: 280, land: 780, seal: 820, title: 900, leave: 1900, effect: 2230 };

/* ——— свои иллюстрации (без кадров и образов из фильмов) ——— */
function galleonSVG(flag = '#9C7A2C') {
  return `<svg viewBox="0 0 120 96" width="120" height="96"><g stroke="#3d2614" stroke-width="2">
<path d="M34 22 V70 M60 6 V70 M86 18 V70" stroke="#4a3220" stroke-width="2.6"/>
<path d="M22 22 Q34 18 46 22 Q48 36 46 48 Q34 45 22 48 Q20 36 22 22Z" fill="#fff6e0" stroke="#c9b48c"/>
<path d="M44 12 Q60 8 76 12 Q79 30 76 46 Q60 42 44 46 Q41 30 44 12Z" fill="#fffaf0" stroke="#c9b48c"/>
<path d="M74 20 Q86 16 98 20 Q100 34 98 46 Q86 43 74 46 Q72 34 74 20Z" fill="#fff6e0" stroke="#c9b48c"/>
<path d="M44 50 Q60 47 76 50 Q77 58 76 64 Q60 62 44 64 Q43 58 44 50Z" fill="#fff6e0" stroke="#c9b48c"/>
<path d="M60 6 l16 4 l-16 4z M34 22 l11 3 l-11 3z M86 18 l11 3 l-11 3z" fill="${flag}" stroke="none"/>
<path d="M6 64 H114 L104 86 Q60 96 16 86 Z" fill="#6b4423"/></g>
<path d="M10 71 H110" stroke="#d8b25a" stroke-width="2.4"/>
<g fill="#1e1a17">${[22, 36, 50, 64, 78, 92].map((x) => `<rect x="${x}" y="75" width="7" height="6" rx="1.5"/>`).join('')}</g></svg>`;
}
function tentacleInner(uid) {
  return `<defs><linearGradient id="tg${uid}" x1="0" x2="1"><stop offset="0" stop-color="#2b3f3a"/><stop offset=".55" stop-color="#4f6e62"/><stop offset="1" stop-color="#22322e"/></linearGradient></defs>
<path d="M14 200 C6 150 36 128 30 92 C25 62 6 48 16 24 C22 8 40 2 48 12 C54 20 46 30 38 26 C34 34 42 44 40 60 C38 86 52 108 48 142 C45 172 52 188 50 200Z" fill="url(#tg${uid})" stroke="#16211e" stroke-width="2"/>
<g fill="#cfe3d8" opacity=".9">${[[42, 150, 4], [41, 128, 3.6], [40, 106, 3.2], [36, 84, 2.8], [33, 64, 2.4], [32, 46, 2], [36, 32, 1.6]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.8}"/>`).join('')}</g>`;
}
function tentacleSVG(h, flip, uid) {
  const w = Math.round(h * 0.3);
  return `<svg viewBox="0 0 60 200" width="${w}" height="${h}" preserveAspectRatio="none" style="display:block"><g ${flip ? 'transform="translate(60 0) scale(-1 1)"' : ''}>${tentacleInner(uid)}</g></svg>`;
}
function eyeSVG(uid) {
  return `<svg viewBox="0 0 160 70" width="160" height="70"><defs><radialGradient id="iris${uid}"><stop offset="0" stop-color="#fff2a8"/><stop offset=".55" stop-color="#e8b830"/><stop offset="1" stop-color="#7a4a08"/></radialGradient></defs>
<path d="M4 35 Q80 -16 156 35 Q80 86 4 35Z" fill="#14201c" stroke="#0a110f" stroke-width="3"/>
<ellipse cx="80" cy="35" rx="25" ry="25" fill="url(#iris${uid})"/><ellipse class="pupil" cx="80" cy="35" rx="5" ry="21" fill="#0b0a08" style="transform-box:fill-box;transform-origin:center"/>
<circle cx="71" cy="26" r="4" fill="#fff" opacity=".85"/></svg>`;
}
function bottleSVG() {
  return `<svg viewBox="0 0 120 200" width="100%" height="100%">
<path d="M46 12 h28 v36 q0 10 14 22 q22 18 22 46 v66 q0 12 -12 12 h-76 q-12 0 -12 -12 v-66 q0 -28 22 -46 q14 -12 14 -22z" fill="rgba(150,210,180,.22)" stroke="#5d8a74" stroke-width="3"/>
<path d="M10 160 q25 -8 50 0 t50 0 v22 q0 12 -12 12 h-76 q-12 0 -12 -12z" fill="#5e9cc0" opacity=".5"/>
<g class="mini" style="transform-box:fill-box;transform-origin:50% 100%"><path d="M34 158 h52 l-8 11 h-36z" fill="#3a2a1e"/><path d="M60 156 v-42 l19 36z" fill="#fff6e0" stroke="#c9b48c"/><path d="M57 156 v-32 l-15 28z" fill="#fff6e0" stroke="#c9b48c"/><path d="M60 114 l9 3 l-9 3z" fill="#2c6658"/></g>
<path d="M22 100 q0 -18 12 -28" stroke="#fff" stroke-width="5" opacity=".55" fill="none" stroke-linecap="round"/>
<path d="M98 120 v40" stroke="#fff" stroke-width="3" opacity=".35" fill="none" stroke-linecap="round"/>
<g class="cork" style="transform-box:fill-box;transform-origin:center"><path d="M47 0 h26 l-2 16 h-22z" fill="#9a6a3a" stroke="#5a3a1c" stroke-width="2"/><path d="M50 6 h20" stroke="#5a3a1c" stroke-width="1.5"/></g></svg>`;
}
function compassSVG() {
  const pts = [];
  for (let k = 0; k < 16; k++) {
    const a = (k * Math.PI) / 8, len = k % 4 === 0 ? 132 : k % 2 === 0 ? 92 : 62, wd = k % 4 === 0 ? 14 : 9;
    const tip = [Math.sin(a) * len, -Math.cos(a) * len], l = [Math.sin(a - Math.PI / 2) * wd, -Math.cos(a - Math.PI / 2) * wd], r = [-l[0], -l[1]];
    pts.push(`<polygon points="${tip} ${l} 0,0" fill="${k % 4 === 0 ? '#f6d77a' : '#e0c27a'}"/><polygon points="${tip} ${r} 0,0" fill="${k % 4 === 0 ? '#a27419' : '#8a6416'}"/>`);
  }
  const letters = [['С', 0], ['В', 90], ['Ю', 180], ['З', 270]].map(([t, d]) => { const a = (d * Math.PI) / 180; return `<text x="${Math.sin(a) * 112}" y="${-Math.cos(a) * 112 + 6}" text-anchor="middle" font-family="Alegreya, Georgia, serif" font-weight="800" font-size="18" fill="#fff3c4">${t}</text>`; }).join('');
  return `<svg viewBox="-150 -150 300 300" width="100%" height="100%"><circle r="143" fill="rgba(20,16,12,.35)" stroke="#e0b44c" stroke-width="3"/><circle r="128" fill="none" stroke="#e0b44c" stroke-width="1.2" stroke-dasharray="2 7"/><circle r="100" fill="none" stroke="#e0b44c" stroke-width="1" opacity=".6"/>${pts.reverse().join('')}${letters}<circle r="9" fill="#2a1c0e" stroke="#e0b44c" stroke-width="2"/></svg>`;
}
function sealSVG(uid) {
  return `<svg viewBox="0 0 92 92" width="92" height="92"><defs><path id="arc${uid}" d="M46 19 a27 27 0 1 1 0 54 a27 27 0 1 1 0 -54"/></defs>
<path d="M46 3 C58 2 66 9 75 12 C84 18 86 28 89 38 C92 50 86 58 84 68 C78 80 68 84 56 88 C44 92 34 88 24 84 C12 78 8 68 4 58 C0 46 4 36 8 26 C14 14 24 8 34 5 C38 4 42 3 46 3Z" fill="#9e2b25"/>
<circle cx="46" cy="46" r="36" fill="none" stroke="#6e1a12" stroke-width="2"/><circle cx="46" cy="46" r="19" fill="#b23a2e" stroke="#6e1a12" stroke-width="1.5"/>
<text font-size="9.4" font-weight="800" fill="#ffe0c8" font-family="Alegreya Sans, system-ui, sans-serif"><textPath href="#arc${uid}" textLength="162" lengthAdjust="spacing">ЛЕГЕНДА • ЛЕГЕНДА •</textPath></text>
<path d="M46 32 l4 9.5 10 .8 -7.6 6.6 2.4 9.8 -8.8 -5.4 -8.8 5.4 2.4 -9.8 -7.6 -6.6 10 -.8z" fill="#ffe0c8"/></svg>`;
}
/* Иллюстрации карт Легенд и «выход за рамку» (элемент поверх верхнего края карты). */
const LG_ART = {
  'Ж-Л': {
    bg: 'linear-gradient(#1b2b3a, #3b6280 62%, #8fb7cc)',
    svg: `<svg viewBox="0 0 188 128" width="188" height="128"><g opacity=".35" transform="translate(94 64) scale(.42)">${compassSVG().replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g><path d="M0 108 Q30 94 60 106 T120 104 T188 100 V128 H0Z" fill="#24465c"/><g transform="translate(70 52) rotate(-12)"><path d="M0 40 h56 l-9 11 h-38z" fill="#1e1a17"/><path d="M28 38 v-36 l17 31z" fill="#2a241d"/><path d="M25 38 v-28 l-14 25z" fill="#2a241d"/><path d="M28 2 l10 3 l-10 3z" fill="#a3341f"/></g><path d="M40 112 q14 -18 30 -8" stroke="#fff" stroke-width="3" fill="none" opacity=".7" stroke-linecap="round"/></svg>`,
    pop: `<svg viewBox="-30 -30 60 60" width="62" height="62"><polygon points="0,-28 6,-6 0,0" fill="#f6d77a"/><polygon points="0,-28 -6,-6 0,0" fill="#a27419"/><polygon points="28,0 6,6 0,0" fill="#f6d77a"/><polygon points="28,0 6,-6 0,0" fill="#a27419"/><polygon points="0,28 -6,6 0,0" fill="#f6d77a"/><polygon points="0,28 6,6 0,0" fill="#a27419"/><polygon points="-28,0 -6,-6 0,0" fill="#f6d77a"/><polygon points="-28,0 -6,6 0,0" fill="#a27419"/><circle r="4" fill="#2a1c0e" stroke="#e0b44c"/></svg>`,
  },
  'М-Л': {
    bg: 'linear-gradient(#20312a, #3e6152 60%, #7fa99a)',
    svg: `<svg viewBox="0 0 188 128" width="188" height="128"><g transform="translate(94 66) rotate(-68) translate(-34 -56) scale(.56)">${bottleSVG().replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g><path d="M0 112 Q40 102 94 110 T188 106 V128 H0Z" fill="#24465c" opacity=".8"/></svg>`,
    pop: `<svg viewBox="0 0 40 40" width="40" height="40"><path d="M10 4 h20 l-3 22 h-14z" fill="#9a6a3a" stroke="#5a3a1c" stroke-width="2"/><path d="M13 10 h14" stroke="#5a3a1c" stroke-width="1.5"/><circle cx="34" cy="8" r="2" fill="#fff3c4"/><circle cx="6" cy="14" r="1.6" fill="#fff3c4"/></svg>`,
  },
  'И-Л': {
    bg: 'linear-gradient(#3a2a12, #8a6a2a 55%, #d8b25a)',
    svg: `<svg viewBox="0 0 188 128" width="188" height="128"><g transform="translate(-6 40) scale(.62)">${galleonSVG().replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g><g transform="translate(56 26) scale(.8)">${galleonSVG().replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g><g transform="translate(120 40) scale(.62)">${galleonSVG().replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g><path d="M0 110 Q47 100 94 108 T188 104 V128 H0Z" fill="#24465c"/></svg>`,
    pop: `<svg viewBox="0 0 60 40" width="60" height="40"><path d="M8 38 V4" stroke="#4a3220" stroke-width="3"/><path d="M8 4 l44 6 l-10 7 l10 7 l-44 -4z" fill="#9C7A2C" stroke="#5a4210" stroke-width="1.5"/><path d="M16 12 h20" stroke="#fff3c4" stroke-width="2"/></svg>`,
  },
  'Г-Л': {
    bg: 'linear-gradient(#0e1c1c, #1f3c3a 55%, #3d6a62)',
    svg: `<svg viewBox="0 0 188 128" width="188" height="128"><g transform="translate(64 20) scale(.38)">${eyeSVG('a').replace(/^<svg[^>]*>|<\/svg>$/g, '').replace(/iris\w+/g, 'irisArt')}</g><g transform="translate(12 18) scale(.56)">${tentacleInner('a1')}</g><g transform="translate(176 26) scale(-.5 .5)">${tentacleInner('a2')}</g><path d="M0 108 Q47 96 94 106 T188 100 V128 H0Z" fill="#0b1a1a"/></svg>`,
    pop: `<svg viewBox="0 0 60 70" width="54" height="64"><path d="M14 70 C6 52 30 40 28 26 C26 14 14 12 18 6 C22 0 36 2 38 12 C40 20 32 22 30 18 C34 30 46 38 44 54 C43 62 46 66 46 70Z" fill="#3d5a50" stroke="#16211e" stroke-width="2"/><g fill="#cfe3d8"><circle cx="36" cy="52" r="2.6"/><circle cx="34" cy="40" r="2.2"/><circle cx="31" cy="30" r="1.8"/></g></svg>`,
  },
};

function lgCardHTML(code) {
  const c = G.cards[code], art = LG_ART[code] || { bg: 'linear-gradient(#3a2a12,#d8b25a)', svg: '', pop: '' };
  const cost = [c.cost ? `${c.cost} П` : '', c.soul ? `${c.soul} Д` : ''].filter(Boolean).join(' + ');
  return `<div class="back"><svg viewBox="-30 -30 60 60" width="70" height="70"><circle r="26" fill="none" stroke="#e0b44c" stroke-width="2"/><path d="M0 -20 v34 M-12 -8 h24 M-16 6 q16 18 32 0" stroke="#e0b44c" stroke-width="3" fill="none" stroke-linecap="round"/><circle cy="-22" r="4" fill="none" stroke="#e0b44c" stroke-width="2"/></svg></div>` +
    `<div class="frame"><div class="inner"><div class="art" style="background:${art.bg}">${art.svg}<span class="kind">ЛЕГЕНДА · ${c.type}</span>${cost ? `<span class="cost">${cost}</span>` : ''}</div>` +
    `<div class="body"><div class="name">${esc(c.name)}</div><div class="big">${esc(c.big)}</div></div><div class="shine"></div></div><div class="lg-pop">${art.pop}</div></div>`;
}

/** Откуда появляется Легенда: значок «Легенда» на планшете владельца (на телефоне — звёздочка в шапке). */
function legendOrigin(ship) {
  const p = plank(ship);
  const el = [p.querySelector('[data-fx-legend]'), p.querySelector('.star'), p.querySelector('.plank-head')].find(visible);
  const b = bx(el || p);
  return { x: b.cx, y: b.cy };
}

/**
 * Общий выход Легенды. Возвращает функцию ухода (снимает полосы и подпись).
 * 0       — плата: бочонки/Души; вокруг корабля-владельца золотое сияние;
 * 120     — киношные полосы сверху и снизу с золотым кантом, стол темнеет;
 * 280–780 — карта вылетает из значка «Легенда», переворачивается (рубашка → лицо), растёт с перелётом;
 * 780     — удар: стоп-кадр 80 мс, вспышка, золотая пыль (26 частиц), кольцо, тряска стола 6 px;
 * 820     — сургучная печать «ЛЕГЕНДА» падает на карту, карта вздрагивает; персонаж «выходит за рамку»;
 * 900     — блик бежит по карте; по рамке кружат две искры; снизу поднимаются золотые пылинки;
 * 900     — разворачивается свиток: название и капитан;
 * 1900    — карта, печать и свиток улетают в верхнюю полосу и превращаются в подпись «ЛЕГЕНДА · …»,
 *           полосы становятся тоньше, затемнение уходит — дальше на открытом столе идёт эффект.
 */
async function legendIntro(code, owner, run, { cost = 0, soulCost = 0, side } = {}) {
  const W = board.clientWidth, H = board.clientHeight, k = Math.min(1, W / 640), uid = ++LG_UID;
  const c = G.cards[code], sh = G.ships[owner];
  const cx = W / 2, cy = H * 0.42;
  hint(`${nick(owner)}: ЛЕГЕНДА «${c.name}»`);
  // плата
  if (cost) payKegs(side || sideOf(owner), cost, 0);
  // сияние вокруг корабля-владельца
  const ob = bx(plank(owner));
  const aura = overlayAt('lg-aura', ob, 6);
  A(aura, [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0.8, offset: 0.7 }, { opacity: 0 }], 900, 0, 'ease-in-out');
  // полосы и затемнение
  const barH = Math.round(H * (W < 701 ? 0.075 : 0.11));
  const top = mk('lg-bar top', 0, 0), bot = mk('lg-bar bottom', 0, H - barH);
  for (const b of [top, bot]) { b.style.width = W + 'px'; b.style.height = barH + 'px'; }
  A(top, [{ opacity: 1, transform: 'translateY(-100%)' }, { opacity: 1, transform: 'none' }], 300, LG_T.bars, 'cubic-bezier(.2,.8,.3,1)');
  A(bot, [{ opacity: 1, transform: 'translateY(100%)' }, { opacity: 1, transform: 'none' }], 300, LG_T.bars, 'cubic-bezier(.2,.8,.3,1)');
  const veil = mk('lg-veil', 0, 0); veil.style.width = W + 'px'; veil.style.height = H + 'px';
  A(veil, [{ opacity: 0 }, { opacity: 1 }], 350, LG_T.bars);
  // лучи и свечение за картой
  let sun = null, glow = null;
  if (RICH) {
    sun = mk('lg-sun', cx, cy);
    A(sun, [{ opacity: 0, transform: 'scale(.5) rotate(0deg)' }, { opacity: 1, transform: 'scale(1) rotate(25deg)', offset: 0.25 }, { opacity: 1, transform: 'scale(1.05) rotate(60deg)' }], 1700, LG_T.card + 200, 'linear');
  }
  glow = mk('lg-glow', cx, cy);
  A(glow, [{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'scale(1.15)', offset: 0.45 }, { opacity: 0.85, transform: 'scale(1)' }], 900, LG_T.land - 250, 'ease-out');
  // карта
  const card = mk('lg-card', 0, 0, lgCardHTML(code));
  const from = legendOrigin(owner);
  const S = W >= 900 ? 1.3 : W >= 640 ? 1.1 : Math.max(0.82, k);
  const pose = (x, y, ry, s, r = 0) => `translate(${x}px,${y}px) translate(-50%,-50%) perspective(900px) rotateY(${ry}deg) rotate(${r}deg) scale(${s})`;
  const flight = A(card, [
    { opacity: 0, transform: pose(from.x, from.y, 180, 0.12, -10) },
    { opacity: 1, transform: pose(from.x, from.y, 180, 0.2, -10), offset: 0.08 },
    { opacity: 1, transform: pose((from.x + cx) / 2, Math.min(from.y, cy) - 60, 90, S * 0.75, -4), offset: 0.55 },
    { opacity: 1, transform: pose(cx, cy, 0, S * 1.12, 0), offset: 0.86 },
    { opacity: 1, transform: pose(cx, cy, 0, S, 0) },
  ], LG_T.land - LG_T.card + 80, LG_T.card, 'cubic-bezier(.3,0,.25,1)');
  // удар: стоп-кадр — карта замирает в позе перелёта на 80 мс («hit-stop»), вспышка, пыль, кольцо, тряска
  at(LG_T.land, run, () => { flight.pause(); setTimeout(() => flight.play(), ms(80)); });
  flash(cx, cy, LG_T.land, 3.2);
  ring(cx, cy, LG_T.land, 3, '#e0b44c');
  ring(cx, cy, LG_T.land + 120, 4.2, '#fff0b8');
  burst('gold-dust', cx, cy, LG_T.land, 26, 70 * k, 190 * k, 900);
  at(LG_T.land, run, () => shake(board, 0, 6, 200));
  // «персонаж выходит за рамку»
  const popEl = card.querySelector('.lg-pop');
  A(popEl, [{ opacity: 0, transform: 'translateY(26px) scale(.6)' }, { opacity: 1, transform: 'translateY(-4px) scale(1.12)', offset: 0.7 }, { opacity: 1, transform: 'translateY(0) scale(1)' }], 420, LG_T.land + 60, 'cubic-bezier(.2,.8,.3,1.3)');
  // печать
  const cardH = 230 * S;
  const sealPos = { x: cx + 100 * S, y: cy - cardH / 2 + 92 * S }; // правый край, на уровне картинки — не закрывает название
  const seal = mk('lg-seal', 0, 0, sealSVG(uid));
  A(seal, [{ opacity: 0, transform: `translate(${sealPos.x}px,${sealPos.y}px) scale(${2.8 * S}) rotate(-35deg)` }, { opacity: 1, transform: `translate(${sealPos.x}px,${sealPos.y}px) scale(${0.82 * S}) rotate(-10deg)`, offset: 0.8 }, { opacity: 1, transform: `translate(${sealPos.x}px,${sealPos.y}px) scale(${0.9 * S}) rotate(-12deg)` }], 260, LG_T.seal, 'cubic-bezier(.6,0,.9,.6)');
  burst('dust', sealPos.x, sealPos.y, LG_T.seal + 210, 10, 14 * k, 40 * k, 500);
  at(LG_T.seal + 210, run, () => A(card, [{ translate: '0 0' }, { translate: '-3px 2px' }, { translate: '3px -1px' }, { translate: '0 0' }], 160, 0, 'linear', 'none'));
  // блик, искры по рамке, пылинки
  A(card.querySelector('.shine'), [{ transform: 'translateX(-60%)' }, { transform: 'translateX(60%)' }], 650, LG_T.seal - 40, 'ease-in-out', 'forwards');
  A(card.querySelector('.shine'), [{ transform: 'translateX(-60%)' }, { transform: 'translateX(60%)' }], 650, LG_T.leave - 450, 'ease-in-out', 'forwards');
  if (RICH) {
    const hw = 103 * S, hh = cardH / 2;
    const corners = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh], [-hw, -hh]];
    for (const [ph, d] of [[0, 1], [2, -1]]) {
      const sp = mk('sparkle lg-orbit', 0, 0);
      const seq = [...corners.slice(ph), ...corners.slice(1, ph + 1)];
      if (d < 0) seq.reverse();
      A(sp, seq.map(([x, y], i) => ({ offset: i / (seq.length - 1), opacity: 1, transform: `translate(${cx + x}px,${cy + y}px) scale(1.4)` })), 1100, LG_T.land + 100, 'linear');
      A(sp, seq.map(([x, y], i) => ({ offset: i / (seq.length - 1), opacity: i === seq.length - 1 ? 0 : 1, transform: `translate(${cx + x}px,${cy + y}px) scale(1.4)` })), 1100, LG_T.land + 1200, 'linear', 'forwards');
    }
    for (let q = 0; q < 16; q++) {
      const m = mk('gold-dust', 0, 0);
      const x = cx + (Math.random() - 0.5) * 300 * k, y = cy + cardH / 2 + 20;
      A(m, [{ opacity: 0, transform: `translate(${x}px,${y}px) scale(.6)` }, { opacity: 1, offset: 0.25 }, { opacity: 0, transform: `translate(${x + (Math.random() - 0.5) * 40}px,${y - 140 - Math.random() * 90}px) scale(1.2)` }], 1300 + Math.random() * 500, LG_T.land + q * 55, 'ease-out');
    }
  }
  // свиток с названием
  const ty = Math.min(H - barH - 34, cy + cardH / 2 + 30);
  const title = mk('lg-title', cx, ty, `<div class="scroll"><div class="t">${esc(c.name)}</div><div class="s">${esc(sh.name)} · ${esc(sh.captain)}</div></div>`);
  title.style.fontSize = '';
  title.style.transform = `translate(-50%,-50%) scale(${k < 0.8 ? 0.82 : 1})`;
  A(title, [{ opacity: 0 }, { opacity: 1 }], 150, LG_T.title);
  A(title.querySelector('.scroll'), [{ transform: 'scaleX(0.04)' }, { transform: 'scaleX(1.04)', offset: 0.8 }, { transform: 'scaleX(1)' }], 380, LG_T.title, 'cubic-bezier(.2,.8,.3,1)');
  A(title.querySelector('.t'), [{ opacity: 0, transform: 'scale(1.25)' }, { opacity: 1, transform: 'scale(1)' }], 300, LG_T.title + 150, 'ease-out');
  A(title.querySelector('.s'), [{ opacity: 0 }, { opacity: 1 }], 250, LG_T.title + 300);
  // Души «Кракена» питают карту
  if (soulCost) {
    const badge = plank(owner).querySelector('[data-fx-souls]');
    const sb = badge && visible(badge) ? bx(badge) : ob;
    for (let q = 0; q < soulCost; q++) wisp({ x: sb.cx, y: sb.cy }, { x: cx, y: cy }, LG_T.card + q * 140, 700);
    tag(sb.cx, sb.y - 14, `−${soulCost} Души`, LG_T.card, '', 1300);
  }
  // уход в верхнюю полосу
  const capY = barH / 2;
  A(card, [{ opacity: 1, transform: pose(cx, cy, 0, S) }, { opacity: 0, transform: pose(cx, capY, 0, 0.16) }], 380, LG_T.leave, 'cubic-bezier(.5,0,.75,0)', 'forwards');
  A(seal, [{ opacity: 1, transform: `translate(${sealPos.x}px,${sealPos.y}px) scale(${0.9 * S}) rotate(-12deg)` }, { opacity: 0, transform: `translate(${cx + 20}px,${capY}px) scale(.2) rotate(-12deg)` }], 380, LG_T.leave, 'cubic-bezier(.5,0,.75,0)', 'forwards');
  A(title, [{ opacity: 1, transform: `translate(-50%,-50%) scale(${k < 0.8 ? 0.82 : 1})` }, { opacity: 0, transform: `translate(-50%,-50%) translateY(${capY - ty}px) scale(.3)` }], 380, LG_T.leave, 'cubic-bezier(.5,0,.75,0)', 'forwards');
  A(veil, [{ opacity: 1 }, { opacity: 0 }], 350, LG_T.leave + 80, 'ease-in', 'forwards');
  A(glow, [{ opacity: 0.85 }, { opacity: 0 }], 350, LG_T.leave, 'ease-in', 'forwards');
  if (sun) A(sun, [{ opacity: 1, transform: 'scale(1.05) rotate(60deg)' }, { opacity: 0, transform: 'scale(1.2) rotate(75deg)' }], 380, LG_T.leave, 'ease-in', 'forwards');
  // полосы тоньше, подпись в верхней полосе
  const thin = 0.55;
  A(top, [{ transform: 'none' }, { transform: `scaleY(${thin})` }], 300, LG_T.leave + 150, 'ease-in-out', 'forwards');
  A(bot, [{ transform: 'none' }, { transform: `scaleY(${thin})` }], 300, LG_T.leave + 150, 'ease-in-out', 'forwards');
  const cap = mk('lg-cap', cx, (barH * thin) / 2, `<span>ЛЕГЕНДА</span> <b>${esc(c.name)}</b>`);
  A(cap, [{ opacity: 0, transform: 'translate(-50%,-50%) scale(.7)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)' }], 300, LG_T.leave + 260, 'ease-out');
  await wait(LG_T.effect, run);
  return async () => {
    A(top, [{ transform: `scaleY(${thin})` }, { transform: 'translateY(-100%)' }], 320, 0, 'ease-in', 'forwards');
    A(bot, [{ transform: `scaleY(${thin})` }, { transform: 'translateY(100%)' }], 320, 0, 'ease-in', 'forwards');
    A(cap, [{ opacity: 1 }, { opacity: 0 }], 200, 0, 'ease-in', 'forwards');
    await wait(340, run);
  };
}

/** Единицы урона по событиям damage: каждая — отдельный снаряд/удар в свою клетку (как ядра Залпа). */
function damageUnits(effects) {
  const shown = {};
  const now = (s, t) => { const key = s + t; if (shown[key] == null) shown[key] = shownTrack(s, t); return key; };
  const units = [];
  for (const e of effects) {
    if (e.type !== 'damage') continue;
    for (const [tr, n] of [[e.track, e.amount], ['hull', e.toHull]]) {
      const key = now(e.ship, tr);
      for (let j = 0; j < n; j++) { shown[key] -= 1; units.push({ ship: e.ship, track: tr, idx: shown[key], v: Math.max(0, shown[key]) }); }
    }
  }
  return units;
}
/** Пилюли «−N» по каждой шкале после серии ударов. */
function damagePills(units, delay) {
  const tot = {};
  for (const u of units) { const key = u.ship + '|' + u.track; tot[key] = (tot[key] || 0) + 1; }
  Object.entries(tot).forEach(([key, n], i) => { const [s, t] = key.split('|'); pillAt(s, t, n, delay + i * 70); });
}

const LG = {};

/** «Армада Компании»: вдоль края Компании из моря поднимаются галеоны, бортовой залп волной, удары по всем врагам. */
LG['И-Л'] = async (c, run) => {
  const own = sideOf(c.seat), W = board.clientWidth, g = gapBox();
  const topOwn = own !== bottomSide();
  const n = W < 701 ? 4 : 6;
  const s = clamp((g.h - 8) / 96, 0.5, 0.95);
  const base = topOwn ? g.y + 96 * s + 2 : g.b - 2; // ватерлиния галеонов
  const units = damageUnits(c.effects || []);
  const ships = [];
  for (let q = 0; q < n; q++) {
    const x = W * (0.5 / n + q / n);
    const gl = mk('galleon', 0, 0, galleonSVG());
    const order = Math.abs(q - (n - 1) / 2);
    A(gl, [{ opacity: 0, transform: `translate(${x}px,${base + 40 * s}px) scale(${s}) rotate(-6deg)` }, { opacity: 1, transform: `translate(${x}px,${base - 4}px) scale(${s}) rotate(2deg)`, offset: 0.7 }, { opacity: 1, transform: `translate(${x}px,${base}px) scale(${s}) rotate(0deg)` }], 520, order * 90, 'cubic-bezier(.2,.8,.3,1.2)');
    splash(x, base - 4, order * 90 + 200);
    ships.push({ el: gl, x });
  }
  tag(W / 2, topOwn ? base + 18 : base - 96 * s - 16, 'Бортовой залп!', 560, 'gold', 1400);
  const FIRE0 = 700, STEP = 120, FLY = 520;
  let lastHit = FIRE0;
  const fired = new Set();
  units.forEach((u, i) => {
    const sp = ships[i % ships.length], t0 = FIRE0 + i * STEP;
    const muzzle = { x: sp.x + (i % 2 ? 12 : -12) * s, y: base - 16 * s };
    flash(muzzle.x, muzzle.y, t0, 1.4); puff(muzzle.x, muzzle.y, t0 + 20); puff(muzzle.x + 8, muzzle.y - 6, t0 + 120);
    burst('spark', muzzle.x, muzzle.y, t0, 6, 8, 26, 320, topOwn ? Math.PI / 2 : -Math.PI / 2, Math.PI * 0.8);
    if (!fired.has(sp)) { fired.add(sp); A(sp.el, [{ transform: `translate(${sp.x}px,${base}px) scale(${s})` }, { transform: `translate(${sp.x}px,${base + (topOwn ? -5 : 5)}px) scale(${s}) rotate(${topOwn ? -2 : 2}deg)`, offset: 0.25 }, { transform: `translate(${sp.x}px,${base}px) scale(${s})` }], 420, t0, 'ease-out', 'none'); }
    const p1 = fxPoint(u.ship, u.track, u.idx);
    const ball = projectile(FX.KIND_BY_TRACK[u.track], false);
    fly(ball, curve(muzzle, p1, (i % 2 ? 0.1 : -0.1)), FLY, t0, { lift: 0.35, spin: u.track === 'sails' ? 720 : 0 });
    const th = t0 + FLY;
    at(th, run, () => setTrack(u.ship, u.track, u.v, '#c0392b'));
    flash(p1.x, p1.y, th, 1.3); ring(p1.x, p1.y, th);
    burst(u.track === 'sails' ? 'shred' : 'splinter', p1.x, p1.y, th, 10, 16, 44, 650);
    shake(plank(u.ship), th, 3);
    if (i === 2) at(th, run, () => shake(board, 0, 9, 320)); // сильный удар — одна тряска стола на серию
    lastHit = th;
  });
  damagePills(units, lastHit + 80);
  for (const sp of ships) {
    A(sp.el, [{ opacity: 1, transform: `translate(${sp.x}px,${base}px) scale(${s})` }, { opacity: 0, transform: `translate(${sp.x}px,${base + 36 * s}px) scale(${s}) rotate(4deg)` }], 600, lastHit + 500, 'ease-in', 'forwards');
    puff(sp.x, base - 30 * s, lastHit + 450);
  }
  await wait(lastHit + 1150, run);
};

/** «Кракен»: глубокая вода, открывается глаз, щупальца обвивают корабль и сжимают, клетки трескаются. */
LG['Г-Л'] = async (c, run) => {
  const tgt = c.target, tp = plank(tgt), tb = bx(tp), g = gapBox(), uid = ++LG_UID;
  const top = isTop(tgt);
  const edge = facingY(tgt); // край к морю
  const deep = mk('tint', 0, 0);
  const dw = tb.w * 1.5, dh = tb.h + g.h + 80;
  deep.style.width = dw + 'px'; deep.style.height = dh + 'px';
  deep.style.background = `radial-gradient(ellipse closest-side at 50% ${top ? '62%' : '38%'}, rgba(10,30,36,.88), rgba(16,44,52,.55) 55%, rgba(16,44,52,0) 100%)`;
  deep.style.transform = `translate(${tb.cx - dw / 2}px,${top ? tb.y - 40 : tb.y - g.h - 40}px)`;
  A(deep, [{ opacity: 0 }, { opacity: 1 }], 600, 0, 'ease-in', 'forwards');
  bubbles(tb.x + 10, edge + (top ? 30 : -6), tb.w - 20, 150, RICH ? 20 : 0, 50);
  // глаз в глубине
  const eyeY = edge + (top ? 1 : -1) * Math.min(g.h * 0.55, 60);
  const eye = mk('eye', 0, 0, eyeSVG(uid));
  const es = clamp(tb.w / 320, 0.55, 1);
  A(eye, [{ opacity: 0, transform: `translate(${tb.cx}px,${eyeY}px) scale(${es}) scaleY(.04)` }, { opacity: 1, transform: `translate(${tb.cx}px,${eyeY}px) scale(${es}) scaleY(1.1)`, offset: 0.7 }, { opacity: 1, transform: `translate(${tb.cx}px,${eyeY}px) scale(${es}) scaleY(1)` }], 380, 380, 'cubic-bezier(.2,.8,.3,1.2)', 'forwards');
  A(eye.querySelector('.pupil'), [{ transform: 'scaleX(1.6)' }, { transform: 'scaleX(.5)' }], 300, 820, 'ease-in', 'forwards');
  if (RICH) { const gl = mk('lg-glow', tb.cx, eyeY); A(gl, [{ opacity: 0, transform: 'scale(.15)' }, { opacity: 0.55, transform: 'scale(.35)' }, { opacity: 0, transform: 'scale(.3)' }], 1600, 420); }
  // щупальца
  const L = tb.h * 1.3;
  const spots = [[tb.x + 4, -1, 30], [tb.x + tb.w * 0.32, -1, 14], [tb.x + tb.w * 0.68, 1, 14], [tb.r - 4, 1, 30]];
  const tents = spots.map(([x, side, curl], q) => {
    const t = mk('tentacle', 0, 0, tentacleSVG(L, side > 0, `${uid}${q}`));
    const w = L * 0.3;
    const y0 = edge + (top ? 14 : -14);
    const flipV = top ? '' : ' scaleY(-1)';
    // положительный угол — кончик вправо (и для растущих вверх, и для свисающих вниз): к центру корабля
    const pose = (rot, sy, op = 1) => ({ opacity: op, transform: `translate(${x - w / 2}px,${y0 - L}px)${flipV} rotate(${rot}deg) scaleY(${sy})` });
    t.style.transformOrigin = `50% ${L}px`; // основание — у моря
    A(t, [pose(side * 35, 0.1, 0), pose(side * 18, 0.75), pose(-side * (curl + 10), 1.08), pose(-side * curl, 1)], 640, 640 + q * 90, 'cubic-bezier(.25,.8,.3,1.1)', 'forwards');
    // щупальце дышит, пока держит корабль
    return { el: t, pose, curl, side };
  });
  // сжатие
  const SQ = 1300;
  A(tp, [{ transform: 'none' }, { transform: 'scale(.955,1.035)', offset: 0.3 }, { transform: 'scale(.97,1.02) translateX(-3px)', offset: 0.55 }, { transform: 'scale(.96,1.03) translateX(3px)', offset: 0.75 }, { transform: 'none' }], 1100, SQ, 'ease-in-out', 'none');
  at(SQ, run, () => tp.classList.add('hitframe'));
  // удары по клеткам
  const units = damageUnits(c.effects || []);
  let last = SQ;
  units.forEach((u, i) => {
    const t0 = SQ + 120 + i * 120, p = fxPoint(u.ship, u.track, u.idx);
    at(t0, run, () => setTrack(u.ship, u.track, u.v, '#7a1f12'));
    flash(p.x, p.y, t0, 1.1); burst(u.track === 'crew' ? 'dust' : 'splinter', p.x, p.y, t0, 9, 12, 36, 600);
    ring(p.x, p.y, t0, 1, '#2b3f3a');
    last = t0;
  });
  at(SQ + 200, run, () => shake(board, 0, 8, 300));
  damagePills(units, last + 80);
  if (c.souls) soulsFly(tgt, c.souls, last + 200);
  // уход
  const OUT = last + 750;
  tents.forEach((t, q) => A(t.el, [t.pose(-t.side * t.curl, 1), t.pose(t.side * 35, 0.1, 0)], 480, OUT + q * 60, 'cubic-bezier(.5,0,.8,.4)', 'forwards'));
  for (let q = 0; q < 3; q++) splash(tb.x + tb.w * (0.2 + q * 0.3), edge + (top ? 10 : -10), OUT + 200 + q * 90);
  A(eye, [{ opacity: 1, transform: `translate(${tb.cx}px,${eyeY}px) scale(${es}) scaleY(1)` }, { opacity: 0, transform: `translate(${tb.cx}px,${eyeY}px) scale(${es}) scaleY(.04)` }], 260, OUT + 100, 'ease-in', 'forwards');
  A(deep, [{ opacity: 1 }, { opacity: 0 }], 500, OUT + 250, 'ease-out', 'forwards');
  await wait(OUT + 800, run);
};

/** «Корабль в бутылке»: над кораблём стеклянная бутылка, корабль сжимается внутрь, пробка, бутылка уплывает. */
LG['М-Л'] = async (c, run) => {
  const tgt = c.target, tp = plank(tgt), tb = bx(tp), W = board.clientWidth;
  const h = clamp(tb.h * 1.45, 150, 250), w = h * 0.6;
  const bc = { x: tb.cx, y: tb.cy };
  const bottle = mk('bottle', 0, 0, bottleSVG());
  bottle.style.width = w + 'px'; bottle.style.height = h + 'px'; bottle.style.margin = `${-h / 2}px 0 0 ${-w / 2}px`;
  const mini = bottle.querySelector('.mini'), cork = bottle.querySelector('.cork');
  mini.style.opacity = 0; cork.style.opacity = 0;
  A(bottle, [{ opacity: 0, transform: `translate(${bc.x}px,${bc.y}px) scale(.4) rotate(-12deg)` }, { opacity: 1, transform: `translate(${bc.x}px,${bc.y}px) scale(1.06) rotate(3deg)`, offset: 0.7 }, { opacity: 1, transform: `translate(${bc.x}px,${bc.y}px) scale(1) rotate(0deg)` }], 520, 0, 'cubic-bezier(.2,.8,.3,1.2)');
  if (RICH) for (let q = 0; q < 6; q++) { const sp = mk('sparkle', 0, 0); const x = bc.x + (Math.random() - 0.5) * w, y = bc.y + (Math.random() - 0.5) * h; A(sp, [{ opacity: 0, transform: `translate(${x}px,${y}px) scale(.4)` }, { opacity: 1, transform: `translate(${x}px,${y}px) scale(1.3)`, offset: 0.5 }, { opacity: 0, transform: `translate(${x}px,${y}px) scale(.4)` }], 600, 250 + q * 90); }
  // корабль сжимается внутрь бутылки, вокруг закручивается золотая пыль
  const inside = { x: bc.x, y: bc.y + h * 0.22 };
  A(tp, [{ transform: 'none', opacity: 1 }, { transform: `translate(${inside.x - tb.cx}px,${inside.y - tb.cy}px) scale(.5) rotate(-6deg)`, opacity: 0.9, offset: 0.6 }, { transform: `translate(${inside.x - tb.cx}px,${inside.y - tb.cy}px) scale(.08) rotate(-14deg)`, opacity: 0 }], 750, 520, 'cubic-bezier(.6,0,.8,.6)', 'forwards');
  if (RICH) for (let q = 0; q < 18; q++) {
    const d = mk('gold-dust', 0, 0), a0 = (q / 18) * Math.PI * 2;
    const pts = Array.from({ length: 9 }, (_, j) => { const r = (1 - j / 8) * Math.max(tb.w, tb.h) * 0.55, a = a0 + j * 0.55; return { x: inside.x + Math.cos(a) * r, y: inside.y + Math.sin(a) * r * 0.6 }; });
    A(d, pts.map((p, j) => ({ offset: j / 8, opacity: j === 8 ? 0 : 1, transform: `translate(${p.x}px,${p.y}px)` })), 700, 560 + q * 12, 'ease-in');
  }
  A(mini, [{ opacity: 0, transform: 'scale(.2)' }, { opacity: 1, transform: 'scale(1.1)', offset: 0.7 }, { opacity: 1, transform: 'scale(1)' }], 380, 1180, 'ease-out', 'forwards');
  // пробка
  A(cork, [{ opacity: 1, transform: 'translateY(-46px) rotate(-20deg)' }, { opacity: 1, transform: 'translateY(2px) rotate(0deg)', offset: 0.75 }, { opacity: 1, transform: 'translateY(0)' }], 300, 1420, 'cubic-bezier(.6,0,.9,.6)', 'forwards');
  const neck = { x: bc.x, y: bc.y - h / 2 + h * 0.04 };
  flash(neck.x, neck.y, 1650, 0.9); ring(neck.x, neck.y, 1650, 0.9, '#e0b44c');
  tag(neck.x, neck.y - 22, 'Чпок!', 1650, 'gold', 900);
  // бутылка ложится на воду и уплывает к ближнему краю
  const dir = bc.x > W / 2 ? 1 : -1;
  const g = gapBox();
  const water = { x: bc.x + dir * 30, y: g.cy };
  const endX = dir > 0 ? W + w : -w;
  const path = Array.from({ length: 13 }, (_, j) => { const t = j / 12; return { x: water.x + (endX - water.x) * t * t, y: water.y + Math.sin(t * Math.PI * 3) * 6, r: dir * (80 + Math.sin(t * Math.PI * 3) * 8) }; });
  A(bottle, [{ opacity: 1, transform: `translate(${bc.x}px,${bc.y}px) scale(1) rotate(0deg)` }, { opacity: 1, transform: `translate(${water.x}px,${water.y}px) scale(.7) rotate(${dir * 80}deg)` }], 520, 1900, 'cubic-bezier(.4,0,.3,1)', 'forwards');
  A(bottle, path.map((p, j) => ({ offset: j / 12, opacity: j === 12 ? 0 : 1, transform: `translate(${p.x}px,${p.y}px) scale(.7) rotate(${p.r}deg)` })), 1500, 2420, 'ease-in', 'forwards');
  splash(water.x, water.y + 10, 2380);
  for (let q = 1; q < 5; q++) { const p = path[q * 3]; const r = mk('ripple', 0, 0); A(r, [{ opacity: 0.8, transform: `translate(${p.x}px,${p.y + 8}px) scale(.3)` }, { opacity: 0, transform: `translate(${p.x}px,${p.y + 8}px) scale(1.4)` }], 800, 2420 + q * 260); }
  let tEnd = 3500;
  // «Джонс свободен» и ремонт Команды «Голландца» — события той же Легенды
  const jf = (c.effects || []).find((e) => e.type === 'jonesFree');
  const rs = (c.effects || []).filter((e) => e.type === 'restored');
  if (jf) {
    const jb = bx(plank(jf.ship));
    tag(jb.cx, jb.y - 14, 'Джонс свободен', 2500, 'gold', 1700);
    ring(jb.cx, jb.cy, 2500, 2.4, '#e0b44c');
  }
  rs.forEach((e) => {
    const now = shownTrack(e.ship, e.track);
    for (let j = 0; j < e.amount; j++) {
      const t0 = 2700 + j * 180, p = fxPoint(e.ship, e.track, now + j);
      at(t0, run, () => setTrack(e.ship, e.track, now + j + 1, '#2f7d4a'));
      ring(p.x, p.y, t0, 0.8, '#2f7d4a'); burst('sparkle', p.x, p.y, t0, 5, 6, 18, 500);
    }
    pillAt(e.ship, e.track, e.amount, 2800 + e.amount * 180, true);
    tEnd = Math.max(tEnd, 3400 + e.amount * 180);
  });
  await wait(tEnd, run);
};

/** Общий эффект неизвестной Легенды: удары по шкалам из событий. */
async function legendGeneric(c, run) {
  const units = damageUnits(c.effects || []);
  units.forEach((u, i) => { const p = fxPoint(u.ship, u.track, u.idx), t0 = i * 120; at(t0, run, () => setTrack(u.ship, u.track, u.v, '#c0392b')); flash(p.x, p.y, t0, 1.2); burst('splinter', p.x, p.y, t0, 8, 12, 36, 600); });
  damagePills(units, units.length * 120 + 80);
  await wait(units.length * 120 + 1000, run);
}

PLAY.legend = async (c, run) => {
  const outro = await legendIntro(c.card, c.seat, run, { cost: c.cost, soulCost: c.soulCost });
  await (LG[c.card] || legendGeneric)(c, run);
  await outro();
};

/**
 * «Джек ускользает» (Легенда-Реакция): корабль начинает тонуть — время замирает (пузыри застывают,
 * стол сереет) — выход Легенды — роза ветров раскручивается — «Ускользнул!» — Корпус 2 золотом —
 * прыжок из воды и смена мест.
 */
PLAY.jack = async (c, run) => {
  const code = `${c.ship}-Л`, el = plank(c.ship), b = bx(el), W = board.clientWidth, H = board.clientHeight;
  // начинает тонуть
  A(el, [{ transform: 'none', opacity: 1 }, { transform: 'rotate(-3deg) translateY(12px)', opacity: 0.8 }], 700, 0, 'ease-in', 'forwards');
  const frozen = [];
  for (let q = 0; q < (RICH ? 16 : 4); q++) {
    const bb = mk('bubble', 0, 0), x = b.x + 10 + Math.random() * (b.w - 20), y = b.b - 6;
    frozen.push(A(bb, [{ opacity: 0, transform: `translate(${x}px,${y}px) scale(.5)` }, { opacity: 1, offset: 0.2 }, { opacity: 0, transform: `translate(${x + (Math.random() - 0.5) * 16}px,${y - 50 - Math.random() * 40}px) scale(1.2)` }], 1400, q * 40, 'linear'));
  }
  const wp = whirlpool(b.cx, b.b - 10, 200, run, Math.min(180, b.w * 0.6), 0);
  hint(`${nick(c.ship)} тонет…`);
  await wait(520, run);
  // время замирает
  frozen.forEach((a) => a.pause());
  wp.getAnimations({ subtree: true }).forEach((a) => a.pause());
  const gray = mk('tint', 0, 0); gray.style.width = W + 'px'; gray.style.height = H + 'px'; gray.style.background = 'rgba(120,128,132,.38)';
  A(gray, [{ opacity: 0 }, { opacity: 1 }], 160, 0, 'linear', 'forwards');
  ring(b.cx, b.cy, 0, 3, '#e8eef2');
  tag(b.cx, b.y - 14, 'время замерло…', 60, '', 1100);
  await wait(220, run);
  const outro = await legendIntro(code, c.ship, run, { cost: c.cost });
  // роза ветров
  const cs = clamp(Math.min(b.w, b.h * 1.6), 200, 300);
  const rose = mk('compass', 0, 0, compassSVG());
  rose.style.width = rose.style.height = cs + 'px'; rose.style.margin = `${-cs / 2}px 0 0 ${-cs / 2}px`;
  A(rose, [{ opacity: 0, transform: `translate(${b.cx}px,${b.cy}px) scale(.3) rotate(-200deg)` }, { opacity: 1, transform: `translate(${b.cx}px,${b.cy}px) scale(1.05) rotate(540deg)`, offset: 0.8 }, { opacity: 1, transform: `translate(${b.cx}px,${b.cy}px) scale(1) rotate(720deg)` }], 1000, 0, 'cubic-bezier(.15,.7,.3,1)', 'forwards');
  burst('gold-dust', b.cx, b.cy, 650, 22, 40, cs * 0.6, 800);
  // «Ускользнул!»
  const shout = mk('lg-shout', b.cx, b.cy, 'Ускользнул!');
  const ks = Math.min(1, W / 600);
  A(shout, [{ opacity: 0, transform: `translate(-50%,-50%) rotate(-4deg) scale(${2.2 * ks})` }, { opacity: 1, transform: `translate(-50%,-50%) rotate(-4deg) scale(${0.95 * ks})`, offset: 0.7 }, { opacity: 1, transform: `translate(-50%,-50%) rotate(-4deg) scale(${ks})` }], 280, 760, 'cubic-bezier(.6,0,.9,.6)');
  at(1000, run, () => shake(board, 0, 7, 260));
  // Корпус 2 золотом
  const hullNow = shownTrack(c.ship, 'hull'), hullNew = Math.min(G.rules.jackHull, G.ships[c.ship].max.hull);
  for (let j = hullNow; j < hullNew; j++) { const p = fxPoint(c.ship, 'hull', j); burst('gold-dust', p.x, p.y, 1150 + j * 120, 8, 6, 24, 600); ring(p.x, p.y, 1150 + j * 120, 0.8, '#e0b44c'); }
  at(1150, run, () => setTrack(c.ship, 'hull', hullNew, '#e0b44c'));
  pillAt(c.ship, 'hull', hullNew - hullNow, 1300, true);
  await wait(1500, run);
  // время пошло: пузыри лопаются, прыжок из воды, смена мест
  frozen.forEach((a) => { a.playbackRate = 3; a.play(); });
  wp.remove();
  A(gray, [{ opacity: 1 }, { opacity: 0 }], 250, 0, 'ease-out', 'forwards');
  A(shout, [{ opacity: 1 }, { opacity: 0, transform: 'translate(-50%,-50%) rotate(-4deg) scale(1.3)' }], 300, 0, 'ease-in', 'forwards');
  A(rose, [{ opacity: 1, transform: `translate(${b.cx}px,${b.cy}px) scale(1) rotate(720deg)` }, { opacity: 0, transform: `translate(${b.cx}px,${b.cy}px) scale(1.4) rotate(760deg)` }], 400, 0, 'ease-in', 'forwards');
  A(plank(c.ship), [{ transform: 'rotate(-3deg) translateY(12px)', opacity: 0.8 }, { transform: 'translateY(-22px) scale(1.04)', opacity: 1 }], 280, 0, 'cubic-bezier(.2,.8,.3,1)', 'forwards');
  for (let q = 0; q < 3; q++) splash(b.x + b.w * (0.2 + 0.3 * q), b.b - 4, 80 + q * 60);
  await wait(300, run);
  const swapEv = (c.events || []).filter((e) => e.type === 'swapped');
  if (swapEv.length) await flipTo(c.events, run, 700); // все события клипа: Корпус 2, Легенда сыграна, смена мест
  await outro();
};
