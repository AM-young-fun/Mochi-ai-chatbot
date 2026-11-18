# Blog MCP: write and publish posts on www.mochichatbot.com/blog

An MCP server built into the website. Any MCP client (your Grok bot, claude.ai, Claude Desktop, Claude Code)
can research existing posts, write a post, check its SEO, save it as a draft with a private preview link,
and publish it once you approve.

- Endpoint: `https://www.mochichatbot.com/api/mcp` (Streamable HTTP, JSON responses, no sessions)
- Code: `website/lib/blog-mcp.ts` (tools), `blog-md.ts` (Markdown, SEO check), `blog-store.ts` (GitHub),
  `blog-mcp-http.ts` + `app/api/mcp/` (HTTP), `app/(en)/blog/preview/` (draft preview)
- Posts: `website/content/blog/<slug>.md` on `main`. Drafts: `website/content/blog-drafts/<slug>.md` on the
  `blog-drafts` branch (made automatically, never deployed).

## Tools

| Tool | What it does |
|---|---|
| `blog_guidelines` | Facts about Mochi, audience, house rules, link shortcuts, workflow. The bot should read it first. |
| `list_posts` | Published posts and drafts with their main keyword, to avoid repeating a topic. |
| `get_post` | One post or draft in full, with its SEO report and link. |
| `seo_check` | Scores a post: errors (block saving) and warnings. Saves nothing. |
| `save_draft` | Saves a draft and returns a private preview link. Refused while there are errors. |
| `publish_post` | Publishes a draft (today, or on a future date). Live in about 3 minutes. |
| `update_post` | Changes a draft or a published post (published ones get a new "updated" date). |
| `delete_draft` | Deletes a draft. Published posts can't be deleted from the MCP. |

Safety rails: drafts never touch the live site; publishing needs a draft that passes the SEO check; at most
2 posts a day (`BLOG_MAX_PER_DAY`); raw HTML in a post is shown as text; Flatkey links get UTM tags through
the `{{flatkey}}` shortcut; the preview link's key works for that one draft only.

SEO check errors: bad slug, title outside 20–70 characters, description outside 70–170, under 400 words,
no keyword, HTML tags like `<script>`, no mention of Flatkey. Warnings: title over 60, description outside
120–160, main keyword missing from title/description/first paragraph/headings, keyword stuffing, fewer than
two `##` headings or two internal links, em dashes, a credit offer other than $1, untracked Flatkey links,
very long paragraphs, and a post that competes with an existing one.

## Setup (once)

1. **GitHub token.** github.com → Settings → Developer settings → Fine-grained tokens → Generate. Repository
   access: only `AM-young-fun/Mochi-ai-chatbot`. Permissions: **Contents: Read and write** (Metadata: read is
   added automatically). Pick an expiry and set a reminder to renew it.
2. **MCP key.** Any long random string, e.g. `openssl rand -hex 32`.
3. **Vercel.** The website's Vercel project → Settings → Environment Variables → add for Production:
   - `BLOG_MCP_TOKEN` = the MCP key
   - `BLOG_GITHUB_TOKEN` = the GitHub token
   - optional `BLOG_MAX_PER_DAY` = 2
4. **Redeploy** so the variables load: GitHub → Actions → website → Run workflow (or push anything under `website/`).
5. **Check:** `curl -s -X POST https://www.mochichatbot.com/api/mcp -H "authorization: Bearer $KEY" -H "content-type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_posts","arguments":{}}}'`

Treat the MCP key like a password: anyone with it can publish to the blog. To rotate it, change
`BLOG_MCP_TOKEN` in Vercel, redeploy, and update your clients.

## Connect a client

**Grok API (xAI SDK, Python)**

```python
from xai_sdk import Client
from xai_sdk.chat import user
from xai_sdk.tools import mcp

client = Client(api_key=os.environ["XAI_API_KEY"])
chat = client.chat.create(
    model="grok-4.3",
    tools=[mcp(
        server_url="https://www.mochichatbot.com/api/mcp",
        server_label="mochi_blog",
        server_description="Write, SEO-check, draft and publish posts on the Mochi blog",
        authorization=os.environ["BLOG_MCP_TOKEN"],
    )],
)
chat.append(user(DAILY_PROMPT))
print(chat.sample().content)
```

**Grok API (Responses API, curl)**: add to `tools`:
`{"type":"mcp","server_url":"https://www.mochichatbot.com/api/mcp","server_label":"mochi_blog","authorization":"<BLOG_MCP_TOKEN>"}`

**Clients that only take a URL** (claude.ai → Settings → Connectors → Add custom connector, Grok's custom
connectors): use `https://www.mochichatbot.com/api/mcp/<BLOG_MCP_TOKEN>` and no authentication.

**Claude Code**: `claude mcp add --transport http mochi-blog https://www.mochichatbot.com/api/mcp --header "Authorization: Bearer <BLOG_MCP_TOKEN>"`

**Claude Desktop**: add it as a custom connector with the URL form above, or in `claude_desktop_config.json`:

```json
{ "mcpServers": { "mochi-blog": { "command": "npx", "args": ["-y", "mcp-remote", "https://www.mochichatbot.com/api/mcp", "--header", "Authorization: Bearer <BLOG_MCP_TOKEN>"] } } }
```

## Daily flow: draft every day, you approve

Run this once a day (cron, your Grok bot's scheduler, or a scheduled task), then reply "publish" to the one
you like:

```text
DAILY_PROMPT:
You write one post a day for the Mochi blog using the mochi_blog tools.
1. Call blog_guidelines and follow it exactly. Call list_posts.
2. Pick one search phrase people really type that no existing post targets (companion-app alternatives,
   Discord/Telegram bot how-tos, AI chatbot with memory, self-hosting, costs, knowledge-base bots for small
   businesses). Prefer specific, lower-competition phrases.
3. Write 900-1,400 words in Markdown with a FAQ section, run seo_check, fix every error and most warnings.
4. save_draft. Do NOT publish.
5. Reply with: the main keyword, the title, the description, the preview link, and the SEO score.
When I answer "publish <slug>", call publish_post for that slug and send me the live URL.
```

Posts with a future `date` are committed right away and appear on that day after the site's daily
rebuild (the website workflow runs every day at 13:07 UTC).
