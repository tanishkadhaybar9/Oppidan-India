export type LeaveStatus =
  | "PENDING_SUPERVISOR"
  | "PENDING_MANAGER"
  | "PENDING_HR"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type HolidayType = "PUBLIC" | "OPTIONAL" | "COMPANY";
export type LeaveTypeStatus = "ACTIVE" | "INACTIVE";

export interface LeaveType {
  id: string;
  companyId: string;
  name: string;
  code: string;
  description?: string;
  paid: boolean;
  requiresApproval: boolean;
  maximumDays: number;
  defaultDaysPerYear?: number;
  minimumNoticeDays: number;
  allowHalfDay: boolean;
  allowCarryForward: boolean;
  maxCarryForwardDays?: number;
  maxConsecutiveDays?: number;
  allowNegativeBalance: boolean;
  status: LeaveTypeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalance {
  id: string;
  companyId: string;
  employeeId: string;
  leaveTypeId: string;
  leaveType: Pick<LeaveType, "name" | "code" | "paid">;
  periodStart: string;
  periodEnd: string;
  allocatedDays: number;
  usedDays: number;
  pendingDays: number;
  carriedForwardDays: number;
  adjustedDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface Holiday {
  id: string;
  companyId: string;
  name: string;
  date: string;
  description?: string;
  holidayType: HolidayType;
  type?: HolidayType;
  status: LeaveTypeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveApprovalHistory {
  id: string;
  leaveRequestId: string;
  action: string;
  previousStatus?: string;
  newStatus: string;
  actorId: string;
  actorRole: string;
  comments?: string;
  createdAt: string;
}

export interface LeaveRequest {
  id: string;
  companyId: string;
  employeeId: string;
  employee: { id: string; name: string; employeeCode: string };
  leaveTypeId: string;
  leaveType: Pick<LeaveType, "id" | "name" | "code" | "paid">;
  startDate: string;
  endDate: string;
  startHalfDay: boolean;
  endHalfDay: boolean;
  days: number;
  reason: string;
  status: LeaveStatus;
  currentStage: string;
  rejectionReason?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  approvalHistory: LeaveApprovalHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  companyId: string;
  userId: string;
  title: string;
  message: string;
  link?: string;
  type: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface CreateLeaveRequestPayload {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  startHalfDay?: boolean;
  endHalfDay?: boolean;
  reason: string;
}

export interface ReviewLeaveRequestPayload {
  action: "APPROVE" | "REJECT";
  comments?: string;
  rejectionReason?: string;
}

export interface LeaveRequestsResponse {
  requests: LeaveRequest[];
  total: number;
  page: number;
  totalPages: number;
}
