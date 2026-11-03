# Mochi website

The marketing site for Mochi: Next.js (App Router), English at `/` and `/zh`, `/ja`, `/pt`.

```sh
cd website
npm install
npm run dev          # http://localhost:3000
```

- All copy lives in `lib/content.ts` (one entry per language).
- Every Flatkey link goes through `flatkeyKeyUrl()` in `lib/links.ts` (UTM `utm_medium=mochi_site`); `test/utm.test.ts` at the repo root enforces it.
- The public address is `https://www.mochichatbot.com` (`PRODUCTION_ORIGIN` in `lib/site.ts`): production always uses it for canonical URLs, hreflang, the sitemap, robots.txt, social images and JSON-LD, and `mochichatbot.com` redirects to it. `SITE_URL` only matters for preview and local builds.

Deployed to Vercel by `.github/workflows/website.yml` (works with the Vercel Root Directory set to `website` or empty): pushes to `main` go to production, pull requests get a preview.

## Analytics and Google Ads

- Mochi has its own GA4 property (`G-FG9VQMZ6BZ`, loaded directly in `components/Tracking.tsx`) and GTM container (`GTM-NBZGHZWN`). Don't add a GA4 tag inside GTM too, or hits double count.
- Cross-domain measurement: `gtag('set','linker',…)` runs **before** `js`/`config` in the same snippet, over `ANALYTICS_LINKER_DOMAINS` from `lib/links.ts` (`www.mochichatbot.com`, `mochichatbot.com`, `flatkey.ai`, `console.flatkey.ai`). A visit that goes site → console keeps one session and its original source instead of restarting as direct; the dashboard's own loader (`/ga.js` in `src/server/app.ts`) carries the identical list, and `test/analytics.test.ts` fails if the two drift apart. The order matters: gtag applies a `set` only to the hits queued after it, so a linker configured after the config call leaves the landing page view undecorated. `console.flatkey.ai` has to report into the **same** data stream (`GA_MEASUREMENT_ID=G-FG9VQMZ6BZ`); another property there breaks the chain.
- Flatkey's GA4 is deliberately not on this site. When a visitor arrives from a Google ad, the click ID (`gclid` / `gbraid` / `wbraid`) is kept for 90 days and put on the Flatkey links in place of the `utm_*` tags (`withAdClick()` in `lib/links.ts`). Flatkey's GA4 on console.flatkey.ai then credits the sign-up/top-up to the ad.
- The page keeps visitors on it: the main call to action jumps to the on-page setup guide (`components/Guide.tsx`, copy in `lib/guide-content.json`), every outside link opens in a new tab, and checklist progress is saved in localStorage. Flatkey is introduced as the only supported model provider; the guide's step 4 creates the key.
- The guide opens with "Let your AI set it up": a copyable prompt (`lib/ai-prompt.ts`) for Claude Code, Codex, Cursor or a chat AI, with the tracked Flatkey link (and the Google Ads click ID) inside.
- Events (GA4 + dataLayer): `mochi_flatkey_click`, `mochi_github_click`, `mochi_guide_link` (Node.js, Git, dashboard, Sealos), each with `cta_spot`, `cta_url`, `has_ad_click`; `mochi_copy_ai_prompt`, `mochi_copy_command`, `mochi_step_done` (`guide_track`, `step`, `step_name`), `mochi_guide_complete`, `mochi_guide_tab`.
