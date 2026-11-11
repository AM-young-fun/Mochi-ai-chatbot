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

- The public site uses only its own GA4 property (`G-FG9VQMZ6BZ`, overridable via `NEXT_PUBLIC_GA4_MEASUREMENT_ID`). `Tracking.tsx` starts the shared GA4 client only after consent and only on production hosts. The removed `GTM-NBZGHZWN` container was verified to send to the Flatkey property and must not be reintroduced. Privacy settings allow withdrawal; previews never send analytics.
- Page visits, visible reading time, scroll depth, link clicks and guide/copy steps use fixed event and parameter allowlists. No command body, prompt, email or API key is collected. Flatkey links keep their UTM parameters; consented ad click IDs are validated, retained for at most 90 days, and appended only to approved Flatkey hosts.
- Mochi and Flatkey use separate GA4 properties. The public site does not configure a shared `_gl` linker or require Flatkey Console to use Mochi’s measurement ID. Cross-site handoff is attributed by the explicit outgoing UTM parameters; do not change the Console property to match Mochi. The legacy `ANALYTICS_LINKER_DOMAINS` export is retained for the separately maintained self-hosted dashboard and its tests, not used by this public-site loader.
- Flatkey’s GA4 is not loaded on this site. Consented Google Ads click IDs (`gclid` / `gbraid` / `wbraid`) may be appended alongside the outgoing UTM parameters, not replace them. Final paid-campaign attribution and Ads imports must be verified in the destination configuration; this frontend does not guarantee them.
- The page keeps visitors on it: the main call to action jumps to the on-page setup guide (`components/Guide.tsx`, copy in `lib/guide-content.json`), every outside link opens in a new tab, and checklist progress is saved in localStorage. Flatkey is introduced as the only supported model provider; the guide's step 4 creates the key.
- The guide opens with "Let your AI set it up": a copyable prompt (`lib/ai-prompt.ts`) for Claude Code, Codex, Cursor or a chat AI, with the tracked Flatkey link (and the Google Ads click ID) inside.
- GA4 events preserve the guide, copy and outgoing-link semantics (`mochi_flatkey_click`, `mochi_github_click`, `mochi_guide_link`, `mochi_copy_ai_prompt`, `mochi_copy_command`, `mochi_step_done`, `mochi_guide_complete`, `mochi_guide_tab`). Only the fixed parameter allowlist reaches GA4; there is no additional GTM custom-event broadcast.
