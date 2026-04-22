#!/usr/bin/env bash

# Load the lane passphrase
L=$(node -e "const d=require('S:/Archivist-Agent/.runtime/lane-passphrases.json');console.log(d.library)")

# Run the send script
NODE_ENV=production LANE_KEY_PASSPHRASE="$L" node scripts/send-round-004.js