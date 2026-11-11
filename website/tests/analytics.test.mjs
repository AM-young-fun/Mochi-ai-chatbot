import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import assert from "node:assert/strict";
import ts from "typescript";
const compile = file => ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const core = compile("../lib/ga4-core.ts"), adapter = compile("../lib/ga4-client.ts");
function fixture(consent = "granted", id = "G-FG9VQMZ6BZ", host = "mochichatbot.com") {
  const scripts = [], listeners = new Map();
  let saved = consent, cookie = consent ? `flatkey_analytics_consent=${consent}` : "";
  const location = new URL(`https://${host}/calculator?email=private%40example.com&utm_source=github#private`);
  const localStorage = { getItem: () => saved, setItem: (_key, value) => { saved = value; } };
  const window = { location, localStorage, dispatchEvent() {}, addEventListener(name, fn) { listeners.set(name, fn); }, removeEventListener(name) { listeners.delete(name); } };
  const document = { get cookie() { return cookie; }, set cookie(value) { cookie = value; }, referrer: "https://example.com/guide?secret=hidden", title: "Calculator", getElementById: id => scripts.find(script => script.id === id), createElement: () => ({}), head: { appendChild: script => scripts.push(script) } };
  const env = { window, location, localStorage, document, URL, URLSearchParams, Date, crypto: { randomUUID: () => "visit-fixture" }, Event: class {}, CustomEvent: class {}, process: { env: { NEXT_PUBLIC_GA4_MEASUREMENT_ID: id } } };
  const coreExports = {}; vm.runInNewContext(core, { ...env, exports: coreExports });
  const exports = {}; vm.runInNewContext(adapter, { ...env, exports, require: name => { if (name === "./ga4-core") return coreExports; throw new Error(name); } });
  return { scripts, window, document, client: exports.mochiAnalytics, events: () => (window.dataLayer || []).filter(entry => entry[0] === "event"), deny: () => { saved = "denied"; cookie = "flatkey_analytics_consent=denied"; } };
}
test("no analytics before consent, after refusal, or on local preview", () => {
  for (const f of [fixture(null), fixture("denied"), fixture("granted", "G-FG9VQMZ6BZ", "localhost")]) {
    f.client.pageView("/calculator"); f.client.track("mochi_step_done", { guide_track: "local", step: 1 });
    assert.equal(f.scripts.length, 0); assert.equal(f.events().length, 0);
  }
});
test("single destination, deduplicated SPA page views and sanitized URL", () => {
  const f = fixture(); f.client.pageView("/calculator"); f.client.pageView("/calculator"); f.client.pageView("/models/test");
  assert.equal(f.scripts.length, 1); assert.equal(f.scripts[0].src, "https://www.googletagmanager.com/gtag/js?id=G-FG9VQMZ6BZ");
  assert.equal(f.events().length, 2);
  assert.equal(f.events()[0][2].page_location, "https://mochichatbot.com/calculator");
  assert.equal(f.events()[0][2].page_referrer, "https://example.com/guide");
  assert.equal(f.events()[0][2].campaign_source, "github");
  assert.equal(f.events()[1][2].page_referrer, "https://mochichatbot.com/calculator");
  assert.ok(f.events().every(entry => entry[2].send_to === "G-FG9VQMZ6BZ"));
  assert.equal(f.window.dataLayer.find(entry => entry[0] === "config")[2].send_page_view, false);
});
test("known business steps survive but arbitrary events and personal data do not", () => {
  const f = fixture(); f.client.track("mochi_step_done", { ...{ guide_track: "local", step: 1 }, email: "private@example.com", action_id: "Bearer private", calculator: "safe", source_page: "/?email=private@example.com" });
  f.client.track("unreviewed_event", { calculator: "safe" });
  assert.equal(f.events().length, 1); assert.equal(f.events()[0][1], "mochi_step_done");
  assert.equal(f.events()[0][2].email, undefined); assert.equal(f.events()[0][2].action_id, undefined); assert.equal(f.events()[0][2].source_page, undefined);
});
test("revoking permission stops subsequent tool events", () => {
  const f = fixture(); f.client.track("mochi_step_done", { guide_track: "local", step: 1 }); const count = f.events().length; f.deny(); f.client.track("mochi_step_done", { guide_track: "local", step: 1 });
  assert.equal(f.events().length, count);
});
