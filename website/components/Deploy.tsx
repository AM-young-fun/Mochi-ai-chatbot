import type { Lang } from "@/lib/content";
import { DEPLOY, DEPLOY_COMMANDS, DEPLOY_EMOJI, DEPLOY_LINKS, DEPLOY_ORDER, type DeployId } from "@/lib/deploy";
import { deployUrlFor, pathFor, urlFor } from "@/lib/site";
import { CopyCmd } from "./CopyCmd";

/** The Deploy page: Railway first and featured, then a card for every other way to run Mochi. */
export function Deploy({ lang }: { lang: Lang }) {
  const c = DEPLOY[lang];
  const sfx = (spot: string) => (lang === "en" ? spot : `${spot}_${lang}`);
  const href = (k: keyof typeof DEPLOY_LINKS | "home") => (k === "home" ? `${pathFor(lang)}#get-started` : DEPLOY_LINKS[k]);

  const card = (id: DeployId, featured = false) => {
    const d = c.cards[id];
    const cmd = DEPLOY_COMMANDS[id];
    return (
      <article key={id} id={id} className={"dcard" + (featured ? " featured" : "")}>
        <div className="dcard-head">
          <span className="demoji" aria-hidden>{DEPLOY_EMOJI[id]}</span>
          <h2>{d.name}</h2>
          {featured && <span className="dbadge">{c.recommended}</span>}
        </div>
        <p className="dtag">{d.tagline}</p>
        <p className="dbest"><b>{c.bestFor}:</b> {d.best}</p>
        <ul className="dchips">{d.chips.map((x) => <li key={x}>{x}</li>)}</ul>
        {cmd && <CopyCmd cmd={cmd} copy={c.copy} copied={c.copied} spot={sfx(`deploy_copy_${id}`)} />}
        {d.note && <p className="dnote">{d.note}</p>}
        <div className="dactions">
          {d.actions.map((a) => {
            const internal = a.href === "home";
            return (
              <a key={a.label} className={"btn btn-sm " + (a.primary ? (id === "railway" ? "btn-railway" : "btn-dark") : "btn-ghost")} href={href(a.href)}
                {...(internal ? {} : { target: "_blank", rel: "noopener" })} data-cta={sfx(`deploy_${id}_${a.href}`)}>
                {a.label}{internal ? " →" : " ↗"}
              </a>
            );
          })}
        </div>
      </article>
    );
  };

  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Mochi", item: urlFor(lang) },
      { "@type": "ListItem", position: 2, name: c.h1, item: deployUrlFor(lang) },
    ],
  };
  return (
    <main className="deploy-page wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <p><a href={pathFor(lang)}>{c.back}</a></p>
      <header className="dhero">
        <h1>{c.h1}</h1>
        <p className="lead">{c.intro}</p>
      </header>
      {card("railway", true)}
      <h2 className="dothers">{c.others}</h2>
      <div className="dgrid">{DEPLOY_ORDER.map((id) => card(id))}</div>
      <div className="dinfo">
        <section>
          <h3>{c.needsTitle}</h3>
          <ul>{c.needs.map((n, i) => <li key={i} dangerouslySetInnerHTML={{ __html: n }} />)}</ul>
        </section>
        <section>
          <h3>{c.afterTitle}</h3>
          <p dangerouslySetInnerHTML={{ __html: c.after }} />
        </section>
      </div>
    </main>
  );
}
