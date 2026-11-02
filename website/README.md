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
