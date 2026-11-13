export interface CreateAuditLogParams {
  companyId: string;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  action: string; // LOGIN, LOGOUT, CREATE, UPDATE, DELETE, APPROVE, REJECT, ASSIGN, STATUS_CHANGE
  module: string; // AUTH, EMPLOYEE, DEPARTMENT, DESIGNATION, ATTENDANCE, LEAVE, ASSET, TASK, PAYROLL, SETTINGS, USER
  recordId?: string | null;
  description: string;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface ListAuditLogsQuery {
  page?: number;
  limit?: number;
  search?: string;
  module?: string;
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface AuditLogStats {
  totalLogs: number;
  byModule: Array<{ module: string; count: number }>;
  byAction: Array<{ action: string; count: number }>;
  recentCount24h: number;
}

