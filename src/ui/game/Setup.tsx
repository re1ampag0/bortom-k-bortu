// The setup screen: three quick starts, the rest folded into «Дополнительно» (docs/TZ.md, «Детали», п. 5–7).
import { useRef, useState } from 'react';
import type { Variant } from '../../engine/state';
import { parseRecord, replay, type Controller, type MatchRecord, type MatchSetup } from '../../engine/match';
import { createRng } from '../../engine/rng';
import type { GameData, Side } from '../../engine/types';
import { loadNetSaved } from '../../net/ws';
import { loadSave, loadSettings, storeSave, storeSettings, type Speed } from '../storage';
import { SIDE_LABEL, SPEEDS } from './text';

export interface StartRequest {
  setup: MatchSetup;
  /** The coin's verdict, shown on the placement screen. */
  note: string;
}

const newSeed = () => createRng((Date.now() ^ (performance.now() * 1000)) >>> 0).int(2 ** 31 - 1) + 1;

export function Setup({
  data,
  onStart,
  onResume,
  onCards,
  onNet,
}: {
  data: GameData;
  onStart: (req: StartRequest) => void;
  onResume: (record: MatchRecord) => void;
  onCards: () => void;
  onNet: () => void;
}) {
  const netSaved = loadNetSaved();
  const [save, setSave] = useState(() => {
    const record = loadSave();
    if (!record) return null;
    try {
      const state = replay(data, record.setup, record.actions);
      return state.winner ? null : { record, round: state.round };
    } catch {
      return null;
    }
  });
  const [more, setMore] = useState(false);
  const [players, setPlayers] = useState<Record<Side, Controller>>({ ПИРАТЫ: 'human', КОМПАНИЯ: 'bot' });
  const [variant, setVariant] = useState<Variant>('standard');
  // «Подсказки»: off by default (as at the table), on for «Первая партия»; the choice is remembered in the browser.
  // «?hints=1» / «?hints=0» in the address overrides it (for tests).
  const urlHints = new URLSearchParams(location.search).get('hints');
  const [hintsChoice, setHintsChoice] = useState<boolean | null>(() => (urlHints === null ? loadSettings().hints : urlHints === '1'));
  const hints = hintsChoice ?? variant === 'first';
  const setHints = (v: boolean) => {
    setHintsChoice(v);
    storeSettings({ ...loadSettings(), hints: v });
  };  const [sea, setSea] = useState(true);
  const [legends, setLegends] = useState(true);
  const [openHands, setOpenHands] = useState(false);

  // «?seed=N» in the address fixes the seed of the quick starts too (for tests and for repeating a game).
  const [seedText, setSeedText] = useState(() => new URLSearchParams(location.search).get('seed') ?? '');
  const [speed, setSpeed] = useState<Speed>(loadSettings().speed);
  const [error, setError] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  const seed = () => {
    const n = Number(seedText);
    return seedText.trim() !== '' && Number.isInteger(n) && n > 0 ? n : newSeed();
  };
  const quick = (kind: 'bots' | 'duo' | 'match') => {
    const s = seed();
    // The coin (docs/TZ.md, «Детали», п. 6): who plays which side. The Pirates always move first.
    const coin = createRng(s ^ 0x5bd1e995).int(2) === 0 ? 'ПИРАТЫ' : 'КОМПАНИЯ';
    const game = { seed: s, variant: 'standard' as Variant };
    if (kind === 'bots') {
      const human = coin as Side;
      const other: Side = human === 'ПИРАТЫ' ? 'КОМПАНИЯ' : 'ПИРАТЫ';
      onStart({
        setup: { game, players: { [human]: 'human', [other]: 'bot' } as Record<Side, Controller>, openHands: false, hints },
        note: `Жребий: вы играете за ${SIDE_LABEL[human].acc}. Первыми ходят Пираты.`,
      });
    } else if (kind === 'duo') {
      onStart({
        setup: { game, players: { ПИРАТЫ: 'human', КОМПАНИЯ: 'human' }, openHands: false, hints },
        note: `Жребий: кто нажал кнопку — за ${SIDE_LABEL[coin as Side].acc}, второй игрок — за ${SIDE_LABEL[coin === 'ПИРАТЫ' ? 'КОМПАНИЯ' : 'ПИРАТЫ'].acc}. Первыми ходят Пираты.`,
      });
    } else {
      onStart({ setup: { game, players: { ПИРАТЫ: 'bot', КОМПАНИЯ: 'bot' }, openHands: true, hints }, note: '' });
    }
  };
  const custom = () => onStart({ setup: { game: { seed: seed(), variant, sea, legends }, players, openHands, hints }, note: '' });
  const load = async (f: File) => {
    try {
      onResume(parseRecord(JSON.parse(await f.text())));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };
  const changeSpeed = (s: Speed) => {
    setSpeed(s);
    storeSettings({ ...loadSettings(), speed: s });
  };

  return (
    <main className="setup">
      <header className="setup-head">
        <h1>Бортом к борту</h1>
        <p className="muted">Цифровой прототип для тестов правил · данные v{data.version}</p>
      </header>

      {save && (
        <section className="resume" data-testid="resume">
          <span>
            Продолжить партию? Раунд {save.round} · {describeSetup(save.record.setup)}
          </span>
          <button className="btn primary" onClick={() => onResume(save.record)}>
            Продолжить
          </button>
          <button
            className="btn"
            onClick={() => {
              storeSave(null);
              setSave(null);
            }}
          >
            Удалить
          </button>
        </section>
      )}

      {netSaved?.code && (
        <section className="resume" data-testid="net-resume">
          <span>Вы в комнате {netSaved.code} (игра по сети).</span>
          <button className="btn primary" onClick={onNet}>
            Вернуться в комнату
          </button>
        </section>
      )}

      <section className="quick">
        <button className="quick-btn" data-testid="quick-bots" onClick={() => quick('bots')}>
          <b>Против ботов</b>
          <span>Вы ведёте одну команду, боты — другую. Сторону решает жребий.</span>
        </button>
        <button className="quick-btn" data-testid="quick-duo" onClick={() => quick('duo')}>
          <b>Вдвоём на одном экране</b>
          <span>Каждый за свою команду. Между ходами — заставка «Передайте устройство».</span>
        </button>
        <button className="quick-btn" data-testid="quick-match" onClick={() => quick('match')}>
          <b>Матч ботов</b>
          <span>Четыре бота играют, вы смотрите. Руки открыты.</span>
        </button>
        <button className="quick-btn" data-testid="quick-net" onClick={onNet}>
          <b>По сети</b>
          <span>У каждого своё устройство: комната по коду, по Wi-Fi или через сервер.</span>
        </button>
      </section>

      <section className="more">
        <button className="link" onClick={() => setMore(!more)} aria-expanded={more}>
          {more ? '▾' : '▸'} Дополнительно
        </button>
        {more && (
          <div className="more-body">
            {(['ПИРАТЫ', 'КОМПАНИЯ'] as Side[]).map((side) => (
              <label key={side} className="row">
                <span>{SIDE_LABEL[side].name}</span>
                <select
                  value={players[side]}
                  onChange={(e) => setPlayers({ ...players, [side]: e.target.value as Controller })}
                >
                  <option value="human">человек</option>
                  <option value="bot">бот</option>
                </select>
              </label>
            ))}
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
              <input type="checkbox" checked={openHands} onChange={(e) => setOpenHands(e.target.checked)} /> Открытые руки
              (все руки видны, без заставок)
            </label>
            <label className="row check">
              <input type="checkbox" checked={hints} onChange={(e) => setHints(e.target.checked)} /> Подсказки (урон Зарядов и на
              целях, «4 → 2» у Реакций, зелёный «Ход окончен», «Залп не дан…»); без них — как за столом
            </label>
            <label className="row">
              <span>Seed</span>
              <input
                inputMode="numeric"
                placeholder="случайный"
                value={seedText}
                onChange={(e) => setSeedText(e.target.value)}
              />
            </label>
            <label className="row">
              <span>Скорость ботов</span>
              <select value={speed} onChange={(e) => changeSpeed(e.target.value as Speed)}>
                {Object.entries(SPEEDS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="row buttons">
              <button className="btn primary" onClick={custom}>
                Начать с этими настройками
              </button>
              <button className="btn" onClick={() => file.current?.click()}>
                Загрузить партию (.json)
              </button>
              <input
                ref={file}
                type="file"
                accept=".json,application/json"
                hidden
                onChange={(e) => e.target.files?.[0] && load(e.target.files[0])}
              />
            </div>
            {error && <p className="error">{error}</p>}
          </div>
        )}
      </section>

      <footer className="setup-foot">
        <button className="link" onClick={onCards}>
          Все карты и корабли
        </button>
      </footer>
    </main>
  );
}

function describeSetup(setup: MatchSetup): string {
  const p = setup.players;
  if (p.ПИРАТЫ === 'bot' && p.КОМПАНИЯ === 'bot') return 'матч ботов';
  if (p.ПИРАТЫ === 'human' && p.КОМПАНИЯ === 'human') return 'вдвоём';
  return `вы за ${SIDE_LABEL[p.ПИРАТЫ === 'human' ? 'ПИРАТЫ' : 'КОМПАНИЯ'].acc} против ботов`;
}
