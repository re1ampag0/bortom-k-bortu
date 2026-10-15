/* =====================================================================================================
   play-misc.js — остальные клипы: смена мест, погружение/всплытие, гибель, начало и конец хода,
   разыгранная карта и её эффекты, ремонт, Порох, Души, статусы, добор, продажа, кражи, кости, итог,
   способности кораблей; макеты интерфейса P2 (прицеливание) и P3 (Тиа Дальма).
   Переносится в игру как src/ui/game/fx/misc.ts (задачи A2b, A3, A4).
   ===================================================================================================== */
'use strict';
const RULES = { jackHull: G.rules.jackHull, startHull: Object.fromEntries(Object.entries(G.ships).map(([k, s]) => [k, s.max.hull])) };
let CUR_CARD = null; // разыгрываемая карта: лежит у центра стола, пока не разрешится (окно Реакций может быть между)

/** Перерисовать стол так, будто события уже применены (отображаемое состояние не меняется). */
function renderWith(evs, filter = () => true) {
  const saved = D;
  D = structuredClone(D);
  for (const e of evs || []) if (filter(e)) { FX.applyVisible(D, e, RULES); applyExtra(D, e); }
  render();
  D = saved;
}
/** FLIP: запомнить, где стояли планшеты, перерисовать с событиями и плавно перевезти дугой. */
async function flipTo(evs, run, d = 650, filter = () => true) {
  const before = {};
  for (const el of allPlanks()) before[el.dataset.fxShip] = bx(el);
  renderWith(evs, filter);
  for (const el of allPlanks()) {
    const code = el.dataset.fxShip, b0 = before[code]; if (!b0) continue;
    const b1 = bx(el), dx = b0.x - b1.x, dy = b0.y - b1.y;
    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) continue;
    const lift = dx > 0 ? 1 : -1;
    A(el, [{ transform: `translate(${dx}px,${dy}px)` }, { transform: `translate(${dx / 2}px,${dy / 2 + dirOf(code) * -16 * lift}px) rotate(${lift * 1.5}deg)`, offset: 0.5 }, { transform: 'none' }], d, 0, 'cubic-bezier(.45,0,.3,1)', 'none');
    if (RICH) { const m = bx(el); for (let q = 0; q < 3; q++) splash(m.x + m.w * (0.25 + q * 0.25), facingY(code), d * 0.85 + q * 60); }
  }
  await wait(d + 80, run);
}
const SWAP_LABEL = { regroup: 'Перестроение', maelstrom: 'Мальстрём', current: 'Течение', jack: 'Джек ускользает', sword: 'Меч Тритона', card: 'Смена мест', sink: 'Капитан уходит к союзнику' };
function banner(text, cls = 'small', d = 1200, y) {
  const g = gapBox();
  const bn = mk('banner ' + cls, board.clientWidth / 2, y ?? g.cy, text);
  A(bn, [{ opacity: 0, scale: '0.85' }, { opacity: 1, scale: '1', offset: 0.2 }, { opacity: 1, offset: 0.8 }, { opacity: 0, scale: '1.04' }], d, 0);
  return bn;
}

PLAY.swap = async (c, run) => {
  hint(`${SIDE_LABEL[c.side].name}: ${SWAP_LABEL[c.reason] || 'смена мест'}`);
  if (c.cost) payKegs(c.side, c.cost, 0);
  const a = plank(c.ships[0]);
  banner(SWAP_LABEL[c.reason] || 'Смена мест', 'small', 1200, (bx(a).y + bx(a).b) / 2);
  await wait(250, run);
  await flipTo(c.events, run, 650);
  await wait(150, run);
};

PLAY.sink = async (c, run) => {
  const el = plank(c.ship), b = bx(el);
  hint(`${nick(c.ship)} тонет`);
  const fb = el.querySelector('[data-fx-fires]');
  if (fb) { const sb = bx(fb); steam(sb.cx, sb.cy, 300); }
  A(el, [{ transform: 'none', opacity: 1 }, { transform: 'rotate(-2.5deg) translateY(3px)', offset: 0.25 }, { transform: 'rotate(-3.5deg) translateY(30px)', opacity: 0.15 }], 1500, 0, 'ease-in', 'forwards');
  const water = mk('tint', 0, 0); water.style.width = b.w + 'px'; water.style.height = b.h + 'px'; water.style.background = 'linear-gradient(rgba(36,70,92,0), rgba(36,70,92,.55))'; water.style.borderRadius = '12px';
  A(water, [{ opacity: 0, transform: `translate(${b.x}px,${b.y + b.h * 0.6}px) scaleY(.2)` }, { opacity: 1, transform: `translate(${b.x}px,${b.y}px) scaleY(1)` }], 1300, 200, 'ease-in', 'forwards');
  bubbles(b.x + 10, b.b - 6, b.w - 20, 400, RICH ? 22 : 0, 60);
  whirlpool(b.cx, b.cy + 10, 500, run, Math.min(200, b.w * 0.7), 1400);
  const st = mk('stamp-fx', b.cx, b.cy, 'Затонул');
  A(st, [{ opacity: 0, scale: '1.8' }, { opacity: 1, scale: '1', offset: 0.3 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], 1400, 900, 'cubic-bezier(.3,1.6,.5,1)');
  const ally = Object.keys(D.ships).find((x) => sideOf(x) === sideOf(c.ship) && x !== c.ship && !D.ships[x].sunk);
  if (ally) { const ab = bx(plank(ally)); tag(ab.cx, ab.y - 12, `Капитан ${G.ships[c.ship].gen} — на борту ${G.ships[ally].gen}`, 1500, '', 1600); }
  await wait(ally ? 2100 : 1700, run);
};

function diveFx(code, delay, run) {
  const el = plank(code), b = bx(el);
  const w = mk('underwater', 0, 0); w.style.width = b.w + 'px'; w.style.height = b.h + 'px'; w.style.transformOrigin = '50% 100%';
  A(w, [{ opacity: 1, transform: `translate(${b.x}px,${b.y}px) scaleY(0)` }, { opacity: 1, transform: `translate(${b.x}px,${b.y}px) scaleY(1)` }], 700, delay, 'ease-in-out', 'forwards');
  A(el, [{ transform: 'none' }, { transform: 'translateY(6px) scale(.985)' }, { transform: 'none' }], 1300, delay, 'ease-in-out', 'none');
  bubbles(b.x + 8, b.b - 4, b.w - 16, delay + 100, 16, 60);
  const fb = el.querySelector('[data-fx-fires]');
  if (fb) { const sb = bx(fb); steam(sb.cx, sb.cy, delay + 450); A(fb, [{ opacity: 1 }, { opacity: 0 }], 300, delay + 500, 'ease-in', 'forwards'); tag(sb.cx, sb.y - 10, 'Пожары гаснут', delay + 550, 'good', 1200); }
  tag(b.cx, b.y - 12, 'Под водой', delay + 500, '', 1400);
  return delay + 1400;
}
function surfaceFx(code, delay) {
  const el = plank(code), b = bx(el);
  const w = mk('underwater', 0, 0); w.style.width = b.w + 'px'; w.style.height = b.h + 'px'; w.style.transformOrigin = '50% 100%';
  A(w, [{ opacity: 1, transform: `translate(${b.x}px,${b.y}px) scaleY(1)` }, { opacity: 1, transform: `translate(${b.x}px,${b.y}px) scaleY(0)` }], 600, delay, 'ease-in', 'forwards');
  A(el, [{ transform: 'translateY(6px) scale(.985)' }, { transform: 'translateY(-3px)', offset: 0.7 }, { transform: 'none' }], 700, delay, 'ease-out', 'none');
  for (let k = 0; k < 3; k++) splash(b.x + b.w * (0.2 + 0.3 * k), b.y + 2, delay + 380 + k * 90);
  if (RICH) for (let k = 0; k < 10; k++) { const d = mk('bubble', 0, 0); const x0 = b.x + Math.random() * b.w; A(d, [{ opacity: 1, transform: `translate(${x0}px,${b.y}px) scale(.6)` }, { opacity: 0, transform: `translate(${x0 + (Math.random() - 0.5) * 30}px,${b.y - 20 - Math.random() * 25}px) scale(.9)` }], 600, delay + 400 + Math.random() * 200); }
  tag(b.cx, b.y - 14, 'Всплытие: первый Залп +1 и без Реакций', delay + 500, 'plus', 1600);
  return delay + 1400;
}
PLAY.dive = async (c, run) => { hint(`${nick(c.ship)} уходит под воду`); await wait(diveFx(c.ship, 0, run) + 100, run); };
PLAY.surface = async (c, run) => { hint(`${nick(c.ship)} всплывает`); await wait(surfaceFx(c.ship, 0) + 100, run); };

/** Пожар жжёт Корпус: значок Пожара вспыхивает, угольки летят в клетки Корпуса. */
function burnFx(ship, n, delay, run) {
  const el = plank(ship), fb = el.querySelector('[data-fx-fires]') || el.querySelector('.plank-head');
  const sb = bx(fb);
  A(fb, [{ transform: 'scale(1)' }, { transform: 'scale(1.5)' }, { transform: 'scale(1)' }], 400, delay, 'ease-in-out', 'none');
  const cur = shownTrack(ship, 'hull');
  for (let k = 0; k < n; k++) {
    const p = fxPoint(ship, 'hull', cur - 1 - k);
    for (let j = 0; j < (RICH ? 6 : 1); j++) { const em = mk('ember', 0, 0); fly(em, curve({ x: sb.cx, y: sb.cy }, { x: p.x + (Math.random() - 0.5) * 8, y: p.y }, (Math.random() - 0.5) * 0.4, 10), 480, delay + 250 + j * 40 + k * 120, { lift: 0 }); }
    flash(p.x, p.y, delay + 730 + k * 120, 0.8);
  }
  at(delay + 730, run, () => setTrack(ship, 'hull', Math.max(0, cur - n), '#F2913D'));
  pillAt(ship, 'hull', n, delay + 760);
  tag(sb.cx, sb.y - 10, 'Пожар жжёт Корпус', delay + 200, '', 1200);
  return delay + 1250;
}

/** Добор: свои — рубашкой из колоды, в руке переворачиваются лицом (лицо видит только владелец); чужие — к кораблю. */
async function drawFx(e, run) {
  const deck = bx(board.querySelector('[data-fx-deck]'));
  const mine = D.handSeat === e.seat && Array.isArray(D.ships[e.seat].hand);
  if (mine) {
    const before = D.ships[e.seat].hand.length;
    renderWith([e]);
    const slots = [...board.querySelectorAll('[data-fx-hand] .hand-cards > *')].slice(before);
    slots.forEach((s) => (s.style.visibility = 'hidden'));
    slots.forEach((slot, k) => {
      const sb = bx(slot);
      const back = mk('flyc', 0, 0, '<span class="hcard back"></span>');
      A(back, [{ opacity: 1, transform: `translate(${deck.x}px,${deck.y}px) scale(.6)` }, { opacity: 1, transform: `translate(${sb.x}px,${sb.y}px) scale(1)` }], 450, k * 160, 'cubic-bezier(.2,.8,.3,1)', 'forwards');
      A(back, [{ opacity: 1, transform: `translate(${sb.x}px,${sb.y}px) scaleX(1)` }, { opacity: 1, transform: `translate(${sb.x}px,${sb.y}px) scaleX(0)` }], 150, 450 + k * 160, 'ease-in', 'forwards');
      at(600 + k * 160, run, () => { slot.style.visibility = ''; A(slot, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], 150, 0, 'ease-out', 'none'); });
    });
    await wait(800 + e.count * 160, run);
  } else {
    const pb = bx(plank(e.seat));
    for (let k = 0; k < e.count; k++) { const back = mk('flyc', 0, 0, '<span class="hcard back"></span>'); A(back, [{ opacity: 1, transform: `translate(${deck.x}px,${deck.y}px) scale(.6)` }, { opacity: 0, transform: `translate(${pb.r - 70}px,${pb.cy - 50}px) scale(.35)` }], 500, k * 150, 'ease-in-out', 'forwards'); }
    tag(pb.r - 40, pb.y - 10, `+${e.count} ${e.count === 1 ? 'карта' : e.count < 5 ? 'карты' : 'карт'}`, 300, 'plus', 1000);
    await wait(500 + e.count * 150, run);
  }
}

/** Начало хода: баннер → доход бочонками → Пожар → Девятый вал → всплытие → Мальстрём → добор. */
PLAY.turn = async (c, run) => {
  const own = c.mine;
  hint(own ? 'Ваш ход' : `Ход ${SIDE_LABEL[c.side].gen}`);
  const done = (c.events || []).filter((e) => e.type === 'turnStarted');
  renderWith(done);
  banner(own ? 'Ваш ход' : `Ход ${SIDE_LABEL[c.side].gen}`, own ? 'own' : '', 1000);
  await wait(own ? 950 : 800, run);
  const effects = c.effects || [];
  for (let i = 0; i < effects.length; i++) {
    const e = effects[i];
    if (e.type === 'powderGained') {
      const g = gapBox();
      const t = gainKegs(e.side, e.amount, { x: board.clientWidth / 2, y: g.cy }, 0);
      if (e.burned) { const kb = bx(holdEl(e.side)); tag(kb.r + 36, kb.cy + 18, `${e.burned} сгорело: Трюм полон`, 400, '', 1400); }
      await wait(t + 150, run);
    } else if (e.type === 'fireDamage') {
      const next = effects[i + 1];
      const n = next && next.type === 'damage' && next.ship === e.ship ? next.amount + next.toHull : e.fires;
      if (next && next.type === 'damage' && next.ship === e.ship) { i++; done.push(next); }
      await wait(burnFx(e.ship, n, 0, run), run);
    } else if (e.type === 'damage') {
      const last = weatherHit(e, 0, run, '#5E9CC0', D.sea && seaKeyOf(D.sea) === 'wave' ? 'Девятый вал: −1 Паруса' : '');
      if (D.sea && seaKeyOf(D.sea) === 'wave') { const b = bx(plank(e.ship)); const wv = mk('splash', 0, 0, '<svg viewBox="0 0 44 30" width="44" height="30"><g fill="#9CC3DA"><path d="M22 30 C18 18 14 10 10 4 C16 10 19 16 22 22 C25 16 28 10 34 4 C30 10 26 18 22 30Z"/></g></svg>'); A(wv, [{ opacity: 0, transform: `translate(${b.x}px,${facingY(e.ship)}px) scale(.5)` }, { opacity: 1, transform: `translate(${b.cx}px,${facingY(e.ship)}px) scale(1.4)`, offset: 0.5 }, { opacity: 0, transform: `translate(${b.r}px,${facingY(e.ship)}px) scale(.8)` }], 900, 0); }
      await wait(last + 900, run);
    } else if (e.type === 'surfaced') {
      await wait(surfaceFx(e.ship, 0), run);
    } else if (e.type === 'swapped') {
      tag(board.clientWidth / 2, gapBox().cy, SWAP_LABEL[e.reason] || 'Смена мест', 0, '', 1200);
      await flipTo(done.concat(e), run, 650);
    } else if (e.type === 'drew') {
      renderWith(done);
      await drawFx(e, run);
    } else if (e.type === 'soulsGained') {
      const b = bx(plank(e.ship)); tag(b.cx, b.y - 12, `+${e.amount} Души`, 0, 'good', 1000); await wait(500, run);
    } else if (e.type === 'seaEffect') {
      if (e.key === 'wave') tag(board.clientWidth / 2, gapBox().cy, 'Девятый вал', 0, '', 1000);
    }
    done.push(e);
  }
  await wait(200, run);
};

PLAY.turnEnd = async (c, run) => {
  if (c.plans) {
    const pb = bx(plank(c.plans.seat));
    hint(`${nick(c.plans.seat)}: План — ${c.plans.count} рубашкой вниз`);
    for (let k = 0; k < c.plans.count; k++) {
      const from = sideOf(c.plans.seat) === bottomSide() ? (() => { const h = board.querySelector('[data-fx-hand] .hand-cards'); const hb = bx(h); return { x: hb.x + 20 + k * 30, y: hb.y }; })() : { x: pb.cx - 40, y: isTop(c.plans.seat) ? -140 : board.clientHeight };
      const back = mk('flyc', 0, 0, '<span class="hcard back"></span><span class="rib plan">ПЛАН</span>');
      A(back, [{ opacity: 1, transform: `translate(${from.x}px,${from.y}px) scale(1)` }, { opacity: 1, transform: `translate(${pb.r - 64 - k * 8}px,${pb.cy - 40}px) rotate(${-6 + k * 5}deg) scale(.45)`, offset: 0.7 }, { opacity: 0, transform: `translate(${pb.r - 64 - k * 8}px,${pb.cy - 40}px) rotate(${-6 + k * 5}deg) scale(.4)` }], 1100, k * 160, 'cubic-bezier(.2,.8,.3,1)');
    }
    tag(pb.r - 50, pb.y - 10, `План: ${c.plans.count}`, 500, 'plus', 1200);
    await wait(1200 + c.plans.count * 160, run);
    return;
  }
  hint(`${SIDE_LABEL[c.side].name}: ход окончен`);
  await wait(350, run);
};

/** Где лежит разыгранная карта: у края зазора со стороны игрока, чтобы не закрывать планшеты. */
function cardSpot() {
  const g = gapBox(), W = board.clientWidth, sc = W < 701 ? 0.7 : 0.9;
  return { x: W / 2 - 55 * sc, y: g.cy - 64 * sc, s: sc, r: 0 };
}
/** Эффект от карты: снаряд из карты в клетки (урон), зелёные клетки (ремонт) и т. д. */
function cardDamage(e, from, t0, run) {
  let n = 0, last = t0;
  for (const [tr, units] of [[e.track, e.amount], ['hull', e.toHull]]) {
    const now = shownTrack(e.ship, tr);
    for (let j = 0; j < units; j++, n++) {
      const t = t0 + n * 130, p = fxPoint(e.ship, tr, now - 1 - j);
      fly(projectile(FX.KIND_BY_TRACK[tr]), curve(from, p, 0.08), 420, t, { spin: tr === 'sails' ? 720 : 0 });
      flash(p.x, p.y, t + 420, 1.1); burst(tr === 'sails' ? 'shred' : tr === 'crew' ? 'dust' : 'splinter', p.x, p.y, t + 420, 7, 12, 32, 600);
      if (n === 0) shake(plank(e.ship), t + 420, 3);
      last = t + 420;
    }
    if (units) { at(t0 + 420, run, () => setTrack(e.ship, tr, Math.max(0, now - units), '#c0392b')); pillAt(e.ship, tr, units, last + 60); }
  }
  return last;
}
function repairFx(e, t0, run, from) {
  const now = shownTrack(e.ship, e.track);
  const b = bx(plank(e.ship));
  if (from) { const ar = mk('svgabs', 0, 0, `<svg width="${board.clientWidth}" height="${board.clientHeight}"><path d="M${from.x} ${from.y} Q ${(from.x + b.cx) / 2} ${Math.min(from.y, b.cy) - 40} ${b.cx} ${b.cy}" fill="none" stroke="#2F7A4F" stroke-width="3" stroke-dasharray="7 7" stroke-linecap="round"/></svg>`); A(ar, [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], 1400, t0); }
  const fr = overlayAt('lg-aura', b, 4); fr.style.boxShadow = '0 0 0 3px #2F7A4F, 0 0 22px 6px rgba(47,125,74,.45)';
  A(fr, [{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }], 1500, t0 + 100);
  for (let j = 0; j < e.amount; j++) {
    const t = t0 + 300 + j * 180, p = fxPoint(e.ship, e.track, now + j);
    at(t, run, () => setTrack(e.ship, e.track, now + j + 1, '#2F7A4F'));
    ring(p.x, p.y, t, 0.8, '#2F7A4F'); burst('sparkle', p.x, p.y, t, 5, 6, 18, 500);
  }
  pillAt(e.ship, e.track, e.amount, t0 + 360 + e.amount * 180, true);
  tag(b.cx, b.y - 12, `${G.ships[e.ship].nick}: +${e.amount} ${TR[e.track]}`, t0 + 200, 'good', 1500);
  return t0 + 600 + e.amount * 180;
}
const MARK_N = (Object.values(G.cards).map((c) => ((c.fx && c.fx.ops) || []).find((o) => o[0] === 'mark')).find(Boolean) || [0, 0, 2])[2];
const FLAG_LABEL = { parley: 'Право на переговоры', voodoo: 'Кукла вуду', blockade: 'Блокада', mark: `Чёрная метка +${MARK_N}`, noReact: 'Без Реакций', limit: 'Карт сверх Команды', volleyBonus: 'Залпы +', noDiag: 'Диагональ без штрафа', noReactTeam: 'Противник без Реакций' };
const BLOT = '<svg viewBox="0 0 30 26" width="30" height="26"><path d="M15 2 C21 1 27 5 28 11 C29 17 25 23 18 24 C12 25 5 23 3 17 C1 11 4 5 9 3 C11 2 13 2 15 2Z" fill="#1a1612"/><circle cx="27" cy="22" r="2" fill="#1a1612"/><circle cx="4" cy="5" r="1.4" fill="#1a1612"/></svg>';
/**
 * Статус корабля: чип появляется в строке статусов под шапкой (ничего не закрывает) и остаётся, пока статус есть
 * в состоянии. «Чёрная метка»: клякса слетает с карты и садится в свой чип; держится до конца хода.
 * Подпись — в зазоре между рядами, а не поверх шкал.
 */
function statusFx(e, t0, run, from) {
  const label = e.flag === 'limitRaised' || e.flag === 'limit' ? `+${e.n} карт сверх Команды` : e.flag === 'volleyBonus' ? `Залпы +${e.n} в этот ход` : FLAG_LABEL[e.flag] || e.flag;
  if (!e.ship) { const g = gapBox(); tag(board.clientWidth / 2, g.cy, `${SIDE_LABEL[e.side].name}: ${label}`, t0, 'plus', 1500); return t0 + 1300; }
  const el = plank(e.ship), out = facingY(e.ship) + dirOf(e.ship) * 18;
  // чип-заготовка: такой же, какой нарисует перерисовка после клипа (невидимый до приземления)
  let row = el.querySelector('[data-fx-statuses]');
  if (!row) { el.querySelector('.plank-head').insertAdjacentHTML('afterend', '<div class="plank-statuses" data-fx-statuses></div>'); row = el.querySelector('[data-fx-statuses]'); }
  let chip = row.querySelector(`[data-fx-status="${label}"]`);
  if (!chip) { row.insertAdjacentHTML('beforeend', statusChipHTML(label)); chip = row.lastElementChild; chip.style.visibility = 'hidden'; }
  const cb = bx(chip);
  let land = t0 + 150;
  if (e.flag === 'mark') {
    const ic = bx(chip.querySelector('svg') || chip), spot = { x: ic.cx, y: ic.cy };
    const start = from || { x: spot.x + 40, y: spot.y - 90 * dirOf(e.ship) };
    const mid = { x: (start.x + spot.x) / 2, y: Math.min(start.y, spot.y) - 40 };
    const blot = mk('blot', 0, 0, BLOT);
    A(blot, [{ opacity: 0, transform: `translate(${start.x}px,${start.y}px) scale(.6) rotate(30deg)` }, { opacity: 1, transform: `translate(${mid.x}px,${mid.y}px) scale(2.2) rotate(-15deg)`, offset: 0.55 }, { opacity: 1, transform: `translate(${spot.x}px,${spot.y}px) scale(.55) rotate(0)` }], 560, t0, 'cubic-bezier(.5,0,.8,1)', 'forwards');
    land = t0 + 560;
    at(land, run, () => { blot.remove(); shake(el, 0, 2); });
    burst('dust', spot.x, spot.y, land, 6, 6, 18, 450);
    ring(spot.x, spot.y, land, 0.6, '#1a1612');
  }
  at(land, run, () => { chip.style.visibility = ''; A(chip, [{ transform: 'scale(1.6)', boxShadow: '0 0 0 3px rgba(139,107,181,.5)' }, { transform: 'scale(1)', boxShadow: 'none' }], 380, 0, 'cubic-bezier(.3,1.6,.5,1)', 'none'); });
  tag(cb.cx, out, e.flag === 'mark' ? `${label} до конца хода` : label, land, 'plus', 1700);
  return land + 1100;
}

/** Разыгранная карта: вылетает (своя — из руки, чужая — из-за края), ложится у центра, затем её эффекты. */
PLAY.card = async (c, run) => {
  if (CUR_CARD && CUR_CARD.el.isConnected) A(CUR_CARD.el, [{ opacity: 1 }, { opacity: 0 }], 200, 0, 'ease-in', 'forwards');
  const cd = G.cards[c.card];
  hint(`${nick(c.ship)}: «${cd.name}»${c.target ? ` → ${nick(c.target)}` : ''}`);
  if (c.cost) payKegs(sideOf(c.ship), c.cost, 0);
  const spot = cardSpot();
  const el = flyCard(c.card, cardOrigin(c.card, c.seat), spot, 0, 500, cd.type === 'РЕМОНТ' ? 'РЕМОНТ' : cd.type === 'ПРИКАЗ' ? 'ПРИКАЗ' : cd.type, '');
  CUR_CARD = { el, code: c.card };
  A(el.firstElementChild, [{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], 260, 500, 'ease-out', 'none');
  if (c.target) { const tb = bx(plank(c.target)); const ar = mk('svgabs', 0, 0, `<svg width="${board.clientWidth}" height="${board.clientHeight}"><path d="M${spot.x + 55 * spot.s} ${spot.y + 64 * spot.s} L${tb.cx} ${tb.cy}" fill="none" stroke="#6b4f8a" stroke-width="2.5" stroke-dasharray="6 6" stroke-linecap="round"/></svg>`); A(ar, [{ opacity: 0 }, { opacity: 0.9, offset: 0.3 }, { opacity: 0.9, offset: 0.8 }, { opacity: 0 }], 1300, 450); }
  await wait(900, run); // карту успевают прочитать
  const from = { x: spot.x + 55 * spot.s, y: spot.y + 64 * spot.s };
  const done = [];
  let t = 0;
  for (const e of c.effects || []) {
    if (e.type === 'damage') { t = Math.max(t, cardDamage(e, from, done.filter((x) => x.type === 'damage').length * 260, run)); }
    else if (e.type === 'restored') { t = Math.max(t, repairFx(e, 0, run, from)); }
    else if (e.type === 'powderGained') { t = Math.max(t, gainKegs(e.side, e.amount, from, 0)); }
    else if (e.type === 'powderLost') { payKegs(e.side, e.amount, 0); t = Math.max(t, 900); }
    else if (e.type === 'flagSet' || e.type === 'turnFlag' || e.type === 'limitRaised') { t = Math.max(t, statusFx(e.type === 'limitRaised' ? { ...e, flag: 'limitRaised' } : e, 0, run, from)); }
    else if (e.type === 'fireAdded') { const hd = bx(plank(e.ship).querySelector('.plank-head')); fly(projectile('fire'), curve(from, { x: hd.r - 24, y: hd.cy }, 0.1), 500, 0); tag(hd.cx, hd.b + 10, 'Пожар', 500, 'plus', 1200); t = Math.max(t, 1100); }
    else if (e.type === 'soulsGained') { soulsFly(e.ship, e.amount, t * 0.5); t = Math.max(t, 1200); }
    else if (e.type === 'soulsSpent') { const sb = plank(e.ship).querySelector('[data-fx-souls]'); if (sb && visible(sb)) { const b = bx(sb); wisp({ x: b.cx, y: b.cy }, from, 0); } t = Math.max(t, 900); }
    else if (e.type === 'drew') { await wait(t, run); t = 0; renderWith(done); await drawFx(e, run); }
    else if (e.type === 'swapped') { await wait(t, run); t = 0; await flipTo(done.concat(e), run, 650); }
    else if (e.type === 'stolen' || e.type === 'passed' || e.type === 'discarded' || e.type === 'shown' || e.type === 'seaLooked' || e.type === 'dice') { const g = gapBox(); tag(board.clientWidth / 2, g.cy + 50, smallLabel(e), t, '', 1300); t = Math.max(t, 1000); }
    done.push(e);
  }
  await wait(t + 700, run);
  if (c.resolvedTo) { // разрешилась сразу — карта уходит в сброс (или исчезает навсегда)
    const db = bx(board.querySelector('[data-fx-deck]'));
    A(el, [{ opacity: 1, transform: `translate(${spot.x}px,${spot.y}px) scale(${spot.s})` }, { opacity: 0, transform: `translate(${db.x}px,${db.y - 20}px) scale(.3)` }], 450, 0, 'ease-in', 'forwards');
    CUR_CARD = null;
    await wait(350, run);
  }
};
function smallLabel(e) {
  switch (e.type) {
    case 'stolen': return `${nick(e.seat)} крадёт карту у ${G.ships[e.from].gen}`;
    case 'passed': return `${nick(e.seat)} передаёт карту ${G.ships[e.to].dat}`;
    case 'discarded': return `${nick(e.seat)} сбрасывает карту`;
    case 'shown': return `${nick(e.seat)} показывает руку`;
    case 'seaLooked': return `${nick(e.seat)} смотрит карты моря`;
    case 'dice': return 'Кости лжеца';
    default: return e.type;
  }
}

/** Урон без Залпа (вне карты): из карты, если она ещё лежит; от Пожара; от Рифов. */
PLAY.impact = async (c, run) => {
  if (c.cause === 'fire') { await wait(burnFx(c.ship, c.amount + c.toHull || 1, 0, run), run); return; }
  let last;
  if (CUR_CARD && CUR_CARD.el.isConnected && c.cause === CUR_CARD.code) { const s = cardSpot(); last = cardDamage(c, { x: s.x + 55 * s.s, y: s.y + 64 * s.s }, 0, run); }
  else last = weatherHit(c, 0, run, '#c0392b', D.sea && seaKeyOf(D.sea) === 'reefs' ? 'Рифы: −1 Корпус' : '');
  await wait(last + 900, run);
};
PLAY.fire = async (c, run) => {
  const hd = bx(plank(c.ship).querySelector('.plank-head'));
  const fl = mk('flame', 0, 0, FLAME_SVG);
  A(fl, [{ opacity: 0, transform: `translate(${hd.cx}px,${hd.cy + 20}px) scale(.4)` }, { opacity: 1, transform: `translate(${hd.r - 24}px,${hd.cy}px) scale(1.3)` }, { opacity: 0, transform: `translate(${hd.r - 24}px,${hd.cy}px) scale(1)` }], 900, 0, 'ease-in-out', 'forwards');
  tag(hd.cx, hd.b + 10, `Пожар ${c.fires}`, 300, 'plus', 1200);
  await wait(1000, run);
};
PLAY.repair = async (c, run) => {
  hint(`${nick(c.ship)}: ремонт +${c.amount} ${TR[c.track]}`);
  let from = null;
  if (c.cause === 'souls') { const sb = plank(c.ship).querySelector('[data-fx-souls]'); if (sb && visible(sb)) { const b = bx(sb); from = { x: b.cx, y: b.cy }; wisp(from, fxPoint(c.ship, c.track, shownTrack(c.ship, c.track)), 0); } }
  else if (CUR_CARD && CUR_CARD.el.isConnected) { const s = cardSpot(); from = { x: s.x + 55 * s.s, y: s.y + 64 * s.s }; }
  await wait(repairFx(c, 0, run, from) + 300, run);
};
PLAY.powder = async (c, run) => {
  if (c.n > 0) { const g = gapBox(); await wait(gainKegs(c.side, c.n, { x: board.clientWidth / 2, y: g.cy }, 0) + 200, run); }
  else { payKegs(c.side || sideOf(c.ship), -c.n, 0); await wait(700, run); }
};
PLAY.souls = async (c, run) => {
  const b = bx(plank(c.ship));
  if (c.n > 0) soulsFly(Object.keys(D.ships).find((x) => sideOf(x) !== sideOf(c.ship)) || c.ship, c.n, 0);
  else tag(b.cx, b.y - 12, `${c.n} Души`, 0, '', 1100);
  await wait(1100, run);
};
PLAY.status = async (c, run) => { await wait(statusFx(c, 0, run), run); };
PLAY.draw = async (c, run) => { await drawFx({ type: 'drew', seat: c.seat, count: c.count, cards: c.cards }, run); };
PLAY.sell = async (c, run) => {
  const from = cardOrigin(c.card, c.seat), kb = bx(holdEl(sideOf(c.seat)));
  const el = flyCard(c.card, from, { x: kb.x, y: kb.y - 60, s: 0.4 }, 0, 500, 'ПРОДАНО');
  A(el, [{ opacity: 1 }, { opacity: 0 }], 250, 550, 'ease-in', 'forwards');
  const pg = (c.effects || []).find((e) => e.type === 'powderGained');
  if (pg) gainKegs(pg.side, pg.amount, { x: kb.x + 20, y: kb.y - 20 }, 600);
  await wait(1400, run);
};
PLAY.pass = async (c, run) => { const a = bx(plank(c.seat)), b = bx(plank(c.to)); const back = mk('flyc', 0, 0, '<span class="hcard back"></span>'); A(back, [{ opacity: 1, transform: `translate(${a.cx - 30}px,${a.cy - 40}px) scale(.5)` }, { opacity: 0, transform: `translate(${b.cx - 30}px,${b.cy - 40}px) scale(.5)` }], 700, 0, 'ease-in-out', 'forwards'); tag(b.cx, b.y - 10, smallLabel({ type: 'passed', seat: c.seat, to: c.to }), 300, '', 1200); await wait(1100, run); };
PLAY.steal = async (c, run) => { if (c.from) { const a = bx(plank(c.from)), b = bx(plank(c.seat)); const back = mk('flyc', 0, 0, '<span class="hcard back"></span>'); A(back, [{ opacity: 1, transform: `translate(${a.cx - 30}px,${a.cy - 40}px) scale(.5)` }, { opacity: 0, transform: `translate(${b.cx - 30}px,${b.cy - 40}px) scale(.5) rotate(20deg)` }], 700, 0, 'ease-in-out', 'forwards'); burst('gold-dust', a.cx, a.cy, 0, 10, 10, 30, 500); } tag(bx(plank(c.seat)).cx, bx(plank(c.seat)).y - 10, c.from ? smallLabel({ type: 'stolen', seat: c.seat, from: c.from }) : `${nick(c.seat)} забирает карту`, 300, '', 1200); await wait(1100, run); };
PLAY.discard = async (c, run) => { const db = bx(board.querySelector('[data-fx-deck]')); const el = flyCard(c.card || '?', cardOrigin(c.card, c.seat), { x: db.x, y: db.y - 30, s: 0.4 }, 0, 500); A(el, [{ opacity: 1 }, { opacity: 0 }], 250, 550, 'ease-in', 'forwards'); await wait(900, run); };
PLAY.peek = async (c, run) => { const b = bx(plank(c.seat)); tag(b.cx, b.y - 10, c.sea ? 'Смотрит карты моря' : 'Подсмотрел руку', 0, '', 1300); await wait(900, run); };
PLAY.dice = async (c, run) => {
  const g = gapBox(), W = board.clientWidth, seats = Object.keys(c.cards || {});
  seats.forEach((s, k) => { const el = flyCard(c.cards[s], cardOrigin(c.cards[s], s), { x: W / 2 - 120 + k * 130, y: g.cy - 60, s: 0.8 }, k * 150, 450); if (c.winner === s) { A(el, [{ scale: '1' }, { scale: '1.08' }, { scale: '1' }], 400, 900, 'ease-out', 'none'); burst('gold-dust', W / 2 - 75 + k * 130, g.cy, 900, 14, 20, 60, 700); } A(el, [{ opacity: 1 }, { opacity: 0 }], 300, 1900, 'ease-in', 'forwards'); });
  tag(W / 2, g.cy + 60, c.winner ? `Обе карты забирает ${nick(c.winner)}` : 'Ничья — обе в сброс', 800, 'plus', 1300);
  await wait(2300, run);
};
PLAY.fireOut = async (c, run) => { const fb = plank(c.seat).querySelector('[data-fx-fires]') || plank(c.seat).querySelector('.plank-head'); const b = bx(fb); splash(b.cx, b.cy, 0); steam(b.cx, b.cy - 6, 200); tag(b.cx, b.y - 10, c.fires ? `Пожар −1 (осталось ${c.fires})` : 'Пожар потушен', 250, 'good', 1200); await wait(1100, run); };
PLAY.ability = async (c, run) => {
  const b = bx(plank(c.ship));
  if (c.cost) payKegs(sideOf(c.ship), c.cost, 0);
  const label = { sword: 'Меч Тритона', treasury: 'Казна', jonesFree: 'Джонс свободен' }[c.what] || c.what;
  const st = mk('stamp-fx', b.cx, b.cy, label);
  A(st, [{ opacity: 0, scale: '1.8' }, { opacity: 1, scale: '1', offset: 0.2 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], 1200, 0, 'cubic-bezier(.3,1.6,.5,1)');
  burst('gold-dust', b.cx, b.cy, 150, 16, 20, 70, 700);
  await wait(900, run);
  const done = [];
  for (const e of c.effects || []) {
    if (e.type === 'swapped') await flipTo(done.concat(e), run, 650);
    else if (e.type === 'restored') await wait(repairFx(e, 0, run), run);
    else if (e.type === 'limitRaised') await wait(statusFx({ ...e, flag: 'limitRaised' }, 0, run), run);
    done.push(e);
  }
};
PLAY.end = async (c, run) => {
  const mine = c.winner && c.winner === bottomSide();
  const text = c.reason === 'concede' ? `${SIDE_LABEL[c.side].name} сдаются` : mine ? 'Победа!' : c.winner ? `Победа ${SIDE_LABEL[c.winner].gen}` : 'Конец игры';
  const g = gapBox();
  const bn = mk('banner' + (mine ? ' own' : ''), board.clientWidth / 2, g.cy, text);
  A(bn, [{ opacity: 0, scale: '0.6' }, { opacity: 1, scale: '1.08', offset: 0.5 }, { opacity: 1, scale: '1' }], 600, 0, 'cubic-bezier(.3,1.6,.5,1)', 'forwards');
  if (mine && RICH) for (let k = 0; k < 3; k++) burst('gold-dust', board.clientWidth * (0.25 + k * 0.25), g.cy, 300 + k * 200, 24, 30, 120, 1100);
  await wait(1800, run);
};
PLAY.fallback = async (c, run) => { const g = gapBox(); tag(board.clientWidth / 2, g.cy, c.type || c.kind, 0, '', 800); await wait(600, run); };

/* ——— макеты интерфейса: P2 прицеливание (вся карточка — кнопка) и P3 Тиа Дальма ——— */
const RETICLE = '<svg class="reticle" viewBox="0 0 26 26"><circle cx="13" cy="13" r="9" fill="none" stroke="#B23A2E" stroke-width="2"/><circle cx="13" cy="13" r="2.2" fill="#B23A2E"/><path d="M13 1v6M13 19v6M1 13h6M19 13h6" stroke="#B23A2E" stroke-width="2"/></svg>';
function renderMode() {
  board.querySelectorAll('.choice').forEach((x) => x.remove());
  const m = D.mode;
  if (!m) return;
  if (m.k === 'aim') {
    plank(m.shooter).classList.add('selected');
    for (const code of Object.keys(m.targets)) {
      const el = plank(code);
      el.classList.add(m.chosen === code ? 'chosen' : 'aimable');
      el.setAttribute('role', 'button'); el.tabIndex = 0;
      el.setAttribute('aria-label', `Цель: ${G.ships[code].name}, ${m.targets[code]}`);
      el.insertAdjacentHTML('beforeend', `<span class="aimtip">${esc(m.targets[code])}</span>`);
      if (m.chosen === code) el.insertAdjacentHTML('beforeend', RETICLE);
    }
    const ins = document.querySelector('[data-fx-instruction]');
    if (ins) ins.textContent = m.chosen ? `Залп по ${nick(m.chosen)}: ${m.targets[m.chosen]} — «Огонь · 1 Порох»` : `Залп ${G.ships[m.shooter].gen}: нажмите на корабль-цель`;
  }
  if (m.k === 'tia') {
    const div = document.createElement('div');
    div.className = 'choice';
    div.innerHTML = `<h4>${esc(G.ships[m.seat].nick)}: Тиа Дальма</h4><p>Разложите карты моря: первая выбранная откроется первой. «i» — карта целиком.</p><div class="opts">${m.cards.map((c) => { const o = m.order.indexOf(c), s = G.sea[c], key = s.key; return `<div class="sopt ${o >= 0 ? 'on' : ''}" data-opt="${c}" role="button" tabindex="0"><div class="a" style="background:${SEA_BG[key]}">${seaSvg(key, 70, 42)}</div><div class="n">${esc(s.name)}</div><div class="e">${esc(s.big)}</div>${o >= 0 ? `<span class="ord">${o + 1}</span>` : ''}<button class="info" data-sea="${c}" aria-label="Карта «${esc(s.name)}» целиком">i</button></div>`; }).join('')}</div><div class="acts"><button class="pbtn" data-act="reset">Сбросить выбор</button><button class="pbtn primary">Готово (${m.order.length} из 3)</button></div>`;
    board.appendChild(div);
  }
}
const CURSOR = '<svg viewBox="0 0 22 26" width="22" height="26"><path d="M2 2 L2 20 L7 15.5 L10.5 23 L13.5 21.6 L10.2 14.4 L17 14.2 Z" fill="#fff" stroke="#2A2521" stroke-width="1.6" stroke-linejoin="round"/></svg>';
PLAY.ui_aim = async (c, run) => {
  D.mode = { k: 'aim', shooter: c.shooter, targets: c.targets, chosen: null }; render();
  await wait(1100, run);
  const cur = mk('cursor', 0, 0, CURSOR);
  const tb = bx(plank(c.choose)), start = { x: board.clientWidth * 0.5, y: board.clientHeight - 40 };
  const end = { x: tb.x + tb.w * 0.62, y: tb.cy + 4 };
  A(cur, [{ opacity: 0, transform: `translate(${start.x}px,${start.y}px)` }, { opacity: 1, transform: `translate(${start.x}px,${start.y}px)`, offset: 0.1 }, { opacity: 1, transform: `translate(${end.x}px,${end.y}px)` }], 1000, 0, 'cubic-bezier(.4,0,.2,1)', 'forwards');
  await wait(1000, run);
  plank(c.choose).classList.add('hover');
  await wait(450, run);
  A(cur, [{ scale: '1' }, { scale: '0.85' }, { scale: '1' }], 200, 0, 'ease-in-out', 'none');
  D.mode.chosen = c.choose; render();
  A(plank(c.choose), [{ scale: '1' }, { scale: '1.015' }, { scale: '1' }], 260, 0);
  await wait(1200, run);
  A(cur, [{ opacity: 1 }, { opacity: 0 }], 300, 0, 'ease-in', 'forwards');
  await wait(300, run);
};
PLAY.ui_tia = async (c, run) => {
  D.mode = { k: 'tia', seat: c.seat, cards: c.cards, order: [] }; render();
  await wait(900, run);
  const cur = mk('cursor', 0, 0, CURSOR);
  const go = async (el, dx = 0.5, dy = 0.5, d = 700) => { const b = bx(el); const to = { x: b.x + b.w * dx, y: b.y + b.h * dy }; const from = cur._p || { x: board.clientWidth / 2, y: board.clientHeight - 10 }; A(cur, [{ opacity: 1, transform: `translate(${from.x}px,${from.y}px)` }, { opacity: 1, transform: `translate(${to.x}px,${to.y}px)` }], d, 0, 'cubic-bezier(.4,0,.2,1)', 'forwards'); cur._p = to; await wait(d + 150, run); A(cur, [{ scale: '1' }, { scale: '.85' }, { scale: '1' }], 180, 0, 'ease-in-out', 'none'); };
  await go(board.querySelector(`.choice [data-sea="${c.peek}"]`));
  openSea(c.peek);
  await wait(1900, run);
  closePop();
  await wait(300, run);
  for (const code of c.order) {
    await go(board.querySelector(`[data-opt="${code}"]`), 0.45, 0.7, 550);
    D.mode.order.push(code); render();
    await wait(250, run);
  }
  A(cur, [{ opacity: 1 }, { opacity: 0 }], 300, 600, 'ease-in', 'forwards');
  await wait(1000, run);
};

/* Эталон: что ещё меняет отображаемое состояние, кроме applyVisible (в игре это берётся из настоящего состояния). */
function applyExtra(d, e) {
  const sh = d.ships[e.ship || e.seat];
  switch (e.type) {
    case 'flagSet': if (sh) { sh.flags = [...(sh.flags || []).filter((f) => f !== FLAG_LABEL[e.flag]), FLAG_LABEL[e.flag]]; } break;
    case 'turnStarted': for (const s of Object.values(d.ships)) s.flags = (s.flags || []).filter((f) => !f.startsWith('Чёрная метка') && f !== 'Без Реакций'); break; // «до конца хода»
    case 'drew': if (sh) { if (Array.isArray(sh.hand)) sh.hand = [...sh.hand, ...(e.cards || Array(e.count).fill('?'))]; else sh.hand += e.count; } break;
    case 'cardPlayed': case 'sold': case 'discarded': if (sh) { if (Array.isArray(sh.hand)) { const i = sh.hand.indexOf(e.card); if (i >= 0) sh.hand.splice(i, 1); else { const q = sh.hand.indexOf('?'); if (q >= 0) sh.hand.splice(q, 1); } } else sh.hand = Math.max(0, sh.hand - 1); } break;
    case 'reaction': { const s2 = d.ships[e.seat]; if (s2 && !e.fromPlan) { if (Array.isArray(s2.hand)) { const i = s2.hand.indexOf(e.card); if (i >= 0) s2.hand.splice(i, 1); } else s2.hand = Math.max(0, s2.hand - 1); } break; }
    case 'planned': { const s2 = d.ships[e.seat]; if (s2) { if (Array.isArray(s2.hand)) s2.hand = s2.hand.slice(0, Math.max(0, s2.hand.length - e.count)); else s2.hand = Math.max(0, s2.hand - e.count); } break; }
    default: break;
  }
}
