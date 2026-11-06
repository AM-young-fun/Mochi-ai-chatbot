import pg from "pg";
import type { Db } from "./index.ts";
import { redactUrl } from "./index.ts";

// BIGINT and COUNT(*) come back as strings by default; Mochi's numbers (ms timestamps, counts,
// token totals) all fit in a double, so read them as numbers.
pg.types.setTypeParser(20, (v) => Number(v)); // int8
pg.types.setTypeParser(1700, (v) => Number(v)); // numeric (SUM of int8)

/** `?` → `$1, $2…`, leaving question marks inside quoted strings and identifiers alone. */
export function toPgParams(sql: string): string {
  let out = "";
  let n = 0;
  let quote: string | null = null;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (quote) {
      out += ch;
      if (ch === quote) quote = null;
    } else if (ch === "'" || ch === '"') {
      quote = ch;
      out += ch;
    } else if (ch === "?") {
      out += "$" + ++n;
    } else out += ch;
  }
  return out;
}

type Queryable = pg.Pool | pg.PoolClient;

class PgConn implements Db {
  readonly dialect = "postgres" as const;
  constructor(
    protected readonly q: Queryable,
    readonly label: string,
  ) {}

  async all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    return (await this.q.query(toPgParams(sql), params as any[])).rows as T[];
  }

  async get<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    return (await this.all<T>(sql, params))[0];
  }

  async run(sql: string, params: unknown[] = []): Promise<{ changes: number }> {
    const r = await this.q.query(toPgParams(sql), params as any[]);
    return { changes: r.rowCount ?? 0 };
  }

  async exec(sql: string): Promise<void> {
    await this.q.query(sql);
  }

  tx<T>(fn: (db: Db) => Promise<T>): Promise<T> {
    return fn(this); // already inside one
  }

  async close(): Promise<void> {}
}

/** PostgreSQL through node-postgres, with a small pool. */
export class PostgresDb extends PgConn {
  private constructor(private readonly pool: pg.Pool, label: string) {
    super(pool, label);
  }

  static async connect(url: string): Promise<PostgresDb> {
    const pool = new pg.Pool({ connectionString: url, max: Number(process.env.DATABASE_POOL_SIZE) || 5 });
    pool.on("error", (e) => console.error(`[mochi] database connection error: ${e.message}`));
    const db = new PostgresDb(pool, `PostgreSQL ${redactUrl(url)}`);
    try {
      await pool.query("SELECT 1");
    } catch (e) {
      await pool.end().catch(() => undefined);
      throw new Error(`Can't connect to the database at ${redactUrl(url)}: ${(e as Error).message}`);
    }
    return db;
  }

  override async tx<T>(fn: (db: Db) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const out = await fn(new PgConn(client, this.label));
      await client.query("COMMIT");
      return out;
    } catch (e) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw e;
    } finally {
      client.release();
    }
  }

  override async close(): Promise<void> {
    await this.pool.end();
  }
}
