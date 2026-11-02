import { notFound } from "next/navigation";
import { Landing } from "@/components/Landing";
import { LANGS } from "@/lib/content";
import { isLang, metadataFor } from "@/lib/site";

// zh, ja and pt are prerendered; anything else (including /en, which lives at /) is a 404.
export const dynamicParams = false;
export function generateStaticParams() {
  return LANGS.filter((l) => l !== "en").map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return isLang(lang) ? metadataFor(lang) : {};
}

export default async function LangHome({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang) || lang === "en") notFound();
  return <Landing lang={lang} />;
}
