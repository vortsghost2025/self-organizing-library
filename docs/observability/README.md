# Test Observability System

Comprehensive test monitoring and analytics for the WE4FREE Framework, implementing a deterministic resilience workflow for continuous improvement.

## Overview

The Test Observability System tracks every test execution with full classification according to the WE4FREE Resilience Framework:

1. **Detection** - Identify errors (timeouts, invalid responses, failed validations)
2. **Decision** - Determine handling strategy (retry, failover, degrade, skip, abort)
3. **Handling/Recovery** - Execute mitigation actions, preserve data integrity
4. **Observability** - Log errors, analyze trends, drive continuous improvement

## Features

- **Timestamped Test Runs**: Every test execution is recorded with precise ISO-8601 timestamps
- **Strategy Classification**: Tests categorized by type (unit, integration, e2e, recovery, resilience, performance)
- **Error Logging**: All errors captured with full stack traces and classification
- **Resilience Mapping**: Errors automatically classified by resilience phase
- **Trend Analytics**: Historical views to see if improvements are making tests better or worse
- **Blast Radius Analysis**: Track impact scope of failures
- **Improvement Tracking**: Record code changes and their impact on test outcomes

## Architecture

### Database Schema (SQLite)

- `test_runs` - Test execution metadata
- `test_cases` - Test definitions
- `test_results` - Individual test outcomes
- `error_logs` - Detailed error records with classification
- `improvements` - Change tracking and impact assessment

### Components

- **Observability Wrapper** (`scripts/observability-wrapper.js`) - Wraps any test command to capture results
- **Observability Library** (`src/lib/observability/`) - Core database operations and error classification
- **API Routes** (`src/app/api/observability/`) - REST endpoints for querying data
- **Dashboard** (`src/components/observability/ObservabilityDashboard.tsx`) - React UI for analytics

## Usage

### 1. Initialize Database

```bash
npm run observability:init-db
```

This creates `observability.db` (or `.data/observability.db` in production) with all tables and indexes.

### 2. Run Tests with Observability

#### Option A: Use Wrapper (Recommended for custom scripts)

```bash
# Unit tests
node scripts/observability-wrapper.js "npm test" --strategy=unit --suite=vitest

# Integration test
node scripts/observability-wrapper.js "node scripts/test-lane-consistency.js" --strategy=integration --suite=lane-consistency

# Resilience test
node scripts/observability-wrapper.js "node scripts/fail-closed-test-suite.js" --strategy=resilience
```

#### Option B: Use npm script (for standard npm test)

```bash
npm run observability:test
```

Or create custom scripts in package.json:

```json
{
  "scripts": {
    "test:observed": "node scripts/observability-wrapper.js \"npm test\" --strategy=unit --suite=vitest"
  }
}
```

### 3. View Dashboard

Visit `/observability` in your running Next.js app:

```bash
npm run dev
# Open http://localhost:3000/observability
```

The dashboard shows:
- Test run history with timestamps
- Pass/fail trends over time
- Error classification breakdown (by resilience phase)
- Slowest test runs
- Most frequent errors
- Latest run status

### 4. Query API Directly

#### Get Test Runs

```bash
curl "http://localhost:3000/api/observability/runs?days=7&strategy=integration"
```

#### Get Errors

```bash
curl "http://localhost:3000/api/observability/errors?classification=detection&startDate=2025-01-01"
```

#### Get Statistics

```bash
curl "http://localhost:3000/api/observability/stats?days=30"
```

#### Get Run Details

```bash
curl "http://localhost:3000/api/observability/results?runId=<run-uuid>"
```

## Error Classification

Errors are automatically classified according to the resilience workflow:

| Classification | Description | Example | Action |
|----------------|-------------|---------|--------|
| **detection** | System identified abnormal condition | Timeout, network error, invalid response | retry/failover/degrade/abort |
| **decision** | Strategy determination (rare in tests) | Choosing between retry/failover | Various |
| **handling** | Recovery action executed | Retry attempt, failover triggered, degraded mode | Monitoring |
| **recovery** | Successful recovery | Retry succeeded, service restored | Monitoring |
| **observability** | Logging/monitoring events | Metrics emitted, traces recorded | None |
| **system** | Infrastructure errors | Database down, filesystem errors | abort |
| **unknown** | Unclassified errors | Need manual review | Investigate |

The wrapper's `classifyError()` function uses pattern matching on messages and error types to determine the classification and appropriate action.

## Recording Improvements

When a code change is made to fix tests or improve resilience, record its impact:

```bash
curl -X POST http://localhost:3000/api/observability/improvements \
  -H "Content-Type: application/json" \
  -d '{
    "type": "bugfix",
    "description": "Fixed timeout handling in QueueConsumer to properly classify network errors as detection",
    "gitCommit": "abc123def",
    "affectedTests": ["test-queue-timeout", "test-network-failure"],
    "beforeStats": { "passed": 4, "failed": 2, "flakiness": "33%" },
    "afterStats": { "passed": 6, "failed": 0, "flakiness": "0%" },
    "impactAssessment": "significant_improvement",
    "verifiedBy": "library-agent"
  }'
```

Impact assessments: `significant_improvement`, `improvement`, `neutral`, `regression`, `critical_regression`

## Integration with WE4FREE Resilience Framework

The observability system directly supports the four-phase resilience workflow:

### 1. Detection
Errors are captured at point of failure with full context (message, stack, source). Classification determines if the system properly identified the abnormal condition.

### 2. Decision
The `resilience_action` field records what strategy was chosen (retry, failover, degrade, skip, abort). This shows if the correct decision logic was applied.

### 3. Handling/Recovery
`recovery_attempted` and `recovery_successful` flags indicate if recovery mechanisms kicked in and whether they succeeded. `blade_radius` shows impact scope.

### 4. Observability & Improvement
All data is queryable to identify patterns:
- Which error types are most frequent?
- Are certain strategies more effective?
- Did a code change improve or worsen test outcomes?
- How is flakiness trending over time?

## Best Practices

### For Test Authors

1. **Include resilience phases in test names** to enable automatic classification:
   - `test-network-timeout-detection` → classified as detection
   - `test-retry-handling-success` → classified as handling
   - `test-failover-recovery` → classified as recovery

2. **Throw errors with clear messages** so classification works:
   - Good: `throw new Error('Timeout: external API unreachable')`
   - Bad: `throw new Error('Failed')`

3. **Add resilience metadata to custom errors** for precise classification:
   ```javascript
   const error = new Error('Database connection lost');
   error.resiliencePhase = 'detection';
   error.resilienceAction = 'retry';
   throw error;
   ```

### For CI/CD

1. Run all tests through the wrapper to capture full observability data
2. After each run, query the improvement trends to spot regressions
3. Set alerts for error classification patterns (e.g., increase in `system` errors)
4. Require improvement records for any code changes that affect test outcomes

### For Continuous Improvement

1. **Weekly review**: Query `improvements` to see what changes had impact
2. **Error pattern analysis**: Group errors by `classification` and `source` to find systemic issues
3. **Blast radius reviews**: Investigate any `system`-level errors immediately
4. **Trend monitoring**: Use the dashboard to spot increasing flakiness or degrading performance

## Advanced Usage

### Custom Error Classification

Extend the `classifyError()` function in `scripts/observability-wrapper.js` to add domain-specific patterns:

```javascript
function classifyError(error) {
  // ... existing patterns ...
  
  // Add custom patterns for your domain
  if (error.message.includes('QUorum failure') || error.message.includes('RAFT')) {
    return {
      classification: 'decision',
      action: 'failover',
      description: 'Consensus protocol failure - switching to backup leader'
    };
  }
  
  // ... fallback ...
}
```

### Recording Test Improvements Programmatically

```javascript
const { db, tables } = require('./src/db');
const { sql } = require('drizzle-orm');

// After a code change that improves test results
await db.insert(tables.improvements).values({
  id: crypto.randomUUID(),
  timestamp: new Date().toISOString(),
  type: 'bugfix',
  description: 'Fixed retry logic to properly backoff',
  git_commit: 'current-commit-hash',
  affected_tests: JSON.stringify(['test-retry-backoff', 'test-retry-exhaustion']),
  before_stats: JSON.stringify({ passed: 1, failed: 1, flakiness: '33%' }),
  after_stats: JSON.stringify({ passed: 2, failed: 0, flakiness: '0%' }),
  impact_assessment: 'significant_improvement',
  verified_by: 'library',
});
```

### Querying for Flaky Tests

```sql
-- Find tests that failed in some runs but passed in others
SELECT 
  tc.name,
  COUNT(*) as total_runs,
  SUM(CASE WHEN tr.status = 'failed' THEN 1 ELSE 0 END) as failed_runs,
  (SUM(CASE WHEN tr.status = 'failed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as failure_rate
FROM test_results tr
JOIN test_cases tc ON tr.test_case_id = tc.id
GROUP BY tc.id, tc.name
HAVING failure_rate > 0 AND failure_rate < 100
ORDER BY failure_rate DESC;
```

## Troubleshooting

### Database not found

Run `npm run observability:init-db` to initialize.

### Wrapper not capturing test results

The wrapper parses output for common patterns (Vitest ✓/✖, custom ✓/✗). If your test framework uses different output, extend the `parseTestOutput()` function.

### Missing error classifications

Check that error messages contain keywords that trigger classification. Add custom patterns to `classifyError()`.

### Performance impact

Observability adds ~10-20ms overhead per test for database writes. Use connection pooling in production. Consider batch inserts for large test suites.

## Future Enhancements

- Real-time streaming of test results via WebSockets
- Automated failure pattern detection and alerting
- Integration with CI/CD systems (GitHub Actions, Jenkins)
- Correlation with code changes (blame assignment)
- Predictive flakiness scoring
- Graph view of test dependencies and failure propagation

## References

- [WE4FREE Resilience Framework](./RESILIENCE.md)
- [Governance Rules](../GOVERNANCE.md)
- Database schema: `src/db/schema.ts`
- API routes: `src/app/api/observability/`
- Dashboard: `src/components/observability/ObservabilityDashboard.tsx`

---

**Maintained by**: Library Lane  
**Evidence**: All dashboard data is backed by database evidence with full OUTPUT_PROVENANCE.  
**Governance**: Cross-lane convergence required for schema changes.
