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

const EPOCHS = [
  { name: 'The Discovery Era', start: '2026-01-01', color: 'text-blue-400' },
  { name: 'The Hardening Phase', start: '2026-04-01', color: 'text-yellow-400' },
  { name: 'The Ratification', start: '2026-04-20', color: 'text-green-400' },
  { name: 'The Monitor Phase', start: '2026-04-23', color: 'text-purple-400' },
];

export default function TimelinePage() {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const { fetchWithRetry } = await import('../../lib/fetchWithRetry');
    const res = await fetchWithRetry('/api/events');
        const data = await res.json();
        setEvents(data);
      } catch (e) {
        console.error('Timeline fetch failed', e);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  const filteredEvents = filter === 'All' 
    ? events 
    : events.filter(e => e.type === filter);

  const getEpoch = (timestamp: string) => {
    const date = new Date(timestamp);
    const sortedEpochs = [...EPOCHS].sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());
    return sortedEpochs.find(e => date >= new Date(e.start)) || EPOCHS[0];
  };

  if (loading) return <div className="p-8 text-[var(--text-muted)]">Reconstructing system history...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-12 animate-fade-in">
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">System Evolution</h1>
        <p className="text-[var(--text-secondary)] text-lg mb-6">
          A chronological time-lapse of the Deliberate Ensemble&apos;s emergence. 
          From theoretical discovery to constitutional ratification.
        </p>
        
        <div className="flex flex-wrap gap-2">
          {['All', 'Governance', 'Graph', 'Contradiction', 'Deployment', 'Verification'].map(t => (
            <button 
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1 rounded-full text-xs font-mono transition-all ${filter === t ? 'bg-[var(--primary)] text-white' : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="relative border-l-2 border-[var(--border)] ml-4 pl-8 space-y-12">
        {filteredEvents.map((event, i) => {
          const epoch = getEpoch(event.timestamp);
          return (
            <div key={event.id} className="relative animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="absolute -left-[41px] top-1 w-4 h-4 rounded-full bg-[var(--bg-main)] border-2 border-[var(--primary)]" />
              
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${epoch.color}`}>
                  {epoch.name}
                </span>
                <span className="text-xs text-[var(--text-muted)] mono">
                  {new Date(event.timestamp).toLocaleString()}
                </span>
              </div>

              <div className="card p-4 hover:border-[var(--primary)] transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-[var(--text-primary)]">{event.title}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-muted)] mono border border-[var(--border)]">
                    {event.type}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
                  {event.description}
                </p>
                <Link 
                  href={`/library?path=${encodeURIComponent(event.evidencePath)}`}
                  className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1 mono"
                >
                  View Evidence Artifact →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
