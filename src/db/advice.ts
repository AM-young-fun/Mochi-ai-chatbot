/**
 * Storage advice: what Mochi is using (database, RAM layer, memory on this machine) and what the
 * owner should do about it. Shown once in the server log at start and on the dashboard's Storage page.
 *
 * Tip texts are English sentences with {placeholders}; the dashboard translates them through its
 * i18n table, so keep them in sync with public/dashboard/i18n.js.
 */
import fs from "node:fs";
import os from "node:os";
import type { Db } from "./index.ts";
import { CACHE_CEILING_MB, type CachedKnowledgeStore, type CachedMemoryStore } from "./cache.ts";
import type { KnowledgeStore } from "../knowledge/store.ts";
import type { MemoryStore } from "../memory/store.ts";

export type TipLevel = "ok" | "info" | "warn";
export interface Tip {
  level: TipLevel;
  text: string;
  vars?: Record<string, string | number>;
}

export interface StorageReport {
  database: { kind: "sqlite" | "postgres"; label: string; latencyMs: number };
  cache: { on: boolean; rooms: number; people: number; messages: number; mb: number; ceilingMb: number };
  host: { name: string | null; memoryMb: number; processMb: number };
  tips: Tip[];
}

/** The smallest memory we're comfortable running the RAM layer in. */
export const MIN_MEMORY_MB = 512;
const SLOW_DB_MS = 20;

const mb = (bytes: number) => Math.round(bytes / 1048576);

/** Memory this process may use: the container limit when there is one, else the machine's RAM. */
export function memoryLimitMb(read = (f: string) => fs.readFileSync(f, "utf8")): number {
  const total = mb(os.totalmem());
  for (const f of ["/sys/fs/cgroup/memory.max", "/sys/fs/cgroup/memory/memory.limit_in_bytes"]) {
    try {
      const v = read(f).trim();
      const n = Number(v);
      if (v !== "max" && Number.isFinite(n) && n > 0 && mb(n) < total) return mb(n);
    } catch {
      /* not in a container, or not Linux */
    }
  }
  return total;
}

/** Which hosting platform we're on, from the variables each one sets. */
export function hostName(env: Record<string, string | undefined> = process.env): string | null {
  if (env.RAILWAY_ENVIRONMENT || env.RAILWAY_PROJECT_ID || env.RAILWAY_PUBLIC_DOMAIN) return "Railway";
  if (env.RENDER || env.RENDER_EXTERNAL_URL) return "Render";
  if (env.FLY_APP_NAME) return "Fly.io";
  if (env.KUBERNETES_SERVICE_HOST) return "Kubernetes";
  return null;
}

async function latency(db: Db): Promise<number> {
  const times: number[] = [];
  for (let i = 0; i < 3; i++) {
    const t = performance.now();
    await db.get("SELECT 1 AS one");
    times.push(performance.now() - t);
  }
  return Math.round(times.sort((a, b) => a - b)[1] * 10) / 10;
}

export interface AdviceInput {
  db: Db;
  store: MemoryStore;
  knowledge: KnowledgeStore;
  cacheOn: boolean;
  dataDir: string;
  env?: Record<string, string | undefined>;
  /** For tests. */
  memoryMb?: number;
}

export async function storageReport(i: AdviceInput): Promise<StorageReport> {
  const env = i.env ?? process.env;
  const memStats = i.cacheOn && "stats" in i.store ? (i.store as CachedMemoryStore).stats() : null;
  const kbStats = i.cacheOn && "stats" in i.knowledge ? (i.knowledge as CachedKnowledgeStore).stats() : null;
  const cacheMb = Math.round((((memStats?.bytes ?? 0) + (kbStats?.bytes ?? 0)) / 1048576) * 10) / 10;
  const report: StorageReport = {
    database: { kind: i.db.dialect, label: i.db.label, latencyMs: await latency(i.db) },
    cache: {
      on: i.cacheOn,
      rooms: memStats?.rooms ?? 0,
      people: memStats?.people ?? 0,
      messages: memStats?.messages ?? 0,
      mb: cacheMb,
      ceilingMb: CACHE_CEILING_MB,
    },
    host: { name: hostName(env), memoryMb: i.memoryMb ?? memoryLimitMb(), processMb: mb(process.memoryUsage().rss) },
    tips: [],
  };
  report.tips = adviceFor(report, i.dataDir);
  return report;
}

export function adviceFor(r: StorageReport, dataDir: string): Tip[] {
  const tips: Tip[] = [];
  const { database: db, cache, host } = r;
  const local = db.kind === "sqlite";

  // Where the data lives.
  if (local && host.name) {
    tips.push({
      level: "warn",
      text: "You're on {host} with the local database. Make sure {dir} is a persistent volume, or set DATABASE_URL to a PostgreSQL database, or everything is lost on the next redeploy.",
      vars: { host: host.name, dir: dataDir },
    });
  } else if (local) {
    tips.push({ level: "info", text: "Everything is in {dir}. Back that folder up now and then; copying it while Mochi is stopped is enough.", vars: { dir: dataDir } });
  } else {
    tips.push({ level: "ok", text: "Data is in PostgreSQL, so Mochi itself keeps nothing on disk. Back the database up with your provider's backups." });
  }

  if (cache.on) {
    tips.push({ level: "ok", text: "The RAM layer is on: replies read from memory and the database is written in the background." });
    // Memory headroom.
    if (host.memoryMb < MIN_MEMORY_MB) {
      tips.push({
        level: "warn",
        text: "Only {memory} MB of memory here. Give Mochi at least {min} MB, or set STORAGE_CACHE=off: the RAM layer can grow to about {ceiling} MB on a busy server.",
        vars: { memory: host.memoryMb, min: MIN_MEMORY_MB, ceiling: cache.ceilingMb },
      });
    } else {
      tips.push({
        level: "ok",
        text: "Memory: {memory} MB available, Mochi uses {process} MB, of which the RAM layer holds {cache} MB (at most about {ceiling} MB).",
        vars: { memory: host.memoryMb, process: host.processMb, cache: cache.mb, ceiling: cache.ceilingMb },
      });
    }
    tips.push({
      level: "info",
      text: "Stop Mochi gently (Ctrl+C, docker stop, or a redeploy) so the last messages in memory get saved. A crash or kill -9 can lose the last few seconds of chat history.",
    });
    tips.push({
      level: "info",
      text: "Run one copy of Mochi per database. Two copies would each trust their own memory; for more capacity, give the one server more CPU and memory instead.",
    });
    if (!local && db.latencyMs >= SLOW_DB_MS)
      tips.push({ level: "info", text: "Your database answers in {ms} ms. Keep the RAM layer on: without it every reply waits for about a dozen of those.", vars: { ms: db.latencyMs } });
  } else {
    tips.push({ level: "info", text: "The RAM layer is off (STORAGE_CACHE=off): every reply reads and writes the database directly." });
    if (db.latencyMs >= SLOW_DB_MS)
      tips.push({
        level: "warn",
        text: "Your database answers in {ms} ms, so each reply spends about {total} ms waiting for it. Remove STORAGE_CACHE=off to turn the RAM layer back on.",
        vars: { ms: db.latencyMs, total: Math.round(db.latencyMs * 12) },
      });
  }
  return tips;
}

/** Same advice, for the server log. */
export function formatTips(tips: Tip[]): string[] {
  const mark = { ok: "✓", info: "•", warn: "⚠" } as const;
  return tips.map((t) => `  ${mark[t.level]} ${t.text.replace(/\{(\w+)\}/g, (_, k) => String(t.vars?.[k] ?? ""))}`);
}
