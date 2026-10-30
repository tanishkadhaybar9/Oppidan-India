import { apiClient } from "./api";
import type { ApiResponse } from "../types/auth";
import type {
  Shift,
  ShiftAssignment,
  AttendanceRecord,
  AttendanceCorrection,
  DailyAttendanceResponse,
  WeeklyReportResponse,
  CreateShiftPayload,
  CreateShiftAssignmentPayload,
  CorrectionStatus,
} from "../types/attendance";

// ── Shifts ────────────────────────────────────────────────────────────────────

export async function listShifts(status?: string): Promise<ApiResponse<{ shifts: Shift[] }>> {
  const query = status ? `?status=${status}` : "";
  return apiClient<{ shifts: Shift[] }>(`/api/shifts${query}`);
}

export async function createShift(data: CreateShiftPayload): Promise<ApiResponse<{ shift: Shift }>> {
  return apiClient<{ shift: Shift }>("/api/shifts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateShift(
  id: string,
  data: Partial<CreateShiftPayload>
): Promise<ApiResponse<{ shift: Shift }>> {
  return apiClient<{ shift: Shift }>(`/api/shifts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deactivateShift(id: string): Promise<ApiResponse<{ shift: Shift }>> {
  return apiClient<{ shift: Shift }>(`/api/shifts/${id}/deactivate`, {
    method: "PATCH",
  });
}

// ── Shift Assignments ─────────────────────────────────────────────────────────

export async function listShiftAssignments(
  params: { employeeId?: string; shiftId?: string } = {}
): Promise<ApiResponse<{ assignments: ShiftAssignment[] }>> {
  const qs = new URLSearchParams();
  if (params.employeeId) qs.set("employeeId", params.employeeId);
  if (params.shiftId) qs.set("shiftId", params.shiftId);
  const qStr = qs.toString();
  return apiClient<{ assignments: ShiftAssignment[] }>(`/api/shift-assignments${qStr ? `?${qStr}` : ""}`);
}

export async function createShiftAssignment(
  data: CreateShiftAssignmentPayload
): Promise<ApiResponse<{ assignment: ShiftAssignment }>> {
  return apiClient<{ assignment: ShiftAssignment }>("/api/shift-assignments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getEmployeeShift(
  employeeId: string
): Promise<ApiResponse<{ assignment: ShiftAssignment | null }>> {
  return apiClient<{ assignment: ShiftAssignment | null }>(`/api/shift-assignments/employee/${employeeId}`);
}

// ── Personal Attendance (Clock-In / Clock-Out) ────────────────────────────────

export async function clockIn(notes?: string): Promise<ApiResponse<{ attendance: AttendanceRecord }>> {
  return apiClient<{ attendance: AttendanceRecord }>("/api/attendance/clock-in", {
    method: "POST",
    body: JSON.stringify({ notes }),
  });
}

export async function clockOut(notes?: string): Promise<ApiResponse<{ attendance: AttendanceRecord }>> {
  return apiClient<{ attendance: AttendanceRecord }>("/api/attendance/clock-out", {
    method: "POST",
    body: JSON.stringify({ notes }),
  });
}

export async function getTodayAttendance(): Promise<ApiResponse<{ attendance: AttendanceRecord | null }>> {
  return apiClient<{ attendance: AttendanceRecord | null }>("/api/attendance/me/today");
}

export async function getMyAttendanceHistory(
  params: { month?: string; page?: number; limit?: number } = {}
): Promise<ApiResponse<{ attendances: AttendanceRecord[]; pagination: any }>> {
  const qs = new URLSearchParams();
  if (params.month) qs.set("month", params.month);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const qStr = qs.toString();
  return apiClient<{ attendances: AttendanceRecord[]; pagination: any }>(
    `/api/attendance/me/history${qStr ? `?${qStr}` : ""}`
  );
}

// ── Daily Attendance Log & Corrections (HR/Admin) ────────────────────────────

export interface DailyAttendanceFilters {
  date?: string;
  departmentId?: string;
  shiftId?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getDailyAttendance(
  filters: DailyAttendanceFilters = {}
): Promise<ApiResponse<DailyAttendanceResponse>> {
  const qs = new URLSearchParams();
  if (filters.date) qs.set("date", filters.date);
  if (filters.departmentId) qs.set("departmentId", filters.departmentId);
  if (filters.shiftId) qs.set("shiftId", filters.shiftId);
  if (filters.status) qs.set("status", filters.status);
  if (filters.search) qs.set("search", filters.search);
  if (filters.page) qs.set("page", String(filters.page));
  if (filters.limit) qs.set("limit", String(filters.limit));
  const qStr = qs.toString();
  return apiClient<DailyAttendanceResponse>(`/api/attendance/daily${qStr ? `?${qStr}` : ""}`);
}

export async function requestCorrection(
  attendanceId: string,
  data: { correctedClockIn: string; correctedClockOut?: string | null; reason: string }
): Promise<ApiResponse<{ correction: AttendanceCorrection }>> {
  return apiClient<{ correction: AttendanceCorrection }>(`/api/attendance/${attendanceId}/correction-request`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listCorrectionRequests(
  status?: CorrectionStatus
): Promise<ApiResponse<{ corrections: AttendanceCorrection[] }>> {
  const q = status ? `?status=${status}` : "";
  return apiClient<{ corrections: AttendanceCorrection[] }>(`/api/attendance/correction-requests${q}`);
}

export async function reviewCorrection(
  correctionId: string,
  data: { status: "APPROVED" | "REJECTED"; reviewNotes?: string }
): Promise<ApiResponse<{ correction: AttendanceCorrection }>> {
  return apiClient<{ correction: AttendanceCorrection }>(
    `/api/attendance/correction-requests/${correctionId}/review`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}

export async function hrDirectCorrection(
  attendanceId: string,
  data: { correctedClockIn: string; correctedClockOut?: string | null; reason: string }
): Promise<ApiResponse<{ attendance: AttendanceRecord }>> {
  return apiClient<{ attendance: AttendanceRecord }>(`/api/attendance/${attendanceId}/correct`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ── Weekly Reports & CSV Export ──────────────────────────────────────────────

export async function getWeeklyReport(params: {
  startDate: string;
  endDate: string;
  departmentId?: string;
  shiftId?: string;
  employeeId?: string;
}): Promise<ApiResponse<WeeklyReportResponse>> {
  const qs = new URLSearchParams(params as any);
  return apiClient<WeeklyReportResponse>(`/api/attendance/reports/weekly?${qs.toString()}`);
}

export function getExportCsvUrl(params: {
  startDate: string;
  endDate: string;
  departmentId?: string;
  shiftId?: string;
  employeeId?: string;
}): string {
  const qs = new URLSearchParams(params as any);
  return `/api/attendance/reports/weekly/export?${qs.toString()}`;
}
