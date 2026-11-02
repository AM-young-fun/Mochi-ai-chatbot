import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // English lives at the root; send /en there instead of a 404.
  async redirects() {
    return [
      { source: "/en", destination: "/", permanent: true },
      // One host for SEO: the apex domain goes to www in a single permanent redirect.
      { source: "/:path*", has: [{ type: "host", value: "mochichatbot.com" }], destination: "https://www.mochichatbot.com/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
