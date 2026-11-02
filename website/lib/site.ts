import type { Metadata } from "next";
import { CONTENT, LANGS, type Lang } from "./content";

export { flatkeyKeyUrl } from "./links";

/**
 * The site's public address, used for canonical URLs, hreflang, the sitemap and og:image.
 * Set SITE_URL (e.g. https://mochichatbot.com) once the domain is live; until then Vercel's
 * production domain is used.
 */
export const SITE_URL = normalizeSiteUrl(
  process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || "http://localhost:3000",
);

/** Accepts "mochichatbot.com", "https://mochichatbot.com/" etc. and returns "https://mochichatbot.com". */
function normalizeSiteUrl(raw: string): string {
  const v = raw.trim().replace(/\/+$/, "");
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    return new URL(withScheme).origin;
  } catch {
    throw new Error(`SITE_URL is not a valid address: "${raw}". Use something like https://mochichatbot.com`);
  }
}

export const REPO = "https://github.com/flatkey-ai/Mochi-ai-chatbot";
export const DEPLOY_GUIDE = `${REPO}/blob/main/deploy/README.md`;

/** Path of a language's home page: English at the root, the others under /zh, /ja, /pt. */
export const pathFor = (lang: Lang) => (lang === "en" ? "/" : `/${lang}`);
export const isLang = (s: string): s is Lang => (LANGS as readonly string[]).includes(s);

export function metadataFor(lang: Lang): Metadata {
  const c = CONTENT[lang];
  const url = SITE_URL + pathFor(lang);
  return {
    metadataBase: new URL(SITE_URL),
    title: c.title,
    description: c.description,
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(LANGS.map((l) => [CONTENT[l].htmlLang, SITE_URL + pathFor(l)])),
        "x-default": SITE_URL + "/",
      },
    },
    openGraph: {
      type: "website",
      url,
      title: c.title,
      description: c.description,
      siteName: "Mochi",
      locale: c.htmlLang.replace("-", "_"),
      images: [{ url: "/social-preview.png", width: 1280, height: 640, alt: "Mochi" }],
    },
    twitter: { card: "summary_large_image", title: c.title, description: c.description, images: ["/social-preview.png"] },
    icons: { icon: "/mochi-avatar-128.png", apple: "/mochi-avatar-256.png" },
  };
}
