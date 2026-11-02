import type { Metadata } from "next";
import { CONTENT, LANGS, type Lang } from "./content";

export { flatkeyKeyUrl } from "./links";

/**
 * The site's public address, used for canonical URLs, hreflang, the sitemap and og:image.
 * Set SITE_URL (e.g. https://mochichatbot.com) once the domain is live; until then Vercel's
 * production domain is used.
 */
export const SITE_URL = resolveSiteUrl();

/**
 * Accepts "mochichatbot.com", "https://mochichatbot.com/" etc. and returns "https://mochichatbot.com".
 * An unusable SITE_URL (e.g. a Vercel "Sensitive" variable, which builds read as "[SENSITIVE]")
 * falls back to the Vercel production domain with a warning instead of failing the deploy.
 */
function resolveSiteUrl(): string {
  const fallback = process.env.VERCEL_PROJECT_PRODUCTION_URL || "localhost:3000";
  const raw = process.env.SITE_URL?.trim();
  if (raw) {
    const url = toOrigin(raw);
    if (url) return url;
    console.warn(`[mochi-website] SITE_URL "${raw}" is not a usable address; using ${fallback}. In Vercel, set it as a plain (not Sensitive) variable like https://mochichatbot.com`);
  }
  return toOrigin(fallback, fallback.startsWith("localhost") ? "http" : "https")!;
}

function toOrigin(raw: string, scheme = "https"): string | null {
  const v = raw.trim().replace(/\/+$/, "");
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `${scheme}://${v}`);
    return /^[a-z0-9.-]+(:\d+)?$/i.test(u.host) ? u.origin : null;
  } catch {
    return null;
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
