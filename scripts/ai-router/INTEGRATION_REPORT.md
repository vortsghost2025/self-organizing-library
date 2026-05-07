# AI Review Router — Project Integration Report

Generated: 2026-05-06T23:11:34-04:00

---

## AI_REVIEW_PROJECT_INTEGRATION_REPORT

### files_changed
- `scripts/ai-review.sh` — stable entrypoint (portable `$(dirname "$0")` paths, delegates to `ai-router/` helpers)
- `scripts/ai-router/ollama-review.sh` — local tier (Ollama qwen2.5-coder:7b via Node.js http)
- `scripts/ai-router/nvidia-review.sh` — strong tier (NVIDIA NIM nemotron-3-super-120b, OpenAI SDK + streaming)
- `scripts/ai-router/openrouter-review.sh` — openrouter tier (OpenRouter free Nemotron, OpenAI SDK + streaming)
- `scripts/ai-router/ai-review-router.json` — policy config with guardrails
- `AGENTS.md` — added AI Review Router section (tier table, auto-escalation, guardrails)
- `.kilocode/rules/memory-bank/context.md` — added router integration documentation

### tests
| # | Test | Result |
|---|------|--------|
| 1 | `bash scripts/ai-review.sh local "Reply only READY_LOCAL"` | ✅ PASS — responded `READY_LOCAL` |
| 2 | `bash scripts/ai-review.sh strong "Reply only READY_STRONG"` | ✅ PASS — responded `READY_STRONG` |
| 3 | `bash scripts/ai-review.sh openrouter "Reply only READY_OPENROUTER"` | ✅ PASS — responded `READY_OPENROUTER` |
| 4 | `bash scripts/ai-review.sh final "test"` | ✅ PASS — printed manual-route guidance |
| 5 | Auto-escalation (`--auto`) | ✅ PASS — starts local, escalates on uncertainty signals |

### secret_scan
```
Pattern: nvapi-[A-Za-z0-9_-]{20,}|hapi_[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9_-]{20,}
Scope:   scripts/ai-router/ scripts/ai-review.sh
Result:  CLEAN — 0 matches in router scripts (5 false positives in unrelated legacy scripts, no actual keys)
```

### files_to_commit
- `scripts/ai-review.sh`
- `scripts/ai-router/ollama-review.sh`
- `scripts/ai-router/nvidia-review.sh`
- `scripts/ai-router/openrouter-review.sh`
- `scripts/ai-router/ai-review-router.json`
- `scripts/ai-router/INTEGRATION_REPORT.md`
- `AGENTS.md`
- `.kilocode/rules/memory-bank/context.md`

### files_excluded
- `.env.local` (gitignored, contains API keys)
- `C:\Users\seand\ai-review.sh` (backup, outside repo)
- `C:\Users\seand\ollama-review.sh` (backup, outside repo)
- `C:\Users\seand\nvidia-review.sh` (backup, outside repo)
- `C:\Users\seand\openrouter-review.sh` (backup, outside repo)
- `C:\Users\seand\ai-review-router.json` (backup, outside repo)
- All runtime/quarantine/snapshot artifacts under `lanes/`

### remaining_gaps
- Ollama not deployed on VPS yet (deferred — Tailscale-only access planned)
- Lane executors not yet wired to call `ai-review.sh` (deferred per plan)
- No headless Ubuntu Ollama endpoint yet (requires VPS setup + Tailscale)
- OpenRouter free model catalog is volatile — only 2 of 29 free models currently routable

### errors
- None
