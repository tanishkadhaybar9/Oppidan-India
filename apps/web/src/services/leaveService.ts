import { apiClient } from "./api";
import type { ApiResponse } from "../types/auth";
import type {
  LeaveType,
  LeaveBalance,
  Holiday,
  LeaveRequest,
  LeaveRequestsResponse,
  Notification,
  CreateLeaveRequestPayload,
  ReviewLeaveRequestPayload,
} from "../types/leave";

// ── Leave Types ───────────────────────────────────────────────────────────────

export async function listLeaveTypes(includeInactive = false): Promise<ApiResponse<LeaveType[]>> {
  const q = includeInactive ? "?includeInactive=true" : "";
  return apiClient<LeaveType[]>(`/api/leave/types${q}`);
}

export async function createLeaveType(data: Partial<LeaveType>): Promise<ApiResponse<{ leaveType: LeaveType }>> {
  return apiClient<{ leaveType: LeaveType }>("/api/leave/types", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateLeaveType(id: string, data: Partial<LeaveType>): Promise<ApiResponse<{ leaveType: LeaveType }>> {
  return apiClient<{ leaveType: LeaveType }>(`/api/leave/types/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ── Holidays ──────────────────────────────────────────────────────────────────

export async function listHolidays(year?: number): Promise<ApiResponse<Holiday[]>> {
  const q = year ? `?year=${year}` : "";
  return apiClient<Holiday[]>(`/api/leave/holidays${q}`);
}

export async function createHoliday(data: Partial<Holiday>): Promise<ApiResponse<{ holiday: Holiday }>> {
  return apiClient<{ holiday: Holiday }>("/api/leave/holidays", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateHoliday(id: string, data: Partial<Holiday>): Promise<ApiResponse<{ holiday: Holiday }>> {
  return apiClient<{ holiday: Holiday }>(`/api/leave/holidays/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteHoliday(id: string): Promise<ApiResponse<void>> {
  return apiClient<void>(`/api/leave/holidays/${id}`, { method: "DELETE" });
}

// ── Leave Balances ────────────────────────────────────────────────────────────

export async function getMyLeaveBalances(): Promise<ApiResponse<LeaveBalance[]>> {
  return apiClient<LeaveBalance[]>("/api/leave/balances/me");
}

export async function getEmployeeLeaveBalances(employeeId: string): Promise<ApiResponse<LeaveBalance[]>> {
  return apiClient<LeaveBalance[]>(`/api/leave/balances/${employeeId}`);
}

export async function allocateLeaveBalance(data: {
  employeeId: string;
  leaveTypeId: string;
  periodStart: string;
  periodEnd: string;
  allocatedDays: number;
  carriedForwardDays?: number;
  adjustedDays?: number;
}): Promise<ApiResponse<LeaveBalance>> {
  return apiClient<LeaveBalance>("/api/leave/balances", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Leave Requests ────────────────────────────────────────────────────────────

export async function listLeaveRequests(params?: {
  status?: string;
  startDate?: string;
  endDate?: string;
  leaveTypeId?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<LeaveRequestsResponse>> {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.startDate) q.set("startDate", params.startDate);
  if (params?.endDate) q.set("endDate", params.endDate);
  if (params?.leaveTypeId) q.set("leaveTypeId", params.leaveTypeId);
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  const qs = q.toString() ? `?${q.toString()}` : "";
  return apiClient<LeaveRequestsResponse>(`/api/leave/requests${qs}`);
}

export async function getLeaveRequest(id: string): Promise<ApiResponse<LeaveRequest>> {
  return apiClient<LeaveRequest>(`/api/leave/requests/${id}`);
}

export async function createLeaveRequest(data: CreateLeaveRequestPayload): Promise<ApiResponse<LeaveRequest>> {
  return apiClient<LeaveRequest>("/api/leave/requests", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function reviewLeaveRequest(id: string, data: ReviewLeaveRequestPayload): Promise<ApiResponse<LeaveRequest>> {
  return apiClient<LeaveRequest>(`/api/leave/requests/${id}/review`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function cancelLeaveRequest(id: string, cancellationReason: string): Promise<ApiResponse<void>> {
  return apiClient<void>(`/api/leave/requests/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({ cancellationReason }),
  });
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function listNotifications(unreadOnly = false): Promise<ApiResponse<Notification[]>> {
  return apiClient<Notification[]>(`/api/leave/notifications${unreadOnly ? "?unreadOnly=true" : ""}`);
}

export async function getUnreadNotificationCount(): Promise<ApiResponse<{ count: number }>> {
  return apiClient<{ count: number }>("/api/leave/notifications/unread-count");
}

export async function markNotificationRead(id: string): Promise<ApiResponse<Notification>> {
  return apiClient<Notification>(`/api/leave/notifications/${id}/read`, { method: "PATCH" });
}

export async function markAllNotificationsRead(): Promise<ApiResponse<void>> {
  return apiClient<void>("/api/leave/notifications/mark-all-read", { method: "PATCH" });
}
