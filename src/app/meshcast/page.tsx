"use client";

import { useState } from "react";
import Link from "next/link";
import { videos } from "@/lib/videos";

export default function MeshCastPage() {
  const [activeVideoId, setActiveVideoId] = useState<string | null>("uFc5eaMikHw");

  const socialLinks = [
    {
      name: "YouTube Channel",
      url: "https://www.youtube.com/@seandavidramsingh-s9z",
      icon: "▶",
      badge: "@seandavidramsingh-s9z",
      color: "border-red-500/40 bg-red-950/20 text-red-400 hover:border-red-400",
      description: "Full episodes, live system demos, and architectural deep dives.",
    },
    {
      name: "YouTube Playlist Series",
      url: "https://www.youtube.com/watch?v=uFc5eaMikHw&list=PLN7turBX1jxo",
      icon: "📋",
      badge: "Playlist Series",
      color: "border-red-600/40 bg-red-950/20 text-red-300 hover:border-red-400",
      description: "Curated multi-agent engineering and governance video series.",
    },
    {
      name: "TikTok Hub",
      url: "https://www.tiktok.com/@we4free",
      icon: "🎵",
      badge: "@we4free",
      color: "border-pink-500/40 bg-pink-950/20 text-pink-400 hover:border-pink-400",
      description: "Bite-sized architecture clips, AI tool demos, and community updates.",
    },
    {
      name: "Facebook Community",
      url: "https://www.facebook.com/profile.php?id=61588086602067",
      icon: "📘",
      badge: "Community",
      color: "border-blue-500/40 bg-blue-950/20 text-blue-400 hover:border-blue-400",
      description: "Discussions, event notifications, and ecosystem announcements.",
    },
    {
      name: "Instagram",
      url: "https://www.instagram.com/we_framework/?__pwa=1",
      icon: "📸",
      badge: "@we_framework",
      color: "border-purple-500/40 bg-purple-950/20 text-purple-400 hover:border-purple-400",
      description: "Behind-the-scenes engineering snippets and visual updates.",
    },
    {
      name: "OSF Research Preprints",
      url: "https://osf.io/n3tya",
      icon: "🔬",
      badge: "Open Science",
      color: "border-cyan-500/40 bg-cyan-950/20 text-cyan-400 hover:border-cyan-400",
      description: "Permanent DOI preprints and formal mathematical empirical studies.",
    },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-10" data-pagefind-body>
      {/* Header Banner */}
      <div className="space-y-4 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider">
          <span>🎙️ MeshCast Audio &amp; Video Studio</span>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight">
              MeshCast Podcast
            </h1>
            <p className="text-base md:text-xl text-[var(--text-secondary)] mt-2 max-w-3xl leading-relaxed">
              Exploring the frontier of autonomous multi-agent systems, constitutional AI governance,
              and verifiable human-AI collaboration — hosted by <strong>Sean David Ramsingh</strong>.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <a
              href="https://www.youtube.com/@seandavidramsingh-s9z"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs md:text-sm font-bold transition-all inline-flex items-center gap-2 shadow-lg"
            >
              <span>▶ Subscribe on YouTube</span>
              <span aria-hidden="true">↗</span>
            </a>
            <a
              href="https://www.tiktok.com/@we4free"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs md:text-sm font-bold transition-all inline-flex items-center gap-2 shadow-lg"
            >
              <span>🎵 Follow on TikTok</span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>

        {/* Theme Pills */}
        <div className="flex flex-wrap gap-2 pt-2">
          {["Multi-Agent AI", "Constitutional Governance", "Autonomous Swarms", "Wave Terminal & MCP", "Offline Public Goods", "Research & Preprints"].map(
            (pill) => (
              <span
                key={pill}
                className="text-xs font-mono px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-muted)]"
              >
                ✦ {pill}
              </span>
            )
          )}
        </div>
      </div>

      {/* Featured Video Player & Studio Stage */}
      <section className="card p-6 md:p-8 space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
              Interactive Media Player
            </h2>
          </div>
          <a
            href="https://www.youtube.com/watch?v=uFc5eaMikHw&list=PLN7turBX1jxo"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-red-400 hover:underline inline-flex items-center gap-1"
          >
            <span>Open Series Playlist</span>
            <span>↗</span>
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Embed Player */}
          <div className="lg:col-span-2 aspect-video w-full rounded-xl overflow-hidden bg-black/90 border border-white/10 shadow-2xl relative">
            {activeVideoId ? (
              <iframe
                src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1`}
                title="MeshCast Featured Video"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                <span className="text-4xl">🎬</span>
                <span>Select an episode to begin playing</span>
              </div>
            )}
          </div>

          {/* Episode Selection Playlist */}
          <div className="flex flex-col space-y-3 overflow-y-auto max-h-[420px] pr-1">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Available Episodes &amp; Demos ({videos.length}):
            </div>
            {videos.map((vid) => {
              const isCurrent = activeVideoId === vid.youtubeId;
              return (
                <button
                  key={vid.youtubeId}
                  onClick={() => setActiveVideoId(vid.youtubeId)}
                  className={`text-left p-3.5 rounded-xl border transition-all flex flex-col space-y-1.5 ${
                    isCurrent
                      ? "bg-purple-950/40 border-purple-500/60 shadow-md ring-1 ring-purple-500/40"
                      : "bg-[var(--bg-surface-hover)] border-[var(--border)] hover:border-purple-500/30"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className={isCurrent ? "text-purple-300 font-bold" : "text-slate-400"}>
                      {isCurrent ? "▶ PLAYING NOW" : "○ EPISODE"}
                    </span>
                    <span className="text-slate-400">{vid.date}</span>
                  </div>
                  <div className="text-xs md:text-sm font-semibold text-[var(--text-primary)] line-clamp-2">
                    {vid.title}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-[var(--text-muted)]">
                      {vid.category === "hackathon" ? "🏆 Hackathon" : "⚡ System Demo"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* About MeshCast Statement */}
      <section className="card p-6 md:p-8 space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] animate-fade-in">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          About The MeshCast Philosophy
        </h2>
        <div className="prose prose-invert max-w-none text-[var(--text-secondary)] space-y-4 text-base leading-relaxed">
          <p>
            <strong>MeshCast</strong> is an independent technical media series dedicated to investigating
            how artificial intelligence systems evolve from fragile single-prompt bots into resilient,
            multi-agent autonomous ensembles.
          </p>
          <p>
            Hosted by <strong>Sean David Ramsingh</strong>, discussions and video demonstrations focus on
            practical systems engineering: terminal multiplexing with <strong>Wave Terminal</strong>,
            low-overhead LLM context sandboxing with <strong>Context-Mode</strong>, desktop agent telemetry
            with <strong>Kilo</strong>, and formal mathematical consensus gates detailed in the <em>Rosetta Stone</em> series.
          </p>
        </div>
      </section>

      {/* Social & Streaming Channels Grid */}
      <section className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
            Connect Across Channels
          </h2>
          <span className="text-xs text-[var(--text-muted)] font-mono">
            {socialLinks.length} Active Platforms
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {socialLinks.map((social) => (
            <a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`card p-6 rounded-2xl border transition-all flex flex-col justify-between group ${social.color}`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{social.icon}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 font-bold uppercase">
                    {social.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-white transition-colors">
                  {social.name}
                </h3>
                <p className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed">
                  {social.description}
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold">
                <span className="group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                  <span>Visit Platform</span>
                  <span>↗</span>
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Navigation Quick Links */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-[var(--border)]">
        <Link
          href="/"
          className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex items-center gap-2"
        >
          <span>← Back to Home</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/videos"
            className="text-sm font-semibold text-[var(--primary)] hover:underline inline-flex items-center gap-1"
          >
            <span>All Videos Archive</span>
            <span>→</span>
          </Link>
          <Link
            href="/graph"
            className="text-sm font-semibold text-[var(--secondary)] hover:underline inline-flex items-center gap-1"
          >
            <span>Nexus Observatory</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}