# Lane Relay Watcher — Systemd Service

This service runs `scripts/lane-relay-watcher.sh` on the headless machine to provide bidirectional message sync between the local Windows workstation and headless via the SSHFS mount.

## Deployment (run on headless)

```bash
# Copy the unit file
sudo cp lane-relay-watcher.service /etc/systemd/system/

# Reload systemd configuration
sudo systemctl daemon-reload

# Enable and start the service
sudo systemctl enable --now lane-relay-watcher

# Check status
sudo systemctl status lane-relay-watcher

# View logs
sudo journalctl -u lane-relay-watcher -f
```

## What it does

- Polls `~/lanes/library/inbox/` and `~/lanes/library/outbox/` every 2 seconds
- Copies new JSON files across the SSHFS mount bidirectionally
- Logs all activity to `~/lane-relay.log`
- Restarts automatically on failure

## Dependencies

- SSHFS mount must be active: `S:` (Windows) or `/mnt/s` (WSL) mounted from `we4free@headless:/home/we4free/agent`
- Network connectivity between local and headless

## Troubleshooting

| Symptom | Action |
|---------|--------|
| `inactive (dead)` | Check mount: `mount | grep sshfs` |
| Messages not syncing | Examine log: `sudo journalctl -u lane-relay-watcher -n 50` |
| Mount dropped | Re-mount SSHFS; systemd will resume when mount returns |

## Notes for Library Lane

This service only handles lane messages (`lanes/*/inbox`, `lanes/*/outbox`). Evidence and code remain git-tracked and require manual push/pull.
