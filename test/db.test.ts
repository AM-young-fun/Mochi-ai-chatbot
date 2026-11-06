import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { dialectOf, redactUrl, sqlitePath } from "../src/db/index.ts";
import { toPgParams } from "../src/db/postgres.ts";
import { openStorage } from "../src/db/storage.ts";
import { copyDatabase } from "../src/db/copy.ts";
import { testDatabase } from "./helpers.ts";

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "mochi-db-"));

test("DATABASE_URL picks the driver", () => {
  assert.equal(dialectOf(undefined), "sqlite");
  assert.equal(dialectOf(""), "sqlite");
  assert.equal(dialectOf("sqlite:./other.db"), "sqlite");
  assert.equal(dialectOf("postgres://u:p@h/db"), "postgres");
  assert.equal(dialectOf("postgresql://u:p@h/db"), "postgres");
  assert.throws(() => dialectOf("mysql://u:p@h/db"), /postgres/);
  assert.equal(sqlitePath("", "/data"), path.join("/data", "mochi.db"));
  assert.equal(sqlitePath("sqlite:/srv/m.db", "/data"), "/srv/m.db");
  assert.equal(redactUrl("postgres://mochi:s3cret@db.example:5432/m"), "postgres://mochi:•••@db.example:5432/m");
});

test("? placeholders become $n outside quotes", () => {
  assert.equal(toPgParams("SELECT * FROM t WHERE a = ? AND b = '?' AND c IN (?, ?)"), "SELECT * FROM t WHERE a = $1 AND b = '?' AND c IN ($2, $3)");
});

/** Fills a store with a bit of everything, through the real stores. */
async function seed(url: string | undefined, dir: string) {
  const s = await openStorage({ url, dataDir: dir, log: () => {} });
  s.bots.create("qa", { id: "helpdesk", name: "Helpdesk" });
  s.secrets.setFlatkeyApiKey("fk-test-123456789");
  s.adminFallback.save("scrypt$test-hash");
  await s.store.touchPerson("mochi", "discord", "u1", "Alice", 1000);
  await s.store.addMessage({ botId: "mochi", platform: "discord", roomId: "r1", userId: "u1", userName: "Alice", text: "I love matcha", hasImage: false, isBot: false, ts: 1000 });
  await s.store.bumpRoom("mochi", "discord", "r1", "#general");
  await s.store.updatePersonProfile("mochi", "discord", "u1", { facts: ["loves matcha"] });
  await s.store.recordUsage("mochi", "chat", "m", 10, 5);
  await s.knowledge.addDocument("helpdesk", "Refund policy", "text", "", "Refunds are available within 30 days of purchase. 购买后 30 天内可以申请退款。");
  await s.close();
}

async function check(url: string | undefined, dir: string) {
  const s = await openStorage({ url, dataDir: dir, log: () => {} });
  try {
    assert.deepEqual(s.bots.list().map((b) => b.id).sort(), ["helpdesk", "mochi"]);
    assert.equal(s.secrets.flatkeyApiKey, "fk-test-123456789");
    assert.equal(s.adminFallback.value, "scrypt$test-hash");
    assert.deepEqual((await s.store.getPerson("mochi", "discord", "u1"))?.facts, ["loves matcha"]);
    assert.equal((await s.store.recentMessages("mochi", "discord", "r1", 10))[0].text, "I love matcha");
    assert.equal(await s.store.tokensToday(), 15);
    assert.equal((await s.knowledge.search("helpdesk", "refund within days"))[0]?.title, "Refund policy");
    assert.equal((await s.knowledge.search("helpdesk", "怎么退款"))[0]?.title, "Refund policy");
    // New rows after a copy don't collide with the copied ids.
    await s.store.addMessage({ botId: "mochi", platform: "discord", roomId: "r1", userId: "u1", userName: "Alice", text: "and hojicha", hasImage: false, isBot: false, ts: 2000 });
    await s.knowledge.addDocument("helpdesk", "Shipping", "text", "", "Orders ship within two business days.");
    assert.equal((await s.store.recentMessages("mochi", "discord", "r1", 10)).length, 2);
  } finally {
    await s.close();
  }
}

test("copy: local SQLite → another place, everything comes along", async () => {
  const a = tmp();
  const b = tmp();
  await seed(undefined, a);
  const r = await copyDatabase({ dataDir: a }, { url: "sqlite:" + path.join(b, "mochi.db"), dataDir: b });
  assert.equal(r.rows.messages, 1);
  assert.deepEqual(r.docs.sort(), ["admin-password", "bots", "secrets"]);
  await check(undefined, b);
  await assert.rejects(copyDatabase({ dataDir: a }, { dataDir: b }), /already has Mochi data/);
  await copyDatabase({ dataDir: a }, { dataDir: b }, { wipe: true });
});

test("copy: SQLite → PostgreSQL → SQLite (with TEST_DATABASE_URL)", { skip: !process.env.TEST_DATABASE_URL }, async () => {
  const local = tmp();
  const back = tmp();
  const pg = await testDatabase(local);
  try {
    await seed(undefined, local);
    await copyDatabase({ dataDir: local }, { url: pg.url, dataDir: local });
    await check(pg.url, tmp());
    await copyDatabase({ url: pg.url, dataDir: local }, { dataDir: back });
    const s = await openStorage({ dataDir: back, log: () => {} });
    assert.equal((await s.store.recentMessages("mochi", "discord", "r1", 10)).length, 2, "the line written on Postgres came back too");
    await s.close();
  } finally {
    await pg.drop();
  }
});

test("a fresh PostgreSQL picks up the local bot list, secrets and password", { skip: !process.env.TEST_DATABASE_URL }, async () => {
  const dir = tmp();
  await seed(undefined, dir);
  const pg = await testDatabase(dir);
  try {
    const s = await openStorage({ url: pg.url, dataDir: dir, log: () => {} });
    assert.ok(s.bots.get("helpdesk"));
    assert.equal(s.secrets.flatkeyApiKey, "fk-test-123456789");
    assert.equal(s.adminFallback.value, "scrypt$test-hash");
    await s.close();
  } finally {
    await pg.drop();
  }
});
