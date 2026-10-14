/* =====================================================================================================
   play-volley.js — клипы Залпа: announce → window → reaction → shot | cancel → counter; heart.
   Переносится в игру как src/ui/game/fx/volley.ts. Между клипами одного Залпа живёт «сцена Залпа» VS:
   плашка разбора, карты у плашки, подсветка, эффекты Реакций. В игре объявление и выстрел приходят
   разными действиями (между ними — окно Реакций и решение игрока), поэтому VS переживает их.
   ===================================================================================================== */
'use strict';
let VS = null;           // сцена текущего Залпа
const PERSIST = {};      // эффекты до конца хода: воронка «Водоворота»

const KIND_NAME = { fire: 'огонь', chain: 'цепь', grape: 'дробь', under: 'из-под воды', keg: 'бочонок', joint: 'с союзника', mark: 'в метку', gold: 'блик', hot: 'калёное', ghost: 'призрачное', flag: 'флаги' };
const OUT_NAME = { water: 'в воду', wind: 'ветер', bounce: 'отскок', stick: 'вязнет', past: 'мимо', whirl: 'в воронку', block: 'в заслон', overkill: 'по пустой шкале', moon: 'сквозь Команду' };

function placePlate(shooter, target) {
  const g = gapBox(), W = board.clientWidth;
  const s = bx(plank(shooter)), t = bx(plank(target));
  const lo = Math.min(s.cx, t.cx), hi = Math.max(s.cx, t.cx);
  const pw = W < 701 ? 176 : 212;
  const x = W - hi > lo ? W - pw - 12 : 12;
  return { x, y: g.y + 4, w: pw };
}
function cardSlot(p, idx) {
  const cw = board.clientWidth < 701 ? 64 : 82;
  const left = p.x > board.clientWidth / 2;
  return { x: left ? p.x - (cw + 8) * (idx + 1) : p.x + p.w + 8 + (cw + 8) * idx, y: p.y - 6 + idx * 6, r: idx ? 4 : -4, s: board.clientWidth < 701 ? 0.62 : 0.72 };
}
function termRows(terms, cls = {}) {
  return (terms || []).map((t) => {
    const src = FX.termSrc(t, { cards: G.cards, charge: VS && VS.charge, chargeName: VS && VS.charge ? cardName(VS.charge) : null, reactions: (VS && VS.reactions) || [] });
    const pos = t.n > 0 && src.kind !== 'guns';
    const c = cls[t.what] || '';
    return `<span class="${c}">${esc(t.what)}</span><span class="${t.n < 0 ? 'neg' : pos ? 'pos' : ''} ${c}">${pos ? '+' : ''}${t.n < 0 ? '−' + -t.n : t.n}</span>`;
  }).join('');
}
function plateHTML({ shooter, declared, target, track, damage, was, terms, cls, extra = '' }) {
  const who = `<b>${esc(nick(shooter))}</b> → ${declared && declared !== target ? `<s>${esc(nick(declared))}</s> ` : ''}<b>${esc(nick(target))}</b>${VS && VS.diagonal ? ', по диагонали' : ''}`;
  return `<div class="who">${who}</div><div class="big">${was != null && was !== damage ? `<s>${was}</s>` : ''}${damage} по ${TR_DAT[track]}</div>` +
    (terms ? `<div class="terms">${termRows(terms, cls)}</div>` : '') + extra;
}
/** Плашка разбора — по центру зазора между рядами; если выше зазора, прижимается к своему ряду стрелявшего. */
function fitPlate() {
  if (!VS || !VS.plate) return;
  const g = gapBox(), h = VS.plate.offsetHeight;
  const y = h <= g.h - 6 ? g.cy - h / 2 : isTop(VS.shooter) ? g.y + 2 : g.b - h - 2;
  VS.plate.style.top = y + 'px';
  if (VS.plateBox) VS.plateBox.y = y;
}
function clearVS(fade = true) {
  if (!VS) return;
  unleanAll();
  for (const el of [VS.plate, ...VS.cards, ...VS.extras]) if (el && el.isConnected) { if (fade) A(el, [{ opacity: 1 }, { opacity: 0 }], 250, 0, 'ease-in', 'forwards'); else el.remove(); }
  board.querySelectorAll('.plank.shooter, .plank.targeted, .plank.hitframe').forEach((p) => p.classList.remove('shooter', 'targeted', 'hitframe'));
  VS = null;
}

const PLAY = {};

/** Устойчивый наклон планшета на время Залпа («Уйти по ветру», «Прикрытие», погружение по Реакции).
 *  Это не анимация с fill: 'forwards', а inline-стиль — он переживает перерисовку стола (afterRender). */
function lean(code, tf, d = 420, easing = 'ease-out') {
  const el = plank(code);
  A(el, [{ transform: el.style.transform || 'none' }, { transform: tf }], d, 0, easing, 'none');
  el.style.transform = tf;
  if (VS) (VS.lean = VS.lean || {})[code] = tf;
}
function unleanAll() {
  if (!VS || !VS.lean) return;
  for (const [code, tf] of Object.entries(VS.lean)) { const el = plank(code); if (!el) continue; A(el, [{ transform: tf }, { transform: 'none' }], 300, 0, 'ease-out', 'none'); el.style.transform = ''; }
  VS.lean = {};
}

PLAY.announce = async (c, run) => {
  if (VS && VS.done) clearVS(false);
  const side = sideOf(c.shooter);
  const part2 = c.part === 2;
  if (!part2 || !VS) {
    VS = { shooter: c.shooter, target: c.target, declared: c.target, charge: c.charge, diagonal: c.diagonal, reactions: [], cards: [], extras: [], declDamage: c.damage, terms: c.terms };
  } else { Object.assign(VS, { target: c.target, declared: c.target, diagonal: c.diagonal, declDamage: c.damage, terms: c.terms, done: false, reactions: [] }); }
  hint(`${nick(c.shooter)}: Залп по ${G.ships[c.target].dat}${c.charge ? ` · Заряд «${cardName(c.charge)}»` : ''}`);
  plank(c.shooter).classList.add('shooter');
  board.querySelectorAll('.plank.targeted').forEach((p) => p.classList.remove('targeted'));
  plank(c.target).classList.add('targeted');
  payKegs(side, (c.cost.volley || 0) + (c.cost.card || 0), 0);
  const pp = placePlate(c.shooter, c.target);
  const extra = (c.noDiagBy ? `<div class="nodiag">по диагонали без штрафа: «${esc(cardName(c.noDiagBy))}»</div>` : '') +
    (c.noReact ? '<span class="stamp">Без Реакций</span>' : '') + (part2 ? '<span class="stamp" style="color:#24465c;border-color:#24465c">второй борт</span>' : '');
  if (!VS.plate || !VS.plate.isConnected) {
    VS.plate = mk('plate', pp.x, pp.y);
    VS.plate.style.setProperty('--pc', G.ships[c.shooter].color);
    VS.plate.style.width = pp.w + 'px';
    A(VS.plate, [{ opacity: 0, translate: '0 -8px' }, { opacity: 1, translate: '0 0' }], 300, 120, 'ease-out', 'forwards');
  }
  VS.plateBox = pp;
  VS.plate.innerHTML = plateHTML({ shooter: c.shooter, target: c.target, track: c.track, damage: c.damage, terms: c.terms, extra });
  fitPlate();
  if (c.charge && !part2) {
    const from = cardOrigin(c.charge, c.chargeFrom || c.shooter);
    VS.cards.push(flyCard(c.charge, from, cardSlot(pp, 0), 150, 450, c.captain ? `капитан ${G.ships[c.chargeFrom].short}` : ''));
  }
  if (part2) { const sb = bx(plank(c.shooter)); tag(sb.cx, facingY(c.shooter) + 16 * dirOf(c.shooter), 'второй борт', 100, 'plus', 1400); }
  await wait(c.charge && !part2 ? 820 : 620, run);
};

PLAY.window = async (c, run) => {
  const W = board.clientWidth, g = gapBox();
  let x = W / 2;
  if (VS && VS.plate) { const pb = bx(VS.plate); x = W < 701 ? (pb.cx > W / 2 ? pb.x / 2 : (pb.r + W) / 2) : W / 2; }
  const after = c.phase === 'after';
  const html = c.mine
    ? `<b>${after ? 'Можно ответить после попадания' : 'Ваше окно Реакций'}</b><span>в игре здесь панель решения<i></i><i></i><i></i></span>`
    : `<b>${after ? 'Противник может ответить…' : 'Противник может ответить…'}</b><span>${after ? 'после попадания' : 'ждём Реакцию'}<i></i><i></i><i></i></span>`;
  const win = mk('window' + (c.mine ? ' mine' : ''), x, g.cy, html);
  hint(c.mine ? 'Реакция?' : 'Противник может ответить Реакцией…');
  A(win, [{ opacity: 0, scale: '0.94' }, { opacity: 1, scale: '1' }], 200, 0, 'ease-out', 'forwards');
  await wait(c.mine ? 950 : 1300, run);
  A(win, [{ opacity: 1 }, { opacity: 0 }], 200, 0, 'ease-in', 'forwards');
  await wait(150, run);
};

PLAY.reaction = async (c, run) => {
  const fx2 = G.cards[c.card].fx || {};
  hint(`${nick(c.ship)}: Реакция «${cardName(c.card)}»`);
  if (c.cost) payKegs(sideOf(c.ship), c.cost, 100);
  const from = c.fromPlan ? (() => { const s = bx(plank(c.ship)); return { x: s.x + 8, y: isTop(c.ship) ? s.b - 40 : s.y - 60, s: 0.7 }; })() : cardOrigin(c.card, c.seat);
  let to;
  if (VS && VS.plate && c.phase === 'before') to = cardSlot(VS.plateBox, VS.cards.length);
  else { const s = bx(plank(c.ship)); to = { x: s.cx - 40, y: isTop(c.ship) ? s.b + 6 : s.y - 110, r: 3, s: 0.72 }; }
  const card = flyCard(c.card, from, to, 0, 500, c.fromPlan ? 'ПЛАН!' : c.phase === 'after' ? 'ОТВЕТ' : 'РЕАКЦИЯ', c.fromPlan ? 'plan' : '');
  if (VS) { VS.cards.push(card); VS.reactions.push({ card: c.card, ship: c.ship, r: c.r }); } else setTimeout(() => A(card, [{ opacity: 1 }, { opacity: 0 }], 300, 0, 'ease-in', 'forwards'), ms(1400));
  if (c.fromPlan) A(card.firstElementChild, [{ transform: 'rotateY(90deg)' }, { transform: 'none' }], 300, 300, 'ease-out', 'backwards');
  await wait(520, run);
  const tgt = VS ? VS.target : null;
  if (c.phase === 'before' && tgt) {
    if (c.r === 'reduce') {
      const tb = bx(plank(c.ship === tgt ? tgt : c.ship));
      if (cardName(c.card) === 'Уйти по ветру') {
        lean(tgt, 'translateX(10px) rotate(1.2deg)', 420, 'cubic-bezier(.3,1.4,.5,1)');
        if (RICH) for (let k = 0; k < 6; k++) { const st = mk('streak', 0, 0); st.style.width = '120px'; const y = tb.y + 10 + k * (tb.h / 6); A(st, [{ opacity: 0, transform: `translate(${tb.x - 140}px,${y}px)` }, { opacity: 0.9, offset: 0.4 }, { opacity: 0, transform: `translate(${tb.r + 40}px,${y - 6}px)` }], 700, k * 60, 'ease-in'); }
      } else {
        const ar = overlayAt('armor', tb, 5); VS.extras.push(ar);
        A(ar, [{ opacity: 0, scale: '1.06' }, { opacity: 1, scale: '1' }], 380, 0, 'ease-out', 'forwards');
        burst('spark', tb.cx, facingY(c.ship), 120, 10, 14, 34, 500);
      }
    }
    if (c.r === 'redirect') {
      const cov = plank(c.ship), d0 = bx(plank(VS.declared)), c0 = bx(cov);
      plank(VS.declared).classList.remove('targeted');
      lean(c.ship, `translate(${(d0.cx - c0.cx) * 0.05}px,${dirOf(c.ship) * 6}px)`, 450, 'cubic-bezier(.2,.8,.3,1.2)');
      cov.classList.add('targeted');
      VS.target = c.ship;
      const np = placePlate(VS.shooter, c.ship), op = VS.plateBox;
      if (Math.abs(np.x - op.x) > 4) {
        A(VS.plate, [{ translate: '0 0' }, { translate: `${np.x - op.x}px 0` }], 450, 120, 'cubic-bezier(.3,0,.2,1)', 'forwards');
        VS.plateBox = { ...op, x: np.x };
        VS.cards.forEach((el, k) => setTimeout(() => { if (run === RUN) moveTo(el, cardSlot(VS.plateBox, k), 450); }, ms(120)));
      }
    }
    if (c.r === 'reduce_all') { const g = gapBox(); if (PERSIST.whirl) PERSIST.whirl.remove(); PERSIST.whirl = whirlpool(board.clientWidth / 2, g.cy, 0, run, Math.min(170, board.clientWidth * 0.35), 6000); }
    if (c.r === 'cancel') {
      const tb = bx(plank(tgt));
      const nm = cardName(c.card);
      if (nm === 'Уйти на глубину') {
        const w = overlayAt('underwater', tb); VS.extras.push(w);
        A(w, [{ opacity: 0 }, { opacity: 1 }], 500, 0, 'ease-in', 'forwards');
        lean(tgt, 'translateY(6px) scale(.985)', 500, 'ease-in-out');
        bubbles(tb.x + 8, tb.b - 4, tb.w - 16, 100, 14, 50);
      } else if (nm === 'Банка с землёй') {
        const jar = mk('blot', 0, 0, '<svg viewBox="0 0 30 34" width="30" height="34"><rect x="8" y="2" width="14" height="5" rx="1.5" fill="#7a5230"/><path d="M6 8 h18 v20 a4 4 0 0 1 -4 4 h-10 a4 4 0 0 1 -4 -4z" fill="rgba(200,220,230,.6)" stroke="#5e6b74" stroke-width="1.5"/><path d="M7 20 h16 v8 a3 3 0 0 1 -3 3 h-10 a3 3 0 0 1 -3 -3z" fill="#6b5236"/></svg>');
        VS.extras.push(jar);
        A(jar, [{ opacity: 0, transform: `translate(${tb.cx}px,${tb.y - 10}px) scale(.5)` }, { opacity: 1, transform: `translate(${tb.cx}px,${tb.y - 20}px) scale(1.4) rotate(-8deg)`, offset: 0.4 }, { transform: `translate(${tb.cx}px,${tb.y - 20}px) scale(1.4) rotate(8deg)`, offset: 0.6 }, { opacity: 1, transform: `translate(${tb.cx}px,${tb.y - 20}px) scale(1.4) rotate(-6deg)` }], 700, 0, 'ease-in-out', 'forwards');
      } else {
        const n = overlayAt('night', tb); VS.extras.push(n);
        A(n, [{ opacity: 0 }, { opacity: 1 }], 500, 0, 'ease-in', 'forwards');
        if (RICH) for (let k = 0; k < 8; k++) { const s = mk('sparkle', 0, 0); const x = tb.x + Math.random() * tb.w, y = tb.y + Math.random() * tb.h; A(s, [{ opacity: 0, transform: `translate(${x}px,${y}px) scale(.5)` }, { opacity: 0.9, offset: 0.5 }, { opacity: 0, transform: `translate(${x}px,${y}px)` }], 900, 300 + k * 80); }
      }
    }
    if (c.r === 'cancel_charge' && VS.cards[0]) {
      const cc = VS.cards[0].querySelector('.hcard');
      cc.style.position = 'relative';
      cc.insertAdjacentHTML('beforeend', '<svg class="ink" viewBox="0 0 110 128" preserveAspectRatio="none"><path d="M10 12 L100 116" /><path d="M100 14 L12 114" /></svg>');
      VS.cards[0].querySelectorAll('.ink path').forEach((p, k) => A(p, [{ strokeDashoffset: 110 }, { strokeDashoffset: 0 }], 260, k * 200, 'ease-in', 'forwards'));
      A(VS.cards[0], [{ opacity: 1 }, { opacity: 0.45 }], 600, 500, 'ease-in', 'forwards');
    }
    if (c.r === 'cancel_crew') {
      const tr = bx(trackEl(tgt, 'crew'));
      const bar = overlayAt('barrier', { x: tr.x, y: tr.y, w: tr.w, h: tr.h }, 4); VS.extras.push(bar);
      A(bar, [{ opacity: 0, translate: `0 ${14 * -dirOf(tgt)}px` }, { opacity: 1, translate: '0 0' }], 380, 0, 'cubic-bezier(.2,.8,.3,1.3)', 'forwards');
    }
  }
  await wait(c.phase === 'before' ? 620 : 380, run);
};

/** Выстрел: ядро = 1 урон; куда летит каждое — из раскладки planfx (to: track | hull). */
PLAY.shot = async (c, run) => {
  if (!VS) VS = { shooter: c.shooter, target: c.target, declared: c.declared, charge: c.charge, reactions: c.reactions, cards: [], extras: [], declDamage: c.damage };
  VS.target = c.target;
  const shooterEl = plank(c.shooter), tPl = plank(c.target);
  hint(`${nick(c.shooter)} → ${nick(c.target)}: ${c.damage} по ${TR_DAT[c.track]}`);
  // плашка: итоговый разбор, новые строки Реакций подсвечены, отменённый Заряд зачёркнут
  if (!VS.plate || !VS.plate.isConnected) { const pp = placePlate(c.shooter, c.target); VS.plate = mk('plate', pp.x, pp.y); VS.plate.style.width = pp.w + 'px'; VS.plate.style.setProperty('--pc', G.ships[c.shooter].color); VS.plateBox = pp; A(VS.plate, [{ opacity: 0 }, { opacity: 1 }], 200, 0, 'ease-out', 'forwards'); }
  const cls = {};
  for (const r of c.reactions) cls[cardName(r.card)] = 'new';
  const blocked = c.shots.filter((b) => b.out === 'block').reduce((n, b) => n + b.units, 0);
  const extra = (c.chargeCancelled ? `<div class="who"><span class="struck">«${esc(cardName(c.charge))}»</span> отменён</div>` : '') + (blocked ? `<div class="terms"><span class="new">${esc(c.shots.find((b) => b.out === 'block').label.replace(/ −\d+$/, ''))}</span><span class="neg new">−${blocked}</span></div>` : '');
  VS.plate.innerHTML = plateHTML({ shooter: c.shooter, declared: c.declared, target: c.target, track: c.track, damage: c.damage, was: VS.declDamage, terms: c.terms, cls, extra });
  fitPlate();
  A(VS.plate, [{ scale: '1' }, { scale: '1.04' }, { scale: '1' }], 300, 0, 'ease-out', 'none');
  await wait(260, run);
  // ядра
  const s = bx(shooterEl), sy = facingY(c.shooter), down = dirOf(c.shooter);
  const muzzle = c.shots.filter((b) => !['under', 'keg', 'joint'].includes(b.kind));
  const sp = Math.min(30, (s.w * 0.55) / Math.max(1, muzzle.length));
  const STEP = 140, FLY = 420;
  let mi = 0, kTrack = 0, kHull = 0, lastHit = 0, firstHit = true, kegI = 0;
  const cur = { track: shownTrack(c.target, c.track), hull: shownTrack(c.target, 'hull') };
  const labelled = new Set();
  c.shots.forEach((b, i) => {
    const t0 = 60 + i * STEP;
    let p0;
    if (b.kind === 'under') { p0 = { x: s.cx + s.w * 0.32, y: sy + down * 22 }; bubbles(p0.x - 10, p0.y + 6, 20, t0 - 260, 8, 18); splash(p0.x, p0.y, t0 - 40); }
    else if (b.kind === 'keg') { const kids = holdEl(sideOf(c.shooter)).querySelectorAll('[data-fx-keg]'); const kb = bx(kids[Math.max(0, D.powder[sideOf(c.shooter)] + kegI++)] || kids[0]); p0 = { x: kb.cx, y: kb.cy }; flash(p0.x, p0.y, t0, 0.8); }
    else if (b.kind === 'joint') { const ally = Object.keys(G.ships).find((x) => sideOf(x) === sideOf(c.shooter) && x !== c.shooter); const ab = bx(plank(ally)); p0 = { x: ab.cx, y: facingY(ally) }; flash(p0.x, p0.y, t0, 1.2); puff(p0.x, p0.y + down * 4, t0 + 20); if (b.label) tag(p0.x, p0.y + down * 18, b.label, t0, 'plus', 1500); }
    else { p0 = { x: s.cx - (sp * (muzzle.length - 1)) / 2 + sp * mi++, y: sy }; flash(p0.x, p0.y, t0, 1.3); puff(p0.x, p0.y + down * 4, t0 + 20); puff(p0.x + (i % 2 ? 6 : -6), p0.y + down * 10, t0 + 120); burst('spark', p0.x, p0.y, t0, 4, 8, 22, 300, down > 0 ? Math.PI / 2 : -Math.PI / 2, Math.PI * 0.9); }
    const ball = projectile(b.kind, b.big);
    const spin = b.kind === 'chain' ? 720 : 0;
    const tb = bx(tPl);
    if (b.out === 'hit') {
      const tr = b.to === 'hull' ? 'hull' : c.track;
      const k = b.to === 'hull' ? kHull : kTrack;
      const now = b.to === 'hull' ? cur.hull : cur.track;
      const p1 = b.kind === 'mark' && tPl.querySelector('[data-fx-statuses]') ? (() => { const m = bx(tPl.querySelector('[data-fx-statuses]')); return { x: m.cx, y: m.cy }; })() : fxPoint(c.target, tr, now - 1 - k);
      if (b.to === 'hull') kHull += b.units; else kTrack += b.units;
      const pts = curve(p0, p1, (i % 2 ? 0.06 : -0.06) * down);
      fly(ball, pts, FLY, t0, { spin });
      if (RICH && ['core', 'under', 'joint', 'gold', 'ghost'].includes(b.kind)) for (const [q, op] of [[1, 0.35], [2, 0.18]]) { const gh = mk('ball trail', 0, 0); A(gh, pts.map((p, j) => ({ offset: j / (pts.length - 1), opacity: j === pts.length - 1 ? 0 : op, transform: `translate(${p.x}px,${p.y}px) scale(${0.8 - q * 0.15})` })), FLY, t0 + q * 28, 'cubic-bezier(.3,0,.75,1)', 'forwards'); }
      if (b.kind === 'fire' && RICH) for (let q = 0; q < 8; q++) { const em = mk('ember', 0, 0); const j = Math.floor((q / 8) * (pts.length - 2)) + 1; const p = pts[j]; A(em, [{ opacity: 1, transform: `translate(${p.x}px,${p.y}px)` }, { opacity: 0, transform: `translate(${p.x + (Math.random() - 0.5) * 14}px,${p.y - 10 - Math.random() * 10}px)` }], 500, t0 + (FLY * j) / (pts.length - 1)); }
      const th = t0 + FLY;
      lastHit = Math.max(lastHit, th);
      const newV = Math.max(0, now - k - b.units);
      at(th, run, () => setTrack(c.target, tr, newV, '#c0392b'));
      flash(p1.x, p1.y, th, 1.25); ring(p1.x, p1.y, th);
      if (b.kind === 'chain') burst('shred', p1.x, p1.y, th, 8, 14, 32, 650);
      else if (b.kind === 'grape') burst('dust', p1.x, p1.y, th, 5, 6, 20, 700);
      else burst('splinter', p1.x, p1.y, th, 8, 16, 40, 600);
      if (b.label && !labelled.has(b.label) && b.kind !== 'joint') { labelled.add(b.label); tag(p1.x, facingY(c.target) - 14 * down, b.label, th - 120, 'plus', 1500); }
      if (firstHit) { firstHit = false; at(th, run, () => tPl.classList.add('hitframe')); shake(tPl, th, 3); }
    } else if (b.out === 'overkill' || b.out === 'moon') {
      const p1 = b.out === 'moon' ? fxPoint(c.target, 'crew', 0) : { x: tb.x + tb.w * (0.3 + 0.4 * Math.random()), y: tb.cy };
      fly(ball, curve(p0, p1, 0.05 * down), FLY, t0);
      if (b.out === 'moon') { burst('sparkle', p1.x, p1.y, t0 + FLY, 6, 6, 18, 600); tag(p1.x, p1.y - 16 * down, b.label || 'Лунный свет −1', t0 + FLY, '', 1500); }
      else { flash(p1.x, p1.y, t0 + FLY, 1.4); burst('dust', p1.x, p1.y, t0 + FLY, 6, 8, 24, 700); }
      lastHit = Math.max(lastHit, t0 + FLY);
    } else if (b.out === 'water' || b.out === 'wind' || b.out === 'past') {
      const g2 = gapBox();
      const aim = { x: tb.x + tb.w * 0.4, y: facingY(c.target) };
      const mid = { x: p0.x + (aim.x - p0.x) * 0.45, y: p0.y + (aim.y - p0.y) * 0.45 };
      const narrow = board.clientWidth < 701 ? 0.6 : 1;
      let pts, end, d = FLY * 0.85;
      if (b.out === 'water') { end = { x: mid.x + (aim.x > p0.x ? -1 : 1) * 46 * narrow, y: g2.cy + 8 }; pts = curve(p0, end, 0.18 * down); }
      else if (b.out === 'past') { end = { x: tb.x + (i % 2 ? tb.w * 0.95 : tb.w * 0.05), y: facingY(c.target) - down * 18 }; pts = curve(p0, end, (i % 2 ? -0.1 : 0.1) * down); d = FLY; }
      else { end = { x: mid.x + 78 * narrow, y: g2.cy + 14 }; d = FLY * 1.25; pts = [...curve(p0, mid, 0, 8), ...curve(mid, end, -0.35 * down, 10).slice(1)];
        if (RICH) { const gu = mk('gust', 0, 0, '<svg viewBox="0 0 220 40" width="220" height="40"><g fill="none" stroke="#9FB6C6" stroke-width="2" stroke-linecap="round"><path d="M2 14 C60 4 120 26 218 12"/><path d="M20 30 C80 22 140 38 200 26" opacity=".7"/></g></svg>'); A(gu, [{ opacity: 0, transform: `translate(${mid.x - 40}px,${mid.y + 6}px) scaleX(.4)` }, { opacity: 0.9, offset: 0.3 }, { opacity: 0, transform: `translate(${mid.x + 90}px,${mid.y + 10}px) scaleX(1)` }], 650, t0 + FLY * 0.35); } }
      fly(ball, pts, d, t0, { lift: 0.15 });
      if (VS && VS.dust) { burst('dust', end.x, end.y, t0 + d * 0.6, 8, 6, 22, 700); } else splash(end.x, end.y, t0 + d);
      if (b.label) tag(end.x + (end.x > board.clientWidth / 2 ? -10 : 10), end.y - 26 * down, b.label, t0 + d + 40, '', 1700);
    } else if (b.out === 'bounce') {
      const edge = { x: tb.x + tb.w * (0.25 + 0.18 * (i % 3)), y: facingY(c.target) - down * 6 };
      fly(ball, curve(p0, edge, 0.04 * down), FLY * 0.9, t0, { fadeEnd: false });
      const t2 = t0 + FLY * 0.9;
      burst('spark', edge.x, edge.y, t2, 9, 12, 28, 420, down > 0 ? -Math.PI / 2 : Math.PI / 2, Math.PI * 1.3);
      const back = { x: edge.x + (i % 2 ? 34 : -34), y: edge.y - down * 46 };
      A(ball, [{ transform: `translate(${edge.x}px,${edge.y}px)`, opacity: 1 }, { transform: `translate(${back.x}px,${back.y}px) scale(.8)`, opacity: 0 }], 420, t2, 'cubic-bezier(.1,.6,.4,1)', 'forwards');
      if (b.label) tag(edge.x, edge.y - down * 30, b.label, t2, '', 1700);
    } else if (b.out === 'stick') {
      const edge = { x: tb.x + tb.w * 0.82, y: facingY(c.target) + down * 3 };
      fly(ball, curve(p0, edge, 0.05 * down), FLY, t0, { fadeEnd: false });
      burst('splinter', edge.x, edge.y, t0 + FLY, 5, 8, 18, 500); flash(edge.x, edge.y, t0 + FLY, 0.7);
      if (b.label) tag(edge.x, edge.y - down * 26, b.label, t0 + FLY, '', 1900);
    } else if (b.out === 'whirl') {
      const g = gapBox(), cx = board.clientWidth / 2, cy = g.cy, R0 = Math.min(60, board.clientWidth * 0.12);
      const spiral = Array.from({ length: 14 }, (_, j) => { const a = (j / 13) * Math.PI * 3, rr = R0 * (1 - j / 13); return { x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr * 0.55 }; });
      fly(ball, [...curve(p0, { x: cx + R0, y: cy - 6 }, 0.1, 8), ...spiral.slice(1)], FLY * 1.6, t0, { lift: 0.05 });
      if (b.label) tag(cx, cy - 34, b.label, t0 + FLY, '', 1800);
    } else if (b.out === 'block') {
      const tr = bx(trackEl(c.target, 'crew'));
      const end = { x: tr.x + 10 + (i % 3) * 12, y: tr.cy };
      fly(ball, curve(p0, end, 0.05 * down), FLY, t0, { fadeEnd: false });
      burst('dust', end.x, end.y, t0 + FLY, 5, 6, 18, 600);
      if (b.label && !labelled.has(b.label)) { labelled.add(b.label); tag(tr.cx, tr.y - 12, b.label, t0 + FLY, '', 1800); }
    }
  });
  const endShots = 60 + c.shots.length * STEP + FLY * 1.6;
  if (c.damage >= 4) at(lastHit, run, () => shake(board, 0, c.damage >= 6 ? 8 : 4, 320));
  if (c.amount > 0) pillAt(c.target, c.track, c.amount, lastHit + 60);
  if (c.toHull > 0) pillAt(c.target, 'hull', c.toHull, lastHit + 160);
  if (c.fire) {
    const hd = bx(tPl.querySelector('.plank-head'));
    const fl = mk('flame', 0, 0, FLAME_SVG);
    A(fl, [{ opacity: 0, transform: `translate(${hd.cx}px,${bx(tPl).cy}px) scale(.4)` }, { opacity: 1, transform: `translate(${hd.cx}px,${bx(tPl).cy}px) scale(1.5)`, offset: 0.3 }, { opacity: 1, transform: `translate(${hd.r - 24}px,${hd.cy}px) scale(1)` }, { opacity: 0, transform: `translate(${hd.r - 24}px,${hd.cy}px) scale(1)` }], 900, lastHit + 250, 'ease-in-out', 'forwards');
    burst('ember', hd.r - 24, hd.cy, lastHit + 800, 8, 6, 18, 500);
    tag(hd.cx, hd.b + 10, 'Пожар', lastHit + 600, 'plus', 1200);
  }
  if (c.souls) soulsFly(c.target, c.souls, lastHit + 300);
  await wait(Math.max(endShots, lastHit) + (c.fire ? 1100 : 850), run);
  unleanAll();
  VS.done = true;
  clearVS(true);
  await wait(260, run);
};

PLAY.cancel = async (c, run) => {
  if (c.card && !c.shooter) { // отменена карта (не Залп)
    const el = CUR_CARD && CUR_CARD.el;
    const g = gapBox();
    const st = mk('stamp-fx', board.clientWidth / 2, g.cy, c.lost ? 'Карта пропала' : 'Отменено');
    A(st, [{ opacity: 0, scale: '1.8' }, { opacity: 1, scale: '1' }], 260, 0, 'cubic-bezier(.3,1.6,.5,1)', 'forwards');
    if (el) { burst('dust', bx(el).cx, bx(el).cy, 200, 12, 10, 40, 800); A(el, [{ opacity: 1 }, { opacity: 0, filter: 'blur(3px)' }], 600, 250, 'ease-in', 'forwards'); }
    await wait(1100, run);
    A(st, [{ opacity: 1 }, { opacity: 0 }], 200, 0, 'ease-in', 'forwards');
    return;
  }
  if (!VS) VS = { shooter: c.shooter, target: c.target, declared: c.target, cards: [], extras: [], reactions: [], declDamage: 0 };
  hint(`Залп ${G.ships[c.shooter].gen} отменён${c.by ? ` «${cardName(c.by)}»` : ''}`);
  if (VS.plate) { const st = document.createElement('span'); st.className = 'stamp'; st.textContent = 'Залп отменён'; VS.plate.appendChild(st); A(st, [{ opacity: 0, scale: '1.8' }, { opacity: 1, scale: '1' }], 260, 0, 'cubic-bezier(.3,1.6,.5,1)', 'both'); }
  VS.dust = c.by && cardName(c.by) === 'Банка с землёй';
  const n = Math.max(1, VS.declDamage || shownTrack(c.shooter, 'guns'));
  const shots = Array.from({ length: Math.min(8, n) }, () => ({ kind: 'core', out: 'past', units: 1 }));
  await PLAY.shot({ kind: 'shot', shooter: c.shooter, target: VS.target || c.target, declared: VS.declared, track: 'hull', damage: 0, terms: null, reactions: VS.reactions, shots, amount: 0, toHull: 0, fire: 0, souls: 0 }, run);
};

/** Ответ Реакции («Ответный огонь», «Тяжёлый борт», «Огненная стена»…): от защищавшегося к стрелявшему. */
PLAY.counter = async (c, run) => {
  const from = plank(c.from), fb = bx(from), fy = facingY(c.from), down = dirOf(c.from);
  hint(`Ответ «${cardName(c.card)}»: ${nick(c.from)} → ${nick(c.to)}`);
  tag(fb.cx, fy + down * 18, `Ответ: ${cardName(c.card)}`, 0, 'plus', 1600);
  let n = 0, lastHit = 0;
  const fireCard = (G.cards[c.card].fx || {}).fire;
  for (const h of c.hits) {
    for (const [tr, units] of [[h.track, h.amount], ['hull', h.toHull]]) {
      const now = shownTrack(c.to, tr);
      for (let j = 0; j < units; j++, n++) {
        const t0 = 120 + n * 170;
        const p0 = { x: fb.cx + ((n % 3) - 1) * 22, y: fy };
        flash(p0.x, p0.y, t0, 1.2); puff(p0.x, p0.y + down * 4, t0 + 20);
        const p1 = fxPoint(c.to, tr, now - 1 - j);
        const kind = fireCard ? 'fire' : FX.KIND_BY_TRACK[tr];
        fly(projectile(kind), curve(p0, p1, 0.08), 440, t0, { spin: tr === 'sails' ? 720 : 0 });
        const v = Math.max(0, now - 1 - j);
        at(t0 + 440, run, () => setTrack(c.to, tr, v, '#c0392b'));
        flash(p1.x, p1.y, t0 + 440, 1.1); burst(tr === 'sails' ? 'shred' : tr === 'crew' ? 'dust' : 'splinter', p1.x, p1.y, t0 + 440, 7, 14, 32, 600);
        if (n === 0) shake(plank(c.to), t0 + 440, 3);
        lastHit = t0 + 440;
      }
      if (units) pillAt(c.to, tr, units, lastHit + 60);
    }
  }
  if (c.fire) { const hd = bx(plank(c.to).querySelector('.plank-head')); const fl = mk('flame', 0, 0, FLAME_SVG); A(fl, [{ opacity: 0, transform: `translate(${hd.cx}px,${hd.cy + 20}px) scale(.4)` }, { opacity: 1, transform: `translate(${hd.r - 24}px,${hd.cy}px) scale(1.3)` }, { opacity: 0, transform: `translate(${hd.r - 24}px,${hd.cy}px) scale(1)` }], 900, lastHit + 200, 'ease-in-out', 'forwards'); tag(hd.cx, hd.b + 10, 'Пожар', lastHit + 400, 'plus', 1200); }
  if (c.souls) soulsFly(c.to, c.souls, lastHit + 300);
  await wait(lastHit + 1000, run);
};

/** «Сердце Дейви Джонса»: сердце на «Индеворе» бьётся дважды, нить к «Голландцу», у него гаснет Команда. */
PLAY.heart = async (c, run) => {
  const by = Object.keys(G.ships).find((x) => sideOf(x) === sideOf(c.ship) && x !== c.ship);
  const a = bx(plank(by)), b = bx(plank(c.ship));
  hint(`${nick(by)}: Сердце Дейви Джонса — ещё один Залп ${G.ships[c.ship].gen}`);
  const h = { x: a.x + a.w * 0.62, y: a.cy };
  const heart = mk('heart', 0, 0, '<svg viewBox="0 0 30 26" width="30" height="26"><path d="M15 25 C4 17 0 11 2 6 C4 1 11 0 15 6 C19 0 26 1 28 6 C30 11 26 17 15 25Z" fill="#B23A2E" stroke="#6E1A12" stroke-width="1.5"/></svg>');
  A(heart, [{ opacity: 0, transform: `translate(${h.x}px,${h.y}px) scale(.4)` }, { opacity: 1, transform: `translate(${h.x}px,${h.y}px) scale(1)`, offset: 0.15 }, { transform: `translate(${h.x}px,${h.y}px) scale(1.4)`, offset: 0.3 }, { transform: `translate(${h.x}px,${h.y}px) scale(1)`, offset: 0.42 }, { transform: `translate(${h.x}px,${h.y}px) scale(1.4)`, offset: 0.56 }, { opacity: 1, transform: `translate(${h.x}px,${h.y}px) scale(1)`, offset: 0.7 }, { opacity: 0, transform: `translate(${h.x}px,${h.y}px) scale(1)` }], 2000, 0, 'ease-in-out');
  const tgt = { x: b.x + b.w * 0.3, y: b.cy }, W = board.clientWidth, H = board.clientHeight;
  const svg = mk('svgabs', 0, 0, `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><path d="M${h.x} ${h.y} C ${(h.x + tgt.x) / 2} ${h.y - 40}, ${(h.x + tgt.x) / 2} ${tgt.y + 40}, ${tgt.x} ${tgt.y}" fill="none" stroke="#B23A2E" stroke-width="2.5" stroke-dasharray="600" stroke-dashoffset="600" stroke-linecap="round"/></svg>`);
  A(svg, [{ opacity: 1 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], 1900, 600);
  A(svg.querySelector('path'), [{ strokeDashoffset: 600 }, { strokeDashoffset: 0 }], 600, 750, 'ease-in-out', 'forwards');
  if (c.crew) {
    const now = shownTrack(c.ship, 'crew'), p = fxPoint(c.ship, 'crew', now - 1);
    at(1400, run, () => setTrack(c.ship, 'crew', Math.max(1, now - c.crew), '#b23a2e'));
    flash(p.x, p.y, 1400, 0.9); tag(p.x, p.y - 14, `Сердце: −${c.crew} Команда`, 1450, '', 1500);
  }
  await wait(2200, run);
};

/** Души: огоньки от Команды врага в шкалу Душ «Голландца». */
function soulsFly(fromShip, n, delay) {
  const keeper = Object.keys(G.ships).find((x) => G.ships[x].souls != null && !D.ships[x].sunk);
  if (!keeper) return;
  const badge = plank(keeper).querySelector('[data-fx-souls]');
  const to = badge && visible(badge) ? (() => { const b = bx(badge); return { x: b.cx, y: b.cy }; })() : (() => { const b = bx(plank(keeper)); return { x: b.r - 30, y: b.y + 30 }; })();
  const from = fxPoint(fromShip, 'crew', 0);
  for (let k = 0; k < n; k++) wisp(from, to, delay + k * 160);
  setTimeout(() => { if (badge) { A(badge, [{ transform: 'scale(1.3)', boxShadow: '0 0 12px #6fd3b4' }, { transform: 'scale(1)', boxShadow: 'none' }], 500, 0, 'ease-out', 'none'); } }, ms(delay + 800));
  tag(to.x, to.y - 16, `+${n} ${n === 1 ? 'Душа' : 'Души'}`, delay + 700, 'good', 1200);
}
const FLAME_SVG = '<svg width="18" height="22" viewBox="0 0 14 17"><path d="M7 1 C9 5 13 7 12 11 C11.5 14.5 9 16 7 16 C4 16 2 14 2 11 C2 8.5 4 7.5 4.5 5 C5.5 7 6.5 7 7 6 C7.5 4.5 7 3 7 1Z" fill="#F2913D" stroke="#B23A2E" stroke-width="1"/><path d="M7 9 C8 10.5 9.5 11.5 9 13 C8.6 14.4 7.6 15 7 15 C5.8 15 5 14 5 12.8 C5 11.6 6.2 11 7 9Z" fill="#FFE08A"/></svg>';
