/**
 * Storage adapter. Mochi keeps everything in one database, chosen by DATABASE_URL:
 *
 *   (unset) or sqlite:…        → a SQLite file in DATA_DIR (local, nothing to install)
 *   postgres://… postgresql://… → a PostgreSQL server (remote, the app itself keeps no state)
 *
 * The stores write SQL once, with `?` placeholders and the few column types spelled through
 * `ddl()`; each driver turns that into its own dialect. Switching between the two keeps all
 * data when it goes through `npm run db:copy` (src/db/copy.ts).
 */
import fs from "node:fs";
import path from "node:path";

export type Dialect = "sqlite" | "postgres";

export interface Db {
  readonly dialect: Dialect;
  /** Where the data lives, safe to print (no password). */
  readonly label: string;
  all<T = any>(sql: string, params?: unknown[]): Promise<T[]>;
  get<T = any>(sql: string, params?: unknown[]): Promise<T | undefined>;
  run(sql: string, params?: unknown[]): Promise<{ changes: number }>;
  /** Several statements without parameters (schema). */
  exec(sql: string): Promise<void>;
  /** Runs fn inside one transaction, on one connection. */
  tx<T>(fn: (db: Db) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

/**
 * Column types that differ between the two. Write `{id}`, `{bigint}` in CREATE TABLE statements:
 *   {id}     auto-numbered primary key
 *   {bigint} 64-bit integer (millisecond timestamps don't fit Postgres's INTEGER)
 */
export function ddl(dialect: Dialect, sql: string): string {
  return sql
    .replaceAll("{id}", dialect === "postgres" ? "BIGSERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT")
    .replaceAll("{bigint}", dialect === "postgres" ? "BIGINT" : "INTEGER");
}

export interface OpenOptions {
  /** DATABASE_URL; empty for SQLite in dataDir. */
  url?: string;
  dataDir: string;
}

export function dialectOf(url: string | undefined): Dialect {
  const u = (url ?? "").trim();
  if (!u || u.startsWith("sqlite:")) return "sqlite";
  if (/^postgres(ql)?:\/\//i.test(u)) return "postgres";
  throw new Error(`DATABASE_URL must start with postgres:// or postgresql:// (or be empty for SQLite), got "${u.split(":")[0]}:…"`);
}

/** SQLite file for a sqlite: URL or the default one in dataDir. */
export function sqlitePath(url: string | undefined, dataDir: string): string {
  const u = (url ?? "").trim().replace(/^sqlite:(\/\/)?/, "");
  if (!u) return path.join(dataDir, "mochi.db");
  const p = path.resolve(dataDir, u);
  return fs.existsSync(p) && fs.statSync(p).isDirectory() ? path.join(p, "mochi.db") : p;
}

export async function openDb(opts: OpenOptions): Promise<Db> {
  if (dialectOf(opts.url) === "postgres") {
    const { PostgresDb } = await import("./postgres.ts");
    return PostgresDb.connect(opts.url!);
  }
  const { SqliteDb } = await import("./sqlite.ts");
  return new SqliteDb(sqlitePath(opts.url, opts.dataDir));
}

/** postgres://user:secret@host/db → postgres://user:•••@host/db */
export function redactUrl(url: string): string {
  return url.replace(/(\/\/[^:/@]+:)[^@]*@/, "$1•••@");
}
