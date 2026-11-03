import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../src/server/app.ts";
import { makeStack } from "./helpers.ts";

/**
 * The dashboard reports into a Google Analytics property only when GA_MEASUREMENT_ID is set, and
 * the id is injected by the server rather than baked into the HTML — otherwise a fork deploying
 * this code would quietly send its visitors to whoever's property the id belongs to. These tests
 * pin both halves of that: the tag is served, and a malformed id cannot inject code.
 */

let S: Awaited<ReturnType<typeof makeStack>>;
const servers: { close: () => void }[] = [];

async function listen(gaId?: string) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mochi-ga-"));
  const app = createServer({
    brain: S.brain,
    bots: S.bots,
    channels: { handleWebhook: async () => false } as any,
    secrets: S.secrets,
    store: S.store,
    knowledge: S.knowledge,
    flatkey: S.flatkey,
    adminToken: "admin-secret",
    publicUrl: "http://localhost",
    publicDir: path.join(import.meta.dirname, "..", "public"),
    gaId,
  });
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  servers.push({ close: () => server.close() });
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const res = await fetch(`${base}/ga.js`);
  return { base, text: await res.text(), contentType: res.headers.get("content-type") ?? "" };
}

before(async () => {
  S = await makeStack();
});
after(async () => {
  for (const s of servers) s.close();
  await S.close();
});

test("with a measurement id the loader configures gtag for it", async () => {
  const { text, contentType } = await listen("G-30RCEP2CVH");
  assert.match(contentType, /application\/javascript/);
  assert.match(text, /"G-30RCEP2CVH"/);
  assert.match(text, /googletagmanager\.com\/gtag\/js/);
  assert.match(text, /gtag\("config",id/);
  // Hash-routed dashboard: hash changes must be reported, not just the landing view.
  assert.match(text, /hashchange/);
});

test("without an id the loader does nothing at all", async () => {
  const { text } = await listen(undefined);
  assert.match(text, /analytics off/);
  assert.doesNotMatch(text, /googletagmanager/);
  assert.doesNotMatch(text, /gtag\(/);
});

test("a malformed id is refused instead of being interpolated into the script", async () => {
  const evil = '";alert(1);//';
  const { text } = await listen(evil);
  assert.match(text, /analytics off/);
  assert.doesNotMatch(text, /alert/);
});

test("the dashboard page asks for the loader", async () => {
  const html = fs.readFileSync(path.join(import.meta.dirname, "..", "public", "dashboard", "index.html"), "utf8");
  assert.match(html, /<script defer src="\/ga\.js">/);
});
