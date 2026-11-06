/**
 * Moves everything Mochi stores from one database to another: bots, secrets, the dashboard
 * password, memory (messages, people, rooms), usage and knowledge bases.
 *
 * Both ends are a DATABASE_URL: "local" (or empty) is the SQLite file in DATA_DIR, postgres://…
 * a PostgreSQL server. The source is only read. The target must be empty unless `wipe` is set.
 */
import { DbDocs, DOC_KEYS, FileDocs, type DocStore } from "./docs.ts";
import { openDb, type Db } from "./index.ts";
import { KnowledgeStore } from "../knowledge/store.ts";
import { MemoryStore } from "../memory/store.ts";

interface Table {
  name: string;
  cols: string[];
  /** Ordering that keeps rows in their original order. */
  order: string;
  /** Has an auto-numbered id that's copied as is. */
  serial?: boolean;
}

const TABLES: Table[] = [
  { name: "messages", cols: ["id", "bot_id", "platform", "room_id", "user_id", "user_name", "text", "has_image", "is_bot", "ts"], order: "id", serial: true },
  { name: "people", cols: ["bot_id", "platform", "user_id", "display_name", "personality", "facts", "interests", "message_count", "first_seen", "last_seen"], order: "bot_id, platform, user_id" },
  { name: "rooms", cols: ["bot_id", "platform", "room_id", "title", "summary", "recent_topics", "msgs_since_update", "updated_at"], order: "bot_id, platform, room_id" },
  { name: "usage", cols: ["id", "bot_id", "day", "ts", "feature", "model", "prompt_tokens", "completion_tokens"], order: "id", serial: true },
  { name: "kb_docs", cols: ["id", "bot_id", "title", "source", "source_ref", "chars", "chunks", "created_at"], order: "id", serial: true },
  // Chunks get new ids in the target; their order (and so each document's text) is kept.
  { name: "kb_chunks", cols: ["body", "bot_id", "doc_id"], order: "" },
];

const PAGE = 500;

export interface CopyResult {
  docs: string[];
  rows: Record<string, number>;
}

export interface Endpoint {
  url?: string;
  dataDir: string;
}

async function openEnd(e: Endpoint): Promise<{ db: Db; docs: DocStore }> {
  const db = await openDb(e);
  await MemoryStore.open(db);
  await KnowledgeStore.open(db);
  const docs = db.dialect === "postgres" ? await DbDocs.open(db) : new FileDocs(e.dataDir);
  return { db, docs };
}

export async function countRows(db: Db): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const t of TABLES) out[t.name] = Number((await db.get(`SELECT COUNT(*) AS n FROM ${t.name}`))?.n ?? 0);
  return out;
}

export async function copyDatabase(
  from: Endpoint,
  to: Endpoint,
  opts: { wipe?: boolean; log?: (line: string) => void } = {},
): Promise<CopyResult> {
  const log = opts.log ?? (() => {});
  const src = await openEnd(from);
  const dst = await openEnd(to);
  try {
    if (src.db.label === dst.db.label) throw new Error("The source and the target are the same database.");
    const existing = await countRows(dst.db);
    const hasDocs = (await Promise.all(DOC_KEYS.map((k) => dst.docs.get(k)))).some((v) => v !== undefined);
    const busy = Object.values(existing).some((n) => n > 0) || hasDocs;
    if (busy && !opts.wipe)
      throw new Error(`${dst.db.label} already has Mochi data. Add --wipe to replace it with the copy (its current data is deleted).`);

    const result: CopyResult = { docs: [], rows: {} };
    await dst.db.tx(async (tx) => {
      if (busy) for (const t of [...TABLES].reverse()) await tx.run(`DELETE FROM ${t.name}`);
      for (const t of TABLES) {
        const order = t.order || (src.db.dialect === "sqlite" ? "rowid" : "id");
        let copied = 0;
        for (let offset = 0; ; offset += PAGE) {
          const rows = await src.db.all(`SELECT ${t.cols.join(", ")} FROM ${t.name} ORDER BY ${order} LIMIT ? OFFSET ?`, [PAGE, offset]);
          if (!rows.length) break;
          const one = `(${t.cols.map(() => "?").join(", ")})`;
          await tx.run(
            `INSERT INTO ${t.name} (${t.cols.join(", ")}) VALUES ${rows.map(() => one).join(", ")}`,
            rows.flatMap((r) => t.cols.map((c) => r[c])),
          );
          copied += rows.length;
          if (rows.length < PAGE) break;
        }
        // Rows came in with their ids: move the counter past them so new rows don't collide.
        if (t.serial && tx.dialect === "postgres")
          await tx.get(`SELECT setval(pg_get_serial_sequence('${t.name}', 'id'), GREATEST(COALESCE(MAX(id), 0), 1)) FROM ${t.name}`);
        result.rows[t.name] = copied;
        log(`  ${t.name}: ${copied}`);
      }
    });

    for (const k of DOC_KEYS) {
      const v = await src.docs.get(k);
      if (v === undefined) {
        if (busy) await dst.docs.delete(k);
        continue;
      }
      await dst.docs.set(k, v);
      result.docs.push(k);
      log(`  ${k}: copied`);
    }
    return result;
  } finally {
    await src.db.close();
    await dst.db.close();
  }
}
