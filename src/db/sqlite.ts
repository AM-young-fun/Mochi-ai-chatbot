import { DatabaseSync } from "node:sqlite";
import type { Db } from "./index.ts";

/** SQLite through Node's built-in node:sqlite (no native modules). Synchronous underneath. */
export class SqliteDb implements Db {
  readonly dialect = "sqlite" as const;
  readonly label: string;
  readonly raw: DatabaseSync;
  private txQueue: Promise<unknown> = Promise.resolve();

  constructor(file: string) {
    this.label = `SQLite ${file}`;
    this.raw = new DatabaseSync(file);
    if (file !== ":memory:") this.raw.exec("PRAGMA journal_mode = WAL;");
    this.raw.exec("PRAGMA busy_timeout = 5000;");
  }

  async all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    return this.raw.prepare(sql).all(...(params as any[])) as T[];
  }

  async get<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    return this.raw.prepare(sql).get(...(params as any[])) as T | undefined;
  }

  async run(sql: string, params: unknown[] = []): Promise<{ changes: number }> {
    const r = this.raw.prepare(sql).run(...(params as any[]));
    return { changes: Number(r.changes) };
  }

  async exec(sql: string): Promise<void> {
    this.raw.exec(sql);
  }

  /** One connection: transactions take turns. */
  tx<T>(fn: (db: Db) => Promise<T>): Promise<T> {
    const next = this.txQueue.then(async () => {
      this.raw.exec("BEGIN");
      try {
        const out = await fn(this);
        this.raw.exec("COMMIT");
        return out;
      } catch (e) {
        this.raw.exec("ROLLBACK");
        throw e;
      }
    });
    this.txQueue = next.catch(() => undefined);
    return next;
  }

  async close(): Promise<void> {
    try {
      this.raw.close();
    } catch {
      /* already closed */
    }
  }
}
