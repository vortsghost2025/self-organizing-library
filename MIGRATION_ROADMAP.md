# Migration Roadmap

**Goal:** Organize 800GB of scattered projects into a clean architecture where:
- GitHub repos = code + repo-specific docs only
- Local archive = original docs, duplicates, cross-project notes, papers
- Active workspace = ONE project at a time

---

## Phase A: Freeze and Map (Do Not Move Yet)

### A0. Manual canonical project decision (DO THIS FIRST)
- [ ] For each duplicated project, YOU decide which path is canonical
- [ ] Example: kucoin-margin-bot exists at C:\Dev\, S:\, and GitHub
- [ ] Mark your decision: "Canonical: C:\Dev\trading-bots\kucoin-margin-bot"
- [ ] Do NOT let scanner decide this

### A1. Generate per-project inventories
- [ ] Scan all project folders (C:\ and S:\)
- [ ] List every file with: path, size, extension, last modified
- [ ] Calculate checksums for critical files

### A2. Identify duplicates
- [ ] Find identical files across drives
- [ ] Flag near-duplicates (same name, different path)
- [ ] Mark which is canonical vs backup (based on YOUR A0 decision)

### A3. Classify each file
- [ ] `code` - source code, tests, config
- [ ] `repo-doc` - belongs with the repo (README, ARCHITECTURE, deployment guides)
- [ ] `archive-doc` - session notes, planning, cross-project theory
- [ ] `duplicate` - copy of something else
- [ ] `sensitive` - API keys, credentials, personal notes (NEVER auto-classify)
- [ ] `unknown` - needs manual review

### A4. Generate migration manifest
- [ ] Create JSON index: `{original_path, classification, canonical_path, archive_path, repo_path, checksum}`
- [ ] This is the map. Nothing moves without being in this manifest.
- [ ] Save manifest OUTSIDE the active project (e.g., S:\Archive\manifests\)

---

## Phase B: Define Project Boundaries

### B1. For each project, identify:
- [ ] Canonical root (which path is the real one)
- [ ] Code files that belong in the repo
- [ ] Docs that are repo-specific
- [ ] Everything else = archive

### B2. Create repo structure template
```
<project>/
├── src/
├── tests/
├── docs/
│   ├── README.md
│   ├── ARCHITECTURE.md
│   └── DEPLOYMENT.md
├── config/
└── .gitignore
```

---

## Phase C: Build Local Archive

### C1. Create archive structure
```
S:\Archive\
├── <project>/
│   ├── original_docs/
│   ├── session_artifacts/
│   ├── papers/
│   └── media/
├── papers/           # Your 5 papers
├── cross-project/    # Theory that spans projects
└── duplicates/       # Before dedupe, keep copies
```

### C2. Move archive-docs to archive
- [ ] Session notes → Archive/<project>/session_artifacts/
- [ ] Planning docs → Archive/<project>/original_docs/
- [ ] Cross-project theory → Archive/cross-project/

### C3. Verify archive has everything
- [ ] Checksum compare original vs archived
- [ ] Do not proceed until verified

---

## Phase D: Push Repos to GitHub

### D1. For each project:
- [ ] Ensure only repo-relevant files remain
- [ ] Remove duplicates from repo
- [ ] Add proper .gitignore
- [ ] Push to GitHub (public or private)

### D2. Verify remote:
- [ ] Clone fresh to temp location
- [ ] Compare with local
- [ ] Confirm all intended files present

### D3. Generate repo manifest:
- [ ] List of what's in each GitHub repo
- [ ] Link from library index

---

## Phase E: Delete Local Bulk (ONLY AFTER VERIFIED)

### E0. Generate second manifest with all paths:
- [ ] canonical_path (where it lives in repo)
- [ ] archive_path (where the archive copy is)
- [ ] repo_path (GitHub URL if pushed)
- [ ] restore_test_status (PASS/FAIL/PENDING)

### E1. Pre-delete checklist:
- [ ] Archive copy exists and verified
- [ ] GitHub repo exists and verified
- [ ] Manifest exists (saved outside active project)
- [ ] Spot restore test passed (restore one file, confirm it works)
- [ ] Sensitive files double-checked (never auto-deleted)

### E2. Dry-run delete report:
- [ ] Generate list of everything that WOULD be deleted
- [ ] Review manually
- [ ] Only proceed after explicit approval

### E3. Delete from active workspace:
- [ ] Remove all but ONE active project
- [ ] Keep archive on separate drive
- [ ] Keep manifests outside active project
- [ ] Result: Clean workspace, indexed archive, GitHub backup

---

## The Key Rule

**Never delete from "messy local" directly into confidence.**

Delete only after:
1. Archive copy exists
2. Repo copy exists
3. Manifest exists
4. Recovery test passes

---

## File Classification Guide

| Pattern | Classification | Notes |
|---------|---------------|-------|
| `SESSION_*.md` | archive-doc | Session notes → archive |
| `AGENT_*.md` | archive-doc | Agent interaction logs |
| `*_SUMMARY.md` | archive-doc | Summaries → archive |
| `DEPLOYMENT_*.md` | repo-doc | If specific to this repo |
| `README.md` | repo-doc | Stays with repo |
| `ARCHITECTURE.md` | repo-doc | Stays with repo |
| `*.py`, `*.js`, `*.ts` | code | Source code |
| `*.json` (config) | code | Config files |
| `*.csv` (data) | unknown | Manual review needed |
| `*.log` | archive-doc | Logs → archive |
| `*.pdf` | paper | Papers → archive/papers/ |
| `.env*` | **sensitive** | NEVER auto-classify. Manual review. |
| `*key*`, `*secret*`, `*token*` | **sensitive** | NEVER auto-classify. Manual review. |
| `*credential*`, `*password*` | **sensitive** | NEVER auto-classify. Manual review. |

### Sensitive File Handling
Files matching these patterns are NEVER auto-classified:
- `.env`, `.env.*`, `.env_*`
- Files containing: key, secret, token, credential, password, api_key
- Any file you manually mark as sensitive

These require explicit manual review before any action.

---

## Project Inventory Status

| Project | Locations | Canonical Decision Needed | Status |
|---------|-----------|--------------------------|--------|
| kucoin-margin-bot | C:\Dev\, S:\, GitHub | **YOU DECIDE** | Pending your input |
| federation | S:\federation | Single location - auto canonical | Ready |
| autonomous-elasticsearch-agent | C:\ | Single location - auto canonical | Ready |
| Archivist-Agent | S:\ | Single location - auto canonical | Ready |
| self-organizing-library | S:\ | Active project - keep | Keep as active |

**Important:** Do NOT proceed with migration until you've made canonical decisions for duplicated projects.

---

## Manifest Storage Location

All manifests are saved OUTSIDE the active project to survive migration:

```
S:\Archive\manifests\
├── inventory-2026-04-16.json
├── canonical-decisions.json
├── migration-manifest.json
└── restore-test-log.json
```

This ensures the migration map survives even if the active project changes.
