"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { videos } from "@/lib/videos";

export function MediaCreatorSection() {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  return (
    <section className="space-y-8 animate-fade-in" aria-label="Media and Creator Showcase">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold uppercase tracking-wider mb-2">
            <span>🎙️ Media, Demos &amp; Podcasts</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
            MeshCast &amp; Video Demonstrations
          </h2>
          <p className="text-sm md:text-base text-[var(--text-secondary)] mt-1.5 max-w-3xl leading-relaxed">
            Follow the engineering journey across technical video demos, deep-dive discussions on MeshCast,
            and short-form architecture breakdowns on YouTube and TikTok.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href="https://www.youtube.com/@seandavidramsingh-s9z"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs md:text-sm font-bold transition-all inline-flex items-center gap-2 shadow-md"
          >
            <span>▶ Subscribe on YouTube</span>
            <span aria-hidden="true">↗</span>
          </a>
          <a
            href="https://www.tiktok.com/@we4free"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs md:text-sm font-bold transition-all inline-flex items-center gap-2 shadow-md"
          >
            <span>🎵 TikTok @we4free</span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>

      {/* Media Platforms Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* MeshCast Podcast Card */}
        <div className="card p-6 border border-purple-500/30 bg-purple-950/20 hover:border-purple-400/60 transition-all rounded-2xl flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-3xl">🎙️</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/30 font-bold uppercase">
                Audio &amp; Video Series
              </span>
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
              MeshCast Podcast
            </h3>
            <p className="text-xs md:text-sm text-purple-200/80 leading-relaxed">
              In-depth technical conversations exploring sovereign AI agents, autonomous tool orchestration,
              and verifiable multi-agent consensus frameworks.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-purple-500/20 flex items-center justify-between">
            <Link
              href="/meshcast"
              className="text-xs font-bold text-purple-300 hover:text-white inline-flex items-center gap-1.5"
            >
              <span>Explore MeshCast Page</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* YouTube Channel & Series Playlist */}
        <div className="card p-6 border border-red-500/30 bg-red-950/20 hover:border-red-400/60 transition-all rounded-2xl flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-3xl text-red-500">▶</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-200 border border-red-500/30 font-bold uppercase">
                Main Channel
              </span>
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-red-300 transition-colors">
              YouTube Channel &amp; Series Playlist
            </h3>
            <p className="text-xs md:text-sm text-red-200/80 leading-relaxed">
              Complete live demonstrations of autonomous agent swarms, terminal streaming, Elasticsearch tuning agents,
              and curated technical playlist walkthroughs.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-red-500/20 flex items-center justify-between">
            <a
              href="https://www.youtube.com/watch?v=uFc5eaMikHw&list=PLN7turBX1jxo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-red-300 hover:text-white inline-flex items-center gap-1.5"
            >
              <span>Open YouTube Series Playlist</span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>

        {/* TikTok Short-Form Hub */}
        <div className="card p-6 border border-pink-500/30 bg-pink-950/20 hover:border-pink-400/60 transition-all rounded-2xl flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-3xl">🎵</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-200 border border-pink-500/30 font-bold uppercase">
                Short-Form Content
              </span>
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-pink-300 transition-colors">
              TikTok @we4free
            </h3>
            <p className="text-xs md:text-sm text-pink-200/80 leading-relaxed">
              Bite-sized architecture clips, AI tool demos, and community updates highlighting the WE4FREE
              offline crisis directory and developer workflows.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-pink-500/20 flex items-center justify-between">
            <a
              href="https://www.tiktok.com/@we4free"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-pink-300 hover:text-white inline-flex items-center gap-1.5"
            >
              <span>Watch on TikTok</span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </div>

      {/* Featured YouTube Video Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
            <span>📹 Technical System Demos</span>
            <span className="text-xs font-mono font-normal text-slate-400">({videos.length} Published Videos)</span>
          </h3>
          <Link
            href="/videos"
            className="text-xs font-semibold text-cyan-300 hover:underline inline-flex items-center gap-1"
          >
            <span>View All Video Archives</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {videos.slice(0, 3).map((video) => {
            const isPlaying = activeVideoId === video.youtubeId;
            const thumbUrl = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;

            return (
              <div
                key={video.youtubeId}
                className="card border border-white/10 bg-[var(--bg-surface)] rounded-2xl overflow-hidden flex flex-col justify-between hover:border-white/25 transition-all group"
              >
                {/* Video Player or Thumbnail */}
                <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                  {isPlaying ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`}
                      title={video.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <button
                      onClick={() => setActiveVideoId(video.youtubeId)}
                      className="w-full h-full relative cursor-pointer group/btn"
                      aria-label={`Play video: ${video.title}`}
                    >
                      <img
                        src={thumbUrl}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover/btn:scale-105 transition-transform duration-300 opacity-90 group-hover/btn:opacity-100"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover/btn:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover/btn:scale-110 group-hover/btn:bg-red-500 transition-all">
                          <span className="text-xl ml-0.5">▶</span>
                        </div>
                      </div>
                      <span className="absolute bottom-2 right-2 text-[10px] font-mono px-2 py-0.5 rounded bg-black/80 text-white font-bold">
                        {video.category === "hackathon" ? "🏆 HACKATHON" : "⚡ SYSTEM DEMO"}
                      </span>
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="text-[11px] font-mono text-slate-400 mb-1">{video.date}</div>
                    <h4 className="font-bold text-sm md:text-base text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
                      {video.title}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-1.5 line-clamp-3 leading-relaxed">
                      {video.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {video.tags.slice(0, 2).map((t) => (
                        <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400">
                          #{t}
                        </span>
                      ))}
                    </div>
                    <a
                      href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-red-400 hover:text-red-300 inline-flex items-center gap-1"
                    >
                      <span>YouTube</span>
                      <span aria-hidden="true">↗</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
