import type { Lang } from "@/lib/content";
import { PRIVACY, type PrivacyCopy } from "@/lib/privacy";
import { TERMS } from "@/lib/terms";
import { pathFor } from "@/lib/site";

/** A legal page (privacy policy, terms): title, date, intro and sections of trusted static HTML. */
function LegalDoc({ lang, c }: { lang: Lang; c: PrivacyCopy }) {
  return (
    <main className="privacy wrap narrow">
      <p><a href={pathFor(lang)}>{c.back}</a></p>
      <h1>{c.title.split(" · ")[0]}</h1>
      <p className="muted">{c.updated}</p>
      <p dangerouslySetInnerHTML={{ __html: c.intro }} />
      {c.sections.map((s, i) => (
        <section key={i}>
          {s.h && <h2>{s.h}</h2>}
          {s.p?.map((p, j) => <p key={j} dangerouslySetInnerHTML={{ __html: p }} />)}
          {s.list && (
            <ul>
              {s.list.map((li, j) => <li key={j} dangerouslySetInnerHTML={{ __html: li }} />)}
            </ul>
          )}
        </section>
      ))}
    </main>
  );
}

export function Privacy({ lang }: { lang: Lang }) {
  return <LegalDoc lang={lang} c={PRIVACY[lang]} />;
}

export function Terms({ lang }: { lang: Lang }) {
  return <LegalDoc lang={lang} c={TERMS[lang]} />;
}
