# Ollama + OpenCode Accessible Setup (No Browser) - 2026-04-20

## Completed
- Installed Ollama `0.21.0`
- Pulled models:
  - `qwen2.5-coder:3b`
  - `qwen2.5-coder:7b`
- Added OpenCode shim command:
  - `opencode` now resolves via `C:\Users\seand\AppData\Roaming\npm\opencode.cmd`
- Updated OpenCode provider config:
  - File: `C:\Users\seand\.config\opencode\opencode.json`
  - Provider: `my-ollama`
  - Base URL: `http://localhost:11434/v1`
  - Models added: `qwen2.5-coder:3b`, `qwen2.5-coder:7b`

## One-command launchers
- `oc3` -> OpenCode on `my-ollama/qwen2.5-coder:3b`
- `oc7` -> OpenCode on `my-ollama/qwen2.5-coder:7b`

Both auto-attempt `ollama serve` in background before launching.

## Use
```powershell
oc3
oc7

# one-off run
oc3 run "Reply with exactly: PONG"
oc7 run "Reply with exactly: PONG"
```

## Notes
- `ollama launch opencode --config` currently errors in headless mode on this setup.
- Direct OpenCode + provider config is now working and verified.
