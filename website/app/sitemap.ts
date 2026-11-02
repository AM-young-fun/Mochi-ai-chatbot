import type { MetadataRoute } from "next";
import { CONTENT, LANGS } from "@/lib/content";
import { urlFor } from "@/lib/site";

const BUILT = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries([...LANGS.map((l) => [CONTENT[l].htmlLang, urlFor(l)]), ["x-default", urlFor("en")]]);
  return LANGS.map((l) => ({
    url: urlFor(l),
    lastModified: BUILT,
    changeFrequency: "weekly",
    priority: l === "en" ? 1 : 0.8,
    alternates: { languages },
  }));
}
