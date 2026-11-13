import { apiClient } from "./api";
import type { ApiResponse } from "../types/auth";
import type {
  PaginatedUsers,
  UserItem,
  CreateUserPayload,
  UpdateUserPayload,
  UserRole,
  UserStatus,
} from "../types/users";

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}

export async function listUsers(params?: ListUsersParams): Promise<ApiResponse<PaginatedUsers>> {
  const query = new URLSearchParams();
  if (params?.page) query.append("page", String(params.page));
  if (params?.limit) query.append("limit", String(params.limit));
  if (params?.search) query.append("search", params.search);
  if (params?.role) query.append("role", params.role);
  if (params?.status) query.append("status", params.status);

  const qs = query.toString();
  return apiClient<PaginatedUsers>(`/api/users${qs ? `?${qs}` : ""}`);
}

export async function getUserById(id: string): Promise<ApiResponse<UserItem>> {
  return apiClient<UserItem>(`/api/users/${id}`);
}

export async function createUser(data: CreateUserPayload): Promise<ApiResponse<UserItem>> {
  return apiClient<UserItem>("/api/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateUser(
  id: string,
  data: UpdateUserPayload
): Promise<ApiResponse<UserItem>> {
  return apiClient<UserItem>(`/api/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function updateUserStatus(
  id: string,
  status: UserStatus
): Promise<ApiResponse<UserItem>> {
  return apiClient<UserItem>(`/api/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function getRolesMatrix(): Promise<
  ApiResponse<{
    roles: string[];
    matrix: Record<string, string[]>;
  }>
> {
  return apiClient<{
    roles: string[];
    matrix: Record<string, string[]>;
  }>("/api/users/roles/matrix");
}
