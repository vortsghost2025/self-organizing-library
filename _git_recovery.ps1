$ErrorActionPreference = 'Continue'
$repo = 'S:\self-organizing-library'
$log = @()

function Log($msg) {
    Write-Host $msg
    $script:log += $msg
}

function Run($cmd) {
    Log ">>> $cmd"
    try {
        $result = Invoke-Expression "cd $repo; $cmd 2>&1"
        $result | ForEach-Object { Log $_ }
        return $result
    } catch {
        Log "ERROR: $_"
        return $null
    }
}

# STEP 1: Abort the rebase
Log "`n===== STEP 1: Abort the rebase ====="
Run 'git rebase --abort'

# STEP 2: Check status after abort
Log "`n===== STEP 2: Check status after abort ====="
Run 'git status'

# STEP 3: Verify .env.local is NOT staged
Log "`n===== STEP 3: Verify .env.local is NOT staged ====="
$envCheck = Run 'git diff --cached -- .env.local'
if ($envCheck -and ($envCheck | Where-Object { $_ -match '\S' })) {
    Log "WARNING: .env.local IS staged! Unstaging..."
    Run 'git reset HEAD .env.local'
} else {
    Log "OK: .env.local is NOT staged (empty output)"
}

# STEP 4: Delete the temp script
Log "`n===== STEP 4: Delete temp script _git_lane_ops.js ====="
$tempScript = Join-Path $repo '_git_lane_ops.js'
if (Test-Path $tempScript) {
    Remove-Item $tempScript -Force
    Log "DELETED: _git_lane_ops.js"
} else {
    Log "NOT FOUND: _git_lane_ops.js (already deleted)"
}

# STEP 5: Pull with merge strategy
Log "`n===== STEP 5: Pull with merge strategy (NOT rebase) ====="
$pullResult = Run 'git pull origin main'

# Check for merge conflicts
$statusAfterPull = Run 'git status --porcelain'
$hasConflicts = $statusAfterPull | Where-Object { $_ -match '^UU|^AA|^DU|^UD' }

if ($hasConflicts) {
    Log "MERGE CONFLICTS DETECTED - Resolving..."

    # For lanes/archivist/state/active-owner.json: accept theirs (incoming)
    $archivistOwner = Join-Path $repo 'lanes\archivist\state\active-owner.json'
    if (Test-Path (Join-Path $repo 'lanes\archivist\state\active-owner.json')) {
        # Check if it's conflicted
        $conflictedArchivist = $statusAfterPull | Where-Object { $_ -match 'archivist.state.active-owner' }
        if ($conflictedArchivist) {
            Log "Resolving lanes/archivist/state/active-owner.json - accepting theirs"
            # Get the incoming version
            Run 'git checkout --theirs lanes/archivist/state/active-owner.json'
            # Save current working tree version to restore after merge
            $workingTreeContent = Get-Content $archivistOwner -Raw
            Run 'git add lanes/archivist/state/active-owner.json'
            # Immediately overwrite with working tree version (heartbeat process maintains this)
            Set-Content -Path $archivistOwner -Value $workingTreeContent -NoNewline
            Log "Restored working-tree version of archivist active-owner.json (heartbeat PID 51212 maintains this)"
        }
    }

    # For lanes/library/state/active-owner.json: accept ours (HEAD with session_id sess_mq2nt5rz_3997730)
    $libraryOwner = Join-Path $repo 'lanes\library\state\active-owner.json'
    if (Test-Path (Join-Path $repo 'lanes\library\state\active-owner.json')) {
        $conflictedLibrary = $statusAfterPull | Where-Object { $_ -match 'library.state.active-owner' }
        if ($conflictedLibrary) {
            Log "Resolving lanes/library/state/active-owner.json - accepting ours (sess_mq2nt5rz_3997730)"
            Run 'git checkout --ours lanes/library/state/active-owner.json'
            Run 'git add lanes/library/state/active-owner.json'
        }
    }

    # For logs/contradiction-adjudicator.json: accept ours (HEAD version)
    $contradictionLog = Join-Path $repo 'logs\contradiction-adjudicator.json'
    if (Test-Path (Join-Path $repo 'logs\contradiction-adjudicator.json')) {
        $conflictedContradiction = $statusAfterPull | Where-Object { $_ -match 'contradiction-adjudicator' }
        if ($conflictedContradiction) {
            Log "Resolving logs/contradiction-adjudicator.json - accepting ours"
            Run 'git checkout --ours logs/contradiction-adjudicator.json'
            Run 'git add logs/contradiction-adjudicator.json'
        }
    }

    # For ANY other conflicted files: accept ours unless clear improvement
    $otherConflicts = $statusAfterPull | Where-Object { $_ -match '^(UU|AA|DU|UD)' -and $_ -notmatch 'archivist.state.active-owner' -and $_ -notmatch 'library.state.active-owner' -and $_ -notmatch 'contradiction-adjudicator' }
    foreach ($conflict in $otherConflicts) {
        $confFile = ($conflict -replace '^(UU|AA|DU|UD)\s+', '').Trim()
        Log "Resolving $confFile - accepting ours (default)"
        Run "git checkout --ours `"$confFile`""
        Run "git add `"$confFile`""
    }

    # Commit the merge
    Log "Committing merge resolution..."
    Run 'git add -A'
    Run 'git commit -m "[CI:self-organizing-library] merge origin/main after system restart"'
} else {
    Log "No merge conflicts detected (clean merge or already up to date)"
    # If git created a merge commit automatically, it's already done
    # Check if we're in a merging state
    $mergeHead = Test-Path (Join-Path $repo '.git\MERGE_HEAD')
    if ($mergeHead) {
        Run 'git add -A'
        Run 'git commit -m "[CI:self-organizing-library] merge origin/main after system restart"'
    }
}

# STEP 6: Push
Log "`n===== STEP 6: Push to origin main ====="
Run 'git push origin main'

# STEP 7: Verify sync
Log "`n===== STEP 7: Verify sync ====="
Run 'git status'
Run 'git log --oneline -5'

# STEP 8: Final secret scan
Log "`n===== STEP 8: Final secret scan ====="
$cachedDiff = Run 'git diff --cached'
if ($cachedDiff -and ($cachedDiff | Where-Object { $_ -match '\S' })) {
    Log "WARNING: There are staged changes:"
    Log ($cachedDiff -join "`n")
} else {
    Log "OK: No staged changes (clean)"
}

$envDiff = Run 'git diff HEAD~1 -- .env.local'
if ($envDiff -and ($envDiff | Where-Object { $_ -match '\S' })) {
    Log "WARNING: .env.local appears in the last commit diff!"
} else {
    Log "OK: .env.local is NOT in the last commit"
}

Log "`n===== ALL STEPS COMPLETE ====="

# Save log
$logPath = Join-Path $repo '_git_recovery_log.txt'
$script:log | Out-File $logPath -Encoding utf8
Log "Full log saved to: $logPath"
