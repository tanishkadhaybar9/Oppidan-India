import { z } from "zod";
export const createEmployeeSchema = z.object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    employeeCode: z.string().min(1).max(40),
    departmentId: z.string().uuid().optional(),
    designationId: z.string().uuid().optional(),
    supervisorId: z.string().uuid().optional(),
    joiningDate: z.string().datetime().optional(),
});
export const updateEmployeeSchema = z.object({
    name: z.string().min(2).max(120).optional(),
    email: z.string().email().optional(),
    departmentId: z.string().uuid().nullable().optional(),
    designationId: z.string().uuid().nullable().optional(),
    supervisorId: z.string().uuid().nullable().optional(),
});
export const deactivateEmployeeSchema = z.object({
    reason: z.string().min(1).max(500).optional(),
});
export const listEmployeesQuerySchema = z.object({
    status: z.enum(["ACTIVE", "INACTIVE", "PROBATION", "SUSPENDED", "TERMINATED"]).optional(),
    departmentId: z.string().uuid().optional(),
    designationId: z.string().uuid().optional(),
    search: z.string().max(100).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});
//# sourceMappingURL=employee.validation.js.map