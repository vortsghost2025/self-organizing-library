# USAGE LANE GATE REPORT

Date: 2026-04-20T16:43:53.568Z

## Status: FAIL

❌ GATE FAILED - Verification artifacts are DORMANT, DEAD, or BYPASSED

## Summary

| Status | Count |
|--------|-------|
| ACTIVE | 0 |
| DORMANT | 0 |
| DEAD | 40 |
| BYPASSED | 0 |

## Violations (CRITICAL)

- **bypass-detection**: 2 HIGH risk bypass paths detected

## Enforcement Rule

```
IF artifactType = verification
AND status IN (DORMANT, DEAD, BYPASSED)
THEN FAIL gate
```

## Five-Point Verification Standard

To be considered ACTIVE, an artifact must meet all five:
1. Exists (file/function present)
2. Referenced (static import/call)
3. Executed (runtime evidence)
4. Not Bypassed (no alternate paths)
5. Enforced (connected to outcomes)
