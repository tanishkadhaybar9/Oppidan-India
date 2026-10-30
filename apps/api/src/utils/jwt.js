import jwt, {} from "jsonwebtoken";
import crypto from "crypto";
import { UserRole } from "../generated/prisma/client.js";
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "default_access_secret_change_me_in_env";
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "default_refresh_secret_change_me_in_env";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
/**
 * Generate a short-lived Access Token.
 */
export function generateAccessToken(payload) {
    return jwt.sign(payload, JWT_ACCESS_SECRET, {
        expiresIn: JWT_ACCESS_EXPIRES_IN,
    });
}
/**
 * Generate a Refresh Token.
 */
export function generateRefreshToken(payload) {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
    });
}
/**
 * Verify an Access Token and return its payload.
 */
export function verifyAccessToken(token) {
    return jwt.verify(token, JWT_ACCESS_SECRET);
}
/**
 * Verify a Refresh Token and return its payload.
 */
export function verifyRefreshToken(token) {
    return jwt.verify(token, JWT_REFRESH_SECRET);
}
/**
 * Hash a refresh token using SHA-256 for secure database storage.
 * Plain refresh tokens are never stored in the database.
 */
export function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}
//# sourceMappingURL=jwt.js.map