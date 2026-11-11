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

test("website: consented ad click IDs preserve the cluster referral UTM evidence", async () => {
  const { flatkeyKeyUrl, withAdClick } = await import("../website/lib/links.ts");
  const plain = flatkeyKeyUrl("hero_cta", "en");
  assert.equal(withAdClick(plain, {}), plain, "no click ID: link unchanged, UTM kept");
  const ad = new URL(withAdClick(plain, { gclid: "abc123" }));
  assert.equal(ad.origin + ad.pathname, "https://console.flatkey.ai/keys");
  assert.equal(ad.searchParams.get("gclid"), "abc123");
  assert.equal(ad.searchParams.get("utm_source"), "mochi_bot");
  assert.equal(ad.searchParams.get("utm_campaign"), "mochi");
  assert.equal(withAdClick("https://example.com/", { gclid: "abc123" }), "https://example.com/");
  const ios = new URL(withAdClick(plain, { gbraid: "g1", wbraid: "w1" }));
  assert.equal(ios.searchParams.get("gbraid"), "g1");
  assert.equal(ios.searchParams.get("wbraid"), "w1");
});

test("website: the 'let your AI set it up' prompt carries the tracked Flatkey link and keeps the key out of the chat", async () => {
  const { buildAiPrompt } = await import("../website/lib/ai-prompt.ts");
  const { flatkeyKeyUrl } = await import("../website/lib/links.ts");
  for (const t of ["local", "server"] as const) {
    const url = flatkeyKeyUrl("ai_prompt", "zh");
    const p = buildAiPrompt(t, "简体中文", url);
    assert.ok(p.includes(url), `${t}: tracked Flatkey link`);
    assert.ok(p.includes("Talk to me in 简体中文"), `${t}: answers in the visitor's language`);
    assert.match(p, /Never ask me to paste the key into this chat/, `${t}: key stays out of the AI chat`);
    assert.ok(p.includes("https://github.com/AM-young-fun/Mochi-ai-chatbot"), `${t}: repo`);
  }
  assert.match(buildAiPrompt("server", "English", "x"), /docker run/);
  assert.match(buildAiPrompt("local", "English", "x"), /install\.sh \| bash/);
  assert.match(buildAiPrompt("local", "English", "x"), /Set-ExecutionPolicy \$p -Scope Process/);
});

test("website: one-line installers point at our scripts, and Windows restores its script policy", async () => {
  const { INSTALL_COMMAND, INSTALL_SCRIPT, detectOs } = await import("../website/lib/install.ts");
  assert.equal(INSTALL_COMMAND.macos, "curl -fsSL https://www.mochichatbot.com/install.sh | bash");
  assert.equal(INSTALL_COMMAND.linux, INSTALL_COMMAND.macos);
  const win = INSTALL_COMMAND.windows;
  assert.match(win, /^\$p = Get-ExecutionPolicy -Scope Process; Set-ExecutionPolicy Bypass -Scope Process -Force; try \{ irm https:\/\/www\.mochichatbot\.com\/install\.ps1 \| iex \} finally \{ Set-ExecutionPolicy \$p -Scope Process -Force \}$/);
  for (const os of ["macos", "windows", "linux"] as const) {
    assert.ok(fs.existsSync(path.join(root, "website/public", INSTALL_SCRIPT[os].name)), `${INSTALL_SCRIPT[os].name} is served by the site`);
    assert.match(INSTALL_SCRIPT[os].source, /^https:\/\/github\.com\/AM-young-fun\/Mochi-ai-chatbot\/blob\/main\/website\/public\//);
  }
  assert.equal(detectOs("MacIntel", "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)"), "macos");
  assert.equal(detectOs("Win32", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"), "windows");
  assert.equal(detectOs("Linux x86_64", "Mozilla/5.0 (X11; Linux x86_64)"), "linux");
  assert.equal(detectOs("", ""), "windows");
});

test("installers: bash parses, PowerShell is ASCII-only, neither prints or generates secrets", () => {
  const sh = fs.readFileSync(path.join(root, "website/public/install.sh"), "utf8");
  const ps1 = fs.readFileSync(path.join(root, "website/public/install.ps1"), "utf8");
  assert.ok(/[^\x00-\x7F]/.test(ps1) === false, "Windows PowerShell 5.1 can misread non-ASCII in a downloaded script");
  assert.match(sh, /^main "\$@"$/m, "runs from main() so curl | bash reads the whole script first");
  assert.match(ps1, /npm\.cmd install/, "uses npm.cmd, not the npm.ps1 shim that execution policies block");
  for (const s of [sh, ps1]) assert.ok(!/ADMIN_TOKEN=/.test(s.replace(/^#.*$/gm, "")), "the dashboard sets the password, not the installer");
});
