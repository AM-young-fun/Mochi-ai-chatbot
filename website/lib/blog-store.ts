// Where the blog MCP keeps posts: the GitHub repo. Published posts are files on main
// (website/content/blog/<slug>.md); a commit there redeploys the site. Drafts are files on the
// blog-drafts branch (website/content/blog-drafts/<slug>.md), which nothing deploys.
// No "@/" imports: the repo-root tests import this file.

export type Where = "published" | "drafts";

export interface StoredFile {
  slug: string;
  text: string;
  /** GitHub blob sha, needed to update or delete the file. */
  sha: string;
}

export interface BlogStore {
  list(where: Where): Promise<StoredFile[]>;
  get(where: Where, slug: string): Promise<StoredFile | null>;
  put(where: Where, slug: string, text: string, message: string, sha?: string): Promise<void>;
  remove(where: Where, slug: string, sha: string, message: string): Promise<void>;
}

const API = "https://api.github.com";
export const DRAFTS_BRANCH = "blog-drafts";
const DIRS: Record<Where, string> = { published: "website/content/blog", drafts: "website/content/blog-drafts" };

export class GitHubStore implements BlogStore {
  private branchReady = false;
  constructor(
    private readonly token: string,
    private readonly repo = "AM-young-fun/Mochi-ai-chatbot",
    private readonly main = "main",
  ) {}

  private branch(where: Where) {
    return where === "published" ? this.main : DRAFTS_BRANCH;
  }

  private async gh<T>(method: string, url: string, body?: unknown): Promise<{ status: number; data: T }> {
    const res = await fetch(url.startsWith("http") ? url : `${API}${url}`, {
      method,
      headers: {
        authorization: `Bearer ${this.token}`,
        accept: "application/vnd.github+json",
        "x-github-api-version": "2022-11-28",
        "user-agent": "mochi-blog-mcp",
        ...(body ? { "content-type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const data = (res.status === 204 ? null : await res.json().catch(() => null)) as T;
    if (res.status === 401) throw new Error("GitHub refused BLOG_GITHUB_TOKEN (bad or expired). Make a new fine-grained token with Contents: read and write on the repo.");
    if (res.status === 403 && /resource not accessible|permission/i.test(JSON.stringify(data))) {
      throw new Error("BLOG_GITHUB_TOKEN can't write to the repo. Give it Contents: read and write on AM-young-fun/Mochi-ai-chatbot.");
    }
    if (res.status >= 400 && res.status !== 404) {
      const msg = (data as { message?: string } | null)?.message ?? res.statusText;
      throw new Error(`GitHub ${method} ${url.replace(API, "")}: ${res.status} ${msg}`);
    }
    return { status: res.status, data };
  }

  /** Makes the drafts branch from main the first time a draft is saved. */
  private async ensureDrafts() {
    if (this.branchReady) return;
    const r = await this.gh<unknown>("GET", `/repos/${this.repo}/git/ref/heads/${DRAFTS_BRANCH}`);
    if (r.status === 404) {
      const main = await this.gh<{ object: { sha: string } }>("GET", `/repos/${this.repo}/git/ref/heads/${this.main}`);
      await this.gh("POST", `/repos/${this.repo}/git/refs`, { ref: `refs/heads/${DRAFTS_BRANCH}`, sha: main.data.object.sha });
    }
    this.branchReady = true;
  }

  /** Every post in one request (GraphQL), instead of one request per file. */
  async list(where: Where): Promise<StoredFile[]> {
    const [owner, name] = this.repo.split("/");
    const query = `query($owner:String!,$name:String!,$expr:String!){repository(owner:$owner,name:$name){object(expression:$expr){... on Tree{entries{name oid object{... on Blob{text}}}}}}}`;
    const r = await this.gh<{ data?: { repository?: { object?: { entries?: { name: string; oid: string; object?: { text?: string } }[] } } }; errors?: { message: string }[] }>(
      "POST", `${API}/graphql`, { query, variables: { owner, name, expr: `${this.branch(where)}:${DIRS[where]}` } },
    );
    if (r.data?.errors?.length) throw new Error(`GitHub: ${r.data.errors[0].message}`);
    return (r.data?.data?.repository?.object?.entries ?? [])
      .filter((e) => e.name.endsWith(".md") && typeof e.object?.text === "string")
      .map((e) => ({ slug: e.name.slice(0, -3), text: e.object!.text!, sha: e.oid }));
  }

  async get(where: Where, slug: string): Promise<StoredFile | null> {
    const r = await this.gh<{ content: string; sha: string }>("GET", `/repos/${this.repo}/contents/${DIRS[where]}/${slug}.md?ref=${this.branch(where)}`);
    if (r.status === 404 || !r.data?.content) return null;
    return { slug, text: Buffer.from(r.data.content, "base64").toString("utf8"), sha: r.data.sha };
  }

  async put(where: Where, slug: string, text: string, message: string, sha?: string): Promise<void> {
    if (where === "drafts") await this.ensureDrafts();
    await this.gh("PUT", `/repos/${this.repo}/contents/${DIRS[where]}/${slug}.md`, {
      message,
      content: Buffer.from(text, "utf8").toString("base64"),
      branch: this.branch(where),
      ...(sha ? { sha } : {}),
    });
  }

  async remove(where: Where, slug: string, sha: string, message: string): Promise<void> {
    await this.gh("DELETE", `/repos/${this.repo}/contents/${DIRS[where]}/${slug}.md`, { message, sha, branch: this.branch(where) });
  }
}

/** For tests and local trials: the same behaviour, kept in memory. */
export class MemoryStore implements BlogStore {
  readonly files: Record<Where, Map<string, StoredFile>> = { published: new Map(), drafts: new Map() };
  readonly commits: { where: Where; message: string }[] = [];
  private n = 0;
  async list(where: Where) { return [...this.files[where].values()]; }
  async get(where: Where, slug: string) { return this.files[where].get(slug) ?? null; }
  async put(where: Where, slug: string, text: string, message: string, sha?: string) {
    const cur = this.files[where].get(slug);
    if (cur && cur.sha !== sha) throw new Error("GitHub PUT: 409 sha does not match");
    if (!cur && sha) throw new Error("GitHub PUT: 404 file not found");
    this.files[where].set(slug, { slug, text, sha: `sha${++this.n}` });
    this.commits.push({ where, message });
  }
  async remove(where: Where, slug: string, sha: string, message: string) {
    if (this.files[where].get(slug)?.sha !== sha) throw new Error("GitHub DELETE: 409 sha does not match");
    this.files[where].delete(slug);
    this.commits.push({ where, message });
  }
}
