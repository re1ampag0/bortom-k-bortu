import { useCallback, useEffect, useState } from 'react';
import type { DisplayState, FxClip, FxMode, FxScenario } from './fxPlan';

export interface FxPlayerOptions {
  scenario: FxScenario | null;
  mode: FxMode;
  paused?: boolean;
  onDone?: () => void;
}

export interface FxPlayerResult {
  clip: FxClip | null;
  displayed: DisplayState | null;
  busy: boolean;
  skip: () => void;
}

/** Plays presentation clips without mutating the authoritative engine state. */
export function useFxPlayer({ scenario, mode, paused = false, onDone }: FxPlayerOptions): FxPlayerResult {
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(true);
  const clips = scenario?.clips ?? [];
  const instant = mode === 'instant' || mode === 'reduced';
  const finish = useCallback(() => {
    setIndex(clips.length);
    setDone(true);
    onDone?.();
  }, [clips.length, onDone]);

  useEffect(() => {
    setIndex(0);
    setDone(!scenario || clips.length === 0 || instant);
  }, [scenario, clips.length, instant]);

  useEffect(() => {
    if (!scenario || done || paused || instant || document.visibilityState === 'hidden') return;
    const clip = clips[index];
    if (!clip) {
      finish();
      return;
    }
    const timer = window.setTimeout(() => {
      if (index + 1 >= clips.length) finish();
      else setIndex((value) => value + 1);
    }, clip.duration);
    return () => window.clearTimeout(timer);
  }, [clips, done, finish, index, instant, paused, scenario]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && scenario && !done) finish();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [done, finish, scenario]);

  const skip = useCallback(() => finish(), [finish]);
  const active = scenario && !done && !instant ? clips[index] ?? null : null;
  return { clip: active, displayed: scenario ? (active ? scenario.before : scenario.after) : null, busy: !!active, skip };
}
