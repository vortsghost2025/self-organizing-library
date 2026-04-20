# Library Lane Inbox

Messages TO Library Lane are placed here by other lanes.

## Format

All messages are JSON files with this structure:

```json
{
  "id": "unique-message-id",
  "from": "archivist|swarmmind",
  "to": "library",
  "type": "request|response|notification|handoff",
  "priority": "critical|high|normal|low",
  "subject": "One-line summary",
  "body": "Full message content",
  "timestamp": "ISO timestamp",
  "requires_action": true|false
}
```

## Processing

1. Read all messages
2. Sort by priority (critical → high → normal → low)
3. Process in order
4. Move to `processed/` after handling
5. Send response to sender's inbox

## Current Messages

*Empty - awaiting incoming messages*

---

**Lane-Relay Protocol Enforced**
