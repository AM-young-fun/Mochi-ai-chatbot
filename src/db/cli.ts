/**
 * npm run db -- <command>
 *
 *   info                         which database Mochi uses, and what's in it
 *   copy --to <url>              copy everything from the current database to another one
 *   copy --from <url> --to <url> … or between any two
 *   reset-password               forget the dashboard password (choose a new one on the next visit)
 *
 * <url> is "local" for the SQLite file in DATA_DIR, or postgres://user:pass@host:5432/db.
 * The current database is DATABASE_URL from .env (empty = local). Add --wipe to copy over a
 * target that already has data (its data is deleted first).
 */
import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { copyDatabase, countRows } from "./copy.ts";
import { DbDocs, FileDocs } from "./docs.ts";
import { openDb, redactUrl } from "./index.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dataDir = path.resolve(process.env.DATA_DIR || path.join(root, "data"));
const current = process.env.DATABASE_URL ?? "";

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? (args[i + 1] ?? "") : undefined;
};
const url = (v: string | undefined) => (!v || v === "local" ? "" : v);
const show = (u: string) => (u ? redactUrl(u) : `local (SQLite in ${dataDir})`);

async function main() {
  const cmd = args[0];
  if (cmd === "info") {
    const db = await openDb({ url: current, dataDir });
    try {
      console.log(`Mochi stores its data in: ${db.label}`);
      const counts = await countRows(db).catch(() => null);
      if (counts) for (const [t, n] of Object.entries(counts)) console.log(`  ${t}: ${n}`);
      else console.log("  (empty: Mochi hasn't started on it yet)");
    } finally {
      await db.close();
    }
    return;
  }
  if (cmd === "copy") {
    const from = url(flag("from") ?? current);
    const to = flag("to");
    if (to === undefined) throw new Error('Say where to copy to: --to local, or --to "postgres://user:pass@host:5432/db"');
    console.log(`Copying ${show(from)}\n     to ${show(url(to))}`);
    console.log("Stop Mochi first, so nothing changes halfway.");
    await copyDatabase({ url: from, dataDir }, { url: url(to), dataDir }, { wipe: args.includes("--wipe"), log: console.log });
    console.log(
      url(to)
        ? "Done. To switch, set DATABASE_URL to that address in .env (or your host's settings) and start Mochi."
        : "Done. To switch, remove DATABASE_URL from .env (or leave it empty) and start Mochi.",
    );
    return;
  }
  if (cmd === "reset-password") {
    const db = await openDb({ url: current, dataDir });
    try {
      const docs = db.dialect === "postgres" ? await DbDocs.open(db) : new FileDocs(dataDir);
      await docs.delete("admin-password");
      console.log(`Removed the dashboard password from ${docs.where("admin-password")}.`);
      console.log("If ADMIN_TOKEN is set in .env, empty it too. Then restart Mochi and choose a new password.");
    } finally {
      await db.close();
    }
    return;
  }
  console.log(`Usage:
  npm run db -- info
  npm run db -- copy --to <url> [--from <url>] [--wipe]
  npm run db -- reset-password

<url>: "local" (SQLite in ${dataDir}) or postgres://user:pass@host:5432/db
Current: ${show(current)}`);
}

main().catch((e) => {
  console.error(`Error: ${(e as Error).message}`);
  process.exit(1);
});
