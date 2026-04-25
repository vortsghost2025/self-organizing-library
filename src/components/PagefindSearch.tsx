"use client";

import { useEffect, useState, useCallback, useRef, useSyncExternalStore } from "react";

interface PagefindResult {
  url: string;
  meta: {
    title: string;
  };
  excerpt: string;
  score: number;
}

interface PagefindSearchResult {
  results: Array<{
    result: PagefindResult;
  }>;
}

interface PagefindInstance {
  search: (query: string) => Promise<PagefindSearchResult>;
  init: () => void;
}

const subscribers = new Set<() => void>();
let pagefindInstance: PagefindInstance | null = null;
let pagefindLoaded = false;

function subscribePagefind(callback: () => void) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

function getPagefindSnapshot() {
  return pagefindLoaded;
}

function getPagefindServerSnapshot() {
  return false;
}

function loadPagefindScript() {
  if (typeof window === "undefined" || pagefindLoaded) return;
  const existing = document.querySelector('script[src="/pagefind/pagefind.js"]');
  if (existing) return;
  const script = document.createElement("script");
  script.src = "/pagefind/pagefind.js";
  script.async = true;
  script.onload = () => {
    const pf = (window as any).pagefind as PagefindInstance | undefined;
    if (pf) {
      pf.init();
      pagefindInstance = pf;
      pagefindLoaded = true;
      subscribers.forEach((cb) => cb());
    }
  };
  script.onerror = () => {};
  document.head.appendChild(script);
}

interface SearchState {
  results: PagefindResult[];
  loading: boolean;
}

const searchSubscribers = new Set<() => void>();
let currentSearchState: SearchState = { results: [], loading: false };
let searchSeq = 0;

function subscribeSearch(callback: () => void) {
  searchSubscribers.add(callback);
  return () => searchSubscribers.delete(callback);
}

function getSearchSnapshot() {
  return currentSearchState;
}

function getSearchServerSnapshot(): SearchState {
  return { results: [], loading: false };
}

function updateSearchState(partial: Partial<SearchState>) {
  currentSearchState = { ...currentSearchState, ...partial };
  searchSubscribers.forEach((cb) => cb());
}

function performSearch(query: string) {
  if (!pagefindInstance || !query.trim()) {
    updateSearchState({ results: [], loading: false });
    return;
  }
  const seq = ++searchSeq;
  updateSearchState({ loading: true });
  pagefindInstance.search(query).then((search: PagefindSearchResult) => {
    if (seq !== searchSeq) return;
    const top = search.results.slice(0, 5);
    Promise.all(top.map((r) => r.result)).then((resolved) => {
      if (seq !== searchSeq) return;
      updateSearchState({ results: resolved, loading: false });
    });
  }).catch(() => {
    if (seq !== searchSeq) return;
    updateSearchState({ results: [], loading: false });
  });
}

export function PagefindSearch({ query }: { query: string }) {
  const pagefindReady = useSyncExternalStore(
    subscribePagefind,
    getPagefindSnapshot,
    getPagefindServerSnapshot
  );
  const { results, loading } = useSyncExternalStore(
    subscribeSearch,
    getSearchSnapshot,
    getSearchServerSnapshot
  );
  const lastQueryRef = useRef("");

  const ensureLoaded = useCallback(() => {
    loadPagefindScript();
  }, []);

  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  useEffect(() => {
    if (pagefindReady && query.trim() && query !== lastQueryRef.current) {
      lastQueryRef.current = query;
      performSearch(query);
    } else if (!query.trim() && lastQueryRef.current !== "") {
      lastQueryRef.current = "";
      updateSearchState({ results: [], loading: false });
    }
  }, [query, pagefindReady]);

  if (!pagefindReady || !query.trim()) return null;

  return (
    <div className="border-t border-[var(--border)] pt-3 mt-3" role="region" aria-label="Full-text search results from Pagefind">
      <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Full-Text Results</h3>
      {loading ? (
        <div className="text-xs text-[var(--text-muted)]" role="status" aria-live="polite">Searching full text...</div>
      ) : results.length > 0 ? (
        <div className="space-y-2">
          {results.map((r, i) => (
            <a
              key={i}
              href={r.url}
              className="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors text-sm"
              aria-label={`Full-text result: ${r.meta.title}`}
            >
              <span className="w-2 h-2 rounded-full bg-[var(--warning)] mt-1.5 flex-shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[var(--text-primary)] truncate">{r.meta.title}</div>
                <div className="text-xs text-[var(--text-muted)] truncate mt-0.5" dangerouslySetInnerHTML={{ __html: r.excerpt }} />
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="text-xs text-[var(--text-muted)]">No full-text matches</div>
      )}
    </div>
  );
}
