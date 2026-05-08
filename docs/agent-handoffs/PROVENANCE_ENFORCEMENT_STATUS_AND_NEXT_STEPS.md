# Provenance Enforcement Status And Next Steps

Updated: 2026-05-08
Lane: Library
Prepared by: Codex

## What Was Saved

- Live Archivist handoff already present for packet workflow ratification
- Live Library handoff already present for fresh 4-repo snapshot generation
- This document records why provenance is still leaking and what to do next

## Current State

The system has strong provenance rules on paper, but not one universal mandatory output boundary in practice.

Working enforcement paths:

- `src/lane/SchemaValidator.js`
- `scripts/create-signed-message.js`
- `scripts/outbox-write-guard.js`

These paths can enforce:

- schema-valid lane messages
- signed delivery with `signature`, `signature_alg`, and `key_id`
- blocked unsigned outbox writes when the guarded path is used

## Why Provenance Still Fails

The failure is not that the rules do not exist. The failure is that agents can still complete work outside the strict transport path.

### Root Cause

There are multiple overlapping provenance standards instead of one universal contract:

1. Conversation provenance
   - `OUTPUT_PROVENANCE`
2. Convergence provenance
   - `claim`, `evidence`, `verified_by`, `status`
3. Transport provenance
   - `signature`, `signature_alg`, `key_id`
4. Evidence provenance
   - `evidence_path`, verification artifacts

Because these are split across multiple layers, an agent can satisfy one and skip another.

### Practical Failure Mode

Provenance is only enforced if the agent goes through:

1. `createMessage(...)`
2. `createSignedMessage(...)`
3. `deliverMessage(...)`

If an agent instead emits:

- plain chat text
- ad hoc JSON
- a report file
- a manual inbox file
- a completion note in a non-guarded path

then provenance becomes optional in practice.

### Bottom Line

Policy is strong.
Transport enforcement is partial.

You implemented the requirement many times, but you did not eliminate non-compliant output paths.

## Recommended Next Steps

### P0 Hardening

1. Create one canonical lane output adapter
   - All lane outputs must pass through a single wrapper
   - The wrapper must add identity, provenance, signature, and evidence fields

2. Fail closed on missing provenance
   - No lane completion artifact should be accepted if required provenance fields are missing
   - Missing provenance should block delivery, not merely warn

3. Block direct inbox and outbox writes
   - Allow writes only through:
     - `createMessage(...)`
     - `createSignedMessage(...)`
     - `deliverMessage(...)`

4. Separate “draft” from “done”
   - Plain text or freeform JSON may exist as drafts
   - They must not count as completed lane output

5. Unify the provenance model
   - Collapse conversation, convergence, transport, and evidence provenance into one required lane contract

### P1 Validation

1. Audit all current writers
   - Find every script or workflow that writes inbox/outbox artifacts directly
2. Re-route each writer through the canonical adapter
3. Add a repo-wide guard test
   - Fail if a lane artifact lacks the required identity/provenance envelope

### P2 Governance

1. Archivist ratifies the unified provenance contract
2. Library verifies all lane output paths against it
3. Kernel enforces it operationally

## Verification Targets For Next Session

- Prove which scripts still bypass the guarded delivery path
- Prove whether live agent channels still treat freeform text as “completed output”
- Prove that unsigned or un-attributed outputs can no longer land in canonical inbox/outbox paths

## Operational Summary

The issue is not “agents forgot the prompt.”

The issue is:

- multiple schemas
- multiple output surfaces
- incomplete choke-point enforcement

The correct fix is architectural hardening, not more reminder text.
