import { mochiAnalytics } from "./ga4-client";
import { cleanPath, type EventParams } from "./ga4-core";

/** One GA4 destination; no second GTM custom-event broadcast. */
export function track(event: string, detail: Record<string, unknown> = {}): void {
  const properties: EventParams = {};
  for (const [key, value] of Object.entries(detail)) {
    if (typeof value === "string" || typeof value === "boolean" || typeof value === "number") properties[key] = value;
  }
  mochiAnalytics.track(event, { ...properties, source_site: "mochichatbot.com", source_page: typeof window === "undefined" ? "/" : cleanPath(window.location.pathname) });
}
