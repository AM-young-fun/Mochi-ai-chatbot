import { notFound } from "next/navigation";
import { Privacy } from "@/components/Privacy";
import { LANGS } from "@/lib/content";
import { PRIVACY } from "@/lib/privacy";
import { isLang, privacyMetadataFor } from "@/lib/site";

export const dynamicParams = false;
export function generateStaticParams() {
  return LANGS.filter((l) => l !== "en").map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return isLang(lang) ? privacyMetadataFor(lang, PRIVACY[lang].title, PRIVACY[lang].description) : {};
}

export default async function LangPrivacy({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang) || lang === "en") notFound();
  return <Privacy lang={lang} />;
}
