/**
 * QuarantineManager – Library side helper for tracking artefacts that have
 * failed verification and have been handed off to the Archivist orchestrator.
 *
 * The SwarmMind team recommends a hybrid approach: an in‑memory `Map` for fast
 * lookup combined with an append‑only JSON log file for durability across restarts.
 *
 * Each entry tracks:
 *   - the original item (queue item or continuity artifact)
 *   - the failure reason reported to Archivist
 *   - the current retry count (starts at 1)
 *   - timestamps for the first quarantine and the most recent retry attempt
 *   - the `nextRetryIn` value (ms) supplied by Archivist, if any
 */
const fs = require('fs');
const path = require('path');

// Default location for the quarantine log – sibling of the library's logs folder.
const DEFAULT_QUARANTINE_LOG_PATH = path.resolve(__dirname, '../../logs/quarantine.log');

class QuarantineManager {
  /**
   * @param {Object} [options]
   * @param {string} [options.logPath] – absolute path to the append‑only log file.
   */
  constructor(options = {}) {
    this.quarantinedItems = new Map(); // Map<itemId, QuarantineEntry>
    this.logPath = options.logPath || DEFAULT_QUARANTINE_LOG_PATH;
    // Ensure the directory exists – fire‑and‑forget, errors are logged only.
    try {
      fs.mkdirSync(path.dirname(this.logPath), { recursive: true });
    } catch (_) {}
  }

  /**
   * Derive a stable identifier for an item.
   * Preference is `item.id`; fallback to the first 16 characters of the
   * signature (if present). This mirrors the SwarmMind suggestion.
   */
  _deriveId(item) {
    if (item.id) return String(item.id);
    if (item.signature) return item.signature.slice(0, 16);
    // As a last resort use a JSON hash – simple and deterministic.
    return require('crypto').createHash('sha256').update(JSON.stringify(item)).digest('hex').slice(0, 16);
  }

  /** Persist a single quarantine event to the log file as a JSON line. */
  _logEvent(event) {
    const line = JSON.stringify(event) + '\n';
    try {
      fs.appendFileSync(this.logPath, line);
    } catch (err) {
      console.error('[QuarantineManager] Failed to write log:', err.message);
    }
  }

  /**
   * Record a quarantine entry. If the item already exists the retry count is
   * incremented and `nextRetryIn` is updated.
   *
   * @param {Object} item – the original artefact payload.
   * @param {string} reason – failure reason reported to Archivist.
   * @param {number} [nextRetryIn] – optional delay (ms) suggested by the orchestrator.
   */
  quarantine(item, reason, nextRetryIn) {
    const itemId = this._deriveId(item);
    const timestamp = new Date().toISOString();
    const existing = this.quarantinedItems.get(itemId);
    const entry = {
      item,
      reason,
      retryCount: existing ? existing.retryCount + 1 : 1,
      firstQuarantined: existing ? existing.firstQuarantined : timestamp,
      lastRetry: null,
      nextRetryIn: nextRetryIn || null
    };
    this.quarantinedItems.set(itemId, entry);

    // Emit a structured log entry for downstream observability stacks.
    this._logEvent({
      timestamp,
      event: 'QUARANTINE',
      item_id: itemId,
      lane: 'library',
      reason,
      retry_count: entry.retryCount,
      next_retry_in_ms: entry.nextRetryIn
    });
    return entry;
  }

  /** Retrieve an entry by item ID. */
  get(itemId) {
    return this.quarantinedItems.get(itemId) || null;
  }
}

module.exports = { QuarantineManager };
