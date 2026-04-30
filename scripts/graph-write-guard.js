#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const VALID_DOMAINS = new Set(['paper', 'code', 'data']);
const VALID_ADJUDICATION_STATUSES = new Set(['proven_conflict', 'proven_spurious', 'needs_lane_review']);

// Graph node/edge mutations that require adjudication
const MUTATION_FIELDS = ['status', 'contradictionCount'];
const MUTATION_EDGE_TYPES = ['contradicts', 'CONTRADICTS'];

// Adjudication payload required fields
const REQUIRED_ADJUDICATION_FIELDS = ['edge_id', 'domain', 'status', 'owner'];
const REQUIRED_EVIDENCE_FIELDS = ['source', 'target'];

/**
 * Generate a persistent edge_id for a contradiction edge.
 * Format: sha256(source+target+type)[:16]
 */
function generateEdgeId(source, target, edgeType = 'contradicts') {
  const hash = crypto.createHash('sha256')
    .update(`${source}::${target}::${edgeType}`)
    .digest('hex');
  return hash.slice(0, 16);
}

/**
 * Parse adjudication payload and validate all required fields.
 * Returns { valid: boolean, errors: string[], parsed: object }
 */
function validateAdjudicationPayload(doc) {
  const errors = [];
  const parsed = {};

  if (!doc || typeof doc !== 'object') {
    return { valid: false, errors: ['adjudication_payload_invalid_or_missing'], parsed: {} };
  }

  // Required: edge_id (persistent identifier for the contradiction edge)
  const edgeId = doc.edge_id || doc.edgeId || null;
  if (!edgeId || typeof edgeId !== 'string' || edgeId.length < 8) {
    errors.push('MISSING_OR_INVALID_EDGE_ID');
  } else {
    parsed.edge_id = edgeId;
  }

  // Required: domain (paper | code | data)
  const domain = doc.domain ? String(doc.domain).toLowerCase() : null;
  if (!domain || !VALID_DOMAINS.has(domain)) {
    errors.push(`INVALID_DOMAIN_must_be_one_of_${[...VALID_DOMAINS].join('|')}`);
  } else {
    parsed.domain = domain;
  }

  // Required: status (adjudication result)
  const status = doc.adjudication_status || doc.status || null;
  if (!status || !VALID_ADJUDICATION_STATUSES.has(String(status).toLowerCase())) {
    errors.push(`INVALID_STATUS_must_be_one_of_${[...VALID_ADJUDICATION_STATUSES].join('|')}`);
  } else {
    parsed.status = String(status).toLowerCase();
  }

  // Required: owner (who is responsible for next action)
  const owner = doc.next_action_owner || doc.owner || null;
  if (!owner || typeof owner !== 'string' || owner.length < 2) {
    errors.push('MISSING_OR_INVALID_OWNER');
  } else {
    parsed.owner = owner;
  }

  // Required: evidence refs (both sides)
  const evidence = doc.evidence || {};
  const sourceRef = doc.evidence_source || doc.source_evidence || evidence.source || null;
  const targetRef = doc.evidence_target || doc.target_evidence || evidence.target || null;

  if (!sourceRef || typeof sourceRef !== 'string' || sourceRef.length < 3) {
    errors.push('MISSING_OR_INVALID_EVIDENCE_SOURCE');
  } else {
    parsed.evidence_source = sourceRef;
  }

  if (!targetRef || typeof targetRef !== 'string' || targetRef.length < 3) {
    errors.push('MISSING_OR_INVALID_EVIDENCE_TARGET');
  } else {
    parsed.evidence_target = targetRef;
  }

  // Optional but validated: timestamp
  if (doc.timestamp) {
    const ts = Date.parse(doc.timestamp);
    if (!isNaN(ts)) {
      parsed.timestamp = doc.timestamp;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    parsed
  };
}

/**
 * Load and parse JSON file safely.
 */
function loadJson(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return null;
  }
}

/**
 * Extract command-line argument value.
 */
function getArgValue(args, flag) {
  const i = args.indexOf(flag);
  if (i >= 0 && args[i + 1]) return args[i + 1];
  return null;
}

/**
 * Build a map of nodes by ID for quick lookup.
 */
function nodeMap(snapshotObj) {
  const m = new Map();
  const nodes = snapshotObj && Array.isArray(snapshotObj.nodes) ? snapshotObj.nodes : [];
  for (const n of nodes) {
    if (n && n.id) m.set(n.id, n);
  }
  return m;
}

/**
 * Build a set of contradiction edge keys: "sourceId->targetId"
 */
function contradictionEdgeSet(snapshotObj) {
  const set = new Set();
  const edges = snapshotObj && Array.isArray(snapshotObj.edges) ? snapshotObj.edges : [];
  for (const e of edges) {
    const auth = String(e.authority || e.type || '').toUpperCase();
    if (MUTATION_EDGE_TYPES.includes(auth)) {
      set.add(`${e.source}->${e.target}`);
    }
  }
  return set;
}

/**
 * Detect mutations in graph snapshot that require adjudication.
 * Returns { changed: boolean, mutations: array, detected_status: string }
 *
 * detected_status is separate from adjudicated status - this is what the
 * automated system detected, before any human review.
 */
function detectGraphMutations(beforeObj, afterObj) {
  if (!beforeObj || !afterObj) {
    return { changed: false, mutations: [], detected_status: 'no_prior_file' };
  }

  const beforeNodes = nodeMap(beforeObj);
  const afterNodes = nodeMap(afterObj);
  const mutations = [];

  // Check each node for mutations to protected fields
  for (const [id, afterNode] of afterNodes) {
    const beforeNode = beforeNodes.get(id);
    if (!beforeNode) continue;

    // Check status mutation
    const beforeStatus = beforeNode.status || null;
    const afterStatus = afterNode.status || null;
    if (beforeStatus !== afterStatus) {
      mutations.push({
        type: 'node_field_change',
        node_id: id,
        field: 'status',
        before: beforeStatus,
        after: afterStatus
      });
    }

    // Check contradictionCount mutation
    const beforeCC = beforeNode.contradictionCount || 0;
    const afterCC = afterNode.contradictionCount || 0;
    if (beforeCC !== afterCC) {
      mutations.push({
        type: 'node_field_change',
        node_id: id,
        field: 'contradictionCount',
        before: beforeCC,
        after: afterCC
      });
    }
  }

  // Check for contradiction edge changes
  const bEdges = contradictionEdgeSet(beforeObj);
  const aEdges = contradictionEdgeSet(afterObj);

  // Find added edges
  for (const edgeKey of aEdges) {
    if (!bEdges.has(edgeKey)) {
      const [source, target] = edgeKey.split('->');
      mutations.push({
        type: 'edge_add',
        edge_type: 'contradicts',
        source,
        target,
        edge_id: generateEdgeId(source, target, 'contradicts')
      });
    }
  }

  // Find removed edges
  for (const edgeKey of bEdges) {
    if (!aEdges.has(edgeKey)) {
      const [source, target] = edgeKey.split('->');
      mutations.push({
        type: 'edge_remove',
        edge_type: 'contradicts',
        source,
        target,
        edge_id: generateEdgeId(source, target, 'contradicts')
      });
    }
  }

  const detected_status = mutations.length > 0 ? 'DETECTED_MUTATION' : 'NO_MUTATION';

  return {
    changed: mutations.length > 0,
    mutations,
    detected_status
  };
}

/**
 * For site-index mode, detect structural changes that might indicate conflicts.
 */
function detectIndexChanges(beforeObj, afterObj) {
  if (!beforeObj || !afterObj) {
    return { changed: false, mutations: [], detected_status: 'no_prior_file' };
  }

  // For index mode, we check entry counts and cross-reference structure
  const mutations = [];

  // Entry count changes are structural, not conflict-related
  const beforeCount = (beforeObj.entries || []).length;
  const afterCount = (afterObj.entries || []).length;
  if (beforeCount !== afterCount) {
    mutations.push({
      type: 'index_entry_count_change',
      before: beforeCount,
      after: afterCount
    });
  }

  // Cross-reference changes
  const beforeRefs = (beforeObj.cross_references || []).length;
  const afterRefs = (afterObj.cross_references || []).length;
  if (beforeRefs !== afterRefs) {
    mutations.push({
      type: 'index_cross_ref_change',
      before: beforeRefs,
      after: afterRefs
    });
  }

  return {
    changed: mutations.length > 0,
    mutations,
    detected_status: mutations.length > 0 ? 'INDEX_STRUCTURAL_CHANGE' : 'NO_MUTATION'
  };
}

/**
 * Main guard function - enforces adjudication requirement for graph mutations.
 *
 * REJECT-BY-DEFAULT: Any mutation to protected fields without valid
 * adjudication payload will be BLOCKED.
 *
 * @param {object} options
 * @param {string} options.operation - Operation name for audit
 * @param {string} options.guardPath - Path to this guard script
 * @param {string} options.writePath - Path being written to
 * @param {object} options.beforeObject - State before mutation
 * @param {object} options.afterObject - State after mutation
 * @param {string} options.adjudicationPath - Path to adjudication JSON
 * @param {string} options.mode - 'snapshot' or 'index'
 * @param {string} options.laneRoot - Root path for audit log (optional, for signed audit)
 *
 * @returns {object} Decision with allowWrite, status, blocked_case, etc.
 */
function enforceGraphWriteGuard(options) {
  const {
    operation,
    guardPath,
    writePath,
    beforeObject,
    afterObject,
    adjudicationPath,
    mode = 'snapshot'
  } = options;

  // Detect mutations based on mode
  const detector = mode === 'index'
    ? detectIndexChanges(beforeObject, afterObject)
    : detectGraphMutations(beforeObject, afterObject);

  // No mutations detected - allow write without adjudication
  if (!detector.changed) {
    return {
      status: 'SUCCESS',
      allowWrite: true,
      guard_path: guardPath,
      write_path: writePath,
      blocked_case: 'none',
      evidence_required: false,
      bypass_notes: detector.detected_status,
      detected_status: detector.detected_status,
      adjudicated_status: null,
      mutations: [],
      guard_version: '2.0'
    };
  }

  // REJECT-BY-DEFAULT: Mutations detected but no adjudication path provided
  if (!adjudicationPath) {
    return {
      status: 'QUARANTINE',
      allowWrite: false,
      guard_path: guardPath,
      write_path: writePath,
      blocked_case: 'mutation_detected_no_adjudication_path',
      evidence_required: true,
      bypass_notes: 'REJECT-BY-DEFAULT: Adjudication required for graph mutations',
      detected_status: detector.detected_status,
      adjudicated_status: null,
      mutations: detector.mutations,
      guard_version: '2.0'
    };
  }

  // Load and validate adjudication payload
  const adjDoc = loadJson(adjudicationPath);
  const validation = validateAdjudicationPayload(adjDoc);

  // REJECT-BY-DEFAULT: Invalid or missing adjudication
  if (!validation.valid) {
    return {
      status: 'QUARANTINE',
      allowWrite: false,
      guard_path: guardPath,
      write_path: writePath,
      blocked_case: `mutation_detected_invalid_adjudication:${validation.errors.join('|')}`,
      evidence_required: true,
      bypass_notes: `REJECT-BY-DEFAULT: Invalid adjudication payload`,
      detected_status: detector.detected_status,
      adjudicated_status: null,
      mutations: detector.mutations,
      guard_version: '2.0'
    };
  }

  // Adjudication valid - allow write with tracking
  return {
    status: 'SUCCESS',
    allowWrite: true,
    guard_path: guardPath,
    write_path: writePath,
    blocked_case: 'none',
    evidence_required: false,
    bypass_notes: `adjudication_valid_edge_id:${validation.parsed.edge_id}`,
    detected_status: detector.detected_status,
    adjudicated_status: validation.parsed.status,
    adjudication: {
      edge_id: validation.parsed.edge_id,
      domain: validation.parsed.domain,
      owner: validation.parsed.owner,
      evidence_source: validation.parsed.evidence_source,
      evidence_target: validation.parsed.evidence_target
    },
    mutations: detector.mutations,
    guard_version: '2.0'
  };
}

/**
 * Generate a signed audit entry for graph mutations.
 * Includes cryptographic signature to prevent log tampering.
 */
function generateSignedAuditEntry(operation, decision, adjudicationPath) {
  const payload = {
    ts: new Date().toISOString(),
    operation,
    adjudication_path: adjudicationPath || null,
    status: decision.status,
    guard_path: decision.guard_path,
    write_path: decision.write_path,
    blocked_case: decision.blocked_case,
    evidence_required: decision.evidence_required,
    detected_status: decision.detected_status || null,
    adjudicated_status: decision.adjudicated_status || null,
    mutations: decision.mutations || [],
    guard_version: decision.guard_version || '2.0'
  };

  // Create signature over the payload
  const payloadStr = JSON.stringify(payload, Object.keys(payload).sort());
  const signature = crypto
    .createHmac('sha256', 'graph-guard-secret-' + operation)
    .update(payloadStr)
    .digest('hex');

  return {
    ...payload,
    _signature: signature,
    _sig_algorithm: 'HMAC-SHA256',
    _sig_operation: operation
  };
}

/**
 * Write audit log entry with signature for tamper detection.
 */
function writeGuardAudit(repoRoot, operation, decision, adjudicationPath) {
  const logDir = path.join(repoRoot, 'logs');
  const logPath = path.join(logDir, 'graph-write-guard.log');

  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const entry = generateSignedAuditEntry(operation, decision, adjudicationPath);
    fs.appendFileSync(logPath, JSON.stringify(entry) + '\n', 'utf8');

    // Also write a signed summary for quick verification
    const summaryPath = path.join(logDir, 'graph-write-guard-summary.log');
    const summary = {
      ts: entry.ts,
      operation,
      status: decision.status,
      detected_status: decision.detected_status,
      adjudicated_status: decision.adjudicated_status,
      allow_write: decision.allowWrite,
      blocked_case: decision.blocked_case,
      _signature: entry._signature
    };
    fs.appendFileSync(summaryPath, JSON.stringify(summary) + '\n', 'utf8');

  } catch (err) {
    // Audit failures should not block writes, but should be visible
    console.error(`[graph-write-guard] AUDIT_WRITE_FAILED: ${err.message}`);
  }
}

/**
 * Verify audit log integrity.
 */
function verifyAuditLog(repoRoot, limit = 100) {
  const logPath = path.join(repoRoot, 'logs', 'graph-write-guard.log');
  if (!fs.existsSync(logPath)) {
    return { valid: true, entries: 0, tampered: 0, errors: [] };
  }

  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').slice(-limit);
  const errors = [];
  let tampered = 0;

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line);
      if (entry._signature) {
        const { _signature, _sig_algorithm, _sig_operation, ...payload } = entry;
        const payloadStr = JSON.stringify(payload, Object.keys(payload).sort());
        const expectedSig = crypto
          .createHmac('sha256', 'graph-guard-secret-' + entry._sig_operation)
          .update(payloadStr)
          .digest('hex');

        if (_signature !== expectedSig) {
          tampered++;
          errors.push(`SIGNATURE_MISMATCH_at_${entry.ts}`);
        }
      }
    } catch (e) {
      errors.push(`PARSE_ERROR: ${e.message}`);
    }
  }

  return {
    valid: tampered === 0 && errors.length === 0,
    entries: lines.length,
    tampered,
    errors
  };
}

module.exports = {
  enforceGraphWriteGuard,
  writeGuardAudit,
  generateSignedAuditEntry,
  verifyAuditLog,
  loadJson,
  getArgValue,
  validateAdjudicationPayload,
  generateEdgeId,
  detectGraphMutations,
  detectIndexChanges,
  MUTATION_FIELDS,
  MUTATION_EDGE_TYPES,
  VALID_DOMAINS,
  VALID_ADJUDICATION_STATUSES
};