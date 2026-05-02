#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.join(__dirname, '..', '..', 'config', 'lane-registry.json');

const _DRIVE = 'S:/';
const _DIRS = {
  archivist: _DRIVE + 'Archivist-Agent',
  kernel: _DRIVE + 'kernel-lane',
  swarmmind: _DRIVE + 'SwarmMind',
  library: _DRIVE + 'self-organizing-library',
};
const _MAILBOX_SUB = (laneId) => `/lanes/${laneId}/`;
const _MAILBOXES = (root, laneId) => {
  const base = root + _MAILBOX_SUB(laneId);
  return { inbox: base + 'inbox', outbox: base + 'outbox', processed: base + 'inbox/processed' };
};

const FALLBACK_REGISTRY = {
  schema_version: '1.0',
  lanes: {
    archivist: {
      lane_id: 'archivist',
      role: 'coordinator',
      local_path: _DIRS.archivist,
      repo: 'https://github.com/vortsghost2025/Archivist-Agent',
      mailboxes: _MAILBOXES(_DIRS.archivist, 'archivist'),
    },
    authority: {
      lane_id: 'authority',
      role: 'governance',
      local_path: _DIRS.archivist,
      repo: 'https://github.com/vortsghost2025/Archivist-Agent',
      mailboxes: _MAILBOXES(_DIRS.archivist, 'authority'),
    },
    kernel: {
      lane_id: 'kernel',
      role: 'execution',
      local_path: _DIRS.kernel,
      repo: 'https://github.com/vortsghost2025/kernel-lane.git',
      mailboxes: _MAILBOXES(_DIRS.kernel, 'kernel'),
    },
    swarmmind: {
      lane_id: 'swarmmind',
      role: 'optimization',
      local_path: _DIRS.swarmmind,
      canonical_name: 'SwarmMind',
      forbidden_variants: [
        _DIRS.swarmmind + ' Self-Optimizing Multi-Agent AI System',
        _DIRS.swarmmind.replace('/', '-') + '-Self-Optimizing-Multi-Agent-AI-System',
      ],
      repo: 'https://github.com/vortsghost2025/SwarmMind',
      mailboxes: _MAILBOXES(_DIRS.swarmmind, 'swarmmind'),
    },
    library: {
      lane_id: 'library',
      role: 'knowledge',
      local_path: _DIRS.library,
      repo: 'https://github.com/vortsghost2025/self-organizing-library',
      mailboxes: _MAILBOXES(_DIRS.library, 'library'),
    },
  },
  broadcast: {
    path: _DIRS.archivist + '/lanes/broadcast',
  },
};

class LaneDiscovery {
  constructor() {
    this.registry = this.loadRegistry();
  }

  loadRegistry() {
    try {
      const data = fs.readFileSync(REGISTRY_PATH, 'utf8');
      return JSON.parse(data);
    } catch (_) {
      return FALLBACK_REGISTRY;
    }
  }

  getLane(laneId) {
    const lane = this.registry.lanes[laneId.toLowerCase()];
    if (!lane) {
      throw new Error(`Lane '${laneId}' not found in registry. Available: ${Object.keys(this.registry.lanes).join(', ')}`);
    }
    return lane;
  }

  getInbox(laneId) {
    const lane = this.getLane(laneId);
    return lane.mailboxes.inbox;
  }

  getOutbox(laneId) {
    const lane = this.getLane(laneId);
    return lane.mailboxes.outbox;
  }

  getProcessed(laneId) {
    const lane = this.getLane(laneId);
    return lane.mailboxes.processed;
  }

  getLocalPath(laneId) {
    const lane = this.getLane(laneId);
    return lane.local_path;
  }

  getRepo(laneId) {
    const lane = this.getLane(laneId);
    return lane.repo;
  }

  getAllowedRoots() {
    return Object.values(this.registry.lanes).map(l => l.local_path);
  }

  getLaneMap() {
    const map = {};
    for (const [id, lane] of Object.entries(this.registry.lanes)) {
      map[id] = lane.local_path;
    }
    return map;
  }

  getBroadcastPath() {
    return this.registry.broadcast.path;
  }

  validatePath(laneId, testPath) {
    const lane = this.getLane(laneId);

    if (lane.forbidden_variants) {
      for (const variant of lane.forbidden_variants) {
        if (testPath.toLowerCase().includes(variant.toLowerCase())) {
          throw new Error(
            `PATH ERROR: '${testPath}' is a forbidden variant. ` +
            `Use canonical path: ${lane.local_path}`
          );
        }
      }
    }

    if (!testPath.startsWith(lane.local_path)) {
      throw new Error(
        `PATH MISMATCH: '${testPath}' does not match registered path for ${laneId}. ` +
        `Expected: ${lane.local_path}`
      );
    }

    return lane.local_path;
  }

  sendToLane(fromLane, toLane, message, filename) {
    const inboxPath = this.getInbox(toLane);
    const outboxPath = this.getOutbox(fromLane);

    if (!fs.existsSync(inboxPath)) {
      fs.mkdirSync(inboxPath, { recursive: true });
    }
    if (!fs.existsSync(outboxPath)) {
      fs.mkdirSync(outboxPath, { recursive: true });
    }

    const targetPath = path.join(inboxPath, filename);
    fs.writeFileSync(targetPath, JSON.stringify(message, null, 2));

    const receipt = {
      type: 'delivery_receipt',
      to: toLane,
      message_path: targetPath,
      timestamp: new Date().toISOString(),
      status: 'delivered',
    };
    const receiptPath = path.join(outboxPath, `receipt-${filename}`);
    fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));

    console.log(`[LANE-DISCOVERY] Sent to ${toLane}: ${targetPath}`);
    return targetPath;
  }

  listLanes() {
    return Object.keys(this.registry.lanes);
  }
}

if (require.main === module) {
  const discovery = new LaneDiscovery();

  const command = process.argv[2];
  const lane = process.argv[3];

  switch (command) {
    case 'inbox':
      console.log(discovery.getInbox(lane));
      break;
    case 'outbox':
      console.log(discovery.getOutbox(lane));
      break;
    case 'local':
      console.log(discovery.getLocalPath(lane));
      break;
    case 'repo':
      console.log(discovery.getRepo(lane));
      break;
    case 'list':
      console.log(discovery.listLanes().join('\n'));
      break;
    case 'validate':
      try {
        discovery.validatePath(lane, process.argv[4]);
        console.log('VALID');
      } catch (e) {
        console.error(e.message);
        process.exit(1);
      }
      break;
    default:
      console.log('Usage: node lane-discovery.js <command> [lane] [path]');
      console.log('Commands: inbox, outbox, local, repo, list, validate');
  }
}

module.exports = { LaneDiscovery };
