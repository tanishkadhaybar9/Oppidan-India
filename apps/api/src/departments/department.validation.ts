import { z } from "zod";
import { UserStatus } from "../generated/prisma/client.js";

export const createDepartmentSchema = z.object({
  name: z
    .string()
    .min(1, "Department name is required")
    .trim()
    .min(2, "Department name must be at least 2 characters")
    .max(100, "Department name cannot exceed 100 characters"),
});

export const updateDepartmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Department name must be at least 2 characters")
    .max(100, "Department name cannot exceed 100 characters")
    .optional(),
  status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE]).optional(),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
