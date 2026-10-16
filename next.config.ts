import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

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
  ...(isGitHubPagesBuild ? { basePath: publicBasePath, assetPrefix: publicBasePath } : {}),
  // Prefix public asset URLs for the GitHub Pages subpath deployment.
  env: {
    NEXT_PUBLIC_BASE_PATH: publicBasePath,
  },
  // Allow dev preview from e2b sandbox — only in dev, not prod
  ...(isProd
    ? {}
    : {
        allowedDevOrigins: ["*.e2b.app"],
      }),
  // Security headers when deployed on Vercel (headers() is ignored for static export)
  ...(isGitHubPagesBuild
    ? {}
    : {
        async headers() {
          return [
            {
              source: "/(.*)",
              headers: [
                // Permit the embedded sandbox preview in development; production remains protected.
                ...(isProd ? [{ key: "X-Frame-Options", value: "DENY" }] : []),
                {
                  key: "X-Content-Type-Options",
                  value: "nosniff",
                },
                {
                  key: "Referrer-Policy",
                  value: "strict-origin-when-cross-origin",
                },
                {
                  key: "Permissions-Policy",
                  value: "camera=(), microphone=(), geolocation=()",
                },
              ],
            },
          ];
        },
      }),
};

export default withBundleAnalyzer(nextConfig);
