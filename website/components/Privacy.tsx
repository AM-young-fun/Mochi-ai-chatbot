import type { Lang } from "@/lib/content";
import { PRIVACY } from "@/lib/privacy";
import { pathFor } from "@/lib/site";

export function Privacy({ lang }: { lang: Lang }) {
  const c = PRIVACY[lang];
  return (
    <main className="privacy wrap narrow">
      <p><a href={pathFor(lang)}>{c.back}</a></p>
      <h1>{c.title.split(" · ")[0]}</h1>
      <p className="muted">{c.updated}</p>
      <p>{c.intro}</p>
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
