# Critical Questions + Immediate Stabilization (2026-04-20)

## Why this exists
This is the fast recovery brief for when sessions get overloaded or routing drifts.

## The most important questions (and answers)

### 1) Are we cloud-routed right now, or accidentally hitting local runtimes?
**Answer:** Cloud-routed.
- Global and project configs are set to `nvidia/z-ai/glm-5.1`.
- Local providers are disabled via `"disabled_providers": ["lmstudio", "ollama"]`.
- Result: No local LM Studio/Ollama dependency during normal Kilo/OpenCode routing.

### 2) Is the orchestrator mismatch/tool failure still active?
**Answer:** Orchestrator route is healthy on cloud GLM and the known tool-surface guard is present.
- Orchestrator model: `nvidia/z-ai/glm-5.1`
- Orchestrator tools include: `"invalid": true`
- Orchestrator permissions explicitly allow: `question/read/glob/grep/edit/write/task/webfetch/todowrite/bash`

### 3) Which files are the control plane for routing stability?
**Answer:** These four files:
- `C:\Users\seand\.config\kilo\kilo.jsonc`
- `C:\Users\seand\.config\kilo\opencode.json`
- `S:\self-organizing-library\kilo.json`
- `S:\SwarmMind Self-Optimizing Multi-Agent AI System\kilo.json`

### 4) Is live inference actually working end-to-end right now?
**Answer:** Yes.
- `kilo run "Reply with only: SELF_ROUTE_OK"` in `S:\self-organizing-library` returned `SELF_ROUTE_OK`
- `kilo run "Reply with only: SWARM_ROUTE_OK"` in `S:\SwarmMind Self-Optimizing Multi-Agent AI System` returned `SWARM_ROUTE_OK`
- `kilo run --agent orchestrator "Reply with only: ORCH_OK"` returned `ORCH_OK`

### 5) What is the main remaining operational risk?
**Answer:** Concurrent config drift from multiple active agents/sessions rewriting the same config surfaces.
- Symptom observed earlier: invalid schema (`provider.openrouter.api_key`) appeared and broke load.
- Mitigation: single-writer rule for the four control-plane files above.

## What was done now (without waiting)
1. Revalidated all four routing configs.
2. Confirmed both project configs resolve to cloud GLM.
3. Confirmed orchestrator lane resolves and executes.
4. Confirmed launch wrappers are cloud-aware and skip local preflight in cloud-only mode:
   - `C:\Users\seand\.config\kilo\scripts\kilo-safe.ps1`
   - `C:\Users\seand\.config\kilo\scripts\opencode-safe.ps1`

## Immediate operator protocol (when things start crumbling)
1. Stop writing config from multiple lanes at once.
2. Run:
   - `kilo debug config` in both project roots
   - `kilo run "Reply with only: ROUTE_OK"`
3. If either fails config validation, restore cloud-only settings in that project `kilo.json`.
4. Re-test orchestrator directly:
   - `kilo run --agent orchestrator "Reply with only: ORCH_OK"`

## Decision
Current state is stable enough to proceed with code review/hardening work without local inference load.
