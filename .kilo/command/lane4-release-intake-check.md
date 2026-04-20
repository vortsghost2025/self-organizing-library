LANE 4 RELEASE INTAKE CHECK
===========================
Timestamp: {{ISO_TIMESTAMP}}

SOURCE:
- Kernel-Lane release version: {{version}}
- Manifest path: {{absolute_manifest_path}}

REQUIRED ARTIFACTS IN MANIFEST:
- [ ] artifact
- [ ] benchmark_report
- [ ] nsys_report
- [ ] ncu_report
- [ ] metrics
- [ ] created_at_utc

CONSUMPTION RULES:
- [ ] Consuming pinned release from `releases/index.json`
- [ ] Not consuming `build/` outputs
- [ ] Version is immutable in intake record

LIBRARY VERIFICATION NOTES:
- benchmark sanity: {{pass/fail + note}}
- profiler evidence sanity: {{pass/fail + note}}
- regression threshold status: {{pass/fail + note}}

INTAKE DECISION:
- {{ACCEPT|REJECT}}
- Blocker if rejected: {{single_blocker}}

