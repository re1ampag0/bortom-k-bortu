/* =====================================================================================================
   page.js — страница эталона: список сцен, очередь показа, журнал, панель сценария, настройки.
   В игру переносится только ОЧЕРЕДЬ (FxLayer.tsx / useFxQueue): отображаемое состояние отстаёт от
   настоящего, клипы играются по одному, после клипа применяются его события; «Сразу итог» и
   «мгновенно» — сразу настоящее состояние. Остальное (кнопки сцен, панель) — только для эталона.
   ===================================================================================================== */
'use strict';
const SCENES = window.SCENES;
let scene = null, START = null, FINAL = null, PLAYING = false;

/* ——— состояние сцены ——— */
function defaultStart(sc) {
  const same = SCENES.find((s) => s.start && sideOf(s.viewer[0]) === sideOf(sc.viewer[0]));
  return same.start;
}
function makeD(sc) {
  const st = structuredClone(sc.start || defaultStart(sc));
  return { ...st, viewer: sc.viewer, handSeat: st.handSeat || sc.viewer[0], log: [], logFresh: 0, instruction: '', hint: '', mode: null };
}
function finalState(sc) {
  const d = makeD(sc);
  for (const a of sc.actions) for (const e of a.ev) { FX.applyVisible(d, e, RULES); applyExtra(d, e); }
  return d;
}
/** Сухой прогон планировщика по всем действиям — для панели сценария и проверок. */
function planAll(sc) {
  const st = sc.start || defaultStart(sc);
  const pl = FX.createPlanner({ cards: G.cards, ships: G.ships, viewer: sc.viewer, sea: st.sea, seaKey: seaKeyOf });
  const out = [];
  sc.actions.forEach((a, ai) => { const clips = pl.feed(a.ev, a.a); clips.forEach((c) => { c.events = c.ev.map((i) => a.ev[i]); c.action = ai; out.push(c); }); });
  if (sc.ui) out.push({ kind: 'ui_' + sc.ui.what, ...sc.ui, seat: sc.viewer[0], events: [], ev: [] });
  return out;
}

/* ——— журнал ——— */
function logLine(c) {
  const n = (x) => G.ships[x].nick;
  switch (c.kind) {
    case 'announce': return `${n(c.shooter)} → ${n(c.target)}: Залп${c.charge ? ` с [[${c.charge}]]` : ''}${c.part === 2 ? ' (второй борт)' : ''}`;
    case 'reaction': return `${n(c.ship)}: Реакция [[${c.card}]]${c.fromPlan ? ' из Плана' : ''}`;
    case 'shot': return `${n(c.shooter)} → ${n(c.target)}: ${c.damage} по ${TR_DAT[c.track]}${c.toHull ? ` (+${c.toHull} в Корпус)` : ''}`;
    case 'cancel': return c.shooter ? `Залп ${G.ships[c.shooter].gen} отменён${c.by ? ` [[${c.by}]]` : ''}` : `[[${c.card}]] ${c.lost ? 'пропала' : 'отменена'}`;
    case 'counter': return `Ответ [[${c.card}]]: ${c.hits.map((h) => `${h.amount + h.toHull} по ${TR_DAT[h.track]}`).join(', ')} ${G.ships[c.to].dat}`;
    case 'heart': return `Сердце Дейви Джонса: ещё один Залп ${G.ships[c.ship].gen}`;
    case 'card': return `${n(c.ship)}: [[${c.card}]]`;
    case 'legend': return `${n(c.seat)}: ЛЕГЕНДА [[${c.card}]]`;
    case 'jack': return `${n(c.ship)}: ЛЕГЕНДА [[${c.ship}-Л]] — Корпус ${G.rules.jackHull}, смена мест`;
    case 'sea': return `${c.round ? `Раунд ${c.round}. ` : ''}Море: [[${c.card}]]`;
    case 'turn': return `Ход ${SIDE_LABEL[c.side].gen}`;
    case 'swap': return `${SIDE_LABEL[c.side].name}: ${SWAP_LABEL[c.reason] || 'смена мест'}`;
    case 'sink': return `${n(c.ship)} затонул`;
    case 'dive': return `${n(c.ship)} уходит под воду`;
    case 'surface': return `${n(c.ship)} всплывает`;
    case 'repair': return `${n(c.ship)}: +${c.amount} ${TR[c.track]}`;
    case 'impact': return `${n(c.ship)}: −${c.amount + c.toHull} ${TR[c.track]}`;
    case 'turnEnd': return c.plans ? `${n(c.plans.seat)}: План (${c.plans.count})` : null;
    case 'status': return c.ship ? `${n(c.ship)}: ${FLAG_LABEL[c.flag] || c.flag}` : `${SIDE_LABEL[c.side].name}: ${FLAG_LABEL[c.flag] || c.flag}`;
    case 'end': return c.winner ? `Победа ${SIDE_LABEL[c.winner].gen}` : 'Конец игры';
    default: return null;
  }
}

/* ——— панель сценария ——— */
const KN = { core: 'ядро', fire: 'огонь', chain: 'цепь', grape: 'дробь', under: 'из-под воды', keg: 'бочонок', joint: 'с союзника', mark: 'в метку', gold: 'блик', hot: 'калёное', ghost: 'призрачное', flag: 'флаги' };
const OUTN = { water: 'в воду', wind: 'ветер', bounce: 'отскок', stick: 'вязнет', past: 'мимо', whirl: 'в воронку', block: 'в заслон', overkill: 'по пустой', moon: 'Луна' };
function describe(c) {
  const n = (x) => (G.ships[x] ? G.ships[x].nick : x);
  const evs = `<small> · события: ${c.events.map((e) => e.type).join(', ') || '—'}</small>`;
  switch (c.kind) {
    case 'shot': {
      const u = (f) => c.shots.filter(f).reduce((k, b) => k + b.units, 0);
      const ok = u((b) => ['hit', 'overkill', 'moon'].includes(b.out)) === c.damage && u((b) => b.out === 'hit' && b.to === 'track') === c.amount && u((b) => b.out === 'hit' && b.to === 'hull') === c.toHull;
      const shots = c.shots.map((s) => `<span class="${s.out === 'hit' ? '' : 'miss'}"><i></i>${KN[s.kind] || s.kind}${s.out !== 'hit' ? ' ' + OUTN[s.out] : s.to === 'hull' ? ' → Корпус' : ''}${s.label ? ' · ' + esc(s.label) : ''}</span>`).join('');
      return `<span class="k">Выстрел</span> ${n(c.shooter)} → ${n(c.target)}${c.declared !== c.target ? ` <small>(объявлен по ${n(c.declared)})</small>` : ''}<div class="shots">${shots}</div><span class="check ${ok ? '' : 'bad'}">${ok ? '✓' : '✗'} долетело ${u((b) => ['hit', 'overkill', 'moon'].includes(b.out))} = урон ${c.damage}; по шкале ${c.amount}, в Корпус ${c.toHull}</span>`;
    }
    case 'announce': return `<span class="k">Объявление Залпа</span> ${n(c.shooter)} → ${n(c.target)}${c.charge ? ` · «${esc(cardName(c.charge))}»` : ''}${c.part === 2 ? ' · второй борт' : ''}${c.noReact ? ' · без Реакций' : ''}${c.captain ? ' · Заряд капитана' : ''}${evs}`;
    case 'window': return `<span class="k">Окно Реакций</span> ${c.phase === 'after' ? 'после попадания' : 'до попадания'} · ${c.mine ? 'наше' : '«Противник может ответить…»'}${evs}`;
    case 'reaction': return `<span class="k">Реакция</span> «${esc(cardName(c.card))}» <code>${c.r || '—'}</code> · ${c.phase}${c.fromPlan ? ' · из Плана' : ''}${evs}`;
    case 'legend': return `<span class="k" style="color:var(--brass)">ЛЕГЕНДА</span> «${esc(cardName(c.card))}» · выход 2 с + эффект${evs}`;
    case 'jack': return `<span class="k" style="color:var(--brass)">ЛЕГЕНДА</span> «Джек ускользает» · время замирает${evs}`;
    case 'sea': return `<span class="k">Карта моря</span> «${esc(G.sea[c.card].name)}» (${c.key})${evs}`;
    case 'ui_aim': return '<span class="k">Макет P2</span> прицеливание: вся карточка — кнопка';
    case 'ui_tia': return '<span class="k">Макет P3</span> Тиа Дальма: карты моря кликабельны';
    default: return `<span class="k">${c.kind}</span>${evs}`;
  }
}
function fmtEvent(e) { const o = { ...e }; const t = o.type; delete o.type; return `${t.padEnd(14)} ${JSON.stringify(o).replace(/"(\w+)":/g, '$1:').replace(/^\{|\}$/g, '')}`; }
let CLIPS = [];
function renderClips(now) { $('#clips').innerHTML = CLIPS.map((c, i) => `<li class="${i === now ? 'now' : i < now ? 'done' : ''}">${describe(c)}</li>`).join(''); }

/* ——— показ ——— */
function load(sc) {
  scene = sc;
  FINAL = finalState(sc);
  CLIPS = planAll(sc);
  $('#desc').innerHTML = `<b>${esc(sc.title)}.</b> ${esc(sc.desc)} <small>Источник: ${esc(sc.source || '')}</small>`;
  document.querySelectorAll('#scenes button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === sc.id)));
  $('#events').textContent = sc.actions.map((a, i) => `// действие ${i + 1}: ${JSON.stringify(a.a)}\n` + a.ev.map(fmtEvent).join('\n')).join('\n') || '// макет интерфейса — событий нет';
  renderClips(-1);
  try { history.replaceState(null, '', location.pathname + location.search + '#' + sc.id); } catch (e) { /* превью */ }
  play();
}
function clearFx(keep = new Set()) { for (const el of [...fx.children]) if (!keep.has(el)) el.remove(); }
function keepSet() {
  const k = new Set();
  if (VS) for (const el of [VS.plate, ...VS.cards, ...VS.extras]) if (el) k.add(el);
  if (PERSIST.whirl) k.add(PERSIST.whirl);
  if (CUR_CARD) k.add(CUR_CARD.el);
  return k;
}
function afterRender() {
  if (!VS || !D) return;
  const s = plank(VS.shooter), t = plank(VS.target);
  if (s) s.classList.add('shooter');
  if (t) t.classList.add('targeted');
  for (const [code, tf] of Object.entries(VS.lean || {})) { const el = plank(code); if (el) el.style.transform = tf; }
}
function resetFx() {
  VS = null; CUR_CARD = null; PERSIST.whirl = null;
  fx.innerHTML = '';
  board.getAnimations({ subtree: true }).forEach((a) => { if (!weather.contains(a.effect && a.effect.target)) a.cancel(); });
  closePop();
}
async function play() {
  const run = ++RUN;
  PLAYING = true;
  delete document.body.dataset.done;
  resetFx();
  D = makeD(scene);
  weatherKey = null;
  render();
  if (SPEED === 0) return finish(run);
  const st = scene.start || defaultStart(scene);
  const planner = FX.createPlanner({ cards: G.cards, ships: G.ships, viewer: scene.viewer, sea: st.sea, seaKey: seaKeyOf });
  let idx = 0;
  try {
    await wait(350, run);
    for (const a of scene.actions) {
      const clips = planner.feed(a.ev, a.a);
      for (const c of clips) {
        c.events = c.ev.map((i) => a.ev[i]);
        renderClips(idx++);
        if (c.kind === 'turn' && PERSIST.whirl) { A(PERSIST.whirl, [{ opacity: 1 }, { opacity: 0 }], 300, 0, 'ease-in', 'forwards'); PERSIST.whirl = null; }
        await (PLAY[c.kind] || PLAY.fallback)(c, run);
        // отображаемое состояние догоняет настоящее: события клипа в их исходном порядке
        for (const i of [...c.ev].sort((x, y) => x - y)) { FX.applyVisible(D, a.ev[i], RULES); applyExtra(D, a.ev[i]); }
        const line = logLine(c);
        D.logFresh = D.log.length;
        if (line) D.log.push(line);
        clearFx(keepSet());
        render();
      }
      for (const i of clips.quiet) { FX.applyVisible(D, a.ev[i], RULES); applyExtra(D, a.ev[i]); }
      if (CUR_CARD && planner.state.card == null) { A(CUR_CARD.el, [{ opacity: 1 }, { opacity: 0 }], 300, 0, 'ease-in', 'forwards'); CUR_CARD = null; }
    }
    if (scene.ui) { renderClips(idx++); await PLAY['ui_' + scene.ui.what]({ ...scene.ui, seat: scene.viewer[0] }, run); }
    await wait(300, run);
    finish(run);
  } catch (e) { if (e !== ABORT) { console.error(e); throw e; } }
}
function finish(run) {
  if (run !== RUN) return;
  PLAYING = false;
  const mode = D && D.mode;
  resetFx();
  const log = D ? D.log : [];
  D = structuredClone(FINAL);
  D.log = log.length ? log : CLIPS.map(logLine).filter(Boolean);
  D.logFresh = 0;
  if (scene.ui) D.mode = mode || (scene.ui.what === 'aim' ? { k: 'aim', shooter: scene.ui.shooter, targets: scene.ui.targets, chosen: scene.ui.choose } : { k: 'tia', seat: scene.viewer[0], cards: scene.ui.cards, order: [...scene.ui.order] });
  render();
  renderClips(CLIPS.length);
  document.body.dataset.done = '1';
}
function skip() { RUN++; finish(RUN); }

/* ——— всплывающие карты ——— */
function openCard(code) {
  const c = G.cards[code]; if (!c) return;
  const pop = $('#pop');
  pop.innerHTML = `<div class="bigcard t-${TYPE_CLASS[c.type] || ''} ${c.legend ? 'legend' : ''}" role="dialog" aria-label="${esc(c.name)}"><button class="x" aria-label="Закрыть">×</button><small>${c.legend ? 'ЛЕГЕНДА · ' : ''}${esc(c.type)}${c.cost ? ` · ${c.cost} Порох` : ''}${c.soul ? ` · ${c.soul} Души` : ''}</small><h4>${esc(c.name)}</h4><div class="bg">${esc(c.big)}</div><div class="tx">${c.text}</div><div class="fl">${esc(c.flavor || '')}</div></div>`;
  pop.hidden = false;
}
function openSea(code) {
  const s = G.sea[code]; if (!s) return;
  const pop = $('#pop');
  pop.innerHTML = `<div class="seacard" role="dialog" aria-label="${esc(s.name)}"><div class="art" style="background:${SEA_BG[s.key]};display:flex;align-items:center;justify-content:center"><span class="kind">Море · ${esc(s.when.toLowerCase())}</span>${seaSvg(s.key)}</div><div class="body"><div class="t">${esc(s.name)}</div><div class="fxl">${s.text}</div><span class="dur">${s.when === 'Сразу' ? 'действует сразу' : 'до следующей карты моря'}</span></div></div>`;
  pop.hidden = false;
}
function closePop() { const p = $('#pop'); if (!p) return; p.hidden = true; p.innerHTML = ''; }

/* ——— события страницы ——— */
$('#pop').addEventListener('click', (e) => { if (e.target.id === 'pop' || e.target.closest('.x') || e.target.closest('.seacard')) closePop(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePop(); });
stage.addEventListener('click', (e) => {
  const cref = e.target.closest('[data-card], [data-fx-hand] [data-fx-card]');
  const code = cref && (cref.dataset.card || cref.dataset.fxCard);
  if (code && code !== '?') { e.stopPropagation(); openCard(code); return; } // карты в руке и журнале открываются и во время показа
  const sref = e.target.closest('[data-sea]');
  if (sref) { e.stopPropagation(); openSea(sref.dataset.sea); return; }
  if (e.target.closest('[data-fx-sea-chip]') && D.sea) { openSea(D.sea); return; }
  if (D.mode && D.mode.k === 'aim') {
    const pl = e.target.closest('[data-fx-ship]');
    if (pl && D.mode.targets[pl.dataset.fxShip]) { RUN++; PLAYING = false; fx.innerHTML = ''; D.mode.chosen = pl.dataset.fxShip; render(); return; }
  }
  if (D.mode && D.mode.k === 'tia') {
    const opt = e.target.closest('[data-opt]');
    if (opt) { RUN++; PLAYING = false; fx.innerHTML = ''; const o = D.mode.order, k = opt.dataset.opt, i = o.indexOf(k); if (i >= 0) o.splice(i, 1); else if (o.length < 3) o.push(k); render(); return; }
    if (e.target.closest('[data-act="reset"]')) { RUN++; D.mode.order = []; render(); return; }
  }
  // Анимация не блокирует стол: нажатие по доске (не по руке, не по окну выбора) сразу показывает итог.
  if (PLAYING && e.target.closest('#board') && !e.target.closest('[data-fx-hand], .choice')) skip();
});
stage.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-fx-ship][role="button"],[data-opt]')) { e.preventDefault(); e.target.click(); } });

const sc = $('#scenes');
let lastGroup = '';
for (const s of SCENES) {
  if (s.group !== lastGroup) { lastGroup = s.group; sc.insertAdjacentHTML('beforeend', `<span class="grp ${s.group === 'Легенды' ? 'gold' : ''}">${esc(s.group)}</span>`); }
  sc.insertAdjacentHTML('beforeend', `<button data-id="${s.id}" aria-pressed="false">${esc(s.title)}</button>`);
}
sc.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) load(SCENES.find((s) => s.id === b.dataset.id)); });
$('#play').addEventListener('click', () => play());
$('#skip').addEventListener('click', skip);
function seg(id, fn) { const el = $(id); el.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; el.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); fn(Number(b.dataset.v)); }); }
seg('#speed', (v) => { SPEED = v; weatherKey = null; play(); });
seg('#rich', (v) => { RICH = !!v; weatherKey = null; play(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && PLAYING) skip(); }); // из фоновой вкладки — сразу итог
new ResizeObserver(() => { if (D) { weatherKey = null; renderWeather(); } }).observe(stage);

// режим съёмки (?cap=<сцена>), скорость (?speed=), спецэффекты (?rich=0), ссылка на сцену (#id)
const params = new URLSearchParams(location.search);
if (params.get('cap')) document.body.classList.add('cap');
if (params.get('rich') === '0') { RICH = false; $('#rich').querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.v === '0'))); }
if (params.get('speed')) { SPEED = Number(params.get('speed')); $('#speed').querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(Number(x.dataset.v) === SPEED))); }
let reduced = false;
try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ничего */ }
if (reduced && !params.get('cap') && !params.get('speed')) { SPEED = 0; $('#rm').hidden = false; $('#speed').querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.v === '0'))); }
window.__skip = skip;
window.__scenes = SCENES.map((s) => s.id);
const startId = params.get('cap') || decodeURIComponent((location.hash || '').slice(1));
load(SCENES.find((s) => s.id === startId) || SCENES[0]);
