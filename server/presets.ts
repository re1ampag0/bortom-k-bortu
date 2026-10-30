// Presets of the game data on the server (docs/tasks/E9c-server-admin.md): server-data/presets/, one file per preset.
// Anyone may list them and load one (a room is played on it); only the administrator may add or delete them, with the
// password ADMIN_PASSWORD from the server's .env (never in the site's code). A preset passes the same data loader as
// the game. The file name is made from the name in lower case, so «Тест» and «тест» are one preset (Windows does
// not tell them apart either).
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadGameData } from '../src/engine/data';
import type { GameData } from '../src/engine/types';

export interface PresetRecord {
  format: 'bortom-k-bortu/preset';
  version: 1;
  name: string;
  /** Of the data: clients cache the loaded data by it. */
  hash: string;
  updated: number;
  data: Record<string, unknown>;
}

export type PresetInfo = Pick<PresetRecord, 'name' | 'hash' | 'updated'>;

export const NAME_MAX = 40;
const NAME_OK = /^[\p{L}\p{N} _\-.,()«»!+]+$/u;

/** The problem of a preset's name in Russian, or null. */
export function nameProblem(name: unknown): string | null {
  if (typeof name !== 'string' || name.trim() === '') return 'нет имени пресета';
  if (name.trim().length > NAME_MAX) return `имя пресета длиннее ${NAME_MAX} знаков`;
  if (!NAME_OK.test(name.trim())) return 'в имени пресета можно буквы, цифры, пробел и знаки - _ . , ( ) « » ! +';
  return null;
}

export const dataHash = (data: unknown) => createHash('sha256').update(JSON.stringify(data)).digest('hex').slice(0, 16);

const fileOf = (name: string) => `${createHash('sha256').update(name.trim().toLowerCase()).digest('hex').slice(0, 24)}.json`;

export class PresetStore {
  private readonly dir: string;
  private readonly loaded = new Map<string, GameData>();

  constructor(dataDir: string) {
    this.dir = join(dataDir, 'presets');
    mkdirSync(this.dir, { recursive: true });
  }

  list(): PresetInfo[] {
    const out: PresetInfo[] = [];
    for (const file of readdirSync(this.dir)) {
      if (!file.endsWith('.json')) continue;
      const r = this.read(file);
      if (r) out.push({ name: r.name, hash: r.hash, updated: r.updated });
    }
    return out.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }

  get(name: string): PresetRecord | null {
    return nameProblem(name) ? null : this.read(fileOf(name));
  }

  /** The checked game data of a preset (cached by hash), or null. */
  gameData(name: string): { record: PresetRecord; data: GameData } | null {
    const record = this.get(name);
    if (!record) return null;
    let data = this.loaded.get(record.hash);
    if (!data) {
      data = loadGameData(record.data);
      this.loaded.set(record.hash, data);
    }
    return { record, data };
  }

  /** Adds or replaces a preset. Throws DataError when the data does not pass the loader. */
  put(name: string, data: unknown): PresetInfo {
    loadGameData(data);
    const record: PresetRecord = {
      format: 'bortom-k-bortu/preset',
      version: 1,
      name: name.trim(),
      hash: dataHash(data),
      updated: Date.now(),
      data: data as Record<string, unknown>,
    };
    const file = join(this.dir, fileOf(name));
    writeFileSync(`${file}.tmp`, JSON.stringify(record));
    renameSync(`${file}.tmp`, file);
    return { name: record.name, hash: record.hash, updated: record.updated };
  }

  remove(name: string): boolean {
    if (!this.get(name)) return false;
    rmSync(join(this.dir, fileOf(name)), { force: true });
    return true;
  }

  private read(file: string): PresetRecord | null {
    try {
      const r = JSON.parse(readFileSync(join(this.dir, file), 'utf8')) as PresetRecord;
      return r.format === 'bortom-k-bortu/preset' && r.version === 1 && typeof r.name === 'string' ? r : null;
    } catch {
      return null;
    }
  }
}

