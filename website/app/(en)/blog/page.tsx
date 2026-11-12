import type { Metadata } from "next";
import { BlogIndex } from "@/components/Blog";
import { BLOG_PATH } from "@/lib/blog";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Mochi blog · Running your own AI companion",
  description: "Notes on running your own AI companion with Mochi: memory, costs, hosting and the catches.",
  alternates: { canonical: SITE_URL + BLOG_PATH },
  openGraph: { type: "website", url: SITE_URL + BLOG_PATH, siteName: "Mochi", images: [{ url: "/social-preview.png", width: 1280, height: 640, alt: "Mochi" }] },
  icons: { icon: [{ url: "/favicon.ico", sizes: "48x48" }, { url: "/icon-192.png", sizes: "192x192", type: "image/png" }], apple: "/apple-touch-icon.png" },
};

export default function BlogPage() {
  return <BlogIndex />;
}
