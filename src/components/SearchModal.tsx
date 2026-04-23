"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface SearchResult {
  id: string;
  title: string;
  type: string;
  excerpt: string;
}

export function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("open-search", handleOpen);
    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("open-search", handleOpen);
      window.removeEventListener("keydown", handleKeydown);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 150);
    return () => clearTimeout(timer);
  }, [query, search]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

  if (!isOpen || !mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      <div className="relative w-full max-w-2xl bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-2xl animate-fade-in">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)]">
          <span className="text-[var(--text-muted)] text-lg">⌘</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents, links, papers..."
            className="flex-1 bg-transparent border-none outline-none text-[var(--text-primary)] text-lg placeholder:text-[var(--text-muted)]"
            autoFocus
          />
          <button
            onClick={() => setIsOpen(false)}
            className="px-2 py-1 text-xs text-[var(--text-muted)] border border-[var(--border)] rounded hover:bg-[var(--bg-surface-hover)]"
          >
            ESC
          </button>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-[var(--text-muted)]">Searching...</div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => (
                <a
                  key={result.id}
                  href={`/library/${result.id}`}
                  className="flex items-start gap-4 px-5 py-3 hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  <div className={`mt-1 w-2 h-2 rounded-full ${result.type === 'paper' ? 'bg-[var(--secondary)]' : result.type === 'code' ? 'bg-[var(--success)]' : 'bg-[var(--primary)]'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[var(--text-primary)] truncate">{result.title}</div>
                    <div className="text-sm text-[var(--text-muted)] truncate mt-0.5">{result.excerpt}</div>
                  </div>
                  <span className="text-xs text-[var(--text-muted)] px-2 py-1 bg-[var(--bg-base)] rounded">{result.type}</span>
                </a>
              ))}
            </div>
          ) : query ? (
            <div className="p-8 text-center text-[var(--text-muted)]">No results found</div>
          ) : (
            <div className="p-8 text-center text-[var(--text-muted)]">
              <p className="mb-2">Type to search across all documents</p>
              <p className="text-xs">Use filters: source:github, type:paper, tag:ai</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-4">
            <span><kbd className="px-1.5 py-0.5 bg-[var(--bg-base)] rounded">↑</kbd> <kbd className="px-1.5 py-0.5 bg-[var(--bg-base)] rounded">↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 bg-[var(--bg-base)] rounded">↵</kbd> Open</span>
          </div>
          <span>{results.length} results</span>
        </div>
      </div>
    </div>,
    document.body
  );
}