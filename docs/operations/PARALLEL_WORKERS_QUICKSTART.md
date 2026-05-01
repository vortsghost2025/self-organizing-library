# Parallel Workers Quick-Start

## Current State
Library lane normally runs **one** `lane-worker` process, processing inbox items sequentially. During burst loads (after SwarmMind/Archivist/Kernel sweeps), this creates a backlog.

## Solution: Parallel Workers

Run **multiple independent `lane-worker` instances** that share the same Library identity and inbox. They automatically divide work via lease acquisition.

### Option 1 — Three Visible Console Windows (Recommended for Monitoring)

```powershell
# From S:\self-organizing-library
npm run worker          # opens first worker in current window
# Open 2 more PowerShell windows and run:
npm run worker          # second
npm run worker          # third
```

Or use the launcher:
```powershell
.\scripts\start-workers.ps1 -Count 3
```
Opens 3 separate PowerShell windows, each running a worker. Close windows to stop.

### Option 2 — Background Jobs (Clean Desktop)

```powershell
# Start 3 workers as background jobs
npm run worker:parallel

# Check status
Get-Job

# View output of worker 1
Receive-Job -Name LibraryWorker_1 -Keep | more

# Stop all workers
npm run worker:stop
# or: Stop-Job -Name LibraryWorker*; Remove-Job -Name LibraryWorker*
```

### Option 3 — Windows Task Scheduler (Permanent Daemon)

Create scheduled task:
- **Program:** `powershell.exe`
- **Arguments:** `-WindowStyle Hidden -File "S:\self-organizing-library\scripts\start-workers.ps1" -Count 2`
- **Trigger:** At startup + repeat every 1 hour (in case of crash)
- **Run whether user logged on or not**

---

## Specialized Sub-Lanes (Option B)

For long-term separation of concerns, create dedicated lanes:

```bash
# Create a validator sub-lane (only processes verification/triage messages)
node scripts/create-sub-lane.js --name validator --filter "verification|triage"

# Create a reconciler sub-lane (only processes reconciliation/global tasks)  
node scripts/create-sub-lane.js --name reconciler --filter "reconcile|global"

# Create a siteindex sub-lane (only processes site-index generation)
node scripts/create-sub-lane.js --name siteindex --filter "site-index|generate"
```

Each sub-lane gets its own inbox/outbox but shares Library's code and identity. Start them independently.

---

## Load Balancing Notes

- Workers use **leases** (default 60s) to claim inbox items
- If a worker dies, its lease expires and other workers pick up the message
- No two workers process the same message (lease conflict prevention built-in)
- `--max-files` limits per-cycle processing (default ~200). Increase for burst capacity.

---

## Monitoring

- **Worker logs:** `logs/workers/worker-*.log`
- **Inbox state:** `lanes/library/inbox/` (action-required, in-progress, processed, quarantine)
- **Worker state:** `lanes/library/state/active-owner.json` (who owns what)
- **Health:** `lanes/broadcast/system_state.json` (productivity_score, last_heartbeat)

---

## FAQ

**Q: Won't workers step on each other's toes?**  
A: No — lease mechanism ensures exclusive processing per message.

**Q: Do I need to change anything in the inbox watcher?**  
A: No — watcher places messages, workers compete for them.

**Q: Can workers run on different machines?**  
A: Yes, if they share the same `.identity` directory (via network drive) and inbox path.

**Q: What if a worker crashes mid-message?**  
A: Lease expires after 60s (or max_renewals exceeded), message returns to inbox.

**Q: Should I run 2, 3, or 10 workers?**  
A: Start with 2 permanent + 1 burst worker during known batch arrivals (adjust as needed).

---

**Next:** Run `.\scripts\start-workers.ps1 -Count 3` and watch the throughput increase.
