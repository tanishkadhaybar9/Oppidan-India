export interface UpdateOrganizationPayload {
  name?: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface UpdateWorkingHoursPayload {
  workingDays?: string[];
  workStartTime?: string;
  workEndTime?: string;
}

export interface UpdateAttendanceSettingsPayload {
  timezone?: string;
  gracePeriodMinutes?: number;
  defaultBreakMinutes?: number;
  isBreakPaid?: boolean;
  weeklyOvertimeThresholdHours?: number;
  halfDayThresholdMinutes?: number;
  fullDayThresholdMinutes?: number;
  allowRemoteClockIn?: boolean;
  requireLocation?: boolean;
}

export interface UpdateLeaveSettingsPayload {
  leaveYearStart?: string;
  allowCarryForward?: boolean;
  maxCarryForwardDays?: number;
  requireDocumentProofDays?: number;
  maxConsecutiveDays?: number;
}

export interface UpdateSystemPreferencesPayload {
  timezone?: string;
  dateFormat?: string;
  timeFormat?: string;
  currency?: string;
}

