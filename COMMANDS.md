# Migration Commands

## Phase A: Generate Inventory

```powershell
# Scan all projects and generate inventory
cd S:\self-organizing-library
node src\cli\scan-inventory.js
```

Output: `S:\self-organizing-library\data\inventory.json`

## Phase B: Review Inventory

```powershell
# Open inventory for review
code S:\self-organizing-library\data\inventory.json
```

Check:
- Are classifications correct?
- Are duplicates properly identified?
- Any "unknown" files that need manual review?

## Phase C: Build Archive Structure

```powershell
# Create archive directories
mkdir S:\Archive
mkdir S:\Archive\kucoin-margin-bot\original_docs
mkdir S:\Archive\kucoin-margin-bot\session_artifacts
mkdir S:\Archive\federation\original_docs
mkdir S:\Archive\autonomous-elasticsearch-agent\original_docs
mkdir S:\Archive\archivist-agent\original_docs
mkdir S:\Archive\papers
mkdir S:\Archive\cross-project
mkdir S:\Archive\duplicates
```

## Phase D: Push Repos to GitHub

For each project (example for kucoin-margin-bot):

```powershell
# 1. Ensure canonical copy has only repo-relevant files
cd C:\Dev\trading-bots\kucoin-margin-bot

# 2. Create .gitignore if missing
# (Add: *.log, node_modules/, .env, __pycache__/)

# 3. Stage and commit
git add .
git status  # Review what's being committed
git commit -m "Clean repo: code + repo docs only"

# 4. Push to GitHub
git push origin main
```

## Phase E: Verify Before Deleting

```powershell
# 1. Clone fresh copy
cd C:\temp
git clone https://github.com/vortsghost2025/kucoin-margin-bot kucoin-test
dir kucoin-test  # Verify files

# 2. If verified, delete test
rmdir /s kucoin-test

# 3. Only then delete local bulk
# (Keep archive!)
```

---

## Safety Checklist

Before deleting ANYTHING:

- [ ] Archive copy exists on S:\Archive\
- [ ] GitHub repo exists and verified
- [ ] Manifest exists in data\inventory.json
- [ ] Spot restore test passed
- [ ] Can recover one file from archive successfully
