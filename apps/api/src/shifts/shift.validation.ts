import { z } from "zod";
import { UserStatus } from "../generated/prisma/client.js";

const timeFormatRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createShiftSchema = z.object({
  name: z.string().min(2, "Shift name must be at least 2 characters").max(100),
  code: z
    .string()
    .min(2, "Shift code must be at least 2 characters")
    .max(30)
    .transform((val) => val.toUpperCase().trim()),
  startTime: z.string().regex(timeFormatRegex, "Start time must be in HH:mm 24-hour format (e.g. 09:00)"),
  endTime: z.string().regex(timeFormatRegex, "End time must be in HH:mm 24-hour format (e.g. 18:00)"),
  breakDurationMinutes: z.number().int().min(0).max(300).default(60),
  gracePeriodMinutes: z.number().int().min(0).max(120).default(10),
  workingDays: z
    .array(z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]))
    .min(1, "Select at least one working day")
    .default(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]),
  timezone: z.string().default("Asia/Kolkata"),
  isOvernight: z.boolean().optional(),
});

export const updateShiftSchema = createShiftSchema.partial();

export const listShiftsQuerySchema = z.object({
  status: z.nativeEnum(UserStatus).optional(),
  search: z.string().optional(),
});

export type CreateShiftInput = z.infer<typeof createShiftSchema>;
export type UpdateShiftInput = z.infer<typeof updateShiftSchema>;
export type ListShiftsQuery = z.infer<typeof listShiftsQuerySchema>;
