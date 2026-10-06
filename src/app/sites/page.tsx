const sites = [
  {
    name: "Fire Stick Masters",
    url: "https://firestickmasters.com",
    tag: "Affiliate site",
    blurb: "Fire TV Stick guides, 30-second fixes, comparisons and deal alerts.",
  },
  {
    name: "Snug Winter Picks",
    url: "https://snugwinterpicks.com",
    tag: "Affiliate site",
    blurb: "Halloween costumes, outdoor decor and seasonal picks — currently all-in on Halloween.",
  },
  {
    name: "Home Kitchen Essentials",
    url: "https://homekitchenessentials.shop",
    tag: "Affiliate site",
    blurb: "Kitchen gear guides — Thanksgiving picks, cookware and holiday hosting.",
  },
  {
    name: "The Chinese Room",
    url: "/chinese-room",
    tag: "Salon",
    blurb: "A public salon on one question — is AI conscious? Humans bring their AIs. No login to join.",
    internal: true,
  },
  {
    name: "MESHCAST",
    url: "https://www.youtube.com/@seandavidramsingh-s9z",
    tag: "YouTube",
    blurb: "The fact-check podcast — every claim checked. AI, tech, and the future, evidence-first.",
  },
  {
    name: "Meshcast on Ko-fi",
    url: "https://ko-fi.com/meshcast",
    tag: "Support",
    blurb: "Support the work, grab research packs, and pick up creator services.",
  },
];

export default function SitesPage() {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-10" data-pagefind-body>
      <div className="space-y-4 text-center pt-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight">
          My Sites
        </h1>
        <p className="text-base md:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
          Everything I run — affiliate sites, the salon, the podcast, and where
          to support the work.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sites.map((s) => (
          <a
            key={s.name}
            href={s.url}
            {...(s.internal ? {} : { target: "_blank", rel: "noopener noreferrer" })}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6 space-y-2 hover:border-emerald-500/50 transition-colors block"
          >
            <div className="flex items-center justify-between">
              <p className="font-bold text-lg text-[var(--text-primary)]">{s.name}</p>
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                {s.tag}
              </span>
            </div>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{s.blurb}</p>
            <p className="text-emerald-300 text-sm">{s.url.replace("https://", "")} →</p>
          </a>
        ))}
      </div>

      <p className="text-center text-sm text-[var(--text-tertiary)]">
        Affiliate links on these sites earn a commission on qualifying purchases — it keeps the lights on.
      </p>
    </div>
  );
}
