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
