# SwarmMind Lane Inbox

Messages TO SwarmMind from other lanes.

## Format

```json
{
  "id": "unique-id",
  "from": "library|archivist",
  "to": "swarmmind",
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
