import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Dual-Plane Authority - Deliberate Ensemble',
  description: 'Why override intent is not execution permission. The governance contradiction resolved by separating initiation authority from execution authority.',
};

export default function DualPlaneAuthorityPage() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8 animate-fade-in">
        <Link href="/governance" className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">
          &larr; Governance
        </Link>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mt-4 mb-2">
          Dual-Plane Authority
        </h1>
        <p className="text-[var(--text-secondary)]">
          Why Override Intent Is Not Execution Permission
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-2 mono">
          Resolution date: 2026-04-29 &middot; Verified by: Archivist &middot; Status: proven
        </p>
      </div>

      <div className="card p-6 mb-6 animate-fade-in stagger-1 border-l-4 border-[var(--primary)]">
        <div className="text-[var(--primary)] font-semibold text-xl mb-3">
          Override Is a Request, Not a Key
        </div>
        <p className="text-[var(--text-primary)] text-lg leading-relaxed">
          The governance contradiction is resolved by separating authority into two planes.
          The operator retains <strong>initiation authority</strong> (can direct, initiate,
          and submit override intent), while constitutional gates retain{' '}
          <strong>execution authority</strong> for state-changing actions. This keeps
          operator agency intact without allowing unsafe bypass of convergence and
          quarantine safeguards.
        </p>
        <ul className="mt-4 space-y-2 text-[var(--text-secondary)]">
          <li className="flex gap-2">
            <span className="text-[var(--primary)] shrink-0">&bull;</span>
            <span>Initiation and execution are separate planes &mdash; no single role can both propose and enact an override</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--primary)] shrink-0">&bull;</span>
            <span>Override intent is visible to all lanes; execution requires constitutional validation</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--primary)] shrink-0">&bull;</span>
            <span>The system enforces reciprocal accountability: override power is distributed, not concentrated</span>
          </li>
        </ul>
      </div>

      <div className="card p-6 mb-6 animate-fade-in stagger-2">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Core Model</h2>
        <div className="bg-[var(--bg-surface)] p-4 rounded-lg font-mono text-sm text-[var(--text-secondary)] space-y-2">
          <div>Operator authority = can initiate / redirect / submit override intent</div>
          <div>Constitutional authority = decides whether state-changing execution is admissible</div>
        </div>
      </div>

      <div className="card p-6 mb-6 animate-fade-in stagger-3">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
          What Was Actually Contradictory
        </h2>
        <p className="text-[var(--text-secondary)] leading-relaxed">
          The loop was not &ldquo;user authority vs system authority.&rdquo;
          The loop was a <strong>category error</strong>: initiation authority was being
          treated as execution permission.
        </p>
      </div>

      <div className="card p-6 mb-6 animate-fade-in stagger-4">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
          Canonical Invariant
        </h2>
        <div className="bg-[var(--bg-surface)] p-4 rounded-lg font-mono text-lg text-center text-[var(--primary)]">
          override_intent != execution_permission
        </div>
      </div>

      <div className="card p-6 mb-6 animate-fade-in stagger-5">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
          Why This Matters
        </h2>
        <ul className="space-y-3 text-[var(--text-secondary)]">
          <li className="flex gap-3">
            <span className="text-[var(--primary)] shrink-0">&rarr;</span>
            <span>Preserves operator power to direct the system.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-[var(--primary)] shrink-0">&rarr;</span>
            <span>Prevents unsafe state changes without constitutional verification.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-[var(--primary)] shrink-0">&rarr;</span>
            <span>Makes governance readable and falsifiable to outside reviewers.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-[var(--primary)] shrink-0">&rarr;</span>
            <span>Aligns wording with real runtime behavior.</span>
          </li>
        </ul>
      </div>

      <div className="card p-6 mb-6 animate-fade-in stagger-6">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
          Canonical Wording
        </h2>
        <div className="bg-[var(--bg-surface)] p-4 rounded-lg font-mono text-sm text-[var(--text-secondary)] leading-relaxed">
          User can submit override intent across all lanes; execution of
          state-changing overrides remains constitution-gated by convergence
          and quarantine policy.
        </div>
      </div>

      <div className="card p-6 mb-6 animate-fade-in stagger-7">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
          Authority Flow
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] font-bold">
              Op
            </div>
            <div className="flex-1">
              <div className="text-[var(--text-primary)] font-medium">Operator</div>
              <div className="text-xs text-[var(--text-muted)]">Initiation authority holder</div>
            </div>
          </div>
          <div className="pl-6 border-l-2 border-[var(--primary)]/30 ml-6 py-2">
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <span className="text-[var(--primary)]">&darr;</span>
              <span>Submit override intent</span>
              <span className="text-xs text-green-400 ml-auto">allowed</span>
            </div>
          </div>
          <div className="pl-6 border-l-2 border-[var(--primary)]/30 ml-6 py-2">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold text-sm">
                CG
              </div>
              <div className="flex-1">
                <div className="text-[var(--text-primary)] font-medium">Convergence Gate</div>
                <div className="text-xs text-[var(--text-muted)]">Constitutional verification checkpoint</div>
              </div>
            </div>
          </div>
          <div className="pl-6 border-l-2 border-yellow-500/30 ml-6 py-2">
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <span className="text-yellow-400">&darr;</span>
              <span>Verify convergence + quarantine policy</span>
              <span className="text-xs text-yellow-400 ml-auto">required</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 font-bold">
              Ex
            </div>
            <div className="flex-1">
              <div className="text-[var(--text-primary)] font-medium">Execution</div>
              <div className="text-xs text-[var(--text-muted)]">State-changing action admitted</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6 mb-6 animate-fade-in stagger-8">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
          Three-Layer Documentation Trail
        </h2>
        <ol className="space-y-3 text-[var(--text-secondary)]">
          <li className="flex gap-3">
            <span className="text-[var(--primary)] font-bold shrink-0">1.</span>
            <span><strong>Raw investigation log</strong> &mdash; captures the original contradiction.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-[var(--primary)] font-bold shrink-0">2.</span>
            <span><strong>Truth anchor</strong> &mdash; compact reset for recurring cognitive loop.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-[var(--primary)] font-bold shrink-0">3.</span>
            <span><strong>Dual-plane resolution</strong> &mdash; formal wording fix and governance integration.</span>
          </li>
        </ol>
      </div>

      <div className="card p-6 mb-6 animate-fade-in stagger-8">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
          Graph Legend
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[var(--bg-surface)] p-4 rounded-lg">
            <div className="text-sm font-semibold text-[var(--primary)] mb-1">Initiation Plane</div>
            <div className="text-xs text-[var(--text-muted)]">Who can request an override</div>
          </div>
          <div className="bg-[var(--bg-surface)] p-4 rounded-lg">
            <div className="text-sm font-semibold text-yellow-400 mb-1">Constitutional Gate</div>
            <div className="text-xs text-[var(--text-muted)]">The validation checkpoint between planes</div>
          </div>
          <div className="bg-[var(--bg-surface)] p-4 rounded-lg">
            <div className="text-sm font-semibold text-green-400 mb-1">Execution Plane</div>
            <div className="text-xs text-[var(--text-muted)]">Who validates and executes it</div>
          </div>
        </div>
      </div>

      <div className="card p-6 mb-6 animate-fade-in stagger-9">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
          Key Takeaway
        </h2>
        <p className="text-[var(--text-secondary)] text-lg leading-relaxed">
          <strong className="text-[var(--text-primary)]">Dual-plane authority prevents false bypass.</strong>{' '}
          Operator authority governs initiation. Constitutional authority governs execution.
          This is why the operator remains fully empowered while safety gates remain non-optional.
        </p>
      </div>

      <div className="card p-6 animate-fade-in stagger-10">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
          Convergence Gate
        </h2>
        <div className="bg-[var(--bg-surface)] p-4 rounded-lg font-mono text-xs text-[var(--text-secondary)]">
          <pre>{JSON.stringify({
            claim: "Authority contradiction resolved by dual-plane model: operator holds initiation authority, constitution holds execution authority for state-changing actions.",
            evidence: "S:/Archivist-Agent/context-buffer/authority-dual-plane-resolution-20260429.md",
            verified_by: "archivist",
            contradictions: [],
            status: "proven"
          }, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
