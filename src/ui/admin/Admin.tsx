// «Админка» (docs/tasks/E9a, E9b, E9c): one screen for the author — «Данные» (the data editor and the presets),
// «Лаборатория» (bot games on two data sets) and «Сервер» (the presets of the game server). Opened by the link at the
// bottom of the start screen and by «?admin»; loaded only when opened.
import { useCallback, useState } from 'react';
import { mainRaw } from '../data';
import { Arrow } from '../menus/Menus';
import { DataTables } from './DataTab';
import { setAt, type Path, type Raw } from './model';
import './admin.css';

type Tab = 'data' | 'lab' | 'server';
const TABS: { id: Tab; label: string }[] = [
  { id: 'data', label: 'Данные' },
  { id: 'lab', label: 'Лаборатория' },
  { id: 'server', label: 'Сервер' },
];

export default function Admin({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('data');
  const [draft, setDraft] = useState<Raw>(() => structuredClone(mainRaw));
  const edit = useCallback((path: Path, value: unknown) => setDraft((d) => setAt(d, path, value)), []);
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
      <main className="admin-body">{tab === 'data' && <DataTables raw={draft} base={mainRaw} readOnly={false} onEdit={edit} />}</main>
    </div>
  );
}
