"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Lang } from "@/lib/content";
import { AD_CLICK_PARAMS, FLATKEY_CONSOLE, withAdClick, type AdClick } from "@/lib/links";
import { CONSENT_EVENT, CONSENT_KEY, getConsent, setConsent, type Consent } from "@/lib/ga4-core";
import { GA4_ID, mochiAnalytics } from "@/lib/ga4-client";
import { CONSENT_COPY } from "@/lib/consent-copy";
import { track } from "@/lib/track";

// GTM-NBZGHZWN also configured Flatkey's G-30RCEP2CVH property. This site now has one GA4 destination.
export { GA4_ID } from "@/lib/ga4-client";
const STORE_KEY = "mochi_ad_click";
const KEEP_MS = 90 * 24 * 60 * 60 * 1000;
function validClicks(value: unknown): AdClick {
  if (!value || typeof value !== "object") return {};
  const click: AdClick = {};
  for (const key of AD_CLICK_PARAMS) {
    const item = (value as Record<string, unknown>)[key];
    if (typeof item === "string" && /^[A-Za-z0-9_.~-]{1,1024}$/.test(item)) click[key] = item;
  }
  return click;
}
export function readAdClick(): AdClick {
  if (typeof window === "undefined" || getConsent() !== "granted") {
    try { window.localStorage.removeItem(STORE_KEY); } catch {}
    return {};
  }
  const query = new URLSearchParams(window.location.search);
  const fromUrl = validClicks(Object.fromEntries(AD_CLICK_PARAMS.map(key => [key, query.get(key)])));
  try {
    if (Object.keys(fromUrl).length) {
      window.localStorage.setItem(STORE_KEY, JSON.stringify({ at: Date.now(), click: fromUrl }));
      return fromUrl;
    }
    const saved = JSON.parse(window.localStorage.getItem(STORE_KEY) || "null");
    if (saved && Number.isFinite(saved.at) && saved.at <= Date.now() && Date.now() - saved.at < KEEP_MS) return validClicks(saved.click);
    window.localStorage.removeItem(STORE_KEY);
  } catch {}
  return fromUrl;
}
function forgetMeasurement() {
  try { window.localStorage.removeItem(STORE_KEY); } catch {}
  (window as unknown as Record<string, unknown>)[`ga-disable-${GA4_ID}`] = true;
  const names = document.cookie.split(";").map(part => part.split("=", 1)[0].trim()).filter(name => /^(_ga(?:_|$)|_gcl_)/.test(name));
  for (const name of names) for (const domain of ["", location.hostname, location.hostname.replace(/^www\./, "")]) {
    document.cookie = `${name}=; Max-Age=0; Path=/;${domain ? ` Domain=${domain};` : ""} SameSite=Lax`;
  }
}
export function Tracking({ lang = "en" }: { lang?: Lang }) {
  const pathname = usePathname();
  const [consent, setChoice] = useState<Consent>("unknown");
  const [open, setOpen] = useState(false);
  const copy = CONSENT_COPY[lang];
  useEffect(() => {
    const sync = () => setChoice(getConsent());
    const storage = (event: StorageEvent) => {
      if (event.key !== CONSENT_KEY && event.key !== null) return;
      sync();
      if (getConsent() !== "granted") { forgetMeasurement(); window.location.reload(); }
    };
    sync(); window.addEventListener(CONSENT_EVENT, sync); window.addEventListener("storage", storage);
    const stop = mochiAnalytics.startJourney();
    return () => { stop(); window.removeEventListener(CONSENT_EVENT, sync); window.removeEventListener("storage", storage); };
  }, []);
  useEffect(() => { if (consent === "granted") mochiAnalytics.pageView(pathname); }, [pathname, consent]);
  useEffect(() => {
    if (consent !== "granted") return;
    const decorate = (anchor: HTMLAnchorElement) => {
      if (!anchor.href.startsWith(`${FLATKEY_CONSOLE}/`)) return;
      anchor.dataset.mochiBaseHref ||= anchor.href;
      anchor.href = withAdClick(anchor.dataset.mochiBaseHref, readAdClick());
    };
    document.querySelectorAll<HTMLAnchorElement>(`a[href^="${FLATKEY_CONSOLE}/"]`).forEach(decorate);
    const click = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest("a[data-cta]") : null;
      if (!(anchor instanceof HTMLAnchorElement) || getConsent() !== "granted") return;
      decorate(anchor);
      const url = new URL(anchor.href);
      const name = url.hostname === "console.flatkey.ai" || url.hostname === "flatkey.ai" || url.hostname === "www.flatkey.ai" ? "mochi_flatkey_click" : url.hostname === "github.com" ? "mochi_github_click" : "mochi_guide_link";
      track(name, { cta_id: anchor.dataset.cta, target_host: url.hostname, target_path: url.pathname, has_ad_click: Object.keys(readAdClick()).length > 0 });
    };
    document.addEventListener("click", click, true);
    return () => document.removeEventListener("click", click, true);
  }, [consent, pathname]);
  function choose(value: "granted" | "denied") {
    const wasGranted = getConsent() === "granted";
    if (value === "denied") forgetMeasurement();
    else (window as unknown as Record<string, unknown>)[`ga-disable-${GA4_ID}`] = false;
    setConsent(value); setChoice(value); setOpen(false);
    if (value === "denied" && wasGranted) window.location.reload();
  }
  return consent === "unknown" || open ? <aside className="measurement-consent" aria-label={copy.title} data-analytics-ignore>
    <strong>{copy.title}</strong><p>{copy.body}</p>{consent !== "unknown" && <p>{copy.saved}</p>}
    <div><button type="button" onClick={() => choose("denied")}>{copy.deny}</button><button type="button" onClick={() => choose("granted")}>{copy.grant}</button></div>
  </aside> : <button type="button" className="measurement-settings" data-analytics-ignore onClick={() => setOpen(true)}>{copy.settings}</button>;
}

// No tracking may bypass the consent choice when JavaScript is disabled.
export function TrackingNoScript() { return null; }
