# Usage Lane Design Document

Date: 2026-04-20T11:25:00-04:00
Owner: Library Lane
Status: DRAFT
Priority: HIGH

## The Problem

Current verification asks: "Is this artifact valid?"

Missing question: **"Is this artifact actually used?"**

Four agents with shared assumptions = shared blindness. We need at least one lane that always asks:
- Where is this actually used?
- Who calls it?
- What happens at runtime?
- What bypasses it?

---

## Usage Lane Definition

### Purpose

The Usage Lane is a **perspective lane** (not an execution lane). Its sole function is to trace artifact usage through the system and flag:
- Dead code (verified but never called)
- Decorative constraints (exist but can be bypassed)
- Shadow paths (runtime behavior differs from documented)
- Orphaned artifacts (no caller, no purpose)

### Authority Level

**Authority: 50** (below Library's 60)

This is intentional. Usage Lane doesn't verify - it observes. It has no power to accept or reject. It only reports what it finds.

### Lane Identity

```
Lane ID: usage
Authority: 50
Role: Runtime path tracing
Output: UsageReport (not Outcome)
```

---

## Usage Report Schema

```javascript
{
    artifactId: string,        // What is being analyzed
    artifactType: string,      // 'file' | 'function' | 'constraint' | 'route'
    
    // Usage status
    isUsed: boolean,           // Is there at least one caller?
    isReachable: boolean,      // Is there a path from entry point?
    isBypassable: boolean,     // Are there paths around it?
    
    // Callers
    callers: [{
        lane: string,          // Which lane calls this
        entryPoint: string,    // Where the call originates
        frequency: 'always' | 'sometimes' | 'rarely' | 'never'
    }],
    
    // Bypass paths
    bypassPaths: [{
        type: 'runtime' | 'config' | 'fallback' | 'manual',
        description: string,
        risk: 'high' | 'medium' | 'low'
    }],
    
    // Runtime evidence
    runtimeEvidence: {
        lastCalled: ISO8601 | null,
        callCount: number,
        errorCount: number,
        avgExecutionTime: number
    },
    
    // Verdict
    status: 'ACTIVE' | 'DORMANT' | 'DEAD' | 'BYPASSED' | 'SHADOW',
    
    // Confidence in this report
    confidence: number,        // How sure are we about this analysis?
    
    // Recommendation
    recommendation: 'KEEP' | 'INVESTIGATE' | 'REMOVE' | 'FIX_BYPASS'
}
```

---

## Status Definitions

| Status | Definition | Action |
|--------|------------|--------|
| ACTIVE | Has callers, reachable, no bypasses | Keep, monitor |
| DORMANT | Has callers but rarely invoked | Investigate why |
| DEAD | No callers, unreachable | Remove |
| BYPASSED | Has callers but bypass paths exist | Fix bypass |
| SHADOW | Runtime differs from documentation | Update docs or fix code |

---

## Analysis Methods

### 1. Static Analysis

```
For each artifact:
    1. Find all references (imports, calls, requires)
    2. Trace back to entry points
    3. Check if reachable from main/runtime
    4. Flag unreachable artifacts
```

### 2. Runtime Tracing

```
During execution:
    1. Log every function call
    2. Track which paths are actually taken
    3. Compare to static analysis
    4. Flag differences (shadow paths)
```

### 3. Bypass Detection

```
For each constraint:
    1. Find all code paths that check this constraint
    2. Find all code paths that could skip it
    3. Check config/env vars that disable it
    4. Check manual override options
    5. Flag bypass paths
```

---

## Implementation Plan

### Phase 1: Static Usage Tracer (This Session)

Create `src/usage/StaticUsageTracer.js`:
- Scan all files for imports/requires
- Build call graph
- Identify unreachable code
- Generate UsageReports

### Phase 2: Runtime Path Logger

Create `src/usage/RuntimePathLogger.js`:
- Wrap function calls
- Log execution paths
- Track frequency and timing
- Feed to UsageReporter

### Phase 3: Bypass Detector

Create `src/usage/BypassDetector.js`:
- Analyze constraints
- Find config options
- Check for fallback paths
- Identify manual overrides

### Phase 4: Usage Report Integration

Integrate with Outcome Protocol:
- Usage Lane generates UsageReports
- Other lanes can query UsageReports
- Low usage + high verification = suspect
- High bypass risk = flag for review

---

## Current State Analysis

### Files That Exist vs. Files That Are Used

| File | Exists | Is Used | Status |
|------|--------|---------|--------|
| `src/app/page.tsx` | ✅ | ✅ | ACTIVE |
| `src/app/graph/page.tsx` | ✅ | ✅ | ACTIVE |
| `src/attestation/Verifier.js` | ✅ | ⚠️ | DORMANT - not called by app |
| `src/attestation/Signer.js` | ✅ | ⚠️ | DORMANT - not called by app |
| `src/attestation/OutcomeProtocol.js` | ✅ | ❌ | DEAD - just created, never used |
| `src/attestation/OutcomeRouter.js` | ✅ | ❌ | DEAD - just created, never used |
| `src/queue/Queue.js` | ✅ | ⚠️ | DORMANT - not called by app |
| `context-buffer/FREEAGENT_*.md` (19 files) | ✅ | ⚠️ | DORMANT - reference only |
| `scripts/test-*.js` (8 files) | ✅ | ✅ | ACTIVE - tests run |

### Critical Finding

**The entire FreeAgent verification infrastructure (13 files, 2,694 lines) is DORMANT.**

It exists. It's verified. But it's not connected to anything that runs.

The NexusGraph app runs. The attestation system doesn't.

This is exactly the "Usage Lane" problem: **We built it, verified it, documented it - but never hooked it up.**

---

## Immediate Action

Create the Usage Lane now:

1. `src/usage/UsageLane.js` - Main entry point
2. `src/usage/StaticUsageTracer.js` - Static analysis
3. `src/usage/UsageReport.js` - Report schema
4. `scripts/analyze-usage.js` - Run analysis
5. `context-buffer/USAGE_LANE_REPORT_2026-04-20.md` - First report

---

## Expected First Report

The first Usage Lane report will show:

```
CRITICAL: 13 verification files are DORMANT
- Not called by any application code
- Tests pass but no runtime integration
- Documentation exists but no implementation

RECOMMENDATION: Hook up verification to NexusGraph
```

This matches what you already observed. The difference is now there's a **formal mechanism** to detect this automatically.

---

## Long-Term Value

The Usage Lane prevents:
- Building things that don't get used
- Verifying things that don't run
- Documenting things that don't exist at runtime
- Shared assumptions across agents (one lane always asks "but is it used?")

It's the lane that keeps the system honest about what actually matters.

---

**STATUS**: Ready to implement
**NEXT**: Create Usage Lane files
