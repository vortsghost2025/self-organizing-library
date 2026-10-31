import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
  outputFileTracingExcludes: {
    '*': [
      '**/.git/**',
      '**/data/snapshots/**',
      '**/evidence/**',
      '**/lanes/**',
      '**/docs/**',
      '**/library/**',
      '**/public/pagefind/**',
      '**/tests/**',
      '**/scripts/**',
      '**/node_modules/@swc/**',
      '**/node_modules/esbuild/**',
      '**/.next/cache/**',
      '**/*.png',
      '**/*.jpg',
      '**/*.jpeg',
      '**/*.gif',
      '**/*.webp',
    ],
  },
  async headers() {
    const longCache = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];
    return [
      { source: "/pagefind/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=86400, s-maxage=604800" }] },
      { source: "/:file*.(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2)", headers: longCache },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2678400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
    ],
  },
};

export default nextConfig;
