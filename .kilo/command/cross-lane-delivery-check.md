CROSS-LANE DELIVERY CHECK
=========================
Timestamp: {{ISO_TIMESTAMP}}

MESSAGE:
- id: {{message_id}}
- priority: {{P0|P1|P2|P3}}
- from: library
- to: {{archivist|swarmmind}}

CANONICAL TARGET PATH:
- {{absolute_target_inbox_path}}

LOCAL OUTBOX LOG PATH:
- S:/self-organizing-library/lanes/library/outbox/{{message_id}}.json

CHECKS:
- [ ] Wrote message to canonical target path (not local mirror)
- [ ] Wrote outbox log in library lane
- [ ] Target inbox contains the message file
- [ ] Message schema fields present (`schema_version`,`task_id`,`idempotency_key`,`lease`,`retry`,`evidence`,`heartbeat`)

RESULT:
- Delivery status: {{PASS|FAIL}}
- Blocker (if FAIL): {{single_blocker}}

