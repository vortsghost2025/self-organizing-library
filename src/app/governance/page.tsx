'use client';

import { useEffect, useState } from 'react';

interface ArtifactSummary {
  total: number;
  active: number;
  dormant: number;
  dead: number;
  bypassed: number;
}

interface BypassSummary {
  total: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
}

interface ProofSummary {
  total: number;
  proven: number;
  notProven: number;
}

interface DrillResult {
  passed: number;
  failed: number;
  total?: number;
  timestamp: string;
}

interface StatusData {
  artifacts: ArtifactSummary;
  bypass: BypassSummary;
  proof: ProofSummary;
  gateStatus: string;
  lastRun: string | null;
  drills: {
    hardening: DrillResult | null;
    behavioral: DrillResult | null;
    recovery: DrillResult | null;
  };
}

interface LaneData {
  lane: string;
  status: string;
  lastHeartbeat: string | null;
  ageSeconds: number | null;
  mode?: string | null;
  sessionId?: string | null;
}

interface SchemaEntry {
  filename: string;
  title?: string;
  description?: string | null;
}

interface VerificationData {
  hardening: any;
  behavioral: any;
  recovery: any;
  usage: any;
}

function StatusCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="card p-6">
      <div className={`text-4xl font-bold ${color}`}>{value}</div>
      <div className="text-[var(--text-muted)] mt-1">{label}</div>
    </div>
  );
}

function FreshnessBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    FRESH: 'bg-green-500/20 text-green-400',
    INDIRECT: 'bg-yellow-500/20 text-yellow-400',
    NO_RECENT_SIGNAL: 'bg-red-500/20 text-red-400',
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-mono ${colors[status] || 'bg-gray-500/20 text-gray-400'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export default function GovernancePage() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [lanes, setLanes] = useState<LaneData[]>([]);
  const [verification, setVerification] = useState<VerificationData | null>(null);
  const [schemas, setSchemas] = useState<SchemaEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statusRes, verifyRes, lanesRes, schemasRes] = await Promise.all([
          fetch('/api/governance/status'),
          fetch('/api/governance/verification'),
          fetch('/api/governance/lanes'),
          fetch('/api/governance/schemas'),
        ]);

        setStatus(await statusRes.json());
        setVerification(await verifyRes.json());
        setLanes(await lanesRes.json());
        const schemasData = await schemasRes.json();
        setSchemas(schemasData.schemas || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-[var(--text-muted)]">Loading governance data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  const artifacts = status?.artifacts || { total: 0, active: 0, dormant: 0, dead: 0, bypassed: 0 };

  return (
    <div className="p-8">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Governance Dashboard</h1>
        <p className="text-[var(--text-secondary)]">
          Verification surface for the multi-agent AI governance lattice
        </p>
        {status?.lastRun && (
          <p className="text-xs text-[var(--text-muted)] mt-1 mono">
            Last scan: {new Date(status.lastRun).toLocaleString()}
          </p>
        )}
      </div>

      {/* Gate Status */}
      {status?.gateStatus && (
        <div className="card p-4 mb-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className={`text-2xl ${status.gateStatus === 'PASS' ? 'text-green-400' : 'text-red-400'}`}>
              {status.gateStatus === 'PASS' ? '✓' : '✗'}
            </span>
            <div>
              <div className="font-semibold text-[var(--text-primary)]">Usage Gate Status</div>
              <div className={`text-sm ${status.gateStatus === 'PASS' ? 'text-green-400' : 'text-red-400'}`}>
                {status.gateStatus}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Artifact Classification */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <StatusCard label="Total Artifacts" value={artifacts.total} color="text-[var(--text-primary)]" />
        <StatusCard label="Active" value={artifacts.active} color="text-green-400" />
        <StatusCard label="Dormant" value={artifacts.dormant} color="text-yellow-400" />
        <StatusCard label="Dead" value={artifacts.dead} color="text-red-400" />
        <StatusCard label="Bypassed" value={artifacts.bypassed} color="text-orange-400" />
      </div>

      {/* Drill Results + Lane Coordination */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Verification Drills */}
        <div className="card p-6 animate-fade-in stagger-1">
          <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">Verification Drills</h2>

          {status?.drills.hardening && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-[var(--text-secondary)]">Hardening Drill</span>
                <span className={`text-sm font-mono ${status.drills.hardening.failed === 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {status.drills.hardening.passed}/{status.drills.hardening.total} passed
                </span>
              </div>
              <div className="w-full bg-[var(--bg-surface)] rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${status.drills.hardening.failed === 0 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${(status.drills.hardening.passed / (status.drills.hardening.total || status.drills.hardening.passed)) * 100}%` }}
                />
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1 mono">
                {status.drills.hardening.timestamp ? new Date(status.drills.hardening.timestamp).toLocaleString() : 'N/A'}
              </div>
            </div>
          )}

          {status?.drills.behavioral && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-[var(--text-secondary)]">Behavioral Tests</span>
                <span className={`text-sm font-mono ${status.drills.behavioral.failed === 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {status.drills.behavioral.passed} passed
                </span>
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1 mono">
                {status.drills.behavioral.timestamp ? new Date(status.drills.behavioral.timestamp).toLocaleString() : 'N/A'}
              </div>
            </div>
          )}

          {status?.drills.recovery && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-[var(--text-secondary)]">Recovery Discipline</span>
                <span className={`text-sm font-mono ${status.drills.recovery.failed === 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {status.drills.recovery.passed}/{status.drills.recovery.total} passed
                </span>
              </div>
              <div className="w-full bg-[var(--bg-surface)] rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${status.drills.recovery.failed === 0 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${(status.drills.recovery.passed / (status.drills.recovery.total || status.drills.recovery.passed)) * 100}%` }}
                />
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1 mono">
                {status.drills.recovery.timestamp ? new Date(status.drills.recovery.timestamp).toLocaleString() : 'N/A'}
              </div>
            </div>
          )}

          {/* Runtime Proof */}
          {status?.proof && (
            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              <div className="text-sm text-[var(--text-secondary)] mb-2">Runtime Proof-of-Execution</div>
              <div className="flex gap-4 text-xs">
                <span className="text-green-400">{status.proof.proven} proven</span>
                <span className="text-red-400">{status.proof.notProven} not proven</span>
                <span className="text-[var(--text-muted)]">{status.proof.total} total</span>
              </div>
            </div>
          )}

          {/* Bypass Detection */}
          {status?.bypass && (
            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              <div className="text-sm text-[var(--text-secondary)] mb-2">Bypass Detection</div>
              <div className="flex gap-4 text-xs">
                <span className="text-red-400">{status.bypass.highRisk} high</span>
                <span className="text-yellow-400">{status.bypass.mediumRisk} medium</span>
                <span className="text-[var(--text-muted)]">{status.bypass.lowRisk} low</span>
              </div>
            </div>
          )}
        </div>

        {/* Lane Coordination */}
        <div className="card p-6 animate-fade-in stagger-2">
          <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">Lane Coordination</h2>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Measures recent coordination artifacts, NOT session liveness
          </p>
          <div className="space-y-3">
            {lanes.map((lane) => (
              <div key={lane.lane} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-surface)]">
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {lane.lane === 'library' ? '📚' : lane.lane === 'archivist' ? '🏛️' : lane.lane === 'swarmmind' ? '🧠' : '⚙️'}
                  </span>
                  <div>
                    <div className="font-medium text-[var(--text-primary)] capitalize">{lane.lane}</div>
                    <div className="text-xs text-[var(--text-muted)] mono">
                      {lane.lastHeartbeat
                        ? `${Math.round((lane.ageSeconds || 0) / 60)}m ago`
                        : 'No heartbeat'}
                    </div>
                  </div>
                </div>
                <FreshnessBadge status={lane.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Schemas Registry */}
      <div className="card p-6 animate-fade-in stagger-3 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">Schema Registry</h2>
        <div className="grid grid-cols-3 gap-3">
          {schemas.map((schema, i) => (
            <div key={i} className="p-3 rounded-lg bg-[var(--bg-surface)]">
              <div className="font-mono text-sm text-[var(--primary)]">{schema.filename}</div>
              {schema.title && (
                <div className="text-xs text-[var(--text-muted)] mt-1">{schema.title}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
