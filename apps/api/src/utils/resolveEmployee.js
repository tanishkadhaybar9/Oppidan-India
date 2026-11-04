import prisma from "../lib/prisma.js";
import { EmploymentStatus } from "../generated/prisma/client.js";
/**
 * Resolves the linked Employee profile for a given user.
 * 1. Checks if user has a direct employee relation (userId).
 * 2. If not found, falls back to matching by email within the same company and links the userId.
 * 3. If still not found, auto-provisions an Employee profile for the user so that
 *    attendance, leaves, assets, and hierarchy never fail with 404.
 */
export async function resolveEmployeeForUser(companyId, userId, fallbackDetails) {
    const user = await prisma.user.findFirst({
        where: { id: userId, companyId },
        include: { employee: true },
    });
    if (!user && !fallbackDetails) {
        const err = new Error("User account not found.");
        err.statusCode = 404;
        err.code = "NOT_FOUND";
        throw err;
    }
    if (user?.employee) {
        return user.employee;
    }
    const emailToMatch = user?.email || fallbackDetails?.email;
    if (!emailToMatch) {
        const err = new Error("No employee profile found linked to this user account.");
        err.statusCode = 404;
        err.code = "NOT_FOUND";
        throw err;
    }
    // Fallback: match by email within same company
    let employee = await prisma.employee.findFirst({
        where: { email: emailToMatch, companyId },
    });
    if (employee) {
        // Permanently link userId if not already linked
        if (user && !employee.userId) {
            employee = await prisma.employee.update({
                where: { id: employee.id },
                data: { userId: user.id },
            });
        }
        return employee;
    }
    // Auto-provision an Employee record for the user so they can use the system seamlessly
    const employeeCode = `EMP-${userId.slice(-6).toUpperCase()}`;
    const name = user?.name || fallbackDetails?.name || "Staff Member";
    const role = user?.role || fallbackDetails?.role || "EMPLOYEE";
    employee = await prisma.employee.create({
        data: {
            companyId,
            userId: user?.id,
            name,
            email: emailToMatch,
            employeeCode,
            role: String(role),
            status: EmploymentStatus.ACTIVE,
            joiningDate: user?.createdAt || new Date(),
        },
    });
    return employee;
}
//# sourceMappingURL=resolveEmployee.js.map