// Where the game server is (docs/TZ.md, «Игровой сервер»; DEPLOY.md). The site opened from our server (`npm run
// lan`, a VPS) talks to the same address. The site on GitHub Pages talks to VITE_SERVER_URL (set at the build) or to
// the address typed in the settings. A page opened over https may not talk to ws:// — the browser forbids it, so
// the player gets a clear message instead of a silent failure.
const KEY = 'bortom-k-bortu.server';

/** The address the player typed, or ''. */
export function storedServer(): string {
  try {
    return localStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
}

export function storeServer(text: string): void {
  try {
    if (text.trim()) localStorage.setItem(KEY, text.trim());
    else localStorage.removeItem(KEY);
  } catch {
    // The address is a convenience: without storage it is typed again.
  }
}

/** The page is on GitHub Pages (or another static host): it cannot be the game server itself. */
export function onStaticHost(host = location.hostname): boolean {
  return host.endsWith('.github.io');
}

/** «192.168.1.23:8080», «http://…», «wss://…/ws» → a WebSocket address ending with /ws. */
export function wsAddress(text: string, pageProtocol = location.protocol): string {
  let t = text.trim();
  if (!/^[a-z]+:\/\//i.test(t)) t = `${pageProtocol === 'https:' ? 'https' : 'http'}://${t}`;
  const url = new URL(t);
  if (url.protocol === 'http:') url.protocol = 'ws:';
  if (url.protocol === 'https:') url.protocol = 'wss:';
  if (url.pathname === '/' || url.pathname === '') url.pathname = '/ws';
  return url.toString().replace(/\/$/, '');
}

export interface ServerChoice {
  url: string | null;
  /** Why the game cannot connect, in Russian. */
  error: string | null;
  /** The address came from the page itself (our server). */
  sameOrigin: boolean;
}

export function chooseServer(typed = storedServer(), env: string | undefined = import.meta.env.VITE_SERVER_URL): ServerChoice {
  const staticHost = onStaticHost();
  const text = typed || (staticHost ? (env ?? '') : '');
  if (!text) {
    if (staticHost) {
      return {
        url: null,
        error:
          'Адрес игрового сервера не задан. Если играете по Wi-Fi, откройте игру с адреса, который показал сервер (например, http://192.168.1.23:8080), или впишите адрес сервера в поле ниже.',
        sameOrigin: false,
      };
    }
    return { url: `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`, error: null, sameOrigin: true };
  }
  let url: string;
  try {
    url = wsAddress(text);
  } catch {
    return { url: null, error: `Не понимаю адрес сервера «${text}». Пример: 192.168.1.23:8080 или wss://game.example.ru`, sameOrigin: false };
  }
  if (location.protocol === 'https:' && url.startsWith('ws:')) {
    const http = url.replace(/^ws:/, 'http:').replace(/\/ws$/, '');
    return {
      url: null,
      error: `Сайт открыт по https и не может подключиться к ${url}: браузер это запрещает. Откройте игру с адреса сервера — ${http} — или укажите сервер с https (wss://).`,
      sameOrigin: false,
    };
  }
  return { url, error: null, sameOrigin: false };
}
