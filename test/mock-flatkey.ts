/**
 * A tiny fake Flatkey router for tests and offline development.
 * Run standalone: `npx tsx test/mock-flatkey.ts` → http://localhost:4010/v1
 */
import http from "node:http";
import type { AddressInfo } from "node:net";
import { pathToFileURL } from "node:url";

export interface MockCall { path: string; body: any }

export function startMockFlatkey(
  port = 0,
): Promise<{ url: string; calls: MockCall[]; close: () => Promise<void>; setReplyDelay: (ms: number) => void }> {
  const calls: MockCall[] = [];
  /** Slows chat replies (not other endpoints) so tests can send messages while the bot is "writing". */
  let replyDelay = 0;
  const server = http.createServer(async (req, res) => {
    let raw = "";
    for await (const c of req) raw += c;
    const body = raw ? JSON.parse(raw) : {};
    calls.push({ path: req.url ?? "", body });
    if (replyDelay && req.url === "/v1/chat/completions" && !body.response_format) await new Promise((r) => setTimeout(r, replyDelay));
    const send = (data: unknown, status = 200) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(data));
    };
    const auth = String(req.headers.authorization ?? "");
    if (!auth.startsWith("Bearer ") || auth.startsWith("Bearer bad-")) return send({ error: "invalid api key" }, 401);

    if (req.url === "/v1/audio/speech") {
      if (String(body.model).startsWith("bad-")) return send({ error: { message: "model not found" } }, 404);
      // Fake audio: a recognisable header per format, padded past the "too small to be audio" check.
      const head = body.response_format === "pcm" ? Buffer.alloc(4800) : Buffer.from(body.response_format === "opus" ? "OggS" : "ID3");
      res.writeHead(200, { "content-type": body.response_format === "opus" ? "audio/ogg" : body.response_format === "pcm" ? "audio/pcm" : "audio/mpeg" });
      return res.end(Buffer.concat([head, Buffer.alloc(200, 1)]));
    }

    if (req.url === "/v1/models") {
      return send({ data: ["deepseek-v4-1-flash", "deepseek-v4-pro", "gpt-6-luna", "claude-haiku-5-5", "claude-sonnet-4-6"].map((id) => ({ id, object: "model" })) });
    }

    if (req.url === "/v1/messages") {
      const q = String(body.messages?.[0]?.content ?? "");
      return send({
        content: [
          { type: "server_tool_use", id: "s1", name: "web_search", input: { query: q } },
          { type: "web_search_tool_result", content: [{ type: "web_search_result", url: "https://example.com/answer", title: "Example source" }] },
          { type: "text", text: "Mock search answer: the sky is blue today." },
        ],
        usage: { input_tokens: 120, output_tokens: 30 },
      });
    }

    if (req.url === "/v1/chat/completions") {
      const msgs: any[] = body.messages ?? [];
      const last = msgs[msgs.length - 1];
      const sys = String(msgs[0]?.content ?? "");
      const usage = { prompt_tokens: 100, completion_tokens: 20 };

      // Grouping a burst of messages by topic: messages mentioning "cat" together, the rest together.
      if (body.response_format?.type === "json_object" && sys.startsWith("Messages just sent to")) {
        const lines = String(last.content).split("\n");
        const cat = lines.map((l, i) => (/cat/i.test(l) ? i : -1)).filter((i) => i >= 0);
        const other = lines.map((l, i) => (/cat/i.test(l) ? -1 : i)).filter((i) => i >= 0);
        return send({ choices: [{ message: { role: "assistant", content: JSON.stringify({ groups: [cat, other].filter((g) => g.length) }) } }], usage });
      }
      if (sys.includes("You are sending a scheduled message")) {
        const what = /What it should do: (.+)/.exec(sys)?.[1] ?? "";
        return send({ choices: [{ message: { role: "assistant", content: `💧 (scheduled) ${what}` } }], usage });
      }

      // memory updater
      if (body.response_format?.type === "json_object") {
        const input = JSON.parse(String(last.content));
        const people = [...new Map(input.new_messages.filter((m: any) => m.user_id !== "BOT").map((m: any) => [m.user_id, m])).values()];
        return send({
          choices: [{ message: { role: "assistant", content: JSON.stringify({
            room: { summary: "Friends chatting about cats and weekend plans.", recent_topics: ["cats", "weekend plans"] },
            people: people.map((m: any) => ({ user_id: m.user_id, name: (/everyone knows me as (\w+)/i.exec(input.new_messages.filter((x: any) => x.user_id === m.user_id).map((x: any) => x.text).join(" ")) ?? [])[1] ?? "", personality: `${m.name} is cheerful and uses lots of emoji.`, facts: [`${m.name} has a cat named Boba`], interests: ["cats"] })),
          }) } }],
          usage,
        });
      }

      // Schedule tools: a tiny rule-based stand-in for a model that uses them.
      if (last?.role === "tool" && String(last.tool_call_id).startsWith("call_sched")) {
        return send({ choices: [{ message: { role: "assistant", content: `Done! ${last.content}` } }], usage });
      }
      const said = typeof last?.content === "string" ? last.content : "";
      if (last?.role === "user" && body.tools?.some((t: any) => t.function?.name === "schedule_message")) {
        const call = (name: string, args: unknown) =>
          send({ choices: [{ message: { role: "assistant", content: null, tool_calls: [{ id: `call_sched_${name}`, type: "function", function: { name, arguments: JSON.stringify(args) } }] } }], usage });
        if (/cancel/i.test(said)) return call("cancel_scheduled_messages", { ids: ["all"] });
        if (/what reminders/i.test(said)) return call("list_scheduled_messages", {});
        const daily = /every day at (\d+)/i.exec(said);
        if (daily) return call("schedule_message", { cron: `0 ${daily[1]} * * *`, message: "Say good morning to the group" });
        const once = /remind me at (\d+)/i.exec(said);
        if (once) return call("schedule_message", { once: `2099-01-01T${once[1].padStart(2, "0")}:00`, message: "Remind them to drink a glass of water", for: "Boyuan" });
      }

      // tool result came back → final answer using it
      if (last?.role === "tool" && last.tool_call_id === "call_hist") {
        const lines = String(last.content).replace(/<\/?history>/g, "").trim();
        return send({ choices: [{ message: { role: "assistant", content: lines ? `From history: ${lines.split("\n")[0]}` : "Nothing older matched." } }], usage });
      }
      if (last?.role === "tool" && last.tool_call_id === "call_kb") {
        const m = String(last.content).match(/\[1\] \(from "([^"]+)"\)\n([^\n]+)/);
        const fb = sys.match(/reply with this message[^:]*: "([^"]+)"/);
        return send({ choices: [{ message: { role: "assistant", content: m ? `From ${m[1]}: ${m[2]}` : (fb?.[1] ?? "not found") } }], usage });
      }
      if (last?.role === "tool") {
        // Only web_search returns JSON; other tools return text, so never assume parseable.
        let r: any = {};
        try {
          r = JSON.parse(String(last.content));
        } catch {
          r = { answer: String(last.content).slice(0, 200) };
        }
        return send({ choices: [{ message: { role: "assistant", content: `Mochi: according to my search, ${r.answer ?? "no idea"}` } }], usage });
      }

      const text = typeof last.content === "string" ? last.content : (last.content ?? []).map((p: any) => p.text ?? "").join(" ");
      const hasImage = Array.isArray(last.content) && last.content.some((p: any) => p.type === "image_url");
      if (/weather|news|latest/i.test(text) && body.tools?.some((t: any) => t.function?.name === "web_search")) {
        return send({ choices: [{ message: { role: "assistant", content: null, tool_calls: [{ id: "call_1", type: "function", function: { name: "web_search", arguments: JSON.stringify({ query: "weather today" }) } }] } }], usage });
      }
      // "what were we talking about?" → the model reaches for older messages.
      if (
        /what were we|earlier|history|之前|刚才/i.test(text) &&
        body.tools?.some((t: any) => t.function?.name === "search_history") &&
        last.role !== "tool"
      ) {
        return send({ choices: [{ message: { role: "assistant", content: null, tool_calls: [{ id: "call_hist", type: "function", function: { name: "search_history", arguments: JSON.stringify({ query: "" }) } }] } }], usage });
      }
      // Knowledge base: answer from the first injected passage, or the strict fallback.
      const passage = sys.match(/\[1\] \(from "([^"]+)"\)\n([\s\S]*?)(?=\n\n\[2\]|\n\n## |$)/);
      if (passage) return send({ choices: [{ message: { role: "assistant", content: `From ${passage[1]}: ${passage[2].replace(/\s+/g, " ").replace(/^# \S+ /, "")}` } }], usage });
      const fallback = sys.match(/reply with this message[^:]*: "([^"]+)"/);
      if (fallback && body.tools?.some((t: any) => t.function?.name === "search_knowledge") && last.role !== "tool") {
        return send({ choices: [{ message: { role: "assistant", content: null, tool_calls: [{ id: "call_kb", type: "function", function: { name: "search_knowledge", arguments: JSON.stringify({ query: "refund" }) } }] } }], usage });
      }
      if (fallback) return send({ choices: [{ message: { role: "assistant", content: fallback[1] } }], usage });

      const remembers = sys.includes("Boba") ? " (and how is Boba the cat?)" : "";
      const reply = hasImage ? "ooh i can see your picture! cute ✨" : `hi! you said: ${text}${remembers}`;
      return send({ choices: [{ message: { role: "assistant", content: reply } }], usage });
    }
    send({ error: "not found" }, 404);
  });
  return new Promise((resolve) => {
    server.listen(port, () => {
      const { port: p } = server.address() as AddressInfo;
      resolve({
        url: `http://127.0.0.1:${p}/v1`,
        calls,
        close: () => new Promise((r) => server.close(() => r())),
        setReplyDelay: (ms: number) => void (replyDelay = ms),
      });
    });
  });
}

// Windows-safe entry guard: argv[1] is a plain path (E:\...), not a file:// URL.
const isEntry = (() => {
  try {
    return process.argv[1] ? pathToFileURL(process.argv[1]).href === import.meta.url : false;
  } catch {
    return false;
  }
})();
if (isEntry) {
  const m = await startMockFlatkey(4010);
  console.log(`mock flatkey on ${m.url}`);
}
