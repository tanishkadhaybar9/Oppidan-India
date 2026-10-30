import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { UserRole } from "../generated/prisma/client.js";

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  companyId: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string; // UUID to correlate token
}

const JWT_ACCESS_SECRET: Secret = process.env.JWT_ACCESS_SECRET || "default_access_secret_change_me_in_env";
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";

const JWT_REFRESH_SECRET: Secret = process.env.JWT_REFRESH_SECRET || "default_refresh_secret_change_me_in_env";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

/**
 * Generate a short-lived Access Token.
 */
export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);
}

/**
 * Generate a Refresh Token.
 */
export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);
}

/**
 * Verify an Access Token and return its payload.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, JWT_ACCESS_SECRET) as unknown as AccessTokenPayload;
}

/**
 * Verify a Refresh Token and return its payload.
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as unknown as RefreshTokenPayload;
}

/**
 * Hash a refresh token using SHA-256 for secure database storage.
 * Plain refresh tokens are never stored in the database.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
