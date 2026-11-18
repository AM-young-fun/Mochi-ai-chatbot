import { mcpNoStream, mcpPost } from "@/lib/blog-mcp-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// For clients that only take a URL (claude.ai custom connectors, Grok's app): the key is in the path.
export async function POST(req: Request, { params }: { params: Promise<{ key: string }> }) {
  return mcpPost(req, (await params).key);
}
export const GET = mcpNoStream;
export const DELETE = mcpNoStream;
