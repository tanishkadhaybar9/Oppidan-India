import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

/**
 * Strict rate limiter for sensitive authentication endpoints (Login & Register).
 * Allows 30 requests per 15 minutes per IP.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req: Request) => req.method === "OPTIONS",
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: "Too many authentication attempts. Please try again after 15 minutes.",
      retryAfter: 900,
    });
  },
});

/**
 * General API rate limiter.
 * Allows 1500 requests per 15 minutes per IP (~100 requests/minute),
 * accommodating multi-tab navigation, dashboards, and background polls
 * while safely preventing denial-of-service abuse.
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => req.path === "/api/health" || req.path === "/health" || req.method === "OPTIONS",
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: "Too many requests. Please slow down.",
      retryAfter: 60,
    });
  },
});

