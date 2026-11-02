import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

/**
 * The Channels tab builds its setup help from CHANNEL_HELP in the dashboard bundle.
 * A variable that isn't in scope there (it once used `b` without taking it as a parameter)
 * throws while rendering, and the tab shows up blank. Run it with only the globals the
 * page really has and check every platform's help comes out.
 */

const src = fs.readFileSync(path.resolve(import.meta.dirname, "../public/dashboard/app.js"), "utf8");

function slice(name: string): string {
  const start = src.indexOf(`const ${name}`);
  assert.ok(start >= 0, `${name} not found in app.js`);
  const open = src.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}" && --depth === 0) return src.slice(start, src.indexOf(";", i) + 1);
  }
  throw new Error(`unbalanced ${name}`);
}

test("channel setup help renders for every platform", () => {
  const ctx = vm.createContext({
    t: (s: string, vars: Record<string, string> = {}) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`),
    ov: { publicUrl: "https://mochi.example.com" },
  });
  vm.runInContext(`${slice("SLACK_MANIFEST")}\n${slice("CHANNEL_HELP")}\nthis.help = CHANNEL_HELP({ id: "mochi" });`, ctx);
  const help = (ctx as any).help;
  for (const p of ["discord", "telegram", "slack", "line", "qq"]) {
    assert.ok(help[p]?.steps?.length, `${p}: no steps`);
    assert.ok(help[p].fields.length, `${p}: no fields`);
  }
  assert.ok(help.line.steps.some((s: string) => s.includes("https://mochi.example.com/webhook/line/mochi")), "LINE webhook URL");
});
