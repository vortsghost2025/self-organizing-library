# KuCoin Margin Bot — Evidence Index

<!-- CENTRAL_CROSS_REFERENCE: links all evidence artifacts -->

OUTPUT_PROVENANCE:
agent: opencode
lane: library
target: kucoin-bot-evidence-index
generated_at: <FILL_AT_FIRST_EVIDENCE>
session_id: <FILL_AT_FIRST_EVIDENCE>

---

## 1. Index Purpose

Single source of truth for locating all evidence artifacts: logs, command outputs, screenshots, reports, diffs, and analysis files. Every evidence path referenced in any other template MUST appear here.

## 2. Evidence Directory Map

```
lanes/library/evidence/kucoin-bot/
├── KUCOIN_BOT_ARRIVAL_TEMPLATE.md          (this campaign)
├── KUCOIN_BOT_PRETOUCH_BASELINE_TEMPLATE.md
├── KUCOIN_BOT_TESTING_TIMELINE_TEMPLATE.md
├── KUCOIN_BOT_FAILURE_REPAIR_CHAIN_TEMPLATE.md
├── KUCOIN_BOT_FINAL_VERDICT_TEMPLATE.md
├── KUCOIN_BOT_EVIDENCE_INDEX_TEMPLATE.md   (YOU ARE HERE)
├── KUCOIN_BOT_DOCUMENTATION_PROTOCOL.md
├── logs/                                   (command output, test runs)
├── screenshots/                            (terminal or UI captures)
├── diffs/                                  (code change diffs)
├── reports/                                (analysis, diagnosis writeups)
└── snapshots/                              (git tree snapshots, state dumps)
```

## 3. Evidence Registry

| evidence_id | artifact_path | event_class | timeline_ref | description | format | size | sha256 | captured_at |
|-------------|--------------|-------------|-------------|-------------|--------|------|--------|-------------|
| `E-001` | `<path>` | `ARRIVAL` | `#N` | `<what this proves>` | `txt/json/png` | `<bytes>` | `<hash>` | `<ISO-8601>` |
| `E-002` | | | | | | | | |
| `E-003` | | | | | | | | |

## 4. Evidence by Category

### 4.1 Logs

| evidence_id | path | event | description |
|-------------|------|-------|-------------|
| | | | |

### 4.2 Command Outputs

| evidence_id | path | command | exit_code |
|-------------|------|---------|-----------|
| | | | |

### 4.3 Screenshots

| evidence_id | path | context | captured_by |
|-------------|------|---------|-------------|
| | | | |

### 4.4 Diffs

| evidence_id | path | chain_id | commit_sha |
|-------------|------|----------|------------|
| | | | |

### 4.5 Reports / Analysis

| evidence_id | path | author | subject |
|-------------|------|--------|---------|
| | | | |

### 4.6 Snapshots

| evidence_id | path | type | ref_sha |
|-------------|------|------|---------|
| | | `git-tree / db-dump / config-state` | |

## 5. Integrity Verification

| Field | Value |
|-------|-------|
| `total_artifacts` | `<count>` |
| `total_size_bytes` | `<sum>` |
| `index_hash` | `<sha256 of all artifact hashes concatenated>` |
| `last_verified_at` | `<ISO-8601>` |
| `verified_by` | `<agent/runtime>` |

### Verification Command

```bash
cd lanes/library/evidence/kucoin-bot
find . -type f -not -name '*.md' | sort | xargs sha256sum > /tmp/kucoin-evidence-manifest.txt
sha256sum /tmp/kucoin-evidence-manifest.txt
```

Run this after every evidence capture session. Compare the manifest hash to detect tampering or loss.

## 6. Cross-Reference Integrity

| Template | Required Evidence IDs | All Present? |
|----------|----------------------|-------------|
| ARRIVAL | `E-___` | `YES / NO` |
| PRETOUCH_BASELINE | `E-___` | `YES / NO` |
| TESTING_TIMELINE (each row) | `E-___` | `YES / NO` |
| FAILURE_REPAIR_CHAIN (each chain) | `E-___` | `YES / NO` |
| FINAL_VERDICT | `E-___` | `YES / NO` |

---

_Evidence path: `lanes/library/evidence/kucoin-bot/KUCOIN_BOT_EVIDENCE_INDEX_TEMPLATE.md`_
_Event class: n/a (index document)_
_Claim status: verified_fact when all referenced artifacts exist and hash-verify_
