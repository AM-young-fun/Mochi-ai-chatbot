import { notFound } from "next/navigation";
import { WatchPage } from "@/components/WatchPage";
import { LANGS } from "@/lib/content";
import { isLang, tutorialMetadataFor } from "@/lib/site";
import { tutorialFor } from "@/lib/video";

export const dynamicParams = false;
export function generateStaticParams() {
  return LANGS.filter((l) => l !== "en").map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const tv = tutorialFor(lang);
  return tutorialMetadataFor(lang, tv.name, tv.description, tv.poster);
}

export default async function LangTutorial({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang) || lang === "en") notFound();
  return <WatchPage lang={lang} />;
}
