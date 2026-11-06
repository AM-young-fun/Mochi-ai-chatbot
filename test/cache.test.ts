import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { SqliteDb } from "../src/db/sqlite.ts";
import type { Db } from "../src/db/index.ts";
import { CachedKnowledgeStore, CachedMemoryStore, cacheEnabled } from "../src/db/cache.ts";
import { MemoryStore } from "../src/memory/store.ts";

/** A Db that counts the statements it is asked to run. */
function counting(db: Db): Db & { reads: number; writes: number } {
  const c = Object.create(db) as Db & { reads: number; writes: number };
  c.reads = 0;
  c.writes = 0;
  c.all = (sql, p) => (c.reads++, db.all(sql, p));
  c.get = (sql, p) => (c.reads++, db.get(sql, p));
  c.run = (sql, p) => (c.writes++, db.run(sql, p));
  c.tx = (fn) => db.tx(fn);
  return c;
}

const file = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), "mochi-cache-")), "mochi.db");
const line = (text: string, ts: number) => ({ botId: "b", platform: "discord" as const, roomId: "r", userId: "u", userName: "Ann", text, hasImage: false, isBot: false, ts });

test("STORAGE_CACHE=off turns the RAM layer off", () => {
  assert.equal(cacheEnabled({}), true);
  assert.equal(cacheEnabled({ STORAGE_CACHE: "off" }), false);
  assert.equal(cacheEnabled({ STORAGE_CACHE: "0" }), false);
});

test("a chat turn reads from RAM, and everything still reaches the database", async () => {
  const f = file();
  const raw = new SqliteDb(f);
  const db = counting(raw);
  const s = await CachedMemoryStore.openCached(db);
  // First turn loads the room, the person and today's total.
  await s.recentMessages("b", "discord", "r", 20);
  await s.getPerson("b", "discord", "u");
  await s.getRoom("b", "discord", "r");
  await s.tokensToday("b");
  const reads = db.reads;
  for (let i = 0; i < 5; i++) {
    await s.touchPerson("b", "discord", "u", "Ann", 1000 + i);
    await s.addMessage(line(`hello ${i}`, 1000 + i));
    await s.bumpRoom("b", "discord", "r", "#general");
    await s.recordUsage("b", "chat", "m", 10, 5);
    const h = await s.recentMessages("b", "discord", "r", 20);
    assert.equal(h.at(-1)!.text, `hello ${i}`, "new lines are visible at once");
    assert.equal((await s.getPerson("b", "discord", "u"))!.messageCount, i + 1);
    assert.equal(await s.tokensToday("b"), 15 * (i + 1));
  }
  assert.equal(db.reads, reads + 2, "five turns: two reads, both when the new room is first saved");
  assert.equal((await s.getRoom("b", "discord", "r"))!.msgsSinceUpdate, 5);
  await s.close();

  // A plain store on the same file sees every write.
  const plain = await MemoryStore.open(new SqliteDb(f));
  assert.equal((await plain.recentMessages("b", "discord", "r", 20)).length, 5);
  assert.equal((await plain.getPerson("b", "discord", "u"))!.messageCount, 5);
  assert.equal((await plain.getRoom("b", "discord", "r"))!.msgsSinceUpdate, 5);
  assert.equal(await plain.tokensToday("b"), 75);
  await plain.close();
});

test("forgetting clears RAM too", async () => {
  const s = await CachedMemoryStore.openCached(new SqliteDb(file()));
  await s.touchPerson("b", "discord", "u", "Ann", 1);
  await s.addMessage(line("secret plans", 1));
  assert.ok(await s.getPerson("b", "discord", "u"));
  assert.equal((await s.recentMessages("b", "discord", "r", 10)).length, 1);
  await s.forgetPerson("b", "discord", "u");
  assert.equal(await s.getPerson("b", "discord", "u"), undefined);
  assert.equal((await s.recentMessages("b", "discord", "r", 10)).length, 0);
  await s.addMessage(line("again", 2));
  await s.forgetRoom("b", "discord", "r");
  assert.equal((await s.recentMessages("b", "discord", "r", 10)).length, 0);
  await s.close();
});

test("dashboard reads wait for background writes", async () => {
  const s = await CachedMemoryStore.openCached(new SqliteDb(file()));
  await s.touchPerson("b", "discord", "u", "Ann", 1);
  await s.addMessage(line("hi", 1));
  await s.recordUsage("b", "chat", "m", 1, 1);
  assert.equal((await s.listPeople("b")).length, 1);
  assert.equal((await s.usageSince("2000-01-01"))[0].calls, 1);
  assert.equal(await s.countMessages("b", "discord", "r"), 1);
  await s.close();
});

test("knowledge: answers repeat from RAM until the documents change", async () => {
  const db = counting(new SqliteDb(file()));
  const kb = await CachedKnowledgeStore.openCached(db);
  await kb.addDocument("b", "Refund policy", "text", "", "Refunds are available within 30 days of purchase.");
  assert.equal(await kb.count("b"), 1);
  assert.equal((await kb.search("b", "refund within days"))[0].title, "Refund policy");
  const reads = db.reads;
  assert.equal(await kb.count("b"), 1);
  assert.deepEqual(await kb.titles("b"), ["Refund policy"]);
  await kb.titles("b");
  assert.equal((await kb.search("b", "refund within days"))[0].title, "Refund policy");
  assert.equal(db.reads, reads + 1, "only the first titles() call went to the database");
  await kb.addDocument("b", "Shipping", "text", "", "Orders ship within two business days of purchase.");
  assert.equal(await kb.count("b"), 2, "a new document clears the cache");
  assert.equal((await kb.titles("b")).length, 2);
});
