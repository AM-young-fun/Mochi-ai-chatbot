/**
 * RAM layer in front of the database.
 *
 * Every chat message used to cost a dozen database round trips (history, person, room, budget,
 * knowledge). On a local SQLite file that's nothing; on a PostgreSQL server across the internet it
 * adds up to a noticeable pause before each reply. This layer keeps what a reply needs in memory:
 *
 * - Reads come from RAM after the first time: recent messages per room, people, rooms, today's
 *   token totals, and per bot the knowledge base's document count, titles, documents and recent
 *   search results.
 * - Chat-path writes (new messages, people seen, room counters, usage) update RAM at once and go
 *   to the database in order in the background, so a reply never waits on them. Anything that has
 *   to read the database first waits for those writes, so it never sees older data than RAM.
 *   Knowledge base changes are written right away and clear that bot's knowledge cache.
 *
 * Mochi runs as a single instance (chat platforms allow one connection per bot token), so this
 * process is the only writer and the RAM copy can't go stale. STORAGE_CACHE=off turns it off.
 * Pending writes are flushed on shutdown; a hard crash can lose the last moment of chat history.
 */
import type { Platform } from "../core/types.ts";
import type { Db } from "./index.ts";
import { KnowledgeStore, type KnowledgeDoc, type KnowledgeHit } from "../knowledge/store.ts";
import { MemoryStore, type Person, type Room, type StoredMessage } from "../memory/store.ts";

const MAX_ROOMS = 500; // rooms whose recent messages stay in RAM
const MAX_PEOPLE = 5000;
const ROOM_MESSAGES = 300; // same cap as the database keeps per room
const MIN_HISTORY_LOAD = 50;
const MAX_SEARCHES = 300; // cached knowledge search results, across bots

/** A Map that forgets the least recently used entries past a size. */
class Lru<K, V> {
  private readonly m = new Map<K, V>();
  constructor(private readonly max: number) {}
  get(k: K): V | undefined {
    const v = this.m.get(k);
    if (v !== undefined) {
      this.m.delete(k);
      this.m.set(k, v);
    }
    return v;
  }
  has(k: K): boolean {
    return this.m.has(k);
  }
  set(k: K, v: V): void {
    this.m.delete(k);
    this.m.set(k, v);
    if (this.m.size > this.max) this.m.delete(this.m.keys().next().value as K);
  }
  delete(k: K): void {
    this.m.delete(k);
  }
  deleteWhere(pred: (k: K) => boolean): void {
    for (const k of [...this.m.keys()]) if (pred(k)) this.m.delete(k);
  }
  clear(): void {
    this.m.clear();
  }
  get size(): number {
    return this.m.size;
  }
  values(): IterableIterator<V> {
    return this.m.values();
  }
}

/** Rough size of what's held, in bytes (strings count 2 bytes a character, like V8's worst case). */
function sizeOf(values: Iterable<unknown>): number {
  let n = 0;
  for (const v of values) n += v == null ? 8 : JSON.stringify(v).length * 2 + 64;
  return n;
}

export interface CacheStats {
  rooms: number;
  people: number;
  messages: number;
  bytes: number;
}

/** Worst case if every slot fills: rooms × messages, people, room summaries, knowledge searches. */
export const CACHE_CEILING_MB = 80;

/** Database writes in order, in the background. */
class Writer {
  private tail: Promise<void> = Promise.resolve();
  private pending = 0;

  push(write: () => Promise<unknown>): void {
    this.pending++;
    this.tail = this.tail
      .then(write)
      .catch((e) => console.error(`[mochi] database write failed: ${(e as Error).message}`))
      .then(() => {
        this.pending--;
      });
  }

  /** Resolves once everything queued so far is in the database. */
  async flush(): Promise<void> {
    while (this.pending) await this.tail;
  }
}

const k3 = (a: string, b: string, c: string) => `${a}\u0000${b}\u0000${c}`;
const today = () => new Date().toISOString().slice(0, 10);

interface RoomHistory {
  msgs: StoredMessage[];
  /** True when msgs holds every message the room has. */
  complete: boolean;
}

export class CachedMemoryStore extends MemoryStore {
  private readonly writer = new Writer();
  private readonly history = new Lru<string, RoomHistory>(MAX_ROOMS);
  /** null = known not to exist. */
  private readonly people = new Lru<string, Person | null>(MAX_PEOPLE);
  private readonly rooms = new Lru<string, Room | null>(MAX_ROOMS * 2);
  /** "day\0botId" (or "day\0*") → tokens. */
  private readonly tokens = new Map<string, number>();

  static async openCached(db: Db): Promise<CachedMemoryStore> {
    await MemoryStore.prepare(db);
    return new CachedMemoryStore(db);
  }

  /** Waits until every background write is in the database. */
  flush(): Promise<void> {
    return this.writer.flush();
  }

  stats(): CacheStats {
    let messages = 0;
    for (const h of this.history.values()) messages += h.msgs.length;
    return {
      rooms: this.history.size,
      people: this.people.size,
      messages,
      bytes: sizeOf(this.history.values()) + sizeOf(this.people.values()) + sizeOf(this.rooms.values()),
    };
  }

  // ── messages ──

  override async addMessage(m: Omit<StoredMessage, "id">): Promise<void> {
    const h = this.history.get(k3(m.botId, m.platform, m.roomId));
    if (h) {
      h.msgs.push({ ...m, id: 0 });
      if (h.msgs.length > ROOM_MESSAGES) h.msgs.splice(0, h.msgs.length - ROOM_MESSAGES);
    }
    this.writer.push(() => super.addMessage(m));
  }

  override async recentMessages(botId: string, platform: Platform, roomId: string, limit: number): Promise<StoredMessage[]> {
    const key = k3(botId, platform, roomId);
    let h = this.history.get(key);
    if (!h || (!h.complete && h.msgs.length < limit)) {
      await this.writer.flush();
      const want = Math.min(ROOM_MESSAGES, Math.max(limit, MIN_HISTORY_LOAD));
      const msgs = await super.recentMessages(botId, platform, roomId, want);
      h = { msgs, complete: msgs.length < want };
      this.history.set(key, h);
    }
    return h.msgs.slice(-limit).map((m) => ({ ...m }));
  }

  override async searchMessages(botId: string, platform: Platform, roomId: string, query: string, limit?: number): Promise<StoredMessage[]> {
    await this.writer.flush();
    return super.searchMessages(botId, platform, roomId, query, limit);
  }

  override async countMessages(botId: string, platform: Platform, roomId: string): Promise<number> {
    await this.writer.flush();
    return super.countMessages(botId, platform, roomId);
  }

  // ── people ──

  override async touchPerson(botId: string, platform: Platform, userId: string, displayName: string, ts: number): Promise<void> {
    const key = k3(botId, platform, userId);
    if (this.people.has(key)) {
      const p = this.people.get(key);
      this.people.set(
        key,
        p
          ? { ...p, displayName, messageCount: p.messageCount + 1, lastSeen: ts }
          : { botId, platform, userId, displayName, personality: "", facts: [], interests: [], messageCount: 1, firstSeen: ts, lastSeen: ts },
      );
    }
    this.writer.push(() => super.touchPerson(botId, platform, userId, displayName, ts));
  }

  override async getPerson(botId: string, platform: Platform, userId: string): Promise<Person | undefined> {
    const key = k3(botId, platform, userId);
    if (!this.people.has(key)) {
      await this.writer.flush();
      this.people.set(key, (await super.getPerson(botId, platform, userId)) ?? null);
    }
    const p = this.people.get(key);
    return p ? structuredClone(p) : undefined;
  }

  override async updatePersonProfile(
    botId: string,
    platform: Platform,
    userId: string,
    patch: { personality?: string; facts?: string[]; interests?: string[] },
  ): Promise<void> {
    const p = await this.getPerson(botId, platform, userId);
    if (!p) return;
    this.people.set(k3(botId, platform, userId), {
      ...p,
      personality: (patch.personality ?? p.personality).slice(0, 500),
      facts: (patch.facts ?? p.facts).slice(0, 15),
      interests: (patch.interests ?? p.interests).slice(0, 10),
    });
    this.writer.push(() => super.updatePersonProfile(botId, platform, userId, patch));
  }

  override async listPeople(botId: string, limit?: number): Promise<Person[]> {
    await this.writer.flush();
    return super.listPeople(botId, limit);
  }

  override async forgetPerson(botId: string, platform: Platform, userId: string): Promise<void> {
    this.people.delete(k3(botId, platform, userId));
    // Their lines are gone from every room's history.
    this.history.deleteWhere((k) => k.startsWith(`${botId}\u0000${platform}\u0000`));
    await this.writer.flush();
    await super.forgetPerson(botId, platform, userId);
  }

  // ── rooms ──

  override async bumpRoom(botId: string, platform: Platform, roomId: string, title: string | undefined): Promise<number> {
    const key = k3(botId, platform, roomId);
    const r = this.rooms.get(key);
    if (r) {
      r.msgsSinceUpdate += 1;
      if (title) r.title = title;
      this.writer.push(() => this.bumpRoomRow(botId, platform, roomId, title));
      return r.msgsSinceUpdate;
    }
    await this.writer.flush();
    const n = await super.bumpRoom(botId, platform, roomId, title);
    this.rooms.set(key, (await super.getRoom(botId, platform, roomId)) ?? null);
    return n;
  }

  override async getRoom(botId: string, platform: Platform, roomId: string): Promise<Room | undefined> {
    const key = k3(botId, platform, roomId);
    if (!this.rooms.has(key)) {
      await this.writer.flush();
      this.rooms.set(key, (await super.getRoom(botId, platform, roomId)) ?? null);
    }
    const r = this.rooms.get(key);
    return r ? structuredClone(r) : undefined;
  }

  override async updateRoomMemory(botId: string, platform: Platform, roomId: string, summary: string, topics: string[]): Promise<void> {
    const r = this.rooms.get(k3(botId, platform, roomId));
    if (r) Object.assign(r, { summary: summary.slice(0, 1500), recentTopics: topics.slice(0, 8), msgsSinceUpdate: 0, updatedAt: Date.now() });
    this.writer.push(() => super.updateRoomMemory(botId, platform, roomId, summary, topics));
  }

  override async resetRoomCounter(botId: string, platform: Platform, roomId: string): Promise<void> {
    const r = this.rooms.get(k3(botId, platform, roomId));
    if (r) r.msgsSinceUpdate = 0;
    this.writer.push(() => super.resetRoomCounter(botId, platform, roomId));
  }

  override async listRooms(botId: string, limit?: number): Promise<Room[]> {
    await this.writer.flush();
    return super.listRooms(botId, limit);
  }

  override async forgetRoom(botId: string, platform: Platform, roomId: string): Promise<void> {
    const key = k3(botId, platform, roomId);
    this.rooms.delete(key);
    this.history.delete(key);
    await this.writer.flush();
    await super.forgetRoom(botId, platform, roomId);
  }

  override async forgetBot(botId: string): Promise<void> {
    const mine = (k: string) => k.startsWith(botId + "\u0000");
    this.history.deleteWhere(mine);
    this.people.deleteWhere(mine);
    this.rooms.deleteWhere(mine);
    this.tokens.clear();
    await this.writer.flush();
    await super.forgetBot(botId);
  }

  // ── usage ──

  override async recordUsage(botId: string, feature: string, model: string, promptTokens: number, completionTokens: number): Promise<void> {
    const day = today();
    const n = promptTokens + completionTokens;
    for (const k of [`${day}\u0000${botId}`, `${day}\u0000*`]) {
      const cur = this.tokens.get(k);
      if (cur !== undefined) this.tokens.set(k, cur + n);
    }
    this.writer.push(() => super.recordUsage(botId, feature, model, promptTokens, completionTokens));
  }

  override async tokensToday(botId?: string): Promise<number> {
    const k = `${today()}\u0000${botId ?? "*"}`;
    const cur = this.tokens.get(k);
    if (cur !== undefined) return cur;
    await this.writer.flush();
    const n = await super.tokensToday(botId);
    if (this.tokens.size > 1000) this.tokens.clear(); // yesterday's keys
    this.tokens.set(k, n);
    return n;
  }

  override async usageSince(dayInclusive: string, botId?: string) {
    await this.writer.flush();
    return super.usageSince(dayInclusive, botId);
  }

  override async usageByDay(sinceDay: string, botId?: string) {
    await this.writer.flush();
    return super.usageByDay(sinceDay, botId);
  }

  override async counts(botId: string) {
    await this.writer.flush();
    return super.counts(botId);
  }

  override async close(): Promise<void> {
    await this.writer.flush();
    return super.close();
  }
}

interface BotKnowledge {
  count?: number;
  titles?: Map<number, string[]>;
  docs: Map<number, KnowledgeDoc | null>;
}

export class CachedKnowledgeStore extends KnowledgeStore {
  private readonly bots = new Map<string, BotKnowledge>();
  private readonly searches = new Lru<string, KnowledgeHit[]>(MAX_SEARCHES);

  static async openCached(db: Db): Promise<CachedKnowledgeStore> {
    await KnowledgeStore.prepare(db);
    return new CachedKnowledgeStore(db);
  }

  stats(): { searches: number; bytes: number } {
    let bytes = sizeOf(this.searches.values());
    for (const b of this.bots.values()) bytes += sizeOf(b.docs.values()) + sizeOf(b.titles?.values() ?? []);
    return { searches: this.searches.size, bytes };
  }

  private bot(botId: string): BotKnowledge {
    let b = this.bots.get(botId);
    if (!b) this.bots.set(botId, (b = { docs: new Map() }));
    return b;
  }

  private changed(botId: string): void {
    this.bots.delete(botId);
    this.searches.deleteWhere((k) => k.startsWith(botId + "\u0000"));
  }

  override async addDocument(botId: string, title: string, source: KnowledgeDoc["source"], sourceRef: string, text: string): Promise<KnowledgeDoc> {
    try {
      return await super.addDocument(botId, title, source, sourceRef, text);
    } finally {
      this.changed(botId);
    }
  }

  override async deleteDoc(botId: string, id: number): Promise<void> {
    await super.deleteDoc(botId, id);
    this.changed(botId);
  }

  override async deleteBot(botId: string): Promise<void> {
    await super.deleteBot(botId);
    this.changed(botId);
  }

  override async count(botId: string): Promise<number> {
    const b = this.bot(botId);
    return (b.count ??= await super.count(botId));
  }

  override async getDoc(botId: string, id: number): Promise<KnowledgeDoc | undefined> {
    const b = this.bot(botId);
    if (!b.docs.has(id)) b.docs.set(id, (await super.getDoc(botId, id)) ?? null);
    const d = b.docs.get(id);
    return d ? { ...d } : undefined;
  }

  override async titles(botId: string, limit = 12): Promise<string[]> {
    const b = this.bot(botId);
    b.titles ??= new Map();
    let t = b.titles.get(limit);
    if (!t) b.titles.set(limit, (t = await super.titles(botId, limit)));
    return [...t];
  }

  override async search(botId: string, query: string, limit = 4): Promise<KnowledgeHit[]> {
    const key = `${botId}\u0000${limit}\u0000${query.trim().toLowerCase()}`;
    let hits = this.searches.get(key);
    if (!hits) this.searches.set(key, (hits = await super.search(botId, query, limit)));
    return hits.map((h) => ({ ...h }));
  }
}

export function cacheEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return !/^(off|0|false|no)$/i.test((env.STORAGE_CACHE ?? "").trim());
}
