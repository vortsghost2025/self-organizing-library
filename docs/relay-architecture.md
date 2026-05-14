# Lane Message Relay Architecture

## Overview
To achieve instant cross-machine message relay between headless and local workstations, we bypass git for lane inbox/outbox synchronization and use a direct filesystem mount instead. Evidence and governance artifacts remain git-tracked.

## Components

### 1. SSHFS Mount
- **Headless**: `/home/we4free/agent/` served via SSHFS
- **Local**: Mounted at `S:\` (Windows) or `/mnt/s` (WSL)
- Auth: Passwordless Ed25519 key pair
- Mount options: `sshfs#we4free@headless:/home/we4free/agent S: -o IdentityFile=C:\Users\we4free\.ssh\id_ed25519 -o reconnect`

### 2. lane-relay-watcher.sh
Bidirectional sync daemon running on **headless** (PID 2194010 as of 2026-05-14).

- Monitors:
  - `~/lanes/library/inbox/` (new messages from local → headless)
  - `~/lanes/library/outbox/` (ready messages from headless → local)
- Actions:
  - Detects new JSON files by inode change
  - Copies files across mount bidirectionally
  - Logs to `~/lane-relay.log` with timestamps
- Interval: 2 seconds
- Idempotent: does not overwrite newer files with older timestamps

### 3. Message Flow

```
Local machine (Windows)               Headless (Linux)
───────────────────────               ───────────────
lanes/library/inbox/   ←───── SSHFS ─→ /home/we4free/agent/lanes/library/inbox/
lanes/library/outbox/  ───── SSHFS ─→ /home/we4free/agent/lanes/library/outbox/
     ↑                                       ↑
Library lane writes                     Library lane reads
ready-to-send messages                   incoming messages
```

- Library lane on local writes outbox → appears on headless within 2s → headless Library picks up and processes.
- Headless Library writes inbox → appears on local within 2s → local Library picks up and processes.

### 4. Git-Based Artifacts (unchanged)
- `evidence/` directory: full git history, signed commits
- `docs/`, `src/`: code and documentation
- `lanes/broadcast/`: public cross-lane messages (git)
These remain on headless only; local pulls/pushes as needed.

## Rationale
- Git introduces latency (seconds to minutes) and requires manual fetch/push.
- Lane messages are small JSON control files requiring near-realtime delivery.
- Direct mount gives sub-second visibility; polling interval 2s is a safe compromise.
- Separation of concerns: control plane (inbox/outbox) vs. evidence plane (git).

## Resilience
- If mount drops, watcher logs error and retries on next cycle.
- Files are not deleted until successfully copied; no message loss.
- Systemd unit can enforce restart on failure (todo).

## Operational Notes
- Headless service runs under user `we4free`.
- Mount must persist across reboots (systemd or autofs).
- No conflict with Archivist lane: Archivist operates on headless `lanes/archivist/` independently.
- Kernel lane may also use mount for cross-machine coordination; coordinate via `lanes/broadcast/`.
