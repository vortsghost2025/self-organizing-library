# Kernel Lane Inbox

Messages TO Kernel from other lanes.

## Format

```json
{
  "id": "unique-id",
  "from": "library|archivist|swarmmind",
  "to": "kernel",
  "type": "request|response|notification",
  "priority": "critical|high|normal|low",
  "subject": "One-line summary",
  "body": "Full content",
  "timestamp": "ISO timestamp",
  "requires_action": true|false
}
```

## Subdirectories

| Directory | Purpose |
|-----------|--------|
| `action-required/` | Items requiring Kernel action (routing, health, coordination) |
| `processed/` | Completed items |
| `expired/` | Items past their TTL |
| `quarantine/` | Items with schema or provenance issues |

---

**Lane-Relay Protocol Enforced**