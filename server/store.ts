// Rooms on disk: server-data/rooms/<code>.json, written after every change (docs/TZ.md, «Игровой сервер»): after a
// restart of the server the games go on. A file is written to a temporary name and renamed, so a crash in the middle
// of a write does not spoil it.
import { mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RoomRecord } from './rooms';

export class RoomStore {
  private readonly dir: string;

  constructor(dataDir: string) {
    this.dir = join(dataDir, 'rooms');
    mkdirSync(this.dir, { recursive: true });
  }

  save(record: RoomRecord): void {
    const file = join(this.dir, `${record.code}.json`);
    const tmp = `${file}.tmp`;
    writeFileSync(tmp, JSON.stringify(record));
    renameSync(tmp, file);
  }

  remove(code: string): void {
    rmSync(join(this.dir, `${code}.json`), { force: true });
  }

  /** All saved rooms; a broken file is reported and skipped. */
  load(onError: (file: string, error: unknown) => void): RoomRecord[] {
    const out: RoomRecord[] = [];
    for (const name of readdirSync(this.dir)) {
      if (!name.endsWith('.json')) continue;
      try {
        const r = JSON.parse(readFileSync(join(this.dir, name), 'utf8')) as RoomRecord;
        if (r.format === 'bortom-k-bortu/room' && r.version === 1) out.push(r);
      } catch (e) {
        onError(name, e);
      }
    }
    return out;
  }
}
