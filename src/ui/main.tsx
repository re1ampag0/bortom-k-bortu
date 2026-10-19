import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { armSound } from './sound';
import './fonts';
import './styles.css';
import './game/game.css';
import './game/alarm.css';
import './start/start.css';

// The sound «ваш ход» needs a first touch of the page (iPhone): listen for it from the start.
armSound();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
