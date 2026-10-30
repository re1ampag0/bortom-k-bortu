// «Админка» (docs/tasks/E9a, E9b, E9c): one screen for the author — «Данные» (the data editor and the presets),
// «Лаборатория» (bot games on two data sets) and «Сервер» (the presets of the game server). Opened by the link at the
// bottom of the start screen and by «?admin»; loaded only when opened.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { mainRaw } from '../data';
import { Arrow } from '../menus/Menus';
import { MAIN, loadPresets, newPresetId, storePresets, type Preset, type RawData } from '../presets';
import { DataPane, type PresetsApi } from './DataPane';
import { setAt, type Path } from './model';
import './admin.css';

type Tab = 'data' | 'lab' | 'server';
const TABS: { id: Tab; label: string }[] = [
  { id: 'data', label: 'Данные' },
  { id: 'lab', label: 'Лаборатория' },
  { id: 'server', label: 'Сервер' },
];
const SELECTED = 'bortom-k-bortu.admin-preset';

/** The presets of this browser with saving: edits are written a moment after the last keystroke. */
function usePresets(): PresetsApi {
  const [presets, setPresets] = useState<Preset[]>(loadPresets);
  const [selected, setSelected] = useState<string>(() => {
    try {
      const id = sessionStorage.getItem(SELECTED);
      return id && loadPresets().some((p) => p.id === id) ? id : MAIN;
    } catch {
      return MAIN;
    }
  });
  const [storeError, setStoreError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(presets);
  latest.current = presets;
  const save = useCallback((list: Preset[], now = false) => {
    if (timer.current) clearTimeout(timer.current);
    if (now) setStoreError(storePresets(list));
    else timer.current = setTimeout(() => setStoreError(storePresets(latest.current)), 300);
  }, []);
  useEffect(() => () => void (timer.current && (clearTimeout(timer.current), storePresets(latest.current))), []);
  const change = useCallback(
    (fn: (list: Preset[]) => Preset[], now = false) =>
      setPresets((list) => {
        const next = fn(list);
        save(next, now);
        return next;
      }),
    [save],
  );
  const select = useCallback((id: string) => {
    setSelected(id);
    try {
      sessionStorage.setItem(SELECTED, id);
    } catch {
      // A convenience only.
    }
  }, []);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const edit = useCallback(
    (path: Path, value: unknown) => change((list) => list.map((p) => (p.id === selectedRef.current ? { ...p, data: setAt(p.data, path, value), updated: Date.now() } : p))),
    [change],
  );
  return useMemo(
    () => ({
      presets,
      selected,
      select,
      storeError,
      edit,
      add(name: string, data: RawData) {
        const p: Preset = { id: newPresetId(), name, data, updated: Date.now() };
        change((list) => [...list, p], true);
        select(p.id);
      },
      rename(id: string, name: string) {
        change((list) => list.map((p) => (p.id === id ? { ...p, name, updated: Date.now() } : p)), true);
      },
      remove(id: string) {
        change((list) => list.filter((p) => p.id !== id), true);
        if (selectedRef.current === id) select(MAIN);
      },
      setData(id: string, data: RawData) {
        change((list) => list.map((p) => (p.id === id ? { ...p, data, updated: Date.now() } : p)), true);
      },
    }),
    [presets, selected, select, storeError, edit, change],
  );
}

export default function Admin({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('data');
  const api = usePresets();
  return (
    <div className="admin" data-testid="admin">
      <header className="admin-top">
        <button className="menu-link admin-back" onClick={onBack}>
          <Arrow back />
          <span>Назад</span>
        </button>
        <h1>Админка</h1>
        <nav className="admin-tabs" role="tablist" aria-label="Разделы админки">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} data-testid={`admin-${t.id}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="admin-body">{tab === 'data' && <DataPane api={api} base={mainRaw} />}</main>
    </div>
  );
}
