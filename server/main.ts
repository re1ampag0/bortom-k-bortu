// Starts the game server: `npm run lan` (Wi-Fi, prints the addresses for other devices and a QR code) or
// `npm run server` / Docker (a VPS). Settings: --port / PORT (8080), HOST (0.0.0.0), DATA_DIR (server-data),
// STATIC_DIR (dist), ALLOWED_ORIGINS (comma-separated pages of other sites allowed to connect).
import { networkInterfaces } from 'node:os';
import QRCode from 'qrcode';
import { BASE, startServer } from './index';

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const value = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const port = Number(value('port') ?? process.env.PORT ?? 8080);
const lan = flag('lan');

/** IPv4 addresses of this computer in local networks, home Wi-Fi first; virtual adapters last. */
function lanAddresses(): { name: string; address: string }[] {
  const out: { name: string; address: string; rank: number }[] = [];
  for (const [name, list] of Object.entries(networkInterfaces())) {
    for (const a of list ?? []) {
      if (a.family !== 'IPv4' || a.internal) continue;
      const virtual = /vEthernet|VirtualBox|VMware|WSL|Hyper-V|docker|br-|veth|utun|tailscale|zerotier/i.test(name);
      const home = /^192\.168\./.test(a.address) ? 0 : /^10\./.test(a.address) ? 1 : /^172\.(1[6-9]|2\d|3[01])\./.test(a.address) ? 2 : 3;
      out.push({ name, address: a.address, rank: home + (virtual ? 10 : 0) });
    }
  }
  return out.sort((a, b) => a.rank - b.rank);
}

try {
  const server = await startServer({
    port,
    host: process.env.HOST ?? '0.0.0.0',
    dataDir: process.env.DATA_DIR ?? 'server-data',
    staticDir: process.env.STATIC_DIR ?? 'dist',
    allowedOrigins: (process.env.ALLOWED_ORIGINS ?? '').split(',').map((x) => x.trim()),
    log: (text) => console.log(text),
  });
  const local = `http://localhost:${server.port}`;
  console.log('');
  console.log('Сервер «Бортом к борту» запущен.');
  console.log(`На этом компьютере откройте: ${local}`);
  if (lan) {
    const list = lanAddresses();
    if (list.length === 0) {
      console.log('Адрес в сети не найден: подключите компьютер к Wi-Fi и перезапустите (подробнее — DEPLOY.md).');
    } else {
      const url = `http://${list[0].address}:${server.port}`;
      console.log('');
      console.log(`На других устройствах в той же Wi-Fi сети откройте: ${url}`);
      for (const other of list.slice(1)) console.log(`  (если не открывается, попробуйте: http://${other.address}:${server.port} — ${other.name})`);
      console.log('');
      console.log('Или наведите камеру телефона на этот код:');
      console.log(await QRCode.toString(`${url}${BASE}`, { type: 'terminal', small: true }));
    }
    console.log('Не закрывайте это окно, пока идёт игра. Остановить сервер: Ctrl+C.');
  }
  console.log(`Проверка: ${local}/health`);
  const stop = async () => {
    await server.close();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
} catch (e) {
  const err = e as NodeJS.ErrnoException;
  if (err.code === 'EADDRINUSE') {
    console.error(`Порт ${port} уже занят: возможно, сервер уже запущен в другом окне. Закройте его или запустите на другом порту: npm run lan -- --port 8081`);
  } else {
    console.error(err);
  }
  process.exit(1);
}
