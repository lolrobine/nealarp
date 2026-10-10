import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const isVercel = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
const isGitHubPagesBuild = isProd && !isVercel;
const publicBasePath = isGitHubPagesBuild ? "/nealarp" : "";

const nextConfig: NextConfig = {
  output: isGitHubPagesBuild ? "export" : undefined,
  images: {
    unoptimized: true,
  },
  // GitHub Pages needs a subpath and static export; Vercel uses standard Next.js routing.
  ...(isGitHubPagesBuild
    ? { basePath: publicBasePath, assetPrefix: publicBasePath }
    : {}),
  // Prefix public asset URLs for the GitHub Pages subpath deployment.
  env: {
    NEXT_PUBLIC_BASE_PATH: publicBasePath,
  },
  // Allow dev preview from e2b sandbox
  allowedDevOrigins: ["*.e2b.app"],
};

export default nextConfig;
