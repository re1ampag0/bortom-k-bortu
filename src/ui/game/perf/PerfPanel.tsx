import {useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore} from 'react';
import {createPortal} from 'react-dom';
import {getPerf, initPerf, PARTS, perfClasses, subscribePerf, togglePart, type PerfConfig} from './state';
import {FrameWindow, stats, type Sample, type Stats} from './metrics';
import './perf.css';
export function usePerf() {
  useState(initPerf);
  const config = useSyncExternalStore(subscribePerf, getPerf, getPerf);
  useLayoutEffect(() => {
    if (!config.enabled || (!config.off.includes('planks') && !config.off.includes('labels'))) return;
    for (const root of document.querySelectorAll('.game')) for (const animation of root.getAnimations({subtree:true})) {
      if (animation instanceof CSSAnimation || animation instanceof CSSTransition) continue;
      const target = (animation.effect as KeyframeEffect | null)?.target;
      if ((config.off.includes('planks') && target?.closest('.plank')) ||
          (config.off.includes('labels') && target?.closest('.flyc,.seacard,.plate,.tag,.pill,.wait-pill,.tmark,.hold-tag'))) {
        // Finish, never leave an awaited native promise paused forever.
        if (animation.effect?.getTiming().iterations !== Infinity) animation.finish();
      }
    }
  }, [config]);
  return {config, classes: perfClasses(config)};
}
interface Recording { start: number; frames: Sample[]; peak: number; config: PerfConfig; observer: MutationObserver; timer: ReturnType<typeof setTimeout> }
export function PerfPanel() {
  const config = useSyncExternalStore(subscribePerf, getPerf, getPerf);
  const [parts, setParts] = useState(false), [value, setValue] = useState<Stats>({fps: 0, worst: 0, slow: 0});
  const [seconds, setSeconds] = useState<number | null>(null), [result, setResult] = useState(''), [copy, setCopy] = useState('');
  const frames = useRef(new FrameWindow()), last = useRef<number | null>(null), record = useRef<Recording | null>(null);
  const text = useRef<HTMLTextAreaElement>(null);
  const cancelRecord = () => {
    const r = record.current; if (!r) return;
    clearTimeout(r.timer); r.observer.disconnect(); record.current = null; setSeconds(null);
  };
  useEffect(() => {
    let raf = 0, published = 0;
    const tick = (at: number) => {
      if (document.visibilityState === 'visible' && last.current !== null) {
        const dt = at - last.current;
        if (dt > 0) {frames.current.add(at, dt); const r = record.current; if (r && at - dt >= r.start) r.frames.push({at, dt});}
      }
      last.current = document.visibilityState === 'visible' ? at : null;
      if (at - published >= 500) { published = at; setValue(frames.current.read(at)); const r = record.current; if (r) setSeconds(Math.max(0, Math.ceil((20000 - at + r.start) / 1000))); }
      raf = requestAnimationFrame(tick);
    };
    const visibility = () => {
      last.current = null; frames.current.reset();
      if (document.hidden && record.current) {cancelRecord(); setResult('Запись прервана: страница ушла в фон. Повторите запись.');}
    };
    raf = requestAnimationFrame(tick);document.addEventListener('visibilitychange', visibility);
    return () => {cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', visibility); cancelRecord();};
  }, []);
  useEffect(() => {
    if (record.current && record.current.config !== config) {cancelRecord(); setResult('Части изменены во время записи. Запишите заново.');}
  }, [config]);
  const reset = () => {cancelRecord();frames.current.reset();last.current = null;setValue({fps:0,worst:0,slow:0});setResult('');setCopy('');};
  const start = () => {
    cancelRecord();setResult('');setCopy('');setSeconds(20);
    const count = () => [...document.querySelectorAll('.game .fx-layer')].reduce((n,e) => n + e.querySelectorAll('*').length, 0);
    const observer = new MutationObserver(ms => {
      if (!record.current) return;
      if (ms.some(m => (m.target as Element).closest?.('.fx-layer') || [...m.addedNodes].some(n => n instanceof Element && (n.matches('.fx-layer') || n.querySelector('.fx-layer'))))) record.current.peak = Math.max(record.current.peak, count());
    });
    observer.observe(document.body, {childList: true, subtree: true});
    const r: Recording = {start: performance.now(), frames: [], peak: count(), config, observer, timer: setTimeout(() => {
      if (record.current !== r) return;
      const s = stats(r.frames, performance.now() - r.start);
      const off = PARTS.filter(([p]) => r.config.off.includes(p)).map(([,name]) => name).join(', ') || 'ничего';
      setResult(`выкл: ${off}; кадров/с ср. ${s.fps.toFixed(1)}; худший ${s.worst.toFixed(1)} мс; >50 мс: ${s.slow}; узлов в слое эффектов (пик): ${r.peak}; устройство: ${navigator.userAgent.slice(0,160)}, экран ${innerWidth}×${innerHeight}×${devicePixelRatio}`);
      cancelRecord();
    }, 20000)};
    record.current = r;
  };
  const copyResult = async () => {
    try {await navigator.clipboard.writeText(result);setCopy('Скопировано');}
    catch {text.current?.focus();text.current?.select();text.current?.setSelectionRange(0,result.length);
      let copied = false; try {copied = document.execCommand('copy');} catch { /* manual copy remains available */ }
      setCopy(copied ? 'Скопировано' : 'Выделите текст и скопируйте');}
  };
  return createPortal(<aside className="perf-panel" data-testid="perf-panel" aria-label="Диагностика скорости">
    <div className="perf-readout">{value.fps.toFixed(0)} кадров/с · худший/10 с {value.worst.toFixed(0)} мс<br/>&gt;50 мс за 10 с: {value.slow}</div>
    <div className="perf-buttons"><button onClick={reset}>Сброс</button><button aria-expanded={parts} onClick={() => setParts(!parts)}>Части</button><button onClick={start} disabled={seconds !== null}>{seconds === null ? 'Записать 20 с' : `Запись: ${seconds} с`}</button></div>
    {parts && <fieldset className="perf-parts"><legend>Отключить части</legend>{PARTS.map(([part,name], i) => <label key={part}><input data-testid={`perf-${part}`} type="checkbox" checked={config.off.includes(part)} onChange={() => togglePart(part)}/>{i+1}. {name}</label>)}</fieldset>}
    {result && <div className="perf-result"><textarea ref={text} aria-label="Итог диагностики" readOnly value={result}/><button onClick={copyResult}>Копировать</button><span role="status">{copy}</span></div>}
  </aside>, document.body);
}
