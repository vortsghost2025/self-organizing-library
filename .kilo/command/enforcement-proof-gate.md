ENFORCEMENT PROOF GATE
======================
Timestamp: {{ISO_TIMESTAMP}}

COMPONENT:
- {{component_name}}

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

GATE DECISION:
- [ ] PASS (enforced in runtime path)
- [ ] FAIL (dead code / bypass / missing evidence)

PRIMARY BLOCKER (if FAIL):
- {{one_blocker_only}}

