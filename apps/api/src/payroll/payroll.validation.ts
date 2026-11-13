import { z } from "zod";
import { SalaryFrequency, PayrollStatus, UserStatus } from "./payroll.types.js";

export const createSalaryStructureSchema = z.object({
  employeeId: z.string().uuid("Invalid employee ID"),
  basicSalary: z.number().min(0, "Basic salary must be non-negative"),
  hra: z.number().min(0).optional().default(0),
  conveyance: z.number().min(0).optional().default(0),
  medical: z.number().min(0).optional().default(0),
  special: z.number().min(0).optional().default(0),
  otherAllowances: z.number().min(0).optional().default(0),
  pfDeduction: z.number().min(0).optional().default(0),
  ptDeduction: z.number().min(0).optional().default(0),
  tdsDeduction: z.number().min(0).optional().default(0),
  otherDeductions: z.number().min(0).optional().default(0),
  frequency: z.nativeEnum(SalaryFrequency).optional().default(SalaryFrequency.MONTHLY),
  effectiveDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  notes: z.string().max(500).optional(),
});

export const updateSalaryStructureSchema = z.object({
  basicSalary: z.number().min(0).optional(),
  hra: z.number().min(0).optional(),
  conveyance: z.number().min(0).optional(),
  medical: z.number().min(0).optional(),
  special: z.number().min(0).optional(),
  otherAllowances: z.number().min(0).optional(),
  pfDeduction: z.number().min(0).optional(),
  ptDeduction: z.number().min(0).optional(),
  tdsDeduction: z.number().min(0).optional(),
  otherDeductions: z.number().min(0).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  frequency: z.nativeEnum(SalaryFrequency).optional(),
  effectiveDate: z.string().optional(),
  notes: z.string().max(500).optional(),
  reason: z.string().max(500).optional(),
});

export const previewPayrollQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2035),
  departmentId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
});

export const processPayrollSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2035),
  departmentId: z.string().uuid().optional(),
  employeeIds: z.array(z.string().uuid()).optional(),
  paymentMethod: z.string().optional().default("BANK_TRANSFER"),
  remarks: z.string().max(500).optional(),
});

export const updatePayrollStatusSchema = z.object({
  status: z.nativeEnum(PayrollStatus),
  paymentDate: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentReference: z.string().max(100).optional(),
  remarks: z.string().max(500).optional(),
});

export const listSalaryStructuresQuerySchema = z.object({
  search: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  status: z.nativeEnum(UserStatus).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const listPayrollsQuerySchema = z.object({
  search: z.string().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2035).optional(),
  departmentId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  status: z.nativeEnum(PayrollStatus).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateSalaryStructureInput = z.infer<typeof createSalaryStructureSchema>;
export type UpdateSalaryStructureInput = z.infer<typeof updateSalaryStructureSchema>;
export type PreviewPayrollQuery = z.infer<typeof previewPayrollQuerySchema>;
export type ProcessPayrollInput = z.infer<typeof processPayrollSchema>;
export type UpdatePayrollStatusInput = z.infer<typeof updatePayrollStatusSchema>;
export type ListSalaryStructuresQuery = z.infer<typeof listSalaryStructuresQuerySchema>;
export type ListPayrollsQuery = z.infer<typeof listPayrollsQuerySchema>;

