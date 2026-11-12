import type { Lang } from "@/lib/content";
import { CONTENT } from "@/lib/content";
import { SITE_URL, flatkeyKeyUrl, pathFor, tutorialUrlFor } from "@/lib/site";
import { WATCH_COPY, mmss, tutorialFor, youtubeEmbed, youtubeWatch } from "@/lib/video";

/**
 * The tutorial's own watch page: the video is the main content (Google only indexes a video as a
 * video result when it is the page's main subject), with its chapters and the VideoObject data.
 * The player is a plain YouTube iframe here, not the click-to-play poster used on the home page,
 * so crawlers see the video in the HTML.
 */
export function WatchPage({ lang }: { lang: Lang }) {
  const tv = tutorialFor(lang);
  const w = WATCH_COPY[lang];
  const ext = { target: "_blank", rel: "noopener" } as const;
  const cta = (spot: string) => ({ "data-cta": lang === "en" ? spot : `${spot}_${lang}` });
  const url = tutorialUrlFor(lang);
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: tv.name,
      description: tv.description,
      thumbnailUrl: `${SITE_URL}${tv.poster}`,
      contentUrl: youtubeWatch(tv.youtubeId),
      embedUrl: youtubeEmbed(tv.youtubeId),
      url,
      uploadDate: tv.uploaded,
      duration: tv.duration,
      inLanguage: tv.lang,
      // Chapters as Clip parts, so Google can show "key moments" that jump into the video.
      hasPart: tv.chapters.map(([start, name], i) => ({
        "@type": "Clip",
        name,
        startOffset: start,
        endOffset: tv.chapters[i + 1]?.[0] ?? tv.seconds,
        url: `${youtubeWatch(tv.youtubeId)}&t=${start}s`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Mochi", item: SITE_URL + (pathFor(lang) === "/" ? "" : pathFor(lang)) },
        { "@type": "ListItem", position: 2, name: tv.name, item: url },
      ],
    },
  ];
  return (
    <main className="watch wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <p className="crumbs"><a href={pathFor(lang)}>{w.back}</a></p>
      <h1>{tv.name}</h1>
      <div className="watch-player">
        <iframe
          src={`${youtubeEmbed(tv.youtubeId)}?rel=0&modestbranding=1&playsinline=1`}
          title={tv.name}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
      <p className="watch-meta">
        {mmss(tv.seconds)} · <a href={youtubeWatch(tv.youtubeId)} {...ext} {...cta("watch_youtube")}>{w.onYoutube} ↗</a>
      </p>
      <p className="watch-desc">{tv.description}</p>
      <h2>{w.chapters}</h2>
      <ol className="watch-chapters">
        {tv.chapters.map(([t, name]) => (
          <li key={t}>
            <a href={`${youtubeWatch(tv.youtubeId)}&t=${t}s`} {...ext}>
              <span className="t">{mmss(t)}</span> {name}
            </a>
          </li>
        ))}
      </ol>
      <div className="ctas">
        <a className="btn btn-pink" href={flatkeyKeyUrl("watch_key", lang)} {...ext} {...cta("watch_key")}>{w.ctaKey}</a>
        <a className="btn btn-ghost" href={`${pathFor(lang)}#get-started`} {...cta("watch_guide")}>{w.ctaGuide}</a>
      </div>
      <p className="muted small">{CONTENT[lang].hero.note}</p>
    </main>
  );
}
