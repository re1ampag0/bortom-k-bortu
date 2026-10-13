// Addresses of this computer in local networks: printed by `npm run lan` and given to the page (GET /lan), so the
// link and the QR code of a room work on other devices even when the host opened the game as localhost.
import { networkInterfaces } from 'node:os';

/** IPv4 addresses in local networks, home Wi-Fi first; virtual adapters (VirtualBox, WSL, Docker…) last. */
export function lanAddresses(): { name: string; address: string }[] {
  const out: { name: string; address: string; rank: number }[] = [];
  for (const [name, list] of Object.entries(networkInterfaces())) {
    for (const a of list ?? []) {
      if (a.family !== 'IPv4' || a.internal) continue;
      const virtual = /vEthernet|VirtualBox|VMware|WSL|Hyper-V|docker|br-|veth|utun|tailscale|zerotier/i.test(name);
      const home = /^192\.168\./.test(a.address) ? 0 : /^10\./.test(a.address) ? 1 : /^172\.(1[6-9]|2\d|3[01])\./.test(a.address) ? 2 : 3;
      out.push({ name, address: a.address, rank: home + (virtual ? 10 : 0) });
    }
  }
  return out.sort((a, b) => a.rank - b.rank).map(({ name, address }) => ({ name, address }));
}
