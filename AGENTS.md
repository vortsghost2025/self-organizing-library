## Lane-Relay Protocol (ENFORCED)

All cross-lane communication MUST use the `lanes/` structure.

### Paths (Deterministic - No Guessing)

| Lane | Inbox Path |
|------|------------|
| Archivist | `lanes/archivist/inbox/` |
| Library | `lanes/library/inbox/` |
| SwarmMind | `lanes/swarmmind/inbox/` |

**Each repo has all three directories. This is NOT one repo.**

### Session Start Protocol (MANDATORY)

1. READ `lanes/{self}/inbox/` FIRST
2. Process by priority (P0 > P1 > P2 > P3)
3. Move processed to `lanes/{self}/inbox/processed/`

### Sending Messages (MANDATORY)

```
WRITE lanes/{target}/inbox/{message-id}.json
LOG  lanes/{self}/outbox/{message-id}.json
```

For P0 priority:
```
ALSO WRITE lanes/{target}/inbox/urgent_{id}.json
```

### Verification Checklist

- [ ] inbox processed
- [ ] outbox logged
- [ ] no pending P0 items

### Deprecated

`.lane-relay/` is DEPRECATED. Use `lanes/` only.

---

## Optional Feature Guides

When users request features beyond the base template, check for available recipes in `.kilocode/recipes/`.

### Available Recipes

| Recipe       | File                                | When to Use                                           |
| ------------ | ----------------------------------- | ----------------------------------------------------- |
| Add Database | `.kilocode/recipes/add-database.md` | When user needs data persistence (users, posts, etc.) |

### How to Use Recipes

1. Read the recipe file when the user requests the feature
2. Follow the step-by-step instructions
3. Update the memory bank after implementing the feature

## Memory Bank Maintenance

After completing the user's request, update the relevant memory bank files:

- `.kilocode/rules/memory-bank/context.md` - Current state and recent changes
- Other memory bank files as needed when architecture, tech stack, or project goals change
