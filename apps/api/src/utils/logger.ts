/**
 * Structured Application Logger
 * Provides sanitized, structured logging with ISO timestamps, log levels,
 * and automated redaction of sensitive credentials and tokens.
 */

type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "accesstoken",
  "refreshtoken",
  "authorization",
  "cookie",
  "cookies",
  "secret",
  "jwt_secret",
  "creditcard",
  "bankaccountnumber",
]);

export function sanitizeMetadata(data: any, depth = 0): any {
  if (depth > 4 || data === null || data === undefined) return data;
  if (typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeMetadata(item, depth + 1));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = sanitizeMetadata(val, depth + 1);
    }
  }
  return sanitized;
}

function formatLog(level: LogLevel, message: string, meta?: any): string {
  const timestamp = new Date().toISOString();
  const safeMeta = meta ? JSON.stringify(sanitizeMetadata(meta)) : "";
  return `[${timestamp}] [${level}] ${message} ${safeMeta}`.trim();
}

export const logger = {
  debug(message: string, meta?: any) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(formatLog("DEBUG", message, meta));
    }
  },
  info(message: string, meta?: any) {
    console.info(formatLog("INFO", message, meta));
  },
  warn(message: string, meta?: any) {
    console.warn(formatLog("WARN", message, meta));
  },
  error(message: string, meta?: any) {
    console.error(formatLog("ERROR", message, meta));
  },
};
