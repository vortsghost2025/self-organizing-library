const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SCHEMA_PATH = path.resolve(__dirname, '../../schemas/inbox-message-v1.json');

// v1.3: task_kind optional for non-task types; conditional in validate()
const REQUIRED_FIELDS_V13 = [
  'schema_version', 'task_id', 'idempotency_key', 'from', 'to',
  'type', 'priority', 'subject', 'body',
  'timestamp', 'requires_action', 'payload', 'execution',
  'lease', 'retry', 'evidence', 'evidence_exchange', 'heartbeat',
  'signature', 'key_id'
];

// v1.2: task_kind always required; signature/key_id required
const REQUIRED_FIELDS_V12 = [
  'schema_version', 'task_id', 'idempotency_key', 'from', 'to',
  'type', 'task_kind', 'priority', 'subject', 'body',
  'timestamp', 'requires_action', 'payload', 'execution',
  'lease', 'retry', 'evidence', 'heartbeat',
  'signature', 'key_id'
];

// v1.1 and earlier: no signature/key_id/evidence_exchange required
const REQUIRED_FIELDS_V11 = [
  'schema_version', 'task_id', 'idempotency_key', 'from', 'to',
  'type', 'task_kind', 'priority', 'subject', 'body',
  'timestamp', 'requires_action', 'payload', 'execution',
  'lease', 'retry', 'evidence', 'heartbeat'
];

function getRequiredFields(schemaVersion) {
  if (schemaVersion === '1.3') return REQUIRED_FIELDS_V13;
  if (schemaVersion === '1.2') return REQUIRED_FIELDS_V12;
  return REQUIRED_FIELDS_V11;
}

// Backward-compatible alias
const REQUIRED_FIELDS = REQUIRED_FIELDS_V13;

const ENUM_CONSTRAINTS = {
  schema_version: ['1.0', '1.1', '1.2', '1.3'],
  to: ['archivist', 'library', 'swarmmind', 'kernel'],
  type: ['task', 'response', 'heartbeat', 'escalation', 'handoff', 'ack', 'alert'],
  task_kind: ['proposal', 'review', 'amendment', 'ratification'],
  priority: ['P0', 'P1', 'P2', 'P3'],
  'payload.mode': ['inline', 'path', 'chunked'],
  'payload.compression': ['none', 'gzip'],
  'execution.mode': ['manual', 'session_task', 'watcher'],
  'execution.engine': ['kilo', 'opencode', 'other'],
  'execution.actor': ['lane', 'subagent', 'watcher'],
  'heartbeat.status': ['pending', 'in_progress', 'done', 'failed', 'escalated', 'timed_out'],
  'evidence_exchange.artifact_type': ['benchmark', 'profile', 'release', 'log'],
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
  evidence_exchange: 'object',
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

  // Check required fields (version-aware)
  const schemaVersion = message.schema_version || '1.1';
  const requiredFields = getRequiredFields(schemaVersion);
  for (const field of requiredFields) {
    if (!(field in message)) {
      errors.push(`Missing required field (v${schemaVersion}): ${field}`);
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

  // Idempotency key – v1.3 relaxes to any non-empty string.
  if (message.idempotency_key && typeof message.idempotency_key === 'string') {
    if (message.idempotency_key.length === 0) {
      errors.push('idempotency_key must be a non-empty string');
    }
    // No pattern enforcement – allows descriptive keys.
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

  // v1.3: signature/key_id required via REQUIRED_FIELDS_V13 (checked above)
  // v1.2: signature/key_id required via REQUIRED_FIELDS_V12 (checked above)

  // v1.3: task_kind conditionally required only for task/response/escalation/handoff
  if (['task', 'response', 'escalation', 'handoff'].includes(message.type)) {
    if (!('task_kind' in message)) {
      errors.push('task_kind is required for task/response/escalation/handoff messages');
    }
  }

  // v1.3: evidence_exchange required when evidence.required is true for response/ack
  if (message.evidence && message.evidence.required === true) {
    if (['response', 'ack'].includes(message.type)) {
      if (!('evidence_exchange' in message)) {
        errors.push('evidence_exchange is required when evidence.required is true for response/ack types');
      } else {
        const exch = message.evidence_exchange;
        if (!exch.artifact_path || !exch.artifact_type || !exch.delivered_at) {
          errors.push('evidence_exchange must have artifact_path, artifact_type, and delivered_at');
        }
        if (!['benchmark', 'profile', 'release', 'log'].includes(exch.artifact_type)) {
          errors.push('evidence_exchange.artifact_type must be benchmark|profile|release|log');
        }
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
    schema_version: '1.3',
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
      compression: 'none',
      path: null,
      chunk: { index: 0, count: 1, group_id: null },
      ...template.payload,
    },
    execution: {
      mode: 'session_task',
      engine: 'kilo',
      actor: 'lane',
      session_id: null,
      parent_id: null,
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
    evidence_exchange: {
      artifact_path: null,
      artifact_type: null,
      delivered_at: null,
      ...template.evidence_exchange,
    },
    heartbeat: {
      interval_seconds: 300,
      last_heartbeat_at: null,
      timeout_seconds: 900,
      status: 'pending',
      ...template.heartbeat,
    },
    watcher: {
      enabled: false,
      poll_seconds: 60,
      p0_fast_path: true,
      max_concurrent: 1,
      heartbeat_required: true,
      stale_after_seconds: 300,
      backoff: {
        initial_seconds: 60,
        max_seconds: 300,
        multiplier: 2,
      },
      ...template.watcher,
    },
    delivery_verification: {
      verified: false,
      verified_at: null,
      retries: 0,
    },
  };

  const message = { ...defaults, ...template };

  // Recompute idempotency_key if not explicitly provided
  if (!template.idempotency_key) {
    message.idempotency_key = computeIdempotencyKey(message);
  }

  // Validate the constructed message before returning
  const validationResult = validate(message);
  if (!validationResult.valid) {
    console.error('[SchemaValidator] createMessage: constructed message fails validation:');
    for (const err of validationResult.errors) {
      console.error(` - ${err}`);
    }
    message._validation_errors = validationResult.errors;
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

/**
 * Write a message to a canonical inbox path with delivery verification.
 *
 * Bug 1 fix: validates schema BEFORE writing. delivery_verification.verified
 * means BOTH "schema is valid" AND "file landed on disk". Invalid messages
 * are still written (for audit trail) but stamped verified=false with
 * validation_errors attached.
 *
 * Identity enforcement: If signingOptions is provided, the message is signed
 * with JWS (RS256) before writing. If not provided, a warning is emitted
 * because the receiving lane's IdentityEnforcer (mode='enforce') will reject
 * unsigned messages. The caller MUST provide { signer, privateKey, keyId }
 * to produce a valid signed message.
 *
 * @param {object} message - Inbox message to deliver
 * @param {string} canonicalPath - Target directory path
 * @param {object} [signingOptions] - Optional signing configuration
 * @param {object} [signingOptions.signer] - Signer instance (src/attestation/Signer.js)
 * @param {string|Buffer} [signingOptions.privateKey] - RSA private key for signing
 * @param {string} [signingOptions.keyId] - Key identifier for trust store lookup
 *
 * Returns { delivered: boolean, schema_valid: boolean, verified: boolean,
 * path: string, error: string|null, validation_errors: string[]|null,
 * signed: boolean }
 */
function deliverMessage(message, canonicalPath, signingOptions) {
  // VALIDATE BEFORE WRITE
  const validationResult = validate(message);
  const schemaValid = validationResult.valid;

  // SIGN BEFORE WRITE — Identity enforcement: outbound messages MUST be signed.
  let signedMessage = message;
  let wasSigned = false;

  if (signingOptions && signingOptions.signer && signingOptions.privateKey && signingOptions.keyId) {
    try {
      signedMessage = signingOptions.signer.signInboxMessage(message, signingOptions.privateKey, signingOptions.keyId);
      wasSigned = true;
    } catch (signErr) {
      console.error(`[SchemaValidator] deliverMessage: SIGNING FAILED — ${signErr.message}`);
      // Fail-closed: do NOT silently deliver unsigned. Return error.
      return {
        delivered: false,
        schema_valid: schemaValid,
        verified: false,
        path: null,
        error: `Signing failed: ${signErr.message}`,
        validation_errors: schemaValid ? null : validationResult.errors,
        signed: false
      };
    }
  } else {
    // Fail-closed: no signing options provided, message will fail outbox write guard below
    console.error('[SchemaValidator] deliverMessage: no signingOptions provided — message will fail outbox write guard');
  }
    // Enforce outbox write guard with error handling    try {      const { guardWrite } = require("../scripts/outbox-write-guard");      guardWrite(signedMessage, canonicalPath, `msg-${Date.now()}.json`);    } catch (gErr) {      console.error(`[SchemaValidator] deliverMessage: OUTBOX_WRITE_BLOCKED — ${gErr.message}`);      return {        delivered: false,        schema_valid: schemaValid,        verified: false,        path: null,        error: gErr.message,        validation_errors: schemaValid ? null : validationResult.errors,        signed: wasSigned      };    }

  // Outbox write guard: refuse to write unsigned messages
  if (!signedMessage.signature || typeof signedMessage.signature !== 'string' || signedMessage.signature.length < 10) {
    console.error('[SchemaValidator] deliverMessage: OUTBOX_WRITE_BLOCKED — missing or invalid signature');
    return {
      delivered: false,
      schema_valid: schemaValid,
      verified: false,
      path: null,
      error: 'OUTBOX_WRITE_BLOCKED: missing or invalid signature — unsigned messages cannot be delivered',
      validation_errors: schemaValid ? null : validationResult.errors,
      signed: wasSigned
    };
  }
  if (!signedMessage.key_id || typeof signedMessage.key_id !== 'string' || signedMessage.key_id.length < 16) {
    console.error('[SchemaValidator] deliverMessage: OUTBOX_WRITE_BLOCKED — missing or invalid key_id');
    return {
      delivered: false,
      schema_valid: schemaValid,
      verified: false,
      path: null,
      error: 'OUTBOX_WRITE_BLOCKED: missing or invalid key_id — unsigned messages cannot be delivered',
      validation_errors: schemaValid ? null : validationResult.errors,
      signed: wasSigned
    };
  }

  const filename = 
    `${signedMessage.task_id || signedMessage.message_id || `msg-${Date.now()}`}.json`;
  const fullPath = path.join(canonicalPath, filename);

  try {
    // Ensure directory exists
    fs.mkdirSync(canonicalPath, { recursive: true });

    // Pre-stamp delivery_verification with schema result
    if (signedMessage.delivery_verification) {
      signedMessage.delivery_verification.verified = false; // will be set to true only if both checks pass
      signedMessage.delivery_verification.validation_errors = schemaValid ? null : validationResult.errors;
    }

    // Write message — even if schema-invalid, for audit trail
    fs.writeFileSync(fullPath, JSON.stringify(signedMessage, null, 2), 'utf8');
    const exists = fs.existsSync(fullPath);

    if (exists) {
      // delivery_verification.verified = true ONLY if both schema valid AND file landed
      if (signedMessage.delivery_verification) {
        signedMessage.delivery_verification.verified = schemaValid;
        signedMessage.delivery_verification.verified_at = schemaValid ? new Date().toISOString() : null;

        // Clean up validation_errors if valid (no errors to report)
        if (schemaValid) {
          delete signedMessage.delivery_verification.validation_errors;
        }
      }

      // Re-write with updated verification stamps
      fs.writeFileSync(fullPath, JSON.stringify(signedMessage, null, 2), 'utf8');
    }

    if (!schemaValid) {
      console.warn(`[SchemaValidator] deliverMessage: WARNING — message written but schema-invalid:`);
      for (const err of validationResult.errors) {
        console.warn(` - ${err}`);
      }
    }

    return {
      delivered: exists,
      schema_valid: schemaValid,
      verified: schemaValid && exists,
      path: fullPath,
      error: exists ? null : 'File not found after write',
      validation_errors: schemaValid ? null : validationResult.errors,
      signed: wasSigned
    };
  } catch (err) {
    return {
      delivered: false,
      schema_valid: schemaValid,
      verified: false,
      path: fullPath,
      error: err.message,
      validation_errors: schemaValid ? null : validationResult.errors,
      signed: wasSigned
    };
  }
}

/**
 * Get canonical inbox path for a target lane.
 */
function getCanonicalPath(lane) {
  const paths = {
    archivist: 'S:/Archivist-Agent/lanes/archivist/inbox/',
    library: 'S:/self-organizing-library/lanes/library/inbox/',
    swarmmind: 'S:/SwarmMind/lanes/swarmmind/inbox/',
    kernel: 'S:/kernel-lane/lanes/kernel/inbox/',
  };
  return paths[lane] || null;
}

module.exports = {
  validate,
  validateAndThrow,
  createMessage,
  computeIdempotencyKey,
  loadSchema,
  deliverMessage,
  getCanonicalPath,
  REQUIRED_FIELDS,
  REQUIRED_FIELDS_V11,
  REQUIRED_FIELDS_V12,
  REQUIRED_FIELDS_V13,
  getRequiredFields,
  ENUM_CONSTRAINTS,
};
