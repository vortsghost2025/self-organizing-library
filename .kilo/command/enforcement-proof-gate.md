ENFORCEMENT PROOF GATE
======================
Timestamp: {{ISO_TIMESTAMP}}

COMPONENT:
- {{component_name}}

FIVE-POINT VERIFICATION STANDARD:

| Point | Question | Result |
|-------|----------|--------|
| 1. Exists | Does the artifact exist on disk? | {{YES/NO}} |
| 2. Referenced | Is it referenced by the running system? | {{YES/NO}} |
| 3. Executed | Was it executed at runtime (not just declared)? | {{YES/NO}} |
| 4. Not Bypassed | Can the enforcement be circumvented? | {{SAFE/RISK}} |
| 5. Enforced | Is the enforcement active and blocking violations? | {{YES/NO}} |

RUNTIME ENFORCEMENT PROOF:
1. Runtime call path:
- file: {{file_path}}
- function: {{function_name}}
- trigger: {{entry_point}}
2. Positive trace:
- command: {{command}}
- evidence: {{artifact_path}}
3. Negative trace (blocked failure case):
- command: {{command}}
- evidence: {{artifact_path}}
4. Bypass analysis:
- alternate path exists? {{yes/no}}
- if yes, status: {{blocked|open-risk}}

CONVERGENCE GATE OUTPUT:
```json
{
  "claim": "{{single_sentence_claim}}",
  "evidence": "{{path_to_proof}}",
  "verified_by": "{{archivist|library|swarmmind|self}}",
  "contradictions": [],
  "status": "{{proven|unproven|conflicted|blocked}}"
}
```

STATUS ROUTING:
| Status | Action |
|--------|--------|
| proven | Forward to Archivist |
| conflicted | Forward to Archivist (P0) |
| blocked | Forward to Archivist (P1) |
| unproven | Queue for verification, do NOT forward |

GATE DECISION:
- [ ] PASS (enforced in runtime path)
- [ ] FAIL (dead code / bypass / missing evidence)

PRIMARY BLOCKER (if FAIL):
- {{one_blocker_only}}
