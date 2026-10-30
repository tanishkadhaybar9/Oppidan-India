import { verifyAccessToken } from "../utils/jwt.js";
import { prisma } from "../lib/prisma.js";
import { UserStatus } from "../generated/prisma/client.js";
/**
 * Authentication Middleware.
 * Validates JWT Access Token from Authorization header (or cookie),
 * verifies active status in the database, and attaches req.user.
 */
export async function authenticate(req, res, next) {
    try {
        let token;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        }
        else if (req.cookies?.accessToken) {
            token = req.cookies.accessToken;
        }
        if (!token) {
            res.status(401).json({
                success: false,
                message: "Authentication required. Please sign in.",
            });
            return;
        }
        let payload;
        try {
            payload = verifyAccessToken(token);
        }
        catch {
            res.status(401).json({
                success: false,
                message: "Invalid or expired access token.",
            });
            return;
        }
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            include: { company: true },
        });
        if (!user) {
            res.status(401).json({
                success: false,
                message: "User account no longer exists.",
            });
            return;
        }
        if (user.status !== UserStatus.ACTIVE) {
            res.status(403).json({
                success: false,
                message: "Your account is inactive. Please contact your company administrator.",
            });
            return;
        }
        req.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            companyId: user.companyId,
            companyName: user.company.name,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
        next();
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=authenticate.js.map