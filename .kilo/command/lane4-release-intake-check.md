LANE 4 RELEASE INTAKE CHECK
===========================
Timestamp: {{ISO_TIMESTAMP}}

SOURCE:
- Kernel-Lane release version: {{version}}
- Manifest path: {{absolute_manifest_path}}
- Index path: S:/kernel-lane/releases/index.json

REQUIRED ARTIFACTS IN MANIFEST (Promotion Gate):
- [ ] Built artifact
- [ ] Benchmark report JSON
- [ ] Nsight Systems report
- [ ] Nsight Compute report
- [ ] Release manifest

CONSUMPTION RULES (MANDATORY):
- [ ] Consuming pinned release from `releases/index.json`
- [ ] NOT consuming `build/` outputs directly
- [ ] NOT consuming unversioned temporary artifacts
- [ ] Version is immutable in intake record

LIBRARY VERIFICATION:
- benchmark sanity: {{pass/fail + note}}
- profiler evidence sanity: {{pass/fail + note}}
- regression threshold status: {{pass/fail + note}}

INTAKE RECORD:
```json
{
  "source": "kernel-lane",
  "version": "{{version}}",
  "manifest_path": "{{manifest_path}}",
  "intake_timestamp": "{{ISO_TIMESTAMP}}",
  "intake_by": "library",
  "artifacts_consumed": [],
  "benchmark_summary": "{{key_metrics}}",
  "evidence_path": "{{Library_verification_path}}"
}
```

PROHIBITED:
- Never consume S:/kernel-lane/build/ outputs
- Never consume unversioned artifacts
- Never consume releases missing promotion gate artifacts
- Never bypass manifest to access raw files

INTAKE DECISION:
- {{ACCEPT|REJECT}}
- Blocker if rejected: {{single_blocker}}

POST-INTAKE:
- [ ] Log intake record to evidence path
- [ ] If benchmark regression: escalate to Archivist (P1)
- [ ] If missing artifacts: reject, notify Kernel-Lane
