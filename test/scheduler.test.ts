import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { makeStack, msg } from "./helpers.ts";
import { Scheduler, describeWhen, parseLocal } from "../src/core/scheduler.ts";

let S: Awaited<ReturnType<typeof makeStack>>;
let now = Date.UTC(2026, 10, 24, 1, 0); // 09:00 in Asia/Shanghai
const sent: { room: any; text: string }[] = [];
let sched: Scheduler;

before(async () => {
  S = await makeStack();
  S.bots.update("mochi", { schedule: { timezone: "Asia/Shanghai", allowed: ["telegram:u-owner"] } });
  sched = new Scheduler({
    docs: S.storage.docs,
    bots: S.bots,
    flatkey: S.flatkey,
    send: async (_bot, room, text) => void sent.push({ room, text }),
    now: () => now,
  });
  await sched.load();
  S.brain.setScheduler(sched);
});
after(() => S.close());

test("time helpers: local time in a zone, and readable descriptions", () => {
  assert.equal(new Date(parseLocal("2026-11-24T10:00", "Asia/Shanghai")!).toISOString(), "2026-11-24T02:00:00.000Z");
  assert.equal(new Date(parseLocal("2026-07-01T10:00", "America/Los_Angeles")!).toISOString(), "2026-07-01T17:00:00.000Z", "summer time");
  assert.equal(describeWhen({ cron: "0 10 * * *" }, "UTC"), "every day at 10:00 (UTC)");
  assert.equal(describeWhen({ cron: "30 9 * * 1-5" }, "UTC"), "weekdays at 09:30 (UTC)");
  assert.equal(describeWhen({ cron: "0 8 * * 1,3" }, "UTC"), "every Mon, Wed at 08:00 (UTC)");
});

test("one-time and repeating messages go out on time, in the bot's time zone, through the sender", async () => {
  const once = await sched.add("mochi", { platform: "telegram", roomId: "-100", isDirect: false, at: parseLocal("2026-11-24T10:00", "Asia/Shanghai"), text: "drink water", compose: false });
  const daily = await sched.add("mochi", { platform: "telegram", roomId: "-100", isDirect: false, cron: "30 9 * * *", text: "Say good morning", compose: true });
  assert.equal(new Date(daily.nextRun!).toISOString(), "2026-11-24T01:30:00.000Z", "09:30 Shanghai today");

  now = Date.UTC(2026, 10, 24, 1, 31);
  await sched.tick();
  assert.equal(sent.length, 1);
  assert.match(sent[0].text, /^💧 \(scheduled\) Say good morning/, "composed in character");
  assert.equal(new Date(sched.get("mochi", daily.id)!.nextRun!).toISOString(), "2026-11-25T01:30:00.000Z", "next day");

  now = Date.UTC(2026, 10, 24, 2, 0, 30);
  await sched.tick();
  assert.equal(sent.at(-1)!.text, "drink water", "plain text when compose is off");
  assert.equal(sched.get("mochi", once.id)!.enabled, false, "one-time message is done");
  await sched.tick();
  assert.equal(sent.length, 2, "nothing sent twice");

  // Server was down past a run: it is skipped, not sent hours late.
  now = Date.UTC(2026, 10, 25, 5, 0);
  await sched.tick();
  assert.equal(sent.length, 2);
  assert.equal(new Date(sched.get("mochi", daily.id)!.nextRun!).toISOString(), "2026-11-26T01:30:00.000Z");

  await assert.rejects(sched.add("mochi", { platform: "telegram", roomId: "-100", cron: "* * * * *", text: "spam" }), /at most one every 10 minutes/);
  await assert.rejects(sched.add("mochi", { platform: "web", roomId: "w", cron: "0 9 * * *", text: "x" }), /Website visitors/);
  await assert.rejects(sched.add("mochi", { platform: "telegram", roomId: "-100", at: now - 1000, text: "x" }), /already passed/);
  for (const t of sched.list("mochi")) await sched.remove("mochi", t.id);
});

test("chat tools: allowed people get schedule tools to create, list and cancel; others get none", async () => {
  const owner = (text: string) => msg({ platform: "telegram", roomId: "-200", roomName: "Friends", userId: "u-owner", userName: "Boyuan", text, isDirect: false, mentionsBot: true });
  const lastCall = () => S.mock.calls.findLast((c) => c.path === "/v1/chat/completions" && c.body.tools)!;

  const r1 = await S.brain.handle(owner("Mochi, remind me at 10 to drink a glass of water"));
  assert.ok(lastCall().body.tools.some((t: any) => t.function.name === "schedule_message"), "tools offered");
  assert.match(String(lastCall().body.messages[0].content), /## Scheduled messages[\s\S]*Asia\/Shanghai/);
  const out1 = JSON.parse(r1!.text.replace(/^Done! /, ""));
  assert.equal(out1.ok, true);
  assert.equal(out1.when, "Thu, Jan 1, 2099, 10:00 (Asia/Shanghai)");
  const created = sched.get("mochi", out1.id)!;
  assert.equal(created.roomId, "-200");
  assert.equal(created.forName, "Boyuan");
  assert.equal(created.createdBy, "telegram:u-owner (Boyuan)");

  const r2 = await S.brain.handle(owner("Mochi, every day at 9 say good morning"));
  assert.match(r2!.text, /every day at 09:00/);
  const r3 = await S.brain.handle(owner("Mochi, what reminders are there?"));
  const listed = JSON.parse(r3!.text.replace(/^Done! /, "")).scheduled;
  assert.deepEqual(listed.map((x: any) => x.when), ["every day at 09:00 (Asia/Shanghai)", "Thu, Jan 1, 2099, 10:00 (Asia/Shanghai)"], "soonest first");
  const r4 = await S.brain.handle(owner("Mochi, cancel all of them"));
  assert.equal(JSON.parse(r4!.text.replace(/^Done! /, "")).cancelled.length, 2);
  assert.equal(sched.list("mochi").filter((t) => t.roomId === "-200").length, 0);

  // A bad time comes back to the model as an error, not a crash.
  const bad = await sched.toolCreate(S.bots.get("mochi")!, owner("x"), { cron: "* * * * *", message: "spam" });
  assert.match(JSON.parse(bad).error, /at most one every 10 minutes/);

  // Someone not on the list: no tools, and the model is told not to pretend.
  const n = sched.list("mochi").length;
  await S.brain.handle(msg({ platform: "telegram", roomId: "-200", userId: "u-other", userName: "Sam", text: "Mochi, remind me at 10 to stretch", mentionsBot: true, isDirect: false }));
  assert.equal(sched.list("mochi").length, n, "nothing scheduled");
  const call = S.mock.calls.findLast((c) => c.path === "/v1/chat/completions")!;
  assert.ok(!(call.body.tools ?? []).some((t: any) => t.function.name === "schedule_message"), "no schedule tools");
  assert.match(String(call.body.messages[0].content), /can't set that up for this person/);
});

test("schedules persist in the schedules document", async () => {
  const t = await sched.add("mochi", { platform: "qq", roomId: "group:G1", cron: "0 8 * * 1-5", text: "standup" });
  const again = new Scheduler({ docs: S.storage.docs, bots: S.bots, flatkey: S.flatkey, send: async () => {}, now: () => now });
  await again.load();
  assert.deepEqual(again.list("mochi").map((x) => x.id), sched.list("mochi").map((x) => x.id));
  assert.equal(again.get("mochi", t.id)!.text, "standup");
});

test("changing the time zone moves repeating messages to the new local time", async () => {
  const t = await sched.add("mochi", { platform: "telegram", roomId: "-300", cron: "0 9 * * *", text: "tz test" });
  const before = t.nextRun!;
  S.bots.update("mochi", { schedule: { timezone: "UTC" } });
  await sched.reschedule("mochi");
  assert.equal(new Date(sched.get("mochi", t.id)!.nextRun!).getUTCHours(), 9);
  assert.notEqual(sched.get("mochi", t.id)!.nextRun, before);
  S.bots.update("mochi", { schedule: { timezone: "Asia/Shanghai" } });
});

test("website: visitors can't be allowed, get no schedule tools, and aren't schedule targets", async () => {
  S.bots.update("mochi", { schedule: { allowed: ["telegram:u-owner", "web:visitor-1"] } });
  assert.deepEqual(S.bots.get("mochi")!.schedule.allowed, ["telegram:u-owner"], "web entries dropped");
  const web = msg({ platform: "web", roomId: "visitor-1", userId: "visitor-1", userName: "Visitor", text: "remind me at 10 to drink water", isDirect: true });
  assert.equal(sched.isAllowed(S.bots.get("mochi")!, web), false);
  await S.brain.handle(web);
  const call = S.mock.calls.findLast((c) => c.path === "/v1/chat/completions")!;
  assert.ok(!(call.body.tools ?? []).some((t: any) => t.function.name === "schedule_message"));
  assert.doesNotMatch(String(call.body.messages[0].content), /## Scheduled messages|## Reminders/);
});
