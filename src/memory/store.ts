import type { Db } from "../db/index.ts";
import { ddl } from "../db/index.ts";
import type { Platform } from "../core/types.ts";

export interface StoredMessage {
  id: number;
  botId: string;
  platform: Platform;
  roomId: string;
  userId: string;
  userName: string;
  text: string;
  hasImage: boolean;
  isBot: boolean;
  ts: number;
}

export interface Person {
  botId: string;
  platform: Platform;
  userId: string;
  displayName: string;
  personality: string;
  facts: string[];
  interests: string[];
  messageCount: number;
  firstSeen: number;
  lastSeen: number;
}

export interface Room {
  botId: string;
  platform: Platform;
  roomId: string;
  title: string;
  summary: string;
  recentTopics: string[];
  msgsSinceUpdate: number;
  updatedAt: number;
}

export interface UsageRow {
  botId: string;
  feature: string;
  model: string;
  calls: number;
  promptTokens: number;
  completionTokens: number;
}

const MAX_MESSAGES_PER_ROOM = 300;

/** Columns a backup file carries (bot_id is left out: a backup can go into any bot). */
export const DUMP_COLS = {
  people: ["platform", "user_id", "display_name", "personality", "facts", "interests", "message_count", "first_seen", "last_seen"],
  rooms: ["platform", "room_id", "title", "summary", "recent_topics", "msgs_since_update", "updated_at"],
  messages: ["platform", "room_id", "user_id", "user_name", "text", "has_image", "is_bot", "ts"],
} as const;

export interface MemoryDump {
  people: Record<string, unknown>[];
  rooms: Record<string, unknown>[];
  messages: Record<string, unknown>[];
}

export const MEMORY_SCHEMA = `
  CREATE TABLE IF NOT EXISTS messages (
    id {id}, bot_id TEXT NOT NULL,
    platform TEXT NOT NULL, room_id TEXT NOT NULL,
    user_id TEXT NOT NULL, user_name TEXT NOT NULL,
    text TEXT NOT NULL, has_image INTEGER NOT NULL DEFAULT 0,
    is_bot INTEGER NOT NULL DEFAULT 0, ts {bigint} NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(bot_id, platform, room_id, id);
  CREATE TABLE IF NOT EXISTS people (
    bot_id TEXT NOT NULL, platform TEXT NOT NULL, user_id TEXT NOT NULL,
    display_name TEXT NOT NULL, personality TEXT NOT NULL DEFAULT '',
    facts TEXT NOT NULL DEFAULT '[]', interests TEXT NOT NULL DEFAULT '[]',
    message_count INTEGER NOT NULL DEFAULT 0,
    first_seen {bigint} NOT NULL, last_seen {bigint} NOT NULL,
    PRIMARY KEY (bot_id, platform, user_id)
  );
  CREATE TABLE IF NOT EXISTS rooms (
    bot_id TEXT NOT NULL, platform TEXT NOT NULL, room_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '', summary TEXT NOT NULL DEFAULT '',
    recent_topics TEXT NOT NULL DEFAULT '[]',
    msgs_since_update INTEGER NOT NULL DEFAULT 0,
    updated_at {bigint} NOT NULL DEFAULT 0,
    PRIMARY KEY (bot_id, platform, room_id)
  );
  CREATE TABLE IF NOT EXISTS usage (
    id {id}, bot_id TEXT NOT NULL,
    day TEXT NOT NULL, ts {bigint} NOT NULL,
    feature TEXT NOT NULL, model TEXT NOT NULL,
    prompt_tokens INTEGER NOT NULL, completion_tokens INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_usage_day ON usage(bot_id, day);
`;

/**
 * Every bot's memory, in Mochi's database (SQLite file or PostgreSQL, see src/db).
 * All rows are scoped by bot_id: each bot remembers people and rooms on its own.
 * - messages: short-term chat history per room
 * - people:   long-term profile per person (personality, facts, interests)
 * - rooms:    rolling summary + recent topics per chat room
 * - usage:    token usage per bot/feature/model, for the dashboard and budgets
 * (Knowledge base tables live in knowledge/store.ts on the same database.)
 */
export class MemoryStore {
  protected constructor(readonly db: Db) {}

  static async open(db: Db): Promise<MemoryStore> {
    await MemoryStore.prepare(db);
    return new MemoryStore(db);
  }

  /** Creates or upgrades the tables. */
  static async prepare(db: Db): Promise<void> {
    if (db.dialect === "sqlite") await new MemoryStore(db).migrateV1();
    await db.exec(ddl(db.dialect, MEMORY_SCHEMA));
  }

  /** v0.1 (SQLite only) had no bot_id. Rebuild those tables, assigning existing rows to bot "mochi". */
  private async migrateV1(): Promise<void> {
    const cols = await this.db.all(`PRAGMA table_info(people)`);
    if (!cols.length || cols.some((c: any) => c.name === "bot_id")) return;
    await this.db.exec(`
      BEGIN;
      ALTER TABLE messages RENAME TO messages_v1;
      ALTER TABLE people RENAME TO people_v1;
      ALTER TABLE rooms RENAME TO rooms_v1;
      ALTER TABLE usage RENAME TO usage_v1;
      DROP INDEX IF EXISTS idx_messages_room;
      DROP INDEX IF EXISTS idx_usage_day;
      COMMIT;
    `);
    await this.db.exec(ddl("sqlite", MEMORY_SCHEMA));
    await this.db.exec(`
      INSERT INTO messages (bot_id, platform, room_id, user_id, user_name, text, has_image, is_bot, ts) SELECT 'mochi', platform, room_id, user_id, user_name, text, has_image, is_bot, ts FROM messages_v1 ORDER BY id;
      INSERT INTO people SELECT 'mochi', platform, user_id, display_name, personality, facts, interests, message_count, first_seen, last_seen FROM people_v1;
      INSERT INTO rooms SELECT 'mochi', platform, room_id, title, summary, recent_topics, msgs_since_update, updated_at FROM rooms_v1;
      INSERT INTO usage (bot_id, day, ts, feature, model, prompt_tokens, completion_tokens) SELECT 'mochi', day, ts, feature, model, prompt_tokens, completion_tokens FROM usage_v1;
      DROP TABLE messages_v1; DROP TABLE people_v1; DROP TABLE rooms_v1; DROP TABLE usage_v1;
    `);
    console.log("[mochi] migrated memory database to multi-bot schema");
  }

  // ── messages ────────────────────────────────────────────────────

  async addMessage(m: Omit<StoredMessage, "id">): Promise<void> {
    await this.db.run(
      `INSERT INTO messages (bot_id, platform, room_id, user_id, user_name, text, has_image, is_bot, ts)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [m.botId, m.platform, m.roomId, m.userId, m.userName, m.text, m.hasImage ? 1 : 0, m.isBot ? 1 : 0, m.ts],
    );
    await this.db.run(
      `DELETE FROM messages WHERE bot_id = ? AND platform = ? AND room_id = ? AND id NOT IN (
         SELECT id FROM messages WHERE bot_id = ? AND platform = ? AND room_id = ? ORDER BY id DESC LIMIT ?)`,
      [m.botId, m.platform, m.roomId, m.botId, m.platform, m.roomId, MAX_MESSAGES_PER_ROOM],
    );
  }

  async recentMessages(botId: string, platform: Platform, roomId: string, limit: number): Promise<StoredMessage[]> {
    const rows = await this.db.all(
      `SELECT * FROM messages WHERE bot_id = ? AND platform = ? AND room_id = ? ORDER BY id DESC LIMIT ?`,
      [botId, platform, roomId, limit],
    );
    return rows.reverse().map(rowToMessage);
  }

  /**
   * Look further back than the window that fits in the prompt: "what were we talking about
   * before?" needs the older lines of *this* room, not a wider dump of every room.
   */
  async searchMessages(botId: string, platform: Platform, roomId: string, query: string, limit = 12): Promise<StoredMessage[]> {
    const terms = String(query ?? "")
      .toLowerCase()
      .split(/[\s,，。!?！？、;；:：]+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2)
      .slice(0, 6);
    let rows: any[];
    if (terms.length) {
      const where = terms.map(() => "lower(text) LIKE ?").join(" OR ");
      rows = await this.db.all(
        `SELECT * FROM messages WHERE bot_id = ? AND platform = ? AND room_id = ? AND (${where}) ORDER BY id DESC LIMIT ?`,
        [botId, platform, roomId, ...terms.map((t) => `%${t}%`), limit],
      );
    } else {
      rows = await this.db.all(
        `SELECT * FROM messages WHERE bot_id = ? AND platform = ? AND room_id = ? ORDER BY id DESC LIMIT ?`,
        [botId, platform, roomId, limit],
      );
    }
    return rows.reverse().map(rowToMessage);
  }

  /** How many messages this room has stored (to tell the model what it is missing). */
  async countMessages(botId: string, platform: Platform, roomId: string): Promise<number> {
    const r = await this.db.get(`SELECT COUNT(*) AS n FROM messages WHERE bot_id = ? AND platform = ? AND room_id = ?`, [
      botId,
      platform,
      roomId,
    ]);
    return Number(r?.n ?? 0);
  }

  // ── people ──────────────────────────────────────────────────────

  async touchPerson(botId: string, platform: Platform, userId: string, displayName: string, ts: number): Promise<void> {
    await this.db.run(
      `INSERT INTO people (bot_id, platform, user_id, display_name, message_count, first_seen, last_seen)
       VALUES (?, ?, ?, ?, 1, ?, ?)
       ON CONFLICT(bot_id, platform, user_id) DO UPDATE SET
         display_name = excluded.display_name,
         message_count = people.message_count + 1,
         last_seen = excluded.last_seen`,
      [botId, platform, userId, displayName, ts, ts],
    );
  }

  getPerson(botId: string, platform: Platform, userId: string): Promise<Person | undefined> {
    return this.fetchPerson(botId, platform, userId);
  }

  private async fetchPerson(botId: string, platform: Platform, userId: string): Promise<Person | undefined> {
    const r = await this.db.get(`SELECT * FROM people WHERE bot_id = ? AND platform = ? AND user_id = ?`, [botId, platform, userId]);
    return r ? rowToPerson(r) : undefined;
  }

  async getPeople(botId: string, platform: Platform, userIds: string[]): Promise<Person[]> {
    const out = await Promise.all(userIds.map((id) => this.getPerson(botId, platform, id)));
    return out.filter((p): p is Person => Boolean(p));
  }

  async updatePersonProfile(
    botId: string,
    platform: Platform,
    userId: string,
    patch: { personality?: string; facts?: string[]; interests?: string[] },
  ): Promise<void> {
    const p = await this.fetchPerson(botId, platform, userId);
    if (!p) return;
    await this.db.run(`UPDATE people SET personality = ?, facts = ?, interests = ? WHERE bot_id = ? AND platform = ? AND user_id = ?`, [
      (patch.personality ?? p.personality).slice(0, 500),
      JSON.stringify((patch.facts ?? p.facts).slice(0, 15)),
      JSON.stringify((patch.interests ?? p.interests).slice(0, 10)),
      botId,
      platform,
      userId,
    ]);
  }

  async listPeople(botId: string, limit = 200): Promise<Person[]> {
    return (await this.db.all(`SELECT * FROM people WHERE bot_id = ? ORDER BY last_seen DESC LIMIT ?`, [botId, limit])).map(rowToPerson);
  }

  async forgetPerson(botId: string, platform: Platform, userId: string): Promise<void> {
    await this.db.run(`DELETE FROM people WHERE bot_id = ? AND platform = ? AND user_id = ?`, [botId, platform, userId]);
    await this.db.run(`DELETE FROM messages WHERE bot_id = ? AND platform = ? AND user_id = ?`, [botId, platform, userId]);
  }

  // ── rooms ───────────────────────────────────────────────────────

  async bumpRoom(botId: string, platform: Platform, roomId: string, title: string | undefined): Promise<number> {
    await this.bumpRoomRow(botId, platform, roomId, title);
    return (await this.fetchRoom(botId, platform, roomId))?.msgsSinceUpdate ?? 0;
  }

  /** The write half of bumpRoom. */
  protected async bumpRoomRow(botId: string, platform: Platform, roomId: string, title: string | undefined): Promise<void> {
    await this.db.run(
      `INSERT INTO rooms (bot_id, platform, room_id, title, msgs_since_update) VALUES (?, ?, ?, ?, 1)
       ON CONFLICT(bot_id, platform, room_id) DO UPDATE SET
         msgs_since_update = rooms.msgs_since_update + 1,
         title = CASE WHEN excluded.title != '' THEN excluded.title ELSE rooms.title END`,
      [botId, platform, roomId, title ?? ""],
    );
  }

  getRoom(botId: string, platform: Platform, roomId: string): Promise<Room | undefined> {
    return this.fetchRoom(botId, platform, roomId);
  }

  /** Straight from the database (a cache in front never sees these internal reads). */
  private async fetchRoom(botId: string, platform: Platform, roomId: string): Promise<Room | undefined> {
    const r = await this.db.get(`SELECT * FROM rooms WHERE bot_id = ? AND platform = ? AND room_id = ?`, [botId, platform, roomId]);
    return r ? rowToRoom(r) : undefined;
  }

  async updateRoomMemory(botId: string, platform: Platform, roomId: string, summary: string, topics: string[]): Promise<void> {
    await this.db.run(
      `UPDATE rooms SET summary = ?, recent_topics = ?, msgs_since_update = 0, updated_at = ?
       WHERE bot_id = ? AND platform = ? AND room_id = ?`,
      [summary.slice(0, 1500), JSON.stringify(topics.slice(0, 8)), Date.now(), botId, platform, roomId],
    );
  }

  async resetRoomCounter(botId: string, platform: Platform, roomId: string): Promise<void> {
    await this.db.run(`UPDATE rooms SET msgs_since_update = 0 WHERE bot_id = ? AND platform = ? AND room_id = ?`, [botId, platform, roomId]);
  }

  async listRooms(botId: string, limit = 200): Promise<Room[]> {
    return (await this.db.all(`SELECT * FROM rooms WHERE bot_id = ? ORDER BY updated_at DESC LIMIT ?`, [botId, limit])).map(rowToRoom);
  }

  async forgetRoom(botId: string, platform: Platform, roomId: string): Promise<void> {
    await this.db.run(`DELETE FROM rooms WHERE bot_id = ? AND platform = ? AND room_id = ?`, [botId, platform, roomId]);
    await this.db.run(`DELETE FROM messages WHERE bot_id = ? AND platform = ? AND room_id = ?`, [botId, platform, roomId]);
  }

  // ── backup ──────────────────────────────────────────────────────

  /** Everything this bot remembers, for a backup file. */
  async exportBot(botId: string): Promise<MemoryDump> {
    const pick = (rows: any[], cols: readonly string[]) => rows.map((r) => Object.fromEntries(cols.map((c) => [c, r[c]])));
    return {
      people: pick(await this.db.all(`SELECT * FROM people WHERE bot_id = ? ORDER BY last_seen`, [botId]), DUMP_COLS.people),
      rooms: pick(await this.db.all(`SELECT * FROM rooms WHERE bot_id = ? ORDER BY updated_at`, [botId]), DUMP_COLS.rooms),
      messages: pick(await this.db.all(`SELECT * FROM messages WHERE bot_id = ? ORDER BY id`, [botId]), DUMP_COLS.messages),
    };
  }

  /** Replaces what this bot remembers with a backup's. Rows are checked and trimmed on the way in. */
  async importBot(botId: string, dump: MemoryDump): Promise<{ people: number; rooms: number; messages: number }> {
    const rows = (t: keyof MemoryDump) => (Array.isArray(dump?.[t]) ? dump[t] : []).filter((r) => r && typeof r === "object");
    const str = (v: unknown, max: number) => String(v ?? "").slice(0, max);
    const int = (v: unknown) => (Number.isFinite(Number(v)) ? Math.trunc(Number(v)) : 0);
    const list = (v: unknown, max: number) => {
      try {
        const a = typeof v === "string" ? JSON.parse(v) : v;
        return JSON.stringify((Array.isArray(a) ? a : []).map((x) => String(x).slice(0, 300)).slice(0, max));
      } catch {
        return "[]";
      }
    };
    const people = rows("people").slice(0, 50_000);
    const rooms = rows("rooms").slice(0, 50_000);
    const messages = rows("messages").slice(-200_000);
    await this.db.tx(async (tx) => {
      for (const t of ["messages", "people", "rooms"]) await tx.run(`DELETE FROM ${t} WHERE bot_id = ?`, [botId]);
      for (const p of people)
        await tx.run(
          `INSERT INTO people (bot_id, platform, user_id, display_name, personality, facts, interests, message_count, first_seen, last_seen)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(bot_id, platform, user_id) DO NOTHING`,
          [botId, str(p.platform, 20), str(p.user_id, 200), str(p.display_name, 200), str(p.personality, 500), list(p.facts, 15), list(p.interests, 10), int(p.message_count), int(p.first_seen), int(p.last_seen)],
        );
      for (const r of rooms)
        await tx.run(
          `INSERT INTO rooms (bot_id, platform, room_id, title, summary, recent_topics, msgs_since_update, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(bot_id, platform, room_id) DO NOTHING`,
          [botId, str(r.platform, 20), str(r.room_id, 200), str(r.title, 200), str(r.summary, 1500), list(r.recent_topics, 8), int(r.msgs_since_update), int(r.updated_at)],
        );
      for (const m of messages)
        await tx.run(
          `INSERT INTO messages (bot_id, platform, room_id, user_id, user_name, text, has_image, is_bot, ts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [botId, str(m.platform, 20), str(m.room_id, 200), str(m.user_id, 200), str(m.user_name, 200), str(m.text, 8000), m.has_image ? 1 : 0, m.is_bot ? 1 : 0, int(m.ts)],
        );
    });
    return { people: people.length, rooms: rooms.length, messages: messages.length };
  }

  /** Remove everything a deleted bot remembered. */
  async forgetBot(botId: string): Promise<void> {
    for (const t of ["messages", "people", "rooms", "usage"]) await this.db.run(`DELETE FROM ${t} WHERE bot_id = ?`, [botId]);
  }

  // ── usage ───────────────────────────────────────────────────────

  async recordUsage(botId: string, feature: string, model: string, promptTokens: number, completionTokens: number): Promise<void> {
    const now = new Date();
    await this.db.run(
      `INSERT INTO usage (bot_id, day, ts, feature, model, prompt_tokens, completion_tokens) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [botId, now.toISOString().slice(0, 10), now.getTime(), feature, model, promptTokens, completionTokens],
    );
  }

  async tokensToday(botId?: string): Promise<number> {
    const day = new Date().toISOString().slice(0, 10);
    const r = botId
      ? await this.db.get(`SELECT COALESCE(SUM(prompt_tokens + completion_tokens), 0) AS t FROM usage WHERE day = ? AND bot_id = ?`, [day, botId])
      : await this.db.get(`SELECT COALESCE(SUM(prompt_tokens + completion_tokens), 0) AS t FROM usage WHERE day = ?`, [day]);
    return Number(r?.t ?? 0);
  }

  /** Usage since a day, optionally for one bot. */
  async usageSince(dayInclusive: string, botId?: string): Promise<UsageRow[]> {
    const where = botId ? "day >= ? AND bot_id = ?" : "day >= ?";
    const args = botId ? [dayInclusive, botId] : [dayInclusive];
    const rows = await this.db.all(
      `SELECT bot_id, feature, model, COUNT(*) AS calls, SUM(prompt_tokens) AS p, SUM(completion_tokens) AS c
       FROM usage WHERE ${where} GROUP BY bot_id, feature, model
       ORDER BY SUM(prompt_tokens) + SUM(completion_tokens) DESC`,
      args,
    );
    return rows.map((r) => ({
      botId: r.bot_id,
      feature: r.feature,
      model: r.model,
      calls: Number(r.calls),
      promptTokens: Number(r.p),
      completionTokens: Number(r.c),
    }));
  }

  async usageByDay(sinceDay: string, botId?: string): Promise<{ day: string; tokens: number }[]> {
    const where = botId ? "day >= ? AND bot_id = ?" : "day >= ?";
    const args = botId ? [sinceDay, botId] : [sinceDay];
    const rows = await this.db.all(`SELECT day, SUM(prompt_tokens + completion_tokens) AS t FROM usage WHERE ${where} GROUP BY day ORDER BY day`, args);
    return rows.map((r) => ({ day: r.day, tokens: Number(r.t) }));
  }

  async counts(botId: string): Promise<{ people: number; rooms: number }> {
    const p = await this.db.get(`SELECT COUNT(*) AS n FROM people WHERE bot_id = ?`, [botId]);
    const r = await this.db.get(`SELECT COUNT(*) AS n FROM rooms WHERE bot_id = ?`, [botId]);
    return { people: Number(p?.n ?? 0), rooms: Number(r?.n ?? 0) };
  }

  close(): Promise<void> {
    return this.db.close();
  }
}

const parseList = (s: string): string[] => {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
};

function rowToMessage(r: any): StoredMessage {
  return {
    id: Number(r.id),
    botId: r.bot_id,
    platform: r.platform,
    roomId: r.room_id,
    userId: r.user_id,
    userName: r.user_name,
    text: r.text,
    hasImage: Boolean(r.has_image),
    isBot: Boolean(r.is_bot),
    ts: Number(r.ts),
  };
}

function rowToPerson(r: any): Person {
  return {
    botId: r.bot_id,
    platform: r.platform,
    userId: r.user_id,
    displayName: r.display_name,
    personality: r.personality,
    facts: parseList(r.facts),
    interests: parseList(r.interests),
    messageCount: Number(r.message_count),
    firstSeen: Number(r.first_seen),
    lastSeen: Number(r.last_seen),
  };
}

function rowToRoom(r: any): Room {
  return {
    botId: r.bot_id,
    platform: r.platform,
    roomId: r.room_id,
    title: r.title,
    summary: r.summary,
    recentTopics: parseList(r.recent_topics),
    msgsSinceUpdate: Number(r.msgs_since_update),
    updatedAt: Number(r.updated_at),
  };
}
