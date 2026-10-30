// «Админка → Лаборатория» (docs/TZ.md, «Лаборатория баланса»; docs/tasks/E9b): two data sets A and B (the main data or
// presets), each with who moves first and features turned off; common games, seed and variant; «Запустить». The
// results of A and B side by side; differences with p < 0.05 are highlighted (the z-test of two shares for wins,
// Welch's t-test for means).
import { useEffect, useRef, useState } from 'react';
import { DataError, loadGameData } from '../../engine/data';
import {
  DEFAULT_LAB,
  FEATURES,
  SIDES,
  USE_KEYS,
  percentile,
  stat,
  twoProportionP,
  welchP,
  wilson,
  type Feature,
  type LabResult,
  type LabSettings,
  type Stat,
} from '../../engine/sim/lab';
import type { Variant } from '../../engine/state';
import type { Side } from '../../engine/types';
import { MAIN, MAIN_NAME, type Preset, type RawData } from '../presets';
import { startLab, workerCount, type LabRun } from './labPool';
import { fmt } from './model';

const SIDE_NAME: Record<Side, string> = { ПИРАТЫ: 'Пираты', КОМПАНИЯ: 'Компания' };
const VARIANTS: { v: Variant; label: string }[] = [
  { v: 'standard', label: 'Обычная' },
  { v: 'first', label: 'Первая партия' },
  { v: 'quick', label: 'Быстрый бой' },
];
const P = 0.05;

interface SetChoice {
  data: string;
  first: Side;
  off: Feature[];
}

interface Done {
  names: [string, string];
  sets: [SetChoice, SetChoice];
  common: { games: number; seed: number; variant: Variant };
  results: [LabResult, LabResult];
  copies: [Record<string, number>, Record<string, number>];
  /** Short names of the ships by code: «Месть». */
  nicks: Record<string, string>;
  seconds: number;
  workers: number;
}

export function LabTab({ presets, main }: { presets: Preset[]; main: RawData }) {
  const [sets, setSets] = useState<[SetChoice, SetChoice]>([
    { data: MAIN, first: 'ПИРАТЫ', off: [] },
    { data: MAIN, first: 'ПИРАТЫ', off: [] },
  ]);
  const [gamesText, setGamesText] = useState(String(DEFAULT_LAB.games));
  const [seedText, setSeedText] = useState(String(DEFAULT_LAB.seed));
  const [variant, setVariant] = useState<Variant>('standard');
  const [run, setRun] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const current = useRef<LabRun | null>(null);
  useEffect(() => () => current.current?.cancel(), []);

  const games = Number(gamesText);
  const seed = Number(seedText);
  const gamesBad = !Number.isInteger(games) || games < 100 || games > 5000;
  const seedBad = !Number.isInteger(seed) || seed < 0;
  const rawOf = (id: string): RawData | null => (id === MAIN ? main : (presets.find((p) => p.id === id)?.data ?? null));
  const nameOf = (id: string) => (id === MAIN ? MAIN_NAME : (presets.find((p) => p.id === id)?.name ?? '—'));

  const launch = async (chosen: [SetChoice, SetChoice]) => {
    if (run || gamesBad || seedBad) return;
    setError(null);
    const common = { games, seed, variant };
    const raws = chosen.map((c) => rawOf(c.data));
    const copies: Record<string, number>[] = [];
    const nicks: Record<string, string> = {};
    for (const [i, raw] of raws.entries()) {
      try {
        const data = loadGameData(raw);
        const c: Record<string, number> = {};
        for (const ship of data.ships) {
          nicks[ship.code] = ship.nick;
          for (const card of data.decks[ship.code]) c[`card:${ship.code}|${card.name}`] = (c[`card:${ship.code}|${card.name}`] ?? 0) + card.copies;
        }
        copies.push(c);
      } catch (e) {
        setError(`Набор ${i === 0 ? 'A' : 'B'} «${nameOf(chosen[i].data)}» с ошибками: ${e instanceof DataError ? e.problems.slice(0, 3).join('; ') : String(e)}`);
        return;
      }
    }
    const settings = chosen.map((c): LabSettings => ({ ...common, first: c.first, off: c.off }));
    const started = performance.now();
    setRun({ done: 0, total: games * 2 });
    const r = startLab(
      raws.map((raw, i) => ({ raw: raw!, settings: settings[i] })),
      (d, total) => setRun({ done: d, total }),
    );
    current.current = r;
    try {
      const results = await r.result;
      if (results) {
        setDone({
          names: [nameOf(chosen[0].data), nameOf(chosen[1].data)],
          sets: chosen,
          common,
          results: [results[0], results[1]],
          copies: [copies[0], copies[1]],
          nicks,
          seconds: (performance.now() - started) / 1000,
          workers: workerCount(),
        });
      }
    } catch (e) {
      setError(`Лаборатория остановилась: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      current.current = null;
      setRun(null);
    }
  };

  const setOne = (i: 0 | 1, patch: Partial<SetChoice>) => setSets((s) => (i === 0 ? [{ ...s[0], ...patch }, s[1]] : [s[0], { ...s[1], ...patch }]));
  const firstVsFirst = () => {
    const both: [SetChoice, SetChoice] = [
      { ...sets[0], first: 'ПИРАТЫ' },
      { ...sets[0], first: 'КОМПАНИЯ' },
    ];
    setSets(both);
    void launch(both);
  };

  return (
    <>
      <section className="admin-panel admin-lab-setup" data-testid="lab">
        <div className="admin-lab-sets">
          {([0, 1] as const).map((i) => (
            <fieldset key={i} className="admin-lab-set" disabled={!!run}>
              <legend>Набор {i === 0 ? 'A' : 'B'}</legend>
              <label className="admin-form">
                <span>Данные</span>
                <select value={sets[i].data} onChange={(e) => setOne(i, { data: e.target.value })} data-testid={`lab-data-${i}`}>
                  <option value={MAIN}>{MAIN_NAME}</option>
                  {presets.map((p) => (
                    <option key={p.id} value={p.id}>
                      Пресет «{p.name}»
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-form">
                <span>Кто ходит первым</span>
                <select value={sets[i].first} onChange={(e) => setOne(i, { first: e.target.value as Side })} data-testid={`lab-first-${i}`}>
                  <option value="ПИРАТЫ">Пираты</option>
                  <option value="КОМПАНИЯ">Компания</option>
                </select>
              </label>
              <details className="admin-lab-off">
                <summary>Отключить особенности{sets[i].off.length > 0 ? ` (${sets[i].off.length})` : ''}</summary>
                {FEATURES.map((f) => (
                  <label key={f.id} className="admin-check">
                    <input
                      type="checkbox"
                      checked={sets[i].off.includes(f.id)}
                      onChange={(e) => setOne(i, { off: e.target.checked ? [...sets[i].off, f.id] : sets[i].off.filter((x) => x !== f.id) })}
                    />
                    {f.name}
                  </label>
                ))}
              </details>
            </fieldset>
          ))}
        </div>
        <div className="admin-lab-common">
          <label className="admin-form">
            <span>Партий в каждом наборе</span>
            <input inputMode="numeric" value={gamesText} aria-invalid={gamesBad || undefined} disabled={!!run} onChange={(e) => setGamesText(e.target.value)} data-testid="lab-games" />
          </label>
          <label className="admin-form">
            <span>Seed</span>
            <input inputMode="numeric" value={seedText} aria-invalid={seedBad || undefined} disabled={!!run} onChange={(e) => setSeedText(e.target.value)} data-testid="lab-seed" />
          </label>
          <label className="admin-form">
            <span>Вариант</span>
            <select value={variant} disabled={!!run} onChange={(e) => setVariant(e.target.value as Variant)}>
              {VARIANTS.map((v) => (
                <option key={v.v} value={v.v}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {gamesBad && <p className="admin-problem">Партий — целое число от 100 до 5000.</p>}
        {seedBad && <p className="admin-problem">Seed — целое число ≥ 0.</p>}
        <div className="admin-actions">
          {run ? (
            <>
              <progress max={run.total} value={run.done} data-testid="lab-progress" />
              <span className="admin-count">
                {run.done} из {run.total} партий
              </span>
              <button className="admin-btn" onClick={() => current.current?.cancel()} data-testid="lab-cancel">
                Отмена
              </button>
            </>
          ) : (
            <>
              <button className="admin-btn primary" disabled={gamesBad || seedBad} onClick={() => launch(sets)} data-testid="lab-run">
                Запустить
              </button>
              <button className="admin-btn admin-wide" disabled={gamesBad || seedBad} onClick={firstVsFirst} data-testid="lab-first-vs" title="A и B — данные набора A">
                Пираты первыми / Компания первой
              </button>
            </>
          )}
        </div>
        <p className="admin-note">
          «Пираты первыми / Компания первой» — один и тот же набор A дважды: Пираты ходят первыми и Компания ходит первой. Если разница в победах не больше 3
          п. п., первый ход сможет решать монета (отдельная настройка — потом).
        </p>
        {error && <p className="admin-error">{error}</p>}
      </section>
      {done && <LabResults done={done} />}
    </>
  );
}

// ——— Results ———

interface Row {
  label: string;
  a: string;
  b: string;
  diff: string;
  p: number | null;
}

const sign = (x: number, digits: number) => (Number(x.toFixed(digits)) > 0 ? '+' : '') + fmt(x, digits);

/** A row of means: the numbers with the unit, the difference B − A, Welch's p. */
function meanRow(label: string, a: Stat, b: Stat, unit: string, digits = 2): Row {
  return {
    label,
    a: `${fmt(a.mean, digits)}${unit}`,
    b: `${fmt(b.mean, digits)}${unit}`,
    diff: `${sign(b.mean - a.mean, digits)}${unit}`,
    p: welchP(a, b),
  };
}

const scaled = (s: Stat, k: number): Stat => ({ mean: s.mean * k, variance: s.variance * k * k, n: s.n });

function LabResults({ done }: { done: Done }) {
  const [ra, rb] = done.results;
  const n = [ra.games, rb.games];
  const both = (key: string): [Stat, Stat] => [stat(ra, key), stat(rb, key)];

  const wins: Row[] = (['ПИРАТЫ', 'КОМПАНИЯ', 'НИЧЬЯ'] as const).map((w) => {
    const k = [ra.wins[w], rb.wins[w]];
    const ci = (i: number) => wilson(k[i], n[i]).map((x) => fmt(x * 100, 1)).join('–');
    return {
      label: w === 'НИЧЬЯ' ? 'Ничьи' : `Победы: ${SIDE_NAME[w]}`,
      a: `${fmt((k[0] / n[0]) * 100, 1)} % (${ci(0)})`,
      b: `${fmt((k[1] / n[1]) * 100, 1)} % (${ci(1)})`,
      diff: `${sign(((k[1] / n[1]) - k[0] / n[0]) * 100, 1)} п. п.`,
      p: twoProportionP(k[0], n[0], k[1], n[1]),
    };
  });
  const rounds: Row[] = [
    meanRow('Раундов, среднее', ...both('rounds'), '', 2),
    {
      label: 'Раундов, 10–90 %',
      a: `${percentile(ra.rounds, 0.1)}–${percentile(ra.rounds, 0.9)}`,
      b: `${percentile(rb.rounds, 0.1)}–${percentile(rb.rounds, 0.9)}`,
      diff: '',
      p: null,
    },
  ];
  const powder = (side: Side): Row[] => [
    meanRow('доход', ...both(`${side}.income`), ' П'),
    meanRow('на Залпы', ...both(`${side}.volley`), ' П'),
    meanRow('на карты', ...both(`${side}.cards`), ' П'),
    meanRow('на Реакции', ...both(`${side}.reactions`), ' П'),
    meanRow('на особенности', ...both(`${side}.abilities`), ' П'),
    meanRow('сгорело сверх Трюма', ...both(`${side}.wasted`), ' П'),
    meanRow('ходов с пустым Трюмом', ...both(`${side}.emptyHold`), ' %', 1),
    meanRow('карт сыграно за ход', ...both(`${side}.cardsPlayed`), ''),
  ];
  const SOURCES: [string, string][] = [
    ['volley', 'от Залпов'],
    ['card', 'от карт'],
    ['reaction', 'от Реакций'],
    ['legend', 'от Легенд'],
    ['fire', 'от Пожаров'],
    ['sea', 'от моря'],
    ['ability', 'от особенностей'],
    ['other', 'прочее'],
  ];
  const damage = (side: Side): Row[] =>
    SOURCES.filter(([k]) => ra.m[`${side}.dmg:${k}`] || rb.m[`${side}.dmg:${k}`]).map(([k, label]) => meanRow(label, ...both(`${side}.dmg:${k}`), ''));
  const USE_NAMES: Record<string, string> = {
    volleys: 'Залпов',
    regroups: 'Перестроений',
    sword: 'Меч Тритона',
    heart: 'Сердце Дейви Джонса',
    dived: 'Погружений',
    treasury: 'Казна Компании',
    soulsSpent: 'Душ потрачено',
    firesOut: 'Пожаров потушено',
    jackEscape: 'Джек ускользает',
  };
  const uses = (side: Side): Row[] =>
    USE_KEYS.filter((k) => ra.m[`${side}.${k}`] || rb.m[`${side}.${k}`]).map((k) => meanRow(USE_NAMES[k] ?? k, ...both(`${side}.${k}`), ''));
  const legendKeys = [...new Set([...Object.keys(ra.m), ...Object.keys(rb.m)].filter((k) => k.startsWith('legend:')))].sort();
  const legends: Row[] = legendKeys.map((k) => meanRow(`«${k.slice(7)}»`, ...both(k), ''));

  const cardKeys = [...new Set([...Object.keys(done.copies[0]), ...Object.keys(done.copies[1])])];
  const perCopy = (r: LabResult, i: number, key: string) => scaled(stat(r, key), 1 / Math.max(1, done.copies[i][key] ?? 1));
  const cardRows = cardKeys
    .map((key) => {
      const [deck, name] = key.slice(5).split('|');
      return { key, deck, name, row: meanRow(`${name} · ${done.nicks[deck] ?? deck}`, perCopy(ra, 0, key), perCopy(rb, 1, key), '', 2) };
    })
    .sort((x, y) => x.key.localeCompare(y.key, 'ru'));
  const ranked = (i: number) => cardKeys.map((key) => ({ key, v: perCopy(done.results[i], i, key).mean })).sort((x, y) => y.v - x.v);
  const label = (key: string) => {
    const [deck, name] = key.slice(5).split('|');
    return `${name} · ${done.nicks[deck] ?? deck}`;
  };

  const head = (
    <tr>
      <th>Показатель</th>
      <th>A</th>
      <th>B</th>
      <th>B − A</th>
    </tr>
  );
  const table = (title: string, rows: Row[], note?: string) =>
    rows.length > 0 && (
      <section className="admin-panel admin-lab-block">
        <h3>{title}</h3>
        <div className="admin-scroll">
          <table className="admin-table admin-lab-table">
            <thead>{head}</thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className={r.p !== null && r.p < P ? 'sig' : undefined} title={r.p !== null ? `p = ${r.p < 0.001 ? '< 0,001' : fmt(r.p, 3)}` : undefined}>
                  <td>{r.label}</td>
                  <td>{r.a}</td>
                  <td>{r.b}</td>
                  <td>{r.diff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {note && <p className="admin-note">{note}</p>}
      </section>
    );
  const setText = (i: 0 | 1) => {
    const s = done.sets[i];
    const off = s.off.map((id) => FEATURES.find((f) => f.id === id)?.name ?? id);
    return `«${done.names[i]}», первыми ходят ${SIDE_NAME[s.first]}${off.length ? `, без: ${off.join(', ')}` : ''}`;
  };
  const sigCount = [...wins, ...rounds].filter((r) => r.p !== null && r.p < P).length;

  return (
    <div className="admin-lab-results" data-testid="lab-results">
      <section className="admin-panel">
        <h3>Результаты</h3>
        <p>
          <b>A</b>: {setText(0)}
          <br />
          <b>B</b>: {setText(1)}
        </p>
        <p className="admin-note" data-testid="lab-time">
          {done.common.games} + {done.common.games} партий, seed {done.common.seed}, вариант «{VARIANTS.find((v) => v.v === done.common.variant)?.label}»: {fmt(done.seconds, 1)} с,
          воркеров: {done.workers}. Подсвечены различия с p &lt; 0,05 (победы — z-тест двух долей, средние — t-тест Уэлча); p — в подсказке строки.
          {sigCount === 0 ? ' Значимых различий в победах и длине партии нет.' : ''}
        </p>
      </section>
      {table('Победы (95 % доверительный интервал Уилсона)', wins)}
      {table('Длина партии', rounds)}
      {SIDES.map((side) => table(`Порох за ход: ${SIDE_NAME[side]}`, powder(side), side === 'ПИРАТЫ' ? 'Среднее по партиям: в каждой партии — Порох за ход команды.' : undefined))}
      {SIDES.map((side) => table(`Урон по кораблям: ${SIDE_NAME[side]}, за партию`, damage(side), 'Урон, который получили корабли команды, по источнику.'))}
      {table('Легенды, розыгрышей за партию', legends)}
      {SIDES.map((side) => table(`Особенности: ${SIDE_NAME[side]}, за партию`, uses(side)))}
      <section className="admin-panel admin-lab-block">
        <h3>Карты: розыгрышей за партию на копию</h3>
        <div className="admin-lab-ranks">
          {([0, 1] as const).map((i) => (
            <div key={i}>
              <h4>{i === 0 ? 'A' : 'B'}: самые частые</h4>
              <ol>
                {ranked(i)
                  .slice(0, 8)
                  .map((x) => (
                    <li key={x.key}>
                      {label(x.key)} — {fmt(x.v, 2)}
                    </li>
                  ))}
              </ol>
              <h4>{i === 0 ? 'A' : 'B'}: «мёртвые»</h4>
              <ol>
                {ranked(i)
                  .slice(-8)
                  .reverse()
                  .map((x) => (
                    <li key={x.key}>
                      {label(x.key)} — {fmt(x.v, 2)}
                    </li>
                  ))}
              </ol>
            </div>
          ))}
        </div>
        <details>
          <summary>Все карты</summary>
          <div className="admin-scroll">
            <table className="admin-table admin-lab-table">
              <thead>{head}</thead>
              <tbody>
                {cardRows.map(({ key, row }) => (
                  <tr key={key} className={row.p !== null && row.p < P ? 'sig' : undefined}>
                    <td>{row.label}</td>
                    <td>{row.a}</td>
                    <td>{row.b}</td>
                    <td>{row.diff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>
    </div>
  );
}
