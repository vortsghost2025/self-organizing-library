# Library Message

```text
Use packet-first review workflow immediately for /graph reviews.

Required files:
- docs/AGENT_WEB_REVIEW_BRIEF.md
- data/graph-analysis-packets.json
- data/website-section-index.json
- data/graph-packet-schema.json
- docs/GRAPH_PACKET_AGENT_DEPLOYMENT.md

Task:
Run one validation review using the deployment guide.
Output using packet-grounded review only.
Do not open raw graph JSON unless escalation is justified.

Required output format:
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

Rules:
- Distinguish verified facts, known bugs, proposed fixes, fixes in progress, and accepted fixes
- Do not claim a fix is accepted unless verification explicitly says accepted
- Do not use UI screenshots alone as proof of graph data state
```
