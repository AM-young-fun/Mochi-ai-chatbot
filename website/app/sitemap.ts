import type { MetadataRoute } from "next";
import { CONTENT, LANGS } from "@/lib/content";
import { SITE_URL, pathFor } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(LANGS.map((l) => [CONTENT[l].htmlLang, SITE_URL + pathFor(l)]));
  return LANGS.map((l) => ({
    url: SITE_URL + pathFor(l),
    changeFrequency: "weekly",
    priority: l === "en" ? 1 : 0.8,
    alternates: { languages },
  }));
}
