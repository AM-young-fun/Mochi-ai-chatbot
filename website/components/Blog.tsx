import { BLOG_PATH, POSTS, postPath, type BlogPost } from "@/lib/blog";
import { RENDER_DEPLOY, SITE_URL, flatkeyKeyUrl } from "@/lib/site";

const fmt = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
const ext = { target: "_blank", rel: "noopener" } as const;

function Header() {
  return (
    <header className="blog-head">
      <div className="wrap narrow blog-bar">
        <a href="/" className="blog-brand"><img src="/mochi-avatar-512.png" alt="" width={32} height={32} /> Mochi</a>
        <nav>
          <a href={BLOG_PATH}>Blog</a>
          <a href="/#get-started">Setup guide</a>
        </nav>
      </div>
    </header>
  );
}

export function BlogIndex() {
  return (
    <>
      <Header />
      <main className="blog wrap narrow">
        <h1>Mochi blog</h1>
        <p className="muted">Notes on running your own AI companion: memory, costs, hosting and the catches.</p>
        <ul className="blog-list">
          {POSTS.map((p) => (
            <li key={p.slug}>
              <a href={postPath(p.slug)}>
                <h2>{p.title}</h2>
                <p>{p.description}</p>
                <span className="muted">{fmt(p.published)} · {p.minutes} min read</span>
              </a>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}

export function BlogArticle({ post }: { post: BlogPost }) {
  const url = SITE_URL + postPath(post.slug);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      datePublished: post.published,
      dateModified: post.updated,
      inLanguage: "en",
      mainEntityOfPage: url,
      url,
      image: `${SITE_URL}/social-preview.png`,
      keywords: post.keywords.join(", "),
      author: { "@type": "Organization", name: "Mochi", url: SITE_URL },
      publisher: { "@type": "Organization", name: "Mochi", url: SITE_URL, logo: { "@type": "ImageObject", url: `${SITE_URL}/mochi-avatar-512.png` } },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Mochi", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Blog", item: SITE_URL + BLOG_PATH },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
      ],
    },
  ];
  return (
    <>
      <Header />
      <main className="blog wrap narrow">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <p className="crumbs"><a href={BLOG_PATH}>← All posts</a></p>
        <article>
          <h1>{post.title}</h1>
          <p className="muted">{fmt(post.published)} · {post.minutes} min read</p>
          {post.intro.map((p, i) => <p key={i} className={i === 0 ? "lede" : undefined} dangerouslySetInnerHTML={{ __html: p }} />)}
          {post.sections.map((s, i) => (
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
        </article>
        <aside className="blog-cta">
          <img src="/mochi-avatar-512.png" alt="" width={72} height={72} />
          <div>
            <b>Try Mochi</b>
            <p>Free and open source. Get a Flatkey key ($1 free credit for new accounts), then follow the setup guide.</p>
            <div className="ctas">
              <a className="btn btn-sm btn-pink" href={flatkeyKeyUrl("blog_key", "en")} {...ext} data-cta="blog_key">🔑 Get a Flatkey key</a>
              <a className="btn btn-sm btn-ghost" href="/#get-started" data-cta="blog_guide">🚀 Setup guide</a>
              <a className="btn btn-sm btn-dark" href={RENDER_DEPLOY} {...ext} data-cta="blog_render">☁️ Deploy to Render</a>
            </div>
          </div>
        </aside>
      </main>
    </>
  );
}
