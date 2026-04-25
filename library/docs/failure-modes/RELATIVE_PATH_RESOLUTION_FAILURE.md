# NFM-021: Relative Path Resolution Failure

**Status:** DOCUMENTED, MITIGATED
**Severity:** MEDIUM
**Discovery:** 2026-04-25 (Archivist lane-worker blocking SwarmMind multi-task review)
**Cross-references:** NFM-020 (Cross-Lane Observability Boundary)

---

## Definition

The artifact-resolver only handled absolute paths. Cross-lane messages carrying
relative `evidence_exchange.artifact_path` values (e.g., `lanes/archivist/inbox/...`)
were always rejected with `OUTSIDE_ALLOWED_ROOTS` because the resolver never
resolved relative paths against allowed roots before checking containment.

## Root Cause

`ArtifactResolver.resolveExists()` called `isWithinAllowedRoots()` directly on
the raw artifact_path string. For relative paths, `normalizePath()` would
lowercase the relative path fragment, but it would never start with any allowed
root prefix (e.g., `s:/archivist-agent`). The containment check always failed.

This is a special case of NFM-020 (Cross-Lane Observability Boundary): the
artifact path was *expressed* relative to a lane root, but the resolver only
understood absolute paths.

## Key Evidence

- SwarmMind multi-task review (`archivist-multi-task-review-001.json`) had
  `evidence_exchange.artifact_path = "lanes/archivist/inbox/archivist-multi-task-review-001.json"`
- Archivist lane-worker routed to `blocked` with `EXECUTION_NOT_VERIFIED`,
  reason: `Artifact unresolvable: OUTSIDE_ALLOWED_ROOTS`
- The artifact *did* exist at `S:/Archivist-Agent/lanes/archivist/inbox/...`
- Moving the same file back to inbox and re-running with the fix produced:
  `processed=1, execution_verified=true`

## Fix Applied

Added `resolveRelativePath()` method to `ArtifactResolver`:
1. For relative paths, iterate through each allowed root
2. Join root + relative path to form a candidate absolute path
3. Verify the normalized candidate starts with the root (prevents traversal escape)
4. Return the first valid candidate, or null if none match

`resolveExists()` now branches:
- **Absolute path:** existing `isWithinAllowedRoots()` check (unchanged)
- **Relative path:** `resolveRelativePath()` first, then proceed with resolved absolute path

Deployed to all 4 lanes with updated `config/allowed_roots.json` containing
all lane roots for cross-lane resolution.

## Detection Pattern

- `EXECUTION_NOT_VERIFIED` with `OUTSIDE_ALLOWED_ROOTS` on messages that
  carry a *relative* `evidence_exchange.artifact_path`
- The artifact file exists on disk at `<some-allowed-root>/<relative-path>`
- The message type is `response` with `requires_action=false`

## Remaining Concerns

1. **First-match ambiguity:** `resolveRelativePath()` returns the first
   allowed root where the path resolves. If multiple roots contain the same
   relative path, only the first is checked. Config should list the local
   lane's root first.
2. **Self-referential artifact:** For terminal informational messages
   (type=response, requires_action=false), the artifact_path often references
   the message itself. The artifact exists *while* lane-worker is reading it,
   but gets deleted from inbox after processing. The execution gate runs
   before deletion, so this works correctly.
3. **NFM-020 general case:** Cross-lane absolute paths (e.g., `S:/SwarmMind/...`)
   already work because all 4 lane roots are in allowed_roots. Relative paths
   now also work. NFM-020 is substantially mitigated.
