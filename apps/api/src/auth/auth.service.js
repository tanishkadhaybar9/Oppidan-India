import crypto from "crypto";
import { prisma } from "../lib/prisma.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, hashToken, } from "../utils/jwt.js";
import { UserRole, UserStatus, EmploymentStatus } from "../generated/prisma/client.js";
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
export class AuthService {
    /**
     * Helper to format a safe user object without sensitive fields.
     */
    static toSafeUser(user) {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            companyId: user.companyId,
            companyName: user.company?.name,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
    /**
     * Helper to create session tokens and persist the hashed refresh token.
     */
    static async createSession(user) {
        const accessToken = generateAccessToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            companyId: user.companyId,
        });
        const tokenId = crypto.randomUUID();
        const refreshToken = generateRefreshToken({
            userId: user.id,
            tokenId,
        });
        const tokenHash = hashToken(refreshToken);
        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        await prisma.refreshToken.create({
            data: {
                id: tokenId,
                tokenHash,
                userId: user.id,
                expiresAt,
                revoked: false,
            },
        });
        return {
            user,
            accessToken,
            refreshToken,
        };
    }
    /**
     * Register a new company and its initial OWNER user in an atomic transaction.
     */
    static async register(input) {
        const normalizedEmail = input.email.trim().toLowerCase();
        // Check email uniqueness
        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (existingUser) {
            const error = new Error("An account with this email address already exists");
            error.statusCode = 409;
            throw error;
        }
        // Hash password
        const passwordHash = await hashPassword(input.password);
        // Atomic transaction: Create company and initial OWNER account
        const { createdUser, company } = await prisma.$transaction(async (tx) => {
            const createdCompany = await tx.company.create({
                data: {
                    name: input.companyName.trim(),
                },
            });
            const user = await tx.user.create({
                data: {
                    name: input.name.trim(),
                    email: normalizedEmail,
                    passwordHash,
                    role: UserRole.OWNER,
                    status: UserStatus.ACTIVE,
                    companyId: createdCompany.id,
                },
            });
            // Auto-provision initial Employee record for the owner
            await tx.employee.create({
                data: {
                    companyId: createdCompany.id,
                    userId: user.id,
                    name: user.name,
                    email: user.email,
                    employeeCode: "EMP-0001",
                    role: "OWNER",
                    status: EmploymentStatus.ACTIVE,
                },
            });
            return { createdUser: user, company: createdCompany };
        });
        const safeUser = this.toSafeUser({
            ...createdUser,
            company: { name: company.name },
        });
        return this.createSession(safeUser);
    }
    /**
     * Authenticate a user via email and password.
     */
    static async login(input) {
        const normalizedEmail = input.email.trim().toLowerCase();
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            include: { company: true },
        });
        // Use generic error message to prevent account enumeration
        if (!user) {
            const error = new Error("Invalid email or password");
            error.statusCode = 401;
            throw error;
        }
        const isPasswordValid = await comparePassword(input.password, user.passwordHash);
        if (!isPasswordValid) {
            const error = new Error("Invalid email or password");
            error.statusCode = 401;
            throw error;
        }
        // Check account status
        if (user.status !== UserStatus.ACTIVE) {
            const error = new Error("Your account has been deactivated. Please contact your company administrator.");
            error.statusCode = 403;
            throw error;
        }
        const safeUser = this.toSafeUser(user);
        return this.createSession(safeUser);
    }
    /**
     * Rotate refresh token and issue a fresh access token.
     */
    static async refreshSession(rawRefreshToken) {
        if (!rawRefreshToken) {
            const error = new Error("Refresh token required");
            error.statusCode = 401;
            throw error;
        }
        let payload;
        try {
            payload = verifyRefreshToken(rawRefreshToken);
        }
        catch {
            const error = new Error("Invalid or expired session. Please sign in again.");
            error.statusCode = 401;
            throw error;
        }
        const tokenHash = hashToken(rawRefreshToken);
        const storedToken = await prisma.refreshToken.findUnique({
            where: { tokenHash },
            include: {
                user: {
                    include: { company: true },
                },
            },
        });
        // Detect reuse of revoked token (possible compromise) -> revoke all tokens for this user!
        if (!storedToken || storedToken.revoked) {
            if (storedToken && storedToken.revoked) {
                await prisma.refreshToken.updateMany({
                    where: { userId: payload.userId },
                    data: { revoked: true },
                });
            }
            const error = new Error("Invalid session. Please sign in again.");
            error.statusCode = 401;
            throw error;
        }
        // Check expiration
        if (new Date() > storedToken.expiresAt) {
            await prisma.refreshToken.update({
                where: { id: storedToken.id },
                data: { revoked: true },
            });
            const error = new Error("Session has expired. Please sign in again.");
            error.statusCode = 401;
            throw error;
        }
        const user = storedToken.user;
        if (user.status !== UserStatus.ACTIVE) {
            const error = new Error("Your account has been deactivated.");
            error.statusCode = 403;
            throw error;
        }
        // Invalidate old refresh token (Token Rotation)
        await prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: { revoked: true },
        });
        const safeUser = this.toSafeUser(user);
        return this.createSession(safeUser);
    }
    /**
     * Revoke active session on logout.
     */
    static async logout(rawRefreshToken) {
        if (!rawRefreshToken)
            return;
        try {
            const tokenHash = hashToken(rawRefreshToken);
            await prisma.refreshToken.updateMany({
                where: { tokenHash, revoked: false },
                data: { revoked: true },
            });
        }
        catch {
            // Graceful logout even if token lookup fails
        }
    }
    /**
     * Get user profile by ID.
     */
    static async getCurrentUser(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { company: true },
        });
        if (!user) {
            const error = new Error("User not found");
            error.statusCode = 404;
            throw error;
        }
        if (user.status !== UserStatus.ACTIVE) {
            const error = new Error("Account is inactive");
            error.statusCode = 403;
            throw error;
        }
        return this.toSafeUser(user);
    }
}
//# sourceMappingURL=auth.service.js.map