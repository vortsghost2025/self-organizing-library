"use client";

import { useState, useCallback } from "react";
import type { VideoEntry } from "@/lib/videos";
import { CHANNEL_META } from "@/lib/videos";

interface VideoCardProps {
  video: VideoEntry;
}

export function VideoCard({ video }: VideoCardProps) {
  const [loaded, setLoaded] = useState(false);
  const thumbnailUrl = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`;
  const watchUrl = `https://www.youtube.com/watch?v=${video.youtubeId}`;

  const handlePlay = useCallback(() => {
    setLoaded(true);
  }, []);

  return (
    <article className="card p-5 hover:border-[var(--secondary)] animate-fade-in">
      <div className="mb-4">
        <div
          className="relative w-full overflow-hidden rounded-lg"
          style={{ aspectRatio: "16 / 9" }}
        >
          {loaded ? (
            <iframe
              src={embedUrl}
              title={`YouTube video: ${video.title}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full border-0"
            />
          ) : (
            <button
              type="button"
              onClick={handlePlay}
              aria-label={`Play video: ${video.title}`}
              className="absolute inset-0 w-full h-full cursor-pointer border-0 p-0 bg-transparent group"
            >
              <img
                src={thumbnailUrl}
                alt={`Thumbnail for: ${video.title}`}
                width={480}
                height={360}
                loading="lazy"
                className="w-full h-full object-cover"
              />
              <span
                className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors"
                aria-hidden="true"
              >
                <span className="w-16 h-16 rounded-full bg-[#FF0000] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg
                    viewBox="0 0 24 24"
                    fill="white"
                    width="28"
                    height="28"
                    aria-hidden="true"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </span>
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{
            background: `${CHANNEL_META.color}20`,
            color: CHANNEL_META.color,
          }}
        >
          <span
            className="w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold"
            style={{ background: CHANNEL_META.color, color: "#fff" }}
            aria-hidden="true"
          >
            {CHANNEL_META.icon}
          </span>
          {CHANNEL_META.label}
        </span>
        <span className="text-xs text-[var(--text-muted)]">
          {new Date(video.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
        {video.title}
      </h3>
      <p className="text-sm text-[var(--text-muted)] mb-3 max-w-[65ch]">
        {video.description}
      </p>
      <div className="flex items-center gap-3 flex-wrap">
        {video.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]"
          >
            {tag}
          </span>
        ))}
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-[var(--secondary)] hover:underline ml-auto"
        >
          Watch on YouTube &rarr;
        </a>
      </div>
    </article>
  );
}
