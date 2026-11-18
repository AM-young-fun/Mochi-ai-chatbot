import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogArticle } from "@/components/Blog";
import { previewKey } from "@/lib/blog-mcp";
import { mcpContext } from "@/lib/blog-mcp-http";
import { parsePost, SLUG_RE } from "@/lib/blog-md";
import { toBlogPost } from "@/lib/blog";

// Private preview of a draft, for the owner to approve before publishing. The link (from save_draft) carries a
// key made for this one draft; without it, or with the wrong one, the page doesn't exist.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Draft preview · Mochi", robots: { index: false, follow: false } };

export default async function DraftPreview({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ key?: string }> }) {
  const { slug } = await params;
  const { key } = await searchParams;
  const ctx = mcpContext();
  if (typeof ctx === "string" || !SLUG_RE.test(slug) || key !== previewKey(ctx.previewSecret, slug)) notFound();
  const f = await ctx.store.get("drafts", slug);
  if (!f) notFound();
  const today = new Date().toISOString().slice(0, 10);
  const p = parsePost(slug, f.text);
  return (
    <>
      <p className="draft-banner">Draft preview. Not published, not indexed.</p>
      <BlogArticle post={toBlogPost({ ...p, published: p.published || today, updated: p.updated || today })} />
    </>
  );
}
