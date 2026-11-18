import { notFound } from "next/navigation";
import { Terms } from "@/components/Privacy";
import { LANGS } from "@/lib/content";
import { TERMS } from "@/lib/terms";
import { isLang, termsMetadataFor } from "@/lib/site";

export const dynamicParams = false;
export function generateStaticParams() {
  return LANGS.filter((l) => l !== "en").map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return isLang(lang) ? termsMetadataFor(lang, TERMS[lang].title, TERMS[lang].description) : {};
}

export default async function LangTerms({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang) || lang === "en") notFound();
  return <Terms lang={lang} />;
}
