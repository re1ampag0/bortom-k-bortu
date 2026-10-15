// The start screen (docs/mockups/start/): an old sea chart, «Продолжить партию» and «Вернуться в комнату», the three
// modes, links to a bot match, the rules, the cards and the settings.
import { useEffect, useMemo, useState } from 'react';
import { replay, type MatchRecord, type MatchSetup } from '../../engine/match';
import type { GameData } from '../../engine/types';
import { loadNetSaved } from '../../net/ws';
import { RulesSheet, SettingsSheet } from '../game/Overlays';
import { SIDE_LABEL } from '../game/text';
import { loadSave, loadSettings, storeSave, storeSettings, type Settings } from '../storage';
import { Rhumbs } from './Rhumbs';

export type Mode = 'bots' | 'duo';

export function Start({
  data,
  onMode,
  onMatch,
  onNet,
  onResume,
  onCards,
}: {
  data: GameData;
  onMode: (mode: Mode) => void;
  onMatch: () => void;
  onNet: () => void;
  onResume: (record: MatchRecord) => void;
  onCards: () => void;
}) {
  const netSaved = loadNetSaved();
  const [save, setSave] = useState(() => {
    const record = loadSave();
    if (!record) return null;
    try {
      const state = replay(data, record.setup, record.actions);
      return state.winner ? null : { record, text: `Раунд ${state.round}, ход ${SIDE_LABEL[state.active].gen}, ${describeSetup(record.setup)}` };
    } catch {
      return null;
    }
  });
  const [sheet, setSheet] = useState<null | 'rules' | 'settings'>(null);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const change = (patch: Partial<Settings>) => {
    const next = { ...loadSettings(), ...patch };
    storeSettings(next);
    setSettings(next);
  };

  return (
    <div className="start-page">
      <Rhumbs />
      <main className={`start ${save && netSaved?.code ? 'two-plaques' : ''}`}>
        <section className="start-hero">
          <h1 className="start-title">
            <span>Бортом</span>
            <span className="k">к борту</span>
          </h1>
          <p className="start-sub">Морской бой два на два: Пираты против Ост-Индской компании, до последнего корабля.</p>
          <figure className="start-art">
            <div className="start-frame">
              <SeaMap />
            </div>
          </figure>
        </section>

        <nav className="start-menu" aria-label="Начать игру">
          {save && (
            <div className="plaque" data-testid="resume">
              <button className="plaque-main" onClick={() => onResume(save.record)} data-testid="resume-go">
                <span className="t">Продолжить партию</span>
                <span className="d">{save.text}</span>
                <span className="go">Вернуться</span>
              </button>
              <button
                className="plaque-x"
                title="Удалить сохранённую партию"
                aria-label="Удалить сохранённую партию"
                onClick={() => {
                  storeSave(null);
                  setSave(null);
                }}
              >
                ✕
              </button>
            </div>
          )}
          {netSaved?.code && (
            <div className="plaque" data-testid="net-resume">
              <button className="plaque-main" onClick={onNet}>
                <span className="t">Вернуться в комнату {netSaved.code}</span>
                <span className="d">Игра по сети</span>
                <span className="go">Вернуться</span>
              </button>
            </div>
          )}

          <button className="mode main" data-testid="quick-bots" onClick={() => onMode('bots')}>
            <IconBots />
            <span className="t">Против ботов</span>
            <span className="d">Вы — одна команда, боты — другая</span>
          </button>
          <button className="mode" data-testid="quick-net" onClick={onNet}>
            <IconNet />
            <span className="t">По сети</span>
            <span className="d">Каждый со своего телефона или ноутбука</span>
          </button>
          <button className="mode" data-testid="quick-duo" onClick={() => onMode('duo')}>
            <IconDuo />
            <span className="t">Вдвоём на одном экране</span>
            <span className="d">Передаёте устройство друг другу</span>
          </button>

          <div className="start-links">
            <button className="link" data-testid="quick-match" onClick={onMatch}>
              Матч ботов
            </button>
            <button className="link" onClick={() => setSheet('rules')}>
              Правила
            </button>
            <button className="link" onClick={onCards}>
              Все карты
            </button>
            <button className="link" data-testid="start-settings" onClick={() => setSheet('settings')}>
              Настройки
            </button>
          </div>
        </nav>
      </main>
      {sheet === 'rules' && <RulesSheet data={data} onClose={() => setSheet(null)} />}
      {sheet === 'settings' && (
        <SettingsSheet
          speed={settings.speed}
          setSpeed={(speed) => change({ speed })}
          effects={settings.effects}
          setEffects={(effects) => change({ effects })}
          sound={settings.sound}
          setSound={(sound) => change({ sound })}
          fastEnd={settings.fastEnd}
          setFastEnd={(fastEnd) => change({ fastEnd })}
          openHands={null}
          setOpenHands={() => {}}
          hints={settings.hints ?? false}
          setHints={(hints) => change({ hints })}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
}

function describeSetup(setup: MatchSetup): string {
  const p = setup.players;
  if (p.ПИРАТЫ === 'bot' && p.КОМПАНИЯ === 'bot') return 'матч ботов';
  if (p.ПИРАТЫ === 'human' && p.КОМПАНИЯ === 'human') return 'вдвоём на одном экране';
  return 'против ботов';
}

/** The sea chart (public/art/start-map.svg), inlined so its captions use the page's Alegreya. */
function SeaMap() {
  const [svg, setSvg] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(`${import.meta.env.BASE_URL}art/start-map.svg`)
      .then((r) => (r.ok ? r.text() : null))
      .then((t) => alive && t && setSvg(t.replace('<svg ', '<svg class="start-map" ')))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return useMemo(
    () => (svg ? <div className="start-map-box" dangerouslySetInnerHTML={{ __html: svg }} /> : <div className="start-map-box" aria-hidden="true" />),
    [svg],
  );
}

function IconBots() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
      <circle cx="22" cy="22" r="20" fill="none" stroke="#C8A04A" strokeWidth="1.5" />
      <path d="M10 27 H34 L31 32 Q22 34 13 32Z" fill="#2A2521" />
      <path d="M22 27 V9 M15 14 Q22 16 29 14 L28 24 Q22 26 16 24Z" stroke="#2A2521" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function IconNet() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
      <circle cx="22" cy="22" r="20" fill="none" stroke="#C9B48C" strokeWidth="1.5" />
      <path d="M8 26 q3-3 6 0 t6 0 t6 0 t6 0 t6 0" stroke="#24465C" strokeWidth="1.6" fill="none" />
      <path d="M22 10 v10 M17 14 a7 7 0 0 1 10 0 M13 10 a12 12 0 0 1 18 0" stroke="#C8A04A" strokeWidth="1.6" fill="none" />
    </svg>
  );
}

function IconDuo() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
      <circle cx="22" cy="22" r="20" fill="none" stroke="#C9B48C" strokeWidth="1.5" />
      <path d="M7 25 H20 L18 29 H9Z" fill="#B23A2E" />
      <path d="M24 25 H37 L35 29 H26Z" fill="#C8A04A" />
      <path d="M13 25 V14 M31 25 V14" stroke="#2A2521" strokeWidth="1.5" />
      <path d="M13 15 L19 18 L13 21Z M31 15 L25 18 L31 21Z" fill="#2A2521" />
    </svg>
  );
}
