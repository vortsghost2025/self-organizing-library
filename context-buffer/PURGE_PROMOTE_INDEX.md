# Context-Buffer Purge/Promote Index

**Date**: 2026-04-18T09:26:00-04:00
**Action**: Purge temporary, promote canonical

---

## CANONICAL FILES (PROMOTE)

| File | Destination | Reason |
|------|-------------|--------|
| SELF_STATE_ALIASING_FAILURE_MODE.md | library/docs/failure-modes/ | Core contribution |
| SESSION_ID_FRAGMENTATION_FIX.md | library/docs/specs/ | Phase 1 spec |
| SESSION_REGISTRY_SCHEMA_V2.md | library/docs/specs/ | Phase 1 spec |
| FILE_OWNERSHIP_REGISTRY_SYNC_MODEL.md | library/docs/specs/ | Phase 2 spec |
| SESSION_MODE_TEMPLATE.md | library/docs/specs/ | Phase 1 spec |
| FORMAL_VERIFICATION_GATE_PHASE2.md | library/docs/verification/ | Verification gate |
| CAISC_CONTRIBUTION_SELF_STATE_ALIASING.md | library/docs/papers/ | Paper contribution |
| PHENOTYPE_REGISTRY_ARTIFACTS.md | library/docs/archivist/ | For Archivist |

---

## TEMPORARY FILES (PURGE/DELETE)

| File | Status | Reason |
|------|--------|--------|
| STABILIZATION_PATH.md | DELETE | Working doc, superseded |
| CROSS_REFERENCE_LANE_CONTEXT_GATE.md | DELETE | Comparison done |
| DRIFT_DETECTED_RECOVERY_PROTOCOL.md | DELETE | Superseded by formal gate |
| VERIFICATION_FAILURE_RECOVERY_PROTOCOL.md | DELETE | Needs normalization |
| MEV-SWARM-CLEANUP-PLAN.md | DELETE | One-time analysis |
| PHASE2_ONE_LINE_COMMANDS.md | DELETE | Executed |
| PHASE2_CLEANUP_COMMANDS.md | DELETE | Executed |
| C-DEV_CLEANUP_PLAN.md | DELETE | One-time analysis |
| GOVERNANCE_AMENDMENT_SELF_STATE_RESOLUTION.md | ARCHIVE | Pending approval |
| README.md | KEEP | Context-buffer readme |

---

## ACTION PLAN

### Step 1: Create Directories

```powershell
mkdir -p S:\self-organizing-library\library\docs\failure-modes
mkdir -p S:\self-organizing-library\library\docs\specs
mkdir -p S:\self-organizing-library\library\docs\verification
mkdir -p S:\self-organizing-library\library\docs\papers
mkdir -p S:\self-organizing-library\library\docs\archivist
mkdir -p S:\self-organizing-library\library\docs\pending
```

### Step 2: Promote Canonical Files

```powershell
copy "S:\self-organizing-library\context-buffer\SELF_STATE_ALIASING_FAILURE_MODE.md" "S:\self-organizing-library\library\docs\failure-modes\"
copy "S:\self-organizing-library\context-buffer\SESSION_ID_FRAGMENTATION_FIX.md" "S:\self-organizing-library\library\docs\specs\"
copy "S:\self-organizing-library\context-buffer\SESSION_REGISTRY_SCHEMA_V2.md" "S:\self-organizing-library\library\docs\specs\"
copy "S:\self-organizing-library\context-buffer\FILE_OWNERSHIP_REGISTRY_SYNC_MODEL.md" "S:\self-organizing-library\library\docs\specs\"
copy "S:\self-organizing-library\context-buffer\SESSION_MODE_TEMPLATE.md" "S:\self-organizing-library\library\docs\specs\"
copy "S:\self-organizing-library\context-buffer\FORMAL_VERIFICATION_GATE_PHASE2.md" "S:\self-organizing-library\library\docs\verification\"
copy "S:\self-organizing-library\context-buffer\CAISC_CONTRIBUTION_SELF_STATE_ALIASING.md" "S:\self-organizing-library\library\docs\papers\"
copy "S:\self-organizing-library\context-buffer\PHENOTYPE_REGISTRY_ARTIFACTS.md" "S:\self-organizing-library\library\docs\archivist\"
copy "S:\self-organizing-library\context-buffer\GOVERNANCE_AMENDMENT_SELF_STATE_RESOLUTION.md" "S:\self-organizing-library\library\docs\pending\"
```

### Step 3: Purge Temporary Files

```powershell
Remove-Item "S:\self-organizing-library\context-buffer\STABILIZATION_PATH.md"
Remove-Item "S:\self-organizing-library\context-buffer\CROSS_REFERENCE_LANE_CONTEXT_GATE.md"
Remove-Item "S:\self-organizing-library\context-buffer\DRIFT_DETECTED_RECOVERY_PROTOCOL.md"
Remove-Item "S:\self-organizing-library\context-buffer\VERIFICATION_FAILURE_RECOVERY_PROTOCOL.md"
Remove-Item "S:\self-organizing-library\context-buffer\MEV-SWARM-CLEANUP-PLAN.md"
Remove-Item "S:\self-organizing-library\context-buffer\PHASE2_ONE_LINE_COMMANDS.md"
Remove-Item "S:\self-organizing-library\context-buffer\PHASE2_CLEANUP_COMMANDS.md"
Remove-Item "S:\self-organizing-library\context-buffer\C-DEV_CLEANUP_PLAN.md"
```

---

## PENDING APPROVALS INDEX

After purge/promote, create index at:
`S:\self-organizing-library\library\docs\pending\INDEX.md`

---

## RESULT

- 8 files promoted to library/docs/
- 8 files purged from context-buffer
- 2 files remaining (README.md + pending amendment)
- 10 files in context-buffer reduced to 2

---

**Status**: Awaiting execution confirmation
