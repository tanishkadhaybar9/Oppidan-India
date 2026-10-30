import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

interface CustomHttpError extends Error {
  statusCode?: number;
  status?: number;
  code?: string | number;
}

/**
 * Centralized Error Handling Middleware.
 * Catches all synchronous and asynchronous errors from routes and middleware.
 */
export function errorHandler(
  err: CustomHttpError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const path = issue.path.join(".") || "form";
      if (!formattedErrors[path]) {
        formattedErrors[path] = [];
      }
      formattedErrors[path].push(issue.message);
    }

    res.status(400).json({
      success: false,
      message: err.issues[0]?.message || "Validation failed",
      errors: formattedErrors,
    });
    return;
  }

  // Handle Known HTTP Status Errors or common code mappings
  let statusCode = err.statusCode || err.status;
  if (!statusCode) {
    if (err.code === "NOT_FOUND") statusCode = 404;
    else if (err.code === "CONFLICT") statusCode = 409;
    else if (err.code === "FORBIDDEN") statusCode = 403;
    else if (err.code === "UNAUTHORIZED") statusCode = 401;
    else statusCode = 500;
  }
  const isProduction = process.env.NODE_ENV === "production";

  // In production, mask unexpected 500 internal errors
  const message =
    statusCode === 500 && isProduction
      ? "An unexpected internal server error occurred"
      : err.message || "Internal server error";

  res.status(statusCode).json({
    success: false,
    message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
}

/**
 * 404 Not Found Middleware.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
}
