// «Админка → Сервер» (docs/tasks/E9c, step 3): the presets of the game server. «Загрузить на сервер» sends a preset of
// this browser with the administrator's password (the password is set in the server's .env by its owner; the page
// keeps what was typed only in sessionStorage, until the tab is closed); the list of the server's presets with
// «Удалить». The server's answer is shown as it came.
import { useCallback, useEffect, useState } from 'react';
import { chooseServer, storedServer, wsAddress } from '../../net/server-url';
import { httpBase } from '../../net/ws';
import { MAIN, MAIN_NAME, type Preset, type RawData } from '../presets';
import { problems } from './model';

const PASS = 'bortom-k-bortu.admin-pass';

interface ServerPreset {
  name: string;
  hash: string;
  updated: number;
}

type Answer = { ok: boolean; text: string } | null;

/** The address typed (or the server the page came from) as http(s)://host:port; a problem in Russian otherwise. */
function baseOf(text: string): { url: string | null; error: string | null } {
  if (!text.trim()) {
    const c = chooseServer('');
    return c.url ? { url: httpBase(c.url), error: null } : { url: null, error: 'Впишите адрес игрового сервера, например 192.168.1.23:8080' };
  }
  try {
    const ws = wsAddress(text);
    if (location.protocol === 'https:' && ws.startsWith('ws:')) {
      return { url: null, error: 'Сайт открыт по https и не может обратиться к серверу по http: откройте админку с адреса самого сервера или укажите сервер с https.' };
    }
    return { url: httpBase(ws), error: null };
  } catch {
    return { url: null, error: `Не понимаю адрес «${text}». Пример: 192.168.1.23:8080 или https://game.example.ru` };
  }
}

function readPass(): string {
  try {
    return sessionStorage.getItem(PASS) ?? '';
  } catch {
    return '';
  }
}

export function ServerTab({ presets, main }: { presets: Preset[]; main: RawData }) {
  const [address, setAddress] = useState(storedServer);
  const [password, setPassword] = useState(readPass);
  const [list, setList] = useState<ServerPreset[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [pick, setPick] = useState(presets[0]?.id ?? MAIN);
  const [serverName, setServerName] = useState(presets[0]?.name ?? '');
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<Answer>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const base = baseOf(address);

  const savePass = (p: string) => {
    setPassword(p);
    try {
      if (p) sessionStorage.setItem(PASS, p);
      else sessionStorage.removeItem(PASS);
    } catch {
      // Then the password is typed again after a reload.
    }
  };

  const refresh = useCallback(async () => {
    setListError(null);
    if (!base.url) return setList(null);
    try {
      const r = await fetch(`${base.url}/presets`);
      const body = await r.json();
      if (!r.ok) throw new Error(body.error ?? `ответ ${r.status}`);
      setList(body.presets);
    } catch (e) {
      setList(null);
      setListError(`Сервер ${base.url} не ответил: ${e instanceof Error ? e.message : String(e)}. Проверьте адрес и что сервер запущен.`);
    }
  }, [base.url]);
  useEffect(() => {
    const t = setTimeout(() => void refresh(), 400);
    return () => clearTimeout(t);
  }, [refresh]);

  const rawOf = (id: string) => (id === MAIN ? main : presets.find((p) => p.id === id)?.data);
  const choose = (id: string) => {
    setPick(id);
    setServerName(id === MAIN ? MAIN_NAME : (presets.find((p) => p.id === id)?.name ?? ''));
  };

  /** A request to the server with the password; the answer as it came. */
  const call = async (method: 'POST' | 'DELETE', path: string, body?: unknown) => {
    if (!base.url) return;
    setBusy(true);
    setAnswer(null);
    try {
      const r = await fetch(`${base.url}${path}`, {
        method,
        headers: { authorization: `Bearer ${password}`, 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const text = await r.text();
      let shown = text;
      try {
        const j = JSON.parse(text);
        shown = j.error ?? (method === 'POST' ? `Пресет «${j.name}» на сервере (хэш ${j.hash}).` : 'Пресет удалён.');
      } catch {
        // Not JSON: as it came.
      }
      setAnswer({ ok: r.ok, text: `${r.status}: ${shown}` });
      await refresh();
    } catch (e) {
      setAnswer({ ok: false, text: `Сервер не ответил: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setBusy(false);
    }
  };

  const raw = rawOf(pick);
  const bad = raw ? problems(raw) : ['нет данных'];
  const taken = list?.some((p) => p.name.toLowerCase() === serverName.trim().toLowerCase());

  return (
    <div data-testid="server">
      <section className="admin-panel">
        <h3>Сервер</h3>
        <div className="admin-lab-common">
          <label className="admin-form admin-grow">
            <span>Адрес игрового сервера</span>
            <input value={address} placeholder={chooseServer('').url ? `этот сервер (${location.host})` : '192.168.1.23:8080'} onChange={(e) => setAddress(e.target.value)} data-testid="server-address" />
          </label>
          <label className="admin-form">
            <span>Пароль администратора</span>
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => savePass(e.target.value)} data-testid="server-password" />
          </label>
        </div>
        {base.error && <p className="admin-problem">{base.error}</p>}
        <p className="admin-note">
          Пароль задаёт владелец сервера в файле <code>.env</code> рядом с сервером (DEPLOY.md). На сайте его нет; набранный здесь пароль хранится только
          до закрытия этой вкладки.
        </p>
      </section>

      <section className="admin-panel">
        <h3>Загрузить на сервер</h3>
        <div className="admin-lab-common">
          <label className="admin-form">
            <span>Набор данных</span>
            <select value={pick} onChange={(e) => choose(e.target.value)} data-testid="server-pick">
              <option value={MAIN}>{MAIN_NAME}</option>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  Пресет «{p.name}»
                </option>
              ))}
            </select>
          </label>
          <label className="admin-form">
            <span>Имя на сервере</span>
            <input value={serverName} maxLength={40} onChange={(e) => setServerName(e.target.value)} data-testid="server-name" />
          </label>
        </div>
        {bad.length > 0 && <p className="admin-problem">В наборе ошибки, сервер его не примет: {bad.slice(0, 3).join('; ')}</p>}
        {taken && <p className="admin-note">На сервере уже есть пресет с этим именем: он будет заменён.</p>}
        <div className="admin-actions">
          <button
            className="admin-btn primary"
            disabled={busy || !base.url || !password || !serverName.trim() || bad.length > 0}
            onClick={() => call('POST', '/admin/presets', { name: serverName.trim(), data: raw })}
            data-testid="server-upload"
          >
            Загрузить на сервер
          </button>
        </div>
        {answer && (
          <p className={answer.ok ? 'admin-ok' : 'admin-error'} data-testid="server-answer" role="status">
            Ответ сервера — {answer.text}
          </p>
        )}
      </section>

      <section className="admin-panel">
        <h3>Пресеты на сервере</h3>
        {listError && <p className="admin-error">{listError}</p>}
        {list && list.length === 0 && <p className="admin-note">На сервере пресетов нет: комнаты играют на основных данных.</p>}
        {list && list.length > 0 && (
          <div className="admin-scroll">
            <table className="admin-table admin-server-list" data-testid="server-list">
              <thead>
                <tr>
                  <th>Имя</th>
                  <th>Хэш</th>
                  <th>Загружен</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.name}>
                    <td>{p.name}</td>
                    <td>
                      <code>{p.hash}</code>
                    </td>
                    <td>{new Date(p.updated).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                    <td>
                      {confirm === p.name ? (
                        <span className="admin-confirm">
                          <button className="admin-btn danger" disabled={busy || !password} onClick={() => (setConfirm(null), call('DELETE', `/admin/presets/${encodeURIComponent(p.name)}`))}>
                            Да, удалить
                          </button>
                          <button className="admin-btn" onClick={() => setConfirm(null)}>
                            Нет
                          </button>
                        </span>
                      ) : (
                        <button className="admin-btn danger" disabled={busy || !password} onClick={() => setConfirm(p.name)} data-testid={`server-delete-${p.name}`}>
                          Удалить
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="admin-actions">
          <button className="admin-btn" disabled={!base.url} onClick={() => void refresh()}>
            Обновить список
          </button>
        </div>
        <p className="admin-note">Создатель комнаты выбирает пресет в «Игра по сети → Создать комнату». Комната хранит свою копию данных: удаление пресета не ломает начатые партии.</p>
      </section>
    </div>
  );
}
