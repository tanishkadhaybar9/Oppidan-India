import prisma from "../lib/prisma.js";
import { UserStatus } from "../generated/prisma/client.js";
export class ShiftService {
    /**
     * List all shifts for a company.
     */
    static async listShifts(companyId, query) {
        const where = { companyId };
        if (query.status)
            where.status = query.status;
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: "insensitive" } },
                { code: { contains: query.search, mode: "insensitive" } },
            ];
        }
        return prisma.shift.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: { assignments: true },
                },
            },
        });
    }
    /**
     * Get single shift by ID with company scoping.
     */
    static async getShiftById(companyId, shiftId) {
        const shift = await prisma.shift.findFirst({
            where: { id: shiftId, companyId },
            include: {
                _count: {
                    select: { assignments: true, attendances: true },
                },
            },
        });
        if (!shift) {
            const err = new Error("Shift not found.");
            err.statusCode = 404;
            err.code = "NOT_FOUND";
            throw err;
        }
        return shift;
    }
    /**
     * Create a new shift scoped to company.
     */
    static async createShift(companyId, input) {
        // Check duplicate code within company
        const existing = await prisma.shift.findFirst({
            where: { companyId, code: input.code },
        });
        if (existing) {
            const err = new Error(`Shift code '${input.code}' already exists in this company.`);
            err.statusCode = 409;
            err.code = "CONFLICT";
            throw err;
        }
        // Auto-detect overnight shift if not explicitly provided
        const isOvernight = input.isOvernight !== undefined
            ? input.isOvernight
            : input.startTime > input.endTime;
        return prisma.shift.create({
            data: {
                companyId,
                name: input.name,
                code: input.code,
                startTime: input.startTime,
                endTime: input.endTime,
                breakDurationMinutes: input.breakDurationMinutes,
                gracePeriodMinutes: input.gracePeriodMinutes,
                workingDays: input.workingDays,
                timezone: input.timezone,
                isOvernight,
                status: UserStatus.ACTIVE,
            },
        });
    }
    /**
     * Update an existing shift.
     */
    static async updateShift(companyId, shiftId, input) {
        const current = await prisma.shift.findFirst({
            where: { id: shiftId, companyId },
        });
        if (!current) {
            const err = new Error("Shift not found.");
            err.statusCode = 404;
            err.code = "NOT_FOUND";
            throw err;
        }
        // If code changed, check uniqueness
        if (input.code && input.code !== current.code) {
            const duplicate = await prisma.shift.findFirst({
                where: { companyId, code: input.code, NOT: { id: shiftId } },
            });
            if (duplicate) {
                const err = new Error(`Shift code '${input.code}' already exists in this company.`);
                err.statusCode = 409;
                err.code = "CONFLICT";
                throw err;
            }
        }
        let isOvernight = input.isOvernight;
        if (isOvernight === undefined && (input.startTime || input.endTime)) {
            const start = input.startTime ?? current.startTime;
            const end = input.endTime ?? current.endTime;
            isOvernight = start > end;
        }
        return prisma.shift.update({
            where: { id: shiftId },
            data: {
                ...(input.name && { name: input.name }),
                ...(input.code && { code: input.code }),
                ...(input.startTime && { startTime: input.startTime }),
                ...(input.endTime && { endTime: input.endTime }),
                ...(input.breakDurationMinutes !== undefined && { breakDurationMinutes: input.breakDurationMinutes }),
                ...(input.gracePeriodMinutes !== undefined && { gracePeriodMinutes: input.gracePeriodMinutes }),
                ...(input.workingDays && { workingDays: input.workingDays }),
                ...(input.timezone && { timezone: input.timezone }),
                ...(isOvernight !== undefined && { isOvernight }),
            },
        });
    }
    /**
     * Deactivate a shift (preserves attendance history).
     */
    static async deactivateShift(companyId, shiftId) {
        const current = await prisma.shift.findFirst({
            where: { id: shiftId, companyId },
        });
        if (!current) {
            const err = new Error("Shift not found.");
            err.statusCode = 404;
            err.code = "NOT_FOUND";
            throw err;
        }
        if (current.status === UserStatus.INACTIVE) {
            const err = new Error("Shift is already inactive.");
            err.statusCode = 409;
            err.code = "CONFLICT";
            throw err;
        }
        return prisma.shift.update({
            where: { id: shiftId },
            data: { status: UserStatus.INACTIVE },
        });
    }
}
//# sourceMappingURL=shift.service.js.map