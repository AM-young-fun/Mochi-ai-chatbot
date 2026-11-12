import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogArticle } from "@/components/Blog";
import { POSTS, postBySlug, postPath } from "@/lib/blog";
import { SITE_URL } from "@/lib/site";

export const dynamicParams = false;
export const generateStaticParams = () => POSTS.map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = postBySlug((await params).slug);
  if (!post) return {};
  const url = SITE_URL + postPath(post.slug);
  return {
    metadataBase: new URL(SITE_URL),
    title: `${post.title} · Mochi`,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.description,
      siteName: "Mochi",
      publishedTime: post.published,
      modifiedTime: post.updated,
      images: [{ url: "/social-preview.png", width: 1280, height: 640, alt: "Mochi" }],
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.description, images: ["/social-preview.png"] },
    icons: { icon: [{ url: "/favicon.ico", sizes: "48x48" }, { url: "/icon-192.png", sizes: "192x192", type: "image/png" }], apple: "/apple-touch-icon.png" },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const post = postBySlug((await params).slug);
  if (!post) notFound();
  return <BlogArticle post={post} />;
}
