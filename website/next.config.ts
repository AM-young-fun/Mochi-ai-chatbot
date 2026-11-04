import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // English lives at the root; send /en there instead of a 404.
  // The installers are fetched with curl/irm and piped into a shell: serve them as UTF-8 text.
  async headers() {
    return ["/install.sh", "/install.ps1", "/install-vps.sh"].map((source) => ({
      source,
      headers: [
        { key: "Content-Type", value: "text/plain; charset=utf-8" },
        { key: "Cache-Control", value: "public, max-age=300" },
      ],
    }));
  },
  async redirects() {
    return [
      { source: "/en", destination: "/", permanent: true },
      // One host for SEO: the apex domain goes to www in a single permanent redirect.
      { source: "/:path*", has: [{ type: "host", value: "mochichatbot.com" }], destination: "https://www.mochichatbot.com/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
