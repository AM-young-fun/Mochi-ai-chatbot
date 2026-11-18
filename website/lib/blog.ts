/**
 * Blog posts (English). Each post is a Markdown file in website/content/blog/<slug>.md with a small JSON
 * frontmatter (see lib/blog-md.ts). The blog index, the post pages, the sitemap and the BlogPosting
 * structured data all read from here, at build time.
 *
 * Posts are written and published through the blog MCP (/api/mcp): drafts live on the blog-drafts branch,
 * and publishing commits the file to main, which redeploys the site. Editing a file by hand works too.
 * Keep the Flatkey disclosure and the privacy caveat in every post that pitches Mochi.
 */
import fs from "node:fs";
import path from "node:path";
import { parsePost, readMinutes, renderMarkdown, type PostFile } from "./blog-md";

export interface BlogPost extends PostFile {
  minutes: number;
  /** The body rendered to safe HTML. */
  html: string;
}

export const BLOG_PATH = "/blog";
export const postPath = (slug: string) => `${BLOG_PATH}/${slug}`;

/** website/content/blog, wherever the build runs from (website/ or the repo root). */
export function blogDir(): string {
  const a = path.join(process.cwd(), "content", "blog");
  return fs.existsSync(a) ? a : path.join(process.cwd(), "website", "content", "blog");
}

export function toBlogPost(p: PostFile): BlogPost {
  return { ...p, minutes: readMinutes(p.body), html: renderMarkdown(p.body, p.slug) };
}

function loadPosts(): BlogPost[] {
  const dir = blogDir();
  if (!fs.existsSync(dir)) return [];
  const today = new Date().toISOString().slice(0, 10);
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => toBlogPost(parsePost(f.slice(0, -3), fs.readFileSync(path.join(dir, f), "utf8"))))
    // A post dated in the future waits for the first build on or after that day.
    .filter((p) => p.title && p.published && p.published <= today)
    .sort((a, b) => (a.published < b.published ? 1 : a.published > b.published ? -1 : a.slug.localeCompare(b.slug)));
}

/** Newest first. */
export const POSTS: BlogPost[] = loadPosts();
export const postBySlug = (slug: string) => POSTS.find((p) => p.slug === slug);
