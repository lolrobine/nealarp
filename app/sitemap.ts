import type { MetadataRoute } from "next";
import { getLiveExperiences } from "@/lib/registry/experiences";

export const dynamic = "force-static";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://example.com");

export default function sitemap(): MetadataRoute.Sitemap {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const withBase = (p: string) => `${baseUrl}${basePath}${p}`;

  const staticRoutes = [
    {
      url: withBase("/"),
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1,
    },
  ];

  const experienceRoutes = getLiveExperiences().map((exp) => ({
    url: withBase(`/${exp.id}`),
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...experienceRoutes];
}
