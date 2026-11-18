// Blog posts as Markdown: parsing, safe rendering and the SEO check. Shared by the website build, the draft
// preview page and the blog MCP (/api/mcp). No "@/" imports: the repo-root tests import this file directly.
import { Marked, type Tokens } from "marked";
import { flatkeyKeyUrl } from "./links";

export const SITE = "https://www.mochichatbot.com";

export interface PostMeta {
  slug: string;
  title: string;
  /** Meta description and the line under the title on the index (aim for 120–160 characters). */
  description: string;
  /** ISO dates (YYYY-MM-DD). */
  published: string;
  updated: string;
  keywords: string[];
}

export interface PostFile extends PostMeta {
  /** Markdown body, without the frontmatter. */
  body: string;
}

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FRONT_KEYS = ["title", "description", "published", "updated", "keywords"] as const;

// ── File format ────────────────────────────────────────────────────────────────
// ---
// title: "Own your AI companion"
// description: "…"
// published: "2026-11-18"
// updated: "2026-11-18"
// keywords: ["ai companion", "self-hosted"]
// ---
// Markdown body…
// Every value is JSON, so quotes and colons in titles never break parsing.

export function serializePost(p: PostFile): string {
  const lines = FRONT_KEYS.map((k) => `${k}: ${JSON.stringify(p[k])}`);
  return `---\n${lines.join("\n")}\n---\n\n${p.body.trim()}\n`;
}

export function parsePost(slug: string, text: string): PostFile {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!m) throw new Error(`${slug}: missing the --- frontmatter --- block`);
  const meta: Record<string, unknown> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([a-zA-Z]+):\s*(.*)$/.exec(line.trim());
    if (!kv) continue;
    try { meta[kv[1]] = JSON.parse(kv[2]); } catch { meta[kv[1]] = kv[2]; }
  }
  const str = (k: string) => (typeof meta[k] === "string" ? (meta[k] as string) : "");
  return {
    slug,
    title: str("title"),
    description: str("description"),
    published: str("published"),
    updated: str("updated") || str("published"),
    keywords: Array.isArray(meta.keywords) ? meta.keywords.map(String) : str("keywords").split(",").map((s) => s.trim()).filter(Boolean),
    body: m[2].trim(),
  };
}

// ── Rendering ──────────────────────────────────────────────────────────────────

/**
 * Link shortcuts a writer (or a bot) can use instead of full URLs. They become tracked links, so a post can
 * never send people to Flatkey without the UTM tags.
 */
export function placeholders(slug: string): Record<string, string> {
  return {
    "{{flatkey}}": flatkeyKeyUrl(`blog_${slug}`.slice(0, 60), "en"),
    "{{railway}}": "https://railway.com/new/template/mochi-ai-chatbot",
    "{{deploy}}": "/deploy",
    "{{guide}}": "/#get-started",
    "{{tutorial}}": "/tutorial",
    "{{blog}}": "/blog",
    "{{github}}": "https://github.com/AM-young-fun/Mochi-ai-chatbot",
  };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const safeHref = (href: string) => /^(https?:\/\/|\/(?!\/)|#|mailto:)/i.test(href.trim());
const isExternal = (href: string) => /^https?:\/\//i.test(href) && !href.startsWith(SITE);
const headingId = (text: string) => text.toLowerCase().replace(/<[^>]+>/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

function makeRenderer(): Marked {
  return new Marked({
    gfm: true,
    breaks: false,
    renderer: {
      // Raw HTML in a post is shown as text, never run: posts can come from a bot.
      html(token: Tokens.HTML | Tokens.Tag) {
        return esc(token.text);
      },
      link(token: Tokens.Link) {
        const text = this.parser.parseInline(token.tokens);
        if (!safeHref(token.href)) return text;
        const title = token.title ? ` title="${esc(token.title)}"` : "";
        const ext = isExternal(token.href) ? ' target="_blank" rel="noopener"' : "";
        return `<a href="${esc(token.href)}"${title}${ext}>${text}</a>`;
      },
      image(token: Tokens.Image) {
        if (!/^(https:\/\/|\/(?!\/))/i.test(token.href)) return esc(token.text);
        return `<img src="${esc(token.href)}" alt="${esc(token.text)}" loading="lazy" />`;
      },
      // The post title is the page's only <h1>; "#" in the body becomes an <h2>.
      heading(token: Tokens.Heading) {
        const level = Math.min(Math.max(token.depth, 2), 4);
        const inner = this.parser.parseInline(token.tokens);
        return `<h${level} id="${headingId(inner)}">${inner}</h${level}>\n`;
      },
    },
  });
}

/** Markdown body → HTML that's safe to put on the page. */
export function renderMarkdown(body: string, slug: string): string {
  let md = body;
  for (const [k, v] of Object.entries(placeholders(slug))) md = md.split(k).join(v);
  return makeRenderer().parse(md, { async: false }) as string;
}

export function wordCount(md: string): number {
  const text = md.replace(/```[\s\S]*?```/g, " ").replace(/\]\([^)]*\)/g, "]").replace(/[#*_>`~[\]-]/g, " ");
  // CJK characters count roughly as words too.
  const cjk = (text.match(/[぀-ヿ㐀-鿿]/g) ?? []).length;
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length + Math.round(cjk / 2);
}

export const readMinutes = (md: string) => Math.max(1, Math.round(wordCount(md) / 220));

// ── SEO check ──────────────────────────────────────────────────────────────────

export interface SeoReport {
  score: number;
  /** Must be fixed before the post can be saved or published. */
  errors: string[];
  /** Worth fixing; the post can still go out. */
  warnings: string[];
  stats: { words: number; minutes: number; titleChars: number; descriptionChars: number; h2: number; internalLinks: number; externalLinks: number };
}

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const tokens = (s: string) => new Set(norm(s).split(" ").filter((w) => w.length > 2));
function overlap(a: string, b: string): number {
  const A = tokens(a), B = tokens(b);
  if (!A.size || !B.size) return 0;
  let n = 0;
  for (const w of A) if (B.has(w)) n++;
  return n / Math.min(A.size, B.size);
}

/**
 * Checks a post against on-page SEO basics and the Mochi house rules. `others` are the other posts on the
 * site (published and drafts), used to warn about two posts competing for the same search.
 */
export function seoCheck(p: Partial<PostFile> & { slug: string }, others: Pick<PostMeta, "slug" | "title" | "keywords">[] = []): SeoReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const title = (p.title ?? "").trim();
  const description = (p.description ?? "").trim();
  const body = (p.body ?? "").trim();
  const keywords = (p.keywords ?? []).map((k) => k.trim()).filter(Boolean);
  const words = wordCount(body);
  const h2 = (body.match(/^#{1,2}\s+\S/gm) ?? []).length;
  const links = [...body.matchAll(/\]\(([^)\s]+)/g)].map((m) => m[1]);
  const internalLinks = links.filter((l) => l.startsWith("/") || l.startsWith(SITE) || /^\{\{(deploy|guide|tutorial|blog)\}\}$/.test(l)).length;
  const externalLinks = links.length - internalLinks;

  if (!SLUG_RE.test(p.slug)) errors.push("Slug must be lowercase words joined by hyphens, like self-hosted-ai-companion.");
  else if (p.slug.length > 60) errors.push("Slug is over 60 characters; shorten it to the main search phrase.");
  if (!title) errors.push("Title is missing.");
  else if (title.length > 70) errors.push(`Title is ${title.length} characters; keep it under 70 (Google cuts it around 60).`);
  else if (title.length < 20) errors.push(`Title is ${title.length} characters; make it at least 20.`);
  else if (title.length > 60) warnings.push(`Title is ${title.length} characters; 50–60 shows in full on Google.`);
  if (!description) errors.push("Description is missing.");
  else if (description.length > 170) errors.push(`Description is ${description.length} characters; keep it under 170.`);
  else if (description.length < 70) errors.push(`Description is ${description.length} characters; write at least 70.`);
  else if (description.length < 120 || description.length > 160) warnings.push(`Description is ${description.length} characters; 120–160 is the sweet spot.`);
  if (!body) errors.push("Body is empty.");
  else if (words < 400) errors.push(`Body is ${words} words; write at least 400 (600–1,500 ranks better).`);
  else if (words < 600) warnings.push(`Body is ${words} words; 600–1,500 usually ranks better.`);
  if (!keywords.length) errors.push("Add at least one keyword: the main search phrase this post should rank for, first.");
  if (/<\s*(script|iframe|style|object|embed|form)\b/i.test(body)) errors.push("Body contains HTML like <script> or <iframe>; it will be shown as text. Use Markdown only.");
  if (!/flatkey/i.test(body)) errors.push("Mention Flatkey: Mochi runs on Flatkey as its model provider, and every post that pitches Mochi says so.");

  if (keywords[0]) {
    const k = norm(keywords[0]);
    const first = norm(body.split(/\s+/).slice(0, 120).join(" "));
    if (!norm(title).includes(k)) warnings.push(`The main keyword "${keywords[0]}" isn't in the title.`);
    if (!norm(description).includes(k)) warnings.push(`The main keyword "${keywords[0]}" isn't in the description.`);
    if (!first.includes(k)) warnings.push(`The main keyword "${keywords[0]}" doesn't appear in the first paragraph.`);
    const heads = (body.match(/^#{1,3}\s+.*$/gm) ?? []).map(norm).join(" ");
    if (!tokens(keywords[0]).size || ![...tokens(keywords[0])].some((w) => heads.includes(w))) warnings.push("No heading uses words from the main keyword.");
    const hits = norm(body).split(k).length - 1;
    if (words > 0 && (hits * k.split(" ").length) / words > 0.03) warnings.push(`"${keywords[0]}" makes up over 3% of the words; that reads as keyword stuffing.`);
  }
  if (h2 < 2) warnings.push("Use at least two ## headings so readers (and Google) can scan the post.");
  if (internalLinks < 2) warnings.push("Link to at least two Mochi pages, e.g. {{guide}}, {{deploy}}, {{tutorial}} or another post.");
  if (/[—–]/.test(body + title + description)) warnings.push("House style: no em or en dashes; use a comma, colon or period.");
  const credit = [...(body + " " + description).matchAll(/\$\s?(\d+(?:\.\d+)?)\s*(?:of\s+)?(?:free\s+)?credit/gi)].filter((m) => m[1] !== "1");
  if (credit.length) warnings.push("The only Flatkey offer to mention is $1 of free credit for new accounts.");
  if (/\]\(https?:\/\/(console\.)?flatkey\.ai/i.test(body)) warnings.push("Link to Flatkey with {{flatkey}} so the link is tracked.");
  if (body.split(/\n{2,}/).some((para) => !/^[#>*\-\d|`]/.test(para) && para.split(/\s+/).length > 140)) warnings.push("Some paragraphs are over 140 words; split them up.");
  for (const o of others) {
    if (o.slug === p.slug) continue;
    if (overlap(title, o.title) >= 0.7 || (keywords[0] && o.keywords[0] && norm(keywords[0]) === norm(o.keywords[0]))) {
      warnings.push(`Close to the post "${o.title}" (${o.slug}); two posts aiming at the same search compete with each other. Pick a different angle or keyword.`);
    }
  }

  const score = Math.max(0, 100 - errors.length * 15 - warnings.length * 5);
  return { score, errors, warnings, stats: { words, minutes: readMinutes(body), titleChars: title.length, descriptionChars: description.length, h2, internalLinks, externalLinks } };
}
