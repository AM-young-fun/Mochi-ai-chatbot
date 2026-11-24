import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { makeStack, msg } from "./helpers.ts";

let S: Awaited<ReturnType<typeof makeStack>>;
before(async () => {
  S = await makeStack();
  S.bots.update("mochi", { triggers: { mergeSeconds: 0.3 } });
});
after(() => S.close());

const group = (userId: string, userName: string, text: string) =>
  msg({ platform: "discord", roomId: "merge-room", userId, userName, text, isDirect: false, mentionsBot: true });

test("a burst of messages gets one answer per topic, on the latest message of each", async () => {
  const sent = [
    group("u1", "Sam", "Mochi, is my cat cute?"),
    group("u2", "Lee", "Mochi what time is the movie"),
    group("u3", "Ana", "Mochi my cat knocked my cup over lol"),
    group("u1", "Sam", "Mochi hello??"),
    group("u4", "Bo", "Mochi the cat pic is in #pets"),
  ];
  const answers = await Promise.all(sent.map((m, i) => new Promise((r) => setTimeout(r, i * 40)).then(() => S.brain.handle(m))));
  const replied = answers.map((a, i) => (a ? i : -1)).filter((i) => i >= 0);
  assert.deepEqual(replied, [3, 4], "two topics → two answers: the latest cat message and the latest other one");

  const calls = S.mock.calls.filter((c) => c.path === "/v1/chat/completions" && !c.body.response_format);
  const cat = String(calls.at(-1)!.body.messages[0].content);
  const other = String(calls.at(-2)!.body.messages[0].content);
  assert.match(cat, /## Several messages at once[\s\S]*- Sam: Mochi, is my cat cute\?\n- Ana: Mochi my cat knocked/);
  assert.match(other, /## Several messages at once[\s\S]*- Lee: Mochi what time is the movie/);
  assert.doesNotMatch(other, /cat cute/);
});

test("a single message is answered on its own, without grouping", async () => {
  const before = S.mock.calls.filter((c) => c.body?.response_format?.type === "json_object").length;
  const a = await S.brain.handle(group("u9", "Kai", "Mochi hi!"));
  assert.ok(a?.text);
  assert.equal(S.mock.calls.filter((c) => c.body?.response_format?.type === "json_object").length, before, "no grouping call");
  assert.doesNotMatch(String(S.mock.calls.findLast((c) => c.path === "/v1/chat/completions")!.body.messages[0].content), /Several messages at once/);
});

test("the website widget is never held back", async () => {
  const t0 = Date.now();
  const a = await S.brain.handle(msg({ platform: "web", roomId: "w1", userId: "w1", userName: "Visitor", text: "hi", isDirect: true }));
  assert.ok(a?.text);
  assert.ok(Date.now() - t0 < 250, "answered without waiting");
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const said = (m: any) => (typeof m.content === "string" ? m.content : JSON.stringify(m.content ?? ""));

test("merged messages appear once in the prompt: in the list, not again in the history", async () => {
  const room = (userId: string, userName: string, text: string) =>
    msg({ platform: "discord", roomId: "dup-room", userId, userName, text, isDirect: false, mentionsBot: true });
  await Promise.all([S.brain.handle(room("u1", "Sam", "Mochi did you see the parade")), sleep(30).then(() => S.brain.handle(room("u1", "Sam", "Mochi it had dragons")))]);
  const call = S.mock.calls.findLast((c) => c.path === "/v1/chat/completions" && !c.body.response_format)!;
  const everything = call.body.messages.map(said).join("\n");
  assert.equal(everything.split("did you see the parade").length - 1, 1, "the first message is shown once");
  assert.equal(everything.split("it had dragons").length - 1, 1, "the answered message is shown once");
});

test("typing slowly: a message that arrives while the bot is writing replaces that answer with one covering both", async () => {
  const room = (text: string, mention: boolean) =>
    msg({ platform: "discord", roomId: "slow-room", userId: "u7", userName: "Boyuan", text, isDirect: false, mentionsBot: mention });
  S.mock.setReplyDelay(500);
  try {
    const first = S.brain.handle(room("Mochi what should I cook tonight", true));
    // The 0.3 s wait passes and the bot starts writing (the reply takes 0.5 s); then more arrives, without @Mochi.
    await sleep(450);
    const second = S.brain.handle(room("something with noodles maybe", false));
    const [a, b] = await Promise.all([first, second]);
    assert.equal(a, null, "the out-of-date answer to the first message is dropped");
    assert.ok(b?.text, "one answer, on the latest message");
    const last = S.mock.calls.findLast((c) => c.path === "/v1/chat/completions" && !c.body.response_format)!;
    assert.match(String(last.body.messages[0].content), /## Several messages at once[\s\S]*- Boyuan: Mochi what should I cook tonight/);
    const stored = await S.store.recentMessages("mochi", "discord", "slow-room", 10);
    assert.equal(stored.filter((m) => m.isBot).length, 1, "only the answer actually sent is in the history");
  } finally {
    S.mock.setReplyDelay(0);
  }
});

test("a non-mention from someone else doesn't join or delay an answer", async () => {
  const p = S.brain.handle(msg({ platform: "discord", roomId: "other-room", userId: "u1", userName: "Sam", text: "Mochi hi", isDirect: false, mentionsBot: true }));
  await sleep(50);
  const q = await S.brain.handle(msg({ platform: "discord", roomId: "other-room", userId: "u2", userName: "Lee", text: "unrelated chatter", isDirect: false, mentionsBot: false }));
  assert.equal(q, null);
  assert.ok((await p)?.text);
  const last = S.mock.calls.findLast((c) => c.path === "/v1/chat/completions" && !c.body.response_format)!;
  assert.doesNotMatch(String(last.body.messages[0].content), /Several messages at once/);
});
