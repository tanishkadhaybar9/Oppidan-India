import { UserRole } from "../generated/prisma/client.js";
import { Permission, hasPermission } from "../permissions/permissions.js";
/**
 * Role-based Authorization Middleware.
 * Denies access by default unless req.user role matches one of allowedRoles.
 *
 * @param allowedRoles List of roles permitted to access the endpoint
 */
export function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: `Forbidden: Access requires one of [${allowedRoles.join(", ")}] roles. Your role is ${req.user.role}.`,
            });
            return;
        }
        next();
    };
}
/**
 * Permission-based Authorization Middleware.
 * Denies access by default unless req.user has the required permission.
 *
 * @param requiredPermission The specific action permission required
 */
export function requirePermission(requiredPermission) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required. Please sign in.",
            });
            return;
        }
        if (!hasPermission(req.user.role, requiredPermission)) {
            res.status(403).json({
                success: false,
                message: `Forbidden: You do not have permission (${requiredPermission}) to perform this action.`,
            });
            return;
        }
        next();
    };
}
/**
 * Helper to ensure an operation is strictly scoped to the user's company.
 * Prevents cross-company data access.
 */
export function enforceCompanyScope(req, res, targetCompanyId, next) {
    if (!req.user || req.user.companyId !== targetCompanyId) {
        res.status(403).json({
            success: false,
            message: "Forbidden: Cross-company access is strictly prohibited.",
        });
        return;
    }
    next();
}
//# sourceMappingURL=authorize.js.map