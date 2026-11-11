import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../src/server/app.ts";
import { ANALYTICS_LINKER_DOMAINS } from "../website/lib/links.ts";
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

/**
 * Cross-domain measurement: the console and the site only share one session when both set the same
 * `_gl` linker, and when the set happens before the tags are configured — gtag applies a `set` to
 * the hits queued after it, so a later linker leaves the landing page view undecorated.
 */
test("the loader sets the GA4 linker before the first hit", async () => {
  const { text } = await listen("G-30RCEP2CVH");
  const set = text.indexOf('gtag("set","linker"');
  assert.ok(set > -1, "loader carries a linker block");
  assert.ok(set < text.indexOf('gtag("js"'), "linker must precede gtag js");
  assert.ok(set < text.indexOf('gtag("config"'), "linker must precede gtag config");
  assert.match(text, /"accept_incoming":true/);
});

test("the dashboard and the site use one identical linker list", async () => {
  const { text } = await listen("G-30RCEP2CVH");
  const block = text.match(/gtag\("set","linker",\{domains:(\[[^\]]*\]),"accept_incoming":true\}\)/);
  assert.ok(block, "linker block is machine-readable");
  assert.deepEqual(JSON.parse(block![1]), [...ANALYTICS_LINKER_DOMAINS]);
  // The console is the receiving end of the site's links, so it has to be in the list.
  assert.ok(ANALYTICS_LINKER_DOMAINS.includes("console.flatkey.ai"));
  assert.ok(ANALYTICS_LINKER_DOMAINS.includes("www.mochichatbot.com"));
});

test("the public site has one consent-gated GA4 destination and no GTM cross-property loader", () => {
  const src = fs.readFileSync(path.join(rootForWebsite(), "website", "components", "Tracking.tsx"), "utf8");
  const client = fs.readFileSync(path.join(rootForWebsite(), "website", "lib", "ga4-client.ts"), "utf8");
  assert.match(client, /G-FG9VQMZ6BZ/);
  assert.doesNotMatch(src, /googletagmanager\.com\/(?:gtm\.js|ns\.html)/);
  assert.match(src, /getConsent/);
});
function rootForWebsite() { return path.resolve(import.meta.dirname, ".."); }
