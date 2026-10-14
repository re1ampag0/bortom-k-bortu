/* =====================================================================================================
   board.js — стол эталона. Разметка и классы те же, что в игре (src/ui/game/Table.tsx, Hand.tsx),
   плюс атрибуты data-fx-* — «DOM-контракт», по которому слой анимаций находит элементы.
   В игре эти атрибуты добавляются в Table.tsx/Hand.tsx/Game.tsx (см. PORTING.md, раздел 3).
   Стол рисуется из ОТОБРАЖАЕМОГО состояния D (оно отстаёт от настоящего, пока идёт анимация).
   ===================================================================================================== */
'use strict';
const G = window.GAME;
const P = 'ПИРАТЫ', C = 'КОМПАНИЯ';
const SIDE_LABEL = { [P]: { name: 'Пираты', gen: 'Пиратов', team: 'ПИРАТЫ' }, [C]: { name: 'Компания', gen: 'Компании', team: 'КОМПАНИЯ' } };
const TRACKS = ['hull', 'sails', 'guns', 'crew'];
const TR = { hull: 'Корпус', sails: 'Паруса', guns: 'Пушки', crew: 'Команда' };
const TR_DAT = { hull: 'Корпусу', sails: 'Парусам', guns: 'Пушкам', crew: 'Команде' };
const TYPE_CLASS = { 'ЗАРЯД': 'charge', 'РЕАКЦИЯ': 'reaction', 'ПРИКАЗ': 'order', 'РЕМОНТ': 'repair' };
const $ = (q, r = document) => r.querySelector(q);
const stage = $('#stage'), board = $('#board'), fx = $('#fx'), weather = $('#weather');
let D = null; // отображаемое состояние

const nick = (c) => G.ships[c].nick;
const sideOf = (c) => G.ships[c].side;
const other = (s) => (s === P ? C : P);
const bottomSide = () => sideOf(D.viewer[0]);
const cardName = (code) => (G.cards[code] ? G.cards[code].name : code);
const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const strip = (h) => String(h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').replace(/ ([.,:;!?])/g, '$1').trim();

function hcardHTML(code, extra = '') {
  if (!code || code === '?' || !G.cards[code]) return `<span class="hcard back ${extra}" data-fx-card="?"></span>`;
  const c = G.cards[code];
  const cls = c.legend ? 'legend' : TYPE_CLASS[c.type] || '';
  return `<button class="hcard ${cls} ${extra}" data-fx-card="${code}"><span class="hcard-head"><span class="hcard-type">${c.legend ? 'Легенда' : c.type}</span>${c.cost || c.soul ? `<span class="cost">${c.cost || ''}${c.soul ? (c.cost ? '+' : '') + c.soul + 'Д' : ''}</span>` : ''}</span><span class="hcard-name">${esc(c.name)}</span><span class="hcard-big">${esc(c.big)}</span><span class="hcard-text">${esc(strip(c.text))}</span></button>`;
}

function plankHTML(code) {
  const d = G.ships[code], s = D.ships[code];
  const legend = G.cards[`${code}-Л`];
  const rows = TRACKS.map((t) => {
    const max = d.max[t], v = s.tracks[t];
    const silver = t === 'crew' && D.sea && G.sea[D.sea] && G.sea[D.sea].key === 'moon' ? ' silver' : '';
    return `<div class="track t-${t}${silver}" data-fx-track="${t}"><span class="track-label">${TR[t]}</span>` +
      `<span class="cells">${Array.from({ length: max }, (_, i) => `<i class="${i < v ? 'on' : ''}"></i>`).join('')}</span>` +
      `<span class="bar"><i style="width:${(100 * v) / max}%"></i></span><b class="track-num" data-fx-value>${v}/${max}</b></div>`;
  }).join('');
  const st = [];
  if (s.submerged) st.push('Под водой');
  if (s.mark) st.push('Чёрная метка');
  if (s.flags) for (const f of s.flags) st.push(f);
  const badges = [
    s.fires > 0 ? `<span class="badge fire" data-fx-fires>Пожар ${s.fires}</span>` : '',
    d.souls != null ? `<span class="badge souls" data-fx-souls>Души ${s.souls} / ${d.souls}</span>` : '',
    !s.sunk ? `<span class="badge legend ${s.legend ? '' : 'gone'}" data-fx-legend><span class="wide">Легенда: </span>${esc(legend.name)}</span>` : '',
    `<span class="badge wide">Рука ${handCount(code)}</span>`,
  ].join('');
  const cls = ['plank', sideOf(code) === bottomSide() ? 'own' : 'enemy', s.sunk ? 'sunk' : '', s.submerged ? 'submerged' : ''].join(' ');
  return `<section class="${cls}" data-fx-ship="${code}" style="--ship:${d.color}">` +
    `<header class="plank-head"><b class="plank-name"><span class="wide">${esc(d.name)}</span><span class="narrow">${esc(d.short)}</span><span class="star narrow ${s.legend ? '' : 'gone'}">★</span></b>` +
    `<span class="captain wide">${esc(d.captain)}</span><span class="plank-role">${s.sunk ? '<span class="tag">ЗАТОНУЛ</span>' : ''}<span class="narrow hand-count">${handCount(code)} карт</span></span></header>` +
    (st.length ? `<div class="plank-statuses" data-fx-statuses>${st.map((x) => `<span class="status-chip">${x}</span>`).join('')}</div>` : '') +
    `<div class="plank-body"><div class="tracks">${rows}</div><div class="badges">${badges}</div></div></section>`;
}
function handCount(code) { const h = D.ships[code].hand; return Array.isArray(h) ? h.length : h; }

function teamRow(side) {
  const n = D.powder[side];
  const dots = Array.from({ length: G.rules.cap }, (_, i) => `<i class="${i < n ? 'on' : ''}" data-fx-keg></i>`).join('');
  return `<div class="team-row"><span class="team-name">${SIDE_LABEL[side].team}</span><span class="muted">Трюм</span><span class="powder-dots" data-fx-hold="${side}">${dots}<b>${n}</b></span>${side === bottomSide() ? '<span class="muted wide" style="margin-left:auto">вы играете за ' + (side === P ? 'Пиратов' : 'Компанию') + '</span>' : ''}</div>`;
}

function render() {
  const top = other(bottomSide()), bot = bottomSide();
  // как в игре (Game.tsx): живые корабли — на своём месте, затонувший — на свободном
  const row = (side) => { const cols = [null, null], ships = Object.keys(D.ships).filter((c) => sideOf(c) === side); for (const c of ships) if (!D.ships[c].sunk) cols[D.ships[c].pos] = c; for (const c of ships) if (D.ships[c].sunk) { const p = D.ships[c].pos; cols[cols[p] ? 1 - p : p] = c; } return cols.filter(Boolean); };
  const seat = D.handSeat;
  const hand = D.ships[seat] ? D.ships[seat].hand : [];
  const tabs = D.viewer.map((c) => `<span class="tab ${c === seat ? 'on' : ''}">${G.ships[c].short}${D.ships[c].sunk ? ' (капитан)' : ''}</span>`).join('');
  board.querySelectorAll(':scope > .team-row, :scope > .planks, :scope > .middle, :scope > .hand-row').forEach((x) => x.remove());
  board.insertAdjacentHTML('afterbegin',
    teamRow(top) +
    `<div class="planks top">${row(top).map(plankHTML).join('')}</div>` +
    `<div class="middle" data-fx-gap><span class="hint">${esc(D.hint || '')}</span></div>` +
    `<div class="planks bottom">${row(bot).map(plankHTML).join('')}</div>` +
    teamRow(bot) +
    `<div class="hand-row" data-fx-hand><div><div class="hand-head">${tabs}<span class="deck-info" data-fx-deck>Колода ${D.deck ?? 17} · Сброс ${D.discard ?? 0}</span></div>` +
    `<div class="hand-cards">${Array.isArray(hand) ? hand.map((c) => hcardHTML(c)).join('') : ''}</div></div>` +
    `<div class="hand-actions"><button class="end-turn">Ход окончен</button></div></div>`);
  // строка состояния
  const sea = D.sea && G.sea[D.sea];
  $('#status').innerHTML = `<div class="status-turn"><span class="dot ${D.active === C ? 'company' : ''}"></span><span class="wide">Раунд ${D.round} · Ход ${SIDE_LABEL[D.active].gen}</span><span class="narrow">Р${D.round} · ${SIDE_LABEL[D.active].name}</span></div>` +
    `<div class="status-text" data-fx-instruction>${esc(D.instruction || '')}</div>` +
    `<div class="status-tools"><button class="chip sea" data-fx-sea-chip ${sea ? '' : 'hidden'}>${sea ? `${chipIcon(D.sea)}<span class="wide"><b>Море:</b> ${esc(sea.name)} <span class="muted">· ${esc(sea.big)}</span></span><span class="narrow">${esc(sea.name)} ⓘ</span>` : ''}</button><button class="ibtn" aria-label="Настройки">⚙</button></div>`;
  renderLog();
  renderMode();
  renderWeather();
  if (typeof afterRender === 'function') afterRender(); // эталон: вернуть подсветку текущего Залпа после перерисовки
}

function renderLog() {
  const lines = [...(D.log || [])].reverse().slice(0, 16);
  const n = (D.log || []).length, fresh = D.logFresh ?? n;
  $('#log').innerHTML = lines.map((l, i) => `<li class="${n - i > fresh ? 'fresh' : ''}">${linkify(l)}</li>`).join('');
}
function linkify(text) {
  return esc(text).replace(/\[\[(С-\d\d|[ЖМИГ]-(?:\d\d|Л))\]\]/g, (_, code) => (code.startsWith('С-') ? `<button class="cref" data-sea="${code}">«${esc(G.sea[code].name)}»</button>` : `<button class="cref" data-card="${code}">«${esc(cardName(code))}»</button>`));
}
