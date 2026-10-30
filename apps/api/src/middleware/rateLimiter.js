import rateLimit from "express-rate-limit";
/**
 * Strict rate limiter for sensitive authentication endpoints (Login & Register).
 * Allows 20 requests per 15 minutes per IP.
 */
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        success: false,
        message: "Too many authentication attempts. Please try again after 15 minutes.",
    },
});
/**
 * General API rate limiter.
 * Allows 200 requests per 15 minutes per IP.
 */
export const generalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests. Please slow down.",
    },
});
//# sourceMappingURL=rateLimiter.js.map