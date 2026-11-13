import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

interface LatencyStats {
  totalRequests: number;
  slowRequests: number;
  averageLatencyMs: number;
  lastRecordedAt: string;
}

let totalCount = 0;
let slowCount = 0;
let totalLatencySum = 0;

export function getLatencyMetrics(): LatencyStats {
  const avg = totalCount > 0 ? Math.round(totalLatencySum / totalCount) : 0;
  return {
    totalRequests: totalCount,
    slowRequests: slowCount,
    averageLatencyMs: avg,
    lastRecordedAt: new Date().toISOString(),
  };
}

/**
 * Request Profiling & Latency Tracking Middleware
 */
export function requestProfiler(req: Request, res: Response, next: NextFunction): void {
  const startTime = process.hrtime();

  res.on("finish", () => {
    const diff = process.hrtime(startTime);
    const durationMs = Math.round((diff[0] * 1e9 + diff[1]) / 1e6);

    totalCount += 1;
    totalLatencySum += durationMs;

    // Filter out asset noise
    if (!req.path.startsWith("/api")) return;

    if (durationMs > 500) {
      slowCount += 1;
      logger.warn(`[SLOW_REQUEST] ${req.method} ${req.originalUrl} (${res.statusCode}) took ${durationMs}ms`);
    } else if (res.statusCode >= 400) {
      logger.info(`[API_CALL] ${req.method} ${req.originalUrl} (${res.statusCode}) - ${durationMs}ms`);
    }
  });

  next();
}
