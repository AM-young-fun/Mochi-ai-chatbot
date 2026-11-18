import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePost, renderMarkdown, serializePost, seoCheck } from "../website/lib/blog-md.ts";
import { handleRpc, keyMatches, previewKey, type McpContext } from "../website/lib/blog-mcp.ts";
import { mcpPost } from "../website/lib/blog-mcp-http.ts";
import { MemoryStore } from "../website/lib/blog-store.ts";

const para = (n: number) =>
  Array.from({ length: n }, (_, i) => `Self-hosted AI chatbot note ${i}: running your own bot means the memory, the persona and the bill stay with you, and Mochi gets its models from Flatkey with one key.`).join(" ");
const BODY = `A self-hosted AI chatbot keeps your bot on your side. ${para(3)}

## Why a self-hosted AI chatbot

${para(8)}

## How to start

${para(8)} Read the [setup guide]({{guide}}), see [every way to deploy]({{deploy}}) or [get a Flatkey key]({{flatkey}}).
`;
const GOOD = {
  slug: "self-hosted-ai-chatbot",
  title: "Self-hosted AI chatbot: why running your own bot pays off",
  description: "A self-hosted AI chatbot keeps memory, persona and costs in your hands. Here is what changes when you run Mochi yourself, and what it costs to try.",
  keywords: ["self-hosted AI chatbot", "own AI bot"],
  body: BODY,
};

test("blog markdown: frontmatter round-trips, raw HTML is escaped, links are safe and tracked", () => {
  const file = { slug: "x-y", title: 'Colons: "quotes" and more', description: "d", published: "2026-11-18", updated: "2026-11-18", keywords: ["a", "b, c"], body: "# Top\n\nHi" };
  assert.deepEqual(parsePost("x-y", serializePost(file)), file);

  const html = renderMarkdown('# Big\n\nHello <script>alert(1)</script> <img src=x onerror=alert(1)>\n\n[bad](javascript:alert(1)) [ext](https://example.com) [in](/deploy) [key]({{flatkey}})', "my-post");
  assert.match(html, /<h2 id="big">Big<\/h2>/, "# becomes h2: the title is the only h1");
  assert.doesNotMatch(html, /<script|<img src=x/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /javascript:/);
  assert.match(html, /<a href="https:\/\/example.com" target="_blank" rel="noopener">ext<\/a>/);
  assert.match(html, /<a href="\/deploy">in<\/a>/);
  assert.match(html, /console\.flatkey\.ai\/keys\?utm_source=mochi_bot&amp;utm_medium=mochi_site&amp;utm_campaign=mochi&amp;utm_content=blog_my-post/);
});

test("blog SEO check: passes a good post, blocks missing Flatkey and thin content, warns on house style and overlap", () => {
  const good = seoCheck(GOOD);
  assert.deepEqual(good.errors, []);
  assert.ok(good.score >= 80, `score ${good.score}: ${good.warnings.join(" | ")}`);

  const bad = seoCheck({ ...GOOD, slug: "Bad Slug", body: "Too short — and no provider." });
  assert.ok(bad.errors.some((e) => /Slug/.test(e)));
  assert.ok(bad.errors.some((e) => /at least 400/.test(e)));
  assert.ok(bad.errors.some((e) => /Flatkey/.test(e)));
  assert.ok(bad.warnings.some((w) => /dashes/.test(w)));

  const twin = seoCheck(GOOD, [{ slug: "other", title: "Why a self-hosted AI chatbot pays off", keywords: ["self-hosted AI chatbot"] }]);
  assert.ok(twin.warnings.some((w) => /compete/.test(w)));
  assert.ok(seoCheck({ ...GOOD, body: BODY + "\nNew accounts get $5 of free credit." }).warnings.some((w) => /\$1/.test(w)));
});

function ctx(today = "2026-11-18"): McpContext & { store: MemoryStore } {
  return { store: new MemoryStore(), previewSecret: "s".repeat(32), maxPerDay: 2, today: () => today };
}
let id = 0;
const call = async (c: McpContext, name: string, args: object = {}) => {
  const r = (await handleRpc({ jsonrpc: "2.0", id: ++id, method: "tools/call", params: { name, arguments: args } }, c)) as any;
  const text = r.result.content[0].text as string;
  return { isError: r.result.isError as boolean, text, data: (() => { try { return JSON.parse(text); } catch { return text; } })() };
};

test("blog MCP protocol: initialize, tools/list, notifications and unknown methods", async () => {
  const c = ctx();
  const init = (await handleRpc({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26" } }, c)) as any;
  assert.equal(init.result.protocolVersion, "2025-03-26");
  assert.equal(init.result.serverInfo.name, "mochi-blog");
  assert.equal(await handleRpc({ jsonrpc: "2.0", method: "notifications/initialized" }, c), null);
  const list = (await handleRpc({ jsonrpc: "2.0", id: 2, method: "tools/list" }, c)) as any;
  assert.deepEqual(list.result.tools.map((t: any) => t.name), ["blog_guidelines", "list_posts", "get_post", "seo_check", "save_draft", "publish_post", "update_post", "delete_draft"]);
  assert.equal(((await handleRpc({ jsonrpc: "2.0", id: 3, method: "nope" }, c)) as any).error.code, -32601);
  assert.match((await call(c, "blog_guidelines")).text, /\{\{flatkey\}\}/);
});

test("blog MCP: draft → preview → publish, with the daily cap, updates and deletes", async () => {
  const c = ctx();
  const refused = await call(c, "save_draft", { ...GOOD, body: "short" });
  assert.equal(refused.data.saved, false);
  assert.equal(c.store.commits.length, 0, "nothing saved while the SEO check has errors");

  const saved = await call(c, "save_draft", GOOD);
  assert.equal(saved.data.saved, true);
  assert.equal(saved.data.preview, `https://www.mochichatbot.com/blog/preview/self-hosted-ai-chatbot?key=${previewKey(c.previewSecret, GOOD.slug)}`);
  assert.ok(c.store.files.drafts.has(GOOD.slug) && !c.store.files.published.has(GOOD.slug), "drafts never touch the live site");

  const listed = await call(c, "list_posts", { status: "drafts" });
  assert.equal(listed.data.posts[0].status, "drafts");

  const pub = await call(c, "publish_post", { slug: GOOD.slug });
  assert.equal(pub.data.published, true);
  assert.equal(pub.data.url, "https://www.mochichatbot.com/blog/self-hosted-ai-chatbot");
  assert.ok(!c.store.files.drafts.has(GOOD.slug));
  const live = parsePost(GOOD.slug, c.store.files.published.get(GOOD.slug)!.text);
  assert.equal(live.published, "2026-11-18");
  assert.match(c.store.commits.at(-2)!.message, /^blog: publish/);

  assert.match((await call(c, "save_draft", GOOD)).text, /already published/);
  assert.equal((await call(c, "publish_post", { slug: GOOD.slug })).isError, true);

  // Daily cap: 2 a day.
  for (const n of [2, 3]) {
    const slug = `self-hosted-ai-chatbot-${n}`;
    await call(c, "save_draft", { ...GOOD, slug, keywords: [`topic ${n}`], title: `Another self-hosted AI chatbot angle number ${n}` });
  }
  assert.equal((await call(c, "publish_post", { slug: "self-hosted-ai-chatbot-2" })).data.published, true);
  const capped = await call(c, "publish_post", { slug: "self-hosted-ai-chatbot-3" });
  assert.equal(capped.isError, true);
  assert.match(capped.text, /limit is 2 a day/);
  const scheduled = await call(c, "publish_post", { slug: "self-hosted-ai-chatbot-3", date: "2026-11-20" });
  assert.equal(scheduled.data.scheduled, "2026-11-20");
  assert.equal((await call(c, "publish_post", { slug: "x-y", date: "2026-11-01" })).isError, true);

  // Updating a published post bumps its updated date (on a later day).
  const later = { ...c, today: () => "2026-11-25" };
  const upd = await call(later, "update_post", { slug: GOOD.slug, description: GOOD.description.replace("Here is", "This is") });
  assert.equal(upd.data.saved, true);
  const after = parsePost(GOOD.slug, c.store.files.published.get(GOOD.slug)!.text);
  assert.equal(after.published, "2026-11-18");
  assert.equal(after.updated, "2026-11-25");

  await call(c, "save_draft", { ...GOOD, slug: "throwaway-idea", keywords: ["throwaway"], title: "A throwaway idea about self-hosted AI chatbot costs" });
  assert.equal((await call(c, "delete_draft", { slug: "throwaway-idea" })).data.deleted, true);
  assert.equal((await call(c, "delete_draft", { slug: GOOD.slug })).isError, true, "published posts can't be deleted here");
  assert.equal((await call(c, "get_post", { slug: "preview" })).isError, true);
});

test("blog MCP over HTTP: needs its key (header or path), and its settings", async () => {
  const req = (headers: Record<string, string> = {}) =>
    new Request("https://x/api/mcp", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }) });
  const env = { ...process.env };
  try {
    delete process.env.BLOG_MCP_TOKEN;
    assert.equal((await mcpPost(req())).status, 503);
    process.env.BLOG_MCP_TOKEN = "k".repeat(30);
    process.env.BLOG_GITHUB_TOKEN = "ghp_test";
    assert.equal((await mcpPost(req())).status, 401);
    assert.equal((await mcpPost(req({ authorization: "Bearer wrong" }))).status, 401);
    const ok = await mcpPost(req({ authorization: `Bearer ${"k".repeat(30)}` }));
    assert.equal(ok.status, 200);
    assert.equal(((await ok.json()) as any).result.serverInfo.name, "mochi-blog");
    assert.equal((await mcpPost(req(), "k".repeat(30))).status, 200, "key in the path");
    assert.equal((await mcpPost(req(), "nope")).status, 401);
  } finally {
    process.env = env;
  }
  assert.equal(keyMatches("a", "a"), true);
  assert.equal(keyMatches("", "a"), false);
});
