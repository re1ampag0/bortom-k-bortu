// Проверка эталона planfx.js на событиях настоящего движка.
// Запуск: node validate.cjs <games.json> <game-data.json>
// games.json делает tools/dump-events.ts (партии ботов, события глазами каждой команды, состояние после действия).
const fs = require('fs');
const FX = require('./planfx.js');
const games = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const D = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const cards = {}, seaKeys = {};
for (const ship of D.ships) { let n = 0; for (const c of D.decks[ship.code]) for (let k = 0; k < c.copies; k++) cards[`${ship.code}-${String(++n).padStart(2, '0')}`] = c; cards[`${ship.code}-Л`] = D.legends[ship.code]; }
D.sea.forEach((c, i) => { seaKeys[`С-${String(i + 1).padStart(2, '0')}`] = c.key; });
const ships = Object.fromEntries(D.ships.map((s) => [s.code, { side: s.side }]));
const rules = { jackHull: D.rules.jackHull, startHull: Object.fromEntries(D.ships.map((s) => [s.code, s.hull])) };
const pick = (s) => ({ round: s.round, active: s.active, sea: s.sea, powder: { ...s.powder }, ships: Object.fromEntries(Object.entries(s.ships).map(([k, x]) => [k, { pos: x.pos, tracks: { ...x.tracks }, fires: x.fires, sunk: x.sunk, submerged: x.submerged, souls: x.souls, legend: x.legend }])) });
const stats = { steps: 0, events: 0, clips: {}, fallback: {}, coverageErr: 0, shotErr: 0, displayErr: 0, shots: 0, outs: {}, kinds: {} };
const examples = [];
for (const g of games) for (const side of ['P', 'C']) {
  const viewer = side === 'P' ? ['Ж', 'М'] : ['И', 'Г'];
  const planner = FX.createPlanner({ cards, ships, viewer, sea: g.start.sea, seaKey: (c) => seaKeys[c] });
  let d = pick(g.start);
  for (const st of g.steps) {
    if (st.n === 0) continue;
    const ev = st[side];
    stats.steps++; stats.events += ev.length;
    const clips = planner.feed(ev, st.a);
    const seen = new Array(ev.length).fill(0);
    for (const c of clips) { for (const i of c.ev) seen[i]++; stats.clips[c.kind] = (stats.clips[c.kind] || 0) + 1; if (c.kind === 'fallback') stats.fallback[c.type] = (stats.fallback[c.type] || 0) + 1; }
    for (const i of clips.quiet) seen[i]++;
    if (seen.some((x) => x !== 1)) { stats.coverageErr++; if (examples.length < 6) examples.push({ why: 'coverage', seed: g.seed, n: st.n, side, ev: ev.map((e, i) => `${seen[i]} ${e.type}`), clips: clips.map((c) => c.kind) }); }
    for (const c of clips) if (c.kind === 'shot') {
      stats.shots++;
      const u = (f) => c.shots.filter(f).reduce((n, b) => n + b.units, 0);
      for (const b of c.shots) { stats.outs[b.out] = (stats.outs[b.out] || 0) + b.units; stats.kinds[b.kind] = (stats.kinds[b.kind] || 0) + b.units; }
      const ok = u((b) => ['hit', 'overkill', 'moon'].includes(b.out)) === c.damage && u((b) => b.out === 'hit' && b.to === 'track') === c.amount && u((b) => b.out === 'hit' && b.to === 'hull') === c.toHull;
      if (!ok) { stats.shotErr++; if (examples.length < 12) examples.push({ why: 'shot', seed: g.seed, n: st.n, side, damage: c.damage, amount: c.amount, toHull: c.toHull, terms: c.terms, shots: c.shots.map((b) => `${b.kind}:${b.out}:${b.to}:${b.units}`) }); }
    }
    for (const e of ev) FX.applyVisible(d, e, rules);
    const want = pick(st.after);
    if (JSON.stringify(d) !== JSON.stringify(want)) {
      stats.displayErr++;
      if (examples.length < 16) { const diff = []; for (const k of Object.keys(want.ships)) for (const f of Object.keys(want.ships[k])) if (JSON.stringify(want.ships[k][f]) !== JSON.stringify(d.ships[k][f])) diff.push(`${k}.${f}: ${JSON.stringify(d.ships[k][f])} ≠ ${JSON.stringify(want.ships[k][f])}`); for (const f of ['round', 'active', 'sea']) if (want[f] !== d[f]) diff.push(`${f}: ${d[f]} ≠ ${want[f]}`); if (JSON.stringify(want.powder) !== JSON.stringify(d.powder)) diff.push(`powder ${JSON.stringify(d.powder)} ≠ ${JSON.stringify(want.powder)}`); examples.push({ why: 'display', seed: g.seed, n: st.n, side, diff, ev: ev.map((e) => e.type) }); }
      d = pick(st.after);
    }
  }
}
console.log(JSON.stringify({ ...stats }, null, 0));
for (const x of examples) console.log(JSON.stringify(x));
const fail = stats.coverageErr + stats.shotErr + stats.displayErr;
console.log(fail ? `ОШИБОК: ${fail}` : 'ВСЁ СОВПАЛО');
process.exit(fail ? 1 : 0);
