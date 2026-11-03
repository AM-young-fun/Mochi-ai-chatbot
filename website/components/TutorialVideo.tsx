"use client";

import { useRef } from "react";
import { track } from "@/lib/track";
import { TUTORIAL_POSTER, TUTORIAL_VIDEO } from "@/lib/video";

export function TutorialVideo({ title, note, label, lang }: { title: string; note: string; label: string; lang: string }) {
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
        poster={TUTORIAL_POSTER}
        aria-label={label}
        width={1920}
        height={1080}
        onPlay={() => {
          if (!started.current) track("mochi_video_play", { lang });
          started.current = true;
        }}
        onEnded={() => track("mochi_video_complete", { lang })}
      >
        <source src={TUTORIAL_VIDEO} type="video/mp4" />
      </video>
    </figure>
  );
}
