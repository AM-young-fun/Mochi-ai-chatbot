// The blog MCP: tools to research, draft, check, preview and publish posts on www.mochichatbot.com/blog.
// Speaks MCP over Streamable HTTP without sessions (each POST is one JSON-RPC message, answered with JSON),
// which is what Grok's remote MCP tools, claude.ai connectors and Claude Desktop/Code expect.
// No "@/" imports: the repo-root tests import this file.
import crypto from "node:crypto";
import { parsePost, serializePost, seoCheck, SITE, SLUG_RE, type PostFile } from "./blog-md";
import type { BlogStore, Where } from "./blog-store";

export const SERVER_INFO = { name: "mochi-blog", version: "1.0.0" };
const PROTOCOLS = ["2025-06-18", "2025-03-26", "2024-11-05"];

export interface McpContext {
  store: BlogStore;
  /** Secret for draft preview links (derived per slug, so a preview link can't be used to publish). */
  previewSecret: string;
  /** Most posts that may be published per UTC day (keeps a runaway bot from flooding the blog). */
  maxPerDay: number;
  today?: () => string;
}

const todayUtc = () => new Date().toISOString().slice(0, 10);
export const previewKey = (secret: string, slug: string) => crypto.createHmac("sha256", secret).update(`preview:${slug}`).digest("hex").slice(0, 24);
const previewUrl = (ctx: McpContext, slug: string) => `${SITE}/blog/preview/${slug}?key=${previewKey(ctx.previewSecret, slug)}`;
const liveUrl = (slug: string) => `${SITE}/blog/${slug}`;

// ── What a writer needs to know ─────────────────────────────────────────────────

export const GUIDELINES = `# Writing for the Mochi blog (www.mochichatbot.com/blog)

## What Mochi is (only state these facts)
- Mochi is a free, open source (MIT) AI chatbot you host yourself. Code: {{github}}.
- One bot lives in Discord, Telegram, Slack, QQ, LINE and a website chat widget, set up from a web dashboard (English, Chinese, Japanese, Portuguese).
- She remembers people and conversations (per person and per room), answers from a knowledge base you upload (PDF, Word, Markdown, web pages), reads images and can search the web.
- You set her personality, name and greeting. The website widget can show an animated LivLiv character (Mochi by default).
- Data (memory, knowledge, settings) stays on your own server or database. Messages still go to the AI model provider to get replies.
- Models come from Flatkey, Mochi's only model provider: one key for every model, official models priced at least 20% below official prices. New Flatkey accounts get $1 of free credit. That is the only offer to mention.
- Mochi adds no content filter of its own, and Flatkey is OK with uncensored conversation. Never anything involving minors, and nothing sexual about real people without consent.
- Deploy: one click on Railway ({{railway}}), or any other way on {{deploy}}. Free to try on your own computer ({{guide}}).

## Who reads it
Companion-app users tired of filters and price changes (Character.AI, Janitor AI, Replika refugees), Discord and Telegram community owners, small businesses wanting a support bot, and developers who want an AI bot they control.

## Rules
- Every post mentions Flatkey as the model provider, and says plainly that messages go to the model provider (the privacy caveat) when it pitches privacy.
- No invented numbers, quotes, testimonials, benchmarks or user stories. Compare competitors only on facts you can link to.
- House style: plain words, short paragraphs, no em or en dashes, no hype words (unlock, leverage, seamless, delve, game-changer, revolutionize).
- English only for now.
- 800 to 1,500 words, one main search phrase (keywords[0]) used naturally in the title, description, first paragraph and one heading.
- Markdown only: ## and ### headings, lists, links, **bold**, tables. No raw HTML (it is shown as text). Don't repeat the title as a # heading.
- Link with these shortcuts so links are tracked: {{flatkey}} (get a Flatkey key), {{railway}}, {{deploy}}, {{guide}} (setup guide), {{tutorial}} (video), {{blog}}, {{github}}, and other posts as /blog/<slug>. At least two internal links.
- The page already adds a "Try Mochi" box at the end; finish with a short conclusion, not a sales block.
- A FAQ section with 3 to 5 real questions helps search; keep answers short.

## Workflow
1. blog_guidelines (this), then list_posts to see what exists and avoid repeating a topic or main keyword.
2. Write, then seo_check until there are no errors.
3. save_draft. It returns a private preview link. Show the owner the title, description and preview link.
4. publish_post only after the owner approves. The site rebuilds; the post is live in about 3 minutes.
`;

// ── Tools ──────────────────────────────────────────────────────────────────────

const postFields = {
  slug: { type: "string", description: "URL name: lowercase words joined by hyphens, built from the main search phrase, e.g. discord-ai-chatbot-with-memory." },
  title: { type: "string", description: "50 to 60 characters, main keyword near the start." },
  description: { type: "string", description: "Meta description, 120 to 160 characters, includes the main keyword." },
  keywords: { type: "array", items: { type: "string" }, description: "Main search phrase first, then 2 to 6 related phrases." },
  body: { type: "string", description: "The post in Markdown, without the title. Use link shortcuts like {{flatkey}} and {{deploy}}." },
};

export const TOOLS = [
  {
    name: "blog_guidelines",
    description: "Read first. Facts about Mochi, audience, house rules, link shortcuts and the draft → approve → publish workflow.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true },
  },
  {
    name: "list_posts",
    description: "Lists posts (slug, title, main keyword, dates, status) so a new post doesn't repeat a topic or compete for the same search.",
    inputSchema: { type: "object", properties: { status: { type: "string", enum: ["published", "drafts", "all"], default: "all" } } },
    annotations: { readOnlyHint: true },
  },
  {
    name: "get_post",
    description: "Returns one post or draft in full (frontmatter and Markdown) with its SEO report and its link.",
    inputSchema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] },
    annotations: { readOnlyHint: true },
  },
  {
    name: "seo_check",
    description: "Scores a post before saving: errors that block saving, warnings worth fixing, word count, headings, links and overlap with existing posts. Saves nothing.",
    inputSchema: { type: "object", properties: postFields, required: ["slug", "title", "description", "keywords", "body"] },
    annotations: { readOnlyHint: true },
  },
  {
    name: "save_draft",
    description: "Saves (or replaces) a draft. Nothing goes live. Returns the SEO report and a private preview link to show the owner. Refused while the SEO check has errors.",
    inputSchema: { type: "object", properties: postFields, required: ["slug", "title", "description", "keywords", "body"] },
  },
  {
    name: "publish_post",
    description: "Publishes a saved draft to www.mochichatbot.com/blog. Only call after the owner approved this draft. The site rebuilds and the post is live in about 3 minutes. A future date publishes it on that day instead.",
    inputSchema: {
      type: "object",
      properties: { slug: { type: "string" }, date: { type: "string", description: "Optional YYYY-MM-DD publish date (today by default; a future date schedules it)." } },
      required: ["slug"],
    },
    annotations: { destructiveHint: false, idempotentHint: false },
  },
  {
    name: "update_post",
    description: "Changes a published post or a draft. Only the fields you pass change. Published posts get today's date as 'updated' and go live again in about 3 minutes.",
    inputSchema: {
      type: "object",
      properties: { ...postFields, slug: { type: "string", description: "The post to change (slugs can't be renamed)." } },
      required: ["slug"],
    },
  },
  {
    name: "delete_draft",
    description: "Deletes a draft that won't be published. Published posts can't be deleted here.",
    inputSchema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] },
    annotations: { destructiveHint: true },
  },
];

class ToolError extends Error {}
const need = (v: unknown, name: string): string => {
  if (typeof v !== "string" || !v.trim()) throw new ToolError(`"${name}" is required.`);
  return v.trim();
};
const slugOf = (v: unknown) => {
  const s = need(v, "slug").toLowerCase();
  if (!SLUG_RE.test(s)) throw new ToolError("Slug must be lowercase words joined by hyphens.");
  if (s === "preview" || s.length > 60) throw new ToolError(s === "preview" ? '"preview" is reserved; pick another slug.' : "Keep the slug under 60 characters.");
  return s;
};
const keywordsOf = (v: unknown) => (Array.isArray(v) ? v.map(String).map((s) => s.trim()).filter(Boolean) : typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) : []);

async function allPosts(ctx: McpContext): Promise<(PostFile & { status: Where; sha: string })[]> {
  const [pub, drafts] = await Promise.all([ctx.store.list("published"), ctx.store.list("drafts")]);
  const read = (where: Where) => (f: { slug: string; text: string; sha: string }) => {
    try { return { ...parsePost(f.slug, f.text), status: where, sha: f.sha }; } catch { return null; }
  };
  return [...pub.map(read("published")), ...drafts.map(read("drafts"))].filter((p): p is PostFile & { status: Where; sha: string } => !!p);
}

async function callTool(name: string, args: Record<string, unknown>, ctx: McpContext): Promise<unknown> {
  const today = (ctx.today ?? todayUtc)();
  switch (name) {
    case "blog_guidelines":
      return GUIDELINES;

    case "list_posts": {
      const status = (args.status as string) || "all";
      const posts = (await allPosts(ctx)).filter((p) => status === "all" || p.status === status);
      return {
        count: posts.length,
        posts: posts
          .sort((a, b) => (b.published || "").localeCompare(a.published || ""))
          .map((p) => ({ slug: p.slug, status: p.status, title: p.title, mainKeyword: p.keywords[0] ?? "", published: p.published || null, updated: p.updated || null, url: p.status === "published" ? liveUrl(p.slug) : previewUrl(ctx, p.slug) })),
      };
    }

    case "get_post": {
      const slug = slugOf(args.slug);
      for (const where of ["drafts", "published"] as Where[]) {
        const f = await ctx.store.get(where, slug);
        if (!f) continue;
        const p = parsePost(slug, f.text);
        const others = (await allPosts(ctx)).filter((o) => o.slug !== slug);
        return { status: where, url: where === "published" ? liveUrl(slug) : previewUrl(ctx, slug), ...p, seo: seoCheck(p, others) };
      }
      throw new ToolError(`No post or draft called "${slug}". Use list_posts to see them.`);
    }

    case "seo_check": {
      const p = { slug: slugOf(args.slug), title: String(args.title ?? ""), description: String(args.description ?? ""), keywords: keywordsOf(args.keywords), body: String(args.body ?? "") };
      const others = (await allPosts(ctx)).filter((o) => o.slug !== p.slug);
      return seoCheck(p, others);
    }

    case "save_draft": {
      const slug = slugOf(args.slug);
      const p: PostFile = { slug, title: need(args.title, "title"), description: need(args.description, "description"), keywords: keywordsOf(args.keywords), body: need(args.body, "body"), published: "", updated: "" };
      const all = await allPosts(ctx);
      if (all.some((o) => o.slug === slug && o.status === "published")) throw new ToolError(`"${slug}" is already published. Use update_post to change it, or pick another slug.`);
      const seo = seoCheck(p, all.filter((o) => o.slug !== slug));
      if (seo.errors.length) return { saved: false, reason: "Fix the errors first.", seo };
      const cur = await ctx.store.get("drafts", slug);
      await ctx.store.put("drafts", slug, serializePost(p), `blog draft: ${p.title}`, cur?.sha);
      return { saved: true, slug, preview: previewUrl(ctx, slug), seo, next: "Show the owner the title, description and preview link. Publish only after they approve." };
    }

    case "publish_post": {
      const slug = slugOf(args.slug);
      const date = args.date ? need(args.date, "date") : today;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) throw new ToolError("date must look like 2026-11-18.");
      if (date < today) throw new ToolError("The publish date can't be in the past.");
      const draft = await ctx.store.get("drafts", slug);
      if (!draft) throw new ToolError(`No draft called "${slug}". Save it with save_draft first.`);
      if (await ctx.store.get("published", slug)) throw new ToolError(`"${slug}" is already published.`);
      const all = await allPosts(ctx);
      const sameDay = all.filter((o) => o.status === "published" && o.published === date).length;
      if (sameDay >= ctx.maxPerDay) throw new ToolError(`${sameDay} post(s) already go out on ${date}; the limit is ${ctx.maxPerDay} a day. Pick another date.`);
      const p = { ...parsePost(slug, draft.text), published: date, updated: date };
      const seo = seoCheck(p, all.filter((o) => o.slug !== slug));
      if (seo.errors.length) return { published: false, reason: "The draft has SEO errors; fix them with update_post first.", seo };
      await ctx.store.put("published", slug, serializePost(p), `blog: publish "${p.title}"`);
      await ctx.store.remove("drafts", slug, draft.sha, `blog draft: published ${slug}`);
      return date > today
        ? { published: true, scheduled: date, url: liveUrl(slug), note: `Scheduled: it appears on ${date} after the site's daily rebuild.` }
        : { published: true, url: liveUrl(slug), note: "The site is rebuilding; the post is live in about 3 minutes." };
    }

    case "update_post": {
      const slug = slugOf(args.slug);
      const where: Where | null = (await ctx.store.get("drafts", slug)) ? "drafts" : (await ctx.store.get("published", slug)) ? "published" : null;
      if (!where) throw new ToolError(`No post or draft called "${slug}".`);
      const f = (await ctx.store.get(where, slug))!;
      const cur = parsePost(slug, f.text);
      const next: PostFile = {
        ...cur,
        ...(args.title !== undefined ? { title: need(args.title, "title") } : {}),
        ...(args.description !== undefined ? { description: need(args.description, "description") } : {}),
        ...(args.keywords !== undefined ? { keywords: keywordsOf(args.keywords) } : {}),
        ...(args.body !== undefined ? { body: need(args.body, "body") } : {}),
        ...(where === "published" ? { updated: today > cur.published ? today : cur.published } : {}),
      };
      const seo = seoCheck(next, (await allPosts(ctx)).filter((o) => o.slug !== slug));
      if (seo.errors.length) return { saved: false, reason: "Fix the errors first.", seo };
      await ctx.store.put(where, slug, serializePost(next), where === "published" ? `blog: update "${next.title}"` : `blog draft: ${next.title}`, f.sha);
      return where === "published"
        ? { saved: true, status: where, url: liveUrl(slug), seo, note: "The site is rebuilding; changes are live in about 3 minutes." }
        : { saved: true, status: where, preview: previewUrl(ctx, slug), seo };
    }

    case "delete_draft": {
      const slug = slugOf(args.slug);
      const f = await ctx.store.get("drafts", slug);
      if (!f) throw new ToolError(`No draft called "${slug}".`);
      await ctx.store.remove("drafts", slug, f.sha, `blog draft: delete ${slug}`);
      return { deleted: true, slug };
    }
  }
  throw new ToolError(`Unknown tool "${name}".`);
}

// ── JSON-RPC ───────────────────────────────────────────────────────────────────

type Rpc = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };
const ok = (id: Rpc["id"], result: unknown) => ({ jsonrpc: "2.0", id, result });
const fail = (id: Rpc["id"], code: number, message: string) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });

/** Handles one JSON-RPC message. Returns null for notifications (no reply). */
export async function handleRpc(msg: Rpc, ctx: McpContext): Promise<object | null> {
  if (!msg || typeof msg !== "object" || typeof msg.method !== "string") return fail(msg?.id, -32600, "Invalid request");
  const isNotification = msg.id === undefined || msg.id === null;
  if (isNotification) return null;
  switch (msg.method) {
    case "initialize": {
      const asked = String(msg.params?.protocolVersion ?? "");
      return ok(msg.id, {
        protocolVersion: PROTOCOLS.includes(asked) ? asked : PROTOCOLS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: "Mochi blog tools. Call blog_guidelines first. Save drafts with save_draft and publish only after the owner approves.",
      });
    }
    case "ping":
      return ok(msg.id, {});
    case "tools/list":
      return ok(msg.id, { tools: TOOLS });
    case "tools/call": {
      const name = String(msg.params?.name ?? "");
      const args = (msg.params?.arguments ?? {}) as Record<string, unknown>;
      if (!TOOLS.some((t) => t.name === name)) return fail(msg.id, -32602, `Unknown tool "${name}"`);
      try {
        const out = await callTool(name, args, ctx);
        return ok(msg.id, { content: [{ type: "text", text: typeof out === "string" ? out : JSON.stringify(out, null, 2) }], isError: false });
      } catch (err) {
        const message = err instanceof ToolError ? err.message : `Something went wrong: ${(err as Error).message}`;
        return ok(msg.id, { content: [{ type: "text", text: message }], isError: true });
      }
    }
    case "resources/list":
      return ok(msg.id, { resources: [] });
    case "prompts/list":
      return ok(msg.id, { prompts: [] });
    default:
      return fail(msg.id, -32601, `Method not found: ${msg.method}`);
  }
}

/** Constant-time check of a presented key against the configured one. */
export function keyMatches(presented: string | null | undefined, expected: string): boolean {
  if (!presented || !expected) return false;
  const a = crypto.createHash("sha256").update(presented).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}
