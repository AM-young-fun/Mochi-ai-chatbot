import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Preview deployments must not be indexed; only production is.
  const production = !process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production";
  return production
    ? { rules: { userAgent: "*", allow: "/" }, sitemap: `${SITE_URL}/sitemap.xml` }
    : { rules: { userAgent: "*", disallow: "/" } };
}
