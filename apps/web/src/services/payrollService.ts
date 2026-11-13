import { apiClient } from "./api";
import type { ApiResponse } from "../types/auth";
import type {
  PayrollSummaryStats,
  PayrollAnalytics,
  PayrollPreviewItem,
  SalaryStructure,
  Payroll,
  Payslip,
  CreateSalaryStructurePayload,
  UpdateSalaryStructurePayload,
  ProcessPayrollPayload,
} from "../types/payroll";

export async function getPayrollSummary(params?: {
  month?: number;
  year?: number;
  departmentId?: string;
}): Promise<ApiResponse<PayrollSummaryStats>> {
  const sp = new URLSearchParams();
  if (params?.month) sp.set("month", String(params.month));
  if (params?.year) sp.set("year", String(params.year));
  if (params?.departmentId) sp.set("departmentId", params.departmentId);
  const qs = sp.toString();
  return apiClient<PayrollSummaryStats>(`/api/payroll/summary${qs ? `?${qs}` : ""}`);
}

export async function getPayrollAnalytics(): Promise<ApiResponse<PayrollAnalytics>> {
  return apiClient<PayrollAnalytics>("/api/payroll/analytics");
}

export async function listSalaryStructures(params?: {
  search?: string;
  departmentId?: string;
  status?: string;
}): Promise<ApiResponse<{ salaryStructures: SalaryStructure[]; total: number }>> {
  const sp = new URLSearchParams();
  if (params?.search) sp.set("search", params.search);
  if (params?.departmentId) sp.set("departmentId", params.departmentId);
  if (params?.status) sp.set("status", params.status);
  const qs = sp.toString();
  return apiClient<{ salaryStructures: SalaryStructure[]; total: number }>(
    `/api/payroll/salary-structures${qs ? `?${qs}` : ""}`
  );
}

export async function getSalaryStructureByEmployee(
  employeeId: string
): Promise<ApiResponse<SalaryStructure | null>> {
  return apiClient<SalaryStructure | null>(`/api/payroll/salary-structures/employee/${employeeId}`);
}

export async function createSalaryStructure(
  data: CreateSalaryStructurePayload
): Promise<ApiResponse<SalaryStructure>> {
  return apiClient<SalaryStructure>("/api/payroll/salary-structures", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateSalaryStructure(
  id: string,
  data: UpdateSalaryStructurePayload
): Promise<ApiResponse<SalaryStructure>> {
  return apiClient<SalaryStructure>(`/api/payroll/salary-structures/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function previewPayroll(params: {
  month: number;
  year: number;
  departmentId?: string;
}): Promise<ApiResponse<{ items: PayrollPreviewItem[]; month: number; year: number; departmentId?: string }>> {
  const sp = new URLSearchParams();
  sp.set("month", String(params.month));
  sp.set("year", String(params.year));
  if (params.departmentId) sp.set("departmentId", params.departmentId);
  return apiClient<{ items: PayrollPreviewItem[]; month: number; year: number; departmentId?: string }>(
    `/api/payroll/preview?${sp.toString()}`
  );
}

export async function processPayroll(
  data: ProcessPayrollPayload
): Promise<ApiResponse<{ processed: number; payrolls: Payroll[] }>> {
  return apiClient<{ processed: number; payrolls: Payroll[] }>("/api/payroll/process", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listPayrolls(params?: {
  month?: number;
  year?: number;
  departmentId?: string;
  employeeId?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{ payrolls: Payroll[]; total: number; page: number; limit: number }>> {
  const sp = new URLSearchParams();
  if (params?.month) sp.set("month", String(params.month));
  if (params?.year) sp.set("year", String(params.year));
  if (params?.departmentId) sp.set("departmentId", params.departmentId);
  if (params?.employeeId) sp.set("employeeId", params.employeeId);
  if (params?.status) sp.set("status", params.status);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.limit) sp.set("limit", String(params.limit));
  const qs = sp.toString();
  return apiClient<{ payrolls: Payroll[]; total: number; page: number; limit: number }>(
    `/api/payroll${qs ? `?${qs}` : ""}`
  );
}

export async function getMyPayrolls(): Promise<ApiResponse<{ payrolls: Payroll[] }>> {
  return apiClient<{ payrolls: Payroll[] }>("/api/payroll/my");
}

export async function getMyPayslips(): Promise<ApiResponse<{ payslips: Payslip[] }>> {
  return apiClient<{ payslips: Payslip[] }>("/api/payroll/payslips/my");
}

export async function getPayrollById(id: string): Promise<ApiResponse<Payroll>> {
  return apiClient<Payroll>(`/api/payroll/${id}`);
}

export async function updatePayrollStatus(
  id: string,
  status: string,
  data?: { paymentMethod?: string; notes?: string }
): Promise<ApiResponse<Payroll>> {
  return apiClient<Payroll>(`/api/payroll/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, ...data }),
  });
}
