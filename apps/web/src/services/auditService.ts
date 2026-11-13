import { apiClient } from "./api";
import type { ApiResponse } from "../types/auth";
import type { PaginatedAuditLogs, AuditStats } from "../types/audit";

export interface ListAuditLogsParams {
  page?: number;
  limit?: number;
  module?: string;
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export async function listAuditLogs(
  params?: ListAuditLogsParams
): Promise<ApiResponse<PaginatedAuditLogs>> {
  const query = new URLSearchParams();
  if (params?.page) query.append("page", String(params.page));
  if (params?.limit) query.append("limit", String(params.limit));
  if (params?.module) query.append("module", params.module);
  if (params?.action) query.append("action", params.action);
  if (params?.userId) query.append("userId", params.userId);
  if (params?.startDate) query.append("startDate", params.startDate);
  if (params?.endDate) query.append("endDate", params.endDate);
  if (params?.search) query.append("search", params.search);

  const qs = query.toString();
  return apiClient<PaginatedAuditLogs>(`/api/audit-logs${qs ? `?${qs}` : ""}`);
}

export async function getAuditStats(): Promise<ApiResponse<AuditStats>> {
  return apiClient<AuditStats>("/api/audit-logs/stats");
}
