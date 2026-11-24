import Image from "next/image";
import { GitHubIcon } from "./GitHubIcon";
import { CopyCmd } from "./CopyCmd";
import { CHARACTER_AI, CHARACTER_AI_FOOTER, CHARACTER_AI_PATH } from "@/lib/character-ai";
import { INSTALL_COMMAND } from "@/lib/install";
import { DEPLOY } from "@/lib/deploy";
import { PRIVACY } from "@/lib/privacy";
import { TERMS } from "@/lib/terms";
import { postPath } from "@/lib/blog";
import {
  RAILWAY_DEPLOY,
  REPO,
  characterAiUrl,
  deployPathFor,
  flatkeyKeyUrl,
  privacyPathFor,
  termsPathFor,
  tutorialPathFor,
  urlFor,
} from "@/lib/site";

const C = CHARACTER_AI;
const LANG = "en" as const;

const PLATFORMS: [string, string][] = [
  ["Discord", "#5865F2"],
  ["Telegram", "#27A7E7"],
  ["Slack", "#4A154B"],
  ["QQ", "#12B7F5"],
  ["LINE", "#06C755"],
  ["Website", "#ff6fae"],
];

const SHOT = { width: 1340, height: 860 };

const ext = { target: "_blank", rel: "noopener" } as const;
const fk = (spot: string) => flatkeyKeyUrl(spot, LANG);

function NewTab({ children }: { children: string }) {
  return (
    <>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </>
  );
}

/** English product page for people comparing hosted character apps with a companion they run. */
export function CharacterAiPage() {
  const pageUrl = characterAiUrl();
  const home = urlFor(LANG);
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: C.faq.items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const crumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Mochi", item: home },
      { "@type": "ListItem", position: 2, name: "Character.AI Alternative", item: pageUrl },
    ],
  };
  const appLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Mochi",
    url: home,
    image: `${home}/mochi-avatar-512.png`,
    applicationCategory: "CommunicationApplication",
    operatingSystem: "Linux, macOS, Windows (Node.js or Docker)",
    description: C.description,
    license: "https://opensource.org/licenses/MIT",
  };

  return (
    <div className="cai">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([crumbLd, appLd, faqLd]).replace(/</g, "\\u003c") }} />
      <a className="skip" href="#main">Skip to content</a>
      <header className="nav">
        <div className="wrap nav-in">
          <a className="brand" href="/">
            <Image src="/mochi-avatar-128.png" alt="" width={36} height={36} priority />
            <span>Mochi</span>
          </a>
          <nav className="links" aria-label="On this page">
            <a href="#memory">{C.nav.memory}</a>
            <a href="#persona">{C.nav.persona}</a>
            <a href="#channels">{C.nav.channels}</a>
            <a href="#start">{C.nav.setup}</a>
            <a href="#fit">{C.nav.fit}</a>
            <a href="#faq">{C.nav.faq}</a>
          </nav>
          <a className="btn btn-pink btn-sm cai-nav-cta" href="#start" data-cta="cai_nav">{C.nav.cta}</a>
        </div>
      </header>
      <nav className="cai-jump" aria-label="On this page">
        <a href="#memory">{C.nav.memory}</a>
        <a href="#persona">{C.nav.persona}</a>
        <a href="#channels">{C.nav.channels}</a>
        <a href="#start">{C.nav.setup}</a>
        <a href="#fit">{C.nav.fit}</a>
        <a href="#faq">{C.nav.faq}</a>
      </nav>

      <main id="main">
        <section className="hero cai-hero">
          <div className="wrap cai-hero-grid">
            <div>
              <p className="crumbs">
                <a href="/">Mochi</a>
                <span aria-hidden="true"> / </span>
                <span aria-current="page">Character.AI Alternative</span>
              </p>
              <p className="eyebrow">{C.eyebrow}</p>
              <h1>
                {C.h1Lines.map((line, i) => (
                  <span key={line} className="cai-h1-line">
                    {i === C.h1Lines.length - 1 ? <span className="grad">{line}</span> : line}
                  </span>
                ))}
              </h1>
              <p className="lead">{C.description}</p>
              <div className="ctas">
                <a className="btn btn-pink" href="#start" data-cta="cai_hero_start">{C.heroCta}</a>
                <a className="btn btn-railway" href={RAILWAY_DEPLOY} {...ext} data-cta="cai_hero_railway">
                  <NewTab>{C.deployCta}</NewTab>
                </a>
                <a className="btn btn-ghost" href={fk("cai_hero_key")} {...ext} data-cta="cai_hero_key">
                  <NewTab>{C.keyCta}</NewTab>
                </a>
              </div>
              <p className="cai-more">
                <a href="/#get-started" data-cta="cai_hero_guide">{C.guideCta}</a>
                <span aria-hidden="true"> · </span>
                <a href={deployPathFor(LANG)} data-cta="cai_hero_deploy">{C.deployMore}</a>
                <span aria-hidden="true"> · </span>
                <a href={tutorialPathFor(LANG)} data-cta="cai_hero_tutorial">Setup video</a>
              </p>
              <p className="cai-position">{C.position}</p>
              <p className="note">{C.disclaimer}</p>
              <div className="platforms">
                <span>{C.runsOn}</span>
                {PLATFORMS.map(([name, col]) => (
                  <i key={name} style={{ ["--c" as string]: col }}>{name}</i>
                ))}
              </div>
            </div>
            <div className="cai-visual">
              <Image
                className="cai-avatar"
                src="/mochi-avatar-512.png"
                alt="Mochi, the AI chatbot, as a pink-haired anime girl waving hello"
                width={512}
                height={512}
                priority
              />
              <ul className="cai-pills" aria-label="Memory controls on your server">
                <li>Inspect profiles</li>
                <li>Delete a person or room</li>
                <li>Download a backup</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="sec" aria-labelledby="benefits-h">
          <div className="wrap">
            <h2 id="benefits-h">{C.benefits.h2}</h2>
            <p className="sub">{C.benefits.sub}</p>
            <div className="grid4">
              {C.benefits.items.map((item) => (
                <article key={item.t} className="card">
                  <div className="ico" aria-hidden="true">{item.icon}</div>
                  <h3>{item.t}</h3>
                  <p>{item.b}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="memory" className="sec sec-tint" aria-labelledby="memory-h">
          <div className="wrap">
            <h2 id="memory-h">{C.memory.h2}</h2>
            <p className="sub">{C.memory.sub}</p>
            <div className="grid3">
              {C.memory.items.map((item) => (
                <article key={item.t} className="card">
                  <div className="ico" aria-hidden="true">{item.icon}</div>
                  <h3>{item.t}</h3>
                  <p>{item.b}</p>
                </article>
              ))}
            </div>
            <div className="cai-limits">
              <h3>{C.memory.limitsTitle}</h3>
              <ul>
                {C.memory.limits.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p>
                <a href={privacyPathFor(LANG)}>Privacy policy</a>
                <span> covers the same split: your database stays on your server, and replies go to Flatkey to be written.</span>
              </p>
            </div>
          </div>
        </section>

        <section id="persona" className="sec" aria-labelledby="persona-h">
          <div className="wrap">
            <h2 id="persona-h">{C.persona.h2}</h2>
            <p className="sub">{C.persona.sub}</p>
            <div className="cai-split">
              <div className="cai-prose">
                {C.persona.body.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
              <figure className="cai-shot">
                <Image src="/persona.png" alt={C.persona.shotAlt} {...SHOT} sizes="(max-width: 800px) 100vw, 560px" />
                <figcaption>{C.persona.shotCaption}</figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section id="channels" className="sec sec-tint" aria-labelledby="channels-h">
          <div className="wrap">
            <h2 id="channels-h">{C.channels.h2}</h2>
            <p className="sub">{C.channels.sub}</p>
            <div className="cai-split">
              <div className="cai-prose">
                <p>{C.channels.body}</p>
                <ul>
                  {C.channels.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
                <p>
                  {C.channels.tutorialsLead}{" "}
                  <a href={postPath("discord-ai-chatbot")} data-cta="cai_discord">{C.channels.discordTutorial}</a>
                  {" · "}
                  <a href={postPath("telegram-ai-chatbot")} data-cta="cai_telegram">{C.channels.telegramTutorial}</a>
                  . {C.channels.tutorialsRest}
                </p>
              </div>
              <figure className="cai-shot">
                <Image src="/channels.png" alt={C.channels.shotAlt} {...SHOT} sizes="(max-width: 800px) 100vw, 560px" />
                <figcaption>{C.channels.shotCaption}</figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section id="start" className="sec" aria-labelledby="start-h">
          <div className="wrap narrow">
            <h2 id="start-h">{C.setup.h2}</h2>
            <p className="sub">{C.setup.sub}</p>
            <ol className="cai-steps">
              <li>
                <h3>{C.setup.steps[0].t}</h3>
                <p>{C.setup.steps[0].b}</p>
                <p className="cai-cmd-label">{C.setup.installLabel}</p>
                <CopyCmd cmd={INSTALL_COMMAND.linux} copy={C.setup.copy} copied={C.setup.copied} spot="cai_copy_install" />
                <p className="cai-cmd-note">{C.setup.installNote}</p>
                <div className="cai-actions">
                  <a className="btn btn-sm btn-ghost" href="/#get-started" data-cta="cai_step_guide">{C.guideCta}</a>
                  <a className="btn btn-sm btn-railway" href={RAILWAY_DEPLOY} {...ext} data-cta="cai_step_railway">
                    <NewTab>{C.deployCta}</NewTab>
                  </a>
                  <a className="btn btn-sm btn-ghost" href={deployPathFor(LANG)} data-cta="cai_step_deploy">{C.deployMore}</a>
                </div>
              </li>
              <li>
                <h3>{C.setup.steps[1].t}</h3>
                <p>{C.setup.steps[1].b}</p>
              </li>
              <li>
                <h3>{C.setup.steps[2].t}</h3>
                <p>{C.setup.steps[2].b}</p>
                <div className="cai-actions">
                  <a className="btn btn-sm btn-pink" href={fk("cai_step_key")} {...ext} data-cta="cai_step_key">
                    <NewTab>{C.keyCta}</NewTab>
                  </a>
                </div>
              </li>
              {C.setup.steps.slice(3).map((step) => (
                <li key={step.t}>
                  <h3>{step.t}</h3>
                  <p>{step.b}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="sec sec-tint" aria-labelledby="cost-h">
          <div className="wrap">
            <h2 id="cost-h">{C.cost.h2}</h2>
            <p className="sub">{C.cost.sub}</p>
            <div className="grid3">
              {C.cost.items.map((item) => (
                <article key={item.t} className="card">
                  <div className="ico" aria-hidden="true">{item.icon}</div>
                  <h3>{item.t}</h3>
                  <p>{item.b}</p>
                </article>
              ))}
            </div>
            <p className="cai-center-link">
              <a className="gh-link" href={REPO} {...ext} data-cta="cai_github">
                <GitHubIcon size={16} />
                <NewTab>{C.githubCta}</NewTab>
              </a>
            </p>
          </div>
        </section>

        <section id="fit" className="sec" aria-labelledby="fit-h">
          <div className="wrap">
            <h2 id="fit-h">{C.fit.h2}</h2>
            <p className="sub">{C.fit.sub}</p>
            <div className="cai-fit">
              <article className="card cai-good">
                <h3>{C.fit.goodTitle}</h3>
                <ul>
                  {C.fit.good.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
              <article className="card cai-poor">
                <h3>{C.fit.poorTitle}</h3>
                <ul>
                  {C.fit.poor.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className="sec sec-tint" aria-labelledby="essay-h">
          <div className="wrap narrow">
            <h2 id="essay-h">{C.essay.h2}</h2>
            <div className="cai-essay">
              <p>{C.essay.body}</p>
              <a className="btn btn-ghost" href={postPath("own-your-ai-companion")} data-cta="cai_essay">{C.essay.link}</a>
            </div>
          </div>
        </section>

        <section id="faq" className="sec" aria-labelledby="faq-h">
          <div className="wrap narrow">
            <h2 id="faq-h">{C.faq.h2}</h2>
            {C.faq.items.map((item) => (
              <details key={item.q} className="faq">
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="sec final">
          <div className="wrap final-in">
            <Image src="/mochi-avatar-256.png" alt="" width={120} height={120} />
            <h2>{C.final.h2}</h2>
            <p className="sub">{C.final.sub}</p>
            <div className="ctas center">
              <a className="btn btn-pink" href="#start" data-cta="cai_final_start">{C.heroCta}</a>
              <a className="btn btn-railway" href={RAILWAY_DEPLOY} {...ext} data-cta="cai_final_railway">
                <NewTab>{C.deployCta}</NewTab>
              </a>
              <a className="btn btn-ghost" href={fk("cai_final_key")} {...ext} data-cta="cai_final_key">
                <NewTab>{C.keyCta}</NewTab>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap foot-in">
          <div><b>Mochi</b> · Open-source AI chatbots, powered by Flatkey.</div>
          <div className="foot-links">
            <a className="gh-link" href={REPO} {...ext} data-cta="cai_footer_github"><GitHubIcon size={15} /><NewTab>GitHub</NewTab></a>
            <a href={`${REPO}/blob/main/LICENSE`} {...ext}><NewTab>MIT License</NewTab></a>
            <a href="/blog" data-cta="cai_footer_blog">Blog</a>
            <a href={CHARACTER_AI_PATH} hrefLang="en" aria-current="page">{CHARACTER_AI_FOOTER.en}</a>
            <a href={deployPathFor(LANG)}>{DEPLOY.en.footerLink}</a>
            <a href={privacyPathFor(LANG)}>{PRIVACY.en.footerLink}</a>
            <a href={termsPathFor(LANG)}>{TERMS.en.footerLink}</a>
            <a href={fk("cai_footer")} {...ext} data-cta="cai_footer_key"><NewTab>Get a Flatkey key</NewTab></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
