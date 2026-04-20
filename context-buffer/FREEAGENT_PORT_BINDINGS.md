# FREEAGENT PRODUCTION PHENOTYPE - PORT BINDINGS

Date: 2026-04-19T21:08:00-04:00
Status: COMPLETE
Phase: 1 - Topology and Contract Map

## 1) PORT ASSIGNMENTS

### 1.1 Core Runtime Ports (Roadmap Reference)

| Service | Port | Protocol | Status | Owner Lane |
|---------|------|----------|--------|------------|
| orchestrator | 3847 | HTTP/WebSocket | PLANNED | Archivist |
| agent1 | 54121 | HTTP/WebSocket | PLANNED | SwarmMind |
| agent2 | 54122 | HTTP/WebSocket | PLANNED | SwarmMind |
| agent3 | 54123 | HTTP/WebSocket | PLANNED | SwarmMind |

**Note**: These ports are defined in the roadmap for the FreeAgent runtime. Library lane (this repository) does NOT bind these ports - they are external services that Library communicates with.

### 1.2 Library Lane Ports

| Service | Port | Protocol | Status | Purpose |
|---------|------|----------|--------|---------|
| (none) | - | - | N/A | Library uses file-based communication |

**Note**: Library lane does NOT run an HTTP server. All inter-lane communication is file-based (queue logs, handoff artifacts) or outbound HTTP calls to Archivist orchestrator.

---

## 2) PORT CONTRACT DETAILS

### 2.1 Orchestrator Port (3847)

**Owner**: Archivist Lane (Authority 80)
**Purpose**: Recovery orchestration, retry scheduling

#### Expected Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check probe |
| `/orchestrate/recovery` | POST | Recovery request submission |
| `/orchestrate/status/{id}` | GET | Recovery status check |
| `/ws` | WebSocket | Real-time recovery events |

#### Connection Contract
- **Base URL**: Configured via `ARCHIVIST_ORCHESTRATOR_URL`
- **Default**: `http://localhost:3000/orchestrate/recovery`
- **Note**: Port 3847 is roadmap reference; actual URL is environment-configured

### 2.2 Agent Ports (54121-54123)

**Owner**: SwarmMind Lane (Authority 80)
**Purpose**: Agent execution, artifact production

#### Expected Agent Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Agent health check |
| `/artifact/submit` | POST | Artifact submission |
| `/artifact/{id}` | GET | Artifact retrieval |
| `/ws` | WebSocket | Real-time artifact events |

#### Agent Port Mapping
| Agent | Port | Purpose |
|-------|------|---------|
| agent1 | 54121 | Primary execution agent |
| agent2 | 54122 | Secondary execution agent |
| agent3 | 54123 | Tertiary execution agent |

---

## 3) NETWORK TOPOLOGY

```
┌─────────────────────────────────────────────────────────────────┐
│                        FREEAGENT RUNTIME                        │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    ARCHIVIST LANE                         │   │
│  │                    (Authority 80)                         │   │
│  │                                                           │   │
│  │   ┌─────────────────┐                                    │   │
│  │   │   orchestrator  │◄─────── Recovery Requests         │   │
│  │   │    Port: 3847   │        (from Library, SwarmMind)  │   │
│  │   │                 │───────► Retry Schedules            │   │
│  │   └─────────────────┘                                    │   │
│  │            │                                              │   │
│  │            │ Trust Store                                  │   │
│  │            ▼                                              │   │
│  │   S:/Archivist-Agent/.trust/keys.json                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    SWARMIND LANE                          │   │
│  │                    (Authority 80)                         │   │
│  │                                                           │   │
│  │   ┌─────────┐   ┌─────────┐   ┌─────────┐               │   │
│  │   │ agent1  │   │ agent2  │   │ agent3  │               │   │
│  │   │ :54121  │   │ :54122  │   │ :54123  │               │   │
│  │   └────┬────┘   └────┬────┘   └────┬────┘               │   │
│  │        │             │             │                      │   │
│  │        └─────────────┼─────────────┘                      │   │
│  │                      │                                    │   │
│  │                      ▼                                    │   │
│  │              Artifacts (signed)                           │   │
│  │                      │                                    │   │
│  └──────────────────────┼───────────────────────────────────┘   │
│                         │                                        │
│                         ▼                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     LIBRARY LANE                          │   │
│  │                    (Authority 60)                         │   │
│  │                                                           │   │
│  │   ┌─────────────────┐                                    │   │
│  │   │ VerifierWrapper │◄─────── Artifacts (verify)         │   │
│  │   │                 │                                    │   │
│  │   │ (file-based,    │───────► Queue (signed)             │   │
│  │   │  no HTTP port)  │                                    │   │
│  │   └─────────────────┘                                    │   │
│  │            │                                              │   │
│  │            │ Recovery Requests                           │   │
│  │            ▼                                              │   │
│  │   POST http://localhost:3000/orchestrate/recovery        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4) FIREWALL/NETWORK REQUIREMENTS

### 4.1 Library Lane Outbound

| Destination | Port | Protocol | Purpose |
|-------------|------|----------|---------|
| Archivist orchestrator | 3000 (default) | HTTP | Recovery requests |
| Archivist orchestrator | 3847 (if configured) | HTTP | Recovery requests |
| SwarmMind agents | 54121-54123 | HTTP | Health checks (optional) |

### 4.2 Library Lane Inbound

| Source | Port | Protocol | Purpose |
|--------|------|----------|---------|
| (none) | - | - | Library has no HTTP server |

**Note**: Library lane receives artifacts via file-based queue system, not HTTP.

---

## 5) WEBSOCKET ENDPOINTS (PLANNED)

### 5.1 Orchestrator WebSocket

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `ws://orchestrator:3847/ws` | Real-time recovery events | PLANNED |

### 5.2 Agent WebSockets

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `ws://agent1:54121/ws` | Real-time artifact events | PLANNED |
| `ws://agent2:54122/ws` | Real-time artifact events | PLANNED |
| `ws://agent3:54123/ws` | Real-time artifact events | PLANNED |

---

## 6) GATE CONDITION

Port bindings must allow third party to understand network topology.

- [x] All planned ports documented
- [x] Library lane network position documented
- [x] Outbound connections documented
- [x] File-based communication documented
- [x] WebSocket endpoints (planned) documented

**GATE STATUS**: ✅ READY FOR REVIEW
