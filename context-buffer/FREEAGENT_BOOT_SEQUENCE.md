# FREEAGENT PRODUCTION PHENOTYPE - BOOT SEQUENCE

Date: 2026-04-19T21:10:00-04:00
Status: COMPLETE
Phase: 2 - Boot Path Unification

## 1) BOOT SEQUENCE OVERVIEW

### 1.1 Target Runtime
The FreeAgent production phenotype targets:
- **orchestrator** (Archivist Lane, Port 3847)
- **agent1** (SwarmMind Lane, Port 54121)
- **agent2** (SwarmMind Lane, Port 54122)
- **agent3** (SwarmMind Lane, Port 54123)

### 1.2 Library Lane Role
Library lane (this repository) provides **verification infrastructure** - it does NOT run orchestrator or agent processes.

The Library boot sequence initializes:
1. Verification infrastructure
2. Trust store access
3. Key pair loading
4. Health verification

---

## 2) CANONICAL BOOT ORDER

### 2.1 Three-Lane Boot Sequence

```
┌─────────────────────────────────────────────────────────────────┐
│                    FREEAGENT BOOT SEQUENCE                       │
│                                                                  │
│  Phase 1: Archivist Lane (Authority 80)                         │
│  ────────────────────────────────────────────                   │
│  1. Start orchestrator (port 3847)                              │
│  2. Initialize trust store                                       │
│  3. Register own public key                                      │
│  4. Open health endpoint                                         │
│  5. Wait for lane registrations                                  │
│                                                                  │
│  Phase 2: SwarmMind Lane (Authority 80)                         │
│  ────────────────────────────────────────────                   │
│  1. Start agent1 (port 54121)                                   │
│  2. Start agent2 (port 54122)                                   │
│  3. Start agent3 (port 54123)                                   │
│  4. Register public keys with Archivist                         │
│  5. Establish WebSocket connections to orchestrator             │
│  6. Report ready status                                          │
│                                                                  │
│  Phase 3: Library Lane (Authority 60)                           │
│  ────────────────────────────────────────────                   │
│  1. Verify environment variables                                 │
│  2. Verify trust store access                                    │
│  3. Load and decrypt key pair                                    │
│  4. Verify orchestrator connectivity                             │
│  5. Run health checks                                            │
│  6. Report ready status                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Library Lane Boot Sequence (Detailed)

| Step | Check | Action on Failure |
|------|-------|-------------------|
| 1 | `LANE_KEY_PASSPHRASE` env var | **ABORT** - Required |
| 2 | Trust store file exists | **ABORT** - Cannot verify |
| 3 | Trust store has all lanes | **ABORT** - Missing key |
| 4 | Lane key pair exists | **ABORT** - Cannot sign |
| 5 | Private key decryption | **ABORT** - Wrong passphrase |
| 6 | Internal health checks | **ABORT** - Self-test failed |
| 7 | Orchestrator connectivity | **WARN** - Continue degraded |

---

## 3) STARTUP SCRIPTS

### 3.1 start-core.ps1

**Purpose**: Canonical launcher for Library verification infrastructure

**Usage**:
```powershell
# With environment variable set
$env:LANE_KEY_PASSPHRASE = "your-secret-passphrase"
.\scripts\start-core.ps1

# With verbose output
.\scripts\start-core.ps1 -Verbose

# Skip health check
.\scripts\start-core.ps1 -SkipHealthCheck
```

**Checks Performed**:
1. Environment variables (LANE_KEY_PASSPHRASE required)
2. Trust store file existence and validity
3. Lane key pair file existence
4. Private key decryption test
5. Health check (unless skipped)

**Output**:
- JSON status object on stdout
- Exit code 0 = success, 1 = failure

### 3.2 health-core.ps1

**Purpose**: Check all components and report status

**Usage**:
```powershell
# Human-readable output
.\scripts\health-core.ps1

# JSON output
.\scripts\health-core.ps1 -Json

# Verbose
.\scripts\health-core.ps1 -Verbose
```

**Checks Performed**:
- Trust store health (file, lanes, active count)
- Key pair health (file, key_id, validity)
- Verification health (test-lane-consistency.js)
- Environment health (all variables)
- Filesystem health (logs, trust directories)

**Output**:
```json
{
  "timestamp": "2026-04-19T21:10:00.000Z",
  "lane": "library",
  "status": "healthy",
  "checks": {
    "trustStore": { "status": "ok", "lanes": 3, "active": 3 },
    "keyPair": { "status": "ok", "keyId": "library-..." },
    "verification": { "status": "ok" },
    "environment": { "status": "ok" },
    "filesystem": { "status": "ok" }
  }
}
```

### 3.3 smoke-core.ps1

**Purpose**: Run verification drill (end-to-end smoke tests)

**Usage**:
```powershell
# Human-readable output
.\scripts\smoke-core.ps1

# JSON output
.\scripts\smoke-core.ps1 -Json

# Verbose
.\scripts\smoke-core.ps1 -Verbose
```

**Tests Performed**:
1. **Syntax and Startup Integrity** - `node --check` on core files
2. **Health Endpoints** - Run health-core.ps1
3. **Verification Checks** - test-lane-consistency.js
4. **Recovery Checks** - QuarantineManager, RecoveryClient presence
5. **Routing Checks** - Queue.js, orchestratorClient.js presence

**Output**:
```json
{
  "timestamp": "2026-04-19T21:10:00.000Z",
  "lane": "library",
  "status": "pass",
  "passed": 5,
  "failed": 0,
  "total": 5,
  "categories": { ... }
}
```

---

## 4) DEPENDENCY CHAIN

### 4.1 Hard Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                     STARTUP DEPENDENCIES                         │
│                                                                  │
│  LANE_KEY_PASSPHRASE (env)                                      │
│          │                                                       │
│          ▼                                                       │
│  ┌─────────────────┐                                            │
│  │  Trust Store    │◄── S:/Archivist-Agent/.trust/keys.json     │
│  │  (keys.json)    │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │  Lane Key Pair  │◄── .trust/library.json                    │
│  │  (library.json) │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ Key Decryption  │◄── Uses LANE_KEY_PASSPHRASE               │
│  │  Test           │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ Health Checks   │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │  READY STATE    │                                            │
│  └─────────────────┘                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Soft Dependencies

| Dependency | Check | Behavior on Missing |
|------------|-------|---------------------|
| Orchestrator endpoint | HTTP GET /health | Log warning, continue |
| Agent endpoints | Not checked at startup | Checked on artifact receipt |

---

## 5) FAILURE BEHAVIOR

### 5.1 Immediate Abort Conditions

| Condition | Exit Code | Message |
|-----------|-----------|---------|
| LANE_KEY_PASSPHRASE not set | 1 | "LANE_KEY_PASSPHRASE is not set (REQUIRED)" |
| Trust store not found | 1 | "Trust store not found: {path}" |
| Trust store missing lanes | 1 | "Missing or revoked lanes: {lanes}" |
| Key pair file not found | 1 | "Lane key pair not found: {path}" |
| Private key decryption failed | 1 | "Key decryption failed: {error}" |

### 5.2 Degraded Operation Conditions

| Condition | Status | Message |
|-----------|--------|---------|
| Orchestrator unreachable | degraded | "Orchestrator health check failed" |
| Logs directory missing | degraded | "Logs directory created" |

---

## 6) ONE-COMMAND BOOT

### 6.1 Full Boot Sequence (PowerShell)

```powershell
# Set required environment variable
$env:LANE_KEY_PASSPHRASE = "your-secret-passphrase"

# Run canonical startup
.\scripts\start-core.ps1

# If successful, run smoke tests
if ($LASTEXITCODE -eq 0) {
    .\scripts\smoke-core.ps1
}
```

### 6.2 Chain Boot (Unix-style)

```bash
# Set environment and run full sequence
LANE_KEY_PASSPHRASE=secret pwsh -Command "
    ./scripts/start-core.ps1
    if (\$LASTEXITCODE -eq 0) {
        ./scripts/smoke-core.ps1
    }
"
```

---

## 7) PRODUCTION ENTRYPOINT

### 7.1 governed-start.js

The Node.js entrypoint for production use:

```bash
# Production startup via Node.js
LANE_KEY_PASSPHRASE=secret node scripts/governed-start.js
```

This script:
1. Loads environment configuration
2. Initializes KeyManager
3. Starts verification services
4. Enters operational loop

---

## 8) GATE CONDITION

Fresh boot from stopped machine must pass health + smoke with one command chain.

- [x] Canonical startup script (start-core.ps1)
- [x] Health check script (health-core.ps1)
- [x] Smoke test script (smoke-core.ps1)
- [x] Failure conditions documented
- [x] One-command boot documented
- [x] Dependency chain documented

**GATE STATUS**: ✅ READY FOR REVIEW
