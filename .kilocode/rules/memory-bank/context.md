# Active Context: Library Lane - AI Governance

## Current State

**Project Status:** Truth-routing + Governance Depth system LIVE on deliberateensemble.works/graph. 9,133 authority edges, 387 VERIFIED / 103 CONFLICTED / 28 QUARANTINED nodes. Governance depth: 73 constitutional, 247 operational, 106 theoretical, 71 historical, 1 evidence, 742 application_adjacent, 2429 unknown. Bridge states: 61 enforced, 42 verified, 16 partial, 1 documented_only, 169 contradicted, 104 obsolete, 3276 unknown. NexusGraph uses ref-based lifecycle (no WebGL teardown on interaction). Site has 685 pages, 662 Pagefind-indexed, 2,954 entries across 7 repos.

The Library Lane serves as a verification-and-enforcement surface within a 4-lane AI governance lattice (Archivist, Library, SwarmMind, Kernel-Lane). All scheduled tasks (heartbeat + inbox watcher) are running on Windows Task Scheduler for all 4 lanes.

### Recent Accomplishments (Session 2026-04-30)
- [x] **Graph work-path analysis pipeline COMPLETE**: Built read-only script that extracts actionable work signals from deliberateensemble.works knowledge graph, classified by priority, and emitted ranked markdown + JSON reports. Results: 141 cross-ref contradiction candidates (P0), 61 tag-group artifacts (42 P0, 19 P1), 23 quarantine triage (P1), 1,198 unverified high-authority (P1), 786 bridge-state mismatch (P1), 180 derives-without-verifies (P1), 2,906 orphaned/ungoverned (2,050 P0, 856 P2).
- [x] **Accessibility improvements DEPLOYED**: Fixed contrast failures (--text-muted #71717A→#949494, --primary #7C3AED→#8B5CF6, --primary-hover #8B5CF6→#A78BFA, --border #2A2A32→#4A4A52, hardcoded #7C3AED→#8B5CF6 in 3 component files + gradient) and ARIA fixes (aria-pressed on LibraryClient filter buttons, progressbar ARIA on governance page, aria-live on result count, aria-hidden on decorative elements).
- [x] **Cross-lane coordination ADVANCED**: 
  - Responded to Archivist with graph info location (data/site-index.json) and confirmation to build ratify + triage scripts
  - Successfully ran SwarmMind's dry-run-reclassify-tag-artifacts-global.js (read-only analysis projecting 199 nodes CONFLICTED→UNVERIFIED)
  - Deployed all committed work to Vercel production via `vercel deploy --prod`

### Architecture Status
- **Identity enforcement**: HARD — IdentityEnforcer runs in enforce mode in inbox-watcher pipeline. Unsigned → expired/. Mismatched signatures → expired/. No "verified=false" middle ground.
- **Outbound signing**: Signer.signInboxMessage() + SchemaValidator.deliverMessage() with signingOptions parameter. Fail-closed on signing failure (won't deliver unsigned).
- **Trust store convergence**: ✅ ALL 4 broadcast trust stores verified identical with correct key_ids. Kernel key_id updated to `7f1a9fe931d1fbba` (on-disk DER fingerprint). Per-lane `.trust/keys.json` files verified for Library (cb3e57dd7818da3d) and Kernel (7f1a9fe931d1fbba). Archivist manually fixed. SwarmMind `.identity/public.pem` recreated.
- **Trust store normalization**: Both Verifier.js and TrustStoreManager.js now normalize flat-format trust stores (lane IDs as top-level keys) into nested { keys: {} } format.
- **Schema compliance**: v1.1 amendments implemented (payload.compression, execution.parent_id, watcher block, delivery_verification, canonical_paths)
- **Message delivery**: SchemaValidator.deliverMessage() validates BEFORE writing, stamps verified=true only if both schema-valid AND file-write succeeds, accepts signingOptions for JWS signing
- **Inbox watcher**: Validates incoming messages against schema → identity enforcement → idempotency check → priority sort
- **Cross-lane schema enforcement**: Compliance notices sent to SwarmMind and Kernel

### Trust Store Key IDs (Owner-Regenerated — 2026-04-27)
| Lane | key_id | Method |
|------|--------|--------|
| Archivist | `65ae05b2a9e749cb` | SHA-256 of DER public key (CHANGED from ee70b78105bc6189 — owner may have regenerated separately) |
| Library | `ea2a75bab220adc2` | SHA-256 of DER public key |
| SwarmMind | `addb0afb8ee5c2ed` | SHA-256 of DER public key |
| Kernel | `b677eb87f6be83f9` | SHA-256 of DER public key |

**Owner regenerated all 4 keys on 2026-04-27.** Old key_ids (147c5c2b..., cb3e57dd..., 7a91050f..., 7f1a9fe9...) are REVOKED. LANE_KEY_PASSPHRASE is set at Windows user scope. Sign+verify roundtrip VERIFIED WORKING.

**Standard adopted**: DER fingerprint (Option A). KeyManager._generateKeyId() now exports SPKI DER + SHA-256, matching OpenSSL-standard fingerprinting. All trust stores and per-lane keys.json updated.

**CRITICAL CORRECTION (2026-04-23 evening)**: Kernel has TWO public keys — the on-disk `public.pem` (DER fingerprint `7f1a9fe931d1fbba`) differs from `snapshot.json` and old trust store entry (`6b39158e43688686`). The on-disk key is what would be used for actual signing. All trust stores updated to `7f1a9fe931d1fbba`. The Authority key_id `1a7741b8d353abee` is a MAPPING ERROR — it is Archivist's own OLD canonical-PEM hash, NOT Kernel's key_id. P0 contradiction escalation delivered to Archivist.

### Convergence Status
- ✅ **Trust Store Convergence**: All 4 broadcast stores identical, correct key_ids, correct PEMs. 11/11 Archivist recovery.
- ✅ **v1.1 Schema — Phase 2 COMPLETE**: All lanes APPROVE WITH AMENDMENTS. All amendments implemented. Phase 5 RATIFY received from Archivist.
- ✅ **Lane 4 — Phase 2 COMPLETE**: Archivist + SwarmMind approved. Phase 5 RATIFY received.
- ⏳ **Priority Preemption Protocol**: All 3 lanes APPROVE WITH AMENDMENTS — awaiting Archivist final ratification
- ✅ **Autonomous Constitutional Enforcement v3 — CONVERGED**: Archivist + Library both APPROVE. All 13 amendments incorporated (K1-K4, A1-A5, L1-L4). Governance track converged. Kernel feasibility advisory pending.
- ✅ **P0 Schema Violations (NFM-019 source-level) — FIX APPLIED**: Archivist central normalization live (constitutional→manual, governance→opencode, active→in_progress, proposal→artifact). Re-broadcast of 3 pending messages awaited. Library quarantine will clear to 7.
- ✅ **Round 7 Remediation CONVERGED**: Patches applied, evidence‑exchange clean, phase5‑ratification delivered to all lanes.
- ✅ **Archivist key_id mismatch blocker** — RESOLVED. Adopted DER fingerprint standard (Option A). All KeyManager._generateKeyId() updated to use SPKI DER + SHA-256. All trust stores and per-lane keys.json updated with correct DER key_ids. SwarmMind .identity/ restored.
- ✅ **Post-compact audit FIXED**: swarmmind_no_identity false positive resolved (HMAC lanes now supported in laneHasIdentity())
- ✅ **Cloud reload recovery COMPLETE** (2026-04-28T13:42:05-04:00): trust store regenerated, identities synchronized, 10/11 recovery tests PASS, cross‑lane sync verified 0 conflicts, all lanes operational
- ✅ **Testing infrastructure gaps fixed**: verdict.json generation script, CI workflow gating, local run documentation
- ✅ **Weather pipeline NASA/NOAA integration**: FreeAgent committed and pushed (c8bfb58a)

## Session History

### Session 2026-05-01: Verification Triage Patch + Tag-Artifact Reclassification
- [x] **Verification triage patch APPLIED**: `analyze-unverified-authority.js --apply` executed with adjudication, added `verification_priority:low/medium/high` tags to 347 high-authority unverified nodes (75 structural, 25 governance, 230 ambiguous). See `VERIFICATION_TRIAGE_REPORT_2026-05-01.md`
- [x] **Global tag-artifact reclassification APPLIED**: `reclassify-all-tag-artifacts.js` executed with adjudication, reclassified 17 conflicted nodes (tag-group artifacts with zero CONTRADICTS edges) from CONFLICTED → UNVERIFIED. Zero remaining conflicted nodes in snapshot.
- [x] **Fixed missing writeSeal export**: Added `writeSeal` function to `graph-write-guard.js` exports, required by reclassification scripts
- [x] **Accessibility fixes DEPLOYED**: Contrast improvements and ARIA enhancements committed in d06184e and further refined in c0c1f04
- [x] **Archivist coordination**: Sent definitive response pointing to Library's directory for graph info (data/site-index.json is live graph, work-path JSON report has full node lists) and confirmed intent to build ratify + triage scripts
- [x] **SwarmMind coordination**: Successfully executed `scripts/dry-run-reclassify-tag-artifacts-global.js --graph S:/self-organizing-library/context-buffer/graph-snapshot-2026-04-30-17-34-19-619.json` projecting 75 artifact-class candidates for reclassification
- [x] **Vercel deployment**: Ran `vercel deploy --prod` to push committed accessibility fixes and graph improvements live to deliberateensemble.works
- [x] **Memory bank update**: Updated this context.md file to document recent accomplishments

### Session 2026-04-29: Snapshot Compare + Contradiction False Positive Verification
- [x] **Created graph-snapshot-compare.ts**: Pure TypeScript utility for comparing graph snapshots with detailed interpretation
- [x] **Verified contradiction false positives**: Confirmed that contradictionCount=65 is a Failure Mode tag-grouping artifact, not genuine contradiction, across 4 repos for "THE SINGLE ENTRY POINT" and "WE4FREE Publication Roadmap"
- [x] **Wrote verification docs**: `docs/graph/CONTRADICTION_FALSE_POSITIVE_VERIFICATION_2026-04-29.md` with full root cause analysis
- [x] **Generated snapshot reports**: Ran baseline and comparison snapshot sets showing zero deltas between runs

### Session 2026-04-28: Governance Depth + NFM-036 Analysis + E2E Review
- [x] **Governance depth layer LIVE**: Verified via `/api/graph-data` showing constitutional=73, operational=247, theoretical=106, historical=71, evidence=1, application_adjacent=742, unknown=2429
- [x] **NFM-036 Derivation Analysis COMPLETE**: Report at `library/docs/failure-modes/NFM-036-derivation-analysis.md` showing 48 FreeAgent nodes with cross-boundary DERIVES_FROM, 851 edges FreeAgent→governed, 11 CONFLICTED, 18 UNVERIFIED
- [x] **Lint warnings FIXED**: Both pre-existing lint warnings resolved (graph/page.tsx eslint-disable for noscript `<a>`, VideoCard.tsx `<img>` → `next/image`)
- [x] **E2E Lane Review completed**: Full checklist per Archivist P1 request written to `library/docs/e2e-review-2026-04-28.md`
- [x] **Signed message delivered to Archivist**: `task-1777357439918.json` signed with Library key, schema-valid, verified
- [x] **Trust store rebuilt**: From actual PEMs showing Archivist key_id changed from `ee70b78105bc6189` to `65ae05b2a9e749cb`

## Key Discoveries
1. **Identity enforcement must be hard** — Soft "verified=false" creates a middle ground that gets ignored. Only structural rejection (move to expired/) enforces compliance.
2. **Trust store format mismatch** — broadcast/trust-store.json uses flat format (lane IDs as top-level keys), but Verifier/TrustStoreManager expected nested { keys: {} } format. Added normalization in both.
3. **Subagent Write tool can destroy files** — Signer.js was reduced from 138→22 lines, context.md from 128→11 lines. ALWAYS verify file content and line count after subagent writes.
4. **TRUST_STORE_PATH was undefined** — constants.js only exported ARCHIVIST_TRUST_STORE_PATH, but Verifier.js and PhenotypeStore.js imported TRUST_STORE_PATH. Runtime got empty trust store.
5. **governed-start.js:88 called nonexistent method** — trustStore.loadFromArchivist() doesn't exist on TrustStoreManager class. Was a runtime crash.
6. **Coordination freshness ≠ liveness** — Heartbeat/git checks measure coordination artifact freshness, NOT liveness
7. **Canonical vs local mirror delivery** — Messages must go to target's actual repo path
8. **Schema to-enum must match canonical_paths keys** — Both must use `kernel` not `kernel-lane`
9. **SwarmMind emits schema-non-compliant messages** — Uses from_lane/to_lane instead of from/to
10. **Kernel emits non-schema release broadcasts** — Custom type instead of v1.1 inbox message schema
11. **Trust store key_ids must be cryptographically derived** — All 4 lanes had wrong key_ids that didn't match their `.identity/public.pem` fingerprints. The old sync script propagated one lane's key to all entries.
12. **Atomic writes can silently fail on Windows** — The fix-trust-stores.js deploy reported "verified" for Archivist `.trust/keys.json` but the file wasn't actually updated (Windows file locking race). Always verify file content after atomic write.
13. **SwarmMind `.identity/` directory can disappear** — Likely due to git operations or `.gitignore` patterns. The `multi_source_consistency` test catches this via `identity_exists` check.
14. **Authority key_id mapping can be wrong** — `AUTHORITY_SELF_RESOLUTION_PARADOX.md` Round 9 incorrectly assigned Archivist's key_id (`1a7741b8d353abee`) to Kernel. Always verify against actual DER fingerprints, not Authority claims.
15. **Kernel can have divergent keys** — On-disk `public.pem` can differ from `snapshot.json` and trust store entries. Always use the on-disk key as canonical (it's what signing actually uses).
16. **Graph work-path analysis reveals actionable intelligence**: Of 3,589 nodes, 141 are P0 cross-ref contradiction candidates requiring human review, 23 are P1 quarantine triage cases, and 2,906 are orphaned/ungoverned (majority P0)
17. **Accessibility is achievable with targeted fixes**: Contrast and ARIA improvements can be made incrementally with measurable impact for visually impaired users
18. **Cross-lane coordination requires explicit confirmation**: Archivist needs clear signals about which data to use and what actions to take next

## Still Not Done
- 🔲 Hardening drill scheduled task (needs admin privileges)
- 🔲 Decide policy for previously-signed messages with now-stale key_ids (they will fail verification)
- 🔲 Priority preemption protocol convergence/ratification — *pending*
- 🔲 SwarmMind schema compliance response — *pending*
- 🔲 Kernel schema compliance response — *pending*
- 🔲 Kernel v0.1.0 re-evaluation — *pending*
- 🔲 `contradiction_kind` field (phase 2) — requires deeper semantic analysis
- 🔲 MDX/Markdown content rendering for document detail pages
- 🔲 NFM taxonomy → live classification engine (Sean's next vision)
- 🔲 Deliberate failure injection protocol → Paper 7
- 🔲 P1: Shape differentiation for color-blind users — requires registering custom Sigma v3 node renderers (circle/diamond/square/triangle by node type)
- 🔲 P2-P3 graph accessibility: Guided snapshot flow, export, gallery, comparison viewer, lane handoff
- 🔲 Data model change: Add `origin` field to GraphEdge, status assignment guard in truth-routing.ts — deferred until after P0/P1 merged and validated