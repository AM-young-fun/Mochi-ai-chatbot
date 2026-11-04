import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LINE_FAQ, LineFreelance } from "@/components/LineFreelance";
import { SITE_URL } from "@/lib/site";

// Japanese only: /ja/line. Every other language 404s.
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ lang: "ja" }];
}

const URL_JA = `${SITE_URL}/ja/line`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "LINE 公式アカウントの AI ボットを受託で作るなら Mochi｜フリーランス・制作会社向け",
  description:
    "クライアントの資料から答える LINE ボットを、1 台のサーバーでまとめて運用。オープンソース（MIT）で商用利用・納品 OK。ソフトは無料、かかるのはサーバー代と AI 利用料だけ。",
  alternates: { canonical: URL_JA },
  openGraph: {
    type: "website",
    url: URL_JA,
    title: "LINE 公式アカウントの AI 窓口を、クライアントごとに｜Mochi",
    description: "資料から答える LINE ボットを、1 台のサーバーで複数クライアント分。オープンソースで商用利用・納品 OK。",
    siteName: "Mochi",
    locale: "ja_JP",
    images: [{ url: "/social-preview.png", width: 1280, height: 640, alt: "Mochi" }],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default async function LinePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (lang !== "ja") notFound();
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: LINE_FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd).replace(/</g, "\\u003c") }} />
      <LineFreelance />
    </>
  );
}
