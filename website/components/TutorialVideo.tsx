"use client";

import { useRef } from "react";
import { track } from "@/lib/track";

export function TutorialVideo({ title, note, label, lang, src, poster }: { title: string; note: string; label: string; lang: string; src: string; poster: string }) {
  const started = useRef(false);
  return (
    <figure className="tutorial">
      <figcaption>
        <b>🎬 {title}</b>
        {note && <span>{note}</span>}
      </figcaption>
      <video
        controls
        playsInline
        preload="none"
        poster={poster}
        aria-label={label}
        width={1920}
        height={1080}
        onPlay={() => {
          if (!started.current) track("mochi_video_play", { lang });
          started.current = true;
        }}
        onEnded={() => track("mochi_video_complete", { lang })}
      >
        <source src={src} type="video/mp4" />
      </video>
    </figure>
  );
}
