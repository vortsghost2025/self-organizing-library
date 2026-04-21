CROSS-LANE DELIVERY CHECK
=========================
Timestamp: {{ISO_TIMESTAMP}}

MESSAGE:
- id: {{message_id}}
- task_id: {{stable_task_id}}
- priority: {{P0|P1|P2|P3}}
- type: {{task|response|heartbeat|escalation|handoff}}
- from: library
- to: {{archivist|swarmmind|kernel-lane}}

CANONICAL TARGET PATH:
- {{absolute_target_inbox_path}}

LOCAL OUTBOX LOG PATH:
- S:/self-organizing-library/lanes/library/outbox/{{message_id}}.json

SCHEMA v1.0 FIELD CHECKS:
- [ ] schema_version: "1.0"
- [ ] task_id: stable and unique
- [ ] idempotency_key: deterministic SHA-256 (not placeholder)
- [ ] type: from declared enum
- [ ] retry.max_attempts: set (default 3)
- [ ] evidence.required: set
- [ ] heartbeat.status: set
- [ ] payload.mode: "path" if body > 2000 chars
- [ ] execution block: present

CANONICAL PATH VERIFICATION:
- [ ] Wrote message to CANONICAL target path (absolute, not local mirror)
- [ ] Wrote outbox log in library lane
- [ ] Target inbox contains the message file
- [ ] No duplicate idempotency_key in target inbox

CANONICAL PATHS REFERENCE:
| Lane | Canonical Inbox Path |
|------|---------------------|
| Archivist | S:/Archivist-Agent/lanes/archivist/inbox/ |
| Library | S:/self-organizing-library/lanes/library/inbox/ |
| SwarmMind | S:/SwarmMind Self-Optimizing Multi-Agent AI System/lanes/swarmmind/inbox/ |
| Kernel-Lane | S:/kernel-lane/lanes/kernel-lane/inbox/ |

RESULT:
- Delivery status: {{PASS|FAIL}}
- Blocker (if FAIL): {{single_blocker}}
