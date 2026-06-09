'use client';

import React, { useEffect, useState } from 'react';

interface Run {
  id: string;
  timestamp: string;
  runner: string;
  strategy: string;
  status: string;
  totalTests: number | null;
  passedTests: number | null;
  failedTests: number | null;
  skippedTests: number | null;
  durationMs: number | null;
  suite?: string;
}

interface ErrorLog {
  id: string;
  timestamp: string;
  classification: string;
  message: string;
  source: string;
  level: string;
}

interface StatsData {
  period: { startDate: string; endDate: string; days: number };
  runsByStatusStrategy: Array<{ status: string; strategy: string; count: number }>;
  passFailByDay: Array<{ date: string; passed: number; failed: number; total: number }>;
  errorClassification: Array<{ classification: string; count: number }>;
  slowestRuns: Run[];
  frequentErrors: Array<{ message: string; count: number }>;
  latestRuns: Run[];
}

interface RunDetailData {
  run: Run;
  results: any[];
  errors: ErrorLog[];
  errorSummary: Record<string, { count: number; errors: ErrorLog[] }>;
}

export default function ObservabilityDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [selectedRun, setSelectedRun] = useState<RunDetailData | null>(null);

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
      setSelectedRun(data.data);
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

  // Calculate key metrics
  const totalRuns = stats.latestRuns.length;
  const passRate = stats.passFailByDay.length > 0 
    ? Math.round((stats.passFailByDay.reduce((sum, d) => sum + d.passed, 0) / 
        stats.passFailByDay.reduce((sum, d) => sum + d.total, 0)) * 100)
    : 0;
  const totalErrors = stats.errorClassification.reduce((sum, e) => sum + e.count, 0);

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
          <p className="text-3xl font-bold mt-2">{totalRuns}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Pass Rate</h3>
          <p className={`text-3xl font-bold mt-2 ${passRate >= 80 ? 'text-green-600' : passRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
            {passRate}%
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Recent Errors</h3>
          <p className="text-3xl font-bold mt-2 text-red-600">{totalErrors}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Day Range</h3>
          <p className="text-2xl font-bold mt-2 text-blue-600">{days}</p>
        </div>
      </div>

      {/* Error Classification Breakdown */}
      {stats.errorClassification.length > 0 && (
        <div className="bg-white rounded-lg shadow border mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">Errors by Resilience Classification</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.errorClassification.map((item) => (
                <div key={item.classification} className="p-4 border rounded">
                  <div className="text-2xl font-bold">{item.count}</div>
                  <div className="text-sm text-gray-600 capitalize">{item.classification}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Latest Test Runs Table */}
      <div className="bg-white rounded-lg shadow border mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Latest Test Runs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Strategy</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Suite</th>
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
                  <td className="px-6 py-4 text-sm text-gray-900">{run.suite || '—'}</td>
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
                      View
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
                    <dd className="text-gray-900 font-mono text-xs">{selectedRun.run.id}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Timestamp</dt>
                    <dd className="text-gray-900">{selectedRun.run.timestamp}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Strategy</dt>
                    <dd className="text-gray-900">{selectedRun.run.strategy}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Status</dt>
                    <dd className="text-gray-900">{selectedRun.run.status}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="font-bold mb-2">Test Results ({selectedRun.results.length})</h3>
                <div className="space-y-2">
                  {selectedRun.results.map((result) => (
                    <div key={result.id} className="p-3 border rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{result.testName}</p>
                          <p className="text-sm text-gray-500">{result.filePath}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          result.status === 'passed' ? 'bg-green-100 text-green-800' : 
                          result.status === 'failed' ? 'bg-red-100 text-red-800' :
                          result.status === 'skipped' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {result.status}
                        </span>
                      </div>
                      {result.errorMessage && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                          <p className="font-medium text-red-800">Error:</p>
                          <pre className="whitespace-pre-wrap font-mono text-red-700">
                            {result.errorMessage}
                          </pre>
                          {result.resilienceClassification && (
                            <p className="mt-1">
                              <span className="font-medium">Resilience Phase:</span>{' '}
                              {result.resilienceClassification} → {result.resilienceAction}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedRun.errors.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-bold mb-2">Error Logs ({selectedRun.errors.length})</h3>
                  <div className="space-y-2">
                    {selectedRun.errors.map((error) => (
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
