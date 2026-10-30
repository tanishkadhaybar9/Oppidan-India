export type AssetCategory =
  | "LAPTOP"
  | "DESKTOP"
  | "MOBILE"
  | "TABLET"
  | "PERIPHERAL"
  | "FURNITURE"
  | "NETWORKING"
  | "VEHICLE"
  | "OTHER";

export type AssetStatus =
  | "AVAILABLE"
  | "ASSIGNED"
  | "UNDER_MAINTENANCE"
  | "RETIRED"
  | "DISPOSED";

export type AssetCondition =
  | "NEW"
  | "EXCELLENT"
  | "GOOD"
  | "FAIR"
  | "POOR"
  | "DAMAGED";

export type AssetAssignmentStatus = "ACTIVE" | "RETURNED" | "TRANSFERRED";
export type MaintenancePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type MaintenanceStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_PARTS"
  | "COMPLETED"
  | "CANCELLED";

export interface EmployeeBrief {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  department?: { id: string; name: string } | null;
  designation?: { id: string; name: string } | null;
}

export interface AssetAssignment {
  id: string;
  assetId: string;
  employeeId: string;
  employee: EmployeeBrief;
  assignedDate: string;
  returnDate?: string | null;
  status: AssetAssignmentStatus;
  conditionAtAssignment?: AssetCondition | null;
  conditionAtReturn?: AssetCondition | null;
  notes?: string | null;
  returnNotes?: string | null;
  assignedBy?: { id: string; name: string; email: string } | null;
  returnedBy?: { id: string; name: string; email: string } | null;
  createdAt: string;
}

export interface AssetMaintenance {
  id: string;
  assetId: string;
  ticketNumber: string;
  issueDescription: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  reportedDate: string;
  assignedTechnician?: string | null;
  vendor?: string | null;
  cost?: number | null;
  resolutionNotes?: string | null;
  completedDate?: string | null;
  createdBy?: { id: string; name: string; email: string } | null;
  asset?: {
    id: string;
    assetCode: string;
    name: string;
    category: AssetCategory;
    status: AssetStatus;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  assetCode: string;
  name: string;
  description?: string | null;
  category: AssetCategory;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  purchaseDate?: string | null;
  purchaseCost?: number | null;
  warrantyExpiry?: string | null;
  warrantyDetails?: string | null;
  vendor?: string | null;
  condition: AssetCondition;
  status: AssetStatus;
  companyId: string;
  assignedEmployeeId?: string | null;
  assignedEmployee?: EmployeeBrief | null;
  assignments?: AssetAssignment[];
  maintenanceTickets?: AssetMaintenance[];
  _count?: {
    assignments: number;
    maintenanceTickets: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AssetSummaryStats {
  total: number;
  available: number;
  assigned: number;
  underMaintenance: number;
  retired: number;
  disposed: number;
}

export interface PaginatedAssets {
  assets: Asset[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface PaginatedMaintenance {
  tickets: AssetMaintenance[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CreateAssetPayload {
  assetCode: string;
  name: string;
  description?: string;
  category?: AssetCategory;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  warrantyExpiry?: string;
  warrantyDetails?: string;
  vendor?: string;
  condition?: AssetCondition;
  status?: AssetStatus;
}

export interface UpdateAssetPayload extends Partial<CreateAssetPayload> {}

export interface AssignAssetPayload {
  employeeId: string;
  conditionAtAssignment?: AssetCondition;
  notes?: string;
}

export interface ReturnAssetPayload {
  conditionAtReturn?: AssetCondition;
  returnNotes?: string;
  markMaintenance?: boolean;
  maintenanceDescription?: string;
}

export interface TransferAssetPayload {
  targetEmployeeId: string;
  notes?: string;
  conditionAtTransfer?: AssetCondition;
}

export interface CreateMaintenancePayload {
  assetId: string;
  issueDescription: string;
  priority?: MaintenancePriority;
  assignedTechnician?: string;
  vendor?: string;
  cost?: number;
}

export interface UpdateMaintenancePayload {
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
  issueDescription?: string;
  assignedTechnician?: string;
  vendor?: string;
  cost?: number;
  resolutionNotes?: string;
  completedDate?: string;
}

export interface ListAssetsParams {
  search?: string;
  category?: AssetCategory;
  condition?: AssetCondition;
  status?: AssetStatus;
  isAvailable?: boolean;
  employeeId?: string;
  page?: number;
  limit?: number;
}

export interface ListMaintenanceParams {
  search?: string;
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
  assetId?: string;
  page?: number;
  limit?: number;
}
