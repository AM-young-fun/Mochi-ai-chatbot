import { notFound } from "next/navigation";
import { Deploy } from "@/components/Deploy";
import { LANGS } from "@/lib/content";
import { DEPLOY } from "@/lib/deploy";
import { deployMetadataFor, isLang } from "@/lib/site";

export const dynamicParams = false;
export function generateStaticParams() {
  return LANGS.filter((l) => l !== "en").map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return isLang(lang) ? deployMetadataFor(lang, DEPLOY[lang].title, DEPLOY[lang].description) : {};
}

export default async function LangDeploy({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang) || lang === "en") notFound();
  return <Deploy lang={lang} />;
}
