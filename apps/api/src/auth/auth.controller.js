import { AuthService } from "./auth.service.js";
import { registerSchema, loginSchema } from "./auth.validation.js";
const REFRESH_COOKIE_NAME = "refreshToken";
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
function getCookieOptions() {
    const isProduction = process.env.NODE_ENV === "production";
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
        path: "/api/auth",
        maxAge: COOKIE_MAX_AGE_MS,
    };
}
export class AuthController {
    /**
     * Register a new company and initial OWNER account.
     */
    static async register(req, res, next) {
        try {
            const validatedData = registerSchema.parse(req.body);
            const result = await AuthService.register(validatedData);
            // Store refresh token in secure HttpOnly cookie
            res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getCookieOptions());
            res.status(201).json({
                success: true,
                message: "Company and Owner account created successfully",
                data: {
                    user: result.user,
                    accessToken: result.accessToken,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Log in an existing user.
     */
    static async login(req, res, next) {
        try {
            const validatedData = loginSchema.parse(req.body);
            const result = await AuthService.login(validatedData);
            // Store refresh token in secure HttpOnly cookie
            res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getCookieOptions());
            res.status(200).json({
                success: true,
                message: "Logged in successfully",
                data: {
                    user: result.user,
                    accessToken: result.accessToken,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Refresh session and rotate refresh token.
     */
    static async refresh(req, res, next) {
        try {
            const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
            if (!rawRefreshToken) {
                res.status(401).json({
                    success: false,
                    message: "No active session found. Please sign in.",
                });
                return;
            }
            const result = await AuthService.refreshSession(rawRefreshToken);
            // Set new rotated refresh token in cookie
            res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getCookieOptions());
            res.status(200).json({
                success: true,
                message: "Session refreshed successfully",
                data: {
                    user: result.user,
                    accessToken: result.accessToken,
                },
            });
        }
        catch (error) {
            // Clear cookie on failure
            res.clearCookie(REFRESH_COOKIE_NAME, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
                path: "/api/auth",
            });
            next(error);
        }
    }
    /**
     * Logout user, revoke refresh token, and clear cookies.
     */
    static async logout(req, res, next) {
        try {
            const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
            if (rawRefreshToken) {
                await AuthService.logout(rawRefreshToken);
            }
            res.clearCookie(REFRESH_COOKIE_NAME, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
                path: "/api/auth",
            });
            res.status(200).json({
                success: true,
                message: "Logged out successfully",
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get current authenticated user profile.
     */
    static async me(req, res, next) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
                return;
            }
            const user = await AuthService.getCurrentUser(req.user.id);
            res.status(200).json({
                success: true,
                message: "Current user profile retrieved",
                data: {
                    user,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
//# sourceMappingURL=auth.controller.js.map