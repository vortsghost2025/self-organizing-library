/**
 * Error classification according to WE4FREE Resilience Framework
 */

export function classifyError(error: {
  message?: string;
  stack?: string;
  type?: string;
  code?: string;
  category?: string;
}): {
  classification: 'detection' | 'decision' | 'handling' | 'recovery' | 'system' | 'unknown';
  action: 'retry' | 'failover' | 'degrade' | 'skip' | 'abort' | 'none';
  description: string;
} {
  const message = (error.message || '').toLowerCase();
  const type = (error.type || '').toLowerCase();
  const code = (error.code || '').toLowerCase();

  if (message.includes('timeout') || message.includes('connection refused') || 
      message.includes('network error') || message.includes('unreachable') ||
      type.includes('timeout') || type.includes('network')) {
    return { classification: 'detection', action: 'retry', description: 'Network or timeout error detected' };
  }

  if (message.includes('invalid') || message.includes('unexpected') || 
      message.includes('malformed') || message.includes('validation failed')) {
    return { classification: 'detection', action: 'degrade', description: 'Invalid or unexpected response detected' };
  }

  if (message.includes('threshold exceeded') || message.includes('performance') ||
      message.includes('slow') || code.includes('TIMEOUT')) {
    return { classification: 'detection', action: 'degrade', description: 'Performance threshold exceeded' };
  }

  if (message.includes('validation') || message.includes('assertion failed') ||
      message.includes('expect') || message.includes('should equal')) {
    return { classification: 'detection', action: 'abort', description: 'Validation or assertion failure' };
  }

  if (message.includes('dependency') || message.includes('module not found') ||
      message.includes('cannot find') || message.includes('health check failed')) {
    return { classification: 'detection', action: 'failover', description: 'Dependency or service unavailable' };
  }

  if (message.includes('retry') || message.includes('retrying') ||
      message.includes('attempt') && message.includes('of')) {
    return { classification: 'handling', action: 'retry', description: 'Retry mechanism in progress' };
  }

  if (message.includes('failover') || message.includes('fallback') ||
      message.includes('alternative') || message.includes('backup')) {
    return { classification: 'handling', action: 'failover', description: 'Failover to backup source' };
  }

  if (message.includes('cached') || message.includes('partial data') ||
      message.includes('degraded mode') || message.includes('limited functionality')) {
    return { classification: 'handling', action: 'degrade', description: 'Graceful degradation activated' };
  }

  if (message.includes('skipped') || message.includes('queued') ||
      message.includes('async') || message.includes('background')) {
    return { classification: 'handling', action: 'skip', description: 'Step skipped or queued for later' };
  }

  if (message.includes('technical difficulties') || message.includes('unavailable') ||
      message.includes('maintenance') || message.includes('down for')) {
    return { classification: 'handling', action: 'abort', description: 'Safe abort with user messaging' };
  }

  if (message.includes('logged') || message.includes('metric') ||
      message.includes('telemetry') || message.includes('monitoring')) {
    return { classification: 'observability', action: 'none', description: 'Observability event' };
  }

  if (message.includes('recovered') || message.includes('restored') ||
      message.includes('success after') || message.includes('retry succeeded')) {
    return { classification: 'recovery', action: 'none', description: 'System recovered from error' };
  }

  return { classification: 'system', action: 'abort', description: 'Unclassified system error' };
}
