# Mochi website

The marketing site for Mochi: Next.js (App Router), English at `/` and `/zh`, `/ja`, `/pt`.

```sh
cd website
npm install
npm run dev          # http://localhost:3000
```

- All copy lives in `lib/content.ts` (one entry per language).
- Every Flatkey link goes through `flatkeyKeyUrl()` in `lib/links.ts` (UTM `utm_medium=mochi_site`); `test/utm.test.ts` at the repo root enforces it.
- `SITE_URL` (set in the Vercel project's environment variables) is the public address used for canonical URLs, hreflang, the sitemap and social images.

Deployed to Vercel by `.github/workflows/website.yml` (works with the Vercel Root Directory set to `website` or empty): pushes to `main` go to production, pull requests get a preview.

## Analytics and Google Ads

- Mochi has its own GA4 property (`G-FG9VQMZ6BZ`, loaded directly in `components/Tracking.tsx`) and GTM container (`GTM-NBZGHZWN`). Don't add a GA4 tag inside GTM too, or hits double count.
- Flatkey's GA4 is deliberately not on this site. When a visitor arrives from a Google ad, the click ID (`gclid` / `gbraid` / `wbraid`) is kept for 90 days and put on the Flatkey links in place of the `utm_*` tags (`withAdClick()` in `lib/links.ts`). Flatkey's GA4 on console.flatkey.ai then credits the sign-up/top-up to the ad.
- The main call to action is the GitHub Quick start (in the visitor's language); Flatkey is introduced as the only supported model provider, with "Get a Flatkey key" as a secondary link.
- Clicks on links with `data-cta` are sent to GA4 and the dataLayer as `mochi_github_click` (key event) or `mochi_flatkey_click`, with `cta_spot` (e.g. `hero_cta_ja`), `cta_url` and `has_ad_click`.
