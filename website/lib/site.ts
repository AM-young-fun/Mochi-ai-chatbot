import type { Metadata } from "next";
import { CONTENT, LANGS, type Lang } from "./content";

export { flatkeyKeyUrl } from "./links";

/** The site's one public address. Production always uses it, so canonicals can't drift. */
export const PRODUCTION_ORIGIN = "https://www.mochichatbot.com";

/**
 * Origin used for canonical URLs, hreflang, the sitemap, robots.txt, og:image and JSON-LD.
 * Production: always PRODUCTION_ORIGIN (www). The apex domain redirects there (next.config.ts).
 * Preview and local builds: SITE_URL if set, else the Vercel deployment URL, else localhost.
 */
export const SITE_URL = resolveSiteUrl();

function resolveSiteUrl(): string {
  const raw = process.env.SITE_URL?.trim();
  if (process.env.VERCEL_ENV === "production") {
    const other = raw ? toOrigin(raw) : null;
    if (other && other !== PRODUCTION_ORIGIN) console.warn(`[mochi-website] Ignoring SITE_URL ${other}: production always uses ${PRODUCTION_ORIGIN}.`);
    return PRODUCTION_ORIGIN;
  }
  const url = raw ? toOrigin(raw) : null;
  if (url) return url;
  const fallback = process.env.VERCEL_URL || "localhost:3000";
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

export const REPO = "https://github.com/AM-young-fun/Mochi-ai-chatbot";
export const DEPLOY_GUIDE = `${REPO}/blob/main/deploy/README.md`;
/** One-click deploy: Render reads render.yaml from the repo and creates the service in the visitor's account. */
export const RENDER_DEPLOY = `https://render.com/deploy?repo=${REPO}`;


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
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "48x48" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      ],
      apple: "/apple-touch-icon.png",
    },
  };
}

export const privacyPathFor = (lang: Lang) => (lang === "en" ? "/privacy" : `/${lang}/privacy`);
export const privacyUrlFor = (lang: Lang) => SITE_URL + privacyPathFor(lang);

export function privacyMetadataFor(lang: Lang, title: string, description: string): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical: privacyUrlFor(lang),
      languages: {
        ...Object.fromEntries(LANGS.map((l) => [CONTENT[l].htmlLang, privacyUrlFor(l)])),
        "x-default": privacyUrlFor("en"),
      },
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "48x48" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      ],
      apple: "/apple-touch-icon.png",
    },
  };
}

export const tutorialPathFor = (lang: Lang) => (lang === "en" ? "/tutorial" : `/${lang}/tutorial`);
export const tutorialUrlFor = (lang: Lang) => SITE_URL + tutorialPathFor(lang);

export function tutorialMetadataFor(lang: Lang, title: string, description: string, poster: string): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: `${title} · Mochi`,
    description,
    alternates: {
      canonical: tutorialUrlFor(lang),
      languages: {
        ...Object.fromEntries(LANGS.map((l) => [CONTENT[l].htmlLang, tutorialUrlFor(l)])),
        "x-default": tutorialUrlFor("en"),
      },
    },
    openGraph: { type: "video.other", url: tutorialUrlFor(lang), title, description, siteName: "Mochi", locale: OG_LOCALE[lang], images: [{ url: poster, width: 1280, height: 720, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [poster] },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "48x48" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      ],
      apple: "/apple-touch-icon.png",
    },
  };
}
