"use client";

import { useEffect, useState, useId } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

interface MarkdownContentProps {
  entryId: string;
}

type ContentState =
  | { status: "loading" }
  | { status: "loaded"; content: string; extension: string }
  | { status: "not-renderable"; message: string }
  | { status: "error"; message: string };

export default function MarkdownContent({ entryId }: MarkdownContentProps) {
  const [state, setState] = useState<ContentState>({ status: "loading" });
  const regionId = useId();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/document-content/${entryId}`);
        if (!res.ok) {
          if (!cancelled) setState({ status: "error", message: "Failed to load content" });
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        if (data.content) {
          setState({
            status: "loaded",
            content: data.content,
            extension: data.extension || ".md",
          });
        } else if (!data.renderable) {
          setState({ status: "not-renderable", message: data.message });
        } else {
          setState({ status: "error", message: data.message || "Content unavailable" });
        }
      } catch {
        if (!cancelled) setState({ status: "error", message: "Network error" });
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [entryId]);

  if (state.status === "loading") {
    return (
      <div className="py-8 text-center text-[var(--text-muted)]">
        Loading content...
      </div>
    );
  }

  if (state.status === "not-renderable") {
    return (
      <div className="py-4 px-4 rounded-lg bg-[var(--bg-base)] border border-[var(--border)] text-sm text-[var(--text-muted)]">
        {state.message}
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="py-4 px-4 rounded-lg bg-[var(--bg-base)] border border-[var(--border)] text-sm text-[var(--text-muted)]">
        {state.message}
      </div>
    );
  }

  const isMarkdown =
    state.extension === ".md" || state.extension === ".mdx";

  if (isMarkdown) {
    return (
      <div
        id={regionId}
        className="prose-dark max-w-none"
        role="region"
        aria-label="Document content"
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {state.content}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <pre
      className="p-4 rounded-lg bg-[var(--bg-base)] border border-[var(--border)] overflow-x-auto text-sm mono text-[var(--text-secondary)]"
      role="region"
      aria-label="Document content"
    >
      <code>{state.content}</code>
    </pre>
  );
}
