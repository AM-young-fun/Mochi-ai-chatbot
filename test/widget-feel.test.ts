import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// The widget is a browser script; pull out just the mood reader between its markers and run it here.
const src = fs.readFileSync(path.join(import.meta.dirname, "../public/widget/widget.js"), "utf8");
const block = src.slice(src.indexOf("// feel:start"), src.indexOf("// feel:end"));
const feel = new Function(`${block}; return feel;`)() as (t: string) => { smile: boolean; act: string | null };

test("widget character: reads the mood of a reply in four languages", () => {
  assert.deepEqual(feel("hii! i'm mochi 🍡 ask me anything~"), { smile: true, act: "hop" });
  assert.deepEqual(feel("hahaha that's so funny"), { smile: true, act: null });
  assert.deepEqual(feel("太好了!恭喜你"), { smile: true, act: "hop" });
  assert.deepEqual(feel("やった、うれしい"), { smile: true, act: null });
  assert.deepEqual(feel("Que bom!"), { smile: true, act: "hop" });
  assert.equal(feel("Sorry, I can't find that.").act, "shake");
  assert.equal(feel("抱歉,我不知道").act, "shake");
  assert.equal(feel("ごめんね").act, "shake");
  assert.deepEqual(feel("thank you so much"), { smile: true, act: "shy" });
  assert.equal(feel("你好可爱").act, "shy");
  assert.equal(feel("obrigada!").act, "shy");
  assert.equal(feel("Sure, here's how.").act, "nod");
  assert.equal(feel("好的,我来看看").act, "nod");
  assert.equal(feel("What's your favorite food?").act, "tilt");
  assert.equal(feel("你喜欢什么?").act, "tilt");
  assert.deepEqual(feel("The store opens at 9."), { smile: false, act: null });
  assert.deepEqual(feel("see www.example.com for details"), { smile: false, act: null });
  assert.deepEqual(feel(""), { smile: false, act: null });
});
