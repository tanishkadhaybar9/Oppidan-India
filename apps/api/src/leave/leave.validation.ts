import { z } from "zod";
import { uuidSchema } from "../utils/validation.js";

export const createLeaveTypeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  code: z.string().min(2, "Code must be at least 2 characters").max(20).toUpperCase(),
  description: z.string().max(255).optional(),
  paid: z.boolean().default(true),
  requiresApproval: z.boolean().default(true),
  maximumDays: z.number().min(0.5, "Maximum days must be at least 0.5").max(365).default(30),
  minimumNoticeDays: z.number().int().min(0).default(1),
  allowHalfDay: z.boolean().default(true),
  allowCarryForward: z.boolean().default(false),
  allowNegativeBalance: z.boolean().default(false),
});

export const updateLeaveTypeSchema = createLeaveTypeSchema.partial().extend({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const createHolidaySchema = z.object({
  name: z.string().min(2, "Holiday name required").max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  description: z.string().max(255).optional(),
  holidayType: z.enum(["PUBLIC", "OPTIONAL", "COMPANY"]).default("PUBLIC"),
});

export const updateHolidaySchema = createHolidaySchema.partial().extend({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const allocateBalanceSchema = z.object({
  employeeId: uuidSchema("Valid employee ID required"),
  leaveTypeId: uuidSchema("Valid leave type ID required"),
  periodStart: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  periodEnd: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  allocatedDays: z.number().min(0, "Allocated days cannot be negative"),
  carriedForwardDays: z.number().min(0).default(0),
  adjustedDays: z.number().default(0),
});

export const createLeaveRequestSchema = z.object({
  leaveTypeId: uuidSchema("Valid leave type ID required"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be YYYY-MM-DD"),
  startHalfDay: z.boolean().default(false),
  endHalfDay: z.boolean().default(false),
  reason: z.string().min(3, "Reason must be at least 3 characters").max(500),
});

export const reviewLeaveRequestSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  comments: z.string().max(500).optional(),
  rejectionReason: z.string().max(500).optional(),
}).refine(
  (data) => data.action !== "REJECT" || (data.rejectionReason && data.rejectionReason.trim().length > 0),
  { message: "Rejection reason is mandatory when denying a leave request", path: ["rejectionReason"] }
);

export const cancelLeaveRequestSchema = z.object({
  cancellationReason: z.string().min(2, "Cancellation reason required").max(500),
});
