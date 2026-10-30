import {
  AssetCategory,
  AssetStatus,
  AssetCondition,
  AssetAssignmentStatus,
  MaintenancePriority,
  MaintenanceStatus,
} from "../generated/prisma/client.js";

export {
  AssetCategory,
  AssetStatus,
  AssetCondition,
  AssetAssignmentStatus,
  MaintenancePriority,
  MaintenanceStatus,
};

export interface AssetSummaryStats {
  total: number;
  available: number;
  assigned: number;
  underMaintenance: number;
  retired: number;
  disposed: number;
}
