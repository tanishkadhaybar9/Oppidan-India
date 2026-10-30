import { z } from "zod";
import { UserStatus } from "../generated/prisma/client.js";

export const createDesignationSchema = z.object({
  name: z
    .string()
    .min(1, "Designation name is required")
    .trim()
    .min(2, "Designation name must be at least 2 characters")
    .max(100, "Designation name cannot exceed 100 characters"),
  description: z.string().trim().max(255).optional(),
});

export const updateDesignationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Designation name must be at least 2 characters")
    .max(100, "Designation name cannot exceed 100 characters")
    .optional(),
  description: z.string().trim().max(255).optional(),
  status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE]).optional(),
});

export type CreateDesignationInput = z.infer<typeof createDesignationSchema>;
export type UpdateDesignationInput = z.infer<typeof updateDesignationSchema>;
