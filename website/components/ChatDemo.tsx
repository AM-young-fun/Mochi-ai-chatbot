"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { who: string; name?: string; text: string };

const COLORS: Record<string, string> = { u1: "#5865F2", u2: "#2fb380" };

/** Plays the demo conversation in the hero, then loops. Shows the last turns statically for reduced motion. */
export function ChatDemo({ msgs, typing }: { msgs: Msg[]; typing: string }) {
  const [shown, setShown] = useState<Msg[]>([]);
  const [isTyping, setTyping] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(msgs.slice(-3));
      return;
    }
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      if (i >= msgs.length) {
        i = 0;
        timer = setTimeout(() => { setShown([]); next(); }, 3500);
        return;
      }
      const m = msgs[i++];
      if (m.who === "bot") {
        setTyping(true);
        timer = setTimeout(() => {
          setTyping(false);
          setShown((s) => [...s, m]);
          timer = setTimeout(next, 1700);
        }, 1100);
      } else {
        setShown((s) => [...s, m]);
        timer = setTimeout(next, 1000);
      }
    };
    next();
    return () => clearTimeout(timer);
  }, [msgs]);

  // Keep only the rows that fit. justify-content:flex-end hides overflow above, so measure rows.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const used = Array.from(el.children).reduce((h, c) => h + (c as HTMLElement).offsetHeight + 9, 0);
    if (used > el.clientHeight - 20 && shown.length > 1) setShown((s) => s.slice(1));
  }, [shown, isTyping]);

  return (
    <div className="chat-body" ref={box}>
      {shown.map((m, k) => (
        <div key={`${k}-${m.text}`} className={"msg" + (m.who === "bot" ? " bot" : "")}>
          <div className="av" style={m.who === "bot" ? undefined : { background: COLORS[m.who] ?? "#8a7f96" }}>
            {m.who === "bot" ? <img src="/mochi-avatar-128.png" alt="" width={28} height={28} /> : (m.name ?? "?").slice(0, 1)}
          </div>
          <div>
            <div className="who">{m.who === "bot" ? "Mochi" : m.name}</div>
            <div className="bubble">{m.text}</div>
          </div>
        </div>
      ))}
      {isTyping && <div className="typing">{typing}</div>}
    </div>
  );
}
