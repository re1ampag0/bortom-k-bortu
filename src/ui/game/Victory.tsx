// V7: the victory sheet (A5Victory.html, A5Phone.html frame 7) in place of the old end screen: «— Конец партии · Раунд VI —»,
// the ribbon, who is on the bottom, the minutes and the turns; the panorama (art/pano.ts) of the end of this game; the best
// captain with the medal; the contribution of each ship with its title; the buttons pinned to the foot of the sheet.
// The buttons and what they do are the old ones (data-testid end-screen, rematch). Game.tsx loads it as a chunk of its
// own (the big ships of the panorama are not in the main bundle).
import { useMemo, type CSSProperties } from 'react';
import type { MatchSetup } from '../../engine/match';
import { shipData, type Action, type GameState } from '../../engine/state';
import type { GameData } from '../../engine/types';
import { usePhoneLayout } from './Alarm';
import { ICON_DOWNLOAD, ICON_EYE, ICON_NEW, medalSvg } from './art/medal';
import { panoCast, panoSvg, PHONE, WIDE } from './art/pano';
import { T } from './fx/timing';
import { formatPlayTime } from './playClock';
import { OakButton } from './Table';
import { roman, SIDE_LABEL } from './text';
import { awardTitles, bestCaptain, matchStats, plural, type MatchStats } from './victoryStats';

/** «Чёрная жемчужина» without the quotes of the data. */
const bare = (name: string) => name.replace(/[«»]/g, '');
const nick = (data: GameData, code: string) => `«${shipData(data, code).nick}»`;

/** The durations of the sheet as custom properties (fx/timing.ts is the one place of the numbers). */
const victoryVars = {
  ['--v-in' as string]: `${T.ui.victoryIn}ms`,
  ['--v-ribbon' as string]: `${T.ui.ribbon}ms`,
  ['--v-bar' as string]: `${T.ui.bar}ms`,
  ['--v-step' as string]: `${T.ui.barStep}ms`,
  ['--v-stamp' as string]: `${T.ui.stamp}ms`,
} as CSSProperties;

/** «На дне: «Индевор» и «Голландец» · 58 минут · 31 ход» — what the data has. */
export function victoryLine(data: GameData, s: GameState, stats: MatchStats | null, ms: number | null): string {
  const sunk = (stats?.sunkOrder ?? Object.keys(s.ships).filter((c) => s.ships[c].sunk)).map((c) => nick(data, c));
  const parts: string[] = [];
  if (sunk.length) parts.push(`На дне: ${sunk.length > 1 ? `${sunk.slice(0, -1).join(', ')} и ${sunk[sunk.length - 1]}` : sunk[0]}`);
  if (ms !== null) parts.push(formatPlayTime(ms));
  if (stats) parts.push(`${stats.turns} ${plural(stats.turns, 'ход', 'хода', 'ходов')}`);
  return parts.join(' · ');
}

export function Victory({
  s,
  data,
  record,
  playMs,
  onRematch,
  rematchLabel = 'Реванш',
  rematchNote,
  onNew,
  newLabel = 'Новая партия',
  onDownloadLog,
  onDownloadGame,
  onClose,
}: {
  s: GameState;
  data: GameData;
  /** The record of the game for its numbers (victoryStats.ts); null — not here yet (a network game asks the server). */
  record: { setup: MatchSetup; actions: Action[] } | null;
  /** The minutes of the game (playClock.ts); null — this device has no clock of it. */
  playMs: number | null;
  onRematch: (() => void) | null;
  /** By network: «Реванш» or «Отменить реванш» after agreeing. */
  rematchLabel?: string;
  /** Under «Реванш»: «те же корабли, новая партия»; by network — «согласны 1 из 2». */
  rematchNote?: string;
  onNew: () => void;
  newLabel?: string;
  onDownloadLog: () => void;
  onDownloadGame: (() => void) | null;
  onClose: () => void;
}) {
  const phone = usePhoneLayout();
  const w = s.winner;
  const stats = useMemo(() => (record ? matchStats(data, record.setup, record.actions) : null), [data, record]);
  const order = useMemo(() => {
    const codes = data.ships.map((x) => x.code).filter((c) => s.ships[c]);
    // the winners first, the one with the most damage in front; the sunk ships last
    const rank = (c: string) => (s.ships[c].sunk ? 2 : w && w !== 'НИЧЬЯ' && s.ships[c].side !== w ? 1 : 0);
    return codes.slice().sort((a, b) => rank(a) - rank(b) || (stats ? stats.ships[b].dmgOut - stats.ships[a].dmgOut : 0));
  }, [data, s, w, stats]);
  const pano = useMemo(() => panoSvg(phone ? PHONE : WIDE, panoCast(order, (c) => s.ships[c].side, (c) => s.ships[c].sunk, w)), [phone, order, s, w]);
  const titles = useMemo(() => (stats ? awardTitles(data, stats, w) : null), [data, stats, w]);
  const best = stats ? bestCaptain(stats, w) : null;
  const top = stats ? Math.max(1, ...order.map((c) => stats.ships[c].dmgOut)) : 1;
  const ribbon = w === 'НИЧЬЯ' ? 'Ничья' : w ? `Победа ${SIDE_LABEL[w].gen}` : '';
  const line = victoryLine(data, s, stats, playMs);
  const medal = useMemo(() => medalSvg(phone ? 54 : 52), [phone]);

  return (
    <div className="victory-backdrop" style={victoryVars}>
      <section className="victory" data-testid="end-screen" aria-label={ribbon}>
        <div className="v-scroll">
          <div className="v-over">Конец партии · Раунд {roman(s.round)}</div>
          <h1 className="v-ribbon" data-testid="victory-ribbon">
            {ribbon}
          </h1>
          {line && (
            <p className="v-sub" data-testid="victory-line">
              {line}
            </p>
          )}
          <div className="v-pano" data-testid="victory-pano" dangerouslySetInnerHTML={{ __html: pano }} />
          <div className="v-body">
            {best && (
              <div className="v-best" data-testid="best-captain">
                <span className="v-medal" dangerouslySetInnerHTML={{ __html: medal }} />
                <div className="v-best-head">
                  <div className="v-k">Лучший капитан</div>
                  <div className="v-cap">{shipData(data, best.code).captain.replace(/^капитан\s+/, '')}</div>
                  <div className="v-ship">{shipData(data, best.code).name}</div>
                </div>
                <div className="v-three">
                  <div>
                    <b>{best.dmg}</b>
                    {best.most ? 'урона: больше всех' : 'урона за партию'}
                  </div>
                  <div>
                    <b>{best.share} %</b>
                    урона {SIDE_LABEL[shipData(data, best.code).side].gen}
                  </div>
                  {best.kill ? (
                    <div>
                      <b>{roman(best.kill.round)}</b>
                      раунд: {nick(data, best.kill.ship)} на дне
                    </div>
                  ) : (
                    <div>
                      <b>{stats!.ships[best.code].volleys}</b>
                      {plural(stats!.ships[best.code].volleys, 'Залп', 'Залпа', 'Залпов')} за партию
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="v-rows">
              <div className="v-rows-head">
                <span>Вклад в партию</span>
                <span>Урон по врагу</span>
              </div>
              {order.map((c, i) => {
                const sh = shipData(data, c);
                const st = stats?.ships[c];
                const t = titles?.[c];
                const gone = s.ships[c].sunk;
                return (
                  <div className={`v-row ${gone ? 'gone' : ''}`} key={c} data-testid="victory-row" data-ship={c} style={{ ['--i' as string]: i, ['--c' as string]: sh.color } as CSSProperties}>
                    <div className="v-a">
                      <span className="v-sq" />
                      <span className="v-nm">
                        <b>{bare(sh.name)}</b>
                        <span className="v-af">{gone ? 'затонул' : 'на плаву'}</span>
                      </span>
                      <span className="v-bar">{st && <i style={{ width: `${(st.dmgOut / top) * 100}%` }} />}</span>
                      <b className="v-v">{st ? st.dmgOut : '…'}</b>
                    </div>
                    {t && (
                      <div className="v-b">
                        <span className="v-ttl" data-testid="victory-title">
                          {t.name}
                        </span>
                        <span className="v-fct">{t.fact}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="v-btns">
          <div className="v-btn-row">
            {onRematch && (
              <OakButton
                b={{ key: 'rematch', label: rematchLabel, onClick: onRematch, primary: true, testid: 'rematch' }}
                className="v-rematch"
                sub={rematchNote ?? 'те же корабли, новая партия'}
              />
            )}
            <div className="v-row3">
              <button className="v-paper" onClick={onNew}>
                <span dangerouslySetInnerHTML={{ __html: ICON_NEW }} />
                {newLabel}
              </button>
              {onDownloadGame && (
                <button className="v-paper" onClick={onDownloadGame} aria-label="Скачать партию">
                  <span dangerouslySetInnerHTML={{ __html: ICON_DOWNLOAD }} />
                  <span className="v-long">Скачать партию</span>
                  <span className="v-short">Скачать</span>
                </button>
              )}
              <button className="v-paper" onClick={onClose} aria-label="Посмотреть стол">
                <span dangerouslySetInnerHTML={{ __html: ICON_EYE }} />
                <span className="v-long">Посмотреть стол</span>
                <span className="v-short">Стол</span>
              </button>
            </div>
          </div>
          <button className="v-log link" onClick={onDownloadLog}>
            Скачать журнал
          </button>
        </div>
      </section>
    </div>
  );
}
