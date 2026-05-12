// Type definitions for analysis findings
export interface AnalysisFinding {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  source: {
    // Information about where this finding originated
    contradictionCount: number;
    edgeType?: string;
    nodeIds?: string[];
    clusterId?: string;
    // Additional metadata about the source
    [key: string]: any;
  };
  nodes: string[]; // Node IDs involved in this finding
  evidence?: {
    // Supporting evidence for the finding
    [key: string]: any;
  };
  timestamp?: string;
}

export interface FilterReport {
  originalCount: number;
  filteredCount: number;
  removedCount: number;
  removedFindings: Array<{
    id: string;
    reason: string;
    source: AnalysisFinding['source'];
  }>;
  heuristicsApplied: string[];
}

export interface ContradictionFilterOptions {
  /** Threshold for tag-group stride-sampling artifact (CDC=39) */
  tagGroupArtifactThreshold?: number;
  /** Threshold for cluster homogeneity heuristic (>90% identical patterns) */
  clusterHomogeneityThreshold?: number;
  /** Whether to apply the tag-group artifact filter */
  enableTagGroupFilter?: boolean;
  /** Whether to apply the cluster homogeneity filter */
  enableClusterHomogeneityFilter?: boolean;
}

/**
 * Filters out known spurious contradiction findings before they reach storage and API endpoints.
 * 
 * @param findings Array of analysis findings to filter
 * @param options Configuration options for the filter
 * @returns Object containing filtered findings and a report of what was removed
 */
export function filterContradictions(
  findings: AnalysisFinding[],
  options: ContradictionFilterOptions = {}
): {
  filteredFindings: AnalysisFinding[];
  report: FilterReport;
} {
  // Set default options
  const {
    tagGroupArtifactThreshold = 39,
    clusterHomogeneityThreshold = 90,
    enableTagGroupFilter = true,
    enableClusterHomogeneityFilter = true
  } = options;

  const originalCount = findings.length;
  const removedFindings: Array<{
    id: string;
    reason: string;
    source: AnalysisFinding['source'];
  }> = [];
  const heuristicsApplied: string[] = [];

  // Work on a copy to avoid mutating the original array
  let workingFindings = [...findings];

  // Apply tag-group stride-sampling artifact filter
  if (enableTagGroupFilter) {
    heuristicsApplied.push('tag-group-stride-sampling-artifact');
    const beforeFilterCount = workingFindings.length;
    workingFindings = workingFindings.filter(finding => {
      const { contradictionCount, edgeType } = finding.source;
      
      // Remove findings that match the CDC=39 tag-group artifact pattern
      // When graph snapshots have >80 member groups stride-sampled to 40, 
      // the K(40) complete graph produces 39 CONTRADICTS edges per node
      if (contradictionCount === tagGroupArtifactThreshold && 
          edgeType === 'CONTRADICTS') {
        removedFindings.push({
          id: finding.id,
          reason: `Tag-group stride-sampling artifact (CDC=${tagGroupArtifactThreshold})`,
          source: finding.source
        });
        return false; // Remove this finding
      }
      return true; // Keep this finding
    });
    
    if (workingFindings.length < beforeFilterCount) {
      // Filter was applied and removed items
    }
  }

  // Apply cluster homogeneity heuristic filter
  if (enableClusterHomogeneityFilter && workingFindings.length > 0) {
    heuristicsApplied.push('cluster-homogeneity-heuristic');
    const beforeFilterCount = workingFindings.length;
    
    // Group findings by clusterId to analyze patterns within clusters
    const findingsByCluster: Record<string, AnalysisFinding[]> = {};
    workingFindings.forEach(finding => {
      const clusterId = finding.source.clusterId;
      if (clusterId) {
        if (!findingsByCluster[clusterId]) {
          findingsByCluster[clusterId] = [];
        }
        findingsByCluster[clusterId].push(finding);
      }
    });

    // For each cluster, check if >90% of nodes have identical contradiction patterns
    workingFindings = workingFindings.filter(finding => {
      const clusterId = finding.source.clusterId;
      if (!clusterId || !findingsByCluster[clusterId]) {
        return true; // No cluster info, keep the finding
      }

      const clusterFindings = findingsByCluster[clusterId];
      if (clusterFindings.length === 0) {
        return true;
      }

      // Extract contradiction patterns from findings in this cluster
      // We'll look at the contradiction count and edge types as the pattern
      const patterns = clusterFindings.map(f => ({
        contradictionCount: f.source.contradictionCount,
        edgeType: f.source.edgeType,
        nodeCount: f.nodes.length
      }));

      // Find the most common pattern
      const patternCounts: Record<string, number> = {};
      let mostCommonPattern = '';
      let maxCount = 0;

      patterns.forEach(pattern => {
        const patternKey = `${pattern.contradictionCount}-${pattern.edgeType || 'none'}-${pattern.nodeCount}`;
        patternCounts[patternKey] = (patternCounts[patternKey] || 0) + 1;
        
        if (patternCounts[patternKey] > maxCount) {
          maxCount = patternCounts[patternKey];
          mostCommonPattern = patternKey;
        }
      });

      // Calculate percentage of nodes with the most common pattern
      const percentageWithCommonPattern = (maxCount / clusterFindings.length) * 100;

      // If >90% of findings in the cluster have the same pattern, 
      // it's likely structural rather than semantic
      if (percentageWithCommonPattern >= clusterHomogeneityThreshold) {
        removedFindings.push({
          id: finding.id,
          reason: `Cluster homogeneity heuristic (${percentageWithCommonPattern.toFixed(1)}% identical pattern in cluster)`,
          source: finding.source
        });
        return false; // Remove this finding
      }
      
      return true; // Keep this finding
    });
    
    if (workingFindings.length < beforeFilterCount) {
      // Filter was applied and removed items
    }
  }

  const filteredCount = workingFindings.length;
  const report: FilterReport = {
    originalCount,
    filteredCount,
    removedCount: originalCount - filteredCount,
    removedFindings,
    heuristicsApplied
  };

  return {
    filteredFindings: workingFindings,
    report
  };
}

/**
 * Default export for use as a pipeline step
 */
export default function filterContradictionsDefault(
  findings: AnalysisFinding[]
): {
  filteredFindings: AnalysisFinding[];
  report: FilterReport;
} {
  return filterContradictions(findings);
}