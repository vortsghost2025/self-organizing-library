#!/usr/bin/env bash
set -euo pipefail
FILE="${1:-}"
if [[ -z "$FILE" ]]; then
  echo "Usage: $0 <output-file>"
  exit 2
fi

scripts/handoff-validate.sh "$FILE"
scripts/handoff-sign-check.sh "$FILE"
scripts/handoff-send.sh "$FILE"

echo "HANDOFF_OK: $FILE"

