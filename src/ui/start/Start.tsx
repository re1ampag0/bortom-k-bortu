// The start screen (docs/mockups/start/): an old sea chart, «Продолжить партию» and «Вернуться в комнату», the three
// modes, links to a bot match, the rules, the cards and the settings.
import { useState } from 'react';
import { replay, type MatchRecord, type MatchSetup } from '../../engine/match';
import type { GameData } from '../../engine/types';
import { loadNetSaved } from '../../net/ws';
import { RulesSheet, SettingsSheet } from '../game/Overlays';
import { SIDE_LABEL } from '../game/text';
import { loadSave, loadSettings, storeSave, storeSettings, type Settings } from '../storage';
import {MenuSurface,MenuScene,Icon,Arrow,Flourish} from '../menus/Menus';

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
    <MenuSurface kind="main" className="menus-start">
      <main>
        <section className="menu-start-hero"><MenuScene name="Main"/><div className="menu-start-heading"><small>ПИРАТЫ · ПРОТИВ · КОМПАНИИ</small><h1>Бортом к борту</h1><Flourish/><p>Морской бой два на два, до последнего корабля.</p></div></section>
        <nav className={`menu-mode-grid ${save||netSaved?.code?'with-save':''}`} aria-label="Начать игру">
          {save&&<section className="menu-mode-card menu-plaque menu-save" data-testid="resume"><button className="menu-save-x" aria-label="Удалить сохранённую партию" onClick={()=>{storeSave(null);setSave(null);}}>×</button><div className="menu-mode-head"><span className="menu-medal"><Icon name="logbook" size={46}/></span><h2>Продолжить</h2></div><p>{save.text}</p><button className="menu-primary" data-testid="resume-go" onClick={()=>onResume(save.record)}>Вернуться к столу</button></section>}
          {!save&&netSaved?.code&&<button className="menu-mode-card menu-plaque menu-save" data-testid="net-resume" onClick={onNet}><h2>Вернуться в комнату {netSaved.code}</h2><p>Игра по сети</p><span className="menu-cta">Вернуться к столу <Arrow/></span></button>}
          {([{id:'quick-bots',icon:'cutlasses',title:'Против ботов',text:'Вы командуете одной стороной, боты другой.',cta:'Выбрать сторону',go:()=>onMode('bots')},{id:'quick-net',icon:'flags',title:'Игра по сети',text:'Каждый играет со своего телефона или ноутбука.',cta:'Комната по коду',go:onNet},{id:'quick-duo',icon:'mugs',title:'На одном экране',text:'Играете вдвоём, передавая устройство друг другу.',cta:'Сесть за стол',go:()=>onMode('duo')}]as const).map(m=><button key={m.id} className="menu-mode-card menu-plaque" data-testid={m.id} onClick={m.go}><span className="menu-mode-head"><span className="menu-medal"><Icon name={m.icon} size={50}/></span><h2>{m.title}</h2></span><p>{m.text}</p><span className="menu-cta">{m.cta}<Arrow/></span><span className="menu-mobile-chevron"><Arrow chevron/></span></button>)}
        </nav>
        <nav className="menu-start-links" aria-label="Ещё"><button onClick={()=>setSheet('rules')}><span className="menu-medal dark"><Icon name="book" size={38}/></span>Правила</button><button onClick={onCards}><span className="menu-medal dark"><Icon name="cards" size={38}/></span><span className="menu-desktop">Коллекция карт</span><span className="menu-phone">Карты</span></button><button data-testid="start-settings" onClick={()=>setSheet('settings')}><span className="menu-medal dark"><Icon name="wheel" size={38}/></span>Настройки</button><button data-testid="quick-match" onClick={onMatch}><span className="menu-medal dark"><Icon name="spyglass" size={38}/></span>Матч ботов</button></nav>
        <footer className="menu-version">Версия {__APP_COMMIT__} · сборка {new Date(__APP_BUILT__).toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</footer>
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
    </MenuSurface>
  );
}

function describeSetup(setup: MatchSetup): string {
  const p = setup.players;
  if (p.ПИРАТЫ === 'bot' && p.КОМПАНИЯ === 'bot') return 'матч ботов';
  if (p.ПИРАТЫ === 'human' && p.КОМПАНИЯ === 'human') return 'вдвоём на одном экране';
  return 'против ботов';
}

