// Share card for one blog post (1200x630): Mochi's art on the right (public/og/blog-bg.png), the post title on
// the left. Drawn at build time for opengraph-image and twitter-image under app/(en)/blog/[slug]/.
import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { postBySlug } from "./blog";

export const OG_SIZE = { width: 1200, height: 630 };

function file(rel: string): Buffer {
  const a = path.join(process.cwd(), rel);
  return fs.readFileSync(fs.existsSync(a) ? a : path.join(process.cwd(), "website", rel));
}

export function postCard(slug: string): ImageResponse {
  const post = postBySlug(slug);
  const title = post?.title ?? "Mochi blog";
  const size = title.length > 80 ? 40 : title.length > 56 ? 46 : 54;
  const bg = `data:image/png;base64,${file("public/og/blog-bg.png").toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: "flex", position: "relative", fontFamily: "Inter" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bg} width={1200} height={630} alt="" style={{ position: "absolute", top: 0, left: 0 }} />
        <div style={{ position: "absolute", left: 64, top: 160, width: 520, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 24, fontWeight: 600, color: "#853bce", marginBottom: 16 }}>
            {`Mochi blog${post ? ` · ${post.minutes} min read` : ""}`}
          </div>
          <div style={{ fontSize: size, fontWeight: 800, color: "#2a2233", lineHeight: 1.16, letterSpacing: -0.5 }}>{title}</div>
        </div>
        <div style={{ position: "absolute", left: 64, bottom: 40, display: "flex", alignItems: "center", fontSize: 22, fontWeight: 600, color: "#7a6f86" }}>
          <span>mochichatbot.com/blog</span>
          <span style={{ marginLeft: 20, padding: "6px 14px", borderRadius: 18, background: "#2a2233", color: "#fff" }}>Powered by flatkey</span>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Inter", data: file("assets/fonts/Inter-ExtraBold.otf"), weight: 800, style: "normal" },
        { name: "Inter", data: file("assets/fonts/Inter-SemiBold.otf"), weight: 600, style: "normal" },
      ],
    },
  );
}
