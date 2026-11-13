import { apiClient } from "./api";
import type { ApiResponse } from "../types/auth";
import type {
  ReportsDashboardStats,
  EmployeeReportData,
  AttendanceReportData,
  LeaveReportData,
  AssetReportData,
  PayrollReportData,
  TaskReportData,
  ReportFilterParams,
} from "../types/reports";

function buildQs(params?: ReportFilterParams): string {
  if (!params) return "";
  const sp = new URLSearchParams();
  if (params.startDate) sp.set("startDate", params.startDate);
  if (params.endDate) sp.set("endDate", params.endDate);
  if (params.departmentId) sp.set("departmentId", params.departmentId);
  if (params.employeeId) sp.set("employeeId", params.employeeId);
  if (params.status) sp.set("status", params.status);
  if (params.month) sp.set("month", String(params.month));
  if (params.year) sp.set("year", String(params.year));
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export async function getReportsDashboard(): Promise<ApiResponse<ReportsDashboardStats>> {
  return apiClient<ReportsDashboardStats>("/api/reports/dashboard");
}

export async function getEmployeeReport(
  params?: ReportFilterParams
): Promise<ApiResponse<EmployeeReportData>> {
  return apiClient<EmployeeReportData>(`/api/reports/employees${buildQs(params)}`);
}

export async function getAttendanceReport(
  params?: ReportFilterParams
): Promise<ApiResponse<AttendanceReportData>> {
  return apiClient<AttendanceReportData>(`/api/reports/attendance${buildQs(params)}`);
}

export async function getLeaveReport(
  params?: ReportFilterParams
): Promise<ApiResponse<LeaveReportData>> {
  return apiClient<LeaveReportData>(`/api/reports/leaves${buildQs(params)}`);
}

export async function getAssetReport(
  params?: ReportFilterParams
): Promise<ApiResponse<AssetReportData>> {
  return apiClient<AssetReportData>(`/api/reports/assets${buildQs(params)}`);
}

export async function getPayrollReport(
  params?: ReportFilterParams
): Promise<ApiResponse<PayrollReportData>> {
  return apiClient<PayrollReportData>(`/api/reports/payroll${buildQs(params)}`);
}

export async function getTaskReport(
  params?: ReportFilterParams
): Promise<ApiResponse<TaskReportData>> {
  return apiClient<TaskReportData>(`/api/reports/tasks${buildQs(params)}`);
}
