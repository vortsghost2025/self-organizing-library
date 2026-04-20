# Archivist Lane Inbox

Messages TO Archivist from other lanes.

## Format

```json
{
  "id": "unique-id",
  "from": "library|swarmmind",
  "to": "archivist",
  "type": "request|response|notification",
  "priority": "critical|high|normal|low",
  "subject": "One-line summary",
  "body": "Full content",
  "timestamp": "ISO timestamp",
  "requires_action": true|false
}
```

---

**Lane-Relay Protocol Enforced**
