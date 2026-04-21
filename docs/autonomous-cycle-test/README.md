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

## Protocol
1. Library (Round 1) picks 2 tasks for ALL lanes, writes suggestions per-lane, attaches the question for the next lane
2. Each receiving lane: completes the 2 tasks assigned, picks 2 NEW tasks, sends to all other lanes with the same question attached
3. Each round is documented in this directory
4. Cycle continues until a lane cannot proceed without operator input
5. Operator can restore to pre-test state via git: `3fdf360`

## Restore Point
- **Commit:** `3fdf360`
- **Message:** "Pre-test restore point: snapshot before autonomous-cycle-test Round 1"
- **Timestamp:** 2026-04-21T19:01:00Z
- **HEAD before test:** `937462a`

## Round Tracking
| Round | Initiating Lane | Tasks Proposed | Status | Stopped? | Reason |
|-------|----------------|----------------|--------|----------|--------|
| 1 | library | (see round-001.json) | in_progress | no | — |

## Metrics
- **Rounds completed:** 0 (Round 1 in progress)
- **Human interventions required:** 0
- **Schema rejections:** 0
- **Contradictions detected:** 0
- **Cycle still alive:** yes
