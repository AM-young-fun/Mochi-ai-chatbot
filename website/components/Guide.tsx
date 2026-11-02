"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { GuideCopy } from "@/lib/content";
import { track } from "@/lib/track";

type TrackName = "local" | "server";
type ActionKey = keyof GuideCopy["actions"];

const CODE: Record<"local" | "server", string> = {
  local: [
    "git clone https://github.com/flatkey-ai/Mochi-ai-chatbot.git",
    "cd Mochi-ai-chatbot",
    "npm install",
    "cp .env.example .env",
    "npm start",
  ].join("\n"),
  server: [
    "git clone https://github.com/flatkey-ai/Mochi-ai-chatbot.git",
    "cd Mochi-ai-chatbot",
    "cp .env.example .env",
    "nano .env",
    "docker build -t mochi .",
    "docker run -d --name mochi --restart unless-stopped --env-file .env -p 3000:3000 -v mochi-data:/app/data mochi",
  ].join("\n"),
};

const STORE_KEY = "mochi_guide_v1";
type Saved = { track: TrackName; done: Record<TrackName, number[]> };
const EMPTY: Saved = { track: "local", done: { local: [], server: [] } };

/**
 * The on-page setup checklist. Visitors stay on this page: every outside link opens in a new tab,
 * and their progress is kept in localStorage so they can come back and continue.
 * Both tracks are in the server HTML (the inactive one is hidden), so crawlers see all steps.
 */
export function Guide({ copy, lang, links }: { copy: GuideCopy; lang: string; links: Record<ActionKey, string> }) {
  const [state, setState] = useState<Saved>(EMPTY);
  const [copied, setCopied] = useState<string | null>(null);
  const sfx = (s: string) => (lang === "en" ? s : `${s}_${lang}`);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
      if (saved?.done) setState({ ...EMPTY, ...saved, done: { ...EMPTY.done, ...saved.done } });
    } catch {
      // No storage: the checklist still works for this visit.
    }
  }, []);

  const save = (next: Saved) => {
    setState(next);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {}
  };

  const switchTrack = (t: TrackName) => {
    if (t === state.track) return;
    save({ ...state, track: t });
    track("mochi_guide_tab", { guide_track: t, lang });
  };

  const toggle = (t: TrackName, i: number, total: number) => {
    const has = state.done[t].includes(i);
    const list = has ? state.done[t].filter((x) => x !== i) : [...state.done[t], i];
    save({ ...state, done: { ...state.done, [t]: list } });
    if (!has) {
      track("mochi_step_done", { guide_track: t, step: i + 1, step_name: copy[t][i].t, lang });
      if (list.length === total) track("mochi_guide_complete", { guide_track: t, lang });
    }
  };

  const copyCode = async (key: "local" | "server") => {
    try {
      await navigator.clipboard.writeText(CODE[key]);
    } catch {
      const r = document.createRange();
      const el = document.getElementById(`code-${key}`);
      if (el) { r.selectNodeContents(el); getSelection()?.removeAllRanges(); getSelection()?.addRange(r); }
    }
    setCopied(key);
    setTimeout(() => setCopied(null), 1600);
    track("mochi_copy_command", { guide_track: key, lang });
  };

  return (
    <div className="guide">
      <div className="guide-tabs" role="tablist">
        {(["local", "server"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={state.track === t} className={state.track === t ? "on" : ""} onClick={() => switchTrack(t)}>
            {t === "local" ? "💻 " : "☁️ "}
            {copy.tabs[t]}
          </button>
        ))}
      </div>

      {(["local", "server"] as const).map((t) => {
        const steps = copy[t];
        const done = state.done[t];
        const pct = Math.round((done.length / steps.length) * 100);
        return (
          <div key={t} role="tabpanel" hidden={state.track !== t}>
            <p className="guide-hint">{copy.hints[t]}</p>
            <div className="guide-progress" aria-live="polite">
              <div className="bar"><span style={{ width: `${pct}%` }} /></div>
              <span>{done.length === steps.length ? copy.allDone : copy.progress.replace("{done}", String(done.length)).replace("{total}", String(steps.length))}</span>
              {done.length > 0 && (
                <button className="guide-reset" onClick={() => save({ ...state, done: { ...state.done, [t]: [] } })}>{copy.reset}</button>
              )}
            </div>
            <ol className="gsteps">
              {steps.map((s, i) => {
                const isDone = done.includes(i);
                const code = "code" in s ? (s.code as "local" | "server") : null;
                const actions = ("actions" in s ? s.actions : []) as ActionKey[];
                return (
                  <li key={i} className={"gstep" + (isDone ? " done" : "")}>
                    <span className="gnum" aria-hidden="true">{isDone ? "✓" : i + 1}</span>
                    <div className="gbody">
                      <h3>{s.t}</h3>
                      <p>{s.b}</p>
                      {code && (
                        <div className="gcode">
                          <pre id={`code-${code}`}><code>{CODE[code]}</code></pre>
                          <button onClick={() => copyCode(code)}>{copied === code ? copy.copied : copy.copy}</button>
                        </div>
                      )}
                      {"image" in s && (
                        <Image src="/bind-key.png" alt={s.t} width={1340} height={900} sizes="(max-width: 700px) 100vw, 640px" className="gimg" />
                      )}
                      <div className="gactions">
                        {actions.map((a) => (
                          <a key={a} className={"btn btn-sm " + (a === "flatkey" ? "btn-pink" : "btn-ghost")} href={links[a]} target="_blank" rel="noopener" data-cta={sfx(`guide_${a}`)}>
                            {copy.actions[a]} ↗
                          </a>
                        ))}
                        <button className={"gcheck" + (isDone ? " on" : "")} onClick={() => toggle(t, i, steps.length)} aria-pressed={isDone}>
                          {isDone ? `✓ ${copy.done}` : copy.markDone}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        );
      })}
    </div>
  );
}
