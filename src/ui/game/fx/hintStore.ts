// Only the status line subscribes: a sentence emitted by a clip must not redraw the whole game.
export function createFxHint() {
  let value: string | null = null;
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => value,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    set: (next: string | null) => { if (next === value) return; value = next; listeners.forEach(fn => fn()); },
  };
}
export type FxHintStore = ReturnType<typeof createFxHint>;
export const noFxHint = createFxHint();
