# KuCoin Margin Bot — Arrival Intake Record

<!-- EVENT_CLASS: ARRIVAL -->
<!-- AUTO_FILLED_ON_INTAKE: true -->

OUTPUT_PROVENANCE:
agent: opencode
lane: library
target: kucoin-bot-arrival
generated_at: <FILL_ON_ARRIVAL>
session_id: <FILL_ON_ARRIVAL>

---

## 1. Arrival Metadata

| Field | Value |
|-------|-------|
| `arrival_id` | `<UUID or sequential ID>` |
| `repo_source` | `<git remote URL or transfer method>` |
| `repo_local_path` | `<absolute path where repo was placed>` |
| `arrived_at` | `<ISO-8601 timestamp of first file-touch detection>` |
| `detected_by` | `<agent/runtime that detected arrival>` |
| `arrival_method` | `git clone | git pull | file copy | archive extract | other` |
| `initial_commit_sha` | `<HEAD SHA at arrival>` |
| `initial_branch` | `<default branch name>` |
| `repo_size_bytes` | `<du -sb output>` |
| `file_count` | `<find . -type f \| wc -l>` |

## 2. Arrival Checklist (Complete Immediately)

- [ ] Repo exists at `repo_local_path`
- [ ] `git log --oneline -5` output captured
- [ ] `git remote -v` output captured
- [ ] `git status` output captured (expect clean)
- [ ] Top-level directory listing captured (`ls -la`)
- [ ] README or docs identified (path: ________)
- [ ] No `.env` files present (or noted if present — DO NOT READ CONTENTS)
- [ ] No plaintext secrets in tracked files (grep scan — see section 4)
- [ ] Language/framework identified: ________
- [ ] Dependency manifest found (path: ________)
- [ ] Build/run instructions found (path: ________)
- [ ] Arrival message sent to Library inbox

## 3. Raw Arrival Evidence

### 3.1 Git Log (first 5 commits)

```
<PASTE: git log --oneline -5>
```

### 3.2 Remote Configuration

```
<PASTE: git remote -v>
```

### 3.3 Top-Level Directory Structure

```
<PASTE: ls -laR --max-depth=1 or tree -L 1>
```

### 3.4 File Hash Snapshot

```
<PASTE: git ls-tree -r HEAD --name-only | sort | sha256sum>
```

## 4. Secret Scan (Pre-Intake Gate)

Run: `git log -p --all -- '*.env*' '*.key' '*.pem' '*.secret*' | head -1`

| Check | Result |
|-------|--------|
| `.env` files in tracked tree | `FOUND / NOT_FOUND` |
| `.env.example` or `.env.template` | `FOUND / NOT_FOUND` |
| Hardcoded API keys in source | `NONE_FOUND / SUSPECTED — path: ________` |
| `.gitignore` includes `.env` | `YES / NO` |
| Secret-scan tool run | `YES — tool: ________ / NO — reason: ________` |

**CRITICAL:** If secrets are found in tracked files, halt intake and escalate to Kernel before proceeding. Do NOT copy any secret values into this document.

## 5. Initial Classification

| Aspect | Assessment |
|--------|------------|
| Bot type | `margin-trading / lending / market-making / other` |
| Exchange target | `KuCoin` |
| Margin mode | `cross / isolated / unknown` |
| Testability (first look) | `HIGH / MEDIUM / LOW — reason: ________` |
| Risk level (first look) | `CRITICAL / HIGH / MEDIUM / LOW — reason: financial bot` |
| Dry-run / paper-trading support | `YES / NO / UNKNOWN` |

## 6. Arrival Verdict

| Status | |
|--------|---|
| **Intake state** | `CLEARED_FOR_INSPECTION / BLOCKED_SECRET_FOUND / BLOCKED_CORRUPT` |
| **Blocker (if any)** | `<description or NONE>` |
| **Next step** | `Proceed to pre-touch baseline / Escalate to Kernel` |
| **Recorded by** | `<agent/runtime>` |
| **Recorded at** | `<ISO-8601>` |

---

_Evidence path: `lanes/library/evidence/kucoin-bot/KUCOIN_BOT_ARRIVAL_TEMPLATE.md`_
_Event class: ARRIVAL_
_Claim status: verified_fact once all checklist items are completed with evidence_
