import { apiClient } from "./api";
import type { ApiResponse } from "../types/auth";
import type { PaginatedNotifications, NotificationItem } from "../types/notifications";

export interface ListNotificationParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: string;
}

export async function listNotifications(
  params?: ListNotificationParams
): Promise<ApiResponse<PaginatedNotifications>> {
  const query = new URLSearchParams();
  if (params?.page) query.append("page", String(params.page));
  if (params?.limit) query.append("limit", String(params.limit));
  if (params?.unreadOnly !== undefined) query.append("unreadOnly", String(params.unreadOnly));
  if (params?.type) query.append("type", params.type);

  const qs = query.toString();
  return apiClient<PaginatedNotifications>(`/api/notifications${qs ? `?${qs}` : ""}`);
}

export async function getUnreadNotificationCount(): Promise<ApiResponse<{ count: number }>> {
  return apiClient<{ count: number }>("/api/notifications/unread-count");
}

export async function markNotificationRead(id: string): Promise<ApiResponse<NotificationItem>> {
  return apiClient<NotificationItem>(`/api/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsRead(): Promise<ApiResponse<{ count: number }>> {
  return apiClient<{ count: number }>("/api/notifications/mark-all-read", {
    method: "PATCH",
  });
}

export async function deleteNotification(id: string): Promise<ApiResponse<{ message: string }>> {
  return apiClient<{ message: string }>(`/api/notifications/${id}`, {
    method: "DELETE",
  });
}
