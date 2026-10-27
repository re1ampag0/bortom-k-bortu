// The preparation screen after «Против ботов» or «Вдвоём»: the side (or the coin), «Дополнительно» folded, «Начать».
import { useEffect, useRef, useState } from 'react';
import { parseRecord, type Controller, type MatchRecord, type MatchSetup } from '../../engine/match';
import { createRng } from '../../engine/rng';
import type { Variant } from '../../engine/state';
import type { GameData, Side } from '../../engine/types';
import { SIDE_LABEL } from '../game/text';
import { loadSettings, storeSettings } from '../storage';
import { seedFrom, tossSeed, urlSeedText } from '../seed';
import { Coin } from './Coin';
import { instantUrl, reducedMotion } from './motion';
import {MenuSurface,MenuScene,Icon,Arrow,Flourish} from '../menus/Menus';
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
  data,
  mode,
  onStart,
  onResume,
  onBack,
}: {
  data: GameData;
  mode: Mode;
  onStart: (req: StartRequest) => void;
  onResume: (record: MatchRecord) => void;
  onBack: () => void;
}) {
  const [pick, setPick] = useState<Pick>('coin');
  // The coin and the game use the same seed. Without a seed in the field or the address each «Жребий» tosses a new
  // one; a given seed stays (the same side, the game can be repeated).
  const [seedText, setSeedText] = useState(urlSeedText);
  const [seed, setSeed] = useState(() => seedFrom(urlSeedText()));
  const [coin, setCoin] = useState<{ side: Side; seed: number; spinning: boolean } | null>(null);
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

  /** Throws the coin; `then` gets the side and the seed after the spin (at once without motion). */
  const toss = (then?: (side: Side, seed: number) => void) => {
    const tossed = tossSeed(seedText, seed);
    setSeed(tossed);
    const side = coinOf(tossed);
    const still = instantUrl() || reducedMotion();
    setCoin({ side, seed: tossed, spinning: !still });
    if (timer.current) clearTimeout(timer.current);
    const done = () => {
      setCoin({ side, seed: tossed, spinning: false });
      then?.(side, tossed);
    };
    if (still) done();
    else timer.current = setTimeout(done, COIN_MS);
  };

  /** The game starts with the seed the coin fell by (or the screen's seed, when the side was picked). */
  const start = (side: Side, byCoin: boolean, gameSeed: number) => {
    const game = { seed: gameSeed, variant, sea, legends };
    const lead = byCoin ? 'Монета выбрала: ' : '';
    if (mode === 'bots') {
      onStart({
        setup: { game, players: { [side]: 'human', [other(side)]: 'bot' } as Record<Side, Controller>, openHands, hints },
        note: `${lead}вы играете за ${SIDE_LABEL[side].acc}. Первыми ходят Пираты.`,
      });
    } else {
      onStart({
        setup: { game, players: { ПИРАТЫ: 'human', КОМПАНИЯ: 'human' }, openHands, hints },
        note: `${lead}кто держит устройство, играет за ${SIDE_LABEL[side].acc}, второй игрок играет за ${SIDE_LABEL[other(side)].acc}. Первыми ходят Пираты.`,
      });
    }
  };
  const begin = () => {
    if (coin?.spinning) return;
    if (pick !== 'coin') start(pick, false, seed);
    else if (coin) start(coin.side, true, coin.seed);
    else toss((side, tossed) => start(side, true, tossed));
  };
  const load = async (f: File) => {
    try {
      onResume(parseRecord(JSON.parse(await f.text())));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const who = mode === 'bots' ? 'Вы играете за' : 'Кто держит устройство, играет за';
  const verdict = coin && !coin.spinning ? `Монета выбрала ${SIDE_LABEL[coin.side].acc}. ${mode === 'bots' ? 'Вы играете за эту команду.' : 'За неё играет тот, кто держит устройство.'}` : coin ? 'Монета крутится…' : 'Монета решит, кто за какую сторону';

  const variantPick=(v:Variant)=>{setVariant(v);if(v==='first')setHintsChoice(true);setSea(v!=='first');setLegends(v!=='first');};
  return <MenuSurface kind="prep"><main className="menu-prep-content" data-testid="prep">
    <button className="menu-link menu-back" onClick={onBack}><Arrow back/><span>Назад</span></button><h1 className="menu-title">{mode==='bots'?'Против ботов':'На одном экране'}</h1><Flourish/><p className="menu-subtitle">{mode==='bots'?'Вы командуете одной стороной, боты другой.':'Каждый за свою команду, передавайте устройство друг другу.'} <span className="menu-desktop">Пираты всегда ходят первыми.</span><span className="menu-phone">Пираты ходят первыми.</span></p>
    <div className="menu-kicker">Ваша сторона</div><div className="menu-side-pick" role="radiogroup" aria-label={who}>
     {(['ПИРАТЫ','КОМПАНИЯ']as Side[]).map(side=><button key={side} role="radio" aria-checked={pick===side} className={`menu-side-tile ${pick===side?'on':''}`} data-testid={side==='ПИРАТЫ'?'pick-pirates':'pick-company'} onClick={()=>setPick(side)}>{pick===side&&<span className="menu-picked"><svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8L6.5 11.5L13 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg><span className="menu-desktop">Выбрано</span></span>}<MenuScene name={side==='ПИРАТЫ'?'Pirates':'Company'}/><span className="menu-side-copy"><b>{SIDE_LABEL[side].name}</b><small>{data.ships.filter(x=>x.side===side).map(x=>x.name).join(' и ')}</small></span></button>)}
     <button role="radio" aria-checked={pick==='coin'} className={`menu-side-tile menu-coin-tile ${pick==='coin'?'on':''}`} data-testid="pick-coin" onClick={()=>{setPick('coin');if(!coin?.spinning)toss();}}><MenuScene name="CoinSpark"/><Coin face={coin?.side??null} spinning={!!coin?.spinning}/><b>Жребий</b><small data-testid="coin-verdict" aria-live="polite">{coin?verdict:'Монета выберет сторону'}</small></button>
    </div>
    <div className="menu-prep-options"><section><div className="menu-kicker">Вариант партии</div><div className="menu-variants" role="radiogroup" aria-label="Вариант">{([{v:'standard',label:'Обычная',icon:'cannon'},{v:'first',label:'Первая партия',icon:'chart'},{v:'quick',label:'Быстрый бой',icon:'bomb'}]as const).map(x=><button key={x.v} role="radio" aria-checked={variant===x.v} className={variant===x.v?'on':''} onClick={()=>variantPick(x.v)}><Icon name={x.icon}/>{x.label}</button>)}</div><p>{variant==='standard'?'Все правила, Колода моря и Легенды. Бой идёт, пока у одной стороны не утонут оба корабля.':variant==='first'?'Для знакомства с игрой. Колоду моря и Легенды можно включить отдельно.':'Короткая партия с правилами варианта «Быстрый бой».'}</p></section>
    <section><div className="menu-kicker">Настройки стола</div><div className="menu-toggles">{[{text:'Колода моря',value:sea,set:setSea},{text:'Легенды',value:legends,set:setLegends},{text:'Подсказки',value:hints,set:setHints},{text:'Открытые руки',value:openHands,set:setOpenHands}].map(x=><label className="menu-toggle" key={x.text}><input type="checkbox" checked={x.value} onChange={e=>x.set(e.target.checked)}/>{x.text}</label>)}</div><p>Подсказки: урон по целям и выгодные ходы. Открытые руки: все карты на виду.</p></section></div>
    <footer className="menu-prep-bottom"><button className="menu-link" aria-expanded={more} onClick={()=>setMore(!more)}><Arrow chevron/><span className="menu-desktop">Ещё: номер партии и загрузка сохранения</span><span className="menu-phone">Ещё настройки</span></button><button className="menu-primary" data-testid="prep-start" disabled={!!coin?.spinning} onClick={begin}><Icon name="sail" size={46}/>Поднять паруса</button></footer>
    {more&&<section className="menu-advanced"><label>Номер партии <input inputMode="numeric" placeholder="случайный" value={seedText} onChange={e=>changeSeed(e.target.value)}/></label><button className="menu-link" onClick={()=>file.current?.click()}>Загрузить партию (.json)</button><input ref={file} type="file" accept=".json,application/json" hidden onChange={e=>e.target.files?.[0]&&load(e.target.files[0])}/>{error&&<p className="error">{error}</p>}</section>}
  </main></MenuSurface>;
}
