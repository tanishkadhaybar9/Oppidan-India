import { z } from "zod";

const optionalUuid = z
  .union([z.string().uuid(), z.literal("")])
  .transform((val) => (val === "" ? undefined : val))
  .optional();

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
  employeeId: optionalUuid,
  shiftId: optionalUuid,
});

export type CreateShiftAssignmentInput = z.infer<typeof createShiftAssignmentSchema>;
export type UpdateShiftAssignmentInput = z.infer<typeof updateShiftAssignmentSchema>;
export type ListShiftAssignmentsQuery = z.infer<typeof listShiftAssignmentsQuerySchema>;
