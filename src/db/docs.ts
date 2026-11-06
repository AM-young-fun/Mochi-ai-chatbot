/**
 * Small settings documents: the bot list, the secrets and the dashboard password hash.
 *
 * - SQLite (local): files in DATA_DIR, as always: bots.json, secrets.json (0600), admin-password (0600).
 *   They stay easy to read, back up and edit by hand.
 * - PostgreSQL (remote): rows in the mochi_kv table, so the app keeps nothing on its own disk and
 *   can run on hosts without a persistent volume.
 */
import fs from "node:fs";
import path from "node:path";
import type { Db } from "./index.ts";

export type DocKey = "bots" | "secrets" | "admin-password";
export const DOC_KEYS: DocKey[] = ["bots", "secrets", "admin-password"];

const FILES: Record<DocKey, { name: string; private: boolean }> = {
  bots: { name: "bots.json", private: false },
  secrets: { name: "secrets.json", private: true },
  "admin-password": { name: "admin-password", private: true },
};

export interface DocStore {
  /** Where a document lives, for messages ("data/secrets.json", "the database"). */
  where(key: DocKey): string;
  get(key: DocKey): Promise<string | undefined>;
  set(key: DocKey, value: string): Promise<void>;
  delete(key: DocKey): Promise<void>;
}

export class FileDocs implements DocStore {
  constructor(private readonly dir: string) {}

  where(key: DocKey): string {
    return path.join(this.dir, FILES[key].name);
  }

  async get(key: DocKey): Promise<string | undefined> {
    try {
      return fs.readFileSync(this.where(key), "utf8");
    } catch {
      return undefined;
    }
  }

  async set(key: DocKey, value: string): Promise<void> {
    const file = this.where(key);
    if (!FILES[key].private) return fs.writeFileSync(file, value);
    fs.writeFileSync(file, value, { mode: 0o600 });
    try {
      fs.chmodSync(file, 0o600);
    } catch {
      /* best effort on filesystems without chmod */
    }
  }

  async delete(key: DocKey): Promise<void> {
    fs.rmSync(this.where(key), { force: true });
  }
}

export class DbDocs implements DocStore {
  private constructor(private readonly db: Db) {}

  static async open(db: Db): Promise<DbDocs> {
    await db.exec(`CREATE TABLE IF NOT EXISTS mochi_kv (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at BIGINT NOT NULL)`);
    return new DbDocs(db);
  }

  where(key: DocKey): string {
    return `the database (${key})`;
  }

  async get(key: DocKey): Promise<string | undefined> {
    return (await this.db.get<{ value: string }>(`SELECT value FROM mochi_kv WHERE key = ?`, [key]))?.value;
  }

  async set(key: DocKey, value: string): Promise<void> {
    await this.db.run(
      `INSERT INTO mochi_kv (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      [key, value, Date.now()],
    );
  }

  async delete(key: DocKey): Promise<void> {
    await this.db.run(`DELETE FROM mochi_kv WHERE key = ?`, [key]);
  }
}

/**
 * Writes go out in order, one after another, without making every caller await them.
 * flush() waits for the queue (shutdown, tests).
 */
export class WriteQueue {
  private tail: Promise<void> = Promise.resolve();

  constructor(private readonly label: string) {}

  push(write: () => Promise<void>): void {
    this.tail = this.tail.then(write).catch((e) => console.error(`[mochi] couldn't save ${this.label}: ${(e as Error).message}`));
  }

  flush(): Promise<void> {
    return this.tail;
  }
}
