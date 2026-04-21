const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SCHEMA_PATH = path.resolve(__dirname, '../../schemas/inbox-message-v1.json');

const REQUIRED_FIELDS = [
  'schema_version', 'task_id', 'idempotency_key', 'from', 'to',
  'type', 'task_kind', 'priority', 'subject', 'body',
  'timestamp', 'requires_action', 'payload', 'execution',
  'lease', 'retry', 'evidence', 'heartbeat'
];

const ENUM_CONSTRAINTS = {
  to: ['archivist', 'library', 'swarmmind', 'kernel-lane'],
  type: ['task', 'response', 'heartbeat', 'escalation', 'handoff'],
  task_kind: ['proposal', 'review', 'amendment', 'ratification'],
  priority: ['P0', 'P1', 'P2', 'P3'],
  'payload.mode': ['inline', 'path', 'chunked'],
  'execution.mode': ['manual', 'session_task', 'watcher'],
  'execution.engine': ['kilo', 'opencode', 'other'],
  'execution.actor': ['lane', 'subagent'],
  'heartbeat.status': ['pending', 'in_progress', 'done', 'failed', 'escalated', 'timed_out'],
};

const TYPE_CHECKS = {
  schema_version: 'string',
  task_id: 'string',
  idempotency_key: 'string',
  from: 'string',
  to: 'string',
  type: 'string',
  task_kind: 'string',
  priority: 'string',
  subject: 'string',
  body: 'string',
  timestamp: 'string',
  requires_action: 'boolean',
  payload: 'object',
  execution: 'object',
  lease: 'object',
  retry: 'object',
  evidence: 'object',
  heartbeat: 'object',
};

const ISO8601_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

function getTypeName(val) {
  if (val === null) return 'null';
  if (Array.isArray(val)) return 'array';
  return typeof val;
}

function getNestedValue(obj, dottedKey) {
  return dottedKey.split('.').reduce((o, k) => o && o[k], obj);
}

/**
 * Validate a message against the inbox message v1.0 schema.
 * Returns { valid: boolean, errors: string[] }
 */
function validate(message) {
  const errors = [];

  if (!message || typeof message !== 'object' || Array.isArray(message)) {
    return { valid: false, errors: ['Message must be a non-null object'] };
  }

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!(field in message)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Type checks
  for (const [field, expectedType] of Object.entries(TYPE_CHECKS)) {
    if (!(field in message)) continue; // already reported as missing
    const val = message[field];
    const actualType = getTypeName(val);
    if (actualType !== expectedType) {
      errors.push(`Field "${field}" must be ${expectedType}, got ${actualType}`);
    }
  }

  // Enum checks
  for (const [dottedKey, allowedValues] of Object.entries(ENUM_CONSTRAINTS)) {
    const val = getNestedValue(message, dottedKey);
    if (val !== undefined && val !== null && !allowedValues.includes(val)) {
      errors.push(`Field "${dottedKey}" value "${val}" not in allowed values: ${allowedValues.join(', ')}`);
    }
  }

  // Idempotency key format (SHA-256 hex)
  if (message.idempotency_key && typeof message.idempotency_key === 'string') {
    if (!SHA256_PATTERN.test(message.idempotency_key)) {
      errors.push('idempotency_key must be 64 lowercase hex characters (SHA-256)');
    }
  }

  // Timestamp format (ISO-8601)
  if (message.timestamp && typeof message.timestamp === 'string') {
    if (!ISO8601_PATTERN.test(message.timestamp)) {
      errors.push('timestamp must be ISO-8601 format');
    }
  }

  // Nested object structure checks
  if (message.payload && typeof message.payload === 'object') {
    if (!('mode' in message.payload)) {
      errors.push('payload.mode is required');
    }
  }

  if (message.execution && typeof message.execution === 'object') {
    for (const reqField of ['mode', 'engine', 'actor']) {
      if (!(reqField in message.execution)) {
        errors.push(`execution.${reqField} is required`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate and throw on invalid messages.
 */
function validateAndThrow(message) {
  const result = validate(message);
  if (!result.valid) {
    throw new Error('Schema validation failed:\n' + result.errors.join('\n'));
  }
  return result;
}

/**
 * Compute deterministic idempotency key from task_id + from + to + subject.
 */
function computeIdempotencyKey({ task_id, from, to, subject }) {
  return crypto.createHash('sha256')
    .update(`${task_id}${from}${to}${subject}`)
    .digest('hex');
}

/**
 * Create a schema-compliant message from a partial template.
 * Fills in defaults for missing fields.
 */
function createMessage(template = {}) {
  const now = new Date().toISOString();
  const defaults = {
    schema_version: '1.0',
    task_id: template.task_id || `task-${Date.now()}`,
    idempotency_key: '',
    from: template.from || 'library',
    to: template.to || 'archivist',
    type: template.type || 'task',
    task_kind: template.task_kind || 'review',
    priority: template.priority || 'P2',
    subject: template.subject || '',
    body: template.body || '',
    timestamp: now,
    requires_action: template.requires_action !== undefined ? template.requires_action : true,
    payload: {
      mode: 'inline',
      path: null,
      chunk: { index: 0, count: 1, group_id: null },
      ...template.payload,
    },
    execution: {
      mode: 'session_task',
      engine: 'kilo',
      actor: 'lane',
      session_id: null,
      ...template.execution,
    },
    lease: {
      owner: null,
      acquired_at: null,
      expires_at: null,
      renew_count: 0,
      max_renewals: 3,
      ...template.lease,
    },
    retry: {
      attempt: 1,
      max_attempts: 3,
      last_error: null,
      last_attempt_at: null,
      ...template.retry,
    },
    evidence: {
      required: true,
      evidence_path: null,
      verified: false,
      verified_by: null,
      verified_at: null,
      ...template.evidence,
    },
    heartbeat: {
      interval_seconds: 300,
      last_heartbeat_at: null,
      timeout_seconds: 900,
      status: 'pending',
      ...template.heartbeat,
    },
  };

  const message = { ...defaults, ...template };

  // Always recompute idempotency_key if not explicitly provided
  if (!template.idempotency_key) {
    message.idempotency_key = computeIdempotencyKey(message);
  }

  return message;
}

/**
 * Load the JSON schema definition file.
 */
function loadSchema() {
  try {
    return JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf-8'));
  } catch (err) {
    return null;
  }
}

module.exports = {
  validate,
  validateAndThrow,
  createMessage,
  computeIdempotencyKey,
  loadSchema,
  REQUIRED_FIELDS,
  ENUM_CONSTRAINTS,
};
