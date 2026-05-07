# Autonomous Convergence Proposal Layer

## Purpose and Scope
The Autonomous Convergence Proposal Layer enables safe autonomous convergence proposals without mutation. It is responsible for detecting inconsistencies, generating reports, and proposing resolutions, but does not ratify, mutate graph truth, update trust stores, deploy, or modify governance authority.

## Key Responsibilities
- **Proposes and Reports**: This layer generates proposals and reports based on analysis.
- **Does Not Ratify**: Ratification is performed exclusively by the Archivist lane.
- **Does Not Mutate Graph Truth**: Graph truth remains unchanged by this layer.
- **Does Not Update Trust Stores**: Trust store modifications are handled by authorized lanes.
- **Does Not Deploy**: Deployment actions are outside the scope of this layer.
- **Does Not Modify Governance Authority**: Governance authority remains invariant under this layer's operations.

## Schema Overview
The layer relies on two core JSON Schema definitions:

1. **schemas/adjudication-proposal-v1.json**
   - Defines the structure for contradiction/adjudication proposals.
   - Includes fields such as proposal_id, contradiction details, evidence, proposed decision, confidence, and required actions.

2. **schemas/response-tracking-receipt-v1.json**
   - Tracks the delivery and processing of inter-lane messages.
   - Ensures accountability and traceability of communications.

## Report Script Functionality
The script `scripts/autonomous-convergence-report.js` provides read-only inspection capabilities:
- Reads current graph state and lane communications.
- Identifies potential contradictions or stale states.
- Generates reports and writes them exclusively to the `reports/`, `receipts/`, and `proposals/` directories.
- Performs no modifications to source-of-trust files, environment variables, trust stores, governance files, site index, or runtime directories.

## Safety Guarantees
To ensure safety, the layer enforces strict mutation checks:
- No write access to `.env` files.
- No modifications to trust store directories.
- No alterations to governance configuration files.
- No changes to site-index or runtime directories.
- All file system interactions are limited to report generation in designated output directories.

## Proposal Flow
1. **Detection**: The layer monitors for inconsistencies (e.g., stale state, temporal desync, schema-behavior mismatches).
2. **Report**: Generates a detailed report via `scripts/autonomous-convergence-report.js`.
3. **Proposal Generation**: Creates an adjudication proposal based on the report.
4. **Human/Archivist Review**: Proposals are submitted for review by human operators or the Archivist lane.
5. **Ratification**: The Archivist lane ratifies approved proposals.
6. **Safe Mutation**: Authorized lanes (e.g., Kernel, SwarmMind) execute approved mutations under strict governance.

## Output Directories
- `reports/`: Inspection and analysis reports.
- `receipts/`: Message tracking receipts.
- `proposals/`: Generated adjudication proposals.

All writes are confined to these directories, ensuring no unintended side effects on the system state.