import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { useStage } from './stage';
import { armSound } from './sound';
import './fonts';
import './styles.css';
import './game/game.css';
import './game/alarm.css';
import './game/victory.css';
import './game/logbook.css';
import './game/charge.css';
import './game/phone.css';
import './game/scale.css';
import './game/phone-fix.css';
import './scrollbars.css';
import './start/start.css';
import './ui-polish.css';

// The sound «ваш ход» needs a first touch of the page (iPhone): listen for it from the start.
armSound();

/** The one root container of the screen: scaled as a whole on a large laptop window (stage.ts). */
function Stage() {
  const style = useStage();
  return (
    <div id="stage" style={style ?? undefined}>
      <App />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Stage />
  </StrictMode>,
);

import './card-art.css';

import './fix-after-polish.css';
