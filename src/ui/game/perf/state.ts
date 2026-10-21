// Diagnostic switches are separate from the player's game settings. No work until Game opts in.
export const PARTS = [
  ['weather', 'Погода'], ['ripples', 'Рябь и гребни моря'], ['decor', 'Декорации палубы и стола'],
  ['light', 'Свет и наложения'], ['particles', 'Частицы эффектов'], ['labels', 'Летящие карты, разбор, пилюли'],
  ['filters', 'Filter и drop-shadow'], ['planks', 'Анимации планшетов'], ['background', 'Фон стола'],
  ['simple', 'Простые спецэффекты'], ['css', 'Все CSS-анимации и переходы'],
] as const;
export type Part = typeof PARTS[number][0];
export interface PerfConfig { enabled: boolean; off: readonly Part[] }
let config: PerfConfig = {enabled: false, off: []};
let initialized = false;
const listeners = new Set<() => void>();
export const getPerf = () => config;
export const perfOff = (part: Part) => config.enabled && config.off.includes(part);
function write(key: string, value: string) { try { localStorage.setItem(key, value); } catch { /* optional storage */ } }
export function initPerf(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  let enabled = false, off: Part[] = [];
  try {
    enabled = localStorage.getItem('bortom-perf') === '1';
    const saved: unknown = JSON.parse(localStorage.getItem('bortom-perf-parts') ?? '[]');
    if (Array.isArray(saved)) off = PARTS.map(([key]) => key).filter(key => saved.includes(key));
  } catch { /* URL still works with unavailable storage */ }
  const query = new URLSearchParams(location.search).get('perf');
  if (query === '1' || query === '0') { enabled = query === '1'; write('bortom-perf', query); }
  config = {enabled, off};
}
export function togglePart(part: Part): void {
  if (!config.enabled) return;
  config = {...config, off: config.off.includes(part) ? config.off.filter(p => p !== part) : [...config.off, part]};
  write('bortom-perf-parts', JSON.stringify(config.off));
  listeners.forEach(fn => fn());
}
export const subscribePerf = (fn: () => void) => { listeners.add(fn); return () => {listeners.delete(fn);}; };
export const perfClasses = (c: PerfConfig) => c.enabled ? c.off.map(p => `perf-off-${p}`).join(' ') : '';
