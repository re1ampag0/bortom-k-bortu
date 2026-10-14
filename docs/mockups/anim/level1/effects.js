/* =====================================================================================================
   effects.js — примитивы эффектов (переносится в игру как src/ui/game/fx/primitives.ts).
   Правила: двигаем только transform и opacity (WAAPI element.animate), позиции берём из настоящих
   элементов стола (getBoundingClientRect относительно доски), все длительности × множитель скорости.
   Эффекты живут в слое .fx-layer (pointer-events: none) и не мешают нажимать карты и кнопки.
   ===================================================================================================== */
'use strict';
let SPEED = 1, RICH = true, RUN = 0;
const ABORT = Symbol('abort');
const ms = (t) => t * SPEED;
function wait(t, run) { return new Promise((res, rej) => setTimeout(() => (run === RUN ? res() : rej(ABORT)), ms(t))); }
function at(t, run, fn) { setTimeout(() => { if (run === RUN) fn(); }, ms(t)); }
function A(el, kf, d, delay = 0, easing = 'ease-out', fill = 'both') { return el.animate(kf, { duration: Math.max(1, ms(d)), delay: ms(delay), easing, fill }); }
function bx(el) {
  const r = el.getBoundingClientRect(), b = board.getBoundingClientRect();
  return { x: r.left - b.left, y: r.top - b.top, w: r.width, h: r.height, cx: r.left - b.left + r.width / 2, cy: r.top - b.top + r.height / 2, r: r.right - b.left, b: r.bottom - b.top };
}
function mk(cls, x, y, html = '') { const d = document.createElement('div'); d.className = cls; d.style.left = x + 'px'; d.style.top = y + 'px'; d.innerHTML = html; fx.appendChild(d); return d; }
const visible = (el) => !!el && el.getClientRects().length > 0 && el.offsetWidth > 0;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ——— DOM-контракт: как найти элементы стола ——— */
const plank = (code) => board.querySelector(`[data-fx-ship="${code}"]`);
const trackEl = (code, t) => plank(code).querySelector(`[data-fx-track="${t}"]`);
const valueEl = (code, t) => trackEl(code, t).querySelector('[data-fx-value]');
const gapBox = () => bx(board.querySelector('[data-fx-gap]'));
const holdEl = (side) => board.querySelector(`[data-fx-hold="${side}"]`);
const handCardEl = (code) => board.querySelector(`[data-fx-hand] [data-fx-card="${code}"]`);
const isTop = (code) => sideOf(code) !== bottomSide();
/** Край планшета, обращённый к противнику: отсюда вылетают ядра и сюда они бьют. */
const facingY = (code) => { const b = bx(plank(code)); return isTop(code) ? b.b : b.y; };
const dirOf = (code) => (isTop(code) ? 1 : -1); // +1 — стреляет вниз

/**
 * Точка клетки шкалы. На ноутбуке — сама клетка (.cells i), на телефоне у Корпуса — участок полоски (.bar),
 * у остальных шкал — окошко с числом. Так ядра летят в то место, которое игрок видит.
 */
function fxPoint(code, t, idx) {
  const tr = trackEl(code, t), max = G.ships[code].max[t];
  const i = clamp(idx, 0, max - 1);
  const cells = tr.querySelector('.cells');
  if (visible(cells) && cells.children[i]) { const c = bx(cells.children[i]); return { x: c.cx, y: c.cy }; }
  const bar = tr.querySelector('.bar');
  if (visible(bar)) { const b = bx(bar); return { x: b.x + (b.w * (i + 0.5)) / max, y: b.cy }; }
  const v = bx(tr.querySelector('[data-fx-value]'));
  return { x: v.cx, y: v.cy };
}
/** Показать на планшете новое значение шкалы посреди анимации (клетка гаснет/зажигается, полоска, число). */
function setTrack(code, t, v, flashColor) {
  const tr = trackEl(code, t), max = G.ships[code].max[t];
  const cells = tr.querySelector('.cells');
  [...cells.children].forEach((c, i) => {
    const on = i < v, was = c.classList.contains('on');
    c.classList.toggle('on', on);
    if (flashColor && on !== was) A(c, [{ background: flashColor, boxShadow: `0 0 0 2px ${flashColor}55` }, { background: on ? '#2a241d' : '#e2d8c7', boxShadow: 'none' }], 900, 0, 'linear', 'none');
  });
  const bar = tr.querySelector('.bar i');
  if (bar) bar.style.width = `${(100 * v) / max}%`;
  const num = tr.querySelector('[data-fx-value]');
  num.textContent = `${v}/${max}`;
  if (flashColor) A(num, [{ color: flashColor }, { color: '#2a241d' }], 800, 0);
  if (flashColor && !visible(cells)) A(visible(tr.querySelector('.bar')) ? tr.querySelector('.bar') : tr, [{ boxShadow: `0 0 0 2px ${flashColor}` }, { boxShadow: 'none' }], 700, 0, 'ease-out', 'none');
}
/** Число отображаемого значения шкалы (как на планшете сейчас). */
const shownTrack = (code, t) => Number(valueEl(code, t).textContent.split('/')[0]);

/* ——— движение ——— */
function curve(p0, p1, bend, n = 18) {
  const dx = p1.x - p0.x, dy = p1.y - p0.y;
  const c = { x: (p0.x + p1.x) / 2 - dy * bend, y: (p0.y + p1.y) / 2 + dx * bend };
  return Array.from({ length: n + 1 }, (_, i) => { const t = i / n; return { x: (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * c.x + t * t * p1.x, y: (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * c.y + t * t * p1.y }; });
}
/** Полёт по точкам. lift — «высота» ядра (масштаб в середине пути): вид сверху, ядро летит дугой. */
function fly(el, pts, d, delay, { lift = 0.3, fadeEnd = true, spin = 0 } = {}) {
  const n = pts.length - 1;
  return A(el, pts.map((p, i) => ({ offset: i / n, opacity: fadeEnd && i === n ? 0 : 1, transform: `translate(${p.x}px,${p.y}px) scale(${1 + lift * Math.sin((Math.PI * i) / n)}) rotate(${(spin * i) / n}deg)` })), d, delay, 'cubic-bezier(.3,0,.75,1)', 'forwards');
}
function pop(el, x, y, d, delay, from = 0.3, to = 1.6) { A(el, [{ opacity: 0, transform: `translate(${x}px,${y}px) scale(${from})` }, { opacity: 1, transform: `translate(${x}px,${y}px) scale(1)`, offset: 0.25 }, { opacity: 0, transform: `translate(${x}px,${y}px) scale(${to})` }], d, delay); }
function flash(x, y, delay, size = 1) { const f = mk('flash', 0, 0); pop(f, x, y, 350, delay, 0.3 * size, 1.6 * size); }
function puff(x, y, delay) { if (!RICH) return; const p = mk('puff', 0, 0); A(p, [{ opacity: 0, transform: `translate(${x}px,${y}px) scale(.4)` }, { opacity: 0.95, offset: 0.15 }, { opacity: 0, transform: `translate(${x - 6}px,${y - 10}px) scale(2.4)` }], 1500, delay); }
function burst(cls, x, y, delay, n, r0, r1, dur = 600, angle0 = 0, spread = 2 * Math.PI) {
  if (!RICH) return;
  for (let k = 0; k < n; k++) {
    const e = mk(cls, 0, 0);
    const a = angle0 + (k / n - 0.5) * spread + (Math.random() - 0.5) * 0.4, r = r0 + Math.random() * (r1 - r0);
    A(e, [{ opacity: 1, transform: `translate(${x}px,${y}px) rotate(${a}rad)` }, { opacity: 0, transform: `translate(${x + Math.cos(a) * r}px,${y + Math.sin(a) * r}px) rotate(${a + (cls === 'spark' ? 0 : 3)}rad)` }], dur, delay, 'cubic-bezier(.2,.7,.3,1)');
  }
}
function splash(x, y, delay) {
  const s = mk('splash', 0, 0, '<svg viewBox="0 0 44 30" width="44" height="30"><g fill="#9CC3DA"><path d="M22 30 C18 18 14 10 10 4 C16 10 19 16 22 22 C25 16 28 10 34 4 C30 10 26 18 22 30Z"/><circle cx="8" cy="14" r="2.5"/><circle cx="36" cy="12" r="2.5"/><circle cx="22" cy="4" r="2"/></g></svg>');
  A(s, [{ opacity: 0, transform: `translate(${x}px,${y}px) scale(.3)` }, { opacity: 1, transform: `translate(${x}px,${y}px) scale(1)`, offset: 0.25 }, { opacity: 0, transform: `translate(${x}px,${y - 6}px) scale(1.2)` }], 700, delay);
  const r = mk('ripple', 0, 0);
  A(r, [{ opacity: 0.9, transform: `translate(${x}px,${y}px) scale(.3)` }, { opacity: 0, transform: `translate(${x}px,${y}px) scale(1.8)` }], 900, delay);
  if (RICH) { const r2 = mk('ripple', 0, 0); A(r2, [{ opacity: 0.6, transform: `translate(${x}px,${y}px) scale(.2)` }, { opacity: 0, transform: `translate(${x}px,${y}px) scale(1.3)` }], 900, delay + 160); }
}
function tag(x, y, text, delay, cls = '', dur = 1500) { const t = mk('tag ' + cls, x, y); t.textContent = text; A(t, [{ opacity: 0, translate: '0 4px' }, { opacity: 1, translate: '0 0', offset: 0.12 }, { opacity: 1, offset: 0.82 }, { opacity: 0 }], dur, delay); return t; }
function bubbles(x, y, w, delay, n = 10, rise = 40) { if (!RICH) return; for (let k = 0; k < n; k++) { const b = mk('bubble', 0, 0); const bx0 = x + Math.random() * w, by = y - Math.random() * 8; A(b, [{ opacity: 0, transform: `translate(${bx0}px,${by}px) scale(.5)` }, { opacity: 0.9, offset: 0.2 }, { opacity: 0, transform: `translate(${bx0 + (Math.random() - 0.5) * 12}px,${by - rise - Math.random() * 20}px) scale(1.1)` }], 900 + Math.random() * 400, delay + Math.random() * 500); } }
function steam(x, y, delay) { for (let k = 0; k < (RICH ? 5 : 1); k++) { const p = mk('puff', 0, 0); A(p, [{ opacity: 0, transform: `translate(${x}px,${y}px) scale(.2)` }, { opacity: 0.8, offset: 0.2 }, { opacity: 0, transform: `translate(${x + (k - 2) * 6}px,${y - 26}px) scale(1.1)` }], 900, delay + k * 70); } }
/** Тряска: слабый удар 2–3 px, сильный 8–10 px, 50–100 мс на фазу (см. «ощущение удара»). */
function shake(el, delay, amp = 3, d = 260) { A(el, [{ transform: 'none' }, { transform: `translate(${-amp}px,1px)` }, { transform: `translate(${amp}px,-1px)` }, { transform: `translate(${-amp * 0.6}px,0)` }, { transform: `translate(${amp * 0.3}px,0)` }, { transform: 'none' }], d, delay, 'linear', 'none'); }
function ring(x, y, delay, size = 1, color) { if (!RICH) return; const r = mk('ring', 0, 0); if (color) r.style.borderColor = color; A(r, [{ opacity: 0.9, transform: `translate(${x}px,${y}px) scale(${0.2 * size})` }, { opacity: 0, transform: `translate(${x}px,${y}px) scale(${1.6 * size})` }], 500, delay); }
function overlayAt(cls, b, pad = 0) { const o = mk(cls, 0, 0); o.style.width = b.w + pad * 2 + 'px'; o.style.height = b.h + pad * 2 + 'px'; o.style.transform = `translate(${b.x - pad}px,${b.y - pad}px)`; return o; }
function whirlpool(x, y, delay, run, size = 90, dur = 0) {
  const w = mk('whirl', 0, 0, `<svg viewBox="-50 -50 100 100" width="${size}" height="${size * 0.55}"><g fill="none" stroke="#5E86A0" stroke-width="3" stroke-linecap="round"><path d="M0 0 m-4 0 a4 4 0 1 1 8 0 a10 10 0 1 1 -20 0 a16 16 0 1 1 32 0 a22 22 0 1 1 -44 0 a28 28 0 1 1 56 0"/></g><circle r="5" fill="#24465C"/></svg>`);
  w.style.width = size + 'px'; w.style.height = size * 0.55 + 'px'; w.style.margin = `-${size * 0.275}px 0 0 -${size / 2}px`;
  A(w, [{ opacity: 0, transform: `translate(${x}px,${y}px) scale(.2)` }, { opacity: 1, transform: `translate(${x}px,${y}px) scale(1)` }], 500, delay, 'ease-out', 'forwards');
  if (RICH) w.querySelector('svg').animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(-360deg)' }], { duration: ms(1800), iterations: dur ? Math.ceil(dur / 1800) : 6, delay: ms(delay) });
  return w;
}
function wisp(from, to, delay, d = 800) { const w = mk('wisp', 0, 0); fly(w, curve(from, to, 0.25, 14), d, delay, { lift: 0.4 }); if (RICH) for (let k = 1; k <= 3; k++) { const t = mk('wisp', 0, 0); t.style.transform = 'scale(.6)'; A(t, curve(from, to, 0.25, 14).map((p, i, a) => ({ offset: i / (a.length - 1), opacity: i === a.length - 1 ? 0 : 0.35 / k, transform: `translate(${p.x}px,${p.y}px) scale(${0.7 - k * 0.12})` })), d, delay + k * 40, 'cubic-bezier(.3,0,.75,1)', 'forwards'); } }

/** Снаряды по виду (вид выбирает planfx.js по шкале, источнику и fx карты). */
function projectile(kind, big) {
  if (kind === 'chain') return mk('chainshot', 0, 0, '<svg viewBox="0 0 30 14" width="30" height="14"><path d="M7 7 Q15 1 23 7" fill="none" stroke="#5a524b" stroke-width="1.6" stroke-dasharray="2 1.5"/><circle cx="6" cy="7" r="5" fill="#1E1A17"/><circle cx="24" cy="7" r="5" fill="#1E1A17"/></svg>');
  if (kind === 'grape') return mk('grape', 0, 0, '<svg viewBox="0 0 18 18" width="18" height="18"><g fill="#3a332d"><circle cx="5" cy="6" r="2.2"/><circle cx="11" cy="4" r="2"/><circle cx="14" cy="10" r="2.2"/><circle cx="8" cy="12" r="2.3"/><circle cx="4" cy="13" r="1.6"/><circle cx="10" cy="8" r="1.8"/></g></svg>');
  if (kind === 'keg') return mk('keg', 0, 0);
  const cls = { fire: ' fire', hot: ' hot', gold: ' gold', ghost: ' ghost', under: ' wet', flag: ' gold' }[kind] || '';
  return mk('ball' + cls + (big ? ' big' : ''), 0, 0);
}
/** Порох уходит из Трюма: последние n бочонков вспыхивают и пустеют. */
function payKegs(side, n, delay, label = true) {
  if (!n) return;
  const kg = holdEl(side), kids = kg.querySelectorAll('[data-fx-keg]');
  const have = D.powder[side];
  for (let k = 0; k < n; k++) { const keg = kids[have - 1 - k]; if (keg) A(keg, [{ transform: 'scale(1)', background: '#2a241d' }, { transform: 'scale(1.5)', background: '#F2913D', offset: 0.35 }, { transform: 'scale(1)', background: 'rgba(0,0,0,0)' }], 450, delay + 80 * k, 'ease-in', 'forwards'); }
  if (label) { const kb = bx(kg); tag(kb.r + 34, kb.cy, `−${n} Порох`, delay, '', 1000); }
}
/** Бочонки прилетают в Трюм. */
function gainKegs(side, n, from, delay, label = true) {
  const kg = holdEl(side), kids = kg.querySelectorAll('[data-fx-keg]');
  const have = D.powder[side];
  for (let k = 0; k < n; k++) {
    const slot = kids[Math.min(kids.length - 1, have + k)], sb = bx(slot);
    const keg = mk('keg', 0, 0);
    fly(keg, curve({ x: from.x + (k - (n - 1) / 2) * 18, y: from.y }, { x: sb.cx, y: sb.cy }, 0.12), 520, delay + k * 130, { lift: 0.25 });
    setTimeout(() => { slot.classList.add('on'); A(slot, [{ transform: 'scale(1.5)' }, { transform: 'scale(1)' }], 250, 0); }, ms(delay + 520 + k * 130));
  }
  if (label && n) { const kb = bx(kg); tag(kb.r + 36, kb.cy, `+${n} Пороха`, delay + 300, 'plus', 1300); }
  return delay + 520 + n * 130;
}
function cardHTMLFor(code) { return hcardHTML(code); }
/** Карта летит (из руки, из-за края стола, из колоды). */
function flyCard(code, from, to, delay, d = 450, ribbon = '', ribbonCls = '') {
  const el = mk('flyc', 0, 0, `<div style="position:relative">${hcardHTML(code)}${ribbon ? `<span class="rib ${ribbonCls}">${ribbon}</span>` : ''}</div>`);
  A(el, [{ opacity: 1, transform: `translate(${from.x}px,${from.y}px) rotate(${from.r || 0}deg) scale(${from.s || 1})` }, { opacity: 1, transform: `translate(${to.x}px,${to.y}px) rotate(${to.r || 0}deg) scale(${to.s || 0.72})` }], d, delay, 'cubic-bezier(.2,.8,.3,1.1)', 'forwards');
  el._pos = to;
  return el;
}
function moveTo(el, to, d = 400) { const f = el._pos || to; A(el, [{ transform: `translate(${f.x}px,${f.y}px) rotate(${f.r || 0}deg) scale(${f.s || 0.72})` }, { transform: `translate(${to.x}px,${to.y}px) rotate(${to.r || 0}deg) scale(${to.s || 0.72})` }], d, 0, 'cubic-bezier(.3,0,.2,1)', 'forwards'); el._pos = to; }
/** Откуда вылетает карта: своя — из руки (карта в руке прячется), чужая — из-за верхнего края над её кораблём. */
function cardOrigin(code, ship) {
  const h = handCardEl(code);
  if (h && sideOf(ship) === bottomSide()) { const b = bx(h); h.style.visibility = 'hidden'; return { x: b.x, y: b.y, s: 1 }; }
  const s = bx(plank(ship));
  return isTop(ship) ? { x: s.cx - 55, y: -150, r: -8, s: 1 } : { x: s.cx - 55, y: board.clientHeight + 20, r: 8, s: 1 };
}
function hint(text) { D.instruction = text; const el = document.querySelector('[data-fx-instruction]'); if (el) el.textContent = text; }
function pill(x, y, text, delay, cls = '') {
  const pl = mk('pill ' + cls, 0, 0, text);
  A(pl, [{ opacity: 0, transform: `translate(${x}px,${y + 8}px) scale(.4)` }, { opacity: 1, transform: `translate(${x}px,${y}px) scale(1.12)`, offset: 0.18 }, { transform: `translate(${x}px,${y + 2}px) scale(1)`, offset: 0.32 }, { opacity: 1, offset: 0.82 }, { opacity: 0, transform: `translate(${x}px,${y - 12}px) scale(1)` }], 1500, delay);
  return pl;
}
/** Пилюля «−N» у числа шкалы. */
function pillAt(code, t, n, delay, good = false) {
  const vb = bx(valueEl(code, t));
  return pill(Math.max(4, vb.x - 58), vb.cy - 20, `${good ? '+' : '−'}${n}`, delay, (good ? 'good' : '') + (n >= 4 ? ' huge' : ''));
}
