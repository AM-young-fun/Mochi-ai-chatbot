"use client";

import { useState } from "react";
import { track } from "@/lib/track";
import { youtubeEmbed, youtubeWatch } from "@/lib/video";

// Shows our poster with a play button; YouTube's player only loads after a click,
// so the page stays light. The regular youtube.com player is used on purpose: the
// privacy-mode (nocookie) player can't see a viewer's YouTube login and often shows
// a "Sign in to confirm you're not a bot" wall to people on VPNs or proxies.
export function TutorialVideo({ title, note, label, play, onYoutube, lang, youtubeId, poster }: { title: string; note: string; label: string; play: string; onYoutube: string; lang: string; youtubeId: string; poster: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <figure className="tutorial">
      <figcaption>
        <b>🎬 {title}</b>
        {note && <span>{note}</span>}
      </figcaption>
      <div className="yt">
        {playing ? (
          <iframe
            src={`${youtubeEmbed(youtubeId)}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            title={label}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            aria-label={label}
            onClick={() => {
              track("mochi_video_play", { lang, video_id: youtubeId });
              setPlaying(true);
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={poster} alt="" width={1280} height={720} loading="lazy" />
            <span className="yt-play" aria-hidden="true">{play}</span>
          </button>
        )}
      </div>
      <p className="yt-alt">
        <a href={youtubeWatch(youtubeId)} target="_blank" rel="noopener" onClick={() => track("mochi_video_youtube", { lang, video_id: youtubeId })}>
          {onYoutube} ↗
        </a>
      </p>
    </figure>
  );
}
