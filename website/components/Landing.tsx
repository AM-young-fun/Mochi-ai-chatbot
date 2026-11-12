import Image from "next/image";
import { CONTENT, LANGS, type Lang } from "@/lib/content";
import { tutorialFor, youtubeWatch } from "@/lib/video";
import { TutorialVideo } from "./TutorialVideo";
import { GUIDE_COPY } from "@/lib/content";
import { DEPLOY_GUIDE, RENDER_DEPLOY, REPO, SITE_URL, flatkeyKeyUrl, pathFor, privacyPathFor, urlFor } from "@/lib/site";
import { PRIVACY } from "@/lib/privacy";
import { ChatDemo } from "./ChatDemo";
import { Guide } from "./Guide";

const PLATFORMS: [string, string][] = [
  ["Discord", "#5865F2"],
  ["Telegram", "#27A7E7"],
  ["Slack", "#4A154B"],
  ["QQ", "#12B7F5"],
  ["LINE", "#06C755"],
  ["Website", "#ff6fae"],
];

const SHOT_SIZE = { width: 1340, height: 860 };

export function Landing({ lang }: { lang: Lang }) {
  const c = CONTENT[lang];
  const fk = (spot: string) => flatkeyKeyUrl(spot, lang);
  // data-cta names the button for analytics (components/Tracking.tsx), with the language suffix.
  const cta = (spot: string) => ({ "data-cta": lang === "en" ? spot : `${spot}_${lang}` });
  // Outside links open in a new tab so the setup guide stays open.
  const ext = { target: "_blank", rel: "noopener" } as const;
  const g = GUIDE_COPY[lang];
  const guideLinks = {
    node: "https://nodejs.org/en/download",
    git: "https://git-scm.com/downloads",
    dashboard: "http://localhost:3000/dashboard",
    flatkey: fk("guide_key"),
    sealos: DEPLOY_GUIDE,
    render: RENDER_DEPLOY,
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Mochi",
    url: urlFor(lang),
    image: `${SITE_URL}/mochi-avatar-512.png`,
    screenshot: `${SITE_URL}/bots.png`,
    applicationCategory: "CommunicationApplication",
    operatingSystem: "Linux, macOS, Windows (Node.js or Docker)",
    description: c.description,
    license: "https://opensource.org/licenses/MIT",
    sameAs: [REPO],
    softwareHelp: `${REPO}#readme`,
    inLanguage: c.htmlLang,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
  const tv = tutorialFor(lang);
  const videoLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: tv.name,
    description: tv.description,
    thumbnailUrl: `${SITE_URL}${tv.poster}`,
    url: youtubeWatch(tv.youtubeId),
    embedUrl: `https://www.youtube.com/embed/${tv.youtubeId}`,
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
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faq.items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, videoLd, faqLd]).replace(/</g, "\\u003c") }} />
      <header className="nav">
        <div className="wrap nav-in">
          <a className="brand" href={pathFor(lang)}>
            <Image src="/mochi-avatar-128.png" alt="" width={36} height={36} priority />
            <span>Mochi</span>
          </a>
          <nav className="links">
            <a href="#features">{c.nav.features}</a>
            <a href="#get-started">{c.nav.how}</a>
            <a href="#why">{c.nav.why}</a>
            <a href="#faq">{c.nav.faq}</a>
            <a href={REPO} {...ext} {...cta("nav_github")}>{c.nav.github}</a>
          </nav>
          <details className="lang">
            <summary aria-label="Language">🌐 {c.label}</summary>
            <div className="lang-menu">
              {LANGS.map((l) => (
                <a key={l} href={pathFor(l)} hrefLang={CONTENT[l].htmlLang} lang={CONTENT[l].htmlLang} aria-current={l === lang ? "true" : undefined}>
                  {CONTENT[l].label}
                </a>
              ))}
            </div>
          </details>
          <a className="btn btn-pink btn-sm" href="#get-started" {...cta("nav_cta")}>{c.nav.cta}</a>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="wrap hero-in">
            <div className="hero-copy">
              <h1>
                {c.hero.h1a}
                <br />
                <span className="grad">{c.hero.h1b}</span>
              </h1>
              <p className="tagline">💸 {c.hero.tagline}</p>
              <p className="lead">{c.hero.sub}</p>
              <div className="ctas">
                <a className="btn btn-pink" href="#get-started" {...cta("hero_cta")}>🚀 {c.hero.cta1}</a>
                <a className="btn btn-ghost" href={REPO} {...ext} {...cta("hero_github")}>⭐ {c.hero.cta2}</a>
              </div>
              <div className="oneclick">
                <span className="oneclick-label">{c.hero.oneClick}</span>
                <a className="btn btn-sm btn-pink" href={fk("hero_key")} {...ext} {...cta("hero_key")}><i>1</i> 🔑 {c.hero.ctaKey}</a>
                <span className="oneclick-arrow" aria-hidden>→</span>
                <a className="btn btn-sm btn-dark" href={RENDER_DEPLOY} {...ext} {...cta("hero_render")} title={c.hero.cta3Hint}><i>2</i> ☁️ {c.hero.cta3}</a>
              </div>
              <p className="note">{c.hero.note}</p>
              <div className="platforms">
                <span>{c.runsOn}</span>
                {PLATFORMS.map(([n, col]) => (
                  <i key={n} style={{ ["--c" as string]: col }}>{n}</i>
                ))}
              </div>
            </div>
            <div className="hero-art">
              <div className="halo" />
              <Image className="avatar" src="/mochi-avatar-512.png" alt={c.avatarAlt} width={380} height={380} priority />
              <div className="chat" aria-label="Demo chat">
                <div className="chat-head"><b>{c.demo.channel}</b><span>● online</span></div>
                <ChatDemo msgs={c.demo.msgs} typing={c.demo.typing} />
              </div>
            </div>
          </div>
        </section>

        <section id="get-started" className="sec sec-tint">
          <div className="wrap">
            <h2>{g.h2}</h2>
            <p className="sub">{g.sub}</p>
            <TutorialVideo title={g.video.title} note={g.video.note} label={g.video.label} play={g.video.play} onYoutube={g.video.onYoutube} lang={lang} youtubeId={tv.youtubeId} poster={tv.poster} />
            <Guide copy={g} lang={lang} links={guideLinks} aiFlatkeyUrl={fk("ai_prompt")} />
          </div>
        </section>

        <section id="features" className="sec">
          <div className="wrap">
            <h2>{c.features.h2}</h2>
            <p className="sub">{c.features.sub}</p>
            <div className="grid4">
              {c.features.items.map((f) => (
                <article key={f.t} className="card">
                  <div className="ico">{f.icon}</div>
                  <h3>{f.t}</h3>
                  <p>{f.b}</p>
                </article>
              ))}
            </div>
          </div>
        </section>


        <section id="why" className="sec">
          <div className="wrap why">
            <div className="why-head">
              <h2>{c.why.h2}</h2>
              <p className="slogan grad">{c.why.slogan}</p>
              <p className="sub">{c.why.lead}</p>
              <a className="btn btn-ghost" href={fk("why_cta")} {...ext} {...cta("why_cta")}>{c.why.cta}</a>
              <p className="powered">Powered by <a href={fk("why_logo")} {...ext} {...cta("why_logo")}><b>flatkey</b></a></p>
            </div>
            <div className="why-points">
              {c.why.points.map((p, i) => (
                <article key={p.t} className="card">
                  <h3>{["💸", "⏱️", "🔁"][i]} {p.t}</h3>
                  <p>{p.b}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="sec sec-tint">
          <div className="wrap">
            <h2>{c.shots.h2}</h2>
            <div className="shots">
              {c.shots.items.map((s) => (
                <figure key={s.img}>
                  <Image src={`/${s.img}`} alt={s.c} {...SHOT_SIZE} sizes="(max-width: 560px) 100vw, 560px" />
                  <figcaption>{s.c}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <h2>{c.uses.h2}</h2>
            <div className="grid3">
              {c.uses.items.map((u) => (
                <article key={u.t} className="card use">
                  <div className="ico">{u.icon}</div>
                  <h3>{u.t}</h3>
                  <p>{u.b}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="sec sec-tint">
          <div className="wrap narrow">
            <h2>{c.faq.h2}</h2>
            {c.faq.items.map((f) => (
              <details key={f.q} className="faq">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="sec final">
          <div className="wrap final-in">
            <Image src="/mochi-avatar-256.png" alt="" width={120} height={120} />
            <h2>{c.final.h2}</h2>
            <p className="sub">{c.final.sub}</p>
            <div className="ctas center">
              <a className="btn btn-pink" href="#get-started" {...cta("final_cta")}>🚀 {c.final.cta}</a>
              <a className="btn btn-ghost" href={REPO} {...ext} {...cta("final_github")}>⭐ {c.final.cta2}</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap foot-in">
          <div><b>Mochi</b> · {c.footer.tag}</div>
          <div className="foot-links">
            <a href={REPO} {...ext} {...cta("footer_github")}>GitHub</a>
            <a href={`${REPO}/blob/main/LICENSE`} {...ext}>{c.footer.license}</a>
            {lang === "en" && <a href="/blog" {...cta("footer_blog")}>Blog</a>}
            <a href={privacyPathFor(lang)}>{PRIVACY[lang].footerLink}</a>
            {lang === "ja" && <a href="/ja/line" {...cta("footer_line")}>LINE ボット受託向け</a>}
            <a href={fk("footer")} {...ext} {...cta("footer")}>{c.nav.keyCta}</a>
          </div>
        </div>
      </footer>
    </>
  );
}
