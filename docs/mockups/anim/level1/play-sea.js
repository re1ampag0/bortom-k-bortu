/* =====================================================================================================
   play-sea.js — карты моря: объявление погоды (клип sea) + тихий фон раунда (renderWeather).
   Переносится в игру как src/ui/game/fx/sea.ts (задача S1).
   Порядок клипа: (раунд N) → стол темнеет (рука и кнопки — нет) → карта моря в центре со своей
   атмосферой → карта улетает в значок «Море» строки состояния → изменения на планшетах по НАСТОЯЩИМ
   событиям клипа (damage / restored / powderGained / powderLost / swapped) в любом порядке.
   Если у карты эффекта нет (в событиях только seaEffect или ничего) — показывается правило.
   ===================================================================================================== */
'use strict';
/* Иллюстрации карт моря (свои SVG) и фоны — по ключу карты. */
const SEA_ART = {
  calm: "<path d=\"M18 52 H132\" stroke=\"#EAF2F6\" stroke-width=\"3\" stroke-linecap=\"round\"/><path d=\"M34 64 H116\" stroke=\"#EAF2F6\" stroke-width=\"3\" opacity=\".7\" stroke-linecap=\"round\"/><path d=\"M50 40 H100\" stroke=\"#EAF2F6\" stroke-width=\"3\" opacity=\".5\" stroke-linecap=\"round\"/><path d=\"M70 50 V20 Q78 34 72 48 Z\" fill=\"#F4F6F7\" opacity=\".85\"/>",
  wind: "<g stroke=\"#F4F6F7\" stroke-width=\"4\" stroke-linecap=\"round\" opacity=\".9\"><path d=\"M14 30 H86\"/><path d=\"M30 46 H112\"/><path d=\"M10 62 H74\"/></g><path d=\"M100 74 L130 74 L124 82 H106Z\" fill=\"#F4F6F7\"/><path d=\"M115 74 V36\" stroke=\"#F4F6F7\" stroke-width=\"2.5\"/><path d=\"M116 38 Q140 52 116 70 Z\" fill=\"#F4F6F7\"/>",
  fog: "<g stroke=\"#F4F6F7\" stroke-width=\"7\" stroke-linecap=\"round\" opacity=\".9\"><path d=\"M20 30 H110\"/><path d=\"M40 48 H135\"/><path d=\"M15 66 H95\"/></g>",
  storm: "<g fill=\"#D9DEE3\"><ellipse cx=\"62\" cy=\"38\" rx=\"34\" ry=\"20\"/><ellipse cx=\"92\" cy=\"34\" rx=\"28\" ry=\"22\"/><ellipse cx=\"40\" cy=\"46\" rx=\"22\" ry=\"14\"/><rect x=\"38\" y=\"40\" width=\"80\" height=\"20\" rx=\"10\"/></g><path d=\"M80 58 L68 78 H78 L70 92 L92 68 H80 L88 58Z\" fill=\"#F2C94C\"/>",
  wave: "<path d=\"M4 80 C26 80 30 44 60 30 C86 18 108 32 102 50 C98 62 84 60 84 52 C84 46 92 44 94 48 C98 38 82 32 70 40 C54 52 62 80 146 80 Z\" fill=\"#E8F1F6\"/><path d=\"M4 84 H146\" stroke=\"#CFE0EA\" stroke-width=\"4\"/>",
  maelstrom: "<g fill=\"none\" stroke=\"#E8F1F6\" stroke-width=\"4\" stroke-linecap=\"round\"><path d=\"M75 45 m-5 0 a5 5 0 1 1 10 0 a11 11 0 1 1 -22 0 a17 17 0 1 1 34 0 a23 23 0 1 1 -46 0 a29 29 0 1 1 58 0\"/></g>",
  clear: "<circle cx=\"75\" cy=\"44\" r=\"16\" fill=\"#FFE08A\"/><g stroke=\"#FFE08A\" stroke-width=\"3\" stroke-linecap=\"round\"><path d=\"M75 16 V8\"/><path d=\"M75 80 V72\"/><path d=\"M47 44 H39\"/><path d=\"M111 44 H103\"/><path d=\"M55 24 l-6 -6\"/><path d=\"M95 64 l6 6\"/><path d=\"M95 24 l6 -6\"/><path d=\"M55 64 l-6 6\"/></g>",
  mermaids: "<path d=\"M68 72 C68 52 80 40 86 28 C84 44 82 52 84 62 C92 58 100 60 106 66 C98 66 90 70 86 78 C82 72 76 72 68 72Z\" fill=\"#9FD3C7\"/><g fill=\"#FFF7D6\"><circle cx=\"50\" cy=\"30\" r=\"2.5\"/><circle cx=\"112\" cy=\"24\" r=\"2\"/><circle cx=\"40\" cy=\"58\" r=\"1.8\"/><path d=\"M120 46 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z\"/></g><text x=\"32\" y=\"46\" font-size=\"18\" fill=\"#FFF7D6\">♪</text><path d=\"M6 84 Q40 76 75 84 T144 84\" fill=\"none\" stroke=\"#CFE7EE\" stroke-width=\"3\"/>",
  tortuga: "<path d=\"M48 18 h18 v6 h-18z M45 24 h24 v32 a4 4 0 0 1 -4 4 h-16 a4 4 0 0 1 -4 -4z\" fill=\"#3a2a1a\"/><rect x=\"50\" y=\"29\" width=\"14\" height=\"24\" rx=\"3\" fill=\"#FFD27A\"/><circle cx=\"57\" cy=\"41\" r=\"16\" fill=\"#FFD27A\" opacity=\".22\"/><path d=\"M88 38 h26 v30 a4 4 0 0 1 -4 4 h-18 a4 4 0 0 1 -4 -4z\" fill=\"#E9C46A\"/><path d=\"M114 44 h6 a6 6 0 0 1 0 14 h-6\" fill=\"none\" stroke=\"#E9C46A\" stroke-width=\"4\"/><path d=\"M86 38 q15 -11 30 0\" fill=\"#FFF6E0\"/>",
  rum: "<rect x=\"56\" y=\"20\" width=\"38\" height=\"46\" rx=\"13\" fill=\"#8A5A32\"/><g stroke=\"#4a2f18\" stroke-width=\"3\"><path d=\"M56 33 H94\"/><path d=\"M56 53 H94\"/></g><path d=\"M6 72 Q28 64 50 72 T94 72 T144 72\" fill=\"none\" stroke=\"#E8F1F6\" stroke-width=\"4\"/>",
  caravan: "<path d=\"M6 66 H144\" stroke=\"#FFF6E0\" stroke-width=\"2\"/><g fill=\"#FFF6E0\"><path d=\"M30 62 h38 l-6 6 h-26z\"/><path d=\"M50 60 V22 L67 56 Z\"/><path d=\"M47 60 V30 L34 56 Z\"/><path d=\"M92 62 h30 l-5 5 h-20z\"/><path d=\"M107 60 V32 L120 56 Z\"/></g><g fill=\"#3a2a1a\"><circle cx=\"72\" cy=\"78\" r=\"6\"/><circle cx=\"86\" cy=\"80\" r=\"6\"/></g>",
  wet: "<rect x=\"56\" y=\"26\" width=\"38\" height=\"42\" rx=\"12\" fill=\"#2F3D4A\"/><g stroke=\"#1f2a33\" stroke-width=\"3\"><path d=\"M56 38 H94\"/><path d=\"M56 55 H94\"/></g><g fill=\"#CFE7F2\"><path d=\"M44 18 q5 9 0 12 q-5 -3 0 -12z\"/><path d=\"M106 30 q5 9 0 12 q-5 -3 0 -12z\"/><path d=\"M76 6 q5 9 0 12 q-5 -3 0 -12z\"/><path d=\"M48 70 q5 9 0 12 q-5 -3 0 -12z\"/></g>",
  reefs: "<g fill=\"#5D544B\"><path d=\"M18 78 L32 48 L46 58 L58 36 L74 78Z\"/><path d=\"M82 78 L96 54 L108 62 L120 44 L134 78Z\"/></g><path d=\"M4 80 Q40 72 75 80 T146 80\" fill=\"none\" stroke=\"#E8F1F6\" stroke-width=\"4\"/>",
  thunder: "<g fill=\"#8A97A3\"><ellipse cx=\"60\" cy=\"22\" rx=\"34\" ry=\"15\"/><ellipse cx=\"94\" cy=\"20\" rx=\"27\" ry=\"15\"/></g><path d=\"M86 28 L64 58 H78 L64 90 L100 50 H84 L96 28Z\" fill=\"#FFE58A\" stroke=\"#FFD84A\" stroke-width=\"2\"/>",
  fleet: "<path d=\"M6 64 H144\" stroke=\"#F4F6F7\" stroke-width=\"2\"/><g fill=\"#F4F6F7\" opacity=\".92\"><path d=\"M20 62 V36 L35 60Z\"/><path d=\"M44 62 V28 L62 60Z\"/><path d=\"M73 62 V33 L88 60Z\"/><path d=\"M99 62 V38 L112 60Z\"/><path d=\"M121 62 V42 L132 60Z\"/></g>",
  moon: "<path d=\"M90 16 a28 28 0 1 0 22 48 a23 23 0 1 1 -22 -48z\" fill=\"#F1F0E6\"/><g fill=\"#F1F0E6\"><circle cx=\"40\" cy=\"26\" r=\"2\"/><circle cx=\"30\" cy=\"56\" r=\"1.6\"/><circle cx=\"58\" cy=\"14\" r=\"1.4\"/><circle cx=\"126\" cy=\"22\" r=\"1.6\"/></g>",
  current: "<g fill=\"none\" stroke=\"#E8F1F6\" stroke-width=\"5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20 32 H112 M100 22 L112 32 L100 42\"/><path d=\"M130 60 H38 M50 50 L38 60 L50 70\"/></g>",
};
const SEA_BG = {"calm": "linear-gradient(#7FA4B8,#A9C6D4)", "wind": "linear-gradient(#6E9BB5,#9CC4D8)", "fog": "linear-gradient(#8E9AA3,#B7C0C6)", "storm": "linear-gradient(#3B4A57,#58697A)", "wave": "linear-gradient(#2E5A78,#4F86A6)", "maelstrom": "linear-gradient(#22465C,#3D6E8A)", "clear": "linear-gradient(#5C9CC4,#9CC9E2)", "mermaids": "linear-gradient(#2F6F78,#5AA0A6)", "tortuga": "linear-gradient(#5A3A24,#8A5E3A)", "rum": "linear-gradient(#4F86A6,#7FB0C8)", "caravan": "linear-gradient(#B98E4E,#D9B477)", "wet": "linear-gradient(#3E5363,#62788A)", "reefs": "linear-gradient(#4F6B7A,#7D97A4)", "thunder": "linear-gradient(#2B3640,#4A5866)", "fleet": "linear-gradient(#5E8FB0,#93BCD2)", "moon": "linear-gradient(#1F2A44,#3A4A6E)", "current": "linear-gradient(#2F6F8E,#5C9AB8)"};
const seaKeyOf = (code) => (G.sea[code] ? G.sea[code].key : code);
const seaSvg = (key, w = 150, h = 90) => `<svg width="${w}" height="${h}" viewBox="0 0 150 90">${SEA_ART[key] || ''}</svg>`;
function chipIcon(code) { const key = seaKeyOf(code); return `<span class="chipart" style="background:${SEA_BG[key]}">${seaSvg(key, 22, 14)}</span>`; }
const shipAt = (side, pos) => Object.keys(D.ships).find((c) => sideOf(c) === side && D.ships[c].pos === pos && !D.ships[c].sunk);
const aliveCodes = () => Object.keys(D.ships).filter((c) => !D.ships[c].sunk);
const allPlanks = () => [...board.querySelectorAll('[data-fx-ship]')];

/* ——— вспомогательные эффекты погоды ——— */
function tableCtx(run) {
  const rows = board.querySelectorAll(':scope > .team-row');
  const R = rows.length ? bx(rows[rows.length - 1]).b + 4 : board.clientHeight;
  return { W: board.clientWidth, R, g: gapBox(), run };
}
function rain(ctx, n, from, to) { if (!RICH) return; for (let i = 0; i < n; i++) { const d = mk('drop', 0, 0); const x = Math.random() * (ctx.W + 120), y = Math.random() * ctx.R; A(d, [{ opacity: 0, transform: `translate(${x}px,${y - 40}px) rotate(22deg)` }, { opacity: 0.35 + Math.random() * 0.5, offset: 0.25 }, { opacity: 0, transform: `translate(${x - 30}px,${y + 70}px) rotate(22deg)` }], 450, from + Math.random() * (to - from)); } }
function boardFlash(ctx, times) { for (const t of times) { const f = mk('tint', 0, 0); f.style.width = ctx.W + 'px'; f.style.height = ctx.R + 'px'; f.style.background = '#fff'; A(f, [{ opacity: 0 }, { opacity: 0.35, offset: 0.1 }, { opacity: 0, offset: 0.3 }, { opacity: 0.2, offset: 0.45 }, { opacity: 0 }], 600, t, 'linear'); } }
function overlay(ctx, bg, kf, d, delay, easing = 'ease-in-out') { const o = mk('tint', 0, 0); o.style.width = ctx.W + 'px'; o.style.height = ctx.R + 'px'; o.style.background = bg; A(o, kf, d, delay, easing, 'forwards'); return o; }
function svgWide(ctx, inner, h, cls = 'svgabs') { return mk(cls, 0, 0, `<svg width="${ctx.W}" height="${h}" viewBox="0 0 ${ctx.W} ${h}">${inner}</svg>`); }
function wavyPath(w, y, amp, step) { let d = `M0 ${y}`; for (let x = 0; x <= w; x += step) d += ` Q ${x + step / 2} ${y + ((x / step) % 2 ? amp : -amp)} ${x + step} ${y}`; return d; }
/** Пунктир по диагоналям с крестиком (Туман) — пары считаются по местам (pos), а не по кодам. */
function diagLines(ctx, host) {
  const top = other(bottomSide()), bot = bottomSide(), out = [];
  for (const p of [0, 1]) {
    const a = shipAt(top, p), b = shipAt(bot, 1 - p);
    if (!a || !b) continue;
    const A0 = bx(plank(a)), B0 = bx(plank(b)); const mx = (A0.cx + B0.cx) / 2, my = (A0.b + B0.y) / 2;
    const html = `<svg width="${ctx.W}" height="${ctx.R}"><path d="M${A0.cx} ${A0.b} L${B0.cx} ${B0.y}" stroke="#7C8A94" stroke-width="2" stroke-dasharray="5 7" fill="none"/><g stroke="#B23A2E" stroke-width="3" stroke-linecap="round"><path d="M${mx - 9} ${my - 9} l18 18 M${mx + 9} ${my - 9} l-18 18"/></g></svg>`;
    if (host) { const d = document.createElement('div'); d.className = 'svgabs'; d.style.opacity = 1; d.innerHTML = html; host.appendChild(d); out.push(d); } else out.push(mk('svgabs', 0, 0, html));
  }
  return out;
}
function rocks(ctx, host) {
  const out = [];
  for (const [fx0, dy] of [[0.03, -6], [0.08, 10], [0.92, -8], [0.97, 8], [0.5, 30]]) {
    const html = '<svg viewBox="0 0 40 26" width="40" height="26"><path d="M2 25 L10 8 L18 14 L26 2 L38 25Z" fill="#6B6157"/><path d="M10 8 L14 12 L18 14" stroke="#8A8076" stroke-width="2" fill="none"/></svg>';
    const tr = `translate(${ctx.W * fx0 - 20}px,${ctx.g.cy + dy - 13}px)`;
    let el;
    if (host) { el = document.createElement('div'); el.className = 'rock'; el.innerHTML = html; host.appendChild(el); el.style.transform = tr; el.style.opacity = 1; } else el = mk('rock', 0, 0, html);
    el._t = tr; out.push(el);
  }
  return out;
}
/** Удар погоды по клетке (без ядра): вспышка цвета погоды, клетка гаснет, подпись. */
function weatherHit(e, t0, run, color, label) {
  let last = t0;
  for (const [tr, n] of [[e.track, e.amount], ['hull', e.toHull]]) {
    if (!n) continue;
    const now = shownTrack(e.ship, tr);
    for (let j = 0; j < n; j++) { const p = fxPoint(e.ship, tr, now - 1 - j), t = t0 + j * 110; flash(p.x, p.y, t, 1); ring(p.x, p.y, t, 0.9, color); last = t; }
    at(t0, run, () => setTrack(e.ship, tr, Math.max(0, now - n), color));
    pillAt(e.ship, tr, n, t0 + 120);
  }
  if (label) { const b = bx(plank(e.ship)); tag(b.cx, b.y - 12, label, t0 + 100, '', 1300); }
  return last;
}
function weatherRestore(e, t0, run, color = '#2F7A4F') {
  const now = shownTrack(e.ship, e.track);
  for (let j = 0; j < e.amount; j++) { const p = fxPoint(e.ship, e.track, now + j), t = t0 + j * 140; at(t, run, () => setTrack(e.ship, e.track, now + j + 1, color)); ring(p.x, p.y, t, 0.8, color); }
  pillAt(e.ship, e.track, e.amount, t0 + 100, true);
}
function powderFx(e, t0, run, ctx) {
  if (e.type === 'powderGained') { gainKegs(e.side, e.amount, { x: ctx.W / 2, y: ctx.g.cy }, t0); return; }
  const kg = holdEl(e.side), kids = kg.querySelectorAll('[data-fx-keg]'), n = D.powder[e.side];
  for (let k = 0; k < e.amount; k++) { const keg = kids[n - 1 - k]; if (!keg) continue; A(keg, [{ background: '#2A2521', transform: 'scale(1)' }, { background: '#5E86A0', transform: 'scale(1.3) translateY(2px)', offset: 0.4 }, { background: 'rgba(0,0,0,0)', transform: 'scale(.8) translateY(4px)' }], 700, t0 + k * 120, 'ease-in', 'forwards'); const kb = bx(keg); const dr = mk('bubble', 0, 0); A(dr, [{ opacity: 1, transform: `translate(${kb.cx}px,${kb.cy}px)` }, { opacity: 0, transform: `translate(${kb.cx}px,${kb.cy + 16}px)` }], 600, t0 + k * 120 + 200); }
  const kb = bx(kg); tag(kb.r + 36, kb.cy, `−${e.amount} Порох`, t0, '', 1300);
}

/**
 * Погода. atmo(ctx) — атмосфера, пока карта в центре; apply(ctx, effects, used) — изменения на планшетах
 * по событиям; возвращает длительность. События, которые apply пометил в used, повторно не показываются.
 */
const SEAFX = {
  storm: { atmo(ctx) { rain(ctx, 80, 800, 2400); boardFlash(ctx, [950, 1560]); }, rule: 'Каждый Залп −1 урон' },
  calm: {
    atmo(ctx) { for (let k = 0; k < 3; k++) { const y = ctx.g.y + 24 + k * 28; const w = svgWide(ctx, `<path d="${wavyPath(ctx.W, 14, 9, 36)}" fill="none" stroke="#9CC3DA" stroke-width="2.5" stroke-linecap="round"/>`, 28); A(w, [{ opacity: 0, transform: `translate(0px,${y - 14}px) scaleY(1)` }, { opacity: 0.95, offset: 0.2, transform: `translate(0px,${y - 14}px) scaleY(1)` }, { opacity: 0.95, offset: 0.75, transform: `translate(0px,${y - 14}px) scaleY(.06)` }, { opacity: 0.5, transform: `translate(0px,${y - 14}px) scaleY(.06)` }], 2400, 200 + k * 120); } },
    apply(ctx) { board.querySelectorAll('[data-fx-track="sails"]').forEach((el, i) => A(el, [{ opacity: 1, transform: 'none' }, { opacity: 0.35, transform: 'translateY(2px)', offset: 0.5 }, { opacity: 1, transform: 'none' }], 1100, i * 60, 'ease-in-out', 'none')); tag(ctx.W / 2, ctx.g.cy, 'Смена мест закрыта до конца раунда', 100, '', 1500); return 1300; },
  },
  wind: {
    atmo(ctx) { for (let k = 0; k < (RICH ? 18 : 5); k++) { const st = mk('streak', 0, 0); const y = 20 + Math.random() * (ctx.R - 40); const len = 80 + Math.random() * 140; st.style.width = len + 'px'; A(st, [{ opacity: 0, transform: `translate(${-len}px,${y}px)` }, { opacity: 0.9, offset: 0.3 }, { opacity: 0, transform: `translate(${ctx.W}px,${y - 12}px)` }], 900 + Math.random() * 400, 250 + Math.random() * 1600, 'ease-in'); } },
    apply(ctx) { allPlanks().forEach((p, i) => A(p, [{ transform: 'none' }, { transform: 'translateX(5px) rotate(.5deg)', offset: 0.4 }, { transform: 'none' }], 900, i * 90, 'ease-in-out', 'none')); tag(ctx.W / 2, ctx.g.cy, 'Перестроение бесплатно для обеих команд', 100, 'plus', 1500); return 1200; },
  },
  fog: {
    atmo(ctx) { for (let k = 0; k < (RICH ? 12 : 4); k++) { const f = mk('fogblob', 0, 0); const left = k % 2 === 0; const sz = 180 + Math.random() * 160; f.style.width = f.style.height = sz + 'px'; f.style.margin = `-${sz / 2}px 0 0 -${sz / 2}px`; const y = Math.random() * ctx.R; const x0 = left ? -sz : ctx.W + sz, x1 = left ? Math.random() * ctx.W * 0.45 : ctx.W - Math.random() * ctx.W * 0.45; A(f, [{ opacity: 0, transform: `translate(${x0}px,${y}px) scale(.7)` }, { opacity: 0.85, transform: `translate(${x1}px,${y}px) scale(1)`, offset: 0.6 }, { opacity: 0.25, transform: `translate(${(x0 + x1 * 3) / 4}px,${y}px) scale(1.1)` }], 2600, 100 + k * 90, 'ease-out'); } },
    apply(ctx) { diagLines(ctx).forEach((el, k) => A(el, [{ opacity: 0 }, { opacity: 1 }], 400, k * 200, 'ease-out', 'forwards')); tag(ctx.W / 2, ctx.g.cy - 22, 'Залпы по диагонали невозможны', 300, '', 1600); return 1500; },
  },
  wave: {
    dim: 0.15,
    apply(ctx) {
      const h = Math.min(240, ctx.g.h * 2), y = ctx.g.cy - h * 0.62, w = Math.min(900, ctx.W * 0.9);
      const wv = mk('svgabs', 0, 0, `<svg width="${w}" height="${h}" viewBox="0 0 300 120" preserveAspectRatio="none"><defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFE7F2"/><stop offset=".5" stop-color="#5E9CC0"/><stop offset="1" stop-color="#24465C"/></linearGradient></defs><path d="M0 120 C60 120 70 50 130 24 C180 2 230 16 222 46 C216 70 186 66 188 50 C190 40 204 38 206 46 C212 30 186 20 166 32 C138 50 150 112 300 120 Z" fill="url(#wg)" opacity=".92"/><path d="M130 24 C180 2 230 16 222 46" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".9"/></svg>`);
      const t0 = 100, dur = 1800;
      A(wv, [{ opacity: 0, transform: `translate(${-w}px,${y}px)` }, { opacity: 1, offset: 0.12 }, { opacity: 1, offset: 0.85 }, { opacity: 0, transform: `translate(${ctx.W}px,${y}px)` }], dur, t0, 'cubic-bezier(.4,0,.6,1)');
      allPlanks().forEach((p) => { const b = bx(p); const tx = t0 + dur * ((b.cx + w * 0.35) / (ctx.W + w)); A(p, [{ transform: 'none' }, { transform: `translateY(${isTop(p.dataset.fxShip) ? 6 : -6}px) rotate(-2deg)`, offset: 0.4 }, { transform: 'rotate(1deg)', offset: 0.7 }, { transform: 'none' }], 700, tx - 200, 'ease-in-out', 'none'); });
      if (RICH) for (let k = 0; k < 18; k++) { const sp = mk('bubble', 0, 0); const x = (k / 18) * ctx.W; const tt = t0 + dur * ((x + w * 0.6) / (ctx.W + w)); A(sp, [{ opacity: 0.9, transform: `translate(${x}px,${ctx.g.cy - 10}px)` }, { opacity: 0, transform: `translate(${x + 20}px,${ctx.g.cy - 50 - Math.random() * 40}px)` }], 600, tt); }
      tag(ctx.W / 2, ctx.g.cy, 'В начале каждого хода: −1 Паруса ходящей команде', t0 + dur, '', 1700);
      return t0 + dur + 1500;
    },
    atmo(ctx) { if (RICH) for (let k = 0; k < 3; k++) { const y = ctx.g.y + 24 + k * 28; const w = svgWide(ctx, `<path d="${wavyPath(ctx.W, 14, 10, 40)}" fill="none" stroke="#5E9CC0" stroke-width="3" stroke-linecap="round"/>`, 28); A(w, [{ opacity: 0, transform: `translate(-40px,${y - 14}px)` }, { opacity: 0.8, offset: 0.3 }, { opacity: 0, transform: `translate(40px,${y - 14}px)` }], 1800, 300 + k * 150); } },
  },
  maelstrom: {
    atmo(ctx) { whirlpool(ctx.W / 2, ctx.g.cy, 300, ctx.run, Math.min(260, ctx.W * 0.5), 2600); allPlanks().forEach((p) => { const b = bx(p); const toward = b.cx < ctx.W / 2 ? 1 : -1; A(p, [{ transform: 'none' }, { transform: `rotate(${toward * 1.6}deg) translateX(${toward * 4}px)`, offset: 0.5 }, { transform: 'none' }], 1600, 600, 'ease-in-out', 'none'); }); },
    apply(ctx) { tag(ctx.W / 2, ctx.g.cy - 30, 'В начале хода ходящие меняются местами · диагональ без штрафа', 100, '', 1800); return 1600; },
  },
  clear: {
    atmo(ctx) {
      for (let k = 0; k < 6; k++) { const cl = mk('cloud', 0, 0); const y = 20 + (k % 3) * (ctx.R / 3); const left = k < 3; A(cl, [{ opacity: 0.9, transform: `translate(${ctx.W / 2 - 110 + (left ? -60 : 60)}px,${y}px)` }, { opacity: 0, transform: `translate(${left ? -260 : ctx.W + 40}px,${y}px)` }], 1500, 300 + k * 60, 'ease-in'); }
      const rays = mk('rays', 0, 0); A(rays, [{ opacity: 0, transform: `translate(${ctx.W / 2}px,0px) rotate(0deg) scale(.6)` }, { opacity: 0.7, transform: `translate(${ctx.W / 2}px,0px) rotate(20deg) scale(1)` }], 2300, 400, 'ease-out', 'forwards');
      overlay(ctx, 'rgba(255,214,120,.18)', [{ opacity: 0 }, { opacity: 1 }], 1500, 600);
    },
    apply(ctx) {
      const top = other(bottomSide()), bot = bottomSide();
      [0, 1].forEach((p, k) => { const a = shipAt(top, p), b = shipAt(bot, p); if (!a || !b) return; const A0 = bx(plank(a)), B0 = bx(plank(b)); const ln = mk('svgabs', 0, 0, `<svg width="${ctx.W}" height="${ctx.R}"><path d="M${A0.cx} ${A0.b} L${B0.cx} ${B0.y}" stroke="#E0A800" stroke-width="3" stroke-dasharray="6 7" stroke-linecap="round"/></svg>`); A(ln, [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], 1600, k * 200); });
      tag(ctx.W / 2, ctx.g.cy, 'Залпы по кораблю напротив +1', 200, 'plus', 1600); return 1700;
    },
  },
  mermaids: {
    atmo(ctx) { if (!RICH) return; allPlanks().forEach((p, i) => { const b = bx(p), fy = facingY(p.dataset.fxShip), dir = dirOf(p.dataset.fxShip); for (let k = 0; k < 5; k++) { const n = mk(k % 2 ? 'note' : 'sparkle', 0, 0, k % 2 ? '♪' : ''); const x = b.x + 20 + Math.random() * (b.w - 40); A(n, [{ opacity: 0, transform: `translate(${x}px,${fy + dir * 30}px) scale(.6)` }, { opacity: 1, offset: 0.3 }, { opacity: 0, transform: `translate(${x + (Math.random() - 0.5) * 30}px,${fy + dir * 4}px) scale(1.1)` }], 1300, 300 + i * 150 + k * 160); } }); },
    apply(ctx, effects, used) {
      let t = 0;
      effects.forEach((e) => {
        if (e.type !== 'damage' || e.track !== 'crew') return;
        used.add(e);
        const cur = shownTrack(e.ship, 'crew'), p = fxPoint(e.ship, 'crew', cur - 1);
        const ghost = mk('pipfloat', 0, 0);
        A(ghost, [{ opacity: 1, transform: `translate(${p.x}px,${p.y}px)` }, { opacity: 0, transform: `translate(${p.x + 18}px,${p.y + dirOf(e.ship) * 70}px) rotate(40deg)` }], 1100, t, 'cubic-bezier(.4,0,.8,1)');
        weatherHit(e, t, ctx.run, '#5AA0A6', 'Русалки: −1 Команда');
        t += 240;
      });
      if (!t) tag(ctx.W / 2, ctx.g.cy, 'Команда 3 и больше теряет 1 — таких нет', 100, '', 1500);
      return t + 1300;
    },
  },
  tortuga: {
    atmo(ctx) { for (let k = 0; k < 7; k++) { const l = mk('lantern', 0, 0); const x = ctx.W * (0.12 + k * 0.125), y = ctx.g.cy + (k % 2 ? 10 : -12); A(l, [{ opacity: 0, transform: `translate(${x}px,${y + 20}px) scale(.4)` }, { opacity: 1, transform: `translate(${x}px,${y}px) scale(1)`, offset: 0.3 }, { opacity: 1, transform: `translate(${x}px,${y - 4}px) scale(1)`, offset: 0.7 }, { opacity: 0.0, transform: `translate(${x}px,${y}px) scale(.9)` }], 2400, 250 + k * 90, 'ease-in-out'); } },
    apply(ctx) { tag(ctx.W / 2, ctx.g.cy, 'Каждая команда: до 2 Пороха → столько же карт (выбор игроков)', 100, '', 1900); return 1800; },
  },
  rum: {
    atmo(ctx) { allPlanks().forEach((p, i) => { const b = bx(p), fy = facingY(p.dataset.fxShip), dir = dirOf(p.dataset.fxShip); const br = mk('barrel', 0, 0, '<svg viewBox="0 0 20 24" width="20" height="24"><rect x="1" y="1" width="18" height="22" rx="7" fill="#8A5A32" stroke="#4a2f18" stroke-width="1.5"/><path d="M1 8 H19 M1 16 H19" stroke="#4a2f18" stroke-width="1.5"/></svg>'); const x = b.x + b.w * 0.7, y = fy + dir * 22; A(br, [{ opacity: 0, transform: `translate(${x}px,${y + dir * 16}px) rotate(-10deg)` }, { opacity: 1, transform: `translate(${x}px,${y}px) rotate(8deg)`, offset: 0.3 }, { transform: `translate(${x}px,${y + 4}px) rotate(-8deg)`, offset: 0.6 }, { opacity: 1, transform: `translate(${x}px,${y}px) rotate(6deg)`, offset: 0.85 }, { opacity: 0, transform: `translate(${x}px,${y - dir * 10}px)` }], 2200, 300 + i * 100, 'ease-in-out'); }); },
    apply(ctx, effects, used) {
      let t = 0;
      effects.forEach((e) => { if (e.type !== 'restored') return; used.add(e); weatherRestore(e, t, ctx.run); const b = bx(plank(e.ship)); tag(b.cx, b.y - 12, 'Ром: +1 Команда', t + 100, 'good', 1300); t += 260; });
      if (!t) tag(ctx.W / 2, ctx.g.cy, 'Команды и так полные', 100, '', 1400);
      return t + 1300;
    },
  },
  caravan: {
    atmo(ctx) { for (let k = 0; k < 3; k++) { const s = mk('sail', 0, 0, '<svg viewBox="0 0 60 40" width="60" height="40"><path d="M6 32 h44 l-7 7 h-30z" fill="#7A5230"/><path d="M28 30 V2 L46 28 Z" fill="#FFF6E0" stroke="#C9B48C"/><path d="M25 30 V8 L10 28 Z" fill="#FFF6E0" stroke="#C9B48C"/></svg>'); const y = ctx.g.y + 10 + k * 22; A(s, [{ opacity: 0, transform: `translate(-80px,${y}px)` }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.85 }, { opacity: 0, transform: `translate(${ctx.W + 20}px,${y}px)` }], 2300, 200 + k * 260, 'linear'); } },
    apply(ctx, effects, used) { let t = 0; effects.forEach((e) => { if (e.type !== 'powderGained') return; used.add(e); powderFx(e, t, ctx.run, ctx); t += 420; }); return t + 900; },
  },
  wet: {
    atmo(ctx) { for (const side of [P, C]) { const kg = bx(holdEl(side)); const wv = mk('wetband', 0, 0); wv.style.width = kg.w + 60 + 'px'; wv.style.height = kg.h + 12 + 'px'; A(wv, [{ opacity: 0, transform: `translate(${kg.x - 60}px,${kg.y - 6}px) scaleX(.2)` }, { opacity: 0.85, transform: `translate(${kg.x - 30}px,${kg.y - 6}px) scaleX(1)`, offset: 0.5 }, { opacity: 0, transform: `translate(${kg.x + 20}px,${kg.y - 6}px) scaleX(1)` }], 1600, 600 + (side === C ? 250 : 0), 'ease-in-out'); } },
    apply(ctx, effects, used) { let t = 0; effects.forEach((e) => { if (e.type !== 'powderLost') return; used.add(e); powderFx(e, t, ctx.run, ctx); t += 380; }); if (!t) tag(ctx.W / 2, ctx.g.cy, 'Порох отсырел — но терять нечего', 100, '', 1400); return t + 1100; },
  },
  reefs: {
    atmo(ctx) { rocks(ctx).forEach((r, k) => A(r, [{ opacity: 0, transform: r._t + ' translateY(26px) scale(.6)' }, { opacity: 1, transform: r._t }], 700, 500 + k * 140, 'cubic-bezier(.2,.8,.3,1.3)', 'forwards')); },
    apply(ctx) { tag(ctx.W / 2, ctx.g.cy, 'Смена мест: −1 Корпус тому, кто двигается', 100, '', 1700); return 1500; },
  },
  thunder: {
    dim: 0.35,
    atmo(ctx) { boardFlash(ctx, [1300]); },
    apply(ctx, effects, used) {
      const hits = effects.filter((e) => e.type === 'damage' && e.track === 'sails');
      if (!hits.length) { tag(ctx.W / 2, ctx.g.cy, 'Парусов нет ни у кого — молния ушла в воду', 100, '', 1500); return 1500; }
      overlay(ctx, '#1d2a35', [{ opacity: 0 }, { opacity: 0.3, offset: 0.2 }, { opacity: 0.3, offset: 0.8 }, { opacity: 0 }], 1600, 0);
      hits.forEach((e, k) => {
        used.add(e);
        const sp = bx(trackEl(e.ship, 'sails')), t = 250 + k * 380;
        const bolt = mk('svgabs', 0, 0, `<svg width="${ctx.W}" height="${ctx.R}"><path d="M${sp.cx - 30} -10 L${sp.cx + 6} ${sp.cy * 0.45} L${sp.cx - 12} ${sp.cy * 0.5} L${sp.cx + 4} ${sp.cy}" fill="none" stroke="#FFE58A" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" style="filter:drop-shadow(0 0 8px #FFD84A)"/></svg>`);
        A(bolt, [{ opacity: 0 }, { opacity: 1, offset: 0.08 }, { opacity: 0.3, offset: 0.25 }, { opacity: 1, offset: 0.35 }, { opacity: 0 }], 700, t, 'linear');
        flash(sp.cx, sp.cy, t + 60, 2); burst('spark', sp.cx, sp.cy, t + 60, 12, 14, 40, 500); ring(sp.cx, sp.cy, t + 60);
        shake(plank(e.ship), t + 60, 4);
        weatherHit(e, t + 80, ctx.run, '#FFD84A', `Гроза: −${e.amount} Паруса`);
      });
      return 250 + hits.length * 380 + 1300;
    },
  },
  fleet: {
    atmo(ctx) { for (let k = 0; k < 9; k++) { const s = mk('sail small', 0, 0, '<svg viewBox="0 0 30 30" width="22" height="22"><path d="M14 26 V3 L27 24 Z" fill="#5E8FB0"/><path d="M12 26 V8 L3 24 Z" fill="#5E8FB0"/><path d="M2 26 H28" stroke="#5E8FB0" stroke-width="2"/></svg>'); const x = ctx.W * (0.06 + k * 0.11); A(s, [{ opacity: 0, transform: `translate(${x}px,${ctx.g.y + 14}px) scale(.3)` }, { opacity: 0.85, transform: `translate(${x}px,${ctx.g.y + 4}px) scale(1)` }], 700, 400 + k * 120, 'ease-out', 'forwards'); } },
    apply(ctx) { aliveCodes().forEach((code, i) => { const h = bx(plank(code).querySelector('.plank-head')); const b = mk('tag plus', h.r - 40, h.cy, '+1 карта'); A(b, [{ opacity: 0, scale: '1.8' }, { opacity: 1, scale: '1', offset: 0.2 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], 1400, i * 130, 'cubic-bezier(.3,1.6,.5,1)'); }); return 1400; },
  },
  moon: {
    dim: 0.4,
    atmo(ctx) { const m = mk('moonorb', 0, 0); A(m, [{ opacity: 0, transform: `translate(${ctx.W * 0.82}px,${ctx.g.b}px)` }, { opacity: 1, transform: `translate(${ctx.W * 0.82}px,${ctx.g.y - 6}px)` }], 1900, 300, 'ease-out', 'forwards'); if (RICH) for (let k = 0; k < 14; k++) { const s = mk('sparkle', 0, 0); const x = Math.random() * ctx.W, y = Math.random() * ctx.R; A(s, [{ opacity: 0, transform: `translate(${x}px,${y}px) scale(.5)` }, { opacity: 0.9, offset: 0.5 }, { opacity: 0, transform: `translate(${x}px,${y}px) scale(1)` }], 900, 500 + Math.random() * 1500); } },
    apply(ctx) { board.querySelectorAll('[data-fx-track="crew"] .cells i.on').forEach((pip, k) => A(pip, [{ background: '#2A2521' }, { background: '#E8EEF6', boxShadow: '0 0 6px #C9D8EA', offset: 0.5 }, { background: '#8FA3BC', boxShadow: 'none' }], 900, k * 40, 'ease-out', 'forwards')); tag(ctx.W / 2, ctx.g.cy, 'Урон по Команде −1 (каждый)', 200, '', 1600); return 1500; },
  },
  current: {
    atmo(ctx) { for (let k = 0; k < (RICH ? 10 : 4); k++) { const ar = mk('chevron', 0, 0, k % 2 ? '›' : '‹'); const y = ctx.g.y + 18 + (k % 3) * 26; const right = k % 2 === 1; A(ar, [{ opacity: 0, transform: `translate(${right ? 20 : ctx.W - 40}px,${y}px)` }, { opacity: 0.9, offset: 0.2 }, { opacity: 0, transform: `translate(${right ? ctx.W - 40 : 20}px,${y}px)` }], 1500, 300 + k * 160, 'linear'); } },
    async applyAsync(ctx, effects, used, events) {
      const sw = effects.filter((e) => e.type === 'swapped'); sw.forEach((e) => used.add(e));
      tag(ctx.W / 2, ctx.g.cy, 'Обе команды меняются местами', 150, '', 1300);
      if (sw.length) await flipTo(events, ctx.run, 700, (e) => e.type === 'swapped' || e.type === 'seaRevealed');
      return 600;
    },
  },
};

/** Остаток событий погоды, которые не показала сама карта (на случай новых карт и правил). */
function seaLeftovers(ctx, effects, used, t0) {
  let t = t0;
  for (const e of effects) {
    if (used.has(e)) continue;
    if (e.type === 'damage') { weatherHit(e, t, ctx.run, '#24465C', 'Море'); t += 300; }
    else if (e.type === 'restored') { weatherRestore(e, t, ctx.run); t += 300; }
    else if (e.type === 'powderGained' || e.type === 'powderLost') { powderFx(e, t, ctx.run, ctx); t += 380; }
    else if (e.type === 'soulsGained') { tag(bx(plank(e.ship)).cx, bx(plank(e.ship)).y - 12, `+${e.amount} Душа`, t, 'good', 1200); t += 200; }
  }
  return t - t0;
}

PLAY.sea = async (c, run) => {
  const ctx = tableCtx(run);
  const key = c.key, S = G.sea[c.card], fxs = SEAFX[key] || {};
  const W = ctx.W, R = ctx.R;
  if (c.round) { const g = gapBox(); const bn = mk('banner small', W / 2, g.cy, `Раунд ${c.round}`); A(bn, [{ opacity: 0, scale: '.85' }, { opacity: 1, scale: '1', offset: 0.2 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], 900, 0); hint(`Раунд ${c.round}: новая карта моря`); await wait(700, run); }
  if (c.reshuffled) { const db = bx(board.querySelector('[data-fx-deck]') || board); tag(db.cx, db.y - 10, 'Колода моря перемешана', 0, '', 1200); }
  const dim = mk('dim', 0, 0); dim.style.width = W + 'px'; dim.style.height = R + 'px';
  const dk = fxs.dim ?? 0.22;
  A(dim, [{ opacity: 0 }, { opacity: dk, offset: 0.15 }, { opacity: dk, offset: 0.8 }, { opacity: 0 }], 2900, 0);
  const storm = key === 'storm';
  const card = mk('seacard', W / 2, R / 2 - 8, `<div class="art" style="background:${SEA_BG[key]}"><span class="kind">Море · ${S.when.toLowerCase()}</span>
      ${storm ? `<svg class="c3" style="position:absolute;left:60px;top:-4px;opacity:.75" width="150" height="56" viewBox="0 0 150 56"><g fill="#6B7A88"><ellipse cx="60" cy="28" rx="44" ry="22"/><ellipse cx="104" cy="30" rx="34" ry="18"/></g></svg>
      <svg class="c1" style="position:absolute;left:6px;top:14px" width="130" height="66" viewBox="0 0 130 66"><g fill="#C9D0D6"><ellipse cx="56" cy="30" rx="36" ry="22"/><ellipse cx="30" cy="40" rx="24" ry="15"/><rect x="18" y="34" width="96" height="22" rx="11"/></g><g fill="#E6EAEE"><ellipse cx="52" cy="24" rx="26" ry="14"/></g><rect x="18" y="46" width="96" height="10" rx="5" fill="#9AA6B0"/></svg>
      <svg class="c2" style="position:absolute;left:112px;top:10px" width="140" height="66" viewBox="0 0 140 66"><g fill="#C9D0D6"><ellipse cx="66" cy="28" rx="34" ry="24"/><ellipse cx="100" cy="40" rx="26" ry="15"/><rect x="14" y="34" width="110" height="22" rx="11"/></g><g fill="#E6EAEE"><ellipse cx="62" cy="20" rx="24" ry="13"/></g><rect x="14" y="46" width="110" height="10" rx="5" fill="#9AA6B0"/></svg>
      <svg class="bolt" style="position:absolute;inset:0;z-index:3" viewBox="0 0 260 124"><path class="b1" d="M132 58 L118 80 L130 82 L114 112 L122 96" fill="none" stroke="#FFE58A" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" style="filter:drop-shadow(0 0 6px #FFD84A)" stroke-dasharray="160" stroke-dashoffset="160"/><path class="b2" d="M200 54 L192 72 L200 74 L188 98" fill="none" stroke="#FFE58A" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" style="filter:drop-shadow(0 0 6px #FFD84A)" stroke-dasharray="120" stroke-dashoffset="120"/></svg>` : `<div class="artmain">${seaSvg(key)}</div>`}
      <div class="fl"></div></div>
      <div class="body"><div class="t">${esc(S.name)}</div><div class="fxl">${esc(S.big)}</div><span class="dur">${S.when === 'Сразу' ? 'действует сразу' : 'до следующей карты моря'}</span></div>`);
  const sc = Math.min(1, (W - 32) / 250);
  A(card, [{ opacity: 0, transform: `translate(-50%,-50%) scale(${0.78 * sc}) translateY(16px)` }, { opacity: 1, transform: `translate(-50%,-50%) scale(${sc})` }], 450, 0, 'cubic-bezier(.2,.9,.3,1.25)', 'forwards');
  hint(`Море: «${S.name}» — ${strip(S.text)}`);
  if (storm) {
    A(card.querySelector('.c1'), [{ transform: 'translateX(-140px)' }, { transform: 'none' }], 750, 100, 'cubic-bezier(.2,.8,.3,1)');
    A(card.querySelector('.c2'), [{ transform: 'translateX(140px)' }, { transform: 'none' }], 750, 150, 'cubic-bezier(.2,.8,.3,1)');
    A(card.querySelector('.c3'), [{ transform: 'translateY(-60px)', opacity: 0 }, { transform: 'none', opacity: 0.75 }], 800, 50, 'cubic-bezier(.2,.8,.3,1)');
    A(card.querySelector('.b1'), [{ strokeDashoffset: 160, opacity: 1 }, { strokeDashoffset: 0, opacity: 1, offset: 0.2 }, { opacity: 0.25, offset: 0.45 }, { opacity: 1, offset: 0.6 }, { strokeDashoffset: 0, opacity: 0 }], 1100, 950);
    A(card.querySelector('.b2'), [{ strokeDashoffset: 120, opacity: 1 }, { strokeDashoffset: 0, opacity: 1, offset: 0.2 }, { strokeDashoffset: 0, opacity: 0 }], 850, 1550);
    A(card.querySelector('.fl'), [{ opacity: 0 }, { opacity: 0.9, offset: 0.06 }, { opacity: 0, offset: 0.18 }, { opacity: 0.45, offset: 0.28 }, { opacity: 0, offset: 0.36 }, { opacity: 0, offset: 0.6 }, { opacity: 0.6, offset: 0.64 }, { opacity: 0, offset: 0.72 }, { opacity: 0 }], 1000, 950, 'linear');
    at(950, run, () => shake(card.querySelector('.art'), 0, 4));
  } else {
    A(card.querySelector('.artmain'), [{ transform: 'scale(.6) translateY(10px)', opacity: 0 }, { transform: 'scale(1.08)', opacity: 1, offset: 0.6 }, { transform: 'scale(1)', opacity: 1 }], 700, 250, 'cubic-bezier(.2,.8,.3,1.2)');
  }
  if (fxs.atmo) fxs.atmo(ctx);
  // карта улетает в значок «Море» строки состояния (значок вне доски — карта уходит за верхний край)
  const chip = document.querySelector('[data-fx-sea-chip]');
  const out = storm ? 2350 : 2150;
  const target = chip ? bx(chip) : { cx: W - 60, cy: -20 };
  A(card, [{ opacity: 1, transform: `translate(-50%,-50%) scale(${sc})` }, { opacity: 0, transform: `translate(calc(-50% + ${target.cx - W / 2}px), calc(-50% + ${target.cy - (R / 2 - 8)}px)) scale(.16)` }], 450, out, 'ease-in', 'forwards');
  at(out + 400, run, () => {
    if (!chip) return;
    chip.hidden = false;
    chip.innerHTML = `${chipIcon(c.card)}<span class="wide"><b>Море:</b> ${esc(S.name)} <span class="muted">· ${esc(S.big)}</span></span><span class="narrow">${esc(S.name)} ⓘ</span>`;
    A(chip, [{ transform: 'scale(1.25)' }, { transform: 'scale(1)' }], 300, 0, 'ease-out', 'none');
    renderWeather(c.card);
  });
  await wait(out + 450, run);
  // изменения на планшетах — когда карта уже не закрывает стол
  const effects = (c.effects || []).filter((e) => e.type !== 'seaEffect');
  const used = new Set();
  let extra = 0;
  if (fxs.applyAsync) extra = await fxs.applyAsync(ctx, effects, used, c.events);
  else if (fxs.apply) extra = fxs.apply(ctx, effects, used);
  else if (fxs.rule) { tag(W / 2, ctx.g.cy, fxs.rule, 100, '', 1500); extra = 1400; }
  const rest = seaLeftovers(ctx, effects, used, extra ? extra - 600 : 0);
  await wait(250 + Math.max(extra, rest + 900), run);
};

/** Новый раунд без смены карты моря (если такое будет). */
PLAY.round = async (c, run) => {
  const g = gapBox(); const bn = mk('banner small', board.clientWidth / 2, g.cy, `Раунд ${c.round}`);
  A(bn, [{ opacity: 0, scale: '.85' }, { opacity: 1, scale: '1', offset: 0.2 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], 900, 0);
  await wait(800, run);
};

/** Тихий фон раунда — по текущей карте моря. Движущиеся элементы выключаются в «простых» и без анимации. */
let weatherKey = null;
function renderWeather(force) {
  const code = force || D.sea;
  const key = code ? seaKeyOf(code) : null;
  const moving = RICH && SPEED > 0;
  const k2 = `${key}|${moving}|${board.clientWidth}|${board.clientHeight}|${Object.keys(D.ships).map((c) => D.ships[c].pos + (D.ships[c].sunk ? 's' : '')).join('')}`;
  if (k2 === weatherKey && !force) return;
  weatherKey = k2;
  weather.innerHTML = '';
  if (!key || !board.querySelector('[data-fx-gap]')) return;
  const ctx = tableCtx(0);
  const add = (cls, style = {}) => { const d = document.createElement('div'); d.className = cls; Object.assign(d.style, style); weather.appendChild(d); return d; };
  if (key === 'storm' && moving) for (let i = 0; i < 14; i++) { const d = add('drop'); const x = Math.random() * (ctx.W + 80), y = Math.random() * ctx.R; d.animate([{ transform: `translate(${x}px,${y - 40}px) rotate(22deg)`, opacity: 0 }, { opacity: 0.45, offset: 0.2 }, { transform: `translate(${x - 40}px,${y + 70}px) rotate(22deg)`, opacity: 0 }], { duration: 1500 + Math.random() * 900, delay: -Math.random() * 2000, iterations: Infinity }); }
  if (key === 'fog') { for (const [x, y] of [[0, 0], [1, 0], [0, 1], [1, 1]]) add('haze', { left: x ? 'auto' : '-80px', right: x ? '-80px' : 'auto', top: y ? 'auto' : '-60px', bottom: y ? '-60px' : 'auto' }); diagLines(ctx, weather); }
  if (key === 'calm') { const d = document.createElement('div'); d.className = 'svgabs'; d.style.opacity = 1; d.innerHTML = `<svg width="${ctx.W}" height="${ctx.R}"><g stroke="#9CC3DA" stroke-width="2" opacity=".6"><path d="M20 ${ctx.g.cy - 14} H${ctx.W - 20}"/><path d="M60 ${ctx.g.cy + 12} H${ctx.W - 60}"/></g></svg>`; weather.appendChild(d); }
  if (key === 'wind' && moving) for (let k = 0; k < 3; k++) { const s = add('streak'); s.style.width = '120px'; const y = 30 + k * (ctx.R / 3); s.animate([{ transform: `translate(-140px,${y}px)`, opacity: 0 }, { opacity: 0.5, offset: 0.4 }, { transform: `translate(${ctx.W}px,${y - 10}px)`, opacity: 0 }], { duration: 1600, delay: k * 1300, iterations: Infinity, easing: 'ease-in' }); }
  if (key === 'maelstrom') { const w = add('whirl bg'); w.innerHTML = '<svg viewBox="-50 -50 100 100" width="160" height="88"><g fill="none" stroke="#5E86A0" stroke-width="2.5" stroke-linecap="round" opacity=".45"><path d="M0 0 m-4 0 a4 4 0 1 1 8 0 a10 10 0 1 1 -20 0 a16 16 0 1 1 32 0 a22 22 0 1 1 -44 0 a28 28 0 1 1 56 0"/></g></svg>'; Object.assign(w.style, { left: ctx.W / 2 - 80 + 'px', top: ctx.g.cy - 44 + 'px', opacity: 1 }); if (moving) w.firstChild.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-360deg)' }], { duration: 12000, iterations: Infinity }); }
  if (key === 'clear') add('tint', { width: ctx.W + 'px', height: ctx.R + 'px', background: 'radial-gradient(ellipse at 50% 0%, rgba(255,214,120,.22), transparent 60%)', opacity: 1 });
  if (key === 'reefs') rocks(ctx, weather);
  if (key === 'moon') add('tint', { width: ctx.W + 'px', height: ctx.R + 'px', background: 'rgba(31,42,68,.12)', opacity: 1 });
  if (key === 'wave' && moving) for (let k = 0; k < 2; k++) { const w = document.createElement('div'); w.className = 'svgabs'; w.innerHTML = `<svg width="${ctx.W}" height="20"><path d="${wavyPath(ctx.W, 10, 6, 40)}" fill="none" stroke="#5E9CC0" stroke-width="2" opacity=".5"/></svg>`; weather.appendChild(w); w.animate([{ transform: `translate(-40px,${ctx.g.cy - 16 + k * 22}px)`, opacity: 0.6 }, { transform: `translate(0px,${ctx.g.cy - 16 + k * 22}px)`, opacity: 0.6 }], { duration: 2600, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out', delay: k * 600 }); }
}
