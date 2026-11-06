import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { adviceFor, dataPersistence, formatTips, hostName, memoryLimitMb, type StorageReport } from "../src/db/advice.ts";

const base = (over: Partial<StorageReport> = {}): StorageReport => ({
  database: { kind: "sqlite", label: "SQLite /data/mochi.db", latencyMs: 0.1, persistence: "disk" },
  cache: { on: true, rooms: 3, people: 5, messages: 40, mb: 0.2, ceilingMb: 80 },
  host: { name: null, memoryMb: 2048, processMb: 120 },
  tips: [],
  ...over,
});
const texts = (r: StorageReport) => adviceFor(r, "/data").map((t) => t.text);
const warns = (r: StorageReport) => adviceFor(r, "/data").filter((t) => t.level === "warn").length;

test("a local install with room to spare gets no warnings, just the habits to keep", () => {
  const r = base();
  assert.equal(warns(r), 0);
  assert.ok(texts(r).some((t) => t.startsWith("Everything is in {dir}")));
  assert.ok(texts(r).some((t) => t.startsWith("Stop Mochi gently")));
  assert.ok(texts(r).some((t) => t.startsWith("Run one copy of Mochi")));
});

test("SQLite on a cloud host warns about losing data on redeploy, unless the folder is a volume", () => {
  const railway = { name: "Railway", memoryMb: 1024, processMb: 100 };
  assert.equal(warns(base({ host: railway, database: { ...base().database, persistence: "unknown" } })), 1);
  assert.equal(warns(base({ host: railway })), 0, "a mounted volume is fine");
});

test("data that won't survive a restart is called out", () => {
  const ram = base({ database: { ...base().database, persistence: "ram" } });
  assert.equal(warns(ram), 1);
  assert.ok(texts(ram)[0].includes("RAM disk"));
  const box = base({ database: { ...base().database, persistence: "container" } });
  assert.ok(texts(box)[0].includes("inside the container"));
  assert.ok(!texts(box).some((t) => t.startsWith("Everything is in")), "no 'just back it up' next to the warning");
});

test("persistence comes from the mount table", () => {
  const table = (rows: string[]) => () => rows.join("\n");
  const overlay = "1 0 0:1 / / rw - overlay overlay rw";
  const vol = "2 1 8:1 / /app/data rw - ext4 /dev/sdb rw";
  const tmp = "3 1 0:2 / /app/data rw - tmpfs tmpfs rw";
  assert.equal(dataPersistence("/app/data", table([overlay])), "container");
  assert.equal(dataPersistence("/app/data", table([overlay, vol])), "disk");
  assert.equal(dataPersistence("/app/data/sub", table([overlay, tmp])), "ram");
  assert.equal(dataPersistence("/app/database", table([overlay, vol])), "container", "/app/data is not a parent of /app/database");
  assert.equal(dataPersistence("/home/me/data", table(["1 0 8:1 / / rw - ext4 /dev/sda rw"])), "disk");
  assert.equal(dataPersistence("/x", () => { throw new Error("no /proc"); }), "unknown");
});

test("too little memory for the RAM layer is a warning", () => {
  const r = base({ host: { name: null, memoryMb: 256, processMb: 100 } });
  assert.equal(warns(r), 1);
  assert.ok(texts(r).some((t) => t.startsWith("Only {memory} MB")));
});

test("a slow PostgreSQL: keep the cache on; with it off, say what it costs", () => {
  const pg = { kind: "postgres" as const, label: "PostgreSQL", latencyMs: 45, persistence: "disk" as const };
  assert.ok(texts(base({ database: pg })).some((t) => t.startsWith("Your database answers in {ms} ms. Keep")));
  const off = base({ database: pg, cache: { ...base().cache, on: false } });
  assert.equal(warns(off), 1);
  assert.match(formatTips(adviceFor(off, "/data")).join("\n"), /about 540 ms/);
});

test("host and memory limit detection", () => {
  assert.equal(hostName({ RAILWAY_ENVIRONMENT: "production" }), "Railway");
  assert.equal(hostName({ RENDER: "true" }), "Render");
  assert.equal(hostName({}), null);
  assert.equal(memoryLimitMb(() => String(256 * 1048576)), 256);
  assert.ok(memoryLimitMb(() => "max") > 0);
});

test("every tip and Storage page label is translated", () => {
  const ctx: any = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.resolve(import.meta.dirname, "../public/dashboard/i18n.js"), "utf8"), ctx);
  const src = fs.readFileSync(path.resolve(import.meta.dirname, "../src/db/advice.ts"), "utf8");
  const tipTexts = [...src.matchAll(/text: "([^"]+)"/g)].map((m) => m[1]);
  assert.ok(tipTexts.length >= 10);
  const table = JSON.stringify(ctx.window.I18N);
  for (const t of tipTexts) assert.ok(table.includes(JSON.stringify(t).slice(1, -1)), `missing translation: ${t}`);
});
