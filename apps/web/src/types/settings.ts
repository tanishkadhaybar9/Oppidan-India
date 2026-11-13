export interface OrganizationProfile {
  id: string;
  name: string;
  logoUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkingHoursSettings {
  workingDays: string[];
  workStartTime: string;
  workEndTime: string;
}

export interface AttendanceSettings {
  id?: string;
  companyId?: string;
  timezone: string;
  gracePeriodMinutes: number;
  defaultBreakMinutes: number;
  isBreakPaid: boolean;
  workingDays: string[];
  weeklyOvertimeThresholdHours: number;
  halfDayThresholdMinutes: number;
  fullDayThresholdMinutes: number;
  allowRemoteClockIn: boolean;
  requireLocation: boolean;
}

export interface LeaveSettings {
  id?: string;
  companyId?: string;
  leaveYearStart: string;
  allowCarryForward: boolean;
  maxCarryForwardDays: number;
  requireDocumentProofDays: number;
  maxConsecutiveDays: number;
}

export interface SystemPreferences {
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
}

export interface CompanySettingsResponse {
  organization: OrganizationProfile;
  workingHours: WorkingHoursSettings;
  attendance: AttendanceSettings;
  leave: LeaveSettings;
  preferences: SystemPreferences;
}

