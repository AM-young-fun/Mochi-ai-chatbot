import { test } from "node:test";
import assert from "node:assert/strict";
import { statedName } from "../src/core/names.ts";

test("statedName: picks up names people give, in four languages", () => {
  const cases: [string, string][] = [
    ["hi! my name is alex", "Alex"],
    ["My name is Alex Chen.", "Alex Chen"],
    ["my name's Sam and i like cats", "Sam"],
    ["you can call me Jojo please", "Jojo"],
    ["call me Mary-Jane!", "Mary-Jane"],
    ["meu nome é ana", "Ana"],
    ["oi, me chamo João", "João"],
    ["pode me chamar de Bia", "Bia"],
    ["我叫小林", "小林"],
    ["你好,我的名字是王小明。", "王小明"],
    ["叫我阿杰吧", "阿杰"],
    ["私の名前はユキです", "ユキ"],
    ["ユキと呼んで", "ユキ"],
  ];
  for (const [text, name] of cases) assert.equal(statedName(text), name, text);
});

test("statedName: ignores lines that only look like names", () => {
  for (const text of ["I'm tired", "call me later", "call me back tomorrow", "我叫什么名字?", "what's your name?", "the name is in the file", ""]) {
    assert.equal(statedName(text), "", text);
  }
});
