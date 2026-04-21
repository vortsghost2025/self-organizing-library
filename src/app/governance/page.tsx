import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';

const GovernancePage: React.FC = () => {
  const [status, setStatus] = useState<{ totalActive: number; totalDormant: number; totalDead: number; totalBypassed: number; lastDrillStatus: string } | null>(null);
  const [verificationResults, setVerificationResults] = useState<{ name: string; passed: boolean; reason: string }[] | null>(null);
  const [laneCoordination, setLaneCoordination] = useState<{ lane: string; status: string; lastHeartbeat: string }[] | null>(null);
  const [schemas, setSchemas] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statusResponse = await fetch('/api/governance/status');
        const verificationResponse = await fetch('/api/governance/verification');
        const laneResponse = await fetch('/api/governance/lanes');
        const schemasResponse = await fetch('/api/governance/schemas');

        const statusData = await statusResponse.json();
        const verificationData = await verificationResponse.json();
        const laneData = await laneResponse.json();
        const schemasData = await schemasResponse.json();

        setStatus(statusData);
        setVerificationResults(verificationData);
        setLaneCoordination(laneData);
        setSchemas(schemasData);
      } catch (error) {
        console.error('Error fetching governance data:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Governance Dashboard</h1>

        <section className="grid grid-cols-4 gap-6 mb-8">
          {/* System Status Overview */}
          <div className="card p-6">
            <h2 className="font-semibold">System Status Overview</h2>
            <div>
              <p>Total Active: {status?.totalActive}</p>
              <p>Total Dormant: {status?.totalDormant}</p>
              <p>Total Dead: {status?.totalDead}</p>
              <p>Total Bypassed: {status?.totalBypassed}</p>
            </div>
            <div className="mt-4">Last Drill Status: {status?.lastDrillStatus}</div>
          </div>
          {/* Lane Coordination */}
          {laneCoordination && (
            <div className="card p-6">
              <h2 className="font-semibold">Lane Coordination</h2>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2">Lane</th>
                    <th className="border p-2">Status</th>
                    <th className="border p-2">Last Heartbeat</th>
                  </tr>
                </thead>
                <tbody>
                  {laneCoordination.map(lane => (
                    <tr key={lane.lane} className={lane.status === 'FRESH' ? 'bg-green-200' : lane.status === 'INDIRECT' ? 'bg-yellow-200' : 'bg-red-200'}>
                      <td className="border p-2">{lane.lane}</td>
                      <td className="border p-2">{lane.status}</td>
                      <td className="border p-2">{lane.lastHeartbeat}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Verification Drill History */}
          <div className="card p-6">
            <h2 className="font-semibold">Verification Drill History</h2>
            <div>
              <h3>Results</h3>
              {verificationResults && verificationResults.map((result, index) => (
                <div key={index} className="mb-2">
                  <strong>{result.name}</strong>: {result.passed ? 'Passed' : 'Failed'}<br />
                  <span className="text-sm text-gray-500">Reason: {result.reason}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Schemas Registry */}
          <div className="card p-6">
            <h2 className="font-semibold">Schemas Registry</h2>
            <ul>
              {schemas.map((schema, index) => (
                <li key={index} className="border-b p-2">{schema}</li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
};

export default GovernancePage;