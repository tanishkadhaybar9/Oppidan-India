import { apiClient } from "./api";
import type {
  PaginatedEmployees,
  EmployeeDetail,
  EmployeeSummary,
  CreateEmployeePayload,
  UpdateEmployeePayload,
  HistoryEntry,
  Department,
  Designation,
} from "../types/employee";
import type { ApiResponse } from "../types/auth";

// ── Employees ─────────────────────────────────────────────────────────────────

export interface ListEmployeesParams {
  status?: string;
  departmentId?: string;
  designationId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function listEmployees(
  params: ListEmployeesParams = {}
): Promise<ApiResponse<PaginatedEmployees>> {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);
  if (params.departmentId) searchParams.set("departmentId", params.departmentId);
  if (params.designationId) searchParams.set("designationId", params.designationId);
  if (params.search) searchParams.set("search", params.search);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));

  const qs = searchParams.toString();
  return apiClient<PaginatedEmployees>(`/api/employees${qs ? `?${qs}` : ""}`);
}

export async function getEmployee(id: string): Promise<ApiResponse<{ employee: EmployeeDetail }>> {
  return apiClient<{ employee: EmployeeDetail }>(`/api/employees/${id}`);
}

export async function createEmployee(
  data: CreateEmployeePayload
): Promise<ApiResponse<{ employee: EmployeeDetail }>> {
  return apiClient<{ employee: EmployeeDetail }>("/api/employees", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateEmployee(
  id: string,
  data: UpdateEmployeePayload
): Promise<ApiResponse<{ employee: EmployeeDetail }>> {
  return apiClient<{ employee: EmployeeDetail }>(`/api/employees/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deactivateEmployee(
  id: string,
  reason?: string
): Promise<ApiResponse<{ employee: EmployeeDetail }>> {
  return apiClient<{ employee: EmployeeDetail }>(`/api/employees/${id}/deactivate`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export async function getEmployeeHistory(
  id: string
): Promise<ApiResponse<{ history: HistoryEntry[] }>> {
  return apiClient<{ history: HistoryEntry[] }>(`/api/employees/${id}/history`);
}

export interface SupervisorHierarchyResponse {
  supervisors: Array<{
    id: string;
    employeeCode: string;
    name: string;
    email: string;
    department?: { id: string; name: string } | null;
    designation?: { id: string; name: string } | null;
    subordinates: Array<{
      id: string;
      name: string;
      employeeCode: string;
      email: string;
      department?: { id: string; name: string } | null;
      designation?: { id: string; name: string } | null;
    }>;
  }>;
  allEmployees: EmployeeSummary[];
  totalSupervisors: number;
  totalEmployees: number;
  unassignedCount: number;
}

export async function getSupervisorsHierarchy(): Promise<ApiResponse<SupervisorHierarchyResponse>> {
  return apiClient<SupervisorHierarchyResponse>("/api/employees/supervisors/hierarchy");
}


// ── Departments ───────────────────────────────────────────────────────────────

export async function listDepartments(status?: string): Promise<ApiResponse<{ departments: Department[] }>> {
  const qs = status ? `?status=${status}` : "";
  return apiClient<{ departments: Department[] }>(`/api/departments${qs}`);
}

export async function getDepartment(id: string): Promise<ApiResponse<{ department: Department }>> {
  return apiClient<{ department: Department }>(`/api/departments/${id}`);
}

export async function createDepartment(
  name: string
): Promise<ApiResponse<{ department: Department }>> {
  return apiClient<{ department: Department }>("/api/departments", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function updateDepartment(
  id: string,
  data: { name?: string; status?: "ACTIVE" | "INACTIVE" }
): Promise<ApiResponse<{ department: Department }>> {
  return apiClient<{ department: Department }>(`/api/departments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ── Designations ──────────────────────────────────────────────────────────────

export async function listDesignations(status?: string): Promise<ApiResponse<{ designations: Designation[] }>> {
  const qs = status ? `?status=${status}` : "";
  return apiClient<{ designations: Designation[] }>(`/api/designations${qs}`);
}

export async function getDesignation(id: string): Promise<ApiResponse<{ designation: Designation }>> {
  return apiClient<{ designation: Designation }>(`/api/designations/${id}`);
}

export async function createDesignation(
  name: string,
  description?: string
): Promise<ApiResponse<{ designation: Designation }>> {
  return apiClient<{ designation: Designation }>("/api/designations", {
    method: "POST",
    body: JSON.stringify({ name, description }),
  });
}

export async function updateDesignation(
  id: string,
  data: { name?: string; description?: string; status?: "ACTIVE" | "INACTIVE" }
): Promise<ApiResponse<{ designation: Designation }>> {
  return apiClient<{ designation: Designation }>(`/api/designations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
