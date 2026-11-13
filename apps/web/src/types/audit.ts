export interface AuditLogItem {
  id: string;
  companyId: string;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  action: string;
  module: string;
  recordId?: string | null;
  description: string;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

export interface PaginatedAuditLogs {
  logs: AuditLogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditStats {
  totalLogs: number;
  byModule: Array<{ module: string; count: number }>;
  byAction: Array<{ action: string; count: number }>;
  recentCount24h: number;
}

