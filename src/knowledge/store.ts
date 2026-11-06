import type { Db } from "../db/index.ts";
import { ddl } from "../db/index.ts";

export interface KnowledgeDoc {
  id: number;
  botId: string;
  title: string;
  source: "text" | "file" | "url";
  sourceRef: string;
  chars: number;
  chunks: number;
  createdAt: number;
}

export interface KnowledgeHit {
  docId: number;
  title: string;
  sourceRef: string;
  text: string;
  score: number;
}

const CHUNK_CHARS = 900;
const CHUNK_OVERLAP = 150;
const MAX_DOC_CHARS = 2_000_000;

const STOPWORDS = new Set(
  "the and for are but not you your with that this from have has had was were what when where which who why how can could would should will about into than then them they their there here our out all any its it's also just does did doing done i'm you're please tell know want need like".split(
    " ",
  ),
);

/**
 * Per-bot knowledge base for Q&A bots. Documents are split into chunks. No embedding calls and
 * no extra cost:
 * - SQLite: an FTS5 index with the trigram tokenizer (works for English, Chinese, Japanese…), ranked by bm25.
 * - PostgreSQL: plain LIKE matching on the same trigram terms, ranked by how many terms a chunk
 *   contains. No extension to install, which keeps every managed Postgres an option; knowledge
 *   bases here are small (a shop's FAQ, a few manuals), so a scan is fast enough.
 */
export class KnowledgeStore {
  /** Column that keeps chunks in document order. */
  private readonly ord: string;

  private constructor(private readonly db: Db) {
    this.ord = db.dialect === "sqlite" ? "rowid" : "id";
  }

  static async open(db: Db): Promise<KnowledgeStore> {
    await db.exec(
      ddl(
        db.dialect,
        `CREATE TABLE IF NOT EXISTS kb_docs (
          id {id}, bot_id TEXT NOT NULL,
          title TEXT NOT NULL, source TEXT NOT NULL, source_ref TEXT NOT NULL DEFAULT '',
          chars INTEGER NOT NULL, chunks INTEGER NOT NULL, created_at {bigint} NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_kb_docs_bot ON kb_docs(bot_id);`,
      ),
    );
    await db.exec(
      db.dialect === "sqlite"
        ? `CREATE VIRTUAL TABLE IF NOT EXISTS kb_chunks USING fts5(body, bot_id UNINDEXED, doc_id UNINDEXED, tokenize = 'trigram');`
        : `CREATE TABLE IF NOT EXISTS kb_chunks (id BIGSERIAL PRIMARY KEY, body TEXT NOT NULL, bot_id TEXT NOT NULL, doc_id BIGINT NOT NULL);
           CREATE INDEX IF NOT EXISTS idx_kb_chunks_doc ON kb_chunks(bot_id, doc_id);`,
    );
    return new KnowledgeStore(db);
  }

  async addDocument(botId: string, title: string, source: KnowledgeDoc["source"], sourceRef: string, text: string): Promise<KnowledgeDoc> {
    const clean = normalize(text).slice(0, MAX_DOC_CHARS);
    if (clean.length < 20) throw new Error("That document has almost no text in it.");
    const chunks = chunk(clean);
    const now = Date.now();
    const docId = await this.db.tx(async (tx) => {
      const row = await tx.get(
        `INSERT INTO kb_docs (bot_id, title, source, source_ref, chars, chunks, created_at) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
        [botId, title.slice(0, 200) || "Untitled", source, sourceRef.slice(0, 500), clean.length, chunks.length, now],
      );
      const id = Number(row.id);
      for (const c of chunks) await tx.run(`INSERT INTO kb_chunks (body, bot_id, doc_id) VALUES (?, ?, ?)`, [c, botId, id]);
      return id;
    });
    return (await this.getDoc(botId, docId))!;
  }

  async getDoc(botId: string, id: number): Promise<KnowledgeDoc | undefined> {
    const r = await this.db.get(`SELECT * FROM kb_docs WHERE bot_id = ? AND id = ?`, [botId, id]);
    return r ? rowToDoc(r) : undefined;
  }

  async docText(botId: string, id: number): Promise<string> {
    const rows = await this.db.all(`SELECT body FROM kb_chunks WHERE bot_id = ? AND doc_id = ? ORDER BY ${this.ord}`, [botId, id]);
    // Chunks overlap; strip the repeated prefix for a readable preview.
    return rows.map((r, i) => (i === 0 ? r.body : String(r.body).slice(CHUNK_OVERLAP))).join("");
  }

  async listDocs(botId: string): Promise<KnowledgeDoc[]> {
    return (await this.db.all(`SELECT * FROM kb_docs WHERE bot_id = ? ORDER BY created_at DESC`, [botId])).map(rowToDoc);
  }

  async deleteDoc(botId: string, id: number): Promise<void> {
    await this.db.run(`DELETE FROM kb_chunks WHERE bot_id = ? AND doc_id = ?`, [botId, id]);
    await this.db.run(`DELETE FROM kb_docs WHERE bot_id = ? AND id = ?`, [botId, id]);
  }

  async deleteBot(botId: string): Promise<void> {
    await this.db.run(`DELETE FROM kb_chunks WHERE bot_id = ?`, [botId]);
    await this.db.run(`DELETE FROM kb_docs WHERE bot_id = ?`, [botId]);
  }

  async count(botId: string): Promise<number> {
    return Number((await this.db.get(`SELECT COUNT(*) AS n FROM kb_docs WHERE bot_id = ?`, [botId]))?.n ?? 0);
  }

  /** Candidate chunks for the trigram terms, best first (lower score = better, like bm25). */
  private async matchTerms(botId: string, trigramTerms: string[], limit: number): Promise<any[]> {
    if (!trigramTerms.length) return [];
    if (this.db.dialect === "sqlite") {
      const match = trigramTerms.map((t) => `"${t.replace(/"/g, '""')}"`).join(" OR ");
      try {
        return await this.db.all(
          `SELECT kb_chunks.body AS body, kb_chunks.doc_id AS doc_id, bm25(kb_chunks) AS score
           FROM kb_chunks WHERE kb_chunks MATCH ? AND bot_id = ? ORDER BY score LIMIT ?`,
          [match, botId, limit],
        );
      } catch {
        return [];
      }
    }
    const like = (t: string) => "%" + t.replace(/[\\%_]/g, (c) => "\\" + c) + "%";
    const hits = trigramTerms.map(() => "(CASE WHEN lower(body) LIKE ? THEN 1 ELSE 0 END)").join(" + ");
    const any = trigramTerms.map(() => "lower(body) LIKE ?").join(" OR ");
    const rows = await this.db.all(
      `SELECT body, doc_id, -(${hits}) AS score FROM kb_chunks WHERE bot_id = ? AND (${any}) ORDER BY score, id LIMIT ?`,
      [...trigramTerms.map(like), botId, ...trigramTerms.map(like), limit],
    );
    return rows;
  }

  /** Find the chunks most relevant to a question. */
  async search(botId: string, query: string, limit = 4): Promise<KnowledgeHit[]> {
    const { trigramTerms, shortCjk } = terms(query);
    let rows: any[] = await this.matchTerms(botId, trigramTerms, limit * 3);
    // Two-character CJK words (e.g. 退款) are shorter than a trigram: fall back to LIKE.
    if (rows.length < limit && shortCjk.length) {
      const scored = new Map<string, { body: string; doc_id: number; hits: number }>();
      for (const w of shortCjk) {
        for (const r of await this.db.all(`SELECT body, doc_id FROM kb_chunks WHERE bot_id = ? AND body LIKE ? LIMIT 50`, [botId, `%${w}%`])) {
          const k = `${r.doc_id}:${r.body.slice(0, 40)}`;
          const cur = scored.get(k) ?? { body: r.body, doc_id: r.doc_id, hits: 0 };
          cur.hits++;
          scored.set(k, cur);
        }
      }
      const extra = [...scored.values()].sort((a, b) => b.hits - a.hits).map((r) => ({ ...r, score: -r.hits }));
      rows = [...rows, ...extra];
    }
    const byKey = new Map<string, KnowledgeHit>();
    const docs = new Map<number, KnowledgeDoc | undefined>();
    const addCandidate = async (docId: number, body: string, score: number) => {
      const key = String(body).slice(0, 80);
      if (!docs.has(docId)) docs.set(docId, await this.getDoc(botId, docId));
      const doc = docs.get(docId);
      if (!doc) return;
      const existing = byKey.get(key);
      // Keep the *best* score for a passage: the same chunk can arrive from the FTS pass and
      // from the title pass, and dropping the stronger signal would rank the wrong doc first.
      if (existing) existing.score = Math.min(existing.score, score);
      else byKey.set(key, { docId: doc.id, title: doc.title, sourceRef: doc.sourceRef, text: body, score });
    };
    for (const r of rows) await addCandidate(Number(r.doc_id), String(r.body), Number(r.score));

    // The index only covers bodies, so a document that is *about* the question — titled
    // "Shipping policy" while its body says "orders leave the warehouse" — would never be a
    // candidate. Pull title matches in explicitly; the boost below then ranks them first.
    const wanted = [...trigramTerms, ...shortCjk].map((t) => t.toLowerCase());
    const titleDocs = new Set<number>();
    for (const t of wanted) {
      if (t.length < 2 || titleDocs.size >= 5) continue;
      const found = await this.db.all(`SELECT id FROM kb_docs WHERE bot_id = ? AND lower(title) LIKE ? LIMIT 5`, [botId, `%${t}%`]);
      for (const r of found) titleDocs.add(Number(r.id));
    }
    for (const docId of titleDocs) {
      const chunks = await this.db.all(`SELECT body FROM kb_chunks WHERE bot_id = ? AND doc_id = ? ORDER BY ${this.ord} LIMIT 2`, [botId, docId]);
      for (const c of chunks) await addCandidate(docId, String(c.body), -3);
    }

    // Lower is better, so subtract for every query term the title contains.
    const boosted = [...byKey.values()].map((h) => {
      const title = h.title.toLowerCase();
      const titleHits = wanted.filter((t) => t.length >= 2 && title.includes(t)).length;
      return { ...h, score: h.score - titleHits * 2 };
    });
    return boosted.sort((a, b) => a.score - b.score).slice(0, limit);
  }

  /** Titles of the bot's documents, so the model knows what it can look things up in. */
  async titles(botId: string, limit = 12): Promise<string[]> {
    return (await this.db.all(`SELECT title FROM kb_docs WHERE bot_id = ? ORDER BY created_at DESC LIMIT ?`, [botId, limit])).map((r) =>
      String(r.title),
    );
  }
}

export function normalize(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Split on paragraphs into ~900-char chunks with a little overlap, so answers that span a boundary aren't lost. */
export function chunk(text: string): string[] {
  const paras = text.split(/\n\n+/);
  const out: string[] = [];
  let cur = "";
  const push = () => {
    if (cur.trim()) out.push(cur.trim());
    cur = cur.slice(-CHUNK_OVERLAP);
  };
  for (const p of paras) {
    if (p.length > CHUNK_CHARS) {
      // Long paragraph: split by sentences, then hard-wrap.
      for (const s of p.split(/(?<=[.!?。！？])\s*/)) {
        for (let i = 0; i < s.length; i += CHUNK_CHARS) {
          const piece = s.slice(i, i + CHUNK_CHARS);
          if (cur.length + piece.length > CHUNK_CHARS) push();
          cur += (cur ? " " : "") + piece;
        }
      }
      continue;
    }
    if (cur.length + p.length + 2 > CHUNK_CHARS) push();
    cur += (cur ? "\n\n" : "") + p;
  }
  if (cur.trim() && (!out.length || !out[out.length - 1].endsWith(cur.trim()))) out.push(cur.trim());
  return out.slice(0, 5000);
}

const CJK = /[぀-ヿ㐀-䶿一-鿿가-힯]/;

function terms(query: string): { trigramTerms: string[]; shortCjk: string[] } {
  const trigramTerms = new Set<string>();
  const shortCjk = new Set<string>();
  const q = query.toLowerCase();
  for (const w of q.match(/[a-z0-9][a-z0-9_.\-']*[a-z0-9]|[a-z0-9]/g) ?? []) {
    if (w.length >= 3 && !STOPWORDS.has(w)) trigramTerms.add(w);
  }
  for (const run of q.match(/[぀-ヿ㐀-䶿一-鿿가-힯]+/g) ?? []) {
    if (run.length >= 3) for (let i = 0; i + 3 <= run.length && trigramTerms.size < 40; i++) trigramTerms.add(run.slice(i, i + 3));
    for (let i = 0; i + 2 <= run.length; i++) if (CJK.test(run[i])) shortCjk.add(run.slice(i, i + 2));
  }
  return { trigramTerms: [...trigramTerms].slice(0, 40), shortCjk: [...shortCjk].slice(0, 20) };
}

function rowToDoc(r: any): KnowledgeDoc {
  return {
    id: Number(r.id),
    botId: r.bot_id,
    title: r.title,
    source: r.source,
    sourceRef: r.source_ref,
    chars: Number(r.chars),
    chunks: Number(r.chunks),
    createdAt: Number(r.created_at),
  };
}
