import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: isProd ? "export" : undefined,
  images: {
    unoptimized: true,
  },
  // Only apply basePath for GitHub Pages (production static export)
  ...(isProd ? {
    basePath: "/nealarp",
    assetPrefix: "/nealarp",
  } : {}),
  // Allow dev preview from e2b sandbox
  allowedDevOrigins: ["*.e2b.app"],
};

export default nextConfig;
