/**
 * AuditLogger.js - Minimal Audit Logging
 *
 * Provides structured audit logging for attestation, recovery, and
 * usage lane events. Writes to both console and audit log file.
 *
 * Exports:
 * - AuditLogger class with record(entry) method
 * - audit singleton instance
 */

const fs = require('fs');
const path = require('path');

const AUDIT_LOG_DIR = path.join(process.cwd(), 'logs');
const AUDIT_LOG_FILE = path.join(AUDIT_LOG_DIR, 'audit.log');

class AuditLogger {
  constructor(options = {}) {
    this.logFile = options.logFile || AUDIT_LOG_FILE;
    this._ensureLogDir();
  }

  _ensureLogDir() {
    const dir = path.dirname(this.logFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Record an audit entry
   * @param {object} entry
   * @param {string} entry.type - Event type (e.g., 'recovery_classified')
   * @param {string|null} entry.queueType - Queue type if applicable
   * @param {string|null} entry.itemId - Item ID if applicable
   * @param {object} entry.details - Additional details
   */
  record(entry) {
    const { type, queueType, itemId, details } = entry;
    const timestamp = new Date().toISOString();
    const logLine = JSON.stringify({ timestamp, type, queueType, itemId, details });

    // Console output
    console.log(`[${timestamp}] ${type}: ${JSON.stringify({ queueType, itemId, details })}`);

    // File output (append)
    try {
      fs.appendFileSync(this.logFile, logLine + '\n', 'utf8');
    } catch (err) {
      // Non-blocking: if file write fails, console log is still captured
      console.error(`[AuditLogger] Failed to write to ${this.logFile}: ${err.message}`);
    }
  }
}

const audit = new AuditLogger();

module.exports = { AuditLogger, audit };
