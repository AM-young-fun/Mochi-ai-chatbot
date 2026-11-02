// No imports from Next here: the repo-root UTM test imports this file directly.
type Lang = "en" | "zh" | "ja" | "pt";

/**
 * Tracked link to Flatkey key creation. Mochi serves small, self-serve customers, so every
 * Flatkey link on this site goes to creating a key (never to sales or contact pages).
 *   utm_source=mochi_bot, utm_medium=mochi_site, utm_campaign=mochi,
 *   utm_content=<spot>, with a _zh/_ja/_pt suffix outside English.
 */
export function flatkeyKeyUrl(spot: string, lang: Lang): string {
  const u = new URL("https://console.flatkey.ai/keys");
  u.searchParams.set("utm_source", "mochi_bot");
  u.searchParams.set("utm_medium", "mochi_site");
  u.searchParams.set("utm_campaign", "mochi");
  u.searchParams.set("utm_content", lang === "en" ? spot : `${spot}_${lang}`);
  return u.toString();
}
