import { apiClient } from "./api";
import type { ApiResponse } from "../types/auth";
import type {
  CompanySettingsResponse,
  OrganizationProfile,
  WorkingHoursSettings,
  AttendanceSettings,
  LeaveSettings,
  SystemPreferences,
} from "../types/settings";

export async function getSettings(): Promise<ApiResponse<CompanySettingsResponse>> {
  return apiClient<CompanySettingsResponse>("/api/settings");
}

export async function updateOrganizationProfile(
  data: Partial<OrganizationProfile>
): Promise<ApiResponse<OrganizationProfile>> {
  return apiClient<OrganizationProfile>("/api/settings/organization", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function updateWorkingHours(
  data: Partial<WorkingHoursSettings>
): Promise<ApiResponse<WorkingHoursSettings>> {
  return apiClient<WorkingHoursSettings>("/api/settings/working-hours", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function updateAttendanceSettings(
  data: Partial<AttendanceSettings>
): Promise<ApiResponse<AttendanceSettings>> {
  return apiClient<AttendanceSettings>("/api/settings/attendance", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function updateLeaveSettings(
  data: Partial<LeaveSettings>
): Promise<ApiResponse<LeaveSettings>> {
  return apiClient<LeaveSettings>("/api/settings/leave", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function updateSystemPreferences(
  data: Partial<SystemPreferences>
): Promise<ApiResponse<SystemPreferences>> {
  return apiClient<SystemPreferences>("/api/settings/preferences", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
