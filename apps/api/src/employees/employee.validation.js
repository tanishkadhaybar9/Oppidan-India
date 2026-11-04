import { z } from "zod";
const optionalUuid = z
    .union([z.string().uuid(), z.literal("")])
    .optional()
    .transform((val) => (val === "" || val === undefined ? undefined : val));
const nullableUuid = z
    .union([z.string().uuid(), z.literal(""), z.null()])
    .optional()
    .transform((val) => (val === "" || val === null || val === undefined ? null : val));
export const createEmployeeSchema = z.object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    employeeCode: z.string().min(1).max(40),
    departmentId: optionalUuid,
    designationId: optionalUuid,
    supervisorId: optionalUuid,
    joiningDate: z.string().optional(),
});
export const updateEmployeeSchema = z.object({
    name: z.string().min(2).max(120).optional(),
    email: z.string().email().optional(),
    departmentId: nullableUuid,
    designationId: nullableUuid,
    supervisorId: nullableUuid,
});
export const deactivateEmployeeSchema = z.object({
    reason: z.string().min(1).max(500).optional(),
});
export const listEmployeesQuerySchema = z.object({
    status: z.enum(["ACTIVE", "INACTIVE", "PROBATION", "SUSPENDED", "TERMINATED"]).optional(),
    departmentId: optionalUuid,
    designationId: optionalUuid,
    search: z.string().max(100).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(500).default(20),
});
//# sourceMappingURL=employee.validation.js.map