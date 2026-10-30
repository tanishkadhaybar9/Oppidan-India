import { z } from "zod";
export const createShiftAssignmentSchema = z.object({
    employeeId: z.string().uuid("Invalid employee ID"),
    shiftId: z.string().uuid("Invalid shift ID"),
    effectiveFrom: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    effectiveTo: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
});
export const updateShiftAssignmentSchema = z.object({
    effectiveTo: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
});
export const listShiftAssignmentsQuerySchema = z.object({
    employeeId: z.string().uuid().optional(),
    shiftId: z.string().uuid().optional(),
});
//# sourceMappingURL=shiftAssignment.validation.js.map