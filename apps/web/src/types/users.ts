export type UserRole = "OWNER" | "HR" | "MANAGER" | "SUPERVISOR" | "EMPLOYEE";
export type UserStatus = "ACTIVE" | "INACTIVE";

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  companyId: string;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    employeeCode: string;
    name: string;
    department?: { id: string; name: string } | null;
    designation?: { id: string; name: string } | null;
  } | null;
}

export interface PaginatedUsers {
  users: UserItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  employeeId?: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  status?: UserStatus;
  employeeId?: string;
}

