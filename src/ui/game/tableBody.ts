// The page under the table or the curtain does not scroll (game.css «body.on-game», «body.on-curtain»). Classes set by the
// screens that are up, not body:has(.game): that selector is checked again at every change of the page, the clips included.
import { useLayoutEffect } from 'react';
import {fitGame} from './fit';
import {gameScaleEnabled} from './layout';

const users = { game: 0, curtain: 0 };
/** `kind` while the screen shows it; null — not now (the game under its curtain). */
export function useTableBody(kind: 'game' | 'curtain' | null): void {
  useLayoutEffect(() => {
    if (!kind) return;
    if (users[kind]++ === 0) {document.body.classList.add(`on-${kind}`);if(kind==='game')document.documentElement.classList.add('on-game');}
    if(kind==='game')document.body.dataset.gamescale=gameScaleEnabled()?'1':'0';
    const game=kind==='game'?document.querySelector<HTMLElement>('.game'):null;
    const stop=game?fitGame(game):()=>{};
    return () => {
      stop();
      if (--users[kind] === 0){document.body.classList.remove(`on-${kind}`);if(kind==='game')document.documentElement.classList.remove('on-game');if(kind==='game')delete document.body.dataset.gamescale;}
    };
  }, [kind]);
}
