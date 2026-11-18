import { POSTS } from "@/lib/blog";
import { OG_SIZE, postCard } from "@/lib/og-post";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Mochi blog post";
export const generateStaticParams = () => POSTS.map((p) => ({ slug: p.slug }));

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  return postCard((await params).slug);
}
