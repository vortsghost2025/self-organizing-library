# Graph Packet Agent Deployment Instructions

## Purpose

Use packet-first review for `/graph` so agents begin from compressed, structured evidence rather than raw graph JSON.

This workflow is meant to:

- reduce context overload
- preserve accepted fixes and known state
- separate verified facts from proposed work
- prevent agents from hallucinating UI causes from screenshots alone

## Required Starting Files

- `docs/AGENT_WEB_REVIEW_BRIEF.md`
- `data/graph-analysis-packets.json`
- `data/website-section-index.json`
- `data/graph-packet-schema.json`

Optional supporting context:

- `docs/agent-handoffs/CURRENT_STATE_SUMMARY.md`

## Prohibited Behavior

- Do not inspect raw 30k-line graph JSON unless explicitly authorized.
- Do not claim fixes are accepted unless verification says accepted.
- Do not confuse proposed fixes with implemented fixes.
- Do not use UI screenshots alone as proof of data state.
- Do not regenerate graph data unless the current task explicitly requires regeneration.
- Do not restart `/graph` investigation from scratch if packet and trail context already answer the question.

## Authoritative Fields

### Graph Packet

Use these fields as primary evidence:

- `counts`
- `anomalies`
- `top_nodes`
- `interpretation`
- `next_checks`
- `packet_size`
- `agent_takeaway`

### Website Section Index

Use these fields as route-level context:

- `route`
- `purpose`
- `audience`
- `source_files`
- `known_confusions`
- `review_instructions`

## Required Review Flow

### Step 1

Read `docs/AGENT_WEB_REVIEW_BRIEF.md` first and extract the review guardrails.

### Step 2

Read `data/graph-analysis-packets.json` and locate the active packet for `/graph`.

Record:

- counts
- anomalies
- interpretation
- next checks

### Step 3

Read `data/website-section-index.json` and find the `/graph` route entry.

Record:

- route purpose
- intended audience
- source files
- known confusions
- review instructions

### Step 4

Review the live or local UI against packet claims and route instructions.

Rules:

- use screenshots as UI evidence only
- do not treat screenshots as data truth
- open raw graph JSON only if a packet field is missing, contradictory, or explicitly escalated

### Step 5

Produce a structured packet-grounded review.

Always leave:

- `commit_ready: false`
- `push_ready: false`

## Claim Status Taxonomy

### Verified Facts

Claims backed by packet fields, route index fields, accepted verification artifacts, or direct build/typecheck/browser evidence.

### Known Bugs

Reproduced defects with evidence from packet anomalies, UI behavior, logs, or verification results.

### Proposed Fixes

Candidate remediations not yet implemented or not yet re-verified.

### Fixes In Progress

Changes that exist in code or runtime but are not yet fully validated.

### Accepted Fixes

Fixes that are explicitly verified and accepted in the existing trail.

## Output Template

```text
WEB_GRAPH_REVIEW_FROM_PACKET:
  packet_used:
  website_index_used:
  raw_json_opened:
  top_findings:
    - finding:
      evidence_field:
      status:
      confidence:
  recommended_next_checks:
  uncertainty:
  commit_ready: false
  push_ready: false
```

## Failure Modes to Watch

- `packet_count_zero_verifier_bug`
- `graph UI empty despite nonzero packet counts`
- `repo/lens filters hiding edges`
- `raw JSON drowning`
- `claiming fix complete before typecheck/build/browser check`
- `treating screenshot state as packet truth`
- `confusing current UI mode/filter state with canonical graph state`

## Validation Prompt For Fresh Agent

```text
Review /graph using only docs/AGENT_WEB_REVIEW_BRIEF.md, data/graph-analysis-packets.json, data/website-section-index.json, and data/graph-packet-schema.json. Do not open raw graph JSON unless you can name the missing packet field that forces escalation. Report verified facts, known bugs, proposed fixes, fixes in progress, and accepted fixes separately.
```
