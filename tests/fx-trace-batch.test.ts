import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {batchTrace, clearTrace, loadTrace, trace} from '../src/ui/game/fx/trace';
import {createFxHint} from '../src/ui/game/fx/hintStore';

describe('show-local notifications and journal storage', () => {
  const setItem = vi.fn(), removeItem = vi.fn();
  beforeEach(() => {
    vi.stubGlobal('window', {localStorage:{getItem:()=>null,setItem,removeItem}});
    clearTrace();setItem.mockClear();removeItem.mockClear();
  });
  afterEach(() => vi.unstubAllGlobals());
  it('keeps overlapping shows readable without writing until both end', () => {
    const endOld = batchTrace(), endNew = batchTrace();
    trace('first');trace('second');
    expect(loadTrace()).toHaveLength(2);expect(setItem).not.toHaveBeenCalled();
    endOld();endOld();expect(setItem).not.toHaveBeenCalled();
    trace('third');endNew();
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(JSON.parse(setItem.mock.calls[0][1])).toHaveLength(3);
    trace('outside');expect(setItem).toHaveBeenCalledTimes(2);
  });
  it('does not restore cleared lines when a paused show ends', () => {
    const end = batchTrace();trace('old');clearTrace();end();
    expect(setItem).not.toHaveBeenCalled();expect(loadTrace()).toEqual([]);
  });
  it('notifies only the status subscriber, with independent stores and unsubscribe', () => {
    const a = createFxHint(), b = createFxHint(), listener = vi.fn();
    const unsubscribe = a.subscribe(listener);
    a.set('shot');a.set('shot');b.set('other');
    expect(listener).toHaveBeenCalledTimes(1);expect(a.getSnapshot()).toBe('shot');
    unsubscribe();a.set(null);expect(listener).toHaveBeenCalledTimes(1);
  });
});
