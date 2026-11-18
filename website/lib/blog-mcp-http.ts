// HTTP side of the blog MCP (app/api/mcp/*): auth, env settings and JSON-RPC over POST.
import { handleRpc, keyMatches, type McpContext } from "./blog-mcp";
import { GitHubStore } from "./blog-store";

/**
 * Settings, from the Vercel project's environment variables:
 *   BLOG_MCP_TOKEN     the secret that opens the MCP (at least 24 characters).
 *   BLOG_GITHUB_TOKEN  a fine-grained GitHub token for AM-young-fun/Mochi-ai-chatbot with Contents: read and write.
 *   BLOG_MAX_PER_DAY   optional, most posts published per day (default 2).
 */
export function mcpContext(): McpContext | string {
  const secret = process.env.BLOG_MCP_TOKEN?.trim() ?? "";
  const gh = process.env.BLOG_GITHUB_TOKEN?.trim() ?? "";
  if (secret.length < 24) return "BLOG_MCP_TOKEN isn't set (or is shorter than 24 characters) on the website's Vercel project.";
  if (!gh) return "BLOG_GITHUB_TOKEN isn't set on the website's Vercel project.";
  const max = Number(process.env.BLOG_MAX_PER_DAY);
  return { store: new GitHubStore(gh), previewSecret: secret, maxPerDay: Number.isFinite(max) && max > 0 ? max : 2 };
}

const json = (body: unknown, status = 200) =>
  new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", "x-robots-tag": "noindex" },
  });

/** POST /api/mcp (key in "Authorization: Bearer …") or /api/mcp/<key> (for clients that only take a URL). */
export async function mcpPost(req: Request, pathKey?: string): Promise<Response> {
  const ctx = mcpContext();
  if (typeof ctx === "string") return json({ jsonrpc: "2.0", id: null, error: { code: -32000, message: ctx } }, 503);
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!keyMatches(pathKey ?? bearer, process.env.BLOG_MCP_TOKEN!.trim())) {
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32001, message: "Unauthorized" } }), {
      status: 401,
      headers: { "content-type": "application/json", "www-authenticate": 'Bearer realm="mochi-blog"' },
    });
  }
  let body: unknown;
  try { body = await req.json(); } catch { return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, 400); }
  if (Array.isArray(body)) {
    const out = (await Promise.all(body.map((m) => handleRpc(m, ctx)))).filter(Boolean);
    return out.length ? json(out) : new Response(null, { status: 202 });
  }
  const out = await handleRpc(body as object, ctx);
  return out ? json(out) : new Response(null, { status: 202 });
}

/** No server-sent event stream: every answer comes back on the POST. */
export const mcpNoStream = () => new Response("Use POST (MCP Streamable HTTP, JSON responses).", { status: 405, headers: { allow: "POST" } });
