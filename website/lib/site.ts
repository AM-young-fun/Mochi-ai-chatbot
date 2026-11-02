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
 * Production builds must have a usable SITE_URL: a wrong canonical/hreflang/sitemap address
 * (e.g. localhost) is worse for SEO than a failed deploy. A Vercel "Sensitive" variable reaches
 * the build as the text "[SENSITIVE]", so it has to be a plain variable.
 * Preview and local builds fall back to the Vercel URL or localhost.
 */
function resolveSiteUrl(): string {
  const raw = process.env.SITE_URL?.trim();
  const url = raw ? toOrigin(raw) : null;
  if (url) return url;
  const why = raw ? `SITE_URL "${raw}" is not a usable address` : "SITE_URL is not set";
  if (process.env.VERCEL_ENV === "production") {
    throw new Error(`[mochi-website] ${why}. Set it in Vercel → Settings → Environment Variables (Production) as a plain, not Sensitive, variable like https://mochichatbot.com`);
  }
  const fallback = process.env.VERCEL_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || "localhost:3000";
  if (process.env.VERCEL_ENV) console.warn(`[mochi-website] ${why}; using ${fallback} for this ${process.env.VERCEL_ENV} build.`);
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
/** Absolute URL of a language's home page. The root has no trailing slash, matching what Next.js emits. */
export const urlFor = (lang: Lang) => (lang === "en" ? SITE_URL : SITE_URL + pathFor(lang));
export const isLang = (s: string): s is Lang => (LANGS as readonly string[]).includes(s);

/** Open Graph locales (language_TERRITORY). */
const OG_LOCALE: Record<Lang, string> = { en: "en_US", zh: "zh_CN", ja: "ja_JP", pt: "pt_BR" };

export function metadataFor(lang: Lang): Metadata {
  const c = CONTENT[lang];
  const url = urlFor(lang);
  return {
    metadataBase: new URL(SITE_URL),
    title: c.title,
    description: c.description,
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(LANGS.map((l) => [CONTENT[l].htmlLang, urlFor(l)])),
        "x-default": urlFor("en"),
      },
    },
    openGraph: {
      type: "website",
      url,
      title: c.title,
      description: c.description,
      siteName: "Mochi",
      locale: OG_LOCALE[lang],
      alternateLocale: LANGS.filter((l) => l !== lang).map((l) => OG_LOCALE[l]),
      images: [{ url: "/social-preview.png", width: 1280, height: 640, alt: "Mochi" }],
    },
    twitter: { card: "summary_large_image", title: c.title, description: c.description, images: ["/social-preview.png"] },
    icons: { icon: "/mochi-avatar-128.png", apple: "/mochi-avatar-256.png" },
  };
}
