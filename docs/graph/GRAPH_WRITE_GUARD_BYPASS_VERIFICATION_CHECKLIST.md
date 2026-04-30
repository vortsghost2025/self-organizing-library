# Graph Write Guard Bypass Verification Checklist

## Scope

Verify guard enforcement on actual write paths:

- `scripts/generate-site-index.js` -> `data/site-index.json`
- `scripts/analyze-unverified-authority.js --apply` -> snapshot mutation

## Required Blocked-Case Test

Attempt a conflict-related write **without adjudication metadata**.

### Test Command A (snapshot apply)

```bash
cd S:/self-organizing-library/scripts
node analyze-unverified-authority.js --apply
```

Expected:
- exit non-zero
- write is blocked
- output contains:
  - `STATUS: QUARANTINE`
  - `guard_path:`
  - `write_path:`
  - `blocked_case:`
  - `evidence_required: true`
  - `bypass_notes:`

### Test Command B (index regeneration)

```bash
cd S:/self-organizing-library/scripts
node generate-site-index.js
```

Expected:
- if contradiction-tag-group counts would change and no adjudication is supplied, block with `STATUS: QUARANTINE`
- otherwise permit write with guard audit log entry

## Pass Criteria

1. Guard decision is emitted on blocked path.
2. Write target remains unchanged on blocked path.
3. `logs/graph-write-guard.log` contains decision record.
4. With valid adjudication metadata (`--adjudication <json>`), guarded write succeeds.

