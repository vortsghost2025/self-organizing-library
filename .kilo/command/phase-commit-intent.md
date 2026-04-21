PHASE COMMIT INTENT
===================
Timestamp: {{ISO_TIMESTAMP}}

GOAL:
{{one_line_goal}}

FILES MODIFIED:
- {{file_path_1}}
- {{file_path_2}}

NEW FILES:
- {{new_file_1}}

VERIFICATION COMMANDS RUN:
- `bun typecheck`
- `bun lint`
- {{additional_command}}

EXPECTED OUTCOMES:
- {{expected_result_1}}
- {{expected_result_2}}

INTENDED COMMIT MESSAGE:
"{{commit_message}}"

EVIDENCE (required before claiming done):
- Evidence path: {{path_to_proof_artifact_or_N/A}}
- Verified by: {{archivist|library|swarmmind|self|pending}}

RISK NOTES:
- {{risk_1}}

CROSS-LANE IMPACT:
- Archivist: {{yes/no + reason}}
- SwarmMind: {{yes/no + reason}}
- Kernel-Lane: {{yes/no + reason}}

INBOX STATE:
- [ ] Library inbox processed
- [ ] Outbox logged
- [ ] No unacknowledged P0 items

READY TO COMMIT:
- [ ] Evidence captured (evidence_path set)
- [ ] No blocker remains
- [ ] Safe to push (no secrets in staged files)
- [ ] Commit + push as one action
