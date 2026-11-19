import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyAttachment, attachmentUrl, stripQQMarkup, qqEmbeddedText, qqEmbeddedAttachments, mentionsThisBot } from "../src/adapters/qq.ts";

/**
 * QQ's attachment metadata is not tidy. Requiring a perfect `image/...` content type made the
 * bot answer "I got nothing" to real pictures, stickers and emoji, so classification has to
 * cope with what the platform actually sends.
 */

test("images are recognised from content type, filename or URL hint", () => {
  assert.equal(classifyAttachment({ content_type: "image/jpeg", url: "https://x/y" }), "image");
  assert.equal(classifyAttachment({ content_type: "", filename: "cat.png", url: "https://x/y" }), "image");
  assert.equal(classifyAttachment({ content_type: "application/octet-stream", filename: "cat.JPEG", url: "https://x/y" }), "image");
  assert.equal(classifyAttachment({ url: "https://multimedia.nt.qq.com.cn/download?appid=1&file_type=image&rkey=x" }), "image");
  assert.equal(classifyAttachment({ url: "https://gchat.qpic.cn/image/abc/0" }), "image");
  assert.equal(classifyAttachment({ content_type: "image/gif", url: "https://x/y.gif" }), "image");
});

test("video, voice and other files are identified instead of being dropped silently", () => {
  assert.equal(classifyAttachment({ content_type: "video/mp4", url: "https://x/v" }), "video");
  assert.equal(classifyAttachment({ filename: "clip.mov", url: "https://x/v" }), "video");
  assert.equal(classifyAttachment({ filename: "voice.silk", url: "https://x/a" }), "audio");
  assert.equal(classifyAttachment({ content_type: "audio/amr", url: "https://x/a" }), "audio");
  assert.equal(classifyAttachment({ content_type: "application/pdf", filename: "a.pdf", url: "https://x/f" }), "file");
  assert.equal(classifyAttachment({ url: "https://x/f" }), "file");
  assert.equal(classifyAttachment(null), "skip");
  assert.equal(classifyAttachment({}), "skip");
});

test("attachment URLs are made absolute without losing the query string", () => {
  assert.equal(attachmentUrl({ url: "//multimedia.nt.qq.com.cn/download?appid=1&rkey=abc" }), "https://multimedia.nt.qq.com.cn/download?appid=1&rkey=abc");
  assert.equal(attachmentUrl({ url: "https://x/y?z=1" }), "https://x/y?z=1");
  assert.equal(attachmentUrl({ url: "gchat.qpic.cn/a.png" }), "https://gchat.qpic.cn/a.png");
  assert.equal(attachmentUrl({}), "");
});

test("QQ markup becomes readable text instead of base64 noise", () => {
  const raw = '<@!123456> look <faceType=6,faceId="0",ext="eyJ0ZXh0IjoiIn0="/> cute';
  const clean = stripQQMarkup(raw);
  assert.doesNotMatch(clean, /faceType|ext=|eyJ0ZXh0|<\@/);
  assert.match(clean, /\[emoji\]/);
  assert.match(clean, /look/);
  assert.match(clean, /cute/);
  assert.equal(stripQQMarkup("plain text 你好"), "plain text 你好");
});

test("forwarded chat records and quotes are read; @all isn't an @ of the bot", () => {
  const record = { content: "look at this", msg_elements: [{ message_type: 102, content: "", msg_elements: [{ message_type: 0, content: "A: lunch at 12?" }, { message_type: 0, content: "B: ok <@all>" }] }] };
  assert.equal(qqEmbeddedText(record), "[forwarded chat history]\n  A: lunch at 12?\n  B: ok @all");
  assert.equal(qqEmbeddedText({ content: "hi", msg_elements: [{ message_type: 0, content: "hi" }] }), "", "the message's own text isn't repeated");
  assert.ok(qqEmbeddedText({ msg_elements: [{ message_type: 0, content: "x".repeat(5000) }] }).length <= 3001);
  assert.equal(mentionsThisBot({ mentions: [{ scope: "all", is_you: false }] }), false);
  assert.equal(mentionsThisBot({ mentions: [{ is_you: true }] }), true);
  assert.equal(mentionsThisBot({}), false);
});

test("pictures inside a quoted message or a forwarded record are collected and marked in the text", () => {
  const pic = (n: number) => ({ content_type: "image/jpeg", url: `https://multimedia.nt.qq.com.cn/download?id=${n}` });
  const quote = { content: "what is this?", msg_elements: [{ message_type: 103, content: "", attachments: [pic(1)] }] };
  assert.deepEqual(qqEmbeddedAttachments(quote), [pic(1)]);
  assert.equal(qqEmbeddedText(quote), "[quoting] [image]");
  const withText = { content: "lol", msg_elements: [{ message_type: 103, content: "my cat", attachments: [pic(1), pic(2), { content_type: "video/mp4", url: "https://x/v.mp4" }] }] };
  assert.equal(qqEmbeddedText(withText), "[quoting] my cat [2 images]");
  assert.deepEqual(qqEmbeddedAttachments(withText), [pic(1), pic(2)], "videos are left out");
  const record = { content: "", msg_elements: [{ message_type: 102, msg_elements: [1, 2, 3, 4, 5].map((n) => ({ message_type: 0, content: `m${n}`, attachments: [pic(n)] })) }] };
  assert.equal(qqEmbeddedAttachments(record).length, 3, "capped at 3 pictures");
  assert.deepEqual(qqEmbeddedAttachments({ content: "hi" }), []);
});
