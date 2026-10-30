import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

/**
 * Hash a plain text password using bcrypt.
 * @param password Plain text password
 * @returns Hashed password string
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== "string") {
    throw new Error("Password must be a non-empty string");
  }
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a bcrypt hash.
 * @param password Plain text password
 * @param hash Stored bcrypt hash
 * @returns boolean indicating if password matches hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) {
    return false;
  }
  return bcrypt.compare(password, hash);
}
