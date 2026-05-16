# KuCoin Margin Bot — Pre-Touch Baseline Record

<!-- EVENT_CLASS: INSPECTION -->
<!-- FILLED_AFTER_ARRIVAL_BEFORE_FIRST_MODIFICATION -->

OUTPUT_PROVENANCE:
agent: opencode
lane: library
target: kucoin-bot-pre-touch-baseline
generated_at: <FILL_ON_INSPECTION>
session_id: <FILL_ON_INSPECTION>

---

## 1. Baseline Purpose

This record captures the **exact state of the bot before any Library-side modification, configuration, or test execution**. It is the reference point against which all subsequent changes are measured.

## 2. Repository State Snapshot

| Field | Value |
|-------|-------|
| `baseline_id` | `<UUID>` |
| `captured_at` | `<ISO-8601>` |
| `commit_sha` | `<HEAD SHA at time of capture>` |
| `branch` | `<current branch>` |
| `working_tree_clean` | `YES / NO` |
| `untracked_files` | `<count or list>` |
| `modified_files` | `<count or list>` |

### 2.1 Full File Manifest

```
<PASTE: git ls-tree -r HEAD --name-only>
```

### 2.2 Full Tree Hash

```
<PASTE: git write-tree>
```

### 2.3 Branch List

```
<PASTE: git branch -a>
```

## 3. Code Baseline

### 3.1 Language & Framework

| Aspect | Value |
|--------|-------|
| Primary language | `<e.g. Python 3.11>` |
| Framework | `<e.g. ccxt, custom>` |
| Dependency file | `<path to requirements.txt / package.json / Cargo.toml>` |
| Dependency count | `<number>` |
| Lockfile present | `YES / NO` |
| Lockfile hash | `<sha256 of lockfile>` |

### 3.2 Architecture Overview (First-Look)

| Component | Path | Purpose |
|-----------|------|---------|
| Entry point | `<path>` | `<description>` |
| Config loader | `<path>` | `<description>` |
| Exchange adapter | `<path>` | `<description>` |
| Order manager | `<path>` | `<description>` |
| Risk engine | `<path>` | `<description>` |
| Logging | `<path>` | `<description>` |
| Tests | `<path>` | `<description>` |

### 3.3 Static Analysis Baseline

| Check | Command | Result |
|-------|---------|--------|
| Lint | `<command>` | `<pass/fail — count>` |
| Type check | `<command>` | `<pass/fail — count>` |
| Cyclomatic complexity | `<command>` | `<summary>` |
| Import graph | `<command>` | `<summary or N/A>` |

## 4. Test Baseline

### 4.1 Existing Test Suite

| Aspect | Value |
|--------|-------|
| Test framework | `<e.g. pytest, unittest, jest>` |
| Test file count | `<number>` |
| Test case count | `<number>` |
| Test command | `<exact command>` |
| Test result (baseline run) | `<PASS/FAIL — X passed, Y failed, Z skipped>` |
| Test output log | `<path to saved log>` |

### 4.2 Test Output

```
<PASTE: full test output from baseline run>
```

## 5. Configuration Baseline

### 5.1 Configuration Files Present

| File | Path | Contains Secrets? | Contents Logged? |
|------|------|-------------------|-----------------|
| `<filename>` | `<path>` | `NO / SUSPECTED` | `NO — never log config with secrets` |
| `.env.example` | `<path>` | `NO` | `YES — template only` |
| `.env` | `<path>` | `YES — DO NOT READ` | `NEVER` |

### 5.2 Expected Environment Variables (from .env.example or README)

| Variable | Purpose | Required? | Default |
|----------|---------|-----------|---------|
| `<NAME>` | `<what it does>` | `YES/NO` | `<value or none>` |

**NEVER record actual values for: API_KEY, API_SECRET, API_PASSPHRASE, any token, any password.**

## 6. Build Baseline

| Step | Command | Result |
|------|---------|--------|
| Install dependencies | `<command>` | `<success/fail>` |
| Build | `<command>` | `<success/fail / N/A>` |
| Dry-run startup | `<command>` | `<success/fail/error output>` |
| Help output | `<command>` | `<paste>` |

## 7. Baseline Verdict

| Status | |
|--------|---|
| **Baseline captured** | `YES / NO — reason` |
| **Baseline integrity** | `INTACT / COMPROMISED — explanation` |
| **Ready for testing** | `YES / NO — blockers` |
| **Next step** | `Proceed to testing timeline` |
| **Recorded by** | `<agent/runtime>` |
| **Recorded at** | `<ISO-8601>` |

---

_Evidence path: `lanes/library/evidence/kucoin-bot/KUCOIN_BOT_PRETOUCH_BASELINE_TEMPLATE.md`_
_Event class: INSPECTION_
_Claim status: verified_fact once all sections are completed with captured evidence_
