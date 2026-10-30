export type AttendanceStatus =
  | "PRESENT"
  | "LATE"
  | "HALF_DAY"
  | "ABSENT"
  | "ON_LEAVE"
  | "HOLIDAY"
  | "WEEKEND"
  | "NOT_CLOCKED_OUT";

export type CorrectionStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Shift {
  id: string;
  name: string;
  code: string;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  breakDurationMinutes: number;
  gracePeriodMinutes: number;
  workingDays: string[];
  timezone: string;
  isOvernight: boolean;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
  _count?: {
    assignments: number;
    attendances?: number;
  };
}

export interface ShiftAssignment {
  id: string;
  companyId: string;
  employeeId: string;
  shiftId: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  shift: Shift;
  employee: {
    id: string;
    name: string;
    employeeCode: string;
    department?: { id: string; name: string } | null;
  };
  assignedBy?: { id: string; name: string } | null;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  attendanceDate: string;
  clockIn?: string | null;
  clockOut?: string | null;
  status: AttendanceStatus;
  lateMinutes: number;
  earlyDepartureMinutes: number;
  workedMinutes: number;
  breakMinutes: number;
  overtimeMinutes: number;
  shift?: Shift | null;
  employee?: {
    id: string;
    name: string;
    employeeCode: string;
    department?: { id: string; name: string } | null;
    designation?: { id: string; name: string } | null;
  };
  corrections?: AttendanceCorrection[];
  createdAt: string;
}

export interface AttendanceCorrection {
  id: string;
  attendanceId: string;
  previousClockIn?: string | null;
  previousClockOut?: string | null;
  correctedClockIn?: string | null;
  correctedClockOut?: string | null;
  reason: string;
  status: CorrectionStatus;
  requestedBy?: { id: string; name: string; email: string };
  approvedBy?: { id: string; name: string };
  createdAt: string;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  attendance?: AttendanceRecord;
}

export interface DailyAttendanceResponse {
  date: string;
  summary: {
    present: number;
    late: number;
    halfDay: number;
    absent: number;
    notClockedOut: number;
  };
  attendances: AttendanceRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface WeeklyEmployeeSummary {
  employee: {
    id: string;
    name: string;
    employeeCode: string;
    departmentName: string;
  };
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  halfDays: number;
  totalWorkedMinutes: number;
  totalOvertimeMinutes: number;
  totalEarlyDepartureMinutes: number;
  attendances: AttendanceRecord[];
}

export interface WeeklyReportResponse {
  startDate: string;
  endDate: string;
  report: WeeklyEmployeeSummary[];
}

export interface CreateShiftPayload {
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  breakDurationMinutes?: number;
  gracePeriodMinutes?: number;
  workingDays?: string[];
  timezone?: string;
  isOvernight?: boolean;
}

export interface CreateShiftAssignmentPayload {
  employeeId: string;
  shiftId: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
}
