"use client";

import Script from "next/script";
import { useEffect } from "react";
import { AD_CLICK_PARAMS, FLATKEY_CONSOLE, withAdClick, type AdClick } from "@/lib/links";
import { track } from "@/lib/track";

/**
 * Mochi's own measurement, separate from Flatkey's analytics on purpose:
 *  - GA4 is loaded here directly (don't also add a GA4 tag inside GTM, or every hit counts twice);
 *  - GTM is for Google Ads tags and anything else configured in the container.
 */
export const GA4_ID = "G-FG9VQMZ6BZ";
export const GTM_ID = "GTM-NBZGHZWN";

const STORE_KEY = "mochi_ad_click";
const KEEP_MS = 90 * 24 * 60 * 60 * 1000; // Google Ads click-through conversion window

function readAdClick(): AdClick {
  const fromUrl: AdClick = {};
  const q = new URLSearchParams(location.search);
  for (const k of AD_CLICK_PARAMS) {
    const v = q.get(k);
    if (v) fromUrl[k] = v;
  }
  try {
    if (Object.keys(fromUrl).length) {
      localStorage.setItem(STORE_KEY, JSON.stringify({ at: Date.now(), click: fromUrl }));
      return fromUrl;
    }
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (saved && Date.now() - saved.at < KEEP_MS) return saved.click as AdClick;
    localStorage.removeItem(STORE_KEY);
  } catch {
    // Storage blocked: still use a click ID that's on this URL.
  }
  return fromUrl;
}

/**
 * Loads GA4 and GTM, passes a Google Ads click ID on to Flatkey links, and reports button clicks
 * (links with data-cta) as `mochi_flatkey_click`, `mochi_github_click` or `mochi_guide_link`,
 * with cta_spot = data-cta (e.g. guide_flatkey_ja). The setup guide sends its own step events.
 */
export function Tracking() {
  useEffect(() => {
    const click = readAdClick();
    const hasAdClick = Object.keys(click).length > 0;
    for (const a of document.querySelectorAll<HTMLAnchorElement>(`a[href^="${FLATKEY_CONSOLE}/"]`)) a.href = withAdClick(a.href, click);

    // Flatkey key links → mochi_flatkey_click; GitHub → mochi_github_click; other guide links
    // (Node.js, Git, the dashboard, Sealos) → mochi_guide_link.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>("a[data-cta]");
      if (!a) return;
      const event = a.href.startsWith(`${FLATKEY_CONSOLE}/`) ? "mochi_flatkey_click" : a.hostname === "github.com" ? "mochi_github_click" : "mochi_guide_link";
      track(event, { cta_spot: a.dataset.cta, cta_url: a.href, has_ad_click: hasAdClick });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`} strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA4_ID}');`}
      </Script>
      <Script id="gtm" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
      </Script>
    </>
  );
}

/** GTM's no-JavaScript fallback, placed right after <body>. */
export function TrackingNoScript() {
  return (
    <noscript>
      <iframe src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`} height="0" width="0" style={{ display: "none", visibility: "hidden" }} />
    </noscript>
  );
}
