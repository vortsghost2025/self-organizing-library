'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SystemEvent {
  id: string;
  timestamp: string;
  type: string;
  title: string;
  description: string;
  evidencePath: string;
}

export function LiveSystemPulse() {
  const [latestEvent, setLatestEvent] = useState<SystemEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPulse() {
      try {
        const res = await fetch('/api/events');
        const data = await res.json();
        if (data && data.length > 0) {
          setLatestEvent(data[0]);
        }
      } catch (e) {
        console.error('Pulse fetch failed', e);
      } finally {
        setLoading(false);
      }
    }
    fetchPulse();
  }, []);

  if (loading) return null;
  if (!latestEvent) return null;

  return (
    <div className="mt-6 p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] animate-fade-in">
      <div className="flex items-center gap-2 text-xs font-mono text-[var(--primary)] mb-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        LIVE SYSTEM PULSE
      </div>
      <div className="flex justify-between items-start gap-4">
        <div>
          <h4 className="text-sm font-semibold text-[var(--text-primary)]">{latestEvent.title}</h4>
          <p className="text-xs text-[var(--text-secondary)] line-clamp-1">{latestEvent.description}</p>
        </div>
        <Link 
          href={`/library?path=${encodeURIComponent(latestEvent.evidencePath)}`}
          className="text-[10px] px-2 py-1 rounded bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors mono"
        >
          VIEW EVIDENCE
        </Link>
      </div>
      <div className="mt-2 text-[10px] text-[var(--text-muted)] mono">
        Event captured at {new Date(latestEvent.timestamp).toLocaleString()} • Type: {latestEvent.type}
      </div>
    </div>
  );
}
