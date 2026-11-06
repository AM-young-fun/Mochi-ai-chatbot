/**
 * Opens everything Mochi stores, on the database DATABASE_URL picks (see ./index.ts).
 */
import { BotRegistry } from "../core/bots.ts";
import { SecretsStore } from "../core/secrets.ts";
import { KnowledgeStore } from "../knowledge/store.ts";
import { MemoryStore } from "../memory/store.ts";
import { DbDocs, DOC_KEYS, FileDocs, WriteQueue, type DocStore } from "./docs.ts";
import { openDb, type Db } from "./index.ts";
import { CachedKnowledgeStore, CachedMemoryStore, cacheEnabled } from "./cache.ts";

export interface Storage {
  db: Db;
  docs: DocStore;
  bots: BotRegistry;
  secrets: SecretsStore;
  store: MemoryStore;
  knowledge: KnowledgeStore;
  /** The dashboard password hash kept in the documents (not .env). */
  adminFallback: { value?: string; where: string; save(hash: string): void };
  close(): Promise<void>;
}

export async function openStorage(opts: {
  url?: string;
  dataDir: string;
  log?: (line: string) => void;
  /** RAM layer in front of the database (default: on unless STORAGE_CACHE=off). */
  cache?: boolean;
}): Promise<Storage> {
  const db = await openDb(opts);
  let docs: DocStore;
  if (db.dialect === "postgres") {
    docs = await DbDocs.open(db);
    await importLocalDocs(docs as DbDocs, new FileDocs(opts.dataDir), opts.log);
  } else {
    docs = new FileDocs(opts.dataDir);
  }
  const cache = opts.cache ?? cacheEnabled();
  const store = cache ? await CachedMemoryStore.openCached(db) : await MemoryStore.open(db);
  const knowledge = cache ? await CachedKnowledgeStore.openCached(db) : await KnowledgeStore.open(db);
  const bots = await BotRegistry.open(docs, db.dialect === "sqlite" ? opts.dataDir : undefined);
  const secrets = await SecretsStore.open(docs);
  const adminWrites = new WriteQueue("the dashboard password");
  const adminFallback = {
    value: (await docs.get("admin-password"))?.trim() || undefined,
    where: docs.where("admin-password"),
    save: (hash: string) => adminWrites.push(() => docs.set("admin-password", hash + "\n")),
  };
  return {
    db,
    docs,
    bots,
    secrets,
    store,
    knowledge,
    adminFallback,
    async close() {
      await Promise.all([bots.flush(), secrets.flush(), adminWrites.flush()]);
      await store.close(); // writes what the RAM layer still holds, then closes the database
    },
  };
}

/**
 * First start on a fresh PostgreSQL from a machine that already ran Mochi locally: bring the bot
 * list, secrets and password along, so nothing has to be set up again. Only fills keys that are
 * still empty; memory and knowledge move with `npm run db -- copy`.
 */
async function importLocalDocs(to: DbDocs, from: FileDocs, log = console.log): Promise<void> {
  for (const key of DOC_KEYS) {
    if ((await to.get(key)) !== undefined) continue;
    const local = await from.get(key);
    if (local === undefined) continue;
    await to.set(key, local);
    log(`[mochi] copied ${from.where(key)} into the database`);
  }
}
