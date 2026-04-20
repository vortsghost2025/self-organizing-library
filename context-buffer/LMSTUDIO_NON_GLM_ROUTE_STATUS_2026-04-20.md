# LM Studio Non-GLM Route Status - 2026-04-20

## What Changed
- Orchestrator remains intentionally on GLM:
  - `nvidia/z-ai/glm5`
- Non-GLM modes moved to LM Studio model:
  - `lmstudio/qwen/qwen3.5-9b`
- LM Studio base URL enforced:
  - `http://127.0.0.1:1234/v1`

## Files Updated
- `C:\Users\seand\.config\kilo\kilo.jsonc`
- `C:\Users\seand\.config\kilo\opencode.json`
- `C:\Users\seand\.codex\worktrees\b6c3\Archivist-Agent\.kilo\kilo.jsonc`

## Backup Snapshot
- `C:\Users\seand\.config\kilo\backups\20260420_082909`

## LM Studio Runtime Evidence
- `lms server status`:
  - `The server is running on port 1234.`
- `GET /v1/models`:
  - `qwen/qwen3.5-9b`
  - `text-embedding-nomic-embed-text-v1.5`

## Functional Smoke Tests
- Normal completion (OpenAI-compatible endpoint):
  - model: `qwen/qwen3.5-9b`
  - result: `PONG`
- Tool-call behavior:
  - `finish_reason=tool_calls`
  - function called: `add_numbers`
  - arguments: `{ "a": 2, "b": 2 }`

## Notes on "0.8+ Changes"
- In current LM Studio, local API availability is controlled by `lms server`.
- Desktop app running alone is not sufficient; the local server must be started.

## Quick Commands
```powershell
# Check server
C:\Users\seand\.lmstudio\bin\lms.exe server status

# Start server (if stopped)
C:\Users\seand\.lmstudio\bin\lms.exe server start

# Verify API
Invoke-RestMethod http://127.0.0.1:1234/v1/models
```

## Rollback
```powershell
Copy-Item 'C:\Users\seand\.config\kilo\backups\20260420_082909\kilo.jsonc.bak' 'C:\Users\seand\.config\kilo\kilo.jsonc' -Force
Copy-Item 'C:\Users\seand\.config\kilo\backups\20260420_082909\opencode.json.bak' 'C:\Users\seand\.config\kilo\opencode.json' -Force
Copy-Item 'C:\Users\seand\.config\kilo\backups\20260420_082909\Archivist-Agent.kilo.jsonc.bak' 'C:\Users\seand\.codex\worktrees\b6c3\Archivist-Agent\.kilo\kilo.jsonc' -Force
```
