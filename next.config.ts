import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      { source: "/apple-touch-icon.png", destination: "/favicon.ico" },
      { source: "/apple-touch-icon-precomposed.png", destination: "/favicon.ico" },
    ];
  },
};

export default nextConfig;
