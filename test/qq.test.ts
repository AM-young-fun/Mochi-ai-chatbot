import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { WebSocketServer } from "ws";
import { makeStack } from "./helpers.ts";
import crypto from "node:crypto";
import { QQAdapter, qqSafeText, qqSign, qqVerify } from "../src/adapters/qq.ts";

let S: Awaited<ReturnType<typeof makeStack>>;
let api: http.Server;
let wss: WebSocketServer;
let base: string;
const posts: { path: string; body: any; auth: string }[] = [];
const identifies: any[] = [];
let closeFirstWith4014 = true;

before(async () => {
  S = await makeStack();
  wss = new WebSocketServer({ port: 0 });
  const wsUrl = `ws://127.0.0.1:${(wss.address() as AddressInfo).port}`;
  wss.on("connection", (sock) => {
    sock.send(JSON.stringify({ op: 10, d: { heartbeat_interval: 30000 } }));
    sock.on("message", (raw) => {
      const p = JSON.parse(String(raw));
      if (p.op !== 2) return;
      identifies.push(p.d);
      if (closeFirstWith4014) {
        closeFirstWith4014 = false;
        return sock.close(4014, "disallowed intents");
      }
      sock.send(JSON.stringify({ op: 0, s: 1, t: "READY", d: { session_id: "sess", user: { id: "999", username: "MochiQQ" } } }));
      setTimeout(() => {
        sock.send(JSON.stringify({ op: 0, s: 2, t: "GROUP_AT_MESSAGE_CREATE", d: { id: "msg-g1", group_openid: "G1", content: " hello from the group", author: { member_openid: "MEMBER0001" }, timestamp: new Date().toISOString() } }));
        sock.send(JSON.stringify({ op: 0, s: 3, t: "C2C_MESSAGE_CREATE", d: { id: "msg-c1", content: "hi in private", author: { user_openid: "USER0002" } } }));
        sock.send(JSON.stringify({ op: 0, s: 4, t: "GROUP_MESSAGE_CREATE", d: { id: "msg-g2", group_openid: "G1", content: "just chatting, not for the bot", author: { member_openid: "MEMBER0003" } } }));
        // Full-message mode: an @bot arrives as GROUP_MESSAGE_CREATE, marked in mentions[].is_you, and may be pushed twice.
        const atInFullMode = { id: "msg-g3", group_openid: "G1", content: "<@BOTOPENID01> what do you think?", author: { member_openid: "MEMBER0004", member_nickname: "Xiaoming" }, mentions: [{ member_openid: "BOTOPENID01", bot: true, is_you: true }], msg_elements: [{ message_type: 103, content: "the movie was great", attachments: [{ content_type: "image/png", url: "https://10.0.0.1/movie.png" }], msg_elements: [] }] };
        sock.send(JSON.stringify({ op: 0, s: 5, t: "GROUP_MESSAGE_CREATE", d: atInFullMode }));
        sock.send(JSON.stringify({ op: 0, s: 6, t: "GROUP_AT_MESSAGE_CREATE", d: atInFullMode }));
      }, 20);
    });
  });
  api = http.createServer(async (req, res) => {
    let raw = "";
    for await (const c of req) raw += c;
    const send = (b: unknown) => (res.writeHead(200, { "content-type": "application/json" }), res.end(JSON.stringify(b)));
    if (req.url === "/token") return send({ access_token: "tok-1", expires_in: "7200" });
    if (req.url === "/users/@me") return send({ id: "999", username: "MochiQQ" });
    if (req.url === "/gateway") return send({ url: wsUrl });
    posts.push({ path: req.url ?? "", body: raw ? JSON.parse(raw) : null, auth: String(req.headers.authorization) });
    send({ id: "sent" });
  });
  await new Promise<void>((r) => api.listen(0, r));
  base = `http://127.0.0.1:${(api.address() as AddressInfo).port}`;
});
after(async () => {
  wss.close();
  api.close();
  await S.close();
});

test("QQ adapter: identifies, falls back on 4014, replies passively to group @ and private chats", async () => {
  const a = new QQAdapter("mochi", "102012345", "secret", S.brain, { tokenUrl: `${base}/token`, apiBase: base });
  await a.start();
  assert.equal(a.status().running, true);
  assert.match(a.status().detail, /MochiQQ/);

  // First identify asked for everything; QQ refused (4014) → retried with groups + private chats only.
  assert.equal(identifies.length, 2);
  assert.equal(identifies[0].token, "QQBot tok-1");
  assert.notEqual(identifies[0].intents, 1 << 25);
  assert.equal(identifies[1].intents, 1 << 25);

  // Replies can come back in any order (one message waits on a picture download), so wait for all three.
  for (let i = 0; i < 150 && posts.length < 3; i++) await new Promise((r) => setTimeout(r, 20));
  const group = posts.find((p) => p.path === "/v2/groups/G1/messages" && p.body?.msg_id === "msg-g1")!;
  assert.ok(group, "replied in the group");
  assert.equal(group.body.msg_id, "msg-g1", "passive reply quotes the msg_id");
  assert.equal(group.body.msg_seq, 1);
  assert.match(group.body.content, /hello from the group/);
  assert.equal(group.auth, "QQBot tok-1");
  const c2c = posts.find((p) => p.path === "/v2/users/USER0002/messages")!;
  assert.equal(c2c.body.msg_id, "msg-c1");
  assert.ok(!posts.some((p) => p.body?.msg_id === "msg-g2"), "doesn't reply to un-addressed group chatter");
  const full = posts.filter((p) => p.body?.msg_id === "msg-g3");
  assert.equal(full.length, 1, "answers an @ in full-message mode, once");
  assert.match(full[0].body.content, /what do you think\?/);
  assert.ok(!/BOTOPENID01/.test(full[0].body.content), "the @ markup is stripped");
  const g3 = (await S.store.recentMessages("mochi", "qq", "group:G1", 10)).find((m) => m.text.includes("what do you think"))!;
  assert.match(g3.text, /\[quoting\] the movie was great \[image\]/);
  assert.match(g3.text, /quoted message had an image, but it could not be downloaded/, "a quoted picture is fetched, and said so when it can't be");
  assert.equal(g3.userName, "Xiaoming");

  // Memory still recorded the un-addressed message, under the QQ platform.
  const room = (await S.store.recentMessages("mochi", "qq", "group:G1", 10));
  assert.ok(room.some((m) => m.text === "just chatting, not for the bot"));
  assert.ok((await S.store.getPerson("mochi", "qq", "MEMBER0001"))!.displayName.startsWith("QQ user"));

  await a.stop();
  assert.equal(a.status().running, false);
});

test("QQ replies never contain raw URLs (QQ blocks unregistered domains)", () => {
  const out = qqSafeText("The sky is blue.\n\n🔗 https://example.com/answer\nsee https://docs.flatkey.ai/x for more");
  assert.doesNotMatch(out, /https?:\/\//);
  assert.match(out, /docs\[\.\]flatkey\[\.\]ai/);
  assert.doesNotMatch(out, /example/);
});

test("QQ callback signing: Ed25519 from the AppSecret seed, matches an independent key", () => {
  const secret = "naOC0ocQE3shWLAfffVLB1rhYPG7";
  // Independent derivation: seed = secret repeated to 32 bytes, key from the raw seed via JWK.
  const seed = (secret + secret).slice(0, 32);
  const priv = crypto.createPrivateKey({ key: Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), Buffer.from(seed)]), format: "der", type: "pkcs8" });
  const msg = "1725442341" + "Arq0D5A61EgUu4OxUvOp";
  assert.equal(qqSign(secret, msg), crypto.sign(null, Buffer.from(msg), priv).toString("hex"));
  const body = '{"op":0,"t":"C2C_MESSAGE_CREATE","d":{}}';
  const sig = qqSign(secret, "1725442341" + body);
  assert.equal(qqVerify(secret, "1725442341", body, sig), true);
  assert.equal(qqVerify(secret, "1725442342", body, sig), false, "timestamp is covered");
  assert.equal(qqVerify(secret, "1725442341", body + " ", sig), false, "body is covered");
  assert.equal(qqVerify("another-secret-value", "1725442341", body, sig), false);
  assert.equal(qqVerify(secret, "1725442341", body, undefined), false);
});

test("QQ callback: answers the console's URL check and handles a signed event once", async () => {
  const secret = "callback-secret-123";
  const a = new QQAdapter("mochi", "102012345", secret, S.brain, { tokenUrl: `${base}/token`, apiBase: base });
  // URL check (op 13): echo plain_token, sign event_ts + plain_token.
  const check = (await a.handleWebhook(JSON.stringify({ op: 13, d: { plain_token: "PLAIN", event_ts: "1700000000" } }))) as any;
  assert.equal(check.plain_token, "PLAIN");
  assert.equal(check.signature, qqSign(secret, "1700000000PLAIN"));

  const body = JSON.stringify({ op: 0, id: "evt-1", t: "C2C_MESSAGE_CREATE", d: { id: "msg-cb1", content: "hello by callback", author: { user_openid: "USER0009" } } });
  const ts = "1700000001";
  await assert.rejects(a.handleWebhook(body, "00".repeat(64), ts), /signature/);
  assert.deepEqual(await a.handleWebhook(body, qqSign(secret, ts + body), ts), { op: 12, d: 0 });
  // The same message again (e.g. also over the gateway, or a retry) is not answered twice.
  await a.handleWebhook(body, qqSign(secret, ts + body), ts);
  for (let i = 0; i < 150 && !posts.some((p) => p.body?.msg_id === "msg-cb1"); i++) await new Promise((r) => setTimeout(r, 20));
  await new Promise((r) => setTimeout(r, 100));
  const replies = posts.filter((p) => p.body?.msg_id === "msg-cb1");
  assert.equal(replies.length, 1);
  assert.equal(replies[0].path, "/v2/users/USER0009/messages");
  assert.equal(a.status().running, true, "a working callback counts as connected");
  await a.stop();
});
