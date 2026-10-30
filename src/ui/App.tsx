// Screens: start → preparation → secret placement → the table → the end of the game; the card catalog from the start.
import { lazy, Suspense, useState } from 'react';
import type { MatchRecord, MatchSetup } from '../engine/match';
import type { Side } from '../engine/types';
import { LocalGame } from '../net/local';
import { Catalog } from './Catalog';
import { loaded } from './data';
import { Game } from './game/Game';
import { Placement } from './game/Placement';
import { NetScreen, roomFromUrl } from './net/Lobby';
import { seedFrom, urlSeedText } from './seed';
import { Prep, type StartRequest } from './start/Prep';
import { Start, type Mode } from './start/Start';
import { loadSettings, storeSave } from './storage';

/**
 * «?fxScene=<id>»: a scene of the animation reference on the table (FxScene.tsx), for checks. Only in the dev and e2e
 * builds: in the build for GitHub Pages the condition is false and the module is not in it.
 */
const FxScene = import.meta.env.DEV || import.meta.env.MODE === 'e2e' ? lazy(() => import('./game/fx/FxScene')) : null;
const fxSceneId = FxScene ? new URLSearchParams(location.search).get('fxScene') : null;

/** «Админка»: its own chunk, loaded only when opened (the link at the bottom of the start screen or «?admin»). */
const Admin = lazy(() => import('./admin/Admin'));
const adminInUrl = () => new URLSearchParams(location.search).has('admin');

type Screen =
  | { k: 'setup' }
  | { k: 'prep'; mode: Mode }
  | { k: 'cards' }
  | { k: 'net' }
  | { k: 'admin' }
  | { k: 'placement'; setup: MatchSetup; note: string }
  | { k: 'game'; game: LocalGame };

export function App() {
  // A link to a room («…?room=ABCDE») opens the network screen at once.
  const [screen, setScreen] = useState<Screen>(() => (roomFromUrl() ? { k: 'net' } : adminInUrl() ? { k: 'admin' } : { k: 'setup' }));
  if (loaded.error !== null) {
    return (
      <main className="page">
        <h1>Бортом к борту</h1>
        <pre className="error">{loaded.error}</pre>
      </main>
    );
  }
  const data = loaded.data;
  if (FxScene && fxSceneId) {
    return (
      <Suspense fallback={null}>
        <FxScene id={fxSceneId} data={data} />
      </Suspense>
    );
  }

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
      return (
        <Start
          data={data}
          onMode={(mode) => setScreen({ k: 'prep', mode })}
          onMatch={() => {
            const game = { seed: seedFrom(urlSeedText()), variant: 'standard' as const };
            startGame({ game, players: { ПИРАТЫ: 'bot', КОМПАНИЯ: 'bot' }, openHands: true, hints: loadSettings().hints ?? false });
          }}
          onResume={resume}
          onCards={() => setScreen({ k: 'cards' })}
          onNet={() => setScreen({ k: 'net' })}
          onAdmin={() => setScreen({ k: 'admin' })}
        />
      );
    case 'prep':
      return <Prep data={data} mode={screen.mode} onStart={start} onResume={resume} onBack={() => setScreen({ k: 'setup' })} />;
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
    case 'admin':
      return (
        <Suspense fallback={null}>
          <Admin
            onBack={() => {
              if (adminInUrl()) history.replaceState(null, '', location.pathname);
              setScreen({ k: 'setup' });
            }}
          />
        </Suspense>
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
