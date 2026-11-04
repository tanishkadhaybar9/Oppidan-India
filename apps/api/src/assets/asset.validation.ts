import { z } from "zod";
import { uuidSchema } from "../utils/validation.js";

const assetCategoryEnum = z.enum([
  "LAPTOP",
  "DESKTOP",
  "MOBILE",
  "TABLET",
  "PERIPHERAL",
  "FURNITURE",
  "NETWORKING",
  "VEHICLE",
  "OTHER",
]);

const assetStatusEnum = z.enum([
  "AVAILABLE",
  "ASSIGNED",
  "UNDER_MAINTENANCE",
  "RETIRED",
  "DISPOSED",
]);

const assetConditionEnum = z.enum([
  "NEW",
  "EXCELLENT",
  "GOOD",
  "FAIR",
  "POOR",
  "DAMAGED",
]);

const maintenancePriorityEnum = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

const maintenanceStatusEnum = z.enum([
  "OPEN",
  "IN_PROGRESS",
  "WAITING_PARTS",
  "COMPLETED",
  "CANCELLED",
]);

export const createAssetSchema = z.object({
  assetCode: z
    .string()
    .min(2, "Asset code must be at least 2 characters")
    .max(50, "Asset code cannot exceed 50 characters")
    .trim(),
  name: z
    .string()
    .min(2, "Asset name must be at least 2 characters")
    .max(100, "Asset name cannot exceed 100 characters")
    .trim(),
  description: z.string().max(1000).optional().nullable(),
  category: assetCategoryEnum.default("LAPTOP"),
  brand: z.string().max(100).optional().nullable(),
  model: z.string().max(100).optional().nullable(),
  serialNumber: z.string().max(100).optional().nullable(),
  purchaseDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  purchaseCost: z.number().min(0, "Purchase cost cannot be negative").optional().nullable(),
  warrantyExpiry: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  warrantyDetails: z.string().max(500).optional().nullable(),
  vendor: z.string().max(100).optional().nullable(),
  condition: assetConditionEnum.default("EXCELLENT"),
  status: assetStatusEnum.default("AVAILABLE"),
});

export const updateAssetSchema = createAssetSchema.partial();

export const listAssetsQuerySchema = z.object({
  search: z.string().optional(),
  category: assetCategoryEnum.optional(),
  condition: assetConditionEnum.optional(),
  status: assetStatusEnum.optional(),
  isAvailable: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  employeeId: z.string().optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10) || 1) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10) || 10)) : 10)),
});

export const assignAssetSchema = z.object({
  employeeId: uuidSchema("Valid employee ID required"),
  conditionAtAssignment: assetConditionEnum.optional(),
  notes: z.string().max(500).optional().nullable(),
});

export const returnAssetSchema = z.object({
  conditionAtReturn: assetConditionEnum.optional(),
  returnNotes: z.string().max(500).optional().nullable(),
  markMaintenance: z.boolean().optional().default(false),
  maintenanceDescription: z.string().max(1000).optional().nullable(),
});

export const transferAssetSchema = z.object({
  targetEmployeeId: uuidSchema("Valid target employee ID required"),
  notes: z.string().max(500).optional().nullable(),
  conditionAtTransfer: assetConditionEnum.optional(),
});

export const createMaintenanceSchema = z.object({
  assetId: uuidSchema("Valid asset ID required"),
  issueDescription: z
    .string()
    .min(3, "Issue description must be at least 3 characters")
    .max(1000),
  priority: maintenancePriorityEnum.default("MEDIUM"),
  assignedTechnician: z.string().max(100).optional().nullable(),
  vendor: z.string().max(100).optional().nullable(),
  cost: z.number().min(0, "Cost cannot be negative").optional().nullable(),
});

export const updateMaintenanceSchema = z.object({
  status: maintenanceStatusEnum.optional(),
  priority: maintenancePriorityEnum.optional(),
  issueDescription: z.string().min(3).max(1000).optional(),
  assignedTechnician: z.string().max(100).optional().nullable(),
  vendor: z.string().max(100).optional().nullable(),
  cost: z.number().min(0).optional().nullable(),
  resolutionNotes: z.string().max(1000).optional().nullable(),
  completedDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
});

export const listMaintenanceQuerySchema = z.object({
  search: z.string().optional(),
  status: maintenanceStatusEnum.optional(),
  priority: maintenancePriorityEnum.optional(),
  assetId: z.string().optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10) || 1) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10) || 10)) : 10)),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type ListAssetsQuery = z.infer<typeof listAssetsQuerySchema>;
export type AssignAssetInput = z.infer<typeof assignAssetSchema>;
export type ReturnAssetInput = z.infer<typeof returnAssetSchema>;
export type TransferAssetInput = z.infer<typeof transferAssetSchema>;
export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;
export type ListMaintenanceQuery = z.infer<typeof listMaintenanceQuerySchema>;
