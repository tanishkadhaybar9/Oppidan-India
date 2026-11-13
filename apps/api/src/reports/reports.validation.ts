import { z } from "zod";

export const reportFilterQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  status: z.string().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2035).optional(),
  limit: z.coerce.number().int().positive().max(1000).default(200),
});

export type ReportFilterQuery = z.infer<typeof reportFilterQuerySchema>;

