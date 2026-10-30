// «Данные»: the preset being edited (or «Основной», read only) — create, rename, delete, export, import, «Вернуть всё
// как в основном», the count of changed fields with their list, the problems of the set; under it the tables.
import { useDeferredValue, useMemo, useRef, useState, type ReactNode } from 'react';
import { MAIN, MAIN_NAME, downloadJson, freeName, parsePresetFile, presetFile, type Preset, type RawData } from '../presets';
import { DataTables } from './DataTab';
import { changedFields, getAt, problems, type Field, type Path } from './model';

export interface PresetsApi {
  presets: Preset[];
  selected: string;
  select(id: string): void;
  /** Adds a preset and selects it. */
  add(name: string, data: RawData): void;
  rename(id: string, name: string): void;
  remove(id: string): void;
  setData(id: string, data: RawData): void;
  edit(path: Path, value: unknown): void;
  /** A problem of the browser's storage, or null. */
  storeError: string | null;
}

type Form = null | { k: 'new' | 'rename'; name: string } | { k: 'delete' } | { k: 'reset' };

export function DataPane({ api, base, extra }: { api: PresetsApi; base: RawData; extra?: (raw: RawData, name: string, bad: boolean) => ReactNode }) {
  const preset = api.presets.find((p) => p.id === api.selected) ?? null;
  const raw = preset?.data ?? base;
  const name = preset?.name ?? MAIN_NAME;
  const [form, setForm] = useState<Form>(null);
  const [importError, setImportError] = useState<string[] | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const deferred = useDeferredValue(raw);
  const bad = useMemo(() => problems(deferred), [deferred]);
  const changes = useMemo(() => (preset ? changedFields(deferred, base) : []), [deferred, base, preset !== null]);

  const create = (wanted: string) => {
    api.add(freeName(api.presets, wanted), structuredClone(raw));
    setForm(null);
  };
  const doImport = async (f: File) => {
    setImportError(null);
    try {
      const parsed = parsePresetFile(JSON.parse(await f.text()), f.name);
      const found = problems(parsed.data);
      if (found.length > 0) {
        setImportError([`Файл «${f.name}» не принят: в данных ошибки.`, ...found]);
        return;
      }
      api.add(freeName(api.presets, parsed.name), parsed.data);
    } catch (e) {
      setImportError([`Файл «${f.name}» не принят: ${e instanceof SyntaxError ? 'это не JSON' : e instanceof Error ? e.message : String(e)}`]);
    }
  };

  return (
    <>
      <section className="admin-panel admin-presets" data-testid="presets">
        <div className="admin-preset-row">
          <label className="admin-form">
            <span className="admin-kicker">Набор данных</span>
            <select value={api.selected} onChange={(e) => (setForm(null), api.select(e.target.value))} data-testid="preset-select">
              <option value={MAIN}>{MAIN_NAME} (data/game-data.json)</option>
              {api.presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <div className="admin-status">
            {preset ? (
              <span data-testid="changed-count">Изменено: {changes.length}</span>
            ) : (
              <span>Основной набор не редактируется: создайте пресет — копию, которую можно менять.</span>
            )}
            {bad.length > 0 && <span className="admin-bad-count">Ошибок: {bad.length}</span>}
          </div>
        </div>
        <div className="admin-actions" role="group" aria-label="Пресеты">
          <button className="admin-btn primary" data-testid="preset-new" onClick={() => setForm({ k: 'new', name: preset ? `${preset.name} — копия` : 'Пресет' })}>
            Новый пресет
          </button>
          <button className="admin-btn" disabled={!preset} data-testid="preset-rename" onClick={() => setForm({ k: 'rename', name })}>
            Переименовать
          </button>
          <button className="admin-btn" disabled={!preset || changes.length === 0} data-testid="preset-reset" onClick={() => setForm({ k: 'reset' })}>
            Всё как в основном
          </button>
          <button className="admin-btn" data-testid="preset-export" onClick={() => downloadJson(`${name}.preset.json`, presetFile({ name, data: raw }))}>
            Экспорт
          </button>
          <button className="admin-btn" data-testid="preset-import" onClick={() => file.current?.click()}>
            Импорт
          </button>
          <button className="admin-btn danger" disabled={!preset} data-testid="preset-delete" onClick={() => setForm({ k: 'delete' })}>
            Удалить
          </button>
          <input ref={file} type="file" accept=".json,application/json" hidden data-testid="preset-file" onChange={(e) => (e.target.files?.[0] && doImport(e.target.files[0]), (e.target.value = ''))} />
        </div>
        {form && (form.k === 'new' || form.k === 'rename') && (
          <form
            className="admin-inline"
            onSubmit={(e) => {
              e.preventDefault();
              if (form.k === 'new') create(form.name);
              else if (preset) {
                api.rename(preset.id, freeName(api.presets.filter((p) => p.id !== preset.id), form.name));
                setForm(null);
              }
            }}
          >
            <label className="admin-form">
              <span>{form.k === 'new' ? `Новый пресет — копия набора «${name}»` : 'Новое имя'}</span>
              <input autoFocus value={form.name} maxLength={40} data-testid="preset-name" onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <button className="admin-btn primary" type="submit" data-testid="preset-save">
              {form.k === 'new' ? 'Создать' : 'Сохранить'}
            </button>
            <button className="admin-btn" type="button" onClick={() => setForm(null)}>
              Отмена
            </button>
          </form>
        )}
        {form?.k === 'delete' && preset && (
          <div className="admin-inline">
            <span>Удалить пресет «{preset.name}»? Его не вернуть, если нет экспорта.</span>
            <button className="admin-btn danger" data-testid="preset-delete-yes" onClick={() => (api.remove(preset.id), setForm(null))}>
              Удалить
            </button>
            <button className="admin-btn" onClick={() => setForm(null)}>
              Отмена
            </button>
          </div>
        )}
        {form?.k === 'reset' && preset && (
          <div className="admin-inline">
            <span>Вернуть все {changes.length} изменённых полей пресета «{preset.name}» как в основном?</span>
            <button className="admin-btn primary" onClick={() => (api.setData(preset.id, structuredClone(base)), setForm(null))}>
              Вернуть всё
            </button>
            <button className="admin-btn" onClick={() => setForm(null)}>
              Отмена
            </button>
          </div>
        )}
        {api.storeError && <p className="admin-error">{api.storeError}</p>}
        {importError && (
          <div className="admin-error" data-testid="import-error">
            {importError.map((x, i) => (
              <p key={i}>{x}</p>
            ))}
          </div>
        )}
        {bad.length > 0 && (
          <details className="admin-error" open data-testid="problems">
            <summary>Ошибки в данных — с ними нельзя играть и скачать как основной</summary>
            <ul>
              {bad.slice(0, 30).map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </details>
        )}
        {changes.length > 0 && (
          <details className="admin-changes">
            <summary>Что изменено</summary>
            <ul>
              {changes.slice(0, 200).map((f) => (
                <li key={f.path.join('.')}>
                  {[...f.where, f.label].join(' → ')}: {short(f, getAt(base, f.path))} → {short(f, getAt(raw, f.path))}
                </li>
              ))}
            </ul>
          </details>
        )}
        {extra?.(raw, name, bad.length > 0)}
      </section>
      <DataTables raw={raw} base={base} readOnly={!preset} onEdit={api.edit} />
    </>
  );
}

function short(f: Field, x: unknown): string {
  if (f.kind === 'bool') return x ? 'выключена' : 'в колоде';
  if (x === undefined) return '—';
  const t = typeof x === 'string' ? `«${x}»` : JSON.stringify(x);
  return t.length > 50 ? `${t.slice(0, 50)}…` : t;
}

