#!/usr/bin/env bash
set -euo pipefail
FILE="${1:-}"
if [[ -z "$FILE" ]]; then
  echo "Usage: $0 <output-file>"
  exit 2
fi
node scripts/pre-handoff-provenance-check.js "$FILE"

