/* =====================================================================================================
   planfx.js — ЭТАЛОН ПЛАНИРОВЩИКА АНИМАЦИЙ (чистые функции, без DOM).
   Переносится в игру как src/ui/game/fx/planFx.ts и src/ui/game/fx/display.ts (см. PORTING.md).

   Проверен на событиях настоящего движка: 300 партий ботов × 2 стороны стола (validate.mjs):
   каждое событие попадает ровно в один клип; у каждого Залпа долетевших ядер столько же,
   сколько урона посчитал движок, по шкале — столько, сколько в событиях damage; отображаемое
   состояние после событий совпадает с настоящим.

   Вход — события ОДНОГО действия так, как их видит игрок (после eventsFor), по порядку действий.
   Планировщик помнит незаконченный Залп между действиями: объявление и выстрел приходят разными
   действиями, если открывается окно Реакций.
   ===================================================================================================== */
(function (root) {
  'use strict';

  /** Снаряд по шкале цели. */
  const KIND_BY_TRACK = { hull: 'core', guns: 'core', sails: 'chain', crew: 'grape' };

  /** Слагаемое разбора урона → откуда оно. Сейчас у Term нет src (его добавит задача A1),
   *  поэтому, если src нет, источник определяется по тексту what. */
  const SRC_BY_WHAT = {
    'Пушки': 'guns', 'диагональ': 'diag', 'совместный залп': 'joint', 'всплытие': 'surface',
    'доплата Порохом': 'paid', 'Чёрная метка': 'mark', 'Ясное небо': 'clear', 'Поднять флаги!': 'flags', 'Буря': 'sea',
  };
  function termSrc(t, ctx) {
    if (t.src) return t.src;
    const k = SRC_BY_WHAT[t.what];
    if (k) return { kind: k };
    if (ctx.chargeName && t.what === ctx.chargeName) return { kind: 'charge', card: ctx.charge };
    const r = ctx.reactions.find((x) => ctx.cards[x.card] && ctx.cards[x.card].name === t.what);
    if (r) return { kind: 'reaction', card: r.card };
    return { kind: 'extra' }; // бонус карты-приказа («Всплытие», «Зомби у пушек») и всё новое
  }

  /** Вид лишнего ядра по источнику плюса. */
  function plusKind(src, base, chargeFx) {
    switch (src.kind) {
      case 'surface': return 'under';
      case 'paid': return 'keg';
      case 'joint': return 'joint';
      case 'mark': return 'mark';
      case 'clear': return 'gold';
      case 'flags': return 'flag';
      case 'charge':
        if (!chargeFx) return base;
        if (chargeFx.fire) return 'fire';
        if (chargeFx.if_fire) return 'hot';
        if (chargeFx.if_damaged) return 'ghost';
        if (chargeFx.no_react && chargeFx.no_diag) return 'under';
        return base;
      case 'extra': return 'under';
      default: return base;
    }
  }
  /** Вид промаха по источнику минуса. */
  function minusOut(src, cards) {
    if (src.kind === 'diag') return 'water';
    if (src.kind === 'sea') return 'wind';
    if (src.kind === 'reaction') {
      const r = cards[src.card] && cards[src.card].fx ? cards[src.card].fx.r : null;
      if (r === 'redirect') return 'stick';
      if (r === 'reduce_all') return 'whirl';
      if (r === 'cancel_crew') return 'block';
      return 'bounce';
    }
    return 'water';
  }

  /**
   * Раскладка ядер одного попадания. Ядро = 1 урон.
   * shot: { track, damage, terms, amount, toHull, charge, reactions, chargeCancelled, sea }
   * Возвращает [{ kind, out, label, units, to }]; out: hit | overkill | moon | water | wind | bounce | stick | whirl | block | past
   * to: 'track' | 'hull' | null. Сумма units у hit+overkill+moon = damage.
   */
  function layoutShots(shot, cards) {
    const base = KIND_BY_TRACK[shot.track];
    const ctx = { cards, charge: shot.charge, chargeName: shot.charge && cards[shot.charge] ? cards[shot.charge].name : null, reactions: shot.reactions || [] };
    const chargeFx = shot.charge && !shot.chargeCancelled && cards[shot.charge] ? cards[shot.charge].fx : null;
    const balls = [];
    const terms = shot.terms || [];
    let guns = 0;
    for (const t of terms) if (termSrc(t, ctx).kind === 'guns') guns += t.n;
    for (let i = 0; i < guns; i++) balls.push({ kind: base, out: 'hit', label: null, units: 1, to: null });
    for (const t of terms) {
      const src = termSrc(t, ctx);
      if (t.n <= 0 || src.kind === 'guns') continue;
      const kind = plusKind(src, base, chargeFx);
      for (let j = 0; j < t.n; j++) balls.push({ kind, out: 'hit', label: j === 0 ? `${t.what} +${t.n}` : null, units: 1, to: null, plus: src.kind });
    }
    // Минусы гасят последние долетающие ядра: сначала обычные, потом лишние.
    const knock = (n, out, label) => {
      for (let j = 0; j < n; j++) {
        let k = -1;
        for (let q = guns - 1; q >= 0; q--) if (balls[q].out === 'hit') { k = q; break; }
        if (k < 0) for (let q = balls.length - 1; q >= 0; q--) if (balls[q].out === 'hit') { k = q; break; }
        if (k < 0) return;
        balls[k].out = out; balls[k].label = j === 0 ? label : null;
      }
    };
    for (const t of terms) {
      if (t.n >= 0) continue;
      const src = termSrc(t, ctx);
      knock(-t.n, minusOut(src, cards), `${t.what} −${-t.n}`);
    }
    // Урон меньше суммы слагаемых — отмена без строки разбора («Зомби-офицеры», «Морская пехота»).
    const live = () => balls.filter((b) => b.out === 'hit').length;
    let extra = live() - shot.damage;
    if (extra > 0) {
      const cc = [...(shot.reactions || [])].reverse().find((x) => cards[x.card] && cards[x.card].fx && cards[x.card].fx.r === 'cancel_crew');
      knock(extra, cc ? 'block' : 'water', cc ? `${cards[cc.card].name} −${extra}` : `−${extra}`);
    }
    while (live() < shot.damage) balls.push({ kind: base, out: 'hit', label: null, units: 1, to: null });
    // Куда приходятся долетевшие: amount — по шкале, toHull — в Корпус, остальное — лишнее (корабль тонет, «Джек», «Лунный свет»).
    let a = shot.amount || 0, h = shot.toHull || 0, moon = shot.sea === 'moon' && shot.track === 'crew' ? 1 : 0;
    for (const b of balls) {
      if (b.out !== 'hit') continue;
      if (a > 0) { b.to = 'track'; a--; }
      else if (h > 0) { b.to = 'hull'; h--; }
      else if (moon > 0) { b.out = 'moon'; b.label = 'Лунный свет −1'; moon--; }
      else { b.out = 'overkill'; }
    }
    // Больше 8 ядер — сжимаем самую большую группу одинаковых попаданий в одно крупное «×N».
    if (balls.length > 8) {
      const key = (b) => `${b.kind}|${b.out}|${b.to}`;
      const groups = {};
      balls.forEach((b, i) => { (groups[key(b)] = groups[key(b)] || []).push(i); });
      const big = Object.values(groups).sort((x, y) => y.length - x.length)[0];
      const excess = balls.length - 8;
      const merge = big.slice(big.length - excess - 1);
      const keep = balls[merge[0]];
      keep.units = merge.reduce((n, i) => n + balls[i].units, 0);
      keep.big = true; keep.label = `×${keep.units}`;
      const drop = new Set(merge.slice(1));
      return balls.filter((_, i) => !drop.has(i));
    }
    return balls;
  }

  /** Какие события может «впитать» клип-контекст, пока он последний в очереди. */
  const ABSORB = {
    card: ['damage', 'restored', 'drew', 'powderGained', 'powderLost', 'flagSet', 'turnFlag', 'limitRaised', 'stolen', 'passed', 'discarded', 'shown', 'seaLooked', 'dice', 'fireAdded', 'soulsSpent', 'soulsGained', 'deckReshuffled', 'swapped'],
    legend: ['damage', 'sunk', 'jonesFree', 'restored', 'soulsGained', 'fireAdded'],
    jack: ['swapped'],
    round: ['seaRevealed'],
    sea: ['seaEffect', 'damage', 'restored', 'powderGained', 'powderLost', 'swapped', 'soulsGained'],
    turn: ['powderGained', 'fireDamage', 'damage', 'surfaced', 'seaEffect', 'swapped', 'drew', 'deckReshuffled', 'soulsGained'],
    heart: ['damage'],
    swap: ['swapped'],
    ability: ['swapped', 'limitRaised', 'restored'],
    sell: ['powderGained'],
    repair: ['soulsUsed'],
    turnEnd: ['turnEnded'],
    counter: ['damage', 'fireAdded', 'soulsGained'],
  };
  /** События, которые ничего не показывают сами (входят в соседние клипы). */
  const QUIET = new Set(['noReaction', 'cardResolved', 'deckReshuffled']);

  function createPlanner(opts) {
    const cards = opts.cards;
    const ships = opts.ships;
    const mySide = ships[opts.viewer[0]].side;
    const st = {
      sea: opts.sea || null,         // ключ текущей карты моря
      vol: null,                     // объявленный Залп: ждёт выстрела
      lastShot: null,                // последний выстрел (для окна «после» и второй части «Залпа с обоих бортов»)
      card: null,                    // разыгрываемая карта (cardPlayed … cardResolved)
      counter: null,                 // ответ Реакции: { from, against, card }
      noReact: {},                   // корабли, которым до конца хода нельзя Реакции
      noReactSide: {},
      shot: null,                    // открытое попадание: ждём его события damage
      phase: null,                   // фаза последнего окна Реакций: before | after
    };
    const seaKey = opts.seaKey || ((code) => code);

    function feed(events, action) {
      const out = [];
      const costs = [];
      const quiet = [];
      const last = () => out[out.length - 1];
      const push = (clip, i) => { clip.ev = i === undefined ? [] : [i]; out.push(clip); return clip; };
      const take = (reason) => { const k = costs.findIndex((x) => x.reason === reason); if (k < 0) return null; const c = costs.splice(k, 1)[0]; return c; };
      const absorb = (e, i, kinds) => {
        const c = last();
        if (!c || !ABSORB[c.kind] || !ABSORB[c.kind].includes(e.type)) return null;
        if (kinds && !kinds.includes(c.kind)) return null;
        c.ev.push(i);
        (c.effects = c.effects || []).push(e);
        return c;
      };
      const closeShot = () => {
        const s = st.shot;
        if (!s) return;
        s.shots = layoutShots(s, cards);
        st.shot = null;
      };

      events.forEach((e, i) => {
        if (st.shot && !(e.type === 'damage' && e.ship === st.shot.target) && !(e.type === 'soulsGained') && !(e.type === 'fireAdded' && e.ship === st.shot.target)) closeShot();
        switch (e.type) {
          case 'powderSpent': costs.push({ reason: e.reason, side: e.side, amount: e.amount, i }); return;
          case 'soulsSpent': {
            if (st.card && absorb(e, i, ['card'])) return;
            costs.push({ reason: 'souls', ship: e.ship, amount: e.amount, i });
            return;
          }

          case 'volley': {
            const prev = st.lastShot;
            const fx = e.charge && cards[e.charge] ? cards[e.charge].fx : {};
            const part2 = !!(prev && prev.part === 1 && prev.shooter === e.ship && e.charge && prev.charge === e.charge && fx.both);
            const cv = take('volley'), cc = part2 ? null : take('card');
            const clip = push({
              kind: 'announce', shooter: e.ship, target: e.target, track: e.track || 'hull', charge: e.charge, chargeFrom: e.chargeFrom,
              captain: !!(e.chargeFrom && e.chargeFrom !== e.ship), diagonal: e.diagonal, joint: e.joint, damage: e.damage,
              terms: e.terms || null, part: part2 ? 2 : 1, heart: !!(last() && last().kind === 'heart'), byCard: st.card,
              cost: { volley: cv ? cv.amount : 0, card: cc ? cc.amount : 0 },
              noReact: !!(fx.no_react || st.noReact[e.target] || st.noReactSide[ships[e.ship].side]),
              noDiagBy: e.diagonal && fx.no_diag ? e.charge : null,
            }, i);
            if (cv) clip.ev.push(cv.i); if (cc) clip.ev.push(cc.i);
            st.vol = { shooter: e.ship, target: e.target, charge: e.charge, part: clip.part, reactions: [], announce: clip };
            st.counter = null;
            return;
          }
          case 'windowOpened': {
            st.phase = e.window;
            push({ kind: 'window', side: e.side, phase: e.window, mine: e.side === mySide, forCard: !st.vol && !!st.card, seats: e.seats }, i);
            return;
          }
          case 'reaction': {
            const fx = cards[e.card] ? cards[e.card].fx : {};
            const cr = take('reaction');
            const clip = push({ kind: 'reaction', seat: e.seat, ship: e.ship, card: e.card, r: fx.r, fromPlan: e.fromPlan,
              cost: cr ? cr.amount : 0, phase: st.vol ? 'before' : st.phase === 'after' ? 'after' : 'card', mine: ships[e.ship].side === mySide }, i);
            if (cr) clip.ev.push(cr.i);
            if (st.vol) st.vol.reactions.push({ card: e.card, ship: e.ship, r: fx.r });
            if (fx.counter) {
              const against = st.vol ? st.vol.shooter : st.lastShot ? st.lastShot.shooter : null;
              st.counter = against ? { from: e.ship, against, card: e.card } : null;
            }
            return;
          }
          case 'hit': {
            const v = st.vol || { shooter: e.ship, target: e.target, charge: null, part: 1, reactions: [] };
            const cancelCharge = v.reactions.some((x) => x.r === 'cancel_charge');
            st.shot = push({ kind: 'shot', shooter: e.ship, declared: v.target, target: e.target, track: e.track, damage: e.damage, terms: e.terms,
              charge: v.charge, chargeCancelled: cancelCharge, reactions: v.reactions, part: v.part, amount: 0, toHull: 0, souls: 0, fire: 0, sea: st.sea ? seaKey(st.sea) : null }, i);
            st.lastShot = { shooter: e.ship, target: e.target, charge: v.charge, part: v.part };
            st.vol = null;
            return;
          }
          case 'volleyCancelled': {
            const v = st.vol || { reactions: [] };
            const by = v.reactions[v.reactions.length - 1] || null;
            push({ kind: 'cancel', shooter: e.ship, target: e.target, by: by ? by.card : null, r: by ? by.r : null, charge: v.charge || null }, i);
            st.lastShot = { shooter: e.ship, target: e.target, charge: v.charge || null, part: v.part || 1, cancelled: true };
            st.vol = null;
            return;
          }
          case 'damage': {
            if (st.shot && e.ship === st.shot.target) { st.shot.amount += e.amount; st.shot.toHull += e.toHull; st.shot.ev.push(i); return; }
            if (st.counter && e.ship === st.counter.against) {
              const c = last();
              if (c && c.kind === 'counter' && c.to === e.ship) { c.hits.push({ track: e.track, amount: e.amount, toHull: e.toHull }); c.ev.push(i); return; }
              push({ kind: 'counter', from: st.counter.from, to: e.ship, card: st.counter.card, hits: [{ track: e.track, amount: e.amount, toHull: e.toHull }], fire: 0 }, i);
              return;
            }
            if (last() && last().kind === 'heart' && e.ship === last().ship && e.track === 'crew') { last().crew += e.amount + e.toHull; last().ev.push(i); return; }
            if (absorb(e, i, ['card', 'legend', 'sea', 'turn'])) return;
            push({ kind: 'impact', ship: e.ship, track: e.track, amount: e.amount, toHull: e.toHull, cause: st.card || null }, i);
            return;
          }
          case 'fireAdded': {
            if (st.shot && e.ship === st.shot.target) { st.shot.fire = e.fires; st.shot.ev.push(i); return; }
            const c = last();
            if (c && c.kind === 'counter' && c.to === e.ship) { c.fire = e.fires; c.ev.push(i); return; }
            if (absorb(e, i, ['card', 'legend'])) return;
            push({ kind: 'fire', ship: e.ship, fires: e.fires }, i);
            return;
          }
          case 'soulsGained': {
            if (st.shot) { st.shot.souls += e.amount; st.shot.ev.push(i); return; }
            const c = last();
            if (c && (c.kind === 'counter' || c.kind === 'impact' || c.kind === 'card' || c.kind === 'legend' || c.kind === 'sea' || c.kind === 'turn')) { c.souls = (c.souls || 0) + e.amount; c.ev.push(i); return; }
            push({ kind: 'souls', ship: e.ship, n: e.amount }, i);
            return;
          }
          case 'sunk': {
            if (absorb(e, i, ['legend'])) return;
            push({ kind: 'sink', ship: e.ship }, i);
            return;
          }
          case 'jackEscaped': {
            const cr = take('reaction');
            const clip = push({ kind: 'jack', ship: e.ship, cost: cr ? cr.amount : 0 }, i);
            if (cr) clip.ev.push(cr.i);
            return;
          }
          case 'legendPlayed': {
            const cc = take('card'), cs = take('souls');
            // soulCost — потраченные Души (цена «Кракена»); souls — Души, полученные эффектами Легенды.
            const clip = push({ kind: 'legend', seat: e.seat, card: e.card, target: e.target, cost: cc ? cc.amount : 0, soulCost: cs ? cs.amount : 0, souls: 0, effects: [] }, i);
            if (cc) clip.ev.push(cc.i); if (cs) clip.ev.push(cs.i);
            return;
          }
          case 'cardPlayed': {
            const cc = take('card');
            const clip = push({ kind: 'card', seat: e.seat, ship: e.ship, card: e.card, target: action && action.target ? action.target : null, cost: cc ? cc.amount : 0, effects: [] }, i);
            if (cc) clip.ev.push(cc.i);
            st.card = e.card;
            return;
          }
          case 'cardResolved': {
            if (e.card === st.card) st.card = null;
            if (e.to === 'stolen') { push({ kind: 'steal', seat: e.seat, card: e.card, after: true }, i); return; }
            const c = last();
            if (c && (c.kind === 'legend' || c.kind === 'card') && c.card === e.card) { c.ev.push(i); c.resolvedTo = e.to; return; }
            quiet.push(i);
            return;
          }
          case 'cardCancelled': case 'cardLost':
            push({ kind: 'cancel', card: e.card, lost: e.type === 'cardLost', by: null }, i);
            return;
          case 'roundStarted': push({ kind: 'round', round: e.round }, i); return;
          case 'seaRevealed': {
            st.sea = e.card;
            const c = last();
            const clip = c && c.kind === 'round' ? c : push({ kind: 'round', round: null }, undefined);
            clip.kind = 'sea'; clip.card = e.card; clip.key = seaKey(e.card); clip.reshuffled = e.reshuffled; clip.effects = [];
            clip.ev.push(i);
            const cs = take('sea'); if (cs) clip.ev.push(cs.i);
            return;
          }
          case 'seaEffect': {
            if (absorb(e, i, ['sea', 'turn'])) return;
            push({ kind: 'fallback', type: e.type, key: e.key }, i);
            return;
          }
          case 'turnStarted': st.noReact = {}; st.noReactSide = {}; st.card = null; push({ kind: 'turn', side: e.side, mine: e.side === mySide, effects: [] }, i); return;
          case 'turnEnded': {
            const c = last();
            if (c && c.kind === 'turnEnd') { c.ev.push(i); return; }
            push({ kind: 'turnEnd', side: e.side, plans: null }, i);
            return;
          }
          case 'planned': push({ kind: 'turnEnd', side: ships[e.seat].side, plans: { seat: e.seat, count: e.count } }, i); return;
          case 'heart': push({ kind: 'heart', ship: e.ship, crew: 0 }, i); return;
          case 'regrouped': {
            const cr = take('regroup');
            const clip = push({ kind: 'swap', side: e.side, reason: 'regroup', ships: e.ships, cost: cr ? cr.amount : 0 }, i);
            if (cr) clip.ev.push(cr.i);
            return;
          }
          case 'swapped': {
            if (absorb(e, i, ['swap', 'jack', 'sea', 'turn', 'ability', 'card'])) return;
            push({ kind: 'swap', side: e.side, reason: e.reason, ships: e.ships, cost: 0 }, i);
            return;
          }
          case 'sword': case 'treasury': {
            const ca = take('ability');
            const clip = push({ kind: 'ability', what: e.type, ship: e.ship, cost: ca ? ca.amount : 0 }, i);
            if (ca) clip.ev.push(ca.i);
            return;
          }
          case 'jonesFree': {
            if (absorb(e, i, ['legend'])) return;
            push({ kind: 'ability', what: 'jonesFree', ship: e.ship, cost: 0 }, i);
            return;
          }
          case 'dived': push({ kind: 'dive', ship: e.ship }, i); return;
          case 'surfaced': {
            if (absorb(e, i, ['turn'])) return;
            push({ kind: 'surface', ship: e.ship }, i);
            return;
          }
          case 'fireDamage': {
            if (absorb(e, i, ['turn'])) return;
            push({ kind: 'impact', ship: e.ship, track: 'hull', amount: 0, toHull: 0, cause: 'fire' }, i);
            return;
          }
          case 'restored': {
            if (absorb(e, i, ['card', 'legend', 'sea', 'ability'])) return;
            push({ kind: 'repair', ship: e.ship, track: e.track, amount: e.amount, cause: st.card }, i);
            return;
          }
          case 'soulsUsed': {
            const c = last();
            if (c && c.kind === 'repair' && c.ship === e.ship) { c.ev.push(i); c.cause = 'souls'; return; }
            push({ kind: 'souls', ship: e.ship, n: -1 }, i);
            return;
          }
          case 'powderGained': {
            if (absorb(e, i, ['turn', 'sea', 'card', 'sell'])) return;
            push({ kind: 'powder', side: e.side, n: e.amount, burned: e.burned, reason: e.reason }, i);
            return;
          }
          case 'powderLost': {
            if (absorb(e, i, ['sea', 'card'])) return;
            push({ kind: 'powder', side: e.side, n: -e.amount, reason: 'lost' }, i);
            return;
          }
          case 'drew': {
            if (absorb(e, i, ['turn', 'card'])) return;
            push({ kind: 'draw', seat: e.seat, count: e.count, cards: e.cards || null }, i);
            return;
          }
          case 'sold': push({ kind: 'sell', seat: e.seat, card: e.card }, i); return;
          case 'passed': if (absorb(e, i, ['card'])) return; push({ kind: 'pass', seat: e.seat, to: e.to, card: e.card }, i); return;
          case 'stolen': if (absorb(e, i, ['card'])) return; push({ kind: 'steal', seat: e.seat, from: e.from, card: e.card }, i); return;
          case 'discarded': if (absorb(e, i, ['card'])) return; push({ kind: 'discard', seat: e.seat, card: e.card }, i); return;
          case 'shown': if (absorb(e, i, ['card'])) return; push({ kind: 'peek', seat: e.seat, to: e.to }, i); return;
          case 'seaLooked': if (absorb(e, i, ['card'])) return; push({ kind: 'peek', seat: e.seat, sea: true }, i); return;
          case 'dice': if (absorb(e, i, ['card'])) return; push({ kind: 'dice', cards: e.cards, winner: e.winner }, i); return;
          case 'fireOut': push({ kind: 'fireOut', seat: e.seat, card: e.card, fires: e.fires }, i); return;
          case 'flagSet': {
            if (e.flag === 'noReact') st.noReact[e.ship] = true;
            if (absorb(e, i, ['card'])) return;
            push({ kind: 'status', ship: e.ship, flag: e.flag }, i);
            return;
          }
          case 'turnFlag': {
            if (e.flag === 'noReactTeam') st.noReactSide[e.side] = true;
            if (absorb(e, i, ['card'])) return;
            push({ kind: 'status', side: e.side, flag: e.flag, n: e.n }, i);
            return;
          }
          case 'limitRaised': if (absorb(e, i, ['card', 'ability'])) return; push({ kind: 'status', ship: e.ship, flag: 'limit', n: e.n }, i); return;
          case 'gameOver': push({ kind: 'end', winner: e.winner, reason: e.reason }, i); return;
          case 'conceded': push({ kind: 'end', winner: null, reason: 'concede', side: e.side }, i); return;
          default:
            if (QUIET.has(e.type)) { quiet.push(i); return; }
            push({ kind: 'fallback', type: e.type }, i);
        }
      });
      closeShot();
      // Порох и Души, которые никто не «забрал» (стоимость неизвестного действия) — отдельные клипы.
      for (const c of costs) push({ kind: c.reason === 'souls' ? 'souls' : 'powder', side: c.side, ship: c.ship, n: -c.amount, reason: c.reason }, c.i);
      out.quiet = quiet;
      return out;
    }
    return { feed, state: st };
  }

  /* -------------------------------------------------------------------------------------------------
     Отображаемое состояние: что показывают планшеты и Трюмы. Применяется по событиям (видимым игроку).
     Пока клип не дошёл до попадания, планшеты показывают состояние ДО его событий; после клипа —
     применяются события клипа. Когда очередь пуста, результат равен настоящему состоянию (проверено).
     ------------------------------------------------------------------------------------------------- */
  function applyVisible(d, e, rules) {
    const sh = (c) => d.ships[c];
    switch (e.type) {
      case 'damage': { const s = sh(e.ship); s.tracks[e.track] = Math.max(0, s.tracks[e.track] - e.amount); s.tracks.hull = Math.max(0, s.tracks.hull - e.toHull); break; }
      case 'restored': sh(e.ship).tracks[e.track] += e.amount; break;
      case 'sunk': { const s = sh(e.ship); s.sunk = true; s.fires = 0; s.submerged = false; s.legend = false; s.tracks.hull = 0; break; } // «Корабль в бутылке» топит без события damage
      case 'jackEscaped': { const s = sh(e.ship); s.tracks.hull = Math.min(rules.jackHull, rules.startHull[e.ship]); s.legend = false; break; }
      case 'swapped': {
        if (e.ships.length === 2) { const a = sh(e.ships[0]), b = sh(e.ships[1]); const p = a.pos; a.pos = b.pos; b.pos = p; }
        else { const a = sh(e.ships[0]); a.pos = 1 - a.pos; }
        break;
      }
      case 'dived': sh(e.ship).submerged = true; sh(e.ship).fires = 0; break;
      case 'surfaced': sh(e.ship).submerged = false; break;
      case 'fireAdded': sh(e.ship).fires = e.fires; break;
      case 'fireOut': sh(e.seat).fires = e.fires; break;
      case 'powderGained': d.powder[e.side] += e.amount; break;
      case 'powderSpent': case 'powderLost': d.powder[e.side] -= e.amount; break;
      case 'soulsGained': sh(e.ship).souls += e.amount; break;
      case 'soulsSpent': sh(e.ship).souls -= e.amount; break;
      case 'soulsUsed': sh(e.ship).souls -= 1; break;
      case 'legendPlayed': sh(e.seat).legend = false; break;
      case 'seaRevealed': d.sea = e.card; break;
      case 'roundStarted': d.round = e.round; break;
      case 'turnStarted': d.active = e.side; break;
      default: break;
    }
    return d;
  }

  const api = { KIND_BY_TRACK, layoutShots, createPlanner, applyVisible, termSrc, ABSORB, QUIET };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.FX = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
