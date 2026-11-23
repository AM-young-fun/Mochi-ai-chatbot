import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { makeStack, msg } from "./helpers.ts";
import { speakableText, wantsVoice } from "../src/core/voice.ts";

let S: Awaited<ReturnType<typeof makeStack>>;
before(async () => (S = await makeStack()));
after(() => S.close());

test("speakableText: drops markdown, links, code and emoji; keeps the words", () => {
  assert.equal(speakableText("**Hi!** See [the docs](https://x.y/z) 🍡 or https://a.b/c"), "Hi! See the docs or");
  assert.equal(speakableText("```js\nconsole.log(1)\n```\nDone."), "Done.");
  assert.equal(speakableText("🍡✨"), "", "nothing left to say");
  const long = "One sentence here. ".repeat(60);
  const cut = speakableText(long, 100);
  assert.ok(cut.length <= 100 && cut.endsWith("."), "long text is cut at a sentence end");
});

test("wantsVoice: off, asked (en/zh/ja/pt) and always; never without a model", () => {
  const bot = structuredClone(S.bots.get("mochi")!);
  bot.voice = { mode: "asked", model: "tts-1", voice: "alloy", speed: 1 };
  for (const t of ["send me a voice message", "发个语音给我", "ボイスで聞かせて", "manda um áudio"]) assert.equal(wantsVoice(bot, msg({ text: t })), true, t);
  assert.equal(wantsVoice(bot, msg({ text: "how are you?" })), false);
  bot.voice.mode = "always";
  assert.equal(wantsVoice(bot, msg({ text: "how are you?" })), true);
  bot.voice.model = "";
  assert.equal(wantsVoice(bot, msg({ text: "send me a voice message" })), false, "no model, no voice");
  bot.voice.model = "tts-1";
  bot.voice.mode = "off";
  assert.equal(wantsVoice(bot, msg({ text: "send me a voice message" })), false);
});

test("brain: a spoken reply carries speak(), which calls Flatkey /v1/audio/speech in the channel's format", async () => {
  S.bots.update("mochi", { voice: { mode: "always", model: "tts-1", voice: "nova", speed: 1.2 } });
  try {
    const reply = await S.brain.handle(msg({ roomId: "voice-room", text: "hi there", isDirect: true }));
    assert.ok(reply?.speak, "speak attached");
    const audio = await reply!.speak!("opus");
    assert.equal(audio.subarray(0, 4).toString(), "OggS");
    const call = S.mock.calls.findLast((c) => c.path === "/v1/audio/speech")!;
    assert.equal(call.body.model, "tts-1");
    assert.equal(call.body.voice, "nova");
    assert.equal(call.body.response_format, "opus");
    assert.equal(call.body.speed, 1.2);
    assert.doesNotMatch(call.body.input, /https?:|\*\*/);
  } finally {
    S.bots.update("mochi", { voice: { mode: "off", model: "" } });
  }
  const quiet = await S.brain.handle(msg({ roomId: "voice-room", text: "hi again", isDirect: true }));
  assert.equal(quiet?.speak, undefined, "off again");
});
