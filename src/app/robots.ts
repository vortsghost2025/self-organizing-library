import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/api/salon"],
      disallow: "/api/",
    },
    sitemap: "https://deliberateensemble.works/sitemap.xml",
  };
}
