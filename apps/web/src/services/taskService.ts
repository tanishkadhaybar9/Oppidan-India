import { apiClient } from "./api";
import type { ApiResponse } from "../types/auth";
import type {
  Task,
  TaskSummaryStats,
  TaskAnalytics,
  PaginatedTasks,
  CreateTaskPayload,
  UpdateTaskPayload,
  AssignTaskPayload,
  UpdateProgressPayload,
  SubmitReviewPayload,
  ReviewTaskPayload,
  AddCommentPayload,
  ListTasksParams,
  TaskComment,
} from "../types/task";

export async function getTaskSummary(params?: {
  departmentId?: string;
  employeeId?: string;
}): Promise<ApiResponse<TaskSummaryStats>> {
  const sp = new URLSearchParams();
  if (params?.departmentId) sp.set("departmentId", params.departmentId);
  if (params?.employeeId) sp.set("employeeId", params.employeeId);
  const qs = sp.toString();
  return apiClient<TaskSummaryStats>(`/api/tasks/summary${qs ? `?${qs}` : ""}`);
}

export async function getTaskAnalytics(params?: {
  departmentId?: string;
  employeeId?: string;
}): Promise<ApiResponse<TaskAnalytics>> {
  const sp = new URLSearchParams();
  if (params?.departmentId) sp.set("departmentId", params.departmentId);
  if (params?.employeeId) sp.set("employeeId", params.employeeId);
  const qs = sp.toString();
  return apiClient<TaskAnalytics>(`/api/tasks/analytics${qs ? `?${qs}` : ""}`);
}

export async function listTasks(params: ListTasksParams = {}): Promise<ApiResponse<PaginatedTasks>> {
  const sp = new URLSearchParams();
  if (params.search) sp.set("search", params.search);
  if (params.status) sp.set("status", params.status);
  if (params.priority) sp.set("priority", params.priority);
  if (params.category) sp.set("category", params.category);
  if (params.departmentId) sp.set("departmentId", params.departmentId);
  if (params.assignedEmployeeId) sp.set("assignedEmployeeId", params.assignedEmployeeId);
  if (params.createdById) sp.set("createdById", params.createdById);
  if (params.isOverdue !== undefined) sp.set("isOverdue", String(params.isOverdue));
  if (params.startDate) sp.set("startDate", params.startDate);
  if (params.dueDate) sp.set("dueDate", params.dueDate);
  if (params.sortBy) sp.set("sortBy", params.sortBy);
  if (params.sortOrder) sp.set("sortOrder", params.sortOrder);
  if (params.page) sp.set("page", String(params.page));
  if (params.limit) sp.set("limit", String(params.limit));
  const qs = sp.toString();
  return apiClient<PaginatedTasks>(`/api/tasks${qs ? `?${qs}` : ""}`);
}

export async function getMyTasks(params: ListTasksParams = {}): Promise<ApiResponse<PaginatedTasks>> {
  const sp = new URLSearchParams();
  if (params.search) sp.set("search", params.search);
  if (params.status) sp.set("status", params.status);
  if (params.priority) sp.set("priority", params.priority);
  if (params.category) sp.set("category", params.category);
  if (params.isOverdue !== undefined) sp.set("isOverdue", String(params.isOverdue));
  if (params.sortBy) sp.set("sortBy", params.sortBy);
  if (params.sortOrder) sp.set("sortOrder", params.sortOrder);
  if (params.page) sp.set("page", String(params.page));
  if (params.limit) sp.set("limit", String(params.limit));
  const qs = sp.toString();
  return apiClient<PaginatedTasks>(`/api/tasks/my${qs ? `?${qs}` : ""}`);
}

export async function getTask(id: string): Promise<ApiResponse<Task>> {
  return apiClient<Task>(`/api/tasks/${id}`);
}

export async function createTask(data: CreateTaskPayload): Promise<ApiResponse<Task>> {
  return apiClient<Task>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTask(id: string, data: UpdateTaskPayload): Promise<ApiResponse<Task>> {
  return apiClient<Task>(`/api/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteTask(id: string): Promise<ApiResponse<{ message: string }>> {
  return apiClient<{ message: string }>(`/api/tasks/${id}`, {
    method: "DELETE",
  });
}

export async function assignTask(id: string, data: AssignTaskPayload): Promise<ApiResponse<Task>> {
  return apiClient<Task>(`/api/tasks/${id}/assign`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTaskProgress(
  id: string,
  data: UpdateProgressPayload
): Promise<ApiResponse<Task>> {
  return apiClient<Task>(`/api/tasks/${id}/progress`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function submitTaskForReview(
  id: string,
  data: SubmitReviewPayload = {}
): Promise<ApiResponse<Task>> {
  return apiClient<Task>(`/api/tasks/${id}/submit-review`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function reviewTask(id: string, data: ReviewTaskPayload): Promise<ApiResponse<Task>> {
  return apiClient<Task>(`/api/tasks/${id}/review`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function addTaskComment(
  id: string,
  data: AddCommentPayload
): Promise<ApiResponse<TaskComment>> {
  return apiClient<TaskComment>(`/api/tasks/${id}/comments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

