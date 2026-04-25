"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getStats } from "@/lib/site-index";

const stats = getStats();

const navItems = [
  { href: "/", icon: "◈", label: "Dashboard" },
  { href: "/library", icon: "☰", label: "Library" },
  { href: "/repos", icon: "⊕", label: "Repos" },
  { href: "/graph", icon: "◇", label: "Graph" },
  { href: "/papers", icon: "⋇", label: "Papers" },
  { href: "/logs", icon: "▤", label: "Logs" },
  { href: "/about", icon: "⊛", label: "About" },
  { href: "/start-here", icon: "→", label: "Start Here" },
  { href: "/governance", icon: "⚖", label: "Governance" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] bg-[var(--bg-surface)] border-r border-[var(--border)] flex flex-col z-40">
      <div className="p-6 border-b border-[var(--border)]">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-xl font-bold">
            DE
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">Deliberate Ensemble</h1>
            <p className="text-xs text-[var(--text-muted)]">Research Archive</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-[var(--primary)]/20 text-[var(--primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[var(--border)]">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[var(--text-muted)]">Documents</span>
            <span className="tag">{stats.totalFiles}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[var(--text-muted)]">Tags</span>
            <span className="mono text-sm text-[var(--text-secondary)]">{stats.tagCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-muted)]">Categories</span>
            <span className="mono text-sm text-[var(--secondary)]">{stats.categoryCount}</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("open-search"))}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
        >
          <span>⌘</span>
          <span>K</span>
        </button>
      </div>
    </aside>
  );
}
