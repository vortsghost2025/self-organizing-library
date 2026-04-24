#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PROCESSED_DIR = 'S:/self-organizing-library/lanes/library/inbox/processed';
const ACTION_REQUIRED_DIR = 'S:/self-organizing-library/lanes/library/inbox/action-required';

const COMPLETION_PROOF_FIELDS = [
  'completion_artifact_path',
  'completion_message_id',
  'resolved_by_task_id',
];

const VALID_DISPOSITIONS = new Set(['completed', 'declined', 'superseded', 'expired', 'quarantined']);
const CONVERGED_STATUSES = new Set(['proven', 'approved', 'ratified', 'accepted']);

const BATCH_TERMINAL_DECISION_PREFIX = 'Obviated by convergence phases';

function hasPerMessageCompletionProof(msg) {
  if (!msg) return false;

  if (msg.completed_by && typeof msg.completed_by === 'string' && msg.completed_by.length > 0) {
    if (hasBatchStampOnly(msg) && msg.completed_by === 'archivist-agent') {
      // Batch stamp + generic completed_by = NOT per-message proof
    } else if (msg.completed_by === 'archivist-agent' && !msg.completion_artifact_path) {
      // Generic completed_by without specific artifact = NOT per-message proof
    } else if (msg.evidence && msg.evidence.verified === true && msg.evidence.verified_by === msg.completed_by) {
      return true;
    } else if (msg.completed_by !== 'archivist-agent') {
      return true;
    }
  }

  for (const field of COMPLETION_PROOF_FIELDS) {
    if (msg[field] && typeof msg[field] === 'string' && msg[field].length > 0) {
      if (field === 'completion_artifact_path' && msg[field].includes('convergence-complete.json')) {
        continue;
      }
      return true;
    }
  }

  if (msg.evidence && msg.evidence.verified === true && msg.evidence.verified_by) {
    if (!hasBatchStampOnly(msg) || msg.evidence.verified_by !== 'archivist-agent') {
      return true;
    }
  }

  if (msg.convergence_gate && msg.convergence_gate.status) {
    const status = String(msg.convergence_gate.status).toLowerCase();
    if (CONVERGED_STATUSES.has(status) && msg.convergence_gate.evidence_path) {
      return true;
    }
  }

  if (msg.disposition && VALID_DISPOSITIONS.has(String(msg.disposition).toLowerCase())) {
    if (msg.disposition_verifier || msg.disposition_evidence) {
      return true;
    }
  }

  return false;
}

function hasBatchStampOnly(msg) {
  if (!msg.terminal_decision) return false;
  return String(msg.terminal_decision).startsWith(BATCH_TERMINAL_DECISION_PREFIX);
}

function isOriginalActionRequired(msg) {
  if (msg.prior_requires_action === true) return true;
  if (msg.requires_action === true && !msg.prior_requires_action) return true;
  if (msg.priority_action === true && msg.prior_requires_action !== false) {
    if (!msg.original_priority_action || msg.original_priority_action !== true) {
      return true;
    }
  }
  return false;
}

function isGenuineActionType(msg) {
  const type = String(msg && msg.type ? msg.type : '').toLowerCase();
  return ['task', 'escalation', 'request'].includes(type);
}

function categorizeMessage(msg, filename) {
  const entry = {
    file: filename,
    id: msg.id || msg.task_id || null,
    type: msg.type || null,
    priority: msg.priority || null,
    from: msg.from || msg.from_lane || null,
    requires_action: msg.requires_action === true,
    prior_requires_action: msg.prior_requires_action === true,
    priority_action: msg.priority_action === true,
    has_batch_stamp: hasBatchStampOnly(msg),
    has_per_message_proof: hasPerMessageCompletionProof(msg),
    completed_by: msg.completed_by || null,
    terminal_decision: msg.terminal_decision ? String(msg.terminal_decision).substring(0, 80) : null,
    category: null,
    reason: null,
  };

  if (hasPerMessageCompletionProof(msg)) {
    entry.category = 'B';
    entry.reason = 'Has per-message completion proof — leave in processed/';
    return entry;
  }

  if (!isOriginalActionRequired(msg) && !isGenuineActionType(msg)) {
    entry.category = 'C';
    entry.reason = 'Never actionable — type/response/notification';
    return entry;
  }

  if (isOriginalActionRequired(msg) || isGenuineActionType(msg)) {
    if (hasBatchStampOnly(msg) && !hasPerMessageCompletionProof(msg)) {
      entry.category = 'A';
      entry.reason = 'Originally actionable, only batch terminal_decision (not per-message proof)';
      return entry;
    }

    entry.category = 'A';
    entry.reason = 'Originally actionable, no completion proof found';
    return entry;
  }

  entry.category = 'C';
  entry.reason = 'No action requirement detected';
  return entry;
}

function computeIdempotencyKey(msg, filename) {
  const parts = [
    msg.id || msg.task_id || filename,
    msg.from || msg.from_lane || '',
    msg.to || msg.to_lane || '',
    msg.subject || '',
    msg.timestamp || ''
  ];
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex').substring(0, 32);
}

function safeReadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function uniqueTargetPath(basePath) {
  if (!fs.existsSync(basePath)) return basePath;
  const dir = path.dirname(basePath);
  const ext = path.extname(basePath);
  const base = path.basename(basePath, ext);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(dir, `${base}.recovered-${stamp}${ext}`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    apply: args.includes('--apply'),
    json: args.includes('--json'),
  };
}

function main() {
  const { apply, json } = parseArgs();

  if (!fs.existsSync(PROCESSED_DIR)) {
    console.error('Processed directory not found:', PROCESSED_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(PROCESSED_DIR).filter(f => f.endsWith('.json'));
  const results = {
    mode: apply ? 'APPLY' : 'DRY_RUN',
    timestamp: new Date().toISOString(),
    processed_dir: PROCESSED_DIR,
    action_required_dir: ACTION_REQUIRED_DIR,
    total_scanned: 0,
    category_a: [],
    category_b: [],
    category_c: [],
    moved: 0,
    errors: [],
  };

  for (const filename of files) {
    const src = path.join(PROCESSED_DIR, filename);
    const msg = safeReadJson(src);
    if (!msg) {
      results.errors.push({ file: filename, error: 'PARSE_ERROR' });
      continue;
    }

    results.total_scanned++;
    const entry = categorizeMessage(msg, filename);

    if (entry.category === 'A') {
      results.category_a.push(entry);
      if (apply) {
        try {
          if (!fs.existsSync(ACTION_REQUIRED_DIR)) {
            fs.mkdirSync(ACTION_REQUIRED_DIR, { recursive: true });
          }
          const dest = uniqueTargetPath(path.join(ACTION_REQUIRED_DIR, filename));
          fs.renameSync(src, dest);
          results.moved++;
          entry.moved_to = dest;
        } catch (e) {
          results.errors.push({ file: filename, error: e.message });
        }
      }
    } else if (entry.category === 'B') {
      results.category_b.push(entry);
    } else {
      results.category_c.push(entry);
    }
  }

  if (json) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log(`\n=== Recovery Report (mode: ${results.mode}) ===`);
    console.log(`Scanned: ${results.total_scanned} files`);
    console.log(`Category A (recovery candidates): ${results.category_a.length}`);
    console.log(`Category B (completed with proof): ${results.category_b.length}`);
    console.log(`Category C (never actionable):     ${results.category_c.length}`);
    console.log(`Errors: ${results.errors.length}`);
    console.log(`Moved: ${results.moved}`);

    if (results.category_a.length > 0) {
      console.log('\n--- Category A (Recovery Candidates) ---');
      for (const entry of results.category_a) {
        console.log(`  ${entry.file}`);
        console.log(`    id=${entry.id} type=${entry.type} priority=${entry.priority} from=${entry.from}`);
        console.log(`    reason: ${entry.reason}`);
        if (entry.moved_to) console.log(`    MOVED TO: ${entry.moved_to}`);
      }
    }

    if (results.category_b.length > 0) {
      console.log('\n--- Category B (Completed with Proof — KEPT in processed/) ---');
      for (const entry of results.category_b) {
        console.log(`  ${entry.file} — ${entry.completed_by || 'convergence_gate'}`);
      }
    }

    if (results.errors.length > 0) {
      console.log('\n--- Errors ---');
      for (const e of results.errors) {
        console.log(`  ${e.file}: ${e.error}`);
      }
    }
  }

  if (!apply && results.category_a.length > 0) {
    console.log(`\n[DRY_RUN] ${results.category_a.length} files would be moved to action-required/. Run with --apply to execute.`);
    process.exit(10);
  }

  if (results.errors.length > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { categorizeMessage, hasPerMessageCompletionProof, hasBatchStampOnly, isOriginalActionRequired };
