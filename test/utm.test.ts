import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { flatkeyUrl } from "../src/flatkey/why.ts";

const root = path.resolve(import.meta.dirname, "..");
const FILES = ["README.md", "README.zh-CN.md", "README.ja-JP.md", "README.pt-BR.md", "CONTRIBUTING.md", "CODE_OF_CONDUCT.md", "SECURITY.md", ".github/ISSUE_TEMPLATE/config.yml", ".env.example", "public/widget/widget.js", "public/dashboard/index.html", "public/dashboard/app.js", "src/flatkey/why.ts", "src/server/app.ts"];
const MEDIUMS_SITE = ["mochi_site"];
const MEDIUMS = ["local_deploy", "dashboard", "github", "web_widget"];

test("flatkeyUrl builds the full UTM set", () => {
  const u = new URL(flatkeyUrl("keys", "local_deploy", "startup_banner"));
  assert.equal(u.origin + u.pathname, "https://console.flatkey.ai/keys");
  assert.equal(u.searchParams.get("utm_source"), "mochi_bot");
  assert.equal(u.searchParams.get("utm_medium"), "local_deploy");
  assert.equal(u.searchParams.get("utm_campaign"), "mochi");
  assert.equal(u.searchParams.get("utm_content"), "startup_banner");
});

test("every user-facing Flatkey link in the repo carries the UTM scheme", () => {
  const re = /https:\/\/(?:console\.)?flatkey\.ai\/[^\s"'`)<>]*/g;
  let count = 0;
  for (const f of FILES) {
    const text = fs.readFileSync(path.join(root, f), "utf8");
    for (const m of text.matchAll(re)) {
      const raw = m[0].replace(/[.,]+$/, "");
      if (raw.includes("${")) continue; // template built at runtime by flatkeyUrl
      if (new URL(raw).pathname.startsWith("/v1/")) continue; // API endpoints, not links people click
      const u = new URL(raw);
      if (u.pathname === "/" && !u.search && f === "src/flatkey/why.ts") continue; // DESTINATIONS base
      if (u.pathname === "/keys" && !u.search && f === "src/flatkey/why.ts") continue;
      count++;
      assert.equal(u.searchParams.get("utm_source"), "mochi_bot", `${f}: ${raw}`);
      assert.ok(MEDIUMS.includes(u.searchParams.get("utm_medium") ?? ""), `${f}: ${raw}`);
      assert.equal(u.searchParams.get("utm_campaign"), "mochi", `${f}: ${raw}`);
      assert.ok(u.searchParams.get("utm_content"), `${f}: ${raw}`);
    }
  }
  assert.ok(count >= 6, `expected many tracked links, found ${count}`);
});

test("website: every Flatkey link is a tracked key-creation link, with the language in utm_content", async () => {
  const { flatkeyKeyUrl } = await import("../website/lib/links.ts");
  for (const lang of ["en", "zh", "ja", "pt"] as const) {
    const u = new URL(flatkeyKeyUrl("hero_cta", lang));
    assert.equal(u.origin + u.pathname, "https://console.flatkey.ai/keys", "small customers go to self-serve key creation");
    assert.equal(u.searchParams.get("utm_source"), "mochi_bot");
    assert.ok(MEDIUMS_SITE.includes(u.searchParams.get("utm_medium") ?? ""));
    assert.equal(u.searchParams.get("utm_campaign"), "mochi");
    assert.equal(u.searchParams.get("utm_content"), lang === "en" ? "hero_cta" : `hero_cta_${lang}`);
  }
  // No hardcoded Flatkey links elsewhere in the website: they must all go through flatkeyKeyUrl.
  const dirs = ["website/app", "website/components", "website/lib"];
  for (const d of dirs) {
    for (const f of fs.readdirSync(path.join(root, d), { recursive: true }) as string[]) {
      if (!/\.(tsx?|css)$/.test(f) || (d === "website/lib" && f === "links.ts")) continue;
      const text = fs.readFileSync(path.join(root, d, f), "utf8");
      assert.ok(!/https:\/\/(console\.)?flatkey\.ai/.test(text), `${d}/${f}: use flatkeyKeyUrl() for Flatkey links`);
    }
  }
});

test("website: a Google Ads click ID replaces the UTM tags on Flatkey links", async () => {
  const { flatkeyKeyUrl, withAdClick } = await import("../website/lib/links.ts");
  const plain = flatkeyKeyUrl("hero_cta", "en");
  assert.equal(withAdClick(plain, {}), plain, "no click ID: link unchanged, UTM kept");
  const ad = new URL(withAdClick(plain, { gclid: "abc123" }));
  assert.equal(ad.origin + ad.pathname, "https://console.flatkey.ai/keys");
  assert.equal(ad.searchParams.get("gclid"), "abc123");
  assert.ok(![...ad.searchParams.keys()].some((k) => k.startsWith("utm_")), "UTM tags must not compete with the ad click");
  const ios = new URL(withAdClick(plain, { gbraid: "g1", wbraid: "w1" }));
  assert.equal(ios.searchParams.get("gbraid"), "g1");
  assert.equal(ios.searchParams.get("wbraid"), "w1");
});
