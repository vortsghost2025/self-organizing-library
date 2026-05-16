# KuCoin Margin Bot — Failure/Repair Chain Record

<!-- EVENT_CLASS: FAILURE / FIX / RETEST / REPAIR / REGRESSION -->
<!-- ONE_SECTION_PER_FAILURE_CHAIN -->

OUTPUT_PROVENANCE:
agent: opencode
lane: library
target: kucoin-bot-failure-repair-chains
generated_at: <FILL_AT_FIRST_FAILURE>
session_id: <FILL_AT_FIRST_FAILURE>

---

## 1. Purpose

Each failure gets its own chain: FAILURE -> diagnosis -> FIX or REPAIR -> RETEST -> resolution or REGRESSION. This template tracks the full lifecycle of every defect from discovery to closure.

## 2. Chain Index

| chain_id | failure_event_id | summary | severity | status | linked_regression |
|----------|-------------------|---------|----------|--------|--------------------|
| `FC-001` | `#N` | `<one-line summary>` | `P0/P1/P2/P3` | `OPEN/RESOLVED/REGRESSED` | `<regression_id or NONE>` |
| `FC-002` | | | | | |

---

## Chain FC-001: `<title>`

### Failure

| Field | Value |
|-------|-------|
| `chain_id` | `FC-001` |
| `failure_event_id` | `#N (from timeline)` |
| `detected_at` | `<ISO-8601>` |
| `phase` | `<which testing phase>` |
| `severity` | `P0: data-loss or fund-risk / P1: bot-nonfunctional / P2: degraded / P3: cosmetic` |
| `test_command` | `<exact command that revealed failure>` |
| `expected_behavior` | `<what should happen>` |
| `actual_behavior` | `<what happened instead>` |
| `exit_code` | `<code>` |
| `failure_log_path` | `<path to captured log>` |
| `stack_trace` | `<paste or path>` |
| `affected_files` | `<list>` |

### Diagnosis

| Field | Value |
|-------|-------|
| `diagnosed_at` | `<ISO-8601>` |
| `diagnosed_by` | `<agent/runtime>` |
| `root_cause` | `<description>` |
| `root_cause_category` | `LOGIC_ERROR / CONFIG_ERROR / DEPENDENCY / RACE_CONDITION / API_CHANGE / AUTH_FAILURE / DATA_CORRUPTION / UNKNOWN` |
| `confidence` | `HIGH / MEDIUM / LOW` |
| `diagnosis_evidence` | `<path to analysis log, debug output, etc.>` |

### Fix / Repair

| Field | Value |
|-------|-------|
| `fix_type` | `FIX (code change) / REPAIR (non-code change)` |
| `fix_event_id` | `#N (from timeline)` |
| `fix_applied_at` | `<ISO-8601>` |
| `fix_applied_by` | `<agent/runtime>` |
| `fix_description` | `<what was changed>` |
| `fix_commit_sha` | `<SHA or N/A for REPAIR>` |
| `fix_diff` | `<paste or path to diff>` |
| `changed_files` | `<list>` |
| `fix_risk_assessment` | `<does this fix risk introducing new issues?>` |

### Retest

| Field | Value |
|-------|-------|
| `retest_event_id` | `#N (from timeline)` |
| `retest_at` | `<ISO-8601>` |
| `retest_command` | `<exact command>` |
| `retest_result` | `PASS / FAIL / PARTIAL` |
| `retest_log_path` | `<path>` |
| `verdict` | `RESOLVED / UNRESOLVED / ESCALATE` |

### Regression (if applicable)

| Field | Value |
|-------|-------|
| `regression_detected` | `YES / NO` |
| `regression_event_id` | `#N (from timeline)` |
| `regression_description` | `<what regressed>` |
| `regression_root_cause` | `<did the fix cause it or was it pre-existing>` |
| `repair_event_id` | `#N` |
| `final_status` | `RESOLVED / OPEN / ESCALATED` |

### Chain Closure

| Field | Value |
|-------|-------|
| `chain_status` | `RESOLVED / OPEN / REGRESSED / ESCALATED` |
| `total_time_to_fix` | `<duration from detection to resolved>` |
| `retest_count` | `<number of retests needed>` |
| `lessons_learned` | `<optional>` |
| `closed_at` | `<ISO-8601 or blank if OPEN>` |
| `closed_by` | `<agent/runtime>` |

---

<!-- Copy the Chain FC-NNN block above for each new failure chain -->

## 3. Aggregate Failure Metrics

| Metric | Value |
|--------|-------|
| Total failure chains | |
| P0 chains | |
| P1 chains | |
| P2 chains | |
| P3 chains | |
| Resolved first-try | |
| Required multiple retests | |
| Regressions introduced | |
| Still open | |
| Average time to fix | |

---

_Evidence path: `lanes/library/evidence/kucoin-bot/KUCOIN_BOT_FAILURE_REPAIR_CHAIN_TEMPLATE.md`_
_Event classes: FAILURE, FIX, RETEST, REPAIR, REGRESSION_
_Claim status: known_bug at failure; proposed_fix at diagnosis; fix_in_progress at fix; accepted_fix at retest-pass_
