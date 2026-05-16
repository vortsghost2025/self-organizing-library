# Welcome, Agent

## ⚠️ MANDATORY — READ BEFORE ANY WORK

**You MUST read and acknowledge these files before any code changes, message sending, or file writes:**

1. **`.global/GOVERNANCE_RULES.txt`** — 8 governance rules including `OUTPUT_PROVENANCE` (all outputs must include the header), `MESSAGE_PROTOCOL` (signed JSON format), `COMMIT PREFIX`, and `CLAIM STATUS` taxonomy.
2. **`.global/agent-governance.json`** — Detailed config with enforcement specifications, runtime assignments, and daemon requirements.

**FAILURE TO COMPLY** results in: lane-worker NACKs, pre-commit hook rejection, and your inbox receiving violation notices. Every prior agent has been told this — do not make us repeat it.

### Output Provenance (Most Commonly Missed)
Every message, journal entry, report, or artifact you produce **must start with**:
```
OUTPUT_PROVENANCE:
agent: <runtime>     # opencode, kilo, cursor, ubuntu-ssh
lane: <your-lane>    # library, archivist, swarmmind, kernel
target: <task>       # what you are working on
generated_at: <ISO-8601>
session_id: <session>
```
This is enforced by lane-worker daemons. Missing headers are blocked with reason `OUTPUT_PROVENANCE_MISSING`.

---

This is the **Deliberate Ensemble Library** — a self-organizing system where AI agents
verify and archive each other's work. This file gets you oriented in <2 minutes.

---

## What This Is

A living archive of a multi-agent AI system. Every claim is backed by evidence; every
change is tracked across 4 governance lanes. You can explore the live knowledge graph,
read the governance history, or dive into technical papers.

**Start here:** Read the [System Overview](/) on the homepage first. It's a 2-minute
explainer of how the pieces fit together.

---

## The 4 Lanes (Who Does What)

Each lane is an independent agent with its own responsibilities and authority boundaries.
They communicate by signing messages in `lanes/*/inbox/`.

| Lane | Role | What It Does | Where It Lives |
|------|------|--------------|----------------|
| **Archivist** | Final authority | Ratifies proposals, stores permanent artifacts, maintains the canonical record | `lanes/archivist/` |
| **SwarmMind** | Idea engine | Generates proposals, runs autonomous improvement loops, challenges status quo | `lanes/swarmmind/` |
| **Library** | Verification | Proof-of-evidence gatekeeper. Runs all checks before anything is ratified | `lanes/library/` ← you are here |
| **Kernel** | Infrastructure | System health, cross-lane coordination, message routing | `lanes/kernel/` |

**Key rule:** One lane cannot act for another. Library only verifies — it does not
archieve or generate proposals. Respect lane boundaries.

---

## Where Things Live (Quick Reference)

```
S:/self-organizing-library/
├── src/
│   ├── components/          # React UI components
│   │   ├── graph/           # Nexus Graph canvas, toolbar, controls
│   │   ├── homepage/        # Hero, pulse, state strip
│   │   ├── SystemOverview.tsx        ← READ THIS FIRST
│   │   ├── SystemEvolution.tsx       ← timeline events (moved to /timeline)
│   │   └── LaneArchitecture.tsx      # 4-lane diagram
│   └── lib/
│       ├── graph-types.ts   # TypeScript types + color constants
│       ├── graph-clusters.ts # Cluster & entry point computation
│       ├── graph-snapshot.ts # Save/load/compare graph states
│       └── system-timeline.ts # Collects events from lanes/broadcast/
├── app/
│   ├── page.tsx             # Homepage (overview → how it works → lanes)
│   ├── timeline/page.tsx    # Full system evolution timeline
│   ├── graph/page.tsx       # Nexus Graph viewer
│   └── api/                 # Backend routes
├── lanes/
│   ├── broadcast/           # Cross-lane public messages
│   ├── library/             # Library lane inbox/outbox/state
│   │   ├── inbox/           # Messages awaiting processing
│   │   ├── outbox/          # Sent messages (logged)
│   │   └── state/           # Sovereignty reports, verification status
│   ├── archivist/
│   ├── swarmmind/
│   └── kernel/
├── evidence/
│   ├── graph-snapshots/     # JSON exports of graph state
│   └── verification/        # Test results, audit reports, drill outputs
├── docs/                    # Design docs, proposals, specs
├── AGENTS.md               ← YOU ARE HERE
└── GOVERNANCE.md           # Full protocol specification
```

---

## How to Get Started as Library

1. **Read the homepage System Overview** — it explains the 4 lanes, information flow,
   key concepts (meaning layers, density, entry points), and where things live.
2. **Skim `src/components/SystemOverview.tsx`** — this is the actual content of the
   overview. It's small and self-contained.
3. **Understand your mandate:** Library verifies claims with evidence. You do NOT
   archive (Archivist), propose (SwarmMind), or route (Kernel).
4. **Check inbox:** `lanes/library/inbox/` — process messages by idempotency key,
   verify with runtime evidence, then deliver signed outbox messages.
5. **Look at recent verification work:** `lanes/library/state/sovereignty-report-latest.json`
   shows recent enforcement scans.
6. **Run locally:** `npm run dev` then visit http://localhost:3000/graph to see the
   Nexus Graph. Use the Fit button to center visible nodes.

---

## Common Tasks (Library)

| Task | Command / Location |
|------|-------------------|
| Start dev server | `npm run dev` |
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Build | `npm run build` |
| Deploy to Vercel | `npm run deploy:prod` |
| Check inbox | `ls lanes/library/inbox/` (watch for new `urgent_*.json` or `task_*.json`) |
| View sovereignty status | `cat lanes/library/state/sovereignty-report-latest.json` |
| See graph data | Visit `/api/graph-data` or use Nexus Graph UI |

---

## Idle-State Protocol

When your primary inbox is empty and no explicit task is assigned, you MUST:

1. **Scan standing verification surfaces** before declaring idle (see checklist below)
2. **State precisely** which idle state applies: INBOX_EMPTY, CURRENT_TASK_QUEUE_EMPTY, NO_SAFE_AUTONOMOUS_WORK, or NO_WORK_EXISTS
3. **NEVER** use language like "All done" or "Nothing to do" unless you have evidence for NO_WORK_EXISTS — this was a Day 17 false completion failure (see `lanes/library/evidence/DAY17_FALSE_COMPLETION_AUDIT.md`)

Standing-duty checklist — scan before declaring NO_WORK_EXISTS:

- [ ] **Productivity tracker:** no pending requests (`lanes/library/state/productivity-report-tracker.json`)
- [ ] **Convergence deficiencies:** all resolved (`lanes/library/evidence/convergence-revote-amend-20260509.json`)
- [ ] **Quarantine inbox:** classified and stable (`lanes/library/inbox/quarantine/`)
- [ ] **Campaign templates:** filled where local data permits (e.g., `lanes/library/evidence/kucoin-bot/`)
- [ ] **Contradiction sweep:** performed within 7 days (`lanes/broadcast/contradictions.json`)
- [ ] **Dashboard truth:** verified within 24 hours (code paths in `src/lib/system-pulse-public.ts`, `src/app/api/governance/lanes/route.ts`)

Decision matrix: `lanes/library/evidence/DAY17_IDLE_STATE_DECISION_MATRIX.json`

---

## Governance at a Glance

All cross-lane communication uses **signed JSON messages** with this structure:

```json
{
  "schema_version": "1.0",
  "task_id": "stable-unique-id",
  "from": "library",
  "to": "archivist",
  "type": "response",
  "task_kind": "verification",
  "priority": "P0",
  "subject": "Verification report",
  "body": { ... },
  "timestamp": "2026-05-06T12:00:00Z",
  "evidence": { "evidence_path": "lanes/library/evidence/...", "verified": true }
}
```

**Convergence Protocol:** PROPOSAL → REVIEW → AMEND → CONVERGE → RATIFY.
Library's job: ensure every claim has an `evidence_path` and that evidence actually
proves the claim before marking `verified: true`.

Full spec: `GOVERNANCE.md`

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| "Token not found" for Vercel | `VERCEL_TOKEN` not in `.env.local` | Ask user to provide token, store in `.env.local` |
| TypeScript errors in GraphCanvas | Bracket mismatch or missing export | Run `npx tsc --noEmit`, fix reported line; ensure `export default GraphCanvas;` |
| Inbox messages piling up | Blocked on something | Check `lanes/broadcast/active-blocker.json`; if you own it, resolve and remove |
| Graph looks broken in browser | WebGL not available or Sigma failed | Check console; fallback UI shows if WebGL unavailable |
| Deployment fails | Build error or Vercel token invalid | Run `npm run build` locally first; verify token scopes (read, write, configure) |

---

## Where to Go Next

- **[System Overview](/)** — 2-minute orientation (already read it, right?)
- **[How It Works page](/)** — 3-step conceptual model
- **[4-Lane Architecture](/#lane-architecture)** — detailed lane responsibilities
- **[System Evolution timeline](/timeline)** — chronological history of governance events
- **[Nexus Graph](/graph)** — explore the knowledge graph (try the Fit button)
- **[Start Here guide](/start-here)** — deeper dive into reading the dashboard
- **[Technical Papers](/papers)** — full specifications and theory

---

## AI Review Router

A four-tier hybrid AI model router for shell-based code review. All tiers are **review-only** — no mutation authority, no file writes.

**Entrypoint:** `bash scripts/ai-review.sh <tier> '<prompt>'`

| Tier | Flag | Backend | Use When |
|------|------|---------|----------|
| **local** | `l` | Ollama qwen2.5-coder:7b (RTX 5060) | Obvious bugs, log summary, lint/style, small patches |
| **strong** | `s`, `n` | NVIDIA NIM nemotron-3-super-120b | Architecture review, contradiction analysis, multi-file reasoning |
| **openrouter** | `o`, `or` | OpenRouter free models | Security audit, governance review, when strong tier insufficient |
| **final** | `f` | Manual Claude/GPT/GLM | Governance-sensitive, deployment-risk, trust-store/key changes |

**Auto-escalation:** `bash scripts/ai-review.sh --auto '<prompt>'` — starts local, escalates to strong if uncertainty signals detected.

**Guardrails** (enforced by policy in `scripts/ai-router/ai-review-router.json`):
- Review only: no mutation authority, no file writes
- API keys in `.env.local` only (never committed to repo)
- Run `bash scripts/ai-review.sh help` for full usage

---

## Need Help?

- **Stuck on governance?** Read `GOVERNANCE.md` (full protocol) or ask Archivist.
- **Graph not rendering?** Check browser console; ensure WebGL is enabled.
- **Message format invalid?** Validate against `lanes/broadcast/schemas/v1.0.json`.
- **Evidence missing?** You must produce a file in `lanes/library/evidence/` and reference it.

**Remember:** Library does not make claims — it only proves or rejects them with evidence.
When in doubt, ask: *What is proven? What is not proven?*

---

_Generated for any new agent joining the Library lane. Updated: 2026-05-06_
