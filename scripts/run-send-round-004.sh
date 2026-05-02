#!/usr/bin/env bash

# Load the lane passphrase from environment (LANE_KEY_PASSPHRASE must be set)
# Previously read from Archivist runtime - now sovereign (no cross-lane deps)
if [ -z "$LANE_KEY_PASSPHRASE" ]; then
  echo "ERROR: LANE_KEY_PASSPHRASE environment variable not set" >&2
  exit 1
fi

# Run the send script
NODE_ENV=production LANE_KEY_PASSPHRASE="$LANE_KEY_PASSPHRASE" node scripts/send-round-004.js
