import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // For GitHub Pages - remove this line if deploying elsewhere
  basePath: "/nealarp",
  assetPrefix: "/nealarp",
};

export default nextConfig;
