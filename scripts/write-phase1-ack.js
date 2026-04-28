const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const targetDir = path.join(repoRoot, 'lanes', 'library', 'inbox', 'action-required');
const targetPath = path.join(targetDir, 'library-phase1-ack-20260428.json');

const data = {
  ack_for: "system-code-review-20260428",
  lane: "library",
  acknowledged_at: "2026-04-28T14:45:00-04:00",
  remediation_plan: {
    phase1_tasks: [
      {
        id: "lib-path-traversal-fix-001",
        title: "Fix path traversal in execution-gate.js: replace regex validation with path.resolve() + startsWith() checks",
        owner: "library",
        priority: "P0",
        estimated_days: 2,
        dependencies: [],
        deliverable: "src/lib/execution-gate.js with resolved path checks + test cases"
      },
      {
        id: "lib-trust-divergence-002",
        title: "Implement trust store divergence detection: compare trust-store.json hashes across all 4 lanes on heartbeat",
        owner: "library",
        priority: "P0",
        estimated_days: 3,
        dependencies: ["lib-path-traversal-fix-001"],
        deliverable: "scripts/verify-trust-consistency.js + CI integration"
      },
      {
        id: "lib-field-standardization-003",
        title: "Standardize system_status vs system_state field naming across all state files (active-owner.json, system_state.json)",
        owner: "library",
        priority: "P1",
        estimated_days: 1,
        dependencies: [],
        deliverable: "State files renamed/aliased + SchemaValidator updated"
      }
    ],
    estimated_completion: "2026-05-02T00:00:00-04:00",
    resource_allocation: "6 person-days (2+3+1)"
  },
  phase1_owner: "library"
};

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}
fs.writeFileSync(targetPath, JSON.stringify(data, null, 2));
console.log('Written to:', targetPath);
console.log('Exists?', fs.existsSync(targetPath));
