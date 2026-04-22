# Autonomous Cycle Test (ACT)

## Purpose
Test whether a chain of lane-to-lane task suggestions can sustain itself autonomously, or at what point it requires human operator input.

## Hypothesis
The cycle will eventually stall because:
1. A lane encounters a decision that requires operator authority (governance change, key rotation, schema amendment)
2. Schema validation rejects a message and the lane can't self-heal
3. Two lanes propose contradictory tasks and need the operator as tiebreaker
4. A lane's session/context compacts and loses the cycle state
5. Resource exhaustion (context window, message queue overflow)

## Key Finding (Pre-Daemon)
**Round 1→2 transition requires human input.** The inbox watcher can move files but cannot invoke agent sessions. The operator must manually start each lane's kilo/opencode session and tell it to check inbox. This gap is itself a test finding — and the motivation for building the ACT Daemon.

## Protocol
1. Library (Round 1) picks 2 tasks for ALL lanes, writes suggestions per-lane, attaches the question for the next lane
2. Each receiving lane: completes the 2 tasks assigned, picks 2 NEW tasks, sends to all other lanes with the same question attached
3. Each round is documented in this directory
4. Cycle continues until a lane cannot proceed without operator input
5. Operator can restore to pre-test state via git: `3fdf360`

## ACT Daemon (`scripts/act-daemon.js`)

The daemon automates the round-robin cycle by:
1. Polling all 4 lane inboxes every 30 seconds for ACT messages
2. When an unprocessed ACT message is found, invoking `kilo run --auto` in that lane's project directory with a tailored prompt
3. Tracking rounds, errors, stalls, and human-intervention triggers in `daemon-state.json`
4. Logging everything to `daemon.log`

### Commands
```bash
# Dry run (log what would happen, don't invoke sessions)
npm run act:daemon:dry

# Full daemon (invoke sessions for real)
npm run act:daemon

# Check daemon state
npm run act:daemon:status

# Reset daemon state (start fresh)
npm run act:daemon:reset
```

### Options
```bash
node scripts/act-daemon.js --dry-run              # Don't invoke sessions
node scripts/act-daemon.js --interval 60000       # Poll every 60s
node scripts/act-daemon.js --max-rounds 10        # Stop after 10 rounds
```

### Safety Limits
| Limit | Default | Purpose |
|-------|---------|---------|
| Max rounds | 20 | Hard stop — test can't run forever |
| Max consecutive errors | 3 | Pause and request human input |
| Session timeout | 10 min | Kill stuck kilo sessions |
| Stall timeout | 5 min | No new messages = cycle broke |

### State File (`daemon-state.json`)
- `status`: initialized / running / paused / completed / crashed / shutdown
- `current_round`: highest round number seen
- `processed_message_ids`: list of task_ids already handled
- `round_history`: detailed log per round
- `human_intervention_required`: true = daemon stopped, needs you
- `stalled`: true = no new activity detected

## Restore Point
- **Commit:** `3fdf360`
- **Message:** "Pre-test restore point: snapshot before autonomous-cycle-test Round 1"
- **Timestamp:** 2026-04-21T19:01:00Z
- **HEAD before test:** `937462a`

## Round Tracking
| Round | Initiating Lane | Tasks Proposed | Status | Stopped? | Reason |
|-------|----------------|----------------|--------|----------|--------|
| 1 | library | Schema Self-Audit + Heartbeat Health Check | completed | no | — |
| 2 | archivist→library | Outbox Signing Compliance + Trust Store KeyID Verify | completed | no | Round 2 msg rejected by schema validator — processed manually from expired/ |
| 3 | library→all | Schema Version Alignment + Identity Key Material Recovery | completed | no | — |
| 4 | library | Outbox Historical Message Remediation + Daemon Live-Run Verification | in_progress | no |

## Metrics
- **Rounds completed:** 3
- **Human interventions required:** 0
- **Schema rejections:** 1
- **Contradictions detected:** 0
- **Cycle still alive:** yes
- **Daemon built:** yes (scripts/act-daemon.js)
