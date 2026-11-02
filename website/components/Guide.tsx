"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { GuideCopy } from "@/lib/content";
import { buildAiPrompt } from "@/lib/ai-prompt";
import { INSTALL_COMMAND, INSTALL_OSES, INSTALL_SCRIPT, OS_LABEL, detectOs, type InstallOs } from "@/lib/install";
import { withAdClick } from "@/lib/links";
import { track } from "@/lib/track";
import { readAdClick } from "./Tracking";

type TrackName = "local" | "server";
type ActionKey = keyof GuideCopy["actions"];

const CODE: Record<"server", string> = {
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
export function Guide({ copy, lang, links, aiFlatkeyUrl }: { copy: GuideCopy; lang: string; links: Record<ActionKey, string>; aiFlatkeyUrl: string }) {
  const [state, setState] = useState<Saved>(EMPTY);
  // The prompt's Flatkey link gets the Google Ads click ID too (in the browser, after load).
  const [promptUrl, setPromptUrl] = useState(aiFlatkeyUrl);
  // Installer tab: picked from the browser after load (the server render shows macOS).
  const [os, setOs] = useState<InstallOs>("macos");
  const [copied, setCopied] = useState<string | null>(null);
  const sfx = (s: string) => (lang === "en" ? s : `${s}_${lang}`);

  useEffect(() => {
    const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
    setOs(detectOs(nav.userAgentData?.platform || navigator.platform || "", navigator.userAgent));
    setPromptUrl(withAdClick(aiFlatkeyUrl, readAdClick()));
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

  const copyText = async (text: string, elId: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard blocked: select the text so the visitor can copy it by hand.
      const r = document.createRange();
      const el = document.getElementById(elId);
      if (el) { r.selectNodeContents(el); getSelection()?.removeAllRanges(); getSelection()?.addRange(r); }
    }
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };
  const copyCode = (key: "server") => {
    copyText(CODE[key], `code-${key}`, key);
    track("mochi_copy_command", { guide_track: key, lang });
  };
  const copyInstall = () => {
    copyText(INSTALL_COMMAND[os], `install-${os}`, `install-${os}`);
    track("mochi_copy_command", { guide_track: "local", os, lang });
  };
  const pickOs = (o: InstallOs) => {
    setOs(o);
    track("mochi_install_os", { os: o, lang });
  };
  const copyPrompt = (t: TrackName) => {
    copyText(buildAiPrompt(t, copy.promptLang, promptUrl), `prompt-${t}`, `ai-${t}`);
    track("mochi_copy_ai_prompt", { guide_track: t, lang });
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
            <div className="ai-card">
              <div className="ai-head">
                <div>
                  <h3>🤖 {copy.aiTitle}</h3>
                  <p>{copy.aiSub}</p>
                </div>
                <button className="btn btn-pink btn-sm" onClick={() => copyPrompt(t)}>{copied === `ai-${t}` ? `✓ ${copy.aiCopied}` : copy.aiCopy}</button>
              </div>
              <pre id={`prompt-${t}`} className="ai-prompt">{buildAiPrompt(t, copy.promptLang, promptUrl)}</pre>
            </div>
            <p className="guide-or"><span>{copy.aiOr}</span></p>
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
                const code = "code" in s ? (s.code as "server") : null;
                const installer = "installer" in s && s.installer;
                const actions = ("actions" in s ? s.actions : []) as ActionKey[];
                return (
                  <li key={i} className={"gstep" + (isDone ? " done" : "")}>
                    <span className="gnum" aria-hidden="true">{isDone ? "✓" : i + 1}</span>
                    <div className="gbody">
                      <h3>{s.t}</h3>
                      <p>{s.b}</p>
                      {installer && (
                        <div className="installer">
                          <div className="os-tabs" role="tablist" aria-label="Operating system">
                            {INSTALL_OSES.map((o) => (
                              <button key={o} role="tab" aria-selected={os === o} className={os === o ? "on" : ""} onClick={() => pickOs(o)}>
                                {OS_LABEL[o]}
                              </button>
                            ))}
                          </div>
                          <p className="os-hint">{copy.os[os]}</p>
                          <div className="gcode">
                            <pre id={`install-${os}`}><code>{INSTALL_COMMAND[os]}</code></pre>
                            <button onClick={copyInstall}>{copied === `install-${os}` ? copy.copied : copy.copy}</button>
                          </div>
                          {os === "windows" && <p className="os-note">{copy.winNote}</p>}
                          <div className="safe">
                            <span className="safe-badge" aria-hidden="true">🛡️</span>
                            <div>
                              <b>{copy.safeTitle}</b>
                              <p>
                                {copy.safeBody}{" "}
                                <a href={INSTALL_SCRIPT[os].source} target="_blank" rel="noopener" data-cta={sfx("guide_script_source")}>
                                  {copy.viewScript}: {INSTALL_SCRIPT[os].name} ↗
                                </a>
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
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
