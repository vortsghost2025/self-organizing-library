"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useA11y } from "@/components/AccessibilityProvider";

interface SidebarStats {
  totalFiles: number;
  tagCount: number;
  categoryCount: number;
}

interface SidebarProps {
  stats: SidebarStats;
}

const navItems = [
  { href: "/", icon: "◈", label: "Dashboard", ariaLabel: "Dashboard - overview and stats" },
  { href: "/library", icon: "☰", label: "Library", ariaLabel: "Library - browse all documents" },
  { href: "/search-catalog", icon: "⊗", label: "Search Index", ariaLabel: "Search index - full document catalog" },
  { href: "/repos", icon: "⊕", label: "Repos", ariaLabel: "Repositories - browse by repo" },
  { href: "/graph", icon: "◇", label: "Graph", ariaLabel: "Nexus graph - interactive document map" },
  { href: "/papers", icon: "⋇", label: "Papers", ariaLabel: "Papers - Rosetta Stone series and CAISC" },
  { href: "/videos", icon: "▶", label: "Videos", ariaLabel: "Videos - hackathon demos and system recordings" },
  { href: "/logs", icon: "▤", label: "Logs", ariaLabel: "Logs - session and verification logs" },
  { href: "/about", icon: "⊛", label: "About", ariaLabel: "About - project description" },
  { href: "/start-here", icon: "→", label: "Start Here", ariaLabel: "Start here - guided tour" },
  { href: "/governance", icon: "⚖", label: "Governance", ariaLabel: "Governance - 4-lane system dashboard" },
];

export function Sidebar({ stats }: SidebarProps) {
  const pathname = usePathname();
  const { mode, cycleMode } = useA11y();
  const modeLabel = mode === "high-contrast" ? "High Contrast" : mode === "large-text" ? "Large Text" : "Default";

  return (
  <aside
  className="fixed left-0 top-0 h-screen w-[280px] bg-[var(--bg-surface)] border-r border-[var(--border)] flex flex-col z-40"
  role="navigation"
  aria-label="Main navigation"
  data-pagefind-ignore
>
      <div className="p-6 border-b border-[var(--border)]">
        <Link href="/" className="flex items-center gap-3" aria-label="Deliberate Ensemble - go to dashboard">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-xl font-bold" aria-hidden="true">
            DE
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">Deliberate Ensemble</h1>
            <p className="text-xs text-[var(--text-muted)]">Research Archive</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1" aria-label="Site navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.ariaLabel}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-[var(--primary)]/20 text-[var(--primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span className="text-lg" aria-hidden="true">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[var(--border)]">
        <div className="card p-4" role="region" aria-label="Index statistics">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[var(--text-muted)]">Documents</span>
            <span className="tag" aria-label={`${stats.totalFiles} documents`}>{stats.totalFiles}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[var(--text-muted)]">Tags</span>
            <span className="mono text-sm text-[var(--text-secondary)]" aria-label={`${stats.tagCount} tags`}>{stats.tagCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-muted)]">Categories</span>
            <span className="mono text-sm text-[var(--secondary)]" aria-label={`${stats.categoryCount} categories`}>{stats.categoryCount}</span>
          </div>
        </div>
      </div>

      <div className="p-4 flex gap-2">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("open-search"))}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
          aria-label="Open search (Ctrl+K)"
          aria-keyshortcuts="Ctrl+K"
        >
          <span aria-hidden="true">⌘</span>
          <span aria-hidden="true">K</span>
        </button>
        <button
          onClick={cycleMode}
          className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
          aria-label={`Display mode: ${modeLabel}. Click to cycle.`}
          title={`Current: ${modeLabel}. Click to cycle.`}
        >
          {mode === "high-contrast" ? "◐" : mode === "large-text" ? "Aa" : "◑"}
        </button>
      </div>
    </aside>
  );
}
