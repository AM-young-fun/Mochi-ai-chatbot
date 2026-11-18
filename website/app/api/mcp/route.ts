import { mcpNoStream, mcpPost } from "@/lib/blog-mcp-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const POST = (req: Request) => mcpPost(req);
export const GET = mcpNoStream;
export const DELETE = mcpNoStream;
