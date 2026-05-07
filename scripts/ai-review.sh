#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROUTER_DIR="$SCRIPT_DIR/ai-router"
CONFIG="$SCRIPT_DIR/../config/ai-review-router.json"

AUTO_ESCALATE=false
if [ "${1:-}" = "--auto" ] || [ "${1:-}" = "-a" ]; then
AUTO_ESCALATE=true
shift
fi

TIER="${1:-local}"

VALID_TIERS="local strong openrouter final help --help -h l s n o or f"

is_valid_tier() {
case "$1" in
local|strong|openrouter|final|help|--help|-h|l|s|n|o|or|f) return 0 ;;
*) return 1 ;;
esac
}

if [ "$AUTO_ESCALATE" = true ]; then
if ! is_valid_tier "$TIER"; then
prompt="$TIER $*"
TIER="local"
else
shift 2>/dev/null || true
prompt="$*"
fi
else
shift 2>/dev/null || true
prompt="$*"
fi

UNCERTAINTY_SIGNALS="(uncertain|not sure|may need|i think|possibly|might be|could not determine|unable to|insufficient|recommend.*(stronger|higher)|escalate)"

run_local() {
  OLLAMA_HOST="${OLLAMA_HOST:-100.95.40.99:11434}" bash "$ROUTER_DIR/ollama-review.sh" "$prompt" 2>&1
}

run_strong() {
export NVIDIA_MODEL="${NVIDIA_MODEL:-nvidia/nemotron-3-super-120b-a12b}"
if [ -z "${NVIDIA_API_KEY:-}" ]; then
NVIDIA_API_KEY=$(grep NVIDIA_API_KEY .env.local 2>/dev/null | cut -d= -f2- | tr -d '[:space:]')
export NVIDIA_API_KEY
fi
bash "$ROUTER_DIR/nvidia-review.sh" "$prompt" 2>&1
}

run_openrouter() {
export OPENROUTER_MODEL="${OPENROUTER_MODEL:-nvidia/nemotron-3-super-120b-a12b:free}"
if [ -z "${OPENROUTER_API_KEY:-}" ]; then
OPENROUTER_API_KEY=$(grep OPENROUTER_API_KEY .env.local 2>/dev/null | cut -d= -f2- | tr -d '[:space:]')
export OPENROUTER_API_KEY
fi
bash "$ROUTER_DIR/openrouter-review.sh" "$prompt" 2>&1
}

if [ "$AUTO_ESCALATE" = true ]; then
echo "=== AUTO-ESCALATE: Starting at local tier ==="
local_output=$(run_local)
local_exit=$?

if [ $local_exit -ne 0 ]; then
echo "=== Local tier failed (exit $local_exit), escalating to strong ==="
run_strong
exit $?
fi

echo "$local_output"
echo ""

if echo "$local_output" | grep -qiE "$UNCERTAINTY_SIGNALS"; then
echo "=== Uncertainty detected in local response, escalating to strong ==="
echo ""
run_strong
else
echo "=== Local response appears confident. No escalation needed. ==="
fi
exit 0
fi

case "$TIER" in
  local|review-local|l)
    run_local
    ;;
strong|review-strong|nvidia|n|s)
exec bash "$ROUTER_DIR/nvidia-review.sh" "$prompt"
;;
openrouter|or|o)
exec bash "$ROUTER_DIR/openrouter-review.sh" "$prompt"
;;
final|review-final|f)
echo "FINAL tier: Route to Claude/GPT/GLM manually via agent provider. No shell script available." >&2
echo "Use this tier for: governance-sensitive decisions, deployment-risk, trust-store/key changes." >&2
echo "Tip: Use 'openrouter' (or) tier with a strong model as an alternative." >&2
exit 1
;;
help|--help|-h)
echo "Usage: ai-review.sh [--auto] <tier> '<prompt>'"
echo ""
echo "Tiers:"
  echo " local (l) - Ollama qwen2.5-coder:7b (VPS via Tailscale default, local RTX 5060 fallback)"
echo " strong (s,n) - NVIDIA NIM nemotron-3-super-120b (cloud, strong reasoning)"
echo " openrouter (o) - OpenRouter free models (nemotron-3-super:free default)"
echo " final (f) - Manual: Claude/GPT/GLM via agent provider (not scriptable)"
echo ""
echo "Auto-escalation:"
echo " --auto (-a) - Start at local, auto-escalate to strong if uncertain"
echo " Detects uncertainty signals in local response"
echo ""
echo "Examples:"
echo " bash scripts/ai-review.sh local 'Find bugs in this function'"
echo " bash scripts/ai-review.sh strong 'Analyze this architecture for race conditions'"
echo " bash scripts/ai-review.sh openrouter 'Deep review of this governance protocol'"
echo " bash scripts/ai-review.sh --auto 'Review this complex patch'"
  echo " NVIDIA_MODEL=deepseek-ai/deepseek-v4-pro bash scripts/ai-review.sh strong 'Review'"
  echo " OLLAMA_HOST=100.95.40.99:11434 bash scripts/ai-review.sh local 'Review'"
  echo ""
  echo "Env vars:"
  echo " OLLAMA_HOST - Ollama endpoint (default: 100.95.40.99:11434, fallback: 127.0.0.1:11434)"
  echo ""
  echo "Guardrails (see ai-review-router.json):"
  echo " - Review only: no mutation authority, no file writes"
  echo " - API keys must be in .env.local (never committed)"
echo ""
echo "Config: $CONFIG"
exit 0
;;
*)
echo "Unknown tier: $TIER. Use local, strong, openrouter, final, or --auto. See: bash scripts/ai-review.sh help" >&2
exit 1
;;
esac
