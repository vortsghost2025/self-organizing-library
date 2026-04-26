import { videos, CHANNEL_META, CATEGORY_META, getVideosByCategory, type VideoEntry } from "@/lib/videos";

function VideoEmbed({ video }: { video: VideoEntry }) {
  const embedUrl = `https://www.youtube.com/embed/${video.youtubeId}`;
  const watchUrl = `https://www.youtube.com/watch?v=${video.youtubeId}`;
  const thumbnailUrl = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;

  return (
    <article className="card p-5 hover:border-[var(--secondary)] animate-fade-in">
      <div className="mb-4">
        <div
          className="relative w-full overflow-hidden rounded-lg"
          style={{ aspectRatio: "16 / 9" }}
        >
          <iframe
            src={embedUrl}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className="absolute inset-0 w-full h-full border-0"
          />
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
          <VideoEmbed key={video.youtubeId} video={video} />
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
