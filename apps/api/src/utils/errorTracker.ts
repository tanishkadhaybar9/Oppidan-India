/**
 * In-Memory Application Error & Event Tracker
 * Maintains a thread-safe ring buffer of recent sanitized operational errors
 * for runtime health inspection and monitoring diagnostics.
 */

export interface TrackedError {
  id: string;
  timestamp: string;
  method?: string;
  path?: string;
  statusCode: number;
  message: string;
  code?: string;
}

const MAX_HISTORY = 50;
const errorRingBuffer: TrackedError[] = [];
let totalErrorsCount = 0;
const serverStartTime = Date.now();

export function recordTrackedError(error: {
  method?: string;
  path?: string;
  statusCode: number;
  message: string;
  code?: string;
}): void {
  totalErrorsCount += 1;

  const entry: TrackedError = {
    id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    method: error.method,
    path: error.path,
    statusCode: error.statusCode,
    message: error.message.slice(0, 300), // sanitize & truncate long strings
    code: error.code,
  };

  if (errorRingBuffer.length >= MAX_HISTORY) {
    errorRingBuffer.shift();
  }
  errorRingBuffer.push(entry);
}

export function getRecentErrors(limit = 20): TrackedError[] {
  return [...errorRingBuffer].reverse().slice(0, limit);
}

export function getErrorStats() {
  const uptimeMinutes = Math.max(1, Math.round((Date.now() - serverStartTime) / 60000));
  const errorRatePerMinute = Number((totalErrorsCount / uptimeMinutes).toFixed(2));

  return {
    totalRecorded: totalErrorsCount,
    currentBufferSize: errorRingBuffer.length,
    errorRatePerMinute,
    recentErrors: getRecentErrors(10),
  };
}
