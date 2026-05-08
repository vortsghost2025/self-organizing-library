# Headless Runbook

Use this when sending work to the Ubuntu headless agents.

## Purpose

Maintain a stable execution trail so headless agents can continue work without undoing verified fixes or reopening already-closed questions.

## Required Context Bundle

Provide these files together:

- `docs/AGENT_WEB_REVIEW_BRIEF.md`
- `docs/GRAPH_PACKET_AGENT_DEPLOYMENT.md`
- `docs/agent-handoffs/ARCHIVIST_MESSAGE.md`
- `docs/agent-handoffs/LIBRARY_MESSAGE.md`
- `data/graph-analysis-packets.json`
- `data/website-section-index.json`
- `data/graph-packet-schema.json`

Also provide:

- the relevant journal entry or journal path
- the relevant commit notes or commit-trail summary
- current task status: `P0 accepted`, `P2 delivered`

## Headless Archivist Send Pattern

Send:

```text
Follow docs/agent-handoffs/ARCHIVIST_MESSAGE.md exactly.
Use the existing journal and commit trail as prior accepted state.
Do not re-open packet-builder validity unless new contradictory evidence appears.
```

## Headless Library Send Pattern

Send:

```text
Follow docs/agent-handoffs/LIBRARY_MESSAGE.md exactly.
Use packet-first review only.
Use the journal and commit trail to distinguish accepted fixes from proposed work.
Do not inspect raw graph JSON unless escalation is justified.
```

## State Discipline

Headless agents should preserve these distinctions:

- `verified_fact` = supported by packet fields, verification artifacts, or accepted trail entries
- `known_bug` = reproduced and evidenced
- `proposed_fix` = not yet accepted
- `fix_in_progress` = implemented but not fully validated
- `accepted_fix` = explicitly verified and accepted in the trail

## Anti-Regression Rules

- Never collapse accepted history into “unknown”
- Never replace packet-first workflow with raw JSON review by default
- Never treat screenshots as equivalent to packet evidence
- Never overwrite accepted fixes because an agent lacked prior context

## Minimal Headless Wrapper Prompt

```text
You are continuing an existing verified workflow. Read the journal and commit trail first. Use the packet-first graph review files as the default review surface. Preserve accepted fixes. Do not restart from raw graph JSON unless explicitly escalated.
```
