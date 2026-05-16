# KuCoin Margin Bot — Documentation Protocol

<!-- GOVERNING_PROTOCOL: defines the full Library-side evidence lifecycle -->

OUTPUT_PROVENANCE:
agent: opencode
lane: library
target: kucoin-bot-documentation-protocol
generated_at: 2026-05-16T00:00:00Z
session_id: pre-arrival-setup

---

## 1. Scope

This protocol governs how the Library lane documents the KuCoin Margin Bot from the moment the private repo lands through final testing verdict. It applies to all agents, runtimes, and lanes that interact with the bot during the intake-and-test campaign.

## 2. What Gets Recorded Immediately When the Repo Lands

The instant the bot repository is detected at its local path, the following must be captured **before any other action**:

1. **Arrival timestamp** — ISO-8601, to millisecond precision
2. **Git state** — `git log --oneline -5`, `git remote -v`, `git status`, `git branch -a`
3. **Tree hash** — `git write-tree` output (immutable baseline reference)
4. **File manifest** — `git ls-tree -r HEAD --name-only`
5. **Repo size** — `du -sb .`
6. **Secret scan** — check for `.env`, `.key`, `.pem`, or hardcoded credentials in tracked files
7. **Top-level structure** — `ls -la` or `tree -L 1`

All captured output is written to the ARRIVAL_TEMPLATE and linked evidence files under `lanes/library/evidence/kucoin-bot/logs/`. No values from `.env`, API keys, or credential files are ever copied.

## 3. Required Timestamps

Every event in the documentation lifecycle MUST include an ISO-8601 timestamp with timezone (UTC preferred):

```
2026-05-16T14:32:07.423Z
```

| Timestamp Field | When Set | Who Sets It |
|----------------|----------|-------------|
| `arrived_at` | First detection of repo | Detecting agent |
| `baseline_captured_at` | Pre-touch baseline complete | Library agent |
| `detected_at` (failure) | Failure first observed | Test runner / Library agent |
| `diagnosed_at` | Root cause identified | Diagnosing agent |
| `fix_applied_at` | Change committed or applied | Fixing agent |
| `retest_at` | Retest execution | Library agent |
| `regression_detected_at` | Regression observed | Library agent |
| `verdict_issued_at` | Final verdict signed | Library agent |
| `closed_at` | Failure chain closed | Library agent |

Timestamps are non-negotiable. An event without a timestamp is not valid evidence.

## 4. Event Classification

Every documented event MUST be classified with exactly one of these labels:

| Class | Code | Definition | Examples |
|-------|------|------------|----------|
| `ARRIVAL` | ARR | Repo first detected at local path | git clone completed, archive extracted |
| `INSPECTION` | INS | Read-only examination, no modification | baseline capture, code review, dependency audit |
| `TEST` | TST | Execution of a test or check | unit test run, lint pass, dry-run start |
| `FAILURE` | FAIL | Test returned unexpected result | non-zero exit, wrong output, exception |
| `FIX` | FIX | Code change to resolve a failure | bug fix commit, logic correction |
| `RETEST` | RET | Re-execution after a fix | rerun of previously failing test |
| `REGRESSION` | REG | Previously passing test now fails | new failure after unrelated change |
| `REPAIR` | REP | Non-code change to resolve an issue | config fix, dependency version pin |
| `BLOCKED` | BLK | Cannot proceed; external dependency | missing API access, environment down |
| `VERDICT` | VDCT | Final determination issued | PASS, FAIL, INCONCLUSIVE |

**Classification rules:**
- A `FIX` MUST reference the `FAILURE` it addresses.
- A `RETEST` MUST reference both the original `TEST` and the `FIX` it validates.
- A `REGRESSION` MUST reference the originally passing `TEST` event.
- A `VERDICT` MUST reference all open `FAILURE` and `REGRESSION` chains.
- No event may be classified retroactively; if classification is wrong, append a correction event.

## 5. What Counts as Proof

The Library lane only marks claims as `verified_fact` when supported by one or more of:

| Proof Type | Requirements | Storage |
|------------|-------------|---------|
| **Command output** | Full stdout + stderr, exit code, exact command string, timestamp | `logs/` |
| **Git artifact** | Commit SHA, diff, tree hash, branch name | `diffs/`, `snapshots/` |
| **Test result** | Test framework output, pass/fail counts, duration | `logs/` |
| **Screenshot** | Terminal or UI capture with timestamp overlay | `screenshots/` |
| **Analysis report** | Written diagnosis with reasoning chain and evidence links | `reports/` |
| **Cross-reference** | Link to another verified artifact in the evidence index | `evidence_index` |

**What does NOT count as proof:**
- Agent statements without supporting artifacts
- "It worked on my machine" without captured output
- Paraphrased error messages (always paste verbatim)
- Claims of behavior not reproducible from the evidence

Every proof artifact MUST be:
1. Saved to a file under `lanes/library/evidence/kucoin-bot/`
2. Registered in the EVIDENCE_INDEX with `evidence_id`, `sha256`, and `captured_at`
3. Referenced by `evidence_path` in the relevant template

## 6. What Must NEVER Be Copied Into Docs

The following categories are **absolutely prohibited** from any Library documentation:

| Category | Examples | Handling |
|----------|----------|----------|
| API keys | KuCoin API key, secret, passphrase | Record existence only: "API_KEY found in .env" — never the value |
| Secrets/tokens | JWT tokens, OAuth tokens, session tokens | Same as above |
| `.env` file contents | Any line from `.env`, `.env.local`, `.env.production` | Record filename and variable NAMES only |
| Passwords | Database passwords, SSH passwords | Never record |
| Private keys | `.pem`, `.key`, SSH keys | Record existence only — never contents |
| Wallet addresses (if personal) | Trading wallet identifiers | Redact unless explicitly approved |
| Account identifiers | KuCoin UID, email, sub-account names | Redact |

**Redaction rule:** When in doubt, write `<REDACTED>` and note the category. A document with a leaked secret is a P0 incident requiring immediate purge and escalation to Kernel.

**Permitted exceptions:**
- `.env.example` or `.env.template` contents (these contain no real values)
- Variable NAMES without values (e.g., "The bot requires `KUCOIN_API_KEY` and `KUCOIN_API_SECRET`")
- Public, non-sensitive configuration (e.g., `KUCOIN_BASE_URL=https://api.kucoin.com`)

## 7. Library ↔ Control Plane Coordination

### 7.1 Roles

| Lane | Role in This Campaign | Authority |
|------|----------------------|-----------|
| **Control Plane** | Live recorder: captures real-time test output, streams events, runs commands | Execution authority — can run commands, start/stop processes |
| **Library** | Structured memory: organizes, classifies, verifies, and archives evidence | Verification authority — can only record and verify, cannot execute the bot |
| **Kernel** | Infrastructure: routing, escalation, blocker resolution | Coordination authority — resolves cross-lane blockers |
| **Archivist** | Permanent storage: ratifies final verdict into canonical record | Ratification authority — does not participate in testing |

### 7.2 Information Flow

```
Control Plane (runs test) 
    → captures raw output → sends to Library inbox
Library (receives raw output)
    → classifies event → fills template → stores evidence → updates index
    → sends verification status to Control Plane outbox
Control Plane (reads verification)
    → adjusts testing plan → runs next test
    → repeat
```

### 7.3 Message Contract

When Control Plane sends a test result to Library, the message MUST conform to:

```json
{
  "schema_version": "1.0",
  "id": "<unique-message-id>",
  "from": "control-plane",
  "to": "library",
  "timestamp": "<ISO-8601>",
  "priority": "P0/P1/P2/P3",
  "type": "event",
  "task_kind": "testing",
  "body": {
    "event_class": "TEST|FAILURE|FIX|RETEST|REGRESSION|REPAIR|BLOCKED",
    "description": "<what happened>",
    "command": "<exact command run>",
    "exit_code": 0,
    "output_path": "<path to saved output>",
    "commit_sha": "<current HEAD>",
    "duration_s": 12.4
  },
  "requires_action": true
}
```

Library responds with:

```json
{
  "schema_version": "1.0",
  "id": "<unique-response-id>",
  "from": "library",
  "to": "control-plane",
  "timestamp": "<ISO-8601>",
  "priority": "P0/P1/P2/P3",
  "type": "response",
  "task_kind": "verification",
  "body": {
    "original_event_id": "<id from incoming message>",
    "classification": "<confirmed or corrected event_class>",
    "evidence_id": "<E-NNN>",
    "evidence_path": "<path>",
    "verified": true,
    "notes": "<optional>"
  },
  "requires_action": false
}
```

### 7.4 Lane Boundary Rules

- **Control Plane** can execute the bot, run tests, modify the bot repo (for fixes), and capture output. It CANNOT classify events or mark claims as verified.
- **Library** can read bot source, classify events, fill templates, and verify claims. It CANNOT execute the bot, run tests against live APIs, or modify the bot repo.
- Neither lane may use live trading credentials. Any test requiring authentication MUST use sandbox/demo/testnet credentials, and those credentials follow the same redaction rules in section 6.
- Disagreements on classification are escalated to Kernel for arbitration.

## 8. Template Lifecycle

| Template | Created | First Filled | Final State |
|----------|---------|-------------|-------------|
| ARRIVAL_TEMPLATE | Before repo lands | At arrival detection | Closed after intake checklist complete |
| PRETOUCH_BASELINE_TEMPLATE | Before repo lands | After arrival, before first modification | Closed after baseline captured |
| TESTING_TIMELINE_TEMPLATE | Before repo lands | At first test event | Closed at verdict |
| FAILURE_REPAIR_CHAIN_TEMPLATE | Before repo lands | At first failure | Each chain closed individually |
| FINAL_VERDICT_TEMPLATE | Before repo lands | After all testing complete | Closed after 3-lane sign-off |
| EVIDENCE_INDEX_TEMPLATE | Before repo lands | At first evidence artifact | Maintained throughout; verified at verdict |
| DOCUMENTATION_PROTOCOL (this file) | Before repo lands | N/A — governing document | Updated only by Library lead |

## 9. Amendment Procedure

Changes to this protocol require:
1. Written proposal with rationale
2. Library agent review and approval
3. Notification to Control Plane and Kernel
4. Version bump in document header

---

_Evidence path: `lanes/library/evidence/kucoin-bot/KUCOIN_BOT_DOCUMENTATION_PROTOCOL.md`_
_Governing document for the KuCoin Margin Bot intake and testing campaign_
_Library lane authority: verification and structured memory only_
