# FreeAgent Port Bindings

Date: 2026-04-19
Phase: 1
Architecture Mode: `lane_single_process`

## Overview

The `lane_single_process` architecture does **NOT** use distributed services with port bindings. Each lane runs as a standalone Node.js process without network listeners for inter-service communication.

## Port Analysis

### Original Roadmap Assumption

The roadmap mentioned ports:
- `3847` - Orchestrator
- `54121` - Agent 1
- `54122` - Agent 2
- `54123` - Agent 3

### Actual Architecture

**No port bindings required.** The four-lane system operates as:
- Independent processes
- File-based trust store (no network)
- HTTP recovery endpoint (Archivist only, optional)

---

## Network Endpoints

### Recovery Coordination (Optional)

| Lane | Role | Endpoint |
|------|------|----------|
| Archivist | Listen | `http://localhost:3000/orchestrate/recovery` |
| Library | Client | N/A (POST to Archivist) |
| SwarmMind | Client | N/A (POST to Archivist) |

**Notes:**
- Recovery endpoint is optional (failover: log error, continue)
- No health checks required between lanes
- No WebSocket endpoints in production phenotype

### Library (Next.js Development)

| Command | Port | Purpose |
|---------|------|---------|
| `npm run dev` | `3000` | Next.js dev server (development only) |
| `npm run start` | `3000` | Next.js prod server |

**Notes:**
- Not part of verification path
- Development/UI only
- Not required for production phenotype

---

## What NOT To Use

### Forbidden Network Patterns

| Pattern | Reason |
|---------|--------|
| Inter-lane HTTP calls | No distributed services |
| WebSocket between lanes | No real-time sync required |
| Shared database ports | Each lane has own storage |
| Message queue ports | File-based queue is sufficient |

### Why No Ports?

1. **Deterministic verification** requires no network dependency
2. **File-based trust store** is sufficient for key distribution
3. **Queue-based coordination** doesn't need real-time messaging
4. **Recovery endpoint** is informational only (optional)

---

## Future Consideration

If architecture transitions to `distributed_orchestrator_agents`:

| Service | Port | Protocol |
|---------|------|----------|
| Orchestrator | `3847` | HTTP |
| Agent 1 | `54121` | HTTP/WebSocket |
| Agent 2 | `54122` | HTTP/WebSocket |
| Agent 3 | `54123` | HTTP/WebSocket |

**Current status:** NOT IMPLEMENTED. Requires Phase gate approval.

---

## Summary

| Aspect | Value |
|--------|-------|
| Architecture Mode | `lane_single_process` |
| Required Ports | None |
| Optional Ports | `3000` (Archivist recovery, if enabled) |
| Development Ports | `3000` (Library Next.js dev) |

**Gate requirement:** No port binding changes without anchor update.

---

Last updated: 2026-04-19
