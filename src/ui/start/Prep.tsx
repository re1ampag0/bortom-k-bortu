// The preparation screen after «Против ботов» or «Вдвоём»: the side (or the coin), «Дополнительно» folded, «Начать».
import { useEffect, useRef, useState } from 'react';
import { parseRecord, type Controller, type MatchRecord, type MatchSetup } from '../../engine/match';
import { createRng } from '../../engine/rng';
import type { Variant } from '../../engine/state';
import type { Side } from '../../engine/types';
import { SIDE_LABEL } from '../game/text';
import { loadSettings, storeSettings } from '../storage';
import { seedFrom, urlSeedText } from '../seed';
import { Coin } from './Coin';
import { instantUrl, reducedMotion } from './motion';
import { Rhumbs } from './Rhumbs';
import type { Mode } from './Start';

export interface StartRequest {
  setup: MatchSetup;
  /** The side's verdict, shown on the placement screen. */
  note: string;
}

type Pick = Side | 'coin';
const COIN_MS = 1500;
const other = (side: Side): Side => (side === 'ПИРАТЫ' ? 'КОМПАНИЯ' : 'ПИРАТЫ');

/** The coin of a seed: the same seed — the same side (docs/TZ.md, «Детали», п. 6). */
export const coinOf = (seed: number): Side => (createRng(seed ^ 0x5bd1e995).int(2) === 0 ? 'ПИРАТЫ' : 'КОМПАНИЯ');

export function Prep({
  mode,
  onStart,
  onResume,
  onBack,
}: {
  mode: Mode;
  onStart: (req: StartRequest) => void;
  onResume: (record: MatchRecord) => void;
  onBack: () => void;
}) {
  const [pick, setPick] = useState<Pick>('coin');
  // The seed is fixed when the screen opens: the coin and the game use the same one.
  const [seedText, setSeedText] = useState(urlSeedText);
  const [seed, setSeed] = useState(() => seedFrom(urlSeedText()));
  const [coin, setCoin] = useState<{ side: Side; spinning: boolean } | null>(null);
  const [more, setMore] = useState(false);
  const [variant, setVariant] = useState<Variant>('standard');
  const urlHints = new URLSearchParams(location.search).get('hints');
  const [hintsChoice, setHintsChoice] = useState<boolean | null>(() => (urlHints === null ? loadSettings().hints : urlHints === '1'));
  const hints = hintsChoice ?? variant === 'first';
  const setHints = (v: boolean) => {
    setHintsChoice(v);
    storeSettings({ ...loadSettings(), hints: v });
  };
  const [sea, setSea] = useState(true);
  const [legends, setLegends] = useState(true);
  const [openHands, setOpenHands] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const changeSeed = (text: string) => {
    setSeedText(text);
    setSeed(seedFrom(text));
    setCoin(null);
  };

  /** Throws the coin; `then` gets the side after the spin (at once without motion). */
  const toss = (then?: (side: Side) => void) => {
    const side = coinOf(seed);
    const still = instantUrl() || reducedMotion();
    setCoin({ side, spinning: !still });
    if (timer.current) clearTimeout(timer.current);
    const done = () => {
      setCoin({ side, spinning: false });
      then?.(side);
    };
    if (still) done();
    else timer.current = setTimeout(done, COIN_MS);
  };

  const start = (side: Side, byCoin: boolean) => {
    const game = { seed, variant, sea, legends };
    const lead = byCoin ? 'Жребий: ' : '';
    if (mode === 'bots') {
      onStart({
        setup: { game, players: { [side]: 'human', [other(side)]: 'bot' } as Record<Side, Controller>, openHands, hints },
        note: `${lead}вы играете за ${SIDE_LABEL[side].acc}. Первыми ходят Пираты.`,
      });
    } else {
      onStart({
        setup: { game, players: { ПИРАТЫ: 'human', КОМПАНИЯ: 'human' }, openHands, hints },
        note: `${lead}кто держит устройство — за ${SIDE_LABEL[side].acc}, второй игрок — за ${SIDE_LABEL[other(side)].acc}. Первыми ходят Пираты.`,
      });
    }
  };
  const begin = () => {
    if (coin?.spinning) return;
    if (pick !== 'coin') start(pick, false);
    else if (coin) start(coin.side, true);
    else toss((side) => start(side, true));
  };
  const load = async (f: File) => {
    try {
      onResume(parseRecord(JSON.parse(await f.text())));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const who = mode === 'bots' ? 'Вы играете за' : 'Кто держит устройство, играет за';
  const verdict = coin && !coin.spinning ? `Жребий: ${mode === 'bots' ? 'вы' : 'держащий устройство'} — ${SIDE_LABEL[coin.side].name}` : coin ? 'Монета крутится…' : 'Монета решит, кто за какую сторону';

  return (
    <div className="start-page">
      <Rhumbs />
      <main className="prep" data-testid="prep">
        <div className="prep-card">
          <button className="link prep-back" onClick={onBack}>
            ← Назад
          </button>
          <h1 className="prep-title">{mode === 'bots' ? 'Против ботов' : 'Вдвоём на одном экране'}</h1>
          <p className="prep-sub">{mode === 'bots' ? 'Вы ведёте одну команду, боты — другую.' : 'Каждый за свою команду; между ходами — заставка «Передайте устройство».'} Первыми всегда ходят Пираты.</p>

          <p className="prep-label">{who}</p>
          <div className="side-pick" role="radiogroup" aria-label={who}>
            {(['ПИРАТЫ', 'КОМПАНИЯ'] as Side[]).map((side) => (
              <button
                key={side}
                role="radio"
                aria-checked={pick === side}
                className={`side-btn ${side === 'ПИРАТЫ' ? 'pirates' : 'company'} ${pick === side ? 'on' : ''}`}
                data-testid={side === 'ПИРАТЫ' ? 'pick-pirates' : 'pick-company'}
                onClick={() => setPick(side)}
              >
                {SIDE_LABEL[side].name}
              </button>
            ))}
            <button
              role="radio"
              aria-checked={pick === 'coin'}
              className={`side-btn coin-btn ${pick === 'coin' ? 'on' : ''}`}
              data-testid="pick-coin"
              onClick={() => {
                setPick('coin');
                if (!coin?.spinning) toss();
              }}
            >
              Жребий
            </button>
          </div>
          {pick === 'coin' && (
            <div className="coin-row" aria-live="polite">
              <Coin face={coin?.side ?? null} spinning={!!coin?.spinning} />
              <span data-testid="coin-verdict">{verdict}</span>
            </div>
          )}

          <section className="prep-more">
            <button className="link" onClick={() => setMore(!more)} aria-expanded={more}>
              {more ? '▾' : '▸'} Дополнительно
            </button>
            {more && (
              <div className="more-body">
                <label className="row">
                  <span>Вариант</span>
                  <select
                    value={variant}
                    onChange={(e) => {
                      const v = e.target.value as Variant;
                      setVariant(v);
                      // «Первая партия» turns the hints on by default; the box can turn them off.
                      if (v === 'first') setHintsChoice(true);
                      // «Первая партия» plays without the sea and the Legends (RULES.md 20.1); the boxes can turn them back on.
                      setSea(v !== 'first');
                      setLegends(v !== 'first');
                    }}
                  >
                    <option value="standard">обычная партия</option>
                    <option value="first">«Первая партия»</option>
                    <option value="quick">«Быстрый бой»</option>
                  </select>
                </label>
                <label className="row check">
                  <input type="checkbox" checked={sea} onChange={(e) => setSea(e.target.checked)} /> Колода моря
                </label>
                <label className="row check">
                  <input type="checkbox" checked={legends} onChange={(e) => setLegends(e.target.checked)} /> Легенды
                </label>
                <label className="row check">
                  <input type="checkbox" checked={hints} onChange={(e) => setHints(e.target.checked)} /> Подсказки (урон Зарядов и на
                  целях, «4 → 2» на Реакциях в руке, зелёный «Ход окончен», «Залп не дан…»); без них — как за столом
                </label>
                <label className="row check">
                  <input type="checkbox" checked={openHands} onChange={(e) => setOpenHands(e.target.checked)} /> Открытые руки (все
                  руки видны, без заставок)
                </label>
                <label className="row">
                  <span>Seed</span>
                  <input inputMode="numeric" placeholder="случайный" value={seedText} onChange={(e) => changeSeed(e.target.value)} />
                </label>
                <div className="row buttons">
                  <button className="btn" onClick={() => file.current?.click()}>
                    Загрузить партию (.json)
                  </button>
                  <input ref={file} type="file" accept=".json,application/json" hidden onChange={(e) => e.target.files?.[0] && load(e.target.files[0])} />
                </div>
                {error && <p className="error">{error}</p>}
              </div>
            )}
          </section>

          <button className="prep-start" data-testid="prep-start" onClick={begin} disabled={!!coin?.spinning}>
            Начать
          </button>
        </div>
      </main>
    </div>
  );
}
