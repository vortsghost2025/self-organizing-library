import type { MetadataRoute } from "next";

const BLOCKED_BOTS = [
  "GPTBot",
  "CCBot",
  "Bytespider",
  "ClaudeBot",
  "Amazonbot",
  "PetalBot",
  "AhrefsBot",
  "SemrushBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      ...BLOCKED_BOTS.map((userAgent) => ({ userAgent, disallow: "/" })),
      {
        userAgent: "*",
        allow: "/",
        disallow: "/api/",
      },
    ],
    sitemap: "https://deliberateensemble.works/sitemap.xml",
  };
}
