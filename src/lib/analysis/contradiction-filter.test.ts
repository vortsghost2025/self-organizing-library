import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { filterContradictions } from './contradiction-filter';
import type { AnalysisFinding } from './contradiction-filter';

function makeFinding(overrides: Partial<AnalysisFinding> = {}): AnalysisFinding {
  return {
    id: `finding-${Math.random().toString(36).slice(2, 8)}`,
    type: 'contradiction',
    severity: 'medium',
    description: 'test finding',
    source: {
      contradictionCount: 5,
      edgeType: 'CONTRADICTS',
      clusterId: 'cluster-1',
      ...overrides.source,
    },
    nodes: ['node-1', 'node-2'],
    ...overrides,
  };
}

describe('filterContradictions', () => {
  it('returns all findings when no filters match', () => {
    const findings = [
      makeFinding({ source: { contradictionCount: 10, edgeType: 'VERIFIES' } }),
      makeFinding({ source: { contradictionCount: 5, edgeType: 'CONTRADICTS' } }),
    ];
    const { filteredFindings, report } = filterContradictions(findings);
    expect(filteredFindings).toHaveLength(2);
    expect(report.originalCount).toBe(2);
    expect(report.filteredCount).toBe(2);
    expect(report.removedCount).toBe(0);
  });

  it('removes tag-group stride-sampling artifacts (CDC=39)', () => {
    const findings = [
      makeFinding({ source: { contradictionCount: 39, edgeType: 'CONTRADICTS' } }),
      makeFinding({ source: { contradictionCount: 5, edgeType: 'CONTRADICTS' } }),
    ];
    const { filteredFindings, report } = filterContradictions(findings);
    expect(filteredFindings).toHaveLength(1);
    expect(filteredFindings[0].source.contradictionCount).toBe(5);
    expect(report.removedCount).toBe(1);
    expect(report.removedFindings[0].reason).toContain('CDC=39');
    expect(report.heuristicsApplied).toContain('tag-group-stride-sampling-artifact');
  });

  it('does not remove CDC=39 with non-CONTRADICTS edge type', () => {
    const findings = [
      makeFinding({ source: { contradictionCount: 39, edgeType: 'VERIFIES' } }),
    ];
    const { filteredFindings } = filterContradictions(findings);
    expect(filteredFindings).toHaveLength(1);
  });

  it('respects custom tagGroupArtifactThreshold', () => {
    const findings = [
      makeFinding({ source: { contradictionCount: 25, edgeType: 'CONTRADICTS' } }),
    ];
    const { filteredFindings } = filterContradictions(findings, { tagGroupArtifactThreshold: 25 });
    expect(filteredFindings).toHaveLength(0);
  });

  it('disables tag-group filter when enableTagGroupFilter is false', () => {
    const findings = [
      makeFinding({ source: { contradictionCount: 39, edgeType: 'CONTRADICTS' } }),
    ];
    const { filteredFindings } = filterContradictions(findings, { enableTagGroupFilter: false });
    expect(filteredFindings).toHaveLength(1);
  });

  it('removes findings from homogeneous clusters (>90% identical pattern)', () => {
    const clusterFindings = Array.from({ length: 10 }, (_, i) =>
      makeFinding({
        source: {
          contradictionCount: 7,
          edgeType: 'CONTRADICTS',
          clusterId: 'homog-cluster',
        },
        nodes: [`node-${i}`],
      })
    );
    const { filteredFindings, report } = filterContradictions(clusterFindings);
    expect(report.removedCount).toBe(10);
    expect(report.heuristicsApplied).toContain('cluster-homogeneity-heuristic');
  });

  it('keeps findings from heterogeneous clusters (<90% identical)', () => {
    const findings = [
      ...Array.from({ length: 5 }, (_, i) =>
        makeFinding({
          source: { contradictionCount: 7, edgeType: 'CONTRADICTS', clusterId: 'hetero-cluster' },
          nodes: [`node-a-${i}`],
        })
      ),
      ...Array.from({ length: 5 }, (_, i) =>
        makeFinding({
          source: { contradictionCount: 12, edgeType: 'VERIFIES', clusterId: 'hetero-cluster' },
          nodes: [`node-b-${i}`],
        })
      ),
    ];
    const { filteredFindings, report } = filterContradictions(findings);
    expect(report.removedCount).toBe(0);
    expect(filteredFindings).toHaveLength(10);
  });

  it('keeps findings without clusterId', () => {
    const findings = [
      makeFinding({ source: { contradictionCount: 7, edgeType: 'CONTRADICTS' } }),
    ];
    delete (findings[0].source as Record<string, unknown>).clusterId;
    const { filteredFindings } = filterContradictions(findings);
    expect(filteredFindings).toHaveLength(1);
  });

  it('disables cluster homogeneity filter when enableClusterHomogeneityFilter is false', () => {
    const clusterFindings = Array.from({ length: 10 }, (_, i) =>
      makeFinding({
        source: { contradictionCount: 7, edgeType: 'CONTRADICTS', clusterId: 'c1' },
        nodes: [`node-${i}`],
      })
    );
    const { filteredFindings } = filterContradictions(clusterFindings, {
      enableClusterHomogeneityFilter: false,
    });
    expect(filteredFindings).toHaveLength(10);
  });

  it('handles empty findings array', () => {
    const { filteredFindings, report } = filterContradictions([]);
    expect(filteredFindings).toHaveLength(0);
    expect(report.originalCount).toBe(0);
    expect(report.removedCount).toBe(0);
  });

  it('does not mutate original findings array', () => {
    const original = [makeFinding({ source: { contradictionCount: 39, edgeType: 'CONTRADICTS' } })];
    const originalLength = original.length;
    filterContradictions(original);
    expect(original).toHaveLength(originalLength);
  });

  it('report includes correct heuristics when both filters applied', () => {
    const findings = [
      makeFinding({ source: { contradictionCount: 39, edgeType: 'CONTRADICTS' } }),
      makeFinding({ source: { contradictionCount: 5, edgeType: 'CONTRADICTS', clusterId: 'c1' } }),
    ];
    const { report } = filterContradictions(findings);
    expect(report.heuristicsApplied).toContain('tag-group-stride-sampling-artifact');
    expect(report.heuristicsApplied).toContain('cluster-homogeneity-heuristic');
  });

  it('applies both filters sequentially — tag-group first, then homogeneity', () => {
    const findings = [
      makeFinding({ source: { contradictionCount: 39, edgeType: 'CONTRADICTS', clusterId: 'c1' } }),
      ...Array.from({ length: 9 }, (_, i) =>
        makeFinding({
          source: { contradictionCount: 5, edgeType: 'CONTRADICTS', clusterId: 'c1' },
          nodes: [`node-${i}`],
        })
      ),
    ];
    const { filteredFindings, report } = filterContradictions(findings);
    expect(report.removedCount).toBe(10);
    expect(filteredFindings).toHaveLength(0);
  });

  it('respects custom clusterHomogeneityThreshold', () => {
    const findings = Array.from({ length: 8 }, (_, i) =>
      makeFinding({
        source: { contradictionCount: 5, edgeType: 'CONTRADICTS', clusterId: 'c1' },
        nodes: [`node-${i}`],
      })
    );
    const twoDifferent = Array.from({ length: 2 }, (_, i) =>
      makeFinding({
        source: { contradictionCount: 99, edgeType: 'VERIFIES', clusterId: 'c1' },
        nodes: [`node-diff-${i}`],
      })
    );
    const all = [...findings, ...twoDifferent];
    const { filteredFindings: at80 } = filterContradictions(all, {
      clusterHomogeneityThreshold: 80,
    });
    expect(at80.length).toBeLessThan(all.length);

    const { filteredFindings: at99 } = filterContradictions(all, {
      clusterHomogeneityThreshold: 99,
    });
    expect(at99).toHaveLength(all.length);
  });
});
