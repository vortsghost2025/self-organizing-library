import { getSources } from "@/lib/db";

export default async function SourcesPage() {
  const sources = await getSources();

  const mockSources = [
    { id: "1", type: "github", name: "GitHub Repositories", status: "connected", documentCount: 142, lastSync: new Date() },
    { id: "2", type: "medium", name: "Medium Articles", status: "connected", documentCount: 28, lastSync: new Date() },
    { id: "3", type: "doi", name: "DOI Papers", status: "connected", documentCount: 5, lastSync: new Date() },
  ];

  const displaySources = sources.length > 0 ? sources : mockSources;

  const getSourceIcon = (type: string) => {
    switch (type) {
      case "github": return "⌘";
      case "medium": return "◉";
      case "doi": return "⊕";
      case "twitter": return "𝕏";
      default: return "◈";
    }
  };

  const getSourceColor = (type: string) => {
    switch (type) {
      case "github": return "#F4F4F5";
      case "medium": return "#00E676";
      case "doi": return "#06B6D4";
      case "twitter": return "#1DA1F2";
      default: return "#7C3AED";
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Sources</h1>
          <p className="text-[var(--text-secondary)]">Connect external platforms to sync documents</p>
        </div>
        <button className="btn-primary">
          + Add Source
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {displaySources.map((source: any, i: number) => (
          <div key={source.id} className={`card p-6 animate-fade-in stagger-${(i % 5) + 1}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                  style={{ backgroundColor: `${getSourceColor(source.type)}20`, color: getSourceColor(source.type) }}
                >
                  {getSourceIcon(source.type)}
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)]">{source.name}</h3>
                  <span className="text-sm text-[var(--text-muted)] capitalize">{source.type}</span>
                </div>
              </div>
              <span className={`w-2 h-2 rounded-full ${source.status === 'connected' ? 'bg-[var(--success)]' : source.status === 'error' ? 'bg-[var(--error)]' : 'bg-[var(--warning)]'}`} />
            </div>

            <div className="flex items-center justify-between mb-4 text-sm">
              <span className="text-[var(--text-muted)]">
                {source.documentCount} documents synced
              </span>
              <span className="text-[var(--text-muted)]">
                Last sync: {source.lastSync?.toLocaleDateString() || "Never"}
              </span>
            </div>

            <div className="flex gap-2">
              <button className="btn-secondary flex-1 py-2 text-sm">
                Sync Now
              </button>
              <button className="btn-secondary py-2 px-4 text-sm">
                ⚙
              </button>
            </div>
          </div>
        ))}

        <div className="card p-6 border-dashed animate-fade-in">
          <div className="flex flex-col items-center justify-center h-full py-8">
            <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface-hover)] flex items-center justify-center text-2xl text-[var(--text-muted)] mb-4">
              +
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Add New Source</h3>
            <p className="text-sm text-[var(--text-muted)] text-center mb-4">
              Connect GitHub, Medium, DOI, Twitter, or any URL
            </p>
            <button className="btn-secondary text-sm">
              Choose Platform
            </button>
          </div>
        </div>
      </div>

      <div className="card p-6 mt-8 animate-fade-in">
        <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">Supported Platforms</h2>
        <div className="grid grid-cols-4 gap-4">
          {[
            { name: "GitHub", icon: "⌘", desc: "Repos, READMEs, issues" },
            { name: "Medium", icon: "◉", desc: "Articles, drafts" },
            { name: "DOI", icon: "⊕", desc: "Academic papers" },
            { name: "Twitter/X", icon: "𝕏", desc: "Tweets, threads" },
            { name: "Custom URL", icon: "🌐", desc: "Any web page" },
            { name: "File Upload", icon: "📄", desc: "PDF, MD, TXT" },
            { name: "JSON Import", icon: "{}", desc: "Batch import" },
            { name: "API", icon: "⬡", desc: "Custom integration" },
          ].map((platform, i) => (
            <div key={i} className="p-4 rounded-lg bg-[var(--bg-surface-hover)] text-center">
              <div className="text-2xl mb-2">{platform.icon}</div>
              <div className="font-medium text-[var(--text-primary)] text-sm">{platform.name}</div>
              <div className="text-xs text-[var(--text-muted)]">{platform.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}