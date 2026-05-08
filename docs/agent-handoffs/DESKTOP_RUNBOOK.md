# Desktop Runbook

Use this when sending work to the live desktop agents.

## Purpose

Preserve continuity. Agents should follow the existing trail, use the current review surface, and avoid undoing already-verified work.

## Before Sending Anything

Check these first:

- `docs/AGENT_WEB_REVIEW_BRIEF.md`
- `docs/GRAPH_PACKET_AGENT_DEPLOYMENT.md`
- `docs/agent-handoffs/ARCHIVIST_MESSAGE.md`
- `docs/agent-handoffs/LIBRARY_MESSAGE.md`
- `data/graph-analysis-packets.json`
- `data/website-section-index.json`
- `data/graph-packet-schema.json`

If journal or commit-trail records exist for the current task, include them in the agent's context before asking for new work.

## Archivist Desktop Flow

1. Open [ARCHIVIST_MESSAGE.md](S:/self-organizing-library/docs/agent-handoffs/ARCHIVIST_MESSAGE.md)
2. Copy the full message block
3. Send it to Archivist
4. Attach or reference relevant journal/commit-trail entries for:
   - P0 acceptance
   - P2 deployment guide creation
   - packet-first workflow decision
5. Ask Archivist to ratify, not to re-derive

## Library Desktop Flow

1. Open [LIBRARY_MESSAGE.md](S:/self-organizing-library/docs/agent-handoffs/LIBRARY_MESSAGE.md)
2. Copy the full message block
3. Send it to Library
4. Include any journal/commit-trail entries showing:
   - graph render bug investigation
   - Sigma renderer fix
   - packet-first review decision
5. Ask Library to validate from packet evidence, not from raw graph JSON

## Operator Rules

- Do not ask either agent to “start fresh” on `/graph`
- Do not omit the packet files
- Do not ask them to regenerate graph data unless the current packet is proven stale or invalid
- Do not allow proposed fixes to overwrite accepted fixes in the trail
- Prefer “review this existing state” over “investigate from scratch”

## Minimal Operator Prompt

```text
Use the existing journal and commit trail as authoritative history. Follow the packet-first graph review workflow already established. Do not restart the investigation from raw graph JSON unless escalation is justified.
```
