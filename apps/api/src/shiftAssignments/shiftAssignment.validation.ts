import { z } from "zod";
import { uuidSchema, optionalUuid } from "../utils/validation.js";

export const createShiftAssignmentSchema = z.object({
  employeeId: uuidSchema("Invalid employee ID"),
  shiftId: uuidSchema("Invalid shift ID"),
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
