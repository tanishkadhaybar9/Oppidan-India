import { apiClient } from "./api";
import type { ApiResponse } from "../types/auth";
import type {
  Asset,
  AssetSummaryStats,
  PaginatedAssets,
  PaginatedMaintenance,
  AssetMaintenance,
  AssetAssignment,
  CreateAssetPayload,
  UpdateAssetPayload,
  AssignAssetPayload,
  ReturnAssetPayload,
  TransferAssetPayload,
  CreateMaintenancePayload,
  UpdateMaintenancePayload,
  ListAssetsParams,
  ListMaintenanceParams,
} from "../types/asset";

// ─── Asset Summary / Dashboard ────────────────────────────────────────────────

export async function getAssetSummary(): Promise<ApiResponse<AssetSummaryStats>> {
  return apiClient<AssetSummaryStats>("/api/assets/summary");
}

// ─── Personal (Employee's Own) Assets ─────────────────────────────────────────

export async function getMyAssets(): Promise<
  ApiResponse<{ currentAssets: Asset[]; history: AssetAssignment[] }>
> {
  return apiClient<{ currentAssets: Asset[]; history: AssetAssignment[] }>("/api/assets/my");
}

// ─── Asset Inventory CRUD ──────────────────────────────────────────────────────

export async function listAssets(
  params: ListAssetsParams = {}
): Promise<ApiResponse<PaginatedAssets>> {
  const sp = new URLSearchParams();
  if (params.search) sp.set("search", params.search);
  if (params.category) sp.set("category", params.category);
  if (params.condition) sp.set("condition", params.condition);
  if (params.status) sp.set("status", params.status);
  if (params.isAvailable !== undefined) sp.set("isAvailable", String(params.isAvailable));
  if (params.employeeId) sp.set("employeeId", params.employeeId);
  if (params.page) sp.set("page", String(params.page));
  if (params.limit) sp.set("limit", String(params.limit));
  const qs = sp.toString();
  return apiClient<PaginatedAssets>(`/api/assets${qs ? `?${qs}` : ""}`);
}

export async function getAsset(id: string): Promise<ApiResponse<{ asset: Asset }>> {
  return apiClient<{ asset: Asset }>(`/api/assets/${id}`);
}

export async function createAsset(
  data: CreateAssetPayload
): Promise<ApiResponse<Asset>> {
  return apiClient<Asset>("/api/assets", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAsset(
  id: string,
  data: UpdateAssetPayload
): Promise<ApiResponse<{ asset: Asset }>> {
  return apiClient<{ asset: Asset }>(`/api/assets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteAsset(id: string): Promise<ApiResponse<void>> {
  return apiClient<void>(`/api/assets/${id}`, { method: "DELETE" });
}

// ─── Allocation Workflows ──────────────────────────────────────────────────────

export async function assignAsset(
  id: string,
  data: AssignAssetPayload
): Promise<ApiResponse<{ asset: Asset; assignment: AssetAssignment }>> {
  return apiClient<{ asset: Asset; assignment: AssetAssignment }>(
    `/api/assets/${id}/assign`,
    { method: "POST", body: JSON.stringify(data) }
  );
}

export async function returnAsset(
  id: string,
  data: ReturnAssetPayload
): Promise<ApiResponse<Asset>> {
  return apiClient<Asset>(`/api/assets/${id}/return`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function transferAsset(
  id: string,
  data: TransferAssetPayload
): Promise<ApiResponse<{ asset: Asset; assignment: AssetAssignment }>> {
  return apiClient<{ asset: Asset; assignment: AssetAssignment }>(
    `/api/assets/${id}/transfer`,
    { method: "POST", body: JSON.stringify(data) }
  );
}

// ─── Maintenance Tickets ───────────────────────────────────────────────────────

export async function listMaintenance(
  params: ListMaintenanceParams = {}
): Promise<ApiResponse<PaginatedMaintenance>> {
  const sp = new URLSearchParams();
  if (params.search) sp.set("search", params.search);
  if (params.status) sp.set("status", params.status);
  if (params.priority) sp.set("priority", params.priority);
  if (params.assetId) sp.set("assetId", params.assetId);
  if (params.page) sp.set("page", String(params.page));
  if (params.limit) sp.set("limit", String(params.limit));
  const qs = sp.toString();
  return apiClient<PaginatedMaintenance>(`/api/assets/maintenance${qs ? `?${qs}` : ""}`);
}

export async function getMaintenance(ticketId: string): Promise<ApiResponse<{ ticket: AssetMaintenance }>> {
  return apiClient<{ ticket: AssetMaintenance }>(`/api/assets/maintenance/${ticketId}`);
}

export async function createMaintenance(
  data: CreateMaintenancePayload
): Promise<ApiResponse<AssetMaintenance>> {
  return apiClient<AssetMaintenance>("/api/assets/maintenance", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateMaintenance(
  ticketId: string,
  data: UpdateMaintenancePayload
): Promise<ApiResponse<AssetMaintenance>> {
  return apiClient<AssetMaintenance>(`/api/assets/maintenance/${ticketId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
