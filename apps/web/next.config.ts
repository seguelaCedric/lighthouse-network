import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@lighthouse/ai"],

  // Match WordPress URL behavior (trailing slashes)
  trailingSlash: true,

  // Image optimization for external domains
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lighthouse-careers.com",
      },
      {
        protocol: "https",
        hostname: "www.lighthouse-careers.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
