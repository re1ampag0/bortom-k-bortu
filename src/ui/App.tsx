// Screens: setup → secret placement → the table → the end of the game; the card catalog from the setup screen.
import { useState } from 'react';
import type { MatchRecord, MatchSetup } from '../engine/match';
import type { Side } from '../engine/types';
import { LocalGame } from '../net/local';
import { Catalog } from './Catalog';
import { loaded } from './data';
import { Game } from './game/Game';
import { Placement } from './game/Placement';
import { Setup, type StartRequest } from './game/Setup';
import { NetScreen, roomFromUrl } from './net/Lobby';
import { storeSave } from './storage';

type Screen =
  | { k: 'setup' }
  | { k: 'cards' }
  | { k: 'net' }
  | { k: 'placement'; setup: MatchSetup; note: string }
  | { k: 'game'; game: LocalGame };

export function App() {
  // A link to a room («…?room=ABCDE») opens the network screen at once.
  const [screen, setScreen] = useState<Screen>(() => (roomFromUrl() ? { k: 'net' } : { k: 'setup' }));
  if (loaded.error !== null) {
    return (
      <main className="page">
        <h1>Бортом к борту</h1>
        <pre className="error">{loaded.error}</pre>
      </main>
    );
  }
  const data = loaded.data;

  const startGame = (setup: MatchSetup) => {
    const game = new LocalGame(data, setup);
    storeSave(game.record());
    setScreen({ k: 'game', game });
  };
  const start = (req: StartRequest) => {
    const humans = (['ПИРАТЫ', 'КОМПАНИЯ'] as Side[]).filter((side) => req.setup.players[side] === 'human');
    if (humans.length === 0) startGame(req.setup);
    else setScreen({ k: 'placement', setup: req.setup, note: req.note });
  };
  const resume = (record: MatchRecord) => setScreen({ k: 'game', game: LocalGame.fromRecord(data, record) });

  switch (screen.k) {
    case 'setup':
      return <Setup data={data} onStart={start} onResume={resume} onCards={() => setScreen({ k: 'cards' })} onNet={() => setScreen({ k: 'net' })} />;
    case 'net':
      return (
        <NetScreen
          data={data}
          onBack={() => {
            if (roomFromUrl()) history.replaceState(null, '', location.pathname);
            setScreen({ k: 'setup' });
          }}
        />
      );
    case 'cards':
      return <Catalog data={data} onBack={() => setScreen({ k: 'setup' })} />;
    case 'placement':
      return (
        <Placement
          data={data}
          setup={screen.setup}
          note={screen.note}
          onDone={startGame}
          onBack={() => setScreen({ k: 'setup' })}
        />
      );
    case 'game':
      return (
        <Game
          key={screen.game.setup.game.seed}
          game={screen.game}
          onExit={() => setScreen({ k: 'setup' })}
          onRestart={(setup) => start({ setup, note: '' })}
        />
      );
  }
}
