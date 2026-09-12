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
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
    ],
  },
};

export default nextConfig;
