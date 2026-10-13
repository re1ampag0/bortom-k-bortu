// The short sound «ваш ход» (docs/TZ.md, «Очередь хода и ожидание», п. 10), made with WebAudio — no sound files.
// Safari on the iPhone lets a page play sound only after a touch: the audio is unlocked on the first touch or click.
type Ctx = AudioContext;

let ctx: Ctx | null = null;
let armed = false;

function context(): Ctx | null {
  if (ctx) return ctx;
  const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!C) return null;
  try {
    ctx = new C();
  } catch {
    ctx = null;
  }
  return ctx;
}

/** Listens for the first touch of the page: from then on the sound may play (iPhone). */
export function armSound(): void {
  if (armed || typeof window === 'undefined') return;
  armed = true;
  const unlock = () => {
    const c = context();
    if (!c) return;
    c.resume().catch(() => {});
    // A silent blip: Safari opens the audio only for a sound started inside the touch.
    const g = c.createGain();
    g.gain.value = 0;
    const o = c.createOscillator();
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + 0.01);
    for (const t of ['pointerdown', 'touchend', 'keydown']) window.removeEventListener(t, unlock, true);
  };
  for (const t of ['pointerdown', 'touchend', 'keydown']) window.addEventListener(t, unlock, true);
}

/** Two soft notes, about 0.3 s. Silent until the page was touched once. */
export function playTurnSound(): void {
  const c = context();
  if (!c || c.state !== 'running') return;
  const now = c.currentTime;
  for (const [i, freq] of [660, 880].entries()) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    const t = now + i * 0.14;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + 0.18);
  }
}
