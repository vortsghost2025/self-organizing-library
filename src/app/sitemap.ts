import type { MetadataRoute } from "next";
import { getSiteIndex } from "@/lib/site-index";

const BASE_URL = "https://deliberateensemble.works";

export default function sitemap(): MetadataRoute.Sitemap {
  const index = getSiteIndex();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/library`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/repos`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/graph`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/papers`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/logs`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/start-here`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/governance`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/search-catalog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.5 },
  ];

  const coreEntries = index.entries.filter(
    (e) =>
      e.content_type === "paper" ||
      e.category === "paper" ||
      e.category === "verification" ||
      e.category === "governance" ||
      e.category === "spec" ||
      (e.content_type === "doc" && e.tags.length >= 2)
  );

  const docPages: MetadataRoute.Sitemap = coreEntries.map((e) => ({
    url: `${BASE_URL}/library/${e.id}`,
    lastModified: new Date(e.modified),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...docPages];
}
