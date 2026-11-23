import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { CHARACTER_AI, CHARACTER_AI_FOOTER, CHARACTER_AI_H1, CHARACTER_AI_PATH } from "../website/lib/character-ai.ts";

const root = path.resolve(import.meta.dirname, "..");
const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf8");

test("character.ai alternative page is a single English route with a footer label in every locale", () => {
  assert.equal(CHARACTER_AI_PATH, "/character-ai-alternative");
  assert.equal(CHARACTER_AI.h1Lines.join(" "), CHARACTER_AI_H1);
  assert.equal(CHARACTER_AI_H1, "Your AI companion. Your memories. Your control.");
  const homeTitle = read("website/lib/content.ts").match(/title: "([^"]+)"/)?.[1];
  assert.ok(homeTitle);
  assert.notEqual(CHARACTER_AI.title, homeTitle);
  assert.ok(!CHARACTER_AI.description.includes("9600"));
  assert.ok(!/\/(zh|ja|pt)\/character-ai-alternative/.test(JSON.stringify(CHARACTER_AI_FOOTER)));
  assert.deepEqual(Object.keys(CHARACTER_AI_FOOTER), ["en", "zh", "ja", "pt"]);
  for (const label of Object.values(CHARACTER_AI_FOOTER)) assert.ok(label.trim().length > 0);
  assert.equal(CHARACTER_AI_FOOTER.en, "Character.AI Alternative");
  assert.ok(CHARACTER_AI.faq.items.length >= 8);
  const faq = CHARACTER_AI.faq.items.map((item) => `${item.q} ${item.a}`).join("\n");
  assert.match(faq, /does not import/i);
  assert.match(faq, /not affiliated/i);
  assert.match(faq, /Flatkey only/i);
  assert.match(faq, /not a promise/i);
  assert.ok(!/AggregateRating|Review/.test(faq));
});

test("localized footers link to the real English page, and the sitemap includes it", () => {
  const landing = read("website/components/Landing.tsx");
  const line = read("website/components/LineFreelance.tsx");
  const sitemap = read("website/app/sitemap.xml/route.ts");
  const page = read("website/components/CharacterAi.tsx");
  assert.match(landing, /CHARACTER_AI_PATH/);
  assert.match(landing, /hrefLang="en"/);
  assert.match(line, /CHARACTER_AI_PATH/);
  assert.match(sitemap, /characterAiUrl/);
  assert.ok(!page.includes("AggregateRating"));
  assert.ok(!page.includes('"@type": "Review"'));
  assert.ok(!/\/(zh|ja|pt)\/character-ai-alternative/.test(landing + line + sitemap + page));
});
