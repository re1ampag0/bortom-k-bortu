// game: a short journal of the animation layer on this device — which clip started, ended, broke or was cut off and
// why. A player opens it in ⚙ → «Журнал анимаций» and sends a screenshot when a show breaks off: the cause is read
// there, not guessed. In memory and in the browser storage (the last 60 lines), never sent anywhere.
const KEY = 'bortom-fx-trace';
const MAX = 60;
let lines: string[] | null = null;
let batches = 0, dirty = false;
function flush(): void {
  if (!dirty) return;
  dirty = false;
  try { window.localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* optional journal */ }
}
/** Memory stays current for the journal; synchronous storage waits until the last show ends. */
export function batchTrace(): () => void {
  batches++;
  let ended = false;
  return () => { if (ended) return; ended = true; if (--batches === 0) flush(); };
}
if (typeof window !== 'undefined') window.addEventListener('pagehide', flush);

function stored(): string[] {
  try {
    const list = JSON.parse(window.localStorage.getItem(KEY) ?? '[]') as unknown;
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** A line of the journal, the newest first: «12:03:41 ▶ sea». */
export function trace(text: string): void {
  if (!lines) lines = stored();
  const now = new Date();
  const hms = [now.getHours(), now.getMinutes(), now.getSeconds()].map((n) => String(n).padStart(2, '0')).join(':');
  lines.unshift(`${hms} ${text}`);
  if (lines.length > MAX) lines.length = MAX;
  dirty = true;
  if (!batches) flush();
}

export function loadTrace(): string[] {
  if (!lines) lines = stored();
  return [...lines];
}

export function clearTrace(): void {
  lines = [];
  dirty = false;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}
