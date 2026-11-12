import { execSync } from "node:child_process";
import { CONTENT, LANGS, type Lang } from "@/lib/content";
import { SITE_URL, privacyUrlFor, tutorialUrlFor, urlFor } from "@/lib/site";
import { tutorialFor } from "@/lib/video";
import { BLOG_PATH, POSTS, postPath } from "@/lib/blog";

// Written by hand instead of app/sitemap.ts so the output follows the sitemaps.org XSD exactly:
// <loc>, <lastmod>, <changefreq>, <priority>, then extension elements (xhtml:link, image:image).
// Next.js's generator puts xhtml:link right after <loc>, which strict validators reject.
export const dynamic = "force-static";

const IMAGES = ["mochi-avatar-512.png", "bots.png", "persona.png", "knowledge.png", "channels.png", "bind-key.png"];

/**
 * When the page content last changed: the last git commit touching the website's copy,
 * components or images. Omitted (rather than faked with the build time) if git isn't available.
 */
function contentLastModified(): string | null {
  try {
    const out = execSync("git log -1 --format=%cI -- lib components app public", { cwd: process.cwd(), stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
    return out ? new Date(out).toISOString() : null;
  } catch {
    return null;
  }
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function GET(): Response {
  const lastmod = contentLastModified();
  const alternates = [
    ...LANGS.map((l) => [CONTENT[l].htmlLang, urlFor(l)] as const),
    ["x-default", urlFor("en")] as const,
  ];
  const entry = (lang: Lang) =>
    [
      "  <url>",
      `    <loc>${esc(urlFor(lang))}</loc>`,
      lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
      "    <changefreq>weekly</changefreq>",
      `    <priority>${lang === "en" ? "1.0" : "0.8"}</priority>`,
      ...alternates.map(([hl, href]) => `    <xhtml:link rel="alternate" hreflang="${hl}" href="${esc(href)}"/>`),
      ...IMAGES.map((img) => `    <image:image><image:loc>${esc(`${SITE_URL}/${img}`)}</image:loc></image:image>`),
      "  </url>",
    ]
      .filter(Boolean)
      .join("\n");

  const privacyAlternates = [
    ...LANGS.map((l) => [CONTENT[l].htmlLang, privacyUrlFor(l)] as const),
    ["x-default", privacyUrlFor("en")] as const,
  ];
  const privacyEntry = (lang: Lang) =>
    [
      "  <url>",
      `    <loc>${esc(privacyUrlFor(lang))}</loc>`,
      lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
      "    <changefreq>yearly</changefreq>",
      "    <priority>0.2</priority>",
      ...privacyAlternates.map(([hl, href]) => `    <xhtml:link rel="alternate" hreflang="${hl}" href="${esc(href)}"/>`),
      "  </url>",
    ]
      .filter(Boolean)
      .join("\n");

  // The tutorial's watch pages, with the video sitemap extension (Google's video indexing reads it).
  const tutorialAlternates = [
    ...LANGS.map((l) => [CONTENT[l].htmlLang, tutorialUrlFor(l)] as const),
    ["x-default", tutorialUrlFor("en")] as const,
  ];
  const tutorialEntry = (lang: Lang) => {
    const tv = tutorialFor(lang);
    return [
      "  <url>",
      `    <loc>${esc(tutorialUrlFor(lang))}</loc>`,
      lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
      "    <changefreq>monthly</changefreq>",
      "    <priority>0.7</priority>",
      ...tutorialAlternates.map(([hl, href]) => `    <xhtml:link rel="alternate" hreflang="${hl}" href="${esc(href)}"/>`),
      "    <video:video>",
      `      <video:thumbnail_loc>${esc(SITE_URL + tv.poster)}</video:thumbnail_loc>`,
      `      <video:title>${esc(tv.name)}</video:title>`,
      `      <video:description>${esc(tv.description)}</video:description>`,
      `      <video:player_loc>${esc(`https://www.youtube.com/embed/${tv.youtubeId}`)}</video:player_loc>`,
      `      <video:duration>${tv.seconds}</video:duration>`,
      `      <video:publication_date>${tv.uploaded}</video:publication_date>`,
      "    </video:video>",
      "  </url>",
    ]
      .filter(Boolean)
      .join("\n");
  };

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml"',
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"',
    '        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"',
    '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
    '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">',
    ...LANGS.map(entry),
    ...LANGS.map(privacyEntry),
    ...LANGS.map(tutorialEntry),
    [
      "  <url>",
      `    <loc>${esc(`${SITE_URL}/ja/line`)}</loc>`,
      lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
      "    <changefreq>monthly</changefreq>",
      "    <priority>0.6</priority>",
      "  </url>",
    ]
      .filter(Boolean)
      .join("\n"),
    [
      "  <url>",
      `    <loc>${esc(SITE_URL + BLOG_PATH)}</loc>`,
      `    <lastmod>${new Date(POSTS.map((p) => p.updated).sort().at(-1) + "T00:00:00Z").toISOString()}</lastmod>`,
      "    <changefreq>weekly</changefreq>",
      "    <priority>0.6</priority>",
      "  </url>",
    ].join("\n"),
    ...POSTS.map((p) =>
      [
        "  <url>",
        `    <loc>${esc(SITE_URL + postPath(p.slug))}</loc>`,
        `    <lastmod>${new Date(p.updated + "T00:00:00Z").toISOString()}</lastmod>`,
        "    <changefreq>monthly</changefreq>",
        "    <priority>0.7</priority>",
        "  </url>",
      ].join("\n"),
    ),
    "</urlset>",
    "",
  ].join("\n");

  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
