// No imports from Next here: the repo-root UTM test imports this file directly.
type Lang = "en" | "zh" | "ja" | "pt";

/**
 * Tracked link to Flatkey key creation. Mochi serves small, self-serve customers, so every
 * Flatkey link on this site goes to creating a key (never to sales or contact pages).
 *   utm_source=mochi_bot, utm_medium=mochi_site, utm_campaign=mochi,
 *   utm_content=<spot>, with a _zh/_ja/_pt suffix outside English.
 */
export const FLATKEY_CONSOLE = "https://console.flatkey.ai";

export function flatkeyKeyUrl(spot: string, lang: Lang): string {
  const u = new URL(`${FLATKEY_CONSOLE}/keys`);
  u.searchParams.set("utm_source", "mochi_bot");
  u.searchParams.set("utm_medium", "mochi_site");
  u.searchParams.set("utm_campaign", "mochi");
  u.searchParams.set("utm_content", lang === "en" ? spot : `${spot}_${lang}`);
  return u.toString();
}

/**
 * Legacy linker configuration retained for the separately maintained self-hosted
 * dashboard and its tests. The public site now uses its own consented GA4 client
 * and does not apply this list. Mochi-to-Flatkey handoff uses outgoing UTM links;
 * Flatkey Console must keep its own measurement ID.
 */
export const ANALYTICS_LINKER_DOMAINS = ["www.mochichatbot.com", "mochichatbot.com", "flatkey.ai", "console.flatkey.ai"] as const;

/** Google Ads click IDs: gclid (web), gbraid/wbraid (iOS app/web measurement). */
export const AD_CLICK_PARAMS = ["gclid", "gbraid", "wbraid"] as const;
export type AdClick = Partial<Record<(typeof AD_CLICK_PARAMS)[number], string>>;

/**
 * Hand a Google Ads click to Flatkey. The Mochi site has its own analytics, so instead of sharing
 * Flatkey's GA4 property, the click ID rides on the link: Flatkey's GA4 on console.flatkey.ai sees
 * gclid on the landing URL, credits the visit to google / cpc and the ad campaign, and the
 * sign-up/top-up conversions it imports into Google Ads are attributed to the click.
 * Keep the site's referral UTM evidence alongside consented ad click IDs. GA4 can distinguish
 * paid attribution from the cluster handoff; neither source is silently rewritten here.
 */
export function withAdClick(href: string, click: AdClick): string {
  const ids = AD_CLICK_PARAMS.filter((k) => click[k]);
  if (!ids.length) return href;
  const u = new URL(href);
  if (u.protocol !== "https:" || !["flatkey.ai", "www.flatkey.ai", "console.flatkey.ai"].includes(u.hostname)) return href;
  for (const k of ids) if (!u.searchParams.has(k) && /^[A-Za-z0-9_.~-]{1,1024}$/.test(click[k]!)) u.searchParams.set(k, click[k]!);
  return u.toString();
}
