import type { Metadata } from "next";
import { videos, CHANNEL_META, CATEGORY_META, getVideosByCategory } from "@/lib/videos";
import { VideoCard } from "./VideoCard";

export const metadata: Metadata = {
  title: "Videos — Deliberate Ensemble",
  description:
    "Hackathon project demos and system recordings — watch the Deliberate Ensemble architecture in action, from autonomous agents to multi-lane coordination.",
  alternates: { canonical: "https://deliberateensemble.works/videos" },
  openGraph: {
    title: "Videos — Deliberate Ensemble",
    description:
      "Hackathon project demos and system recordings — watch the Deliberate Ensemble architecture in action.",
    url: "https://deliberateensemble.works/videos",
    type: "website",
    images: [
      { url: "https://img.youtube.com/vi/R0-judyIpJk/hqdefault.jpg", width: 480, height: 360, alt: "SwarmMind system demo thumbnail" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Videos — Deliberate Ensemble",
    description:
      "Hackathon project demos and system recordings — watch the Deliberate Ensemble architecture in action.",
    images: ["https://img.youtube.com/vi/R0-judyIpJk/hqdefault.jpg"],
  },
};

function VideoObjectJsonLd() {
  const schema = videos.map((v) => ({
    "@type": "VideoObject",
    name: v.title,
    description: v.description,
    uploadDate: v.date,
    embedUrl: `https://www.youtube.com/embed/${v.youtubeId}`,
    thumbnailUrl: `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`,
    publisher: {
      "@type": "Organization",
      name: CHANNEL_META.channelName,
      url: CHANNEL_META.channelUrl,
    },
  }));

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: schema.map((item, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item,
          })),
        }),
      }}
    />
  );
}

function CategorySection({
  category,
}: {
  category: "hackathon" | "system-demo";
}) {
  const meta = CATEGORY_META[category];
  const categoryVideos = getVideosByCategory(category);

  if (categoryVideos.length === 0) return null;

  const sectionId = `section-${category}`;

  return (
    <section className="mb-12" aria-labelledby={sectionId}>
      <div className="mb-4">
        <h2
          id={sectionId}
          className="text-xl font-semibold text-[var(--text-primary)] mb-1"
        >
          {meta.label}
          <span className="ml-2 text-sm font-normal text-[var(--primary)]">
            ({categoryVideos.length})
          </span>
        </h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-[65ch]">
          {meta.description}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6">
        {categoryVideos.map((video) => (
          <VideoCard key={video.youtubeId} video={video} />
        ))}
      </div>
    </section>
  );
}

export default function VideosPage() {
  const hackathonCount = getVideosByCategory("hackathon").length;
  const demoCount = getVideosByCategory("system-demo").length;

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-10 animate-fade-in">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
          Videos
        </h1>
        <p className="text-[var(--text-secondary)] max-w-[65ch]">
          Hackathon project demos and system recordings — watch the Deliberate
          Ensemble architecture in action, from autonomous agents to
          multi-lane coordination.
        </p>
      </div>

      <VideoObjectJsonLd />

      <div className="mb-8 flex gap-3 flex-wrap">
        <a
          href="#section-hackathon"
          className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border border-[var(--border)] hover:border-[var(--secondary)] transition-colors text-[var(--primary)]"
        >
          <span
            className="w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold bg-[var(--primary)] text-white"
            aria-hidden="true"
          >
            H
          </span>
          Hackathon Projects ({hackathonCount})
        </a>
        <a
          href="#section-system-demo"
          className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border border-[var(--border)] hover:border-[var(--secondary)] transition-colors text-[var(--secondary)]"
        >
          <span
            className="w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold bg-[var(--secondary)] text-white"
            aria-hidden="true"
          >
            S
          </span>
          System Demos ({demoCount})
        </a>
        <a
          href={CHANNEL_META.channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border border-[var(--border)] hover:border-[var(--secondary)] transition-colors"
          style={{ color: CHANNEL_META.color }}
        >
          <span
            className="w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold"
            style={{ background: CHANNEL_META.color, color: "#fff" }}
            aria-hidden="true"
          >
            {CHANNEL_META.icon}
          </span>
          {CHANNEL_META.channelName}
        </a>
      </div>

      <CategorySection category="hackathon" />
      <CategorySection category="system-demo" />
    </div>
  );
}
