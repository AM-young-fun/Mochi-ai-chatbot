import { notFound } from "next/navigation";
import { CONTENT } from "@/lib/content";
import { isLang } from "@/lib/site";
import "../globals.css";

export default async function LangLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang) || lang === "en") notFound();
  return (
    <html lang={CONTENT[lang].htmlLang}>
      <body>{children}</body>
    </html>
  );
}
