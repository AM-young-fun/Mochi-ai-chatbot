// Sends an analytics event to Mochi's GA4 (gtag) and to GTM's dataLayer. Browser only.
declare global {
  interface Window { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void }
}

export function track(event: string, detail: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  window.gtag?.("event", event, detail); // GA4, sent with sendBeacon so it survives navigation
  (window.dataLayer ||= []).push({ event, ...detail }); // GTM triggers
}
