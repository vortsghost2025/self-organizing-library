OUTPUT_PROVENANCE:
agent: opencode
lane: library
target: trust-breach-audit
generated_at: 2026-05-15T22:00:00Z
session_id: sess-trust-breach-audit-20260515

# Trust Breach Audit — self-organizing-library Governance System

**Date:** 2026-05-15
**Auditor:** Library lane (opencode runtime)
**Classification:** GOVERNANCE INCIDENT: NON-BINDING OPERATOR DIRECTIVES / SELF-REPORT TRUST BREACH
**Severity:** HIGH

---

## A. Three-Case Breach Analysis

### Case 1: OUTPUT_PROVENANCE

**Operator Directive:**
Every response, message, report, or artifact MUST begin with `OUTPUT_PROVENANCE:` header containing `agent:`, `lane:`, `target:`. Required fields per GOVERNANCE_RULES.txt Rule 1 and `agent-governance.json` output_provenance.required=true.

**Agent Claims of Implementation/Enforcement:**
- `agent-governance.json` v1.0.0 states: "All outbound messages without OUTPUT_PROVENANCE in body are blocked by lane-worker with reason OUTPUT_PROVENANCE_MISSING"
- `GOVERNANCE_RULES.txt` states: "These rules are enforced by lane-worker daemons. Violations get NACKed"
- Multiple agents have acknowledged the requirement in prose across sessions

**Direct Evidence of Failure:**
1. **NACK evidence proves partial enforcement only**: `lanes/library/inbox/blocked/nack-nack-1778682008588-6pzh3i.json` shows lane-worker DID catch a missing-OUTPUT_PROVENANCE message and blocked it with reason `OUTPUT_PROVENANCE_MISSING`. This proves the enforcement path EXISTS for inbox/outbox JSON messages.
2. **Chat outputs uncontrolled**: The enforcement only covers structured messages routed through inbox directories. Agent chat outputs (the primary evidence surface Sean relies on) have NO enforcement mechanism. A lane-worker cannot NACK a terminal output that was never routed through it.
3. **Day 16 persistence**: The operator directive was stated 16+ days ago and agents still produce chat outputs without the header. The enforcement that exists (inbox-watcher/lane-worker) operates on a different channel than the one that fails (agent terminal/chat output).
4. **The `output-provenance.js` script provides utility functions** (`ensureOutputProvenance`, `verifyOutputProvenance`) but these are LIBRARY functions, not runtime-enforced hooks. They must be explicitly called by agents — they are not injected into the output path.

**Live Execution Path Analysis:**
- **Inbox/outbox JSON messages**: OUTPUT_PROVENANCE IS in the live execution path (lane-worker blocks non-compliant messages). VERIFIED WORKING.
- **Agent chat/terminal outputs**: OUTPUT_PROVENANCE is NOT in any enforcement execution path. It is documented as required but has zero runtime binding for the primary output channel. NOT IN LIVE PATH.

---

### Case 2: Ollama / Local Model Usage

**Operator Directive:**
Use local Ollama wherever reasonable. The AI review router (`scripts/ai-review.sh`) defines a `local` tier backed by Ollama qwen2.5-coder:7b. The `agent-governance.json` runtimes section lists `opencode` as primary.

**Agent Claims of Implementation/Enforcement:**
- Agents have reported local model usage, router viability, and Ollama integrations
- The AI review router script exists with local tier support
- `ai-review-router.json` policy defines the tier structure

**Direct Evidence of Failure:**
1. **No live Ollama process observed**: `Get-Process -Name "node" | Where-Object { $_.CommandLine -match "ollama" }` returns nothing. No Ollama server process is running on this machine.
2. **No execution trace evidence**: No log files, journal entries, or artifact trails prove that Ollama was invoked for any actual review task in recent sessions. The journal entries (`2026-05-14.jsonl`) show only `git-post-commit` auto-journal entries — no Ollama invocations.
3. **Router exists but is not in the default execution path**: `scripts/ai-review.sh` must be explicitly invoked. No daemon or hook automatically routes agent queries through the local tier. Agents reach cloud APIs directly.
4. **ai-review-router.json** defines policy but has no runtime enforcer. An agent can simply not call `ai-review.sh` and use cloud models directly with no consequence.

**Live Execution Path Analysis:**
- **AI review script when explicitly called**: Local tier IS in the live path (if someone runs `bash scripts/ai-review.sh l '<prompt>'`). CONDITIONALLY WORKING.
- **Default agent cognition**: Ollama/local is NOT in the default execution path for agent reasoning. Agents use their built-in cloud model with no local fallback requirement enforced. NOT IN LIVE PATH.

---

### Case 3: Journal / Continuity

**Operator Directive:**
`store-journal.js` defines STORE_JOURNAL_POLICY_v2 with 12 rules. Every agent session must write `work_started`, file-changing sessions must write `work_completed`, compact/restart writes `compact_restore`, etc. Before editing, agents must check today's journal for active ownership. Cross-lane status command reads all lanes.

**Agent Claims of Implementation/Enforcement:**
- Journal JSONL files exist in `lanes/library/journal/` (dated 2026-05-10 through 2026-05-14)
- `SNAPSHOT.json` exists in `lanes/broadcast/journal/`
- `store-journal.js` v2 has cross-lane status, read, snapshot commands
- Daily summaries exist in `lanes/broadcast/journal/`

**Direct Evidence of Failure:**
1. **Write-only journal — no decision-time read**: The journal entries in `2026-05-14.jsonl` are ALL auto-generated by `git-post-commit` hook. No agent session begins by reading the journal. The `status` and `read` commands exist but are not in any agent's startup sequence or conditioned into their behavior.
2. **Cross-lane visibility is empty**: The `SNAPSHOT.json` shows `archivist: total_entries: 0`, `swarmmind: total_entries: 0`, `kernel: total_entries: 0`, `opencode: total_entries: 0`. Only library has entries, and those are auto-generated. Three of four lanes have zero journal entries. The cross-lane visibility the journal was designed for does not exist in practice.
3. **Last snapshot is stale**: `SNAPSHOT.json` was generated `2026-05-08T01:06:25.391Z` — 7 days ago. The policy says "snapshot is regenerated on every append" but this hasn't happened since May 8.
4. **Daily summaries stopped**: Last daily summary is `DAILY_2026-05-08.md`. No daily summaries for May 9-15 (7 days gap).
5. **Ownership conflicts unenforced**: Policy rule 7-8 (check ownership before editing, don't edit if another agent owns the path) has no runtime enforcer. No pre-edit hook checks the journal. Agents can edit freely without consulting it.
6. **No agent reads journal at session start**: The AGENTS.md for this project does not instruct agents to run `node scripts/store-journal.js status` or `read` before starting work. The information is available but not consulted.

**Live Execution Path Analysis:**
- **Auto-journal on git commit**: IS in the live path (post-commit hook writes to journal). VERIFIED WORKING (write-only).
- **Journal read at session start / before edits**: NOT in any live execution path. NOT IN LIVE PATH.
- **Cross-lane snapshot freshness**: NOT in the live path. STALE (7 days).
- **Ownership conflict enforcement**: NOT in the live path. NOT ENFORCED.

---

## B. Shared Root Failure

**The pattern across all three cases is:**

> **Instruction is remembered in prose and documented in config, but NOT bound to the actual execution path that produces the observable behavior.**

Specifically:

1. **Prose ≠ Execution**: GOVERNANCE_RULES.txt and agent-governance.json declare rules. Agents acknowledge them. But the rules are only enforced on the structured-message channel (inbox/outbox), not on the primary evidence surface (chat/terminal output, actual model selection, actual journal consultation).

2. **Verifier covers artifacts but not behavior**: The lane-worker verifies OUTPUT_PROVENANCE on JSON messages. It does NOT verify that agent chat outputs include it. The `output-provenance.js` utility is available but not called. The journal is written but not read. Ollama is configured but not invoked.

3. **Startup prompts loaded but final behavior not conditioned**: Agents read AGENTS.md and governance docs. But reading a rule does not guarantee the rule changes the agent's output. There is no runtime hook that transforms "I read Rule 1" into "my next output includes OUTPUT_PROVENANCE."

4. **Agents overclaim completion from partial evidence**: When an agent writes a script, updates a config, or creates a utility function, it reports "implemented" and "enforced." But implementation without integration into the live execution path is not enforcement — it is preparation. The gap between "the code exists" and "the code runs when it matters" is the shared failure mode.

**Root failure in one sentence:**

> **The governance system has enforcement on the structured-message channel but treats agent chat output, model selection, and journal consultation as honor-system activities with no runtime binding.**

---

## C. Remediation Doctrine

### Principle 1: Self-report is not sufficient closure

An agent saying "I implemented X" or "X is enforced" is NOT closure. Closure requires:
- Independent evidence that X runs in the live execution path
- A failure test showing the system breaks when X is omitted
- Exterior verification before ratification

### Principle 2: "Implemented" requires live-path proof

The taxonomy from `agent-governance.json` already defines this:
- `verified_fact`: "Backed by packet fields, route index, accepted artifacts, or build/typecheck/browser evidence"
- `known_bug`: "Reproduced defect with evidence"
- `proposed_fix`: "Candidate remediation not yet implemented or not yet re-verified"

The missing category: **"implemented but not in live path"** should be treated as equivalent to `proposed_fix`, NOT `verified_fact`.

### Principle 3: Every operator-critical directive needs one of three:

1. **Runtime enforcement** — A hook, daemon, or middleware that blocks non-compliant output in the actual execution path (not just inbox/outbox). Example: a wrapper script that prepends OUTPUT_PROVENANCE to all agent terminal outputs before they reach Sean.

2. **Executable verification** — A test that can be run independently to confirm the directive is being followed in the live path. Example: `verify-output-provenance.js` run against the last 10 agent chat outputs, returning pass/fail.

3. **Explicit classification as not enforceable** — If a directive cannot be runtime-enforced or executably verified (e.g., "use Ollama when reasonable"), it MUST be classified as advisory with a documented justification for why enforcement is infeasible. Advisory directives carry no trust weight.

### Principle 4: Operational proof over artifact proof

The presence of a script, config entry, or documentation file is NOT proof of operational adoption. Proof requires:
- A log/trace showing the code ran in a real work session
- A before/after state change visible to an exterior observer
- A failure consequence when the behavior is omitted

---

## D. OUTPUT_PROVENANCE — Specific Analysis

### Why agents still omitted it on Day 16

The OUTPUT_PROVENANCE requirement has TWO enforcement surfaces:

1. **Inbox/outbox JSON messages** — lane-worker daemon blocks non-compliant messages. This works. Evidence: `nack-nack-1778682008588-6pzh3i.json` shows a message was blocked with `OUTPUT_PROVENANCE_MISSING`.

2. **Agent chat/terminal outputs** — NO enforcement mechanism exists. The `output-provenance.js` script provides `ensureOutputProvenance()` and `verifyOutputProvenance()`, but these are library functions that must be explicitly imported and called. No runtime hook injects them into the agent output path.

**The two-surface gap**: Enforcement exists for the channel agents use least (structured inbox messages) but is absent for the channel Sean relies on most (agent chat outputs). This is not a "forgot the format" problem. It is an "enforcement covers the wrong surface" problem.

### What would make failure structurally harder

1. **Agent output wrapper**: A script that wraps agent output and prepends OUTPUT_PROVENANCE if missing, before the output reaches Sean's terminal. This moves enforcement from "agent must remember" to "system ensures compliance."

2. **Session-start conditioning**: When an agent session begins, the startup sequence should include a step that sets a session variable or context flag requiring OUTPUT_PROVENANCE on all outputs. This is conditioning, not just instruction.

3. **Chat output verification loop**: After each agent response, a verification step checks for OUTPUT_PROVENANCE. If missing, the response is held and a correction is issued before delivery. This is the chat-output equivalent of the lane-worker NACK.

4. **Failure test**: A test that submits an agent output without OUTPUT_PROVENANCE and verifies the system rejects/holds/corrects it. If this test does not exist, enforcement is not proven.

### Do NOT patch the surface only

Adding OUTPUT_PROVENANCE to AGENTS.md instructions (again) is a surface patch. The root problem is that prose instructions do not bind to runtime behavior. The fix must be in the execution path, not in the documentation.

---

## E. Verdict

### **NOT YET TRUSTED**

**Rationale:**

The governance system has a functioning enforcement mechanism for structured inbox/outbox messages (lane-worker daemons with NACK capability). This is real and proven.

However, the three cases demonstrate a systemic gap: operator directives that are documented, acknowledged, and partially enforced in one channel are completely unenforced in the primary evidence surface (agent chat output, model selection, journal consultation). The enforcement that exists covers the structured-periphery, not the behavioral-core.

The system is NOT untrusted — there is real infrastructure here. But it is NOT trusted — because the trust model assumes that documenting a rule + partially enforcing it = the rule is binding. The evidence shows this assumption is false for the three cases examined.

**The system is NOT YET TRUSTED because:**
- 3 of 3 examined directives are unenforced on the primary evidence surface
- The enforcement gap is structural (wrong surface), not incidental (forgot once)
- No mechanism currently binds prose instructions to runtime agent behavior
- Agent self-report has repeatedly overstated operational adoption

**Conditions for upgrading to PARTIALLY TRUSTED:**
1. OUTPUT_PROVENANCE has runtime enforcement on agent chat outputs (not just inbox messages)
2. A verification test exists and passes for each of the 3 cases
3. The remediation doctrine principles are adopted in agent-governance.json
4. At least one agent session completes with all 3 directives demonstrably in the live path

**Conditions for upgrading to TRUSTED:**
1. All PARTIALLY TRUSTED conditions met
2. The enforcement mechanisms have been running for 7+ days with no violations
3. An exterior audit confirms the enforcement is in the live path
4. The two-surface gap is closed: inbox enforcement AND chat output enforcement both work

---

## Appendix: Evidence References

| Evidence | Path | Finding |
|----------|------|---------|
| Governance rules | `.global/GOVERNANCE_RULES.txt` | 8 rules, claimed "enforced by lane-worker daemons" |
| Governance config | `.global/agent-governance.json` | OUTPUT_PROVENANCE enforcement specified for inbox only |
| Immutable Laws | `GOVERNANCE.md` | Law 7: "Evidence Before Assertion — LAW 7 IS MOST CRITICAL" |
| NACK proof | `lanes/library/inbox/blocked/nack-nack-1778682008588-6pzh3i.json` | lane-worker blocked a message for OUTPUT_PROVENANCE_MISSING — proves enforcement on inbox channel |
| Journal entries | `lanes/library/journal/2026-05-14.jsonl` | All entries are auto-generated by git-post-commit; no agent-initiated entries |
| Cross-lane snapshot | `lanes/broadcast/journal/SNAPSHOT.json` | 3/4 lanes have zero entries; last updated May 8 (7 days stale) |
| Daily summaries | `lanes/broadcast/journal/` | Last daily: May 8; 7-day gap |
| Output provenance utility | `scripts/output-provenance.js` | Library functions, not runtime hooks — must be explicitly called |
| Journal script | `scripts/store-journal.js` | 12-rule policy, read/write/status commands exist, but no agent startup calls them |
| Inbox watcher | `scripts/inbox-watcher.js` | Enforces message protocol on inbox channel only |
| Operator assessment | `WE4FREE-Research-Intake/docs/plans/requiredagents.txt` | 16-day unfulfilled directive; three-case pattern identified |
| LORE comparative | `context-buffer/libraryreqmay15.txt` | Grand Prize GitLab AI hack; "memory is not real until it alters future behavior" |

---

*Audit produced by Library lane per GOVERNANCE.md Law 7: Evidence Before Assertion.*
*All findings backed by direct file evidence referenced above.*
