import { z } from "zod";
import { AttendanceStatus, CorrectionStatus } from "../generated/prisma/client.js";

export const clockInSchema = z.object({
  // regular employees clock in automatically using their authenticated user session
  // notes or geolocation can optionally be included
  notes: z.string().max(255).optional(),
});

export const clockOutSchema = z.object({
  notes: z.string().max(255).optional(),
});

export const listDailyAttendanceQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  departmentId: z.string().uuid().optional(),
  shiftId: z.string().uuid().optional(),
  status: z.nativeEnum(AttendanceStatus).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const myAttendanceQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format").optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(31),
});

export const correctionRequestSchema = z.object({
  correctedClockIn: z.string().datetime(),
  correctedClockOut: z.string().datetime().optional().nullable(),
  reason: z.string().min(5, "Reason must be at least 5 characters").max(500),
});

export const reviewCorrectionSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewNotes: z.string().max(500).optional(),
});

export const hrDirectCorrectionSchema = z.object({
  correctedClockIn: z.string().datetime(),
  correctedClockOut: z.string().datetime().optional().nullable(),
  reason: z.string().min(5, "Reason must be at least 5 characters").max(500),
});

export const weeklyReportQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "startDate must be YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "endDate must be YYYY-MM-DD"),
  departmentId: z.string().uuid().optional(),
  shiftId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
});

export type ClockInInput = z.infer<typeof clockInSchema>;
export type ClockOutInput = z.infer<typeof clockOutSchema>;
export type ListDailyAttendanceQuery = z.infer<typeof listDailyAttendanceQuerySchema>;
export type MyAttendanceQuery = z.infer<typeof myAttendanceQuerySchema>;
export type CorrectionRequestInput = z.infer<typeof correctionRequestSchema>;
export type ReviewCorrectionInput = z.infer<typeof reviewCorrectionSchema>;
export type HrDirectCorrectionInput = z.infer<typeof hrDirectCorrectionSchema>;
export type WeeklyReportQuery = z.infer<typeof weeklyReportQuerySchema>;
