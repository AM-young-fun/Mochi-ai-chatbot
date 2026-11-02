import Image from "next/image";
import { CONTENT, LANGS, type Lang } from "@/lib/content";
import { DEPLOY_GUIDE, REPO, flatkeyKeyUrl, pathFor } from "@/lib/site";
import { ChatDemo } from "./ChatDemo";

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Mochi",
    applicationCategory: "CommunicationApplication",
    operatingSystem: "Linux, macOS, Windows (Node.js or Docker)",
    description: c.description,
    license: "https://opensource.org/licenses/MIT",
    codeRepository: REPO,
    inLanguage: c.htmlLang,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faq.items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqLd]).replace(/</g, "\\u003c") }} />
      <header className="nav">
        <div className="wrap nav-in">
          <a className="brand" href={pathFor(lang)}>
            <Image src="/mochi-avatar-128.png" alt="" width={36} height={36} priority />
            <span>Mochi</span>
          </a>
          <nav className="links">
            <a href="#features">{c.nav.features}</a>
            <a href="#how">{c.nav.how}</a>
            <a href="#why">{c.nav.why}</a>
            <a href="#faq">{c.nav.faq}</a>
            <a href={REPO}>{c.nav.github}</a>
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
          <a className="btn btn-pink btn-sm" href={fk("nav_cta")}>{c.nav.cta}</a>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="wrap hero-in">
            <div className="hero-copy">
              <p className="eyebrow">{c.hero.eyebrow}</p>
              <h1>
                {c.hero.h1a}
                <br />
                <span className="grad">{c.hero.h1b}</span>
              </h1>
              <p className="lead">{c.hero.sub}</p>
              <div className="ctas">
                <a className="btn btn-pink" href={fk("hero_cta")}>🔑 {c.hero.cta1}</a>
                <a className="btn btn-ghost" href="#how">🚀 {c.hero.cta2}</a>
                <a className="btn btn-ghost" href={REPO}>⭐ {c.hero.cta3}</a>
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
              <Image className="avatar" src="/mochi-avatar-512.png" alt="Mochi" width={380} height={380} priority />
              <div className="chat" aria-label="Demo chat">
                <div className="chat-head"><b>{c.demo.channel}</b><span>● online</span></div>
                <ChatDemo msgs={c.demo.msgs} typing={c.demo.typing} />
              </div>
            </div>
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

        <section id="how" className="sec sec-tint">
          <div className="wrap">
            <h2>{c.how.h2}</h2>
            <ol className="steps">
              {c.how.steps.map((s, i) => (
                <li key={s.t} className="card step">
                  <span className="num">{i + 1}</span>
                  <h3>{s.t}</h3>
                  <p>{s.b}</p>
                  {i === 0 && <a className="btn btn-pink btn-sm" href={fk("step1_cta")}>{c.nav.cta} →</a>}
                  {i === 1 && <a className="btn btn-ghost btn-sm" href={DEPLOY_GUIDE}>{c.how.deployGuide} →</a>}
                </li>
              ))}
            </ol>
            <pre className="code"><code>{c.how.code}</code></pre>
          </div>
        </section>

        <section id="why" className="sec">
          <div className="wrap why">
            <div className="why-head">
              <h2>{c.why.h2}</h2>
              <p className="slogan grad">{c.why.slogan}</p>
              <p className="sub">{c.why.lead}</p>
              <a className="btn btn-pink" href={fk("why_cta")}>{c.why.cta}</a>
              <p className="powered">Powered by <a href={fk("why_logo")}><b>flatkey</b></a></p>
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
              <a className="btn btn-pink" href={fk("final_cta")}>🔑 {c.final.cta}</a>
              <a className="btn btn-ghost" href={REPO}>{c.final.cta2}</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap foot-in">
          <div><b>Mochi</b> · {c.footer.tag}</div>
          <div className="foot-links">
            <a href={REPO}>GitHub</a>
            <a href={`${REPO}/blob/main/LICENSE`}>{c.footer.license}</a>
            <a href={fk("footer")}>{c.nav.cta}</a>
          </div>
        </div>
      </footer>
    </>
  );
}
