"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Lang } from "@/lib/content";
import { AD_CLICK_PARAMS, FLATKEY_CONSOLE, withAdClick, type AdClick } from "@/lib/links";
import { cleanPath, CONSENT_EVENT, CONSENT_KEY, getConsent, setConsent, type Consent, type ConsentRegion } from "@/lib/ga4-core";
import { GA4_ID, mochiAnalytics } from "@/lib/ga4-client";
import { CONSENT_COPY } from "@/lib/consent-copy";
import { track } from "@/lib/track";

export { GA4_ID } from "@/lib/ga4-client";

// Google Tag Manager runs whatever tags the team sets up in the container (it has also configured Flatkey's
// G-30RCEP2CVH property). It shares the dataLayer and the consent state with GA4 above and loads under the same
// gate: production hosts only, and only once analytics may collect for this visitor (after a grant where consent
// is required). A refusal reloads the page, so a loaded container never outlives a "no".
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID?.trim() || "GTM-NBZGHZWN";
function loadGtm() {
  if (!/^GTM-[A-Z0-9]+$/.test(GTM_ID) || document.getElementById("mochi-gtm")) return;
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
  const script = document.createElement("script");
  script.id = "mochi-gtm";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`;
  document.head.appendChild(script);
}
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
  const [region, setRegion] = useState<ConsentRegion>("unknown");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/analytics-consent-region", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return;
        const region = (await response.json()).consentRegion;
        if (!controller.signal.aborted && (region === "required" || region === "optional")) {
          mochiAnalytics.setConsentRegion(region);
          setRegion(region);
        }
      })
      .catch(() => {
        // Without a region, keep requiring an explicit grant.
      });
    return () => controller.abort();
  }, []);

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
  useEffect(() => {
    mochiAnalytics.pageView(pathname);
    // initialize() is true only when analytics may collect here; GTM follows the same answer.
    if (mochiAnalytics.initialize()) loadGtm();
  }, [pathname, consent, region]);
  useEffect(() => {
    const decorate = (anchor: HTMLAnchorElement, adClick: AdClick) => {
      if (!anchor.href.startsWith(`${FLATKEY_CONSOLE}/`)) return;
      anchor.dataset.mochiBaseHref ||= anchor.href;
      anchor.href = withAdClick(anchor.dataset.mochiBaseHref, adClick);
    };
    if (consent === "granted") {
      const adClick = readAdClick();
      document.querySelectorAll<HTMLAnchorElement>(`a[href^="${FLATKEY_CONSOLE}/"]`).forEach(anchor => decorate(anchor, adClick));
    }
    const click = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest("a[data-cta]") : null;
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const explicitlyGranted = getConsent() === "granted";
      const adClick = explicitlyGranted ? readAdClick() : {};
      if (explicitlyGranted) decorate(anchor, adClick);
      const url = new URL(anchor.href);
      const name = url.hostname === "console.flatkey.ai" || url.hostname === "flatkey.ai" || url.hostname === "www.flatkey.ai" ? "mochi_flatkey_click" : url.hostname === "github.com" ? "mochi_github_click" : "mochi_guide_link";
      track(name, { cta_id: anchor.dataset.cta, target_host: url.hostname, target_path: cleanPath(url.pathname), has_ad_click: Object.keys(adClick).length > 0 });
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
  if (region !== "required") return null;
  return consent === "unknown" || open ? <aside className="measurement-consent" aria-label={copy.title} data-analytics-ignore>
    <strong>{copy.title}</strong><p>{copy.body}</p>{consent !== "unknown" && <p>{copy.saved}</p>}
    <div><button type="button" onClick={() => choose("denied")}>{copy.deny}</button><button type="button" onClick={() => choose("granted")}>{copy.grant}</button></div>
  </aside> : <button type="button" className="measurement-settings" data-analytics-ignore onClick={() => setOpen(true)}>{copy.settings}</button>;
}

// No tracking may bypass the consent choice when JavaScript is disabled.
export function TrackingNoScript() { return null; }
