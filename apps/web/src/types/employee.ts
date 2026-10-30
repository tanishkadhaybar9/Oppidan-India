export type EmploymentStatus = "ACTIVE" | "INACTIVE" | "PROBATION" | "SUSPENDED" | "TERMINATED";

export interface Department {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  _count?: { employees: number };
  employees?: Array<{
    id: string;
    name: string;
    email: string;
    employeeCode: string;
    status: EmploymentStatus;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Designation {
  id: string;
  name: string;
  description?: string;
  status: "ACTIVE" | "INACTIVE";
  _count?: { employees: number };
  employees?: Array<{
    id: string;
    name: string;
    email: string;
    employeeCode: string;
    status: EmploymentStatus;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeSummary {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  status: EmploymentStatus;
  joiningDate: string;
  deactivatedAt?: string | null;
  createdAt: string;
  department?: { id: string; name: string } | null;
  designation?: { id: string; name: string } | null;
  supervisor?: { id: string; name: string; employeeCode: string } | null;
}

export interface HistoryEntry {
  id: string;
  eventType: string;
  previousValue?: string | null;
  newValue?: string | null;
  effectiveDate: string;
  reason?: string | null;
  changedBy?: { id: string; name: string } | null;
}

export interface EmployeeDetail extends EmployeeSummary {
  subordinates: Array<{ id: string; name: string; employeeCode: string }>;
  history: HistoryEntry[];
}

export interface PaginatedEmployees {
  employees: EmployeeSummary[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateEmployeePayload {
  name: string;
  email: string;
  employeeCode: string;
  departmentId?: string;
  designationId?: string;
  supervisorId?: string;
  joiningDate?: string;
}

export interface UpdateEmployeePayload {
  name?: string;
  email?: string;
  departmentId?: string | null;
  designationId?: string | null;
  supervisorId?: string | null;
}
