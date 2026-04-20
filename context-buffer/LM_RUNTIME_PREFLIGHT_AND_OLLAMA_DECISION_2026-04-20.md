# LM Runtime Preflight + Ollama Decision - 2026-04-20

## Implemented: Startup Warning/Guard for Kilo/OpenCode

### New scripts
- `C:\Users\seand\.config\kilo\scripts\runtime-preflight.ps1`
- `C:\Users\seand\.config\kilo\scripts\kilo-safe.ps1`
- `C:\Users\seand\.config\kilo\scripts\opencode-safe.ps1`
- `C:\Users\seand\.config\kilo\scripts\kilo-safe.cmd`
- `C:\Users\seand\.config\kilo\scripts\opencode-safe.cmd`

### Behavior
- Checks LM Studio CLI availability (`lms`)
- Checks local server status (`lms server status --json --quiet`)
- Optionally auto-starts server if down (`-AutoStart`)
- Verifies OpenAI-compatible endpoint (`/v1/models`)
- Ensures required model exists (`qwen/qwen3.5-9b` by default)
- Optional chat probe (`-ProbeChat`)
- Blocks launcher on failed preflight unless `-ForceLaunch` is provided

### Usage
```powershell
# Direct preflight check
powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\seand\.config\kilo\scripts\runtime-preflight.ps1 -AutoStart

# Start Kilo with guard
C:\Users\seand\.config\kilo\scripts\kilo-safe.cmd

# Start OpenCode with guard
C:\Users\seand\.config\kilo\scripts\opencode-safe.cmd
```

### Verified now
- `lms server status` -> running on port 1234
- preflight PASS with required model present

## Ollama Reinstall Decision (RTX 5060)

### Current local state
- `ollama` command: not present
- `C:\Users\seand\AppData\Local\Programs\Ollama\ollama.exe`: missing

### Recommendation
- **You do not need Ollama reinstalled to keep your current non-GLM flow working**, because LM Studio is now validated and serving your non-GLM modes.
- **Reinstall Ollama only if you explicitly want dual-runtime redundancy** (LM Studio + Ollama) or provider-specific model behavior.

### If you choose to reinstall anyway
- Install latest stable from official channel.
- On this date, GitHub shows latest release as `v0.21.0`.
- RTX 5060 is listed in Ollama GPU support (compute capability 12.0 family).

### Minimal post-install checks
```powershell
ollama --version
ollama serve
Invoke-RestMethod http://127.0.0.1:11434/api/tags
Invoke-RestMethod http://127.0.0.1:11434/v1/models
```

## Source references (for decision)
- Ollama hardware support: https://docs.ollama.com/gpu
- Ollama Windows install docs: https://docs.ollama.com/windows
- Ollama releases: https://github.com/ollama/ollama/releases
- LM Studio CLI server status: https://lmstudio.ai/docs/cli/serve/server-status
- LM Studio integration note on `lms server start`: https://lmstudio.ai/docs/integrations/lmlink
