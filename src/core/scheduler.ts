/**
 * Scheduled messages: one-time ("remind me at 10am") and repeating (cron) messages a bot sends by itself.
 *
 * Every channel shares this: a task remembers the room it belongs to (platform + room id), and when it is due
 * the channel manager sends it through that platform's adapter, the same way any other proactive message goes.
 * Tasks are created from the dashboard, or by chatting with the bot by people the owner allowed
 * (bot.schedule.allowed). Times are read in the bot's time zone (bot.schedule.timezone).
 *
 * Stored as one JSON document ("schedules"), next to the bot list, so it moves with backups and database copies.
 */
import crypto from "node:crypto";
import { CronExpressionParser } from "cron-parser";
import type { BotRegistry, BotSettings } from "./bots.ts";
import type { IncomingMessage } from "./types.ts";
import type { Platform } from "./types.ts";
import type { DocStore } from "../db/docs.ts";
import type { FlatkeyClient } from "../flatkey/client.ts";
import { buildPersonaPrompt } from "./persona.ts";

export interface ScheduledTask {
  id: string;
  botId: string;
  /** Where it is sent. */
  platform: Platform;
  roomId: string;
  roomName?: string;
  isDirect: boolean;
  /** The person a private chat is with (some platforms address people, not rooms). */
  userId?: string;
  /** Repeating: 5-field cron in the bot's time zone. */
  cron?: string;
  /** One-time: when, epoch ms. */
  at?: number;
  /** What to say. With compose on, an instruction the bot writes a fresh message from each time. */
  text: string;
  compose: boolean;
  /** Who it is for, when someone asked for themselves ("Boyuan"). */
  forName?: string;
  /** "dashboard" or "<platform>:<userId> (<name>)". */
  createdBy: string;
  enabled: boolean;
  nextRun: number | null;
  lastRun?: number;
  lastError?: string;
  createdAt: number;
}

export type TaskInput = Partial<Omit<ScheduledTask, "id" | "botId" | "nextRun" | "createdAt">>;

/** Sends a message to a room; provided by the channel manager. */
export type RoomSender = (botId: string, t: Pick<ScheduledTask, "platform" | "roomId" | "isDirect" | "userId">, text: string) => Promise<void>;

/** A message that arrives later than this after its time is skipped, so a restart doesn't flood a chat with old reminders. */
const LATE_LIMIT_MS = 60 * 60_000;
const MAX_TASKS_PER_BOT = 200;
const TICK_MS = 20_000;

/** Messages that might be about schedules: worth one small model call to read them properly. */
export const SCHEDULE_HINT =
  /remind|reminder|schedul|alarm|wake me|every (?:day|morning|evening|night|week|weekday|monday|tuesday|wednesday|thursday|friday|saturday|sunday|hour)|daily|weekly|\b(?:at|by) \d{1,2}(?::\d\d)? ?(?:am|pm)?\b|in \d+ ?(?:min|minute|hour)|cancel|提醒|叫我|闹钟|鬧鐘|定时|定時|每天|每日|每周|每週|每晚|每早|点钟|點鐘|\d+点|取消|リマインド|アラーム|毎日|毎朝|毎晩|毎週|時に|分後|起こして|キャンセル|lembr|lembrete|alarme|todo dia|todos os dias|toda (?:manhã|noite|semana)|às \d|cancela/i;

export class Scheduler {
  private tasks: ScheduledTask[] = [];
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private saving: Promise<void> = Promise.resolve();

  constructor(
    private readonly d: {
      docs: DocStore;
      bots: BotRegistry;
      flatkey: FlatkeyClient;
      send: RoomSender;
      /** Records what the bot sent, so replies to it have context. */
      remember?: (task: ScheduledTask, text: string) => Promise<void>;
      now?: () => number;
    },
  ) {}

  private now(): number {
    return (this.d.now ?? Date.now)();
  }

  async load(): Promise<void> {
    const raw = await this.d.docs.get("schedules");
    try {
      const parsed = raw ? JSON.parse(raw) : [];
      this.tasks = Array.isArray(parsed) ? parsed.filter((t) => t && typeof t.id === "string") : [];
    } catch {
      console.error("[schedule] schedules document is not valid JSON; starting with none");
      this.tasks = [];
    }
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => void this.tick(), TICK_MS);
    this.timer.unref?.();
    void this.tick();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private save(): Promise<void> {
    const json = JSON.stringify(this.tasks, null, 1);
    this.saving = this.saving.then(() => this.d.docs.set("schedules", json)).catch((e) => console.error("[schedule] save failed:", e?.message ?? e));
    return this.saving;
  }

  list(botId: string): ScheduledTask[] {
    return this.tasks.filter((t) => t.botId === botId).sort((a, b) => (a.nextRun ?? Infinity) - (b.nextRun ?? Infinity));
  }

  get(botId: string, id: string): ScheduledTask | undefined {
    return this.tasks.find((t) => t.botId === botId && t.id === id);
  }

  /** Throws a readable error for anything that can't be scheduled. */
  async add(botId: string, input: TaskInput): Promise<ScheduledTask> {
    const bot = this.d.bots.get(botId);
    if (!bot) throw new Error("bot not found");
    if (this.list(botId).length >= MAX_TASKS_PER_BOT) throw new Error(`A bot can have at most ${MAX_TASKS_PER_BOT} scheduled messages.`);
    const t: ScheduledTask = {
      id: crypto.randomUUID().slice(0, 8),
      botId,
      platform: input.platform as Platform,
      roomId: String(input.roomId ?? ""),
      roomName: input.roomName ? String(input.roomName).slice(0, 120) : undefined,
      isDirect: Boolean(input.isDirect),
      userId: input.userId ? String(input.userId) : undefined,
      cron: input.cron ? String(input.cron).trim() : undefined,
      at: input.at ? Number(input.at) : undefined,
      text: String(input.text ?? "").trim().slice(0, 1000),
      compose: input.compose !== false,
      forName: input.forName ? String(input.forName).slice(0, 80) : undefined,
      createdBy: String(input.createdBy ?? "dashboard").slice(0, 200),
      enabled: input.enabled !== false,
      nextRun: null,
      createdAt: this.now(),
    };
    this.validate(bot, t);
    t.nextRun = this.nextAfter(bot, t, this.now());
    if (t.nextRun === null) throw new Error("That time has already passed.");
    this.tasks.push(t);
    await this.save();
    return t;
  }

  async update(botId: string, id: string, patch: TaskInput): Promise<ScheduledTask> {
    const t = this.get(botId, id);
    const bot = this.d.bots.get(botId);
    if (!t || !bot) throw new Error("scheduled message not found");
    const next: ScheduledTask = { ...t };
    for (const k of ["text", "compose", "enabled", "cron", "at", "roomName", "forName"] as const) {
      if (k in patch) (next as any)[k] = (patch as any)[k];
    }
    if ("cron" in patch && patch.cron) next.at = undefined;
    if ("at" in patch && patch.at) next.cron = undefined;
    next.text = String(next.text ?? "").trim().slice(0, 1000);
    this.validate(bot, next);
    next.nextRun = next.enabled ? this.nextAfter(bot, next, this.now()) : t.nextRun;
    if (next.enabled && next.nextRun === null) throw new Error("That time has already passed.");
    next.lastError = undefined;
    Object.assign(t, next);
    await this.save();
    return t;
  }

  async remove(botId: string, id: string): Promise<boolean> {
    const n = this.tasks.length;
    this.tasks = this.tasks.filter((t) => !(t.botId === botId && t.id === id));
    if (this.tasks.length === n) return false;
    await this.save();
    return true;
  }

  /** The bot's time zone changed: repeating messages move to the new local times. */
  async reschedule(botId: string): Promise<void> {
    const bot = this.d.bots.get(botId);
    if (!bot) return;
    let changed = false;
    for (const t of this.tasks.filter((x) => x.botId === botId && x.cron && x.enabled)) {
      const next = this.nextAfter(bot, t, this.now());
      if (next !== t.nextRun) (t.nextRun = next), (changed = true);
    }
    if (changed) await this.save();
  }

  /** A bot was deleted: its schedules go too. */
  async removeBot(botId: string): Promise<void> {
    this.tasks = this.tasks.filter((t) => t.botId !== botId);
    await this.save();
  }

  private validate(bot: BotSettings, t: ScheduledTask): void {
    if (!t.platform || !t.roomId) throw new Error("Pick a chat to send it to.");
    if (t.platform === ("web" as Platform)) throw new Error("Website visitors can't be sent messages later; pick a chat app.");
    if (!t.text) throw new Error("Write what to send.");
    if (!t.cron && !t.at) throw new Error("Pick when to send it.");
    if (t.cron) {
      if (t.cron.split(/\s+/).length !== 5) throw new Error("Use a 5-field cron time, like 0 10 * * * for every day at 10:00.");
      try {
        CronExpressionParser.parse(t.cron, { tz: bot.schedule.timezone });
      } catch {
        throw new Error(`"${t.cron}" isn't a valid cron time.`);
      }
      if (this.everyMinuteOrSo(bot, t.cron)) throw new Error("Repeating messages can be at most one every 10 minutes.");
    }
    if (t.at && !Number.isFinite(t.at)) throw new Error("That time isn't valid.");
  }

  /** Two consecutive runs less than 10 minutes apart. */
  private everyMinuteOrSo(bot: BotSettings, cron: string): boolean {
    const it = CronExpressionParser.parse(cron, { tz: bot.schedule.timezone, currentDate: new Date(this.now()) });
    const a = it.next().getTime();
    const b = it.next().getTime();
    return b - a < 10 * 60_000;
  }

  /** The next time a task runs after `from`, or null when it won't run again. */
  nextAfter(bot: BotSettings, t: Pick<ScheduledTask, "cron" | "at">, from: number): number | null {
    if (t.cron) {
      return CronExpressionParser.parse(t.cron, { tz: bot.schedule.timezone, currentDate: new Date(from) }).next().getTime();
    }
    return t.at && t.at > from ? t.at : null;
  }

  /** Runs what's due. Public for tests. */
  async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const now = this.now();
      let changed = false;
      for (const t of this.tasks.filter((x) => x.enabled && x.nextRun !== null && x.nextRun <= now)) {
        const bot = this.d.bots.get(t.botId);
        if (!bot) continue;
        changed = true;
        const late = now - (t.nextRun as number) > LATE_LIMIT_MS;
        if (late) console.log(`[schedule:${t.botId}] skipped ${t.id}: it was due ${Math.round((now - (t.nextRun as number)) / 60_000)} min ago (server was down?)`);
        else await this.fire(bot, t).catch(() => {});
        t.nextRun = t.cron ? this.nextAfter(bot, t, now) : null;
        if (!t.cron) t.enabled = false;
      }
      // One-time messages that are done are kept a day so the dashboard shows they went out.
      const before = this.tasks.length;
      this.tasks = this.tasks.filter((x) => x.cron || x.enabled || (x.lastRun ?? x.createdAt) > now - 24 * 3600_000);
      if (changed || before !== this.tasks.length) await this.save();
    } finally {
      this.running = false;
    }
  }

  /** Send one task now (also the dashboard's "Send now"). */
  async fire(bot: BotSettings, t: ScheduledTask): Promise<string> {
    try {
      const text = t.compose ? await this.compose(bot, t) : t.text;
      await this.d.send(bot.id, t, text);
      t.lastRun = this.now();
      t.lastError = undefined;
      console.log(`[schedule:${bot.id}] sent ${t.id} to ${t.platform} ${t.isDirect ? "private chat" : "group"} ${t.roomName ?? t.roomId}`);
      await this.d.remember?.(t, text).catch(() => {});
      return text;
    } catch (e) {
      t.lastRun = this.now();
      t.lastError = String((e as Error)?.message ?? e).slice(0, 300);
      console.error(`[schedule:${bot.id}] ${t.id} failed:`, t.lastError);
      throw e;
    }
  }

  async runNow(botId: string, id: string): Promise<string> {
    const t = this.get(botId, id);
    const bot = this.d.bots.get(botId);
    if (!t || !bot) throw new Error("scheduled message not found");
    try {
      return await this.fire(bot, t);
    } finally {
      await this.save();
    }
  }

  /** The bot writes the message in character from the task's instruction. Falls back to the instruction. */
  private async compose(bot: BotSettings, t: ScheduledTask): Promise<string> {
    if (!this.d.flatkey.hasKey()) return t.text;
    const where = t.isDirect ? `a private chat on ${t.platform}` : `the group chat "${t.roomName || t.roomId}" on ${t.platform}`;
    const local = formatLocal(this.now(), bot.schedule.timezone);
    try {
      const res = await this.d.flatkey.chat({
        model: bot.models.chat,
        maxTokens: 300,
        messages: [
          {
            role: "system",
            content:
              `${buildPersonaPrompt(bot.persona)}\n\n## Right now\nIt is ${local} (${bot.schedule.timezone}). ` +
              `You are sending a scheduled message, on your own, in ${where}. Nobody just wrote to you.\n\n` +
              `## Write the message\nWhat it should do: ${t.text}\n` +
              (t.forName ? `It is for ${t.forName}; address them by name.\n` : "") +
              `Write only the message itself: short, natural, in character, in the language of the instruction. No quotes, no explanations.`,
          },
          { role: "user", content: "Write the scheduled message now." },
        ],
      });
      const out = String(res.message?.content ?? "").trim();
      return out || t.text;
    } catch (e) {
      console.error(`[schedule:${bot.id}] could not write ${t.id}, sending the plain text:`, (e as Error)?.message ?? e);
      return t.text;
    }
  }

  // ── chat ──

  isAllowed(bot: BotSettings, msg: IncomingMessage): boolean {
    return bot.schedule.allowed.includes(`${msg.platform}:${msg.userId}`);
  }

  /**
   * Reads a chat message from an allowed person as a schedule request. Returns the bot's answer, or null
   * when the message isn't about schedules after all (then the bot just replies as usual).
   */
  async fromChat(bot: BotSettings, msg: IncomingMessage): Promise<string | null> {
    if (msg.platform === ("web" as Platform)) return null;
    const tz = bot.schedule.timezone;
    const here = this.list(bot.id).filter((t) => t.platform === msg.platform && t.roomId === msg.roomId);
    const nowLocal = formatLocal(this.now(), tz, true);
    const res = await this.d.flatkey.chat({
      model: bot.models.memory || bot.models.chat,
      jsonMode: true,
      maxTokens: 400,
      temperature: 0,
      messages: [
        {
          role: "system",
          content: [
            `You read chat messages sent to ${bot.persona.name}, a chat bot, and decide if they ask it to send a message later (a reminder or a repeating message), to list those, or to cancel some.`,
            `Now: ${nowLocal}, time zone ${tz}. All times are in this time zone.`,
            `Scheduled messages already in this chat:\n${here.length ? here.map((t) => `- id ${t.id}: ${describeWhen(t, tz)}: ${t.text}`).join("\n") : "(none)"}`,
            `Answer with JSON only:`,
            `{"action":"create"|"list"|"cancel"|"none", "once":"YYYY-MM-DDTHH:MM" (create, one time), "cron":"m h dom mon dow" (create, repeating), "what":"…", "for":"…", "ids":["…"], "reply":"…"}`,
            `- create: only when they clearly ask the bot to say or remind something later. A time with no day means the next time it comes (today, or tomorrow if it has passed). "every day/weekday/Monday…" means cron. Use "once" or "cron", not both.`,
            `- what: what the message should do, as a note to the bot in the user's language, e.g. "Remind Boyuan to drink a glass of water". Keep their wording.`,
            `- for: the name of the person it is for when they asked for themselves (${msg.userName}), else omit.`,
            `- cancel: ids of the matching scheduled messages above ("all" means every one).`,
            `- reply: a short, friendly line in the user's language and in ${bot.persona.name}'s voice, confirming what you did. Do not state the time; it is added after.`,
            `- none: the message isn't asking for any of this (e.g. just mentions a time).`,
          ].join("\n"),
        },
        { role: "user", content: `${msg.userName}: ${msg.text}` },
      ],
    });
    let j: any;
    try {
      j = JSON.parse(String(res.message?.content ?? "{}"));
    } catch {
      return null;
    }
    const reply = typeof j.reply === "string" ? j.reply.trim().slice(0, 300) : "";
    switch (j.action) {
      case "create": {
        const at = typeof j.once === "string" ? parseLocal(j.once, tz) : undefined;
        const cron = typeof j.cron === "string" && j.cron.trim() ? j.cron.trim() : undefined;
        if (!cron && !at) return null;
        try {
          const t = await this.add(bot.id, {
            platform: msg.platform,
            roomId: msg.roomId,
            roomName: msg.roomName,
            isDirect: msg.isDirect,
            userId: msg.userId,
            cron,
            at: cron ? undefined : at,
            text: String(j.what || msg.text),
            compose: true,
            forName: typeof j.for === "string" ? j.for : undefined,
            createdBy: `${msg.platform}:${msg.userId} (${msg.userName})`,
          });
          console.log(`[schedule:${bot.id}] ${msg.userName} added ${t.id} on ${msg.platform} (${describeWhen(t, tz)})`);
          return `${reply || "OK!"} ⏰ ${describeWhen(t, tz)}`;
        } catch (e) {
          return `⚠️ ${(e as Error).message}`;
        }
      }
      case "list": {
        if (!here.length) return reply || "📭";
        return `${reply}\n${here.map((t) => `⏰ ${describeWhen(t, tz)}: ${t.text}`).join("\n")}`.trim();
      }
      case "cancel": {
        const ids: string[] = Array.isArray(j.ids) ? j.ids.map(String) : [];
        const gone = ids.includes("all") ? here : here.filter((t) => ids.includes(t.id));
        if (!gone.length) return reply || null;
        for (const t of gone) await this.remove(bot.id, t.id);
        console.log(`[schedule:${bot.id}] ${msg.userName} cancelled ${gone.map((t) => t.id).join(", ")}`);
        return `${reply || "OK!"}\n${gone.map((t) => `🗑️ ${t.text}`).join("\n")}`.trim();
      }
      default:
        return null;
    }
  }
}

// ── time helpers ──

/** "2026-11-24T10:00" in a time zone → epoch ms. */
export function parseLocal(s: string, tz: string): number | undefined {
  const m = /^(\d{4})-(\d\d)-(\d\d)[T ](\d\d):(\d\d)/.exec(s.trim());
  if (!m) return undefined;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  // Guess as UTC, then correct by the zone's offset at that moment (twice, for DST edges).
  let ts = Date.UTC(y, mo - 1, d, h, mi);
  for (let i = 0; i < 2; i++) ts = Date.UTC(y, mo - 1, d, h, mi) - offsetMs(ts, tz);
  return ts;
}

function offsetMs(ts: number, tz: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
      .formatToParts(new Date(ts))
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - Math.floor(ts / 1000) * 1000;
}

export function formatLocal(ts: number, tz: string, withWeekday = false): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    ...(withWeekday ? { weekday: "long" } : { weekday: "short" }),
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(ts));
}

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "Tue, Nov 24, 2026, 10:00 (Asia/Shanghai)" or "every day at 10:00 (Asia/Shanghai)". */
export function describeWhen(t: Pick<ScheduledTask, "cron" | "at">, tz: string): string {
  if (t.at && !t.cron) return `${formatLocal(t.at, tz)} (${tz})`;
  const f = (t.cron ?? "").split(/\s+/);
  if (f.length === 5 && /^\d+$/.test(f[0]) && /^\d+$/.test(f[1]) && f[2] === "*" && f[3] === "*") {
    const at = `${f[1].padStart(2, "0")}:${f[0].padStart(2, "0")}`;
    if (f[4] === "*") return `every day at ${at} (${tz})`;
    if (f[4] === "1-5") return `weekdays at ${at} (${tz})`;
    if (/^[0-6](,[0-6])*$/.test(f[4])) return `every ${f[4].split(",").map((d) => DOW[+d]).join(", ")} at ${at} (${tz})`;
  }
  return `cron "${t.cron}" (${tz})`;
}
