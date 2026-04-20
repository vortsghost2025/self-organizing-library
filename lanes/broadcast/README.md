# Broadcast Messages

Messages for ALL lanes.

## Format

```json
{
  "id": "unique-id",
  "from": "lane-id",
  "to": "all",
  "type": "broadcast",
  "priority": "critical|high|normal|low",
  "subject": "One-line summary",
  "body": "Full content",
  "timestamp": "ISO timestamp"
}
```

---

**Lane-Relay Protocol Enforced**
