'use client';

import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TestRun {
  id: string;
  timestamp: string;
  runner: string;
  strategy: string;
  status: string;
  totalTests: number | null;
  passedTests: number | null;
  failedTests: number | null;
  durationMs: number | null;
}

interface ErrorLog {
  id: string;
  timestamp: string;
  classification: string;
  message: string;
  source: string;
  level: string;
}

interface Stats {
  runsByStatusStrategy: Array<{ status: string; strategy: string; count: number }>;
  passFailByDay: Array<{ date: string; passed: number; failed: number; total: number }>;
  errorClassification: Array<{ classification: string; count: number }>;
  slowestRuns: TestRun[];
  frequentErrors: Array<{ message: string; count: number }>;
  latestRuns: TestRun[];
}

export default function ObservabilityDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);

  useEffect(() => {
    fetchStats();
  }, [days]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/observability/stats?days=${days}`);
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRunDetails = async (runId: string) => {
    const response = await fetch(`/api/observability/results?runId=${runId}`);
    const data = await response.json();
    if (data.success) {
      setSelectedRun({ ...data.data.run, results: data.data.results, errors: data.data.errors });
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
          <div className="h-64 bg-gray-300 rounded mb-8"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return <div className="p-8 text-red-600">Failed to load statistics</div>;
  }

  // Prepare chart data
  const passFailChartData = {
    labels: stats.passFailByDay.map(d => d.date).reverse(),
    datasets: [
      {
        label: 'Passed',
        data: stats.passFailByDay.map(d => d.passed).reverse(),
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        borderColor: 'rgb(34, 197, 94)',
        fill: true,
      },
      {
        label: 'Failed',
        data: stats.passFailByDay.map(d => d.failed).reverse(),
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderColor: 'rgb(239, 68, 68)',
        fill: true,
      },
    ],
  };

  const errorClassificationData = {
    labels: stats.errorClassification.map(e => e.classification),
    datasets: [
      {
        label: 'Errors by Classification',
        data: stats.errorClassification.map(e => e.count),
        backgroundColor: [
          'rgba(239, 68, 68, 0.6)',   // detection
          'rgba(251, 146, 60, 0.6)', // decision
          'rgba(59, 130, 246, 0.6)', // handling
          'rgba(16, 185, 129, 0.6)', // recovery
          'rgba(139, 92, 246, 0.6)', // system
        ],
      },
    ],
  };

  // Map resilience classifications to workflow phases
  const phaseDescriptions = {
    detection: 'System identified abnormal condition (timeout, invalid response, failed validation)',
    decision: 'Determined appropriate handling strategy (retry, failover, degrade, skip, abort)',
    handling: 'Executed mitigation or fallback action',
    recovery: 'System recovered successfully',
    observability: 'Logging and monitoring event',
    system: 'System-level error (infrastructure)',
    unknown: 'Unclassified error requiring investigation',
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Test Observability Dashboard</h1>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Time Range:</label>
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value={1}>Last 24 hours</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Total Test Runs</h3>
          <p className="text-3xl font-bold mt-2">
            {stats.latestRuns.length > 0 ? 
              stats.runsByStatusStrategy.reduce((sum, r) => sum + r.count, 0) : 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Pass Rate</h3>
          <p className="text-3xl font-bold mt-2 text-green-600">
            {(() => {
              const total = stats.runsByStatusStrategy.reduce((sum, r) => sum + r.count, 0);
              const passed = stats.runsByStatusStrategy
                .filter(r => r.status === 'passed')
                .reduce((sum, r) => sum + r.count, 0);
              return total > 0 ? `${Math.round((passed / total) * 100)}%` : 'N/A';
            })()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Recent Errors</h3>
          <p className="text-3xl font-bold mt-2 text-red-600">
            {stats.errorClassification.reduce((sum, e) => sum + e.count, 0)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Avg Duration</h3>
          <p className="text-3xl font-bold mt-2 text-blue-600">
            {(() => {
              const runsWithDuration = stats.slowestRuns.filter(r => r.durationMs);
              if (runsWithDuration.length === 0) return 'N/A';
              const avg = runsWithDuration.reduce((sum, r) => sum + (r.durationMs || 0), 0) / runsWithDuration.length;
              return `${Math.round(avg / 1000)}s`;
            })()}
          </p>
        </div>
      </div>

      {/* Latest Test Runs Table */}
      <div className="bg-white rounded-lg shadow border mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Recent Test Runs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Strategy</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tests</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stats.latestRuns.map((run) => (
                <tr key={run.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(run.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-medium">
                      {run.strategy}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      run.status === 'passed' ? 'bg-green-100 text-green-800' :
                      run.status === 'failed' ? 'bg-red-100 text-red-800' :
                      run.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {run.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {run.passedTests ?? 0}/{run.totalTests ?? 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {run.durationMs ? `${Math.round(run.durationMs / 1000)}s` : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => fetchRunDetails(run.id)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Run Detail Modal */}
      {selectedRun && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-8 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Run Details</h2>
              <button
                onClick={() => setSelectedRun(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <h3 className="font-bold mb-2">Run Information</h3>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="font-medium text-gray-500">ID</dt>
                    <dd className="text-gray-900">{selectedRun.id}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Timestamp</dt>
                    <dd className="text-gray-900">{selectedRun.timestamp}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Strategy</dt>
                    <dd className="text-gray-900">{selectedRun.strategy}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Status</dt>
                    <dd className="text-gray-900">{selectedRun.status}</dd>
                  </div>
                </dl>
              </div>

              {(selectedRun as any).results && (
                <div>
                  <h3 className="font-bold mb-2">Test Results</h3>
                  <div className="space-y-2">
                    {(selectedRun as any).results.map((result: any) => (
                      <div key={result.id} className="p-3 border rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{result.testCase?.name}</p>
                            <p className="text-sm text-gray-500">{result.testCase?.file_path}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            result.status === 'passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {result.status}
                          </span>
                        </div>
                        {result.error_message && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                            <p className="font-medium text-red-800">Error:</p>
                            <pre className="whitespace-pre-wrap font-mono text-red-700">
                              {result.error_message}
                            </pre>
                            {result.resilience_classification && (
                              <p className="mt-1">
                                <span className="font-medium">Resilience Phase:</span>{' '}
                                {result.resilience_classification}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(selectedRun as any).errors && (
                <div className="mt-6">
                  <h3 className="font-bold mb-2">Error Logs</h3>
                  <div className="space-y-2">
                    {(selectedRun as any).errors.map((error: ErrorLog) => (
                      <div key={error.id} className="p-3 border rounded">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">{error.classification}</span>
                          <span className="text-xs text-gray-500">{error.timestamp}</span>
                        </div>
                        <p className="text-sm mt-1">{error.message}</p>
                        <p className="text-xs text-gray-500">Source: {error.source}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
